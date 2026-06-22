// Selectable interests. Mirrors the backend catalog in
// qdate-backend/src/data/interests.ts — the `tag` values must stay in sync with
// the matching model's CalibrationTag axes so chosen interests feed scoring.

export interface InterestOption {
  tag: string;
  label: string;
  emoji: string;
}

export const INTEREST_OPTIONS: InterestOption[] = [
  { tag: 'hiking', label: 'Hiking', emoji: '🥾' },
  { tag: 'running', label: 'Running', emoji: '🏃' },
  { tag: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { tag: 'yoga', label: 'Yoga', emoji: '🧘' },
  { tag: 'cooking', label: 'Cooking', emoji: '🍳' },
  { tag: 'foodie', label: 'Foodie', emoji: '🍜' },
  { tag: 'coffee', label: 'Coffee', emoji: '☕' },
  { tag: 'live_music', label: 'Live music', emoji: '🎶' },
  { tag: 'reading', label: 'Reading', emoji: '📚' },
  { tag: 'art', label: 'Art & galleries', emoji: '🎨' },
  { tag: 'photography', label: 'Photography', emoji: '📷' },
  { tag: 'film', label: 'Film & TV', emoji: '🎬' },
  { tag: 'travel', label: 'Travel', emoji: '✈️' },
  { tag: 'gaming', label: 'Gaming', emoji: '🎮' },
  { tag: 'nature', label: 'Nature', emoji: '🌿' },
  { tag: 'volunteering', label: 'Volunteering', emoji: '🤝' },
  { tag: 'nightlife', label: 'Nightlife', emoji: '🍸' },
  { tag: 'pets', label: 'Pets', emoji: '🐾' },
];

// Each user picks exactly this many interests.
export const INTEREST_PICK_COUNT = 5;

const BY_TAG: Record<string, InterestOption> = Object.fromEntries(
  INTEREST_OPTIONS.map((o) => [o.tag, o])
);

/** Human-friendly label for a stored interest tag (falls back to the raw tag). */
export function interestLabel(tag: string): string {
  return BY_TAG[tag]?.label ?? tag;
}

export function interestEmoji(tag: string): string {
  return BY_TAG[tag]?.emoji ?? '•';
}
