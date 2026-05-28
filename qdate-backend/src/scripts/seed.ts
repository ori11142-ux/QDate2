/**
 * Wipe and reseed the database with test data.
 * Run with: npm run seed
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDb, disconnectFromDb } from '../config/db';
import { UserModel } from '../models/User';
import { MatchModel } from '../models/Match';
import { MessageModel } from '../models/Message';
import { SwipeModel } from '../models/Swipe';

async function main() {
  await connectToDb();

  console.log('[seed] wiping collections…');
  await Promise.all([
    UserModel.deleteMany({}),
    MatchModel.deleteMany({}),
    MessageModel.deleteMany({}),
    SwipeModel.deleteMany({}),
  ]);

  console.log('[seed] creating users…');
  const [ori, olivia, maya, david] = await UserModel.insertMany([
    {
      email: 'ori@qdate.app',
      name: 'Ori Blaish',
      age: 28,
      authMethod: 'email',
      profile: {
        intent: 'long_term',
        sharedIntellectImportance: 5,
        commStyle: 'texting_first',
      },
      currentPhase: 'phase_1',
      intentScore: 7.5,
    },
    {
      email: 'olivia@qdate.app',
      name: 'Olivia Park',
      age: 29,
      authMethod: 'apple',
      profile: {
        intent: 'long_term',
        sharedIntellectImportance: 4,
        commStyle: 'voice_early',
      },
      currentPhase: 'phase_1',
      intentScore: 6.8,
    },
    {
      email: 'maya@qdate.app',
      name: 'Maya Chen',
      age: 31,
      authMethod: 'email',
      profile: {
        intent: 'long_term',
        sharedIntellectImportance: 5,
        commStyle: 'meet_in_person',
      },
      currentPhase: 'phase_2',
      intentScore: 8.4,
    },
    {
      email: 'david@qdate.app',
      name: 'David Stern',
      age: 30,
      authMethod: 'email',
      profile: {
        intent: 'casual',
        sharedIntellectImportance: 3,
        commStyle: 'texting_first',
      },
      currentPhase: 'phase_1',
      intentScore: 5.2,
    },
  ]);

  console.log(`[seed] created ${ori.email}, ${olivia.email}, ${maya.email}, ${david.email}`);

  console.log('[seed] creating matches…');
  const dailyMatch = await MatchModel.create({
    userId: ori._id,
    candidateUserId: olivia._id,
    phase: 'phase_1',
    status: 'active',
    revealedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
    dayInLearningPeriod: 3,
  });

  const weeklyMatch = await MatchModel.create({
    userId: maya._id,
    candidateUserId: david._id,
    phase: 'phase_2',
    status: 'pending_reveal',
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    isIntentionalPairing: true,
  });

  console.log('[seed] creating messages in the active match…');
  const baseTime = Date.now() - 90 * 60 * 1000; // 90 minutes ago
  const conversation = [
    {
      senderId: olivia._id,
      text: 'Hey! I saw you also like indie films. Have you watched anything good lately?',
      offsetMs: 0,
    },
    {
      senderId: ori._id,
      text: 'Yes — finally caught Past Lives last week. It wrecked me.',
      offsetMs: 18 * 60 * 1000, // 18 min later
    },
    {
      senderId: olivia._id,
      text: 'God, same. The airport scene. I had to sit in my car for ten minutes after.',
      offsetMs: 22 * 60 * 1000,
    },
    {
      senderId: ori._id,
      text: 'What are you watching this weekend?',
      offsetMs: 47 * 60 * 1000,
    },
  ];

  for (const m of conversation) {
    const sentAt = new Date(baseTime + m.offsetMs);
    // Find latency since the other party's last message (recreating recordMessage's logic).
    const lastFromOther = await MessageModel.findOne({
      matchId: dailyMatch._id,
      senderId: { $ne: m.senderId },
    })
      .sort({ sentAt: -1 })
      .select('sentAt');
    const responseTimeSeconds = lastFromOther
      ? Math.max(0, Math.floor((sentAt.getTime() - lastFromOther.sentAt.getTime()) / 1000))
      : null;

    await MessageModel.create({
      matchId: dailyMatch._id,
      senderId: m.senderId,
      text: m.text,
      messageLength: m.text.length,
      responseTimeSeconds,
      sentAt,
    });
  }

  console.log('[seed] creating calibration swipes for Ori…');
  const interestCards = ['int_01', 'int_02', 'int_03', 'int_04', 'int_05', 'int_06'];
  const lookCards = ['look_01', 'look_02', 'look_03', 'look_04', 'look_05'];

  const swipes = [
    ...interestCards.map((cardId, i) => ({
      userId: ori._id,
      cardId,
      mode: 'interests' as const,
      liked: i % 2 === 0,
      responseTimeMs: 1000 + Math.floor(Math.random() * 3000),
      swipedAt: new Date(Date.now() - (interestCards.length - i) * 60 * 1000),
    })),
    ...lookCards.map((cardId, i) => ({
      userId: ori._id,
      cardId,
      mode: 'looks' as const,
      liked: i < 3,
      responseTimeMs: 500 + Math.floor(Math.random() * 1500), // looks are faster
      swipedAt: new Date(Date.now() - (lookCards.length - i) * 50 * 1000),
    })),
  ];
  await SwipeModel.insertMany(swipes);

  console.log('[seed] done.');
  console.log({
    users: await UserModel.countDocuments(),
    matches: await MatchModel.countDocuments(),
    messages: await MessageModel.countDocuments(),
    swipes: await SwipeModel.countDocuments(),
  });

  await disconnectFromDb();
}

main().catch(async (err) => {
  console.error('[seed] failed', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
