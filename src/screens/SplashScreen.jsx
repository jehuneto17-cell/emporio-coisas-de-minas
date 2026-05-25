import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.timing(tagOpacity, { toValue: 1, duration: 1000, delay: 500, useNativeDriver: true }).start();
    Animated.timing(progress, { toValue: 0.92, duration: 3200, useNativeDriver: false }).start();

    const timer = setTimeout(() => navigation.replace('Login'), 3500);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <LinearGradient colors={['#6f2c1f', '#52170c', '#3a0e07']} style={styles.container}>
      <View style={styles.dotPattern} />

      <View style={styles.ornamentTop}>
        <Ornament />
      </View>

      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../../assets/logo-cream.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Delícias da Canastra e outros trem…
        </Animated.Text>
      </Animated.View>

      <View style={styles.ornamentBottom}>
        <Ornament />
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <Text style={styles.since}>DESDE 2024</Text>
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dotPattern: { position: 'absolute', inset: 0 },
  ornamentTop: { position: 'absolute', top: '25%' },
  ornamentBottom: { position: 'absolute', top: '72%' },
  ornament: { flexDirection: 'row', alignItems: 'center', width: 120, gap: 8 },
  ornamentLine: { flex: 1, height: 1, backgroundColor: C.ochre, opacity: 0.7 },
  ornamentDiamond: { width: 5, height: 5, backgroundColor: C.ochre, transform: [{ rotate: '45deg' }], opacity: 0.7 },
  logoWrap: { alignItems: 'center' },
  logo: { width: width * 0.68, aspectRatio: 1546 / 767 },
  tagline: { marginTop: 24, fontStyle: 'italic', fontSize: 15, color: C.rose, textAlign: 'center', lineHeight: 20 },
  progressWrap: { position: 'absolute', top: '82%', alignItems: 'center' },
  progressTrack: { width: 120, height: 2, borderRadius: 999, backgroundColor: 'rgba(255,180,165,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.ochre, borderRadius: 999 },
  since: { position: 'absolute', bottom: 40, fontSize: 11, fontWeight: '500', color: 'rgba(255,180,165,0.5)', letterSpacing: 3 },
});
