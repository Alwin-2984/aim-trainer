import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid replay ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('aim-trainer');

    const replay = await db.collection('replays').findOne({ _id: new ObjectId(id) });

    if (!replay) {
      return NextResponse.json({ error: 'Replay not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: replay._id.toString(),
      username: replay.username,
      mode: replay.mode,
      difficulty: replay.difficulty,
      score: replay.score,
      frameCount: replay.frameCount,
      duration: replay.duration,
      blobUrl: replay.blobUrl,
      createdAt: replay.createdAt,
    });
  } catch (error) {
    console.error('Replay fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch replay' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid replay ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('aim-trainer');

    const replay = await db.collection('replays').findOne({ _id: new ObjectId(id) });
    if (!replay) {
      return NextResponse.json({ error: 'Replay not found' }, { status: 404 });
    }

    // Only the owner can delete
    if (replay.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from Vercel Blob
    try {
      await del(replay.blobUrl);
    } catch {
      // Blob might already be gone — continue
    }

    // Delete from MongoDB
    await db.collection('replays').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Replay deleted' });
  } catch (error) {
    console.error('Replay delete error:', error);
    return NextResponse.json({ error: 'Failed to delete replay' }, { status: 500 });
  }
}
