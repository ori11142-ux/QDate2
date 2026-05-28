/**
 * Smoke-test the data layer. Connects, runs a CRUD round-trip through each
 * service, prints results, and disconnects. Use to confirm everything wires up.
 *
 * Run with: npm run verify
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDb, disconnectFromDb } from '../config/db';

import {
  createUser,
  findUserByEmail,
  setUserPhase,
  touchLastActive,
} from '../services/users';
import {
  createMatch,
  getCurrentMatchForUser,
  markRevealed,
} from '../services/matches';
import {
  recordMessage,
  listMessagesForMatch,
  getAvgResponseTimeSeconds,
} from '../services/messages';
import { recordSwipe, getLikeRates } from '../services/swipes';

import { UserModel } from '../models/User';
import { MatchModel } from '../models/Match';
import { MessageModel } from '../models/Message';
import { SwipeModel } from '../models/Swipe';

function header(label: string) {
  console.log('\n' + '─'.repeat(60));
  console.log(' ' + label);
  console.log('─'.repeat(60));
}

async function main() {
  await connectToDb();

  header('Collection counts (pre-existing data)');
  console.log({
    users: await UserModel.countDocuments(),
    matches: await MatchModel.countDocuments(),
    messages: await MessageModel.countDocuments(),
    swipes: await SwipeModel.countDocuments(),
  });

  header('CREATE a fresh test user');
  const uniqueEmail = `verify-${Date.now()}@qdate.app`;
  const user = await createUser({
    email: uniqueEmail,
    name: 'Verify User',
    age: 29,
    authMethod: 'email',
    profile: {
      intent: 'long_term',
      sharedIntellectImportance: 4,
      commStyle: 'texting_first',
    },
  });
  console.log('created user', { id: user.id, email: user.email });

  header('READ user back by email');
  const lookedUp = await findUserByEmail(uniqueEmail);
  console.log('found', lookedUp ? { id: lookedUp.id, name: lookedUp.name } : null);

  header('CREATE a match for this user');
  const candidate = await createUser({
    email: `verify-candidate-${Date.now()}@qdate.app`,
    name: 'Candidate User',
    age: 28,
    authMethod: 'apple',
    profile: {
      intent: 'long_term',
      sharedIntellectImportance: 4,
      commStyle: 'texting_first',
    },
  });
  const match = await createMatch({
    userId: user._id,
    candidateUserId: candidate._id,
    phase: 'phase_1',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    dayInLearningPeriod: 1,
  });
  console.log('created match', { id: match.id, status: match.status });

  await markRevealed(match._id);
  const current = await getCurrentMatchForUser(user._id);
  console.log('current match status after reveal', current?.status);

  header('RECORD a conversation with latency tracking');
  // Candidate sends a message
  await recordMessage({
    matchId: match._id,
    senderId: candidate._id,
    text: 'Hey, how are you?',
  });
  // Simulate user reading and replying 2 seconds later
  await new Promise((r) => setTimeout(r, 2000));
  const reply = await recordMessage({
    matchId: match._id,
    senderId: user._id,
    text: 'Good, thanks for asking. You?',
  });
  console.log('reply with response time', {
    responseTimeSeconds: reply.responseTimeSeconds,
    messageLength: reply.messageLength,
  });

  const allMessages = await listMessagesForMatch(match._id);
  console.log(`conversation has ${allMessages.length} messages`);

  const avgLatency = await getAvgResponseTimeSeconds(user._id, 1);
  console.log('user avg reply latency (s)', avgLatency);

  header('RECORD calibration swipes (independent decks)');
  await recordSwipe({
    userId: user._id,
    cardId: 'int_03',
    mode: 'interests',
    liked: true,
    responseTimeMs: 2200,
  });
  await recordSwipe({
    userId: user._id,
    cardId: 'int_07',
    mode: 'interests',
    liked: false,
    responseTimeMs: 1100,
  });
  await recordSwipe({
    userId: user._id,
    cardId: 'look_02',
    mode: 'looks',
    liked: true,
    responseTimeMs: 600,
  });
  const likeRates = await getLikeRates(user._id);
  console.log('like rates by mode', likeRates);

  header('UPDATE user phase');
  await setUserPhase(user._id, 'phase_2');
  await touchLastActive(user._id);
  const refreshed = await UserModel.findById(user._id);
  console.log('post-update', {
    currentPhase: refreshed?.currentPhase,
    lastActiveAt: refreshed?.lastActiveAt,
  });

  header('Cleanup: delete test users + cascading data');
  await Promise.all([
    UserModel.deleteOne({ _id: user._id }),
    UserModel.deleteOne({ _id: candidate._id }),
    MatchModel.deleteOne({ _id: match._id }),
    MessageModel.deleteMany({ matchId: match._id }),
    SwipeModel.deleteMany({ userId: user._id }),
  ]);
  console.log('cleaned up.');

  await disconnectFromDb();
  console.log('\n✓ Data layer verified.');
}

main().catch(async (err) => {
  console.error('\n✗ verify failed', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
