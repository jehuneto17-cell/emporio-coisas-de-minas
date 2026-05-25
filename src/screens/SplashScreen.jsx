import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';

const { width, height } = Dimensions.get('window');
// Na web o app roda dentro de um frame 390×844 — usar essas dimensões para proporções corretas
const FRAME_W = Platform.OS === 'web' ? 390 : width;
const FRAME_H = Platform.OS === 'web' ? 844 : height;
const LOGO_W = FRAME_W * 0.76;
const LOGO_H = LOGO_W * (767 / 1546);

export default function SplashScreen({ navigation }) {
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.92)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const decoOpacity  = useRef(new Animated.Value(0)).current;
  const progress     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.timing(tagOpacity,  { toValue: 1, duration: 1400, delay: 500, useNativeDriver: true }).start();
    Animated.timing(decoOpacity, { toValue: 1, duration: 1400, delay: 750, useNativeDriver: true }).start();
    Animated.timing(progress,    { toValue: 0.92, duration: 3200, useNativeDriver: false }).start();

    const timer = setTimeout(() => navigation.replace('Login'), 3500);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.bg}>
      {/* Gradient de fundo */}
      <LinearGradient
        colors={['#7a3020', '#52170c', '#3a0e07']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Calor central sutil */}
      <View style={styles.warmth} />

      {/* Ornamento superior */}
      <Animated.View style={[styles.row, { top: FRAME_H * 0.24, opacity: decoOpacity }]}>
        <Ornament />
      </Animated.View>

      {/* Logo + tagline — centro da tela */}
      <View style={styles.center}>
        <Animated.Image
          source={require('../../assets/logo-cream.png')}
          style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Delícias da Canastra e outros trem…
        </Animated.Text>
      </View>

      {/* Ornamento inferior */}
      <Animated.View style={[styles.row, { top: FRAME_H * 0.72, opacity: decoOpacity }]}>
        <Ornament />
      </Animated.View>

      {/* Barra de progresso */}
      <View style={[styles.row, { top: FRAME_H * 0.82 }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      {/* Footer */}
      <Text style={[styles.since, { top: FRAME_H * 0.90 }]}>DESDE 2022</Text>
    </View>
  );
}

function Ornament() {
  return (
    <View style={styles.ornament}>
      <LinearGradient
        colors={['transparent', C.ochre]}
        style={styles.ornamentLine}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <View style={styles.ornamentDiamond} />
      <LinearGradient
        colors={[C.ochre, 'transparent']}
        style={styles.ornamentLine}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#52170c' },

  warmth: {
    position: 'absolute',
    width: FRAME_W * 1.3,
    height: FRAME_H * 0.5,
    top: FRAME_H * 0.2,
    left: FRAME_W * -0.15,
    borderRadius: 9999,
    backgroundColor: 'rgba(120,50,30,0.35)',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },

  tagline: {
    marginTop: 20,
    fontStyle: 'italic',
    fontSize: 15,
    color: C.rose,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
    fontFamily: 'WorkSans_400Regular',
  },

  row: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },

  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
    gap: 8,
  },
  ornamentLine: { flex: 1, height: 1, opacity: 0.65 },
  ornamentDiamond: {
    width: 5, height: 5,
    backgroundColor: C.ochre,
    transform: [{ rotate: '45deg' }],
    opacity: 0.75,
  },

  progressTrack: {
    width: 100, height: 2, borderRadius: 999,
    backgroundColor: 'rgba(255,180,165,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.ochre,
    borderRadius: 999,
  },

  since: {
    position: 'absolute',
    left: 0, right: 0,
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,180,165,0.45)',
    letterSpacing: 4,
    fontFamily: 'WorkSans_500Medium',
  },
});
