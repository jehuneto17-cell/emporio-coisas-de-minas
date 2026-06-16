import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, fmt } from '../theme';
import { getProducts, getCategories } from '../services/firestore';

const HISTORY_KEY = 'search_history';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getProducts().then(setAllProducts);
    getCategories().then(setCategories).catch(() => {});
    AsyncStorage.getItem(HISTORY_KEY)
      .then(val => { if (val) setRecent(JSON.parse(val)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => saveToHistory(query.trim()), 1500);
    return () => clearTimeout(t);
  }, [query]);

  async function saveToHistory(term) {
    if (!term) return;
    const updated = [term, ...recent.filter(r => r !== term)].slice(0, 5);
    setRecent(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  async function clearHistory() {
    setRecent([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }

  const results = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return [];
    return allProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.producer?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.categoryLabel?.toLowerCase().includes(term)
    );
  }, [query, allProducts]);

  const hasQuery = query.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search-outline" size={16} color={C.subtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar queijos, cafés, doces..."
            placeholderTextColor={C.subtle}
            style={styles.searchText}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={C.subtle} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!hasQuery ? (
          <>
            {/* Recent */}
            {recent.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Buscas Recentes</Text>
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clearText}>Limpar</Text>
                  </TouchableOpacity>
                </View>
                {recent.map((r) => (
                  <TouchableOpacity key={r} onPress={() => setQuery(r)} style={styles.recentItem}>
                    <Ionicons name="time-outline" size={16} color={C.subtle} />
                    <Text style={styles.recentText}>{r}</Text>
                    <Ionicons name="arrow-up-outline" size={14} color={C.subtle} style={{ marginLeft: 'auto', transform: [{ rotate: '45deg' }] }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Popular */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categorias Populares</Text>
                <View style={styles.popularGrid}>
                  {categories.slice(0, 6).map((c) => (
                    <TouchableOpacity key={c.id} style={styles.popularChip} onPress={() => setQuery(c.name)}>
                      <Text style={styles.popularText}>{c.icon ? `${c.icon} ${c.name}` : c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {results.length > 0
                ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
                : `Nenhum resultado para "${query}"`}
            </Text>
            {results.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.resultCard}
                onPress={() => navigation.navigate('ProductDetail', { product: p })}
              >
                <LinearGradient colors={p.colors ?? ['#e0c090', '#a07030']} style={styles.resultImg} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{p.name}</Text>
                  <Text style={styles.resultProducer}>{p.producer}</Text>
                  <View style={styles.resultRating}>
                    <Ionicons name="star" size={11} color={C.ochre} />
                    <Text style={styles.ratingText}>{p.rating?.toFixed(1) ?? '—'}</Text>
                  </View>
                </View>
                <Text style={styles.resultPrice}>{fmt(p.price)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, height: 44, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchText: { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular', outlineStyle: 'none' },
  cancelBtn: { paddingHorizontal: 4 },
  cancelText: { fontSize: 14, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  section: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 12 },
  clearText: { fontSize: 12, color: C.terra, fontFamily: 'WorkSans_500Medium' },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  recentText: { fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular' },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  popularChip: { backgroundColor: C.chip, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  popularText: { fontSize: 13, color: C.brown, fontFamily: 'WorkSans_500Medium' },
  resultCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 10 },
  resultImg: { width: 64, height: 64, borderRadius: 10 },
  resultInfo: { flex: 1, gap: 3 },
  resultName: { fontSize: 14, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold' },
  resultProducer: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  resultRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_600SemiBold' },
  resultPrice: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
});
