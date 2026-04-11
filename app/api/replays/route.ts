import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// POST — upload a replay
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recording, mode, difficulty, score } = await req.json();

    if (!recording || !mode) {
      return NextResponse.json({ error: 'recording and mode are required' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const username = session.user.name;
    const timestamp = Date.now();
    const filename = `replays/${userId}/${mode}-${difficulty}-${timestamp}.json`;

    // Upload to Vercel Blob
    const blob = await put(filename, JSON.stringify(recording), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Save metadata to MongoDB
    const client = await clientPromise;
    const db = client.db('aim-trainer');

    const replayDoc = {
      userId,
      username,
      mode,
      difficulty: difficulty ?? 'medium',
      score: score ?? 0,
      frameCount: recording.frameCount ?? 0,
      duration: recording.duration ?? 0,
      blobUrl: blob.url,
      createdAt: new Date(),
    };

    const result = await db.collection('replays').insertOne(replayDoc);

    return NextResponse.json({
      id: result.insertedId.toString(),
      url: blob.url,
    }, { status: 201 });
  } catch (error) {
    console.error('Replay upload error:', error);
    return NextResponse.json({ error: 'Failed to upload replay' }, { status: 500 });
  }
}

// GET — list user's replays
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('aim-trainer');

    const replays = await db.collection('replays')
      .find({ userId: (session.user as any).id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json(replays.map((r) => ({
      id: r._id.toString(),
      mode: r.mode,
      difficulty: r.difficulty,
      score: r.score,
      frameCount: r.frameCount,
      duration: r.duration,
      blobUrl: r.blobUrl,
      createdAt: r.createdAt,
    })));
  } catch (error) {
    console.error('Replay list error:', error);
    return NextResponse.json({ error: 'Failed to fetch replays' }, { status: 500 });
  }
}
