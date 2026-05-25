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
    backgroundColor: '#ede3d8',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  phoneFrame: {
    width: 390,
    height: 844,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(82,23,12,0.18)',
  },
});
