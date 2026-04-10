import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const client = await clientPromise;
    const db = client.db('aim-trainer');

    // Per mode+difficulty breakdown
    const breakdown = await db.collection('scores').aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { mode: '$mode', difficulty: '$difficulty' },
          bestScore: { $max: '$score' },
          avgScore: { $avg: '$score' },
          totalGames: { $sum: 1 },
          bestAccuracy: { $max: '$accuracy' },
          lastPlayed: { $max: '$createdAt' },
        },
      },
      { $sort: { '_id.mode': 1, '_id.difficulty': 1 } },
    ]).toArray();

    // Score history per mode+difficulty (last 30 games each, chronological)
    const allScores = await db.collection('scores')
      .find({ userId })
      .sort({ createdAt: 1 })
      .toArray();

    const historyMap: Record<string, { score: number; accuracy: string | null; createdAt: string }[]> = {};
    for (const s of allScores) {
      const key = `${s.mode}|${s.difficulty}`;
      if (!historyMap[key]) historyMap[key] = [];
      historyMap[key].push({
        score: s.score,
        accuracy: s.accuracy ?? null,
        createdAt: s.createdAt,
      });
    }
    // Keep last 30 per combo
    for (const key of Object.keys(historyMap)) {
      if (historyMap[key].length > 30) {
        historyMap[key] = historyMap[key].slice(-30);
      }
    }

    // Recent 20 games
    const recentGames = await db.collection('scores')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    // Overall totals
    const overall = await db.collection('scores').aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalScore: { $sum: '$score' },
          firstGame: { $min: '$createdAt' },
        },
      },
    ]).toArray();

    return NextResponse.json({
      username: session.user.name,
      overall: overall[0] || { totalGames: 0, totalScore: 0, firstGame: null },
      breakdown: breakdown.map((b) => ({
        mode: b._id.mode,
        difficulty: b._id.difficulty,
        bestScore: b.bestScore,
        avgScore: Math.round(b.avgScore),
        totalGames: b.totalGames,
        bestAccuracy: b.bestAccuracy,
        lastPlayed: b.lastPlayed,
      })),
      history: Object.entries(historyMap).map(([key, scores]) => {
        const [mode, difficulty] = key.split('|');
        return { mode, difficulty, scores };
      }),
      recentGames: recentGames.map((g) => ({
        mode: g.mode,
        difficulty: g.difficulty,
        score: g.score,
        accuracy: g.accuracy,
        createdAt: g.createdAt,
      })),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
