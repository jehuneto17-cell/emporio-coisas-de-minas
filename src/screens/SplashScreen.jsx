import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const FRAME_W = Platform.OS === 'web' ? 390 : width;

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Login'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: FRAME_W * 0.65,
    height: FRAME_W * 0.65 * (767 / 1546),
  },
});
