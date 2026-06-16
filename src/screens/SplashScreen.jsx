import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.92)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const sinceOp  = useRef(new Animated.Value(0)).current;
  const decoOp   = useRef(new Animated.Value(0)).current;
  const tagOp    = useRef(new Animated.Value(0)).current;
  const tagY     = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
    Animated.timing(decoOp,  { toValue: 1, duration: 1400, delay: 750, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(tagOp, { toValue: 1, duration: 1400, delay: 500, useNativeDriver: true }),
      Animated.timing(tagY,  { toValue: 0, duration: 1400, delay: 500, useNativeDriver: true }),
    ]).start();
    Animated.timing(sinceOp,  { toValue: 1, duration: 800, delay: 600, useNativeDriver: true }).start();
    Animated.timing(progress, { toValue: 0.92, duration: 3200, useNativeDriver: false }).start();
    const timer = setTimeout(() => navigation.replace('Main'), 3200);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1], outputRange: ['8%', '92%'],
  });

  return (
    <LinearGradient
      colors={['#6f2c1f', '#52170c', '#3a0f08']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Ornamento superior */}
      <Animated.View style={[styles.ornamentTop, { opacity: decoOp }]}>
        <Ornament />
      </Animated.View>

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Animated.Image
          source={require('../../assets/logo-cream.png')}
          style={[styles.logo, { opacity, transform: [{ scale }] }]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.tagline, { opacity: tagOp, transform: [{ translateY: tagY }] }]}>
          Delícias da Canastra e outros trem…
        </Animated.Text>
      </View>

      {/* Ornamento inferior */}
      <Animated.View style={[styles.ornamentBottom, { opacity: decoOp }]}>
        <Ornament />
      </Animated.View>

      {/* Barra de progresso */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* DESDE 2022 */}
      <Animated.Text style={[styles.since, { opacity: sinceOp }]}>
        DESDE 2022
      </Animated.Text>
    </LinearGradient>
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
  container: {
    flex: 1,
    backgroundColor: '#52170c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    gap: 24,
  },
  logo: {
    width: width * 0.65,
    height: width * 0.65 * (920 / 1100),
  },
  tagline: {
    fontFamily: 'WorkSans_400Regular',
    fontStyle: 'italic',
    fontSize: 15,
    color: '#ffb4a5',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  ornamentTop: {
    position: 'absolute',
    top: '25%',
  },
  ornamentBottom: {
    position: 'absolute',
    top: '72%',
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: 8,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d8a360',
    opacity: 0.6,
  },
  ornamentDiamond: {
    width: 5,
    height: 5,
    backgroundColor: '#d8a360',
    transform: [{ rotate: '45deg' }],
  },
  progressTrack: {
    position: 'absolute',
    bottom: '18%',
    width: 120,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,180,165,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d8a360',
    borderRadius: 999,
  },
  since: {
    position: 'absolute',
    bottom: '10%',
    fontSize: 11,
    color: 'rgba(255,180,165,0.5)',
    letterSpacing: 4,
    fontFamily: 'WorkSans_500Medium',
  },
});
