export interface DailyTip {
  title: string;
  body: string;
}

export const DAILY_TIPS: DailyTip[] = [
  {
    title: 'Ask one real question',
    body: 'Instead of "how was your day?", try "what\'s something that made you think today?" Specific questions create real conversations.',
  },
  {
    title: 'Notice the small things',
    body: 'Attraction grows through attention. Remember names, projects, the book they mentioned last week. Most people don\'t.',
  },
  {
    title: 'Let silence happen',
    body: 'Pauses aren\'t failures. They\'re where the next interesting thing comes from. Being comfortable in silence reads as confidence.',
  },
  {
    title: 'Share something specific',
    body: 'Specifics build connection. "I love music" lands flat. "I\'ve listened to the same Talk Talk album every September for ten years" lands.',
  },
  {
    title: 'Watch how they treat the staff',
    body: 'How someone speaks to a barista or a server when they think nobody important is watching tells you almost everything.',
  },
  {
    title: 'Curiosity beats charm',
    body: 'Charm impresses for an hour. Genuine curiosity about who someone actually is creates the kind of attention that sustains a relationship.',
  },
  {
    title: 'Don\'t perform',
    body: 'The version of yourself that gets someone to like you is the version you\'ll need to keep being. Make sure it\'s actually you.',
  },
  {
    title: 'Mismatched effort is a signal',
    body: 'If you\'re always the one initiating, that\'s information. Not a verdict — but information. Notice it without explaining it away.',
  },
  {
    title: 'Your fifth date matters more than your first',
    body: 'First dates are auditions. By date five you start seeing how someone moves through the world. That\'s what you\'re actually choosing.',
  },
  {
    title: 'Talk about what you actually want',
    body: 'Being clear about your intentions early isn\'t intense — it\'s respectful. Vague signals waste both of your time.',
  },
  {
    title: 'Slow down',
    body: 'You will never regret moving at half the speed you wanted to. Connection compounds; rushing dilutes it.',
  },
  {
    title: 'Different is more interesting than perfect',
    body: 'The traits that make someone unforgettable are usually the ones that don\'t fit their dating profile. Stay curious about the edges.',
  },
  {
    title: 'Make the next plan before you leave',
    body: 'If a date went well, propose the next one before you say goodbye. Momentum matters more than playing it cool.',
  },
  {
    title: 'Be early',
    body: 'Showing up five minutes before your date is a small act of respect. Most people don\'t. It registers.',
  },
];

/**
 * Returns a stable tip for today — same tip the entire day, rotates daily.
 */
export function getTodaysTip(): DailyTip {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}
