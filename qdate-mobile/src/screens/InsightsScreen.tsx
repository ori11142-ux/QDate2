import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { InsightsSummary } from '../types';
import { colors, radius, spacing, typography } from '../theme';


export function InsightsScreen() {
  const { user, signOut, togglePhase } = useAuth();
  const [insights, setInsights] = useState<InsightsSummary | null>(null);

  useEffect(() => {
    api.getInsights(user?.id ?? "").then(setInsights).catch(() => setInsights(null));
  }, []);

  function handleSignOutPress() {
    Alert.alert(
      'Sign out?',
      'You\'ll need to register again to receive matches.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ],
    );
  }

  if (!insights) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const nextPhaseLabel =
    user?.currentPhase === 'phase_1'
      ? 'Switch to Phase 2 (demo)'
      : 'Switch to Phase 1 (demo)';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Insights & Reflection</Text>
        <Text style={styles.subtitle}>
          {user ? `${user.name}, here's what the system is learning.` : 'How the system is learning your intent'}
        </Text>

        <Text style={styles.sectionTitle}>Compatibility Metrics</Text>
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Communication Style</Text>
            <View style={styles.barList}>
              <StatBar
                label="Texting first"
                pct={insights.commStyleBreakdown.textingFirst}
              />
              <StatBar
                label="Voice early"
                pct={insights.commStyleBreakdown.voiceEarly}
              />
              <StatBar
                label="Meet in person"
                pct={insights.commStyleBreakdown.meetInPerson}
              />
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Messaging Patterns</Text>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>
                {insights.avgReplyTimeHours.toFixed(1)}h
              </Text>
              <Text style={styles.statCaption}>avg reply time</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{insights.messagesSentLast7Days}</Text>
              <Text style={styles.statCaption}>messages, last 7d</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Reflection Moments</Text>
        <View style={styles.reflectionList}>
          {insights.expiredMatches.map((m) => (
            <View key={m.matchId} style={styles.reflectionCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{m.name[0]}</Text>
              </View>
              <View style={styles.reflectionBody}>
                <Text style={styles.reflectionName}>
                  {m.name}, {m.age}
                </Text>
                <Text style={styles.reflectionReason}>{m.suggestedReason}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.intentCard}>
          <Text style={styles.intentLabel}>Your Intent Score</Text>
          <Text style={styles.intentValue}>
            {insights.intentScore.toFixed(1)}
            <Text style={styles.intentMax}> / 10</Text>
          </Text>
          <Text style={styles.intentCaption}>Keep up the thoughtful interactions</Text>
        </View>

        <View style={styles.footerLinks}>
          <Pressable onPress={togglePhase} style={styles.linkBtn} hitSlop={8}>
            <Text style={styles.linkLabel}>{nextPhaseLabel}</Text>
          </Pressable>
          <Pressable onPress={handleSignOutPress} style={styles.linkBtn} hitSlop={8}>
            <Text style={styles.linkLabel}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBar({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={styles.statBar}>
      <View style={styles.statBarHeader}>
        <Text style={styles.statBarLabel}>{label}</Text>
        <Text style={styles.statBarPct}>{pct}%</Text>
      </View>
      <View style={styles.statBarTrack}>
        <View style={[styles.statBarFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { alignItems: 'center', justifyContent: 'center' },

  h1: { ...typography.display, color: colors.text },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  metricRow: { flexDirection: 'row', gap: spacing.md },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metricLabel: { ...typography.caption, color: colors.textMuted },

  barList: { gap: spacing.sm, marginTop: spacing.xs },
  statBar: { gap: 4 },
  statBarHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  statBarLabel: { ...typography.caption, color: colors.text },
  statBarPct: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  statBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: { height: 6, backgroundColor: colors.primary },

  statBlock: { marginTop: spacing.xs },
  statValue: { ...typography.title, color: colors.text },
  statCaption: { ...typography.caption, color: colors.textMuted },

  reflectionList: { gap: spacing.sm },
  reflectionCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.heading, color: colors.primary },
  reflectionBody: { flex: 1 },
  reflectionName: { ...typography.body, color: colors.text, fontWeight: '500' },
  reflectionReason: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  intentCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  intentLabel: { ...typography.caption, color: colors.textMuted },
  intentValue: { ...typography.display, fontSize: 48, color: colors.primary },
  intentMax: { ...typography.title, color: colors.textMuted },
  intentCaption: { ...typography.caption, color: colors.textMuted },

  footerLinks: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  linkBtn: {
    paddingVertical: spacing.sm,
  },
  linkLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
