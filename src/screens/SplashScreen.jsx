import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.92)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const progress   = useRef(new Animated.Value(0)).current;
  const glowScale  = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.timing(tagOpacity, { toValue: 1, duration: 1400, delay: 500, useNativeDriver: true }).start();
    Animated.timing(progress, { toValue: 0.92, duration: 3200, useNativeDriver: false }).start();

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
  const logoW = Math.min(width * 0.74, 290);

  return (
    <View style={styles.bg}>
      <LinearGradient colors={['#6f2c1f', '#52170c', '#3a0e07']} style={StyleSheet.absoluteFill} />

      {/* Radial warmth overlay */}
      <View style={styles.radialWarmth} />

      {/* Vignette */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.32)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Top ornament */}
      <View style={[styles.ornamentWrap, { top: height * 0.25 }]}>
        <Ornament />
      </View>

      {/* Logo + glow */}
      <View style={styles.center}>
        <Animated.View style={[styles.glowHalo, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

        <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
          <Image
            source={require('../../assets/logo-cream.png')}
            style={{ width: logoW, aspectRatio: 1546 / 767 }}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Delícias da Canastra e outros trem…
        </Animated.Text>
      </View>

      {/* Bottom ornament */}
      <View style={[styles.ornamentWrap, { top: height * 0.72 }]}>
        <Ornament />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressWrap, { top: height * 0.82 }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      {/* Footer */}
      <Text style={[styles.since, { top: height * 0.90 }]}>DESDE 2024</Text>
    </View>
  );
}

function Ornament() {
  return (
    <View style={styles.ornament}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
      <View style={styles.ornamentLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#52170c' },
  radialWarmth: {
    position: 'absolute',
    width: width * 1.4,
    height: height * 0.6,
    top: height * 0.1,
    left: width * -0.2,
    borderRadius: 9999,
    backgroundColor: 'rgba(111,44,31,0.5)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glowHalo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(216,163,96,0.22)',
  },
  ornamentWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  ornament: { flexDirection: 'row', alignItems: 'center', width: 120, gap: 8 },
  ornamentLine: { flex: 1, height: 1, backgroundColor: C.ochre, opacity: 0.7 },
  ornamentDiamond: { width: 5, height: 5, backgroundColor: C.ochre, transform: [{ rotate: '45deg' }], opacity: 0.7 },
  tagline: {
    marginTop: 24, fontStyle: 'italic', fontSize: 15,
    color: C.rose, textAlign: 'center', lineHeight: 20,
    letterSpacing: 0.3, fontFamily: 'WorkSans_400Regular',
  },
  progressWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  progressTrack: { width: 120, height: 2, borderRadius: 999, backgroundColor: 'rgba(255,180,165,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.ochre, borderRadius: 999 },
  since: {
    position: 'absolute', left: 0, right: 0, textAlign: 'center',
    fontSize: 11, color: 'rgba(255,180,165,0.5)',
    letterSpacing: 3, fontFamily: 'WorkSans_500Medium',
  },
});
