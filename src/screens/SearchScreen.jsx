import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

const RECENT = ['Queijo Canastra', 'Café Especial', 'Doce de Leite'];
const POPULAR = ['🧀 Queijos', '☕ Cafés', '🍬 Doces', '🫙 Conservas', '🍷 Cachaças'];

const RESULTS = [
  { id: 'p1', name: 'Queijo Canastra Maturado', producer: 'Fazenda São João', price: 'R$ 54,90', rating: '4.9', colors: ['#f1dca1', '#a87532'] },
  { id: 'p2', name: 'Queijo Minas Frescal', producer: 'Fazenda Boa Vista', price: 'R$ 22,90', rating: '4.8', colors: ['#f6e2c0', '#c98a3f'] },
  { id: 'p3', name: 'Queijo Coalho Artesanal', producer: 'Sítio das Pedras', price: 'R$ 31,00', rating: '4.7', colors: ['#e8d5a0', '#b08040'] },
];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const hasResults = query.length > 0;

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
        {!hasResults ? (
          <>
            {/* Recent */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buscas Recentes</Text>
              {RECENT.map((r) => (
                <TouchableOpacity key={r} onPress={() => setQuery(r)} style={styles.recentItem}>
                  <Ionicons name="time-outline" size={16} color={C.subtle} />
                  <Text style={styles.recentText}>{r}</Text>
                  <Ionicons name="arrow-up-outline" size={14} color={C.subtle} style={{ marginLeft: 'auto', transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Popular */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categorias Populares</Text>
              <View style={styles.popularGrid}>
                {POPULAR.map((p) => (
                  <TouchableOpacity key={p} style={styles.popularChip} onPress={() => setQuery(p.split(' ')[1])}>
                    <Text style={styles.popularText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{RESULTS.length} resultados para "{query}"</Text>
            {RESULTS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.resultCard}
                onPress={() => navigation.navigate('ProductDetail', { product: p })}
              >
                <LinearGradient colors={p.colors} style={styles.resultImg} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{p.name}</Text>
                  <Text style={styles.resultProducer}>{p.producer}</Text>
                  <View style={styles.resultRating}>
                    <Ionicons name="star" size={11} color={C.ochre} />
                    <Text style={styles.ratingText}>{p.rating}</Text>
                  </View>
                </View>
                <Text style={styles.resultPrice}>{p.price}</Text>
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
  searchText: { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular' },
  cancelBtn: { paddingHorizontal: 4 },
  cancelText: { fontSize: 14, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  section: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 12 },
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
