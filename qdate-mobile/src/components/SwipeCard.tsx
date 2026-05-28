import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_OUT_DURATION = 220;

interface Props {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  /** Visual stack depth — 0 = top card (interactive), 1+ = behind cards (decorative). */
  stackIndex?: number;
}

export function SwipeCard({ children, onSwipeLeft, onSwipeRight, stackIndex = 0 }: Props) {
  const pan = useRef(new Animated.ValueXY()).current;

  // Top card uses gestures; cards behind are decorative.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => stackIndex === 0,
      onMoveShouldSetPanResponder: (_, g) =>
        stackIndex === 0 && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
      onPanResponderMove: (_, g) => {
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  function forceSwipe(direction: 'left' | 'right') {
    const x = direction === 'right' ? SCREEN_WIDTH * 1.6 : -SCREEN_WIDTH * 1.6;
    Animated.timing(pan, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      if (direction === 'right') onSwipeRight();
      else onSwipeLeft();
    });
  }

  const rotation = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.6],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.6, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Cards behind: slightly smaller and offset down to suggest a stack.
  if (stackIndex > 0) {
    const scale = 1 - stackIndex * 0.04;
    const translateY = stackIndex * 10;
    const opacity = 1 - stackIndex * 0.15;
    return (
      <View
        style={[
          styles.cardWrap,
          { transform: [{ scale }, { translateY }], opacity },
        ]}
        pointerEvents="none"
      >
        <View style={styles.card}>{children}</View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: rotation },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.card}>
        {children}

        <Animated.View
          style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}
          pointerEvents="none"
        >
          <Text style={[styles.overlayLabel, { color: colors.success }]}>LIKE</Text>
        </Animated.View>
        <Animated.View
          style={[styles.overlay, styles.nopeOverlay, { opacity: nopeOpacity }]}
          pointerEvents="none"
        >
          <Text style={[styles.overlayLabel, { color: colors.danger }]}>NOPE</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  overlay: {
    position: 'absolute',
    top: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 3,
  },
  likeOverlay: {
    right: spacing.lg,
    borderColor: colors.success,
    transform: [{ rotate: '-10deg' }],
  },
  nopeOverlay: {
    left: spacing.lg,
    borderColor: colors.danger,
    transform: [{ rotate: '10deg' }],
  },
  overlayLabel: {
    ...typography.title,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
