// Shape contracts shared with backend. Keep in sync with the API.

export type DatingIntent = 'long_term' | 'casual' | 'explore' | 'friendship';
export type CommStyle = 'texting_first' | 'voice_early' | 'meet_in_person';
export type Phase = 'phase_1' | 'phase_2';
export type CalibrationMode = 'interests' | 'looks';

export interface IntentProfile {
  intent: DatingIntent;
  sharedIntellectImportance: number; // 1..5
  commStyle: CommStyle;
}

export interface Match {
  matchId: string;
  candidateName: string;
  candidateAge: number;
  candidateBio: string;
  candidatePhotoUrl?: string;
  expiresAt: string;
  dayInLearningPeriod?: number;
  totalLearningDays?: number;
  isIntentionalPairing?: boolean;
  cooldownActive?: boolean;
}

export interface MessageEvent {
  matchId: string;
  senderId: string; // MongoDB user id
  messageLength: number;
  responseTimeSeconds: number;
}

export interface FeedbackPayload {
  matchId: string;
  userId: string; // MongoDB user id
  willingnessToMeet: number;
  communicationCompatibility: number;
}

export interface InsightsSummary {
  intentScore: number;
  commStyleBreakdown: {
    textingFirst: number;
    voiceEarly: number;
    meetInPerson: number;
  };
  avgReplyTimeHours: number;
  messagesSentLast7Days: number;
  expiredMatches: {
    matchId: string;
    name: string;
    age: number;
    suggestedReason: string;
  }[];
}

export interface ChatMessage {
  id: string;
  matchId: string;
  text: string;
  sentAt: string;
  fromMe: boolean;
}

export interface InterestCard {
  id: string;
  icon: string;
  label: string;
  description: string;
}

export interface LookCard {
  id: string;
  photoUrl: string;
  name: string;
  age: number;
}

export interface CalibrationSwipe {
  cardId: string;
  mode: CalibrationMode;
  liked: boolean;
  swipedAt: string;
}
