import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

const CATEGORIES = [
  { id: 'queijos', label: 'Queijos', emoji: '🧀', count: '24 produtos', colors: ['#f1dca1', '#a87532'] },
  { id: 'cafes', label: 'Cafés', emoji: '☕', count: '18 produtos', colors: ['#a86434', '#3a1a08'] },
  { id: 'doces', label: 'Doces & Geleias', emoji: '🍬', count: '31 produtos', colors: ['#e3a96a', '#7a3c0e'] },
  { id: 'conservas', label: 'Conservas', emoji: '🫙', count: '15 produtos', colors: ['#7cb87c', '#2e5e2e'] },
  { id: 'paes', label: 'Pães & Biscoitos', emoji: '🍞', count: '12 produtos', colors: ['#e8c98a', '#9a6a20'] },
  { id: 'vinhos', label: 'Vinhos & Cachaças', emoji: '🍷', count: '20 produtos', colors: ['#8a2040', '#3a0a18'] },
  { id: 'laticinios', label: 'Laticínios', emoji: '🥛', count: '9 produtos', colors: ['#dce8f0', '#6898b0'] },
  { id: 'temperos', label: 'Temperos & Ervas', emoji: '🌿', count: '17 produtos', colors: ['#b0d88a', '#4a7a2a'] },
];

export default function CategoriesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categorias</Text>
        <Text style={styles.headerSub}>Explore os sabores de Minas</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.catCard}
            onPress={() => navigation.navigate('Listing', { category: cat })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={cat.colors} style={styles.catGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
            </LinearGradient>
            <View style={styles.catInfo}>
              <Text style={styles.catLabel}>{cat.label}</Text>
              <Text style={styles.catCount}>{cat.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 24, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  headerSub: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  grid: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  catCard: { backgroundColor: C.card, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
  catGradient: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 32 },
  catInfo: { flex: 1 },
  catLabel: { fontSize: 16, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  catCount: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 3 },
});
