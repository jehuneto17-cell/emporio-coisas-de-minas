import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { getProducts, getProductsByCategory } from '../services/firestore';

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vendidos', label: 'Mais Vendidos' },
  { key: 'preco', label: 'Menor Preço' },
  { key: 'maior', label: 'Maior Preço' },
];

export default function ListingScreen({ navigation, route }) {
  const category = route.params?.category;
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [filter, setFilter] = useState('todos');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetch = category?.id
      ? getProductsByCategory(category.id)
      : getProducts();
    fetch
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category?.id]);

  const sorted = useMemo(() => {
    const list = [...products];
    if (filter === 'preco') return list.sort((a, b) => a.price - b.price);
    if (filter === 'maior') return list.sort((a, b) => b.price - a.price);
    if (filter === 'vendidos') return list.sort((a, b) => b.reviewCount - a.reviewCount);
    return list;
  }, [products, filter]);

  function renderProduct({ item: p }) {
    const img = (p.images && p.images[0]) || p.imageUrl || null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { product: p })}
        activeOpacity={0.9}
      >
        <LinearGradient colors={p.colors ?? ['#e0c090', '#a07030']} style={styles.cardImg}>
          {img && <Image source={{ uri: img }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />}
          {p.sale ? (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>−{p.sale}%</Text>
            </View>
          ) : null}
          <TouchableOpacity onPress={() => toggleFavorite(p)} style={styles.likeBtn}>
            <Ionicons name={isFavorite(p.id) ? 'heart' : 'heart-outline'} size={14} color={isFavorite(p.id) ? C.terra : C.brown} />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{p.name}</Text>
          <Text style={styles.cardProducer} numberOfLines={1}>{p.producer}</Text>
          <View style={styles.cardRating}>
            <Ionicons name="star" size={11} color={C.ochre} />
            <Text style={styles.ratingText}>{p.rating?.toFixed(1) ?? '—'}</Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>{fmt(p.price)}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => addItem({ ...p, qty: 1 })}>
              <Ionicons name="add" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category?.name || category?.label || 'Todos os Produtos'}
        </Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="options-outline" size={20} color={C.brown} />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={f => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              onPress={() => setFilter(f.key)}
              style={[styles.chip, filter === f.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Conteúdo */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={C.brown} size="large" />
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={52} color={C.border} />
          <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={p => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>
              {sorted.length} produto{sorted.length !== 1 ? 's' : ''} encontrado{sorted.length !== 1 ? 's' : ''}
            </Text>
          }
          renderItem={renderProduct}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.cream },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  backBtn:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { flex: 1, textAlign: 'center', fontSize: 17, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  filtersRow:      { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip:            { height: 34, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  chipActive:      { backgroundColor: C.brown, borderColor: C.brown },
  chipText:        { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  chipTextActive:  { color: '#fff', fontFamily: 'WorkSans_600SemiBold' },
  loading:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:       { fontSize: 15, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  count:           { paddingHorizontal: 20, paddingBottom: 12, fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  grid:            { paddingHorizontal: 16, paddingBottom: 24 },
  row:             { gap: 12, marginBottom: 12 },
  card:            { flex: 1, backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  cardImg:         { width: '100%', aspectRatio: 1 },
  saleBadge:       { position: 'absolute', top: 9, left: 9, backgroundColor: C.terra, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  saleBadgeText:   { color: '#fff', fontSize: 10, fontFamily: 'WorkSans_600SemiBold' },
  likeBtn:         { position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cardBody:        { padding: 11, gap: 3 },
  cardName:        { fontSize: 13, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold', lineHeight: 17 },
  cardProducer:    { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  cardRating:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText:      { fontSize: 10.5, color: C.muted, fontFamily: 'WorkSans_600SemiBold' },
  cardFooter:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice:       { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  addBtn:          { width: 28, height: 28, borderRadius: 14, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
});
