import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  expiresAt: string; // ISO timestamp
  compact?: boolean;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function CountdownTimer({ expiresAt, compact }: Props) {
  const targetMs = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(targetMs - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(targetMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const expired = remaining <= 0;

  return (
    <View style={[styles.pill, compact && styles.pillCompact, expired && styles.pillExpired]}>
      <Text style={[styles.text, compact && styles.textCompact]}>
        {expired ? 'Expired' : formatRemaining(remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pillExpired: {
    backgroundColor: colors.danger,
  },
  text: {
    ...typography.heading,
    color: colors.textInverse,
    fontVariant: ['tabular-nums'],
  },
  textCompact: {
    ...typography.caption,
    color: colors.textInverse,
    fontVariant: ['tabular-nums'],
  },
});
