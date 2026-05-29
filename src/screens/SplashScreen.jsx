import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const FRAME_W = Platform.OS === 'web' ? 390 : width;
const LOGO_W  = FRAME_W * 0.82;
const LOGO_H  = LOGO_W * (767 / 1546);

export default function SplashScreen({ navigation }) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.9)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const sinceOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.timing(sinceOp,  { toValue: 1, duration: 800, delay: 600, useNativeDriver: true }).start();
    Animated.timing(progress, { toValue: 0.92, duration: 2800, useNativeDriver: false }).start();

    const timer = setTimeout(() => navigation.replace('Main'), 3000);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />

      {/* Barra de progresso */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* DESDE 2022 */}
      <Animated.Text style={[styles.since, { opacity: sinceOp }]}>
        DESDE 2022
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ede3d8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },
  progressTrack: {
    width: 110,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(82,23,12,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#964904',
    borderRadius: 999,
  },
  since: {
    position: 'absolute',
    bottom: 48,
    fontSize: 11,
    color: 'rgba(82,23,12,0.45)',
    letterSpacing: 4,
    fontFamily: 'WorkSans_500Medium',
  },
});
