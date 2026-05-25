import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

const PRODUCTS = [
  { id: 'p1', name: 'Queijo Canastra Maturado 60 dias', producer: 'Fazenda São João', price: 'R$ 54,90', rating: '4.9', sale: 15, colors: ['#f1dca1', '#a87532'] },
  { id: 'p2', name: 'Queijo Minas Frescal', producer: 'Fazenda Bom Retiro', price: 'R$ 22,90', rating: '4.8', colors: ['#f6e2c0', '#c98a3f'] },
  { id: 'p3', name: 'Queijo Coalho Artesanal', producer: 'Sítio das Pedras', price: 'R$ 31,00', rating: '4.7', colors: ['#e8d5a0', '#b08040'] },
  { id: 'p4', name: 'Queijo Parmesão Mineiro', producer: 'Fazenda Boa Vista', price: 'R$ 68,00', rating: '4.8', colors: ['#eadea0', '#9a8030'] },
  { id: 'p5', name: 'Queijo Reino Curado', producer: 'Queijaria Serra', price: 'R$ 45,00', rating: '4.6', colors: ['#e8c88a', '#9a6020'] },
  { id: 'p6', name: 'Requeijão de Corte', producer: 'Laticínios Minas', price: 'R$ 19,90', rating: '4.9', colors: ['#f4e8c0', '#c0a040'] },
];

const FILTERS = ['Todos', 'Mais Vendidos', 'Menor Preço', 'Melhor Avaliado'];

export default function ListingScreen({ navigation, route }) {
  const category = route.params?.category;
  const [filter, setFilter] = useState('Todos');
  const [liked, setLiked] = useState(new Set());

  const toggleLike = (id) => setLiked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category?.label || 'Queijos'}</Text>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Ionicons name="options-outline" size={20} color={C.brown} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.count}>{PRODUCTS.length} produtos encontrados</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {PRODUCTS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { product: p })}
            activeOpacity={0.9}
          >
            <LinearGradient colors={p.colors} style={styles.cardImg}>
              {p.sale && (
                <View style={styles.saleBadge}>
                  <Text style={styles.saleBadgeText}>−{p.sale}%</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => toggleLike(p.id)} style={styles.likeBtn}>
                <Ionicons name={liked.has(p.id) ? 'heart' : 'heart-outline'} size={14} color={liked.has(p.id) ? C.terra : C.brown} />
              </TouchableOpacity>
            </LinearGradient>
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={2}>{p.name}</Text>
              <Text style={styles.cardProducer}>{p.producer}</Text>
              <View style={styles.cardRating}>
                <Ionicons name="star" size={11} color={C.ochre} />
                <Text style={styles.ratingText}>{p.rating}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>{p.price}</Text>
                <TouchableOpacity style={styles.addBtn}>
                  <Ionicons name="add" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  filterIconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  filtersRow: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  filterChip: { height: 34, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: C.brown, borderWidth: 0 },
  filterText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  filterTextActive: { color: '#fff', fontFamily: 'WorkSans_600SemiBold' },
  count: { paddingHorizontal: 20, paddingBottom: 12, fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, paddingBottom: 20 },
  card: { width: '47.5%', backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  cardImg: { width: '100%', aspectRatio: 1 },
  saleBadge: { position: 'absolute', top: 9, left: 9, backgroundColor: C.terra, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  saleBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'WorkSans_600SemiBold' },
  likeBtn: { position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 11, gap: 3 },
  cardName: { fontSize: 13, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold', lineHeight: 17 },
  cardProducer: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 10.5, color: C.muted, fontFamily: 'WorkSans_600SemiBold' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  addBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
});
