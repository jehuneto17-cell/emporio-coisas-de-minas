import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';

const { width, height } = Dimensions.get('window');
const LOGO_W = Math.min(width * 0.74, 290);

export default function SplashScreen({ navigation }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.92)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const decoOpacity = useRef(new Animated.Value(0)).current;
  const progress   = useRef(new Animated.Value(0)).current;
  const glowScale  = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,  { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.spring(scale,    { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.timing(tagOpacity,  { toValue: 1, duration: 1400, delay: 500,  useNativeDriver: true }).start();
    Animated.timing(decoOpacity, { toValue: 1, duration: 1400, delay: 750,  useNativeDriver: true }).start();
    Animated.timing(progress,    { toValue: 0.92, duration: 3200, useNativeDriver: false }).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale,   { toValue: 1.04, duration: 2250, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 1,    duration: 2250, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale,   { toValue: 1,    duration: 2250, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.85, duration: 2250, useNativeDriver: true }),
        ]),
      ])
    ).start();

    const timer = setTimeout(() => navigation.replace('Login'), 3500);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.bg}>
      {/* Gradient base */}
      <LinearGradient colors={['#6f2c1f', '#52170c', '#3a0e07']} style={StyleSheet.absoluteFill} />

      {/* Radial warmth (simulated) */}
      <View style={styles.warmth} />

      {/* Vignette bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* Top ornament */}
      <Animated.View style={[styles.absolute, { top: height * 0.25, opacity: decoOpacity }]}>
        <Ornament />
      </Animated.View>

      {/* Logo + glow — centro absoluto */}
      <View style={styles.logoCenter}>
        {/* Glow radial simulado com camadas */}
        <Animated.View style={[styles.glowRing4, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}>
          <View style={styles.glowRing3}>
            <View style={styles.glowRing2}>
              <View style={styles.glowRing1} />
            </View>
          </View>
        </Animated.View>

        {/* Logo animada */}
        <Animated.Image
          source={require('../../assets/logo-cream.png')}
          style={[styles.logo, { opacity, transform: [{ scale }] }]}
          resizeMode="contain"
        />

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Delícias da Canastra e outros trem…
        </Animated.Text>
      </View>

      {/* Bottom ornament */}
      <Animated.View style={[styles.absolute, { top: height * 0.72, opacity: decoOpacity }]}>
        <Ornament />
      </Animated.View>

      {/* Barra de progresso */}
      <View style={[styles.absolute, { top: height * 0.82 }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      {/* DESDE 2024 */}
      <Text style={[styles.since, { top: height * 0.90 }]}>DESDE 2024</Text>
    </View>
  );
}

function Ornament() {
  return (
    <View style={styles.ornament}>
      <LinearGradient colors={['transparent', C.ochre]} style={styles.ornamentLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.ornamentDiamond} />
      <LinearGradient colors={[C.ochre, 'transparent']} style={styles.ornamentLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#52170c' },

  warmth: {
    position: 'absolute',
    width: width * 1.2,
    height: height * 0.55,
    top: height * 0.15,
    left: width * -0.1,
    borderRadius: 9999,
    backgroundColor: 'rgba(111,44,31,0.45)',
  },

  absolute: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center',
  },

  /* Logo centered absolutely */
  logoCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Glow camadas concêntricas — simula radial-gradient */
  glowRing4: {
    position: 'absolute',
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(216,163,96,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  glowRing3: {
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(216,163,96,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  glowRing2: {
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(216,163,96,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  glowRing1: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(216,163,96,0.10)',
  },

  logo: {
    width: LOGO_W,
    height: LOGO_W * (767 / 1546),
  },

  tagline: {
    marginTop: 24,
    fontStyle: 'italic',
    fontSize: 15,
    color: C.rose,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
    fontFamily: 'WorkSans_400Regular',
  },

  ornament: { flexDirection: 'row', alignItems: 'center', width: 120, gap: 8 },
  ornamentLine: { flex: 1, height: 1, opacity: 0.7 },
  ornamentDiamond: { width: 5, height: 5, backgroundColor: C.ochre, transform: [{ rotate: '45deg' }], opacity: 0.7 },

  progressTrack: {
    width: 120, height: 2, borderRadius: 999,
    backgroundColor: 'rgba(255,180,165,0.2)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: C.ochre, borderRadius: 999,
  },

  since: {
    position: 'absolute', left: 0, right: 0, textAlign: 'center',
    fontSize: 11, color: 'rgba(255,180,165,0.5)',
    letterSpacing: 3, fontFamily: 'WorkSans_500Medium',
  },
});
