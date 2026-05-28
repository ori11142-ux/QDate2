import { Router } from 'express';
import mongoose from 'mongoose';

import { createUser, findUserById, findUserByEmail } from '../services/users';
import {
  AuthError,
  registerWithPassword,
  verifyLogin,
} from '../services/auth';
import {
  listMessagesForMatch,
  recordMessage,
  markMessagesReadForUser,
} from '../services/messages';
import { recordSwipe, listSwipesForUser } from '../services/swipes';
import { getCurrentMatchForUser } from '../services/matches';

export const router = Router();

// ─── Health ─────────────────────────────────────────────────────────────────

router.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    ok: dbState === 1,
    db: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState],
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// ─── Auth ───────────────────────────────────────────────────────────────────

router.post('/auth/register', async (req, res) => {
  try {
    const { email, name, age, authMethod, password, profile } = req.body;
    if (!email || !name || !age || !password || !profile) {
      res
        .status(400)
        .json({ error: 'email, name, age, password, and profile are required' });
      return;
    }
    const user = await registerWithPassword({
      email,
      name,
      age,
      authMethod: authMethod ?? 'email',
      password,
      profile,
    });
    res.status(201).json(user.toJSON());
  } catch (e: any) {
    if (e instanceof AuthError && e.code === 'EMAIL_EXISTS') {
      res.status(409).json({ error: e.message });
      return;
    }
    res.status(400).json({ error: e?.message ?? 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const user = await verifyLogin(email, password);
    res.json(user.toJSON());
  } catch (e: any) {
    if (e instanceof AuthError && e.code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: e.message });
      return;
    }
    res.status(400).json({ error: e?.message ?? 'Login failed' });
  }
});

// ─── Users ──────────────────────────────────────────────────────────────────

router.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user.toJSON());
  } catch (e: any) {
    if (e?.code === 11000) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }
    res.status(400).json({ error: e?.message ?? 'Failed to create user' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(user.toJSON());
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? 'Bad request' });
  }
});

router.get('/users/by-email/:email', async (req, res) => {
  const user = await findUserByEmail(req.params.email);
  if (!user) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(user.toJSON());
});

// ─── Matches ────────────────────────────────────────────────────────────────

router.get('/matches/current/:userId', async (req, res) => {
  const match = await getCurrentMatchForUser(req.params.userId);
  res.json(match?.toJSON() ?? null);
});

// ─── Messages ───────────────────────────────────────────────────────────────

router.post('/messages', async (req, res) => {
  try {
    const { matchId, senderId, text } = req.body;
    if (!matchId || !senderId || !text) {
      res.status(400).json({ error: 'matchId, senderId, text are required' });
      return;
    }
    const msg = await recordMessage({ matchId, senderId, text });
    res.status(201).json(msg.toJSON());
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? 'Failed to record message' });
  }
});

router.get('/messages/match/:matchId', async (req, res) => {
  const messages = await listMessagesForMatch(req.params.matchId);
  res.json(messages.map((m) => m.toJSON()));
});

router.post('/messages/match/:matchId/mark-read', async (req, res) => {
  const { readerId } = req.body;
  if (!readerId) {
    res.status(400).json({ error: 'readerId is required' });
    return;
  }
  const count = await markMessagesReadForUser(req.params.matchId, readerId);
  res.json({ marked: count });
});

// ─── Swipes ─────────────────────────────────────────────────────────────────

router.post('/swipes', async (req, res) => {
  try {
    const { userId, cardId, mode, liked, responseTimeMs } = req.body;
    if (!userId || !cardId || !mode || typeof liked !== 'boolean') {
      res.status(400).json({ error: 'userId, cardId, mode, liked are required' });
      return;
    }
    const swipe = await recordSwipe({ userId, cardId, mode, liked, responseTimeMs });
    res.status(201).json(swipe.toJSON());
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? 'Failed to record swipe' });
  }
});

router.get('/swipes/:userId', async (req, res) => {
  const mode = req.query.mode as 'interests' | 'looks' | undefined;
  const swipes = await listSwipesForUser(req.params.userId, mode);
  res.json(swipes.map((s) => s.toJSON()));
});
