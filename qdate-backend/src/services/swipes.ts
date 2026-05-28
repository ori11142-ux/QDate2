import { Types } from 'mongoose';
import { SwipeDoc, SwipeModel } from '../models/Swipe';

export type RecordSwipeInput = {
  userId: string | Types.ObjectId;
  cardId: string;
  mode: 'interests' | 'looks';
  liked: boolean;
  responseTimeMs?: number;
};

export async function recordSwipe(input: RecordSwipeInput): Promise<SwipeDoc> {
  return SwipeModel.create({ ...input, swipedAt: new Date() });
}

export async function listSwipesForUser(
  userId: string | Types.ObjectId,
  mode?: 'interests' | 'looks',
  limit = 200
): Promise<SwipeDoc[]> {
  const query: Record<string, unknown> = { userId };
  if (mode) query.mode = mode;
  return SwipeModel.find(query).sort({ swipedAt: -1 }).limit(limit);
}

/**
 * Like-rate per mode — quick sanity check that a user has signal in both decks.
 * Returns { interests: 0.42, looks: 0.61 } etc., or null for a mode they haven't tried.
 */
export async function getLikeRates(
  userId: string | Types.ObjectId
): Promise<{ interests: number | null; looks: number | null }> {
  const agg = await SwipeModel.aggregate([
    { $match: { userId: new Types.ObjectId(String(userId)) } },
    {
      $group: {
        _id: '$mode',
        total: { $sum: 1 },
        liked: { $sum: { $cond: ['$liked', 1, 0] } },
      },
    },
  ]);

  const out: { interests: number | null; looks: number | null } = {
    interests: null,
    looks: null,
  };
  for (const row of agg) {
    const rate = row.total > 0 ? row.liked / row.total : null;
    if (row._id === 'interests') out.interests = rate;
    else if (row._id === 'looks') out.looks = rate;
  }
  return out;
}
