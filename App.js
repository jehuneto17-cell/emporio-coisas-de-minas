import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from '@expo-google-fonts/work-sans';
import AppNavigator from './src/navigation/AppNavigator';

function AppCore() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Chrome decorativo do celular (só aparece na web)
function PhoneChrome() {
  const c = '#fcf9f5';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dynamic island */}
      <View style={styles.dynamicIsland} />

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          {/* Signal bars */}
          <View style={styles.signal}>
            {[4, 6, 8, 10].map((h, i) => (
              <View key={i} style={[styles.signalBar, { height: h, backgroundColor: c }]} />
            ))}
          </View>
          {/* WiFi */}
          <View style={styles.wifiWrap}>
            {[10, 7, 4].map((s, i) => (
              <View key={i} style={{
                position: 'absolute',
                width: s, height: s,
                borderRadius: s,
                borderWidth: 1.5,
                borderColor: c,
                borderBottomColor: 'transparent',
                borderLeftColor: 'transparent',
                transform: [{ rotate: '-45deg' }],
                bottom: 0,
                left: (10 - s) / 2,
              }} />
            ))}
            <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: c, position: 'absolute', bottom: 0, left: 4 }} />
          </View>
          {/* Battery */}
          <View style={styles.battery}>
            <View style={[styles.batteryFill, { backgroundColor: c }]} />
            <View style={styles.batteryTip} />
          </View>
        </View>
      </View>

      {/* Home indicator */}
      <View style={styles.homeWrap}>
        <View style={styles.homeBar} />
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Empório Coisas de Minas</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webPage}>
        <View style={styles.phoneFrame}>
          <AppCore />
          <PhoneChrome />
        </View>
      </View>
    );
  }

  return <AppCore />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, backgroundColor: '#52170c',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { color: '#fcf9f5', fontSize: 18 },

  webPage: {
    flex: 1,
    backgroundColor: '#e8ddd0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  phoneFrame: {
    width: 390,
    height: 844,
    borderRadius: 52,
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(82,23,12,0.30), 0 0 0 8px #1a0a05, 0 0 0 10px rgba(0,0,0,0.35)',
  },

  // Dynamic island
  dynamicIsland: {
    position: 'absolute', top: 11,
    alignSelf: 'center', left: (390 - 122) / 2,
    width: 122, height: 36,
    borderRadius: 24, backgroundColor: '#000',
    zIndex: 50,
  },

  // Status bar
  statusBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 47,
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 28, paddingBottom: 10,
    zIndex: 60,
  },
  statusTime: {
    color: '#fcf9f5', fontSize: 15.5, fontWeight: '600',
    fontFamily: 'WorkSans_600SemiBold',
  },
  statusIcons: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  signal: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 11,
  },
  signalBar: {
    width: 3, borderRadius: 0.5,
  },
  wifiWrap: {
    width: 15, height: 11, position: 'relative',
  },
  battery: {
    width: 25, height: 12,
    borderWidth: 1, borderColor: 'rgba(252,249,245,0.5)',
    borderRadius: 3, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 2, gap: 1,
  },
  batteryFill: {
    flex: 1, height: 7, borderRadius: 1.5,
  },
  batteryTip: {
    position: 'absolute', right: -4, top: 3,
    width: 3, height: 5, borderRadius: 1,
    backgroundColor: 'rgba(252,249,245,0.4)',
  },

  // Home indicator
  homeWrap: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    alignItems: 'center', zIndex: 70,
  },
  homeBar: {
    width: 134, height: 5, borderRadius: 99,
    backgroundColor: 'rgba(255,180,165,0.45)',
  },
});
