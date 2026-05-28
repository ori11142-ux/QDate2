import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { mockMatch, mockReplyPool, mockSeedMessages } from '../mocks';
import { RootStackParamList } from '../navigation/RootNavigator';
import { ChatMessage } from '../types';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { matchId } = route.params;
  const { user } = useAuth();
  const userId = user?.id ?? '';
  // In real impl: fetch match + messages by matchId. For now: use the mock.
  const match = mockMatch;

  const [messages, setMessages] = useState<ChatMessage[]>(mockSeedMessages);
  const [draft, setDraft] = useState('');
  const [theyAreTyping, setTheyAreTyping] = useState(false);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Timestamp of the most recent message NOT from the current user.
  // Used to compute response latency for behavioral tracking.
  const lastTheirMessageAt = useMemo(() => {
    const theirs = messages.filter((m) => !m.fromMe);
    return theirs.length > 0
      ? new Date(theirs[theirs.length - 1].sentAt).getTime()
      : Date.now();
  }, [messages]);

  // Auto-scroll on new message.
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, theyAreTyping]);

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;

    const now = Date.now();
    const responseTimeSeconds = Math.floor((now - lastTheirMessageAt) / 1000);

    const myMessage: ChatMessage = {
      id: `msg_${now}`,
      matchId,
      text,
      sentAt: new Date(now).toISOString(),
      fromMe: true,
    };

    setMessages((prev) => [...prev, myMessage]);
    setDraft('');

    // Fire behavioral event. Don't block the UI on this.
    api
      .recordMessageEvent({
        matchId,
        senderId: userId,
        messageLength: text.length,
        responseTimeSeconds,
      })
      .catch((e) => console.warn('message_event failed', e));

    // Simulate the match replying after a short delay.
    // Real impl: remove this — push from backend will deliver their messages.
    setTheyAreTyping(true);
    setTimeout(() => {
      const reply = mockReplyPool[Math.floor(Math.random() * mockReplyPool.length)];
      const replyMessage: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        matchId,
        text: reply,
        sentAt: new Date().toISOString(),
        fromMe: false,
      };
      setTheyAreTyping(false);
      setMessages((prev) => [...prev, replyMessage]);
    }, 1800 + Math.random() * 1500);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{match.candidateName[0]}</Text>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{match.candidateName}</Text>
          <Text style={styles.headerSub}>Day {match.dayInLearningPeriod} of {match.totalLearningDays}</Text>
        </View>
        <CountdownTimer expiresAt={match.expiresAt} compact />
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messagesContent}
          renderItem={({ item }) => <Bubble message={item} />}
          ListFooterComponent={theyAreTyping ? <TypingDots /> : null}
        />

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              !draft.trim() && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
            ]}
          >
            <Text style={styles.sendBtnLabel}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.fromMe;
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

function TypingDots() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, styles.bubbleTheirs, styles.typingBubble]}>
        <Text style={styles.typingText}>•••</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: {
    fontSize: 32,
    color: colors.primary,
    lineHeight: 32,
    marginRight: -spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.heading, color: colors.primary },
  headerCenter: { flex: 1 },
  headerName: { ...typography.heading, color: colors.text },
  headerSub: { ...typography.caption, color: colors.textMuted },

  body: { flex: 1 },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },

  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    ...typography.body,
    color: colors.text,
  },
  bubbleTextMine: {
    color: colors.textInverse,
  },
  typingBubble: {
    paddingVertical: spacing.xs + 2,
  },
  typingText: {
    ...typography.body,
    color: colors.textMuted,
    letterSpacing: 2,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
    ...typography.body,
    color: colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
  sendBtnPressed: { opacity: 0.85 },
  sendBtnLabel: {
    fontSize: 22,
    color: colors.textInverse,
    fontWeight: '600',
    lineHeight: 24,
  },
});
