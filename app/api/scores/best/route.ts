import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const difficulty = searchParams.get('difficulty');

    if (!mode || !difficulty) {
      return NextResponse.json({ error: 'mode and difficulty required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('aim-trainer');

    const result = await db.collection('scores').aggregate([
      { $match: { userId: (session.user as any).id, mode, difficulty } },
      { $group: { _id: null, bestScore: { $max: '$score' } } },
    ]).toArray();

    return NextResponse.json({ bestScore: result[0]?.bestScore ?? null });
  } catch (error) {
    console.error('Best score error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
