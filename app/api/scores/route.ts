import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode, difficulty, score, totalShots, accuracy } = await req.json();

    if (!mode || !difficulty || score === undefined) {
      return NextResponse.json({ error: 'mode, difficulty, and score are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('aim-trainer');

    await db.collection('scores').insertOne({
      userId: (session.user as any).id,
      username: session.user.name,
      mode,
      difficulty,
      score,
      totalShots: totalShots ?? 0,
      accuracy: accuracy ?? null,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Score saved' }, { status: 201 });
  } catch (error) {
    console.error('Save score error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
