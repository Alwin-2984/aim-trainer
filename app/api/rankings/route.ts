import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'flick';
    const difficulty = searchParams.get('difficulty') || 'medium';

    const client = await clientPromise;
    const db = client.db('aim-trainer');

    // Aggregate: group by user, take their best score for this mode+difficulty
    const rankings = await db.collection('scores').aggregate([
      { $match: { mode, difficulty } },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          bestScore: { $max: '$score' },
          bestAccuracy: { $max: '$accuracy' },
          totalGames: { $sum: 1 },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: 50 },
    ]).toArray();

    const result = rankings.map((r, i) => ({
      rank: i + 1,
      username: r.username,
      bestScore: r.bestScore,
      bestAccuracy: r.bestAccuracy,
      totalGames: r.totalGames,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Rankings error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
