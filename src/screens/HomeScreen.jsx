import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

const PRODUCTS = [
  { id: 'p1', name: 'Queijo Minas Frescal', producer: 'Fazenda Bom Retiro', rating: '4.9', price: 'R$ 22,90', sale: 20, colors: ['#f6e2c0', '#c98a3f'] },
  { id: 'p2', name: 'Café Especial Cerrado', producer: 'Sítio Boa Vista', rating: '4.8', price: 'R$ 34,90', colors: ['#a86434', '#3a1a08'] },
  { id: 'p3', name: 'Doce de Leite Cremoso', producer: 'Fazenda Pé da Serra', rating: '4.9', price: 'R$ 18,50', colors: ['#e3a96a', '#7a3c0e'] },
  { id: 'p4', name: 'Cachaça Ouro Velho', producer: 'Alambique Salinas', rating: '4.7', price: 'R$ 89,00', sale: 10, colors: ['#e9c071', '#8b5a14'] },
];

const SLIDES = [
  { badge: 'DESTAQUE DA SEMANA', title: 'Queijo Canastra Maturado 60 dias', sub: 'Direto do produtor · Serra da Canastra', colors: ['#52170c', '#6f2c1f'] },
  { badge: 'CHEGOU AGORA', title: 'Café Especial do Cerrado Mineiro', sub: 'Torra média · Notas de chocolate e caramelo', colors: ['#3a1a08', '#6f3514'] },
  { badge: 'EDIÇÃO LIMITADA', title: 'Doce de Leite de Tacho Cremoso', sub: 'Receita da fazenda · São Tomé das Letras', colors: ['#52170c', '#8a4112'] },
];

const CATS = [
  { id: 'queijos', label: 'Queijos', emoji: '🧀' },
  { id: 'cafes', label: 'Cafés', emoji: '☕' },
  { id: 'doces', label: 'Doces', emoji: '🍬' },
  { id: 'conservas', label: 'Conservas', emoji: '🫙' },
  { id: 'paes', label: 'Pães', emoji: '🍞' },
  { id: 'vinhos', label: 'Vinhos', emoji: '🍷' },
];

export default function HomeScreen({ navigation }) {
  const [slide, setSlide] = useState(0);
  const [cat, setCat] = useState('queijos');
  const [search, setSearch] = useState('');
  const [liked, setLiked] = useState(new Set(['p1']));
  const [cart, setCart] = useState(new Set(['p1', 'p2']));

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % 3), 4500);
    return () => clearInterval(t);
  }, []);

  const toggleLike = (id) => setLiked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const addToCart = (id) => setCart((s) => { const n = new Set(s); n.add(id); return n; });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Top nav */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.locationBtn}>
            <Ionicons name="location-sharp" size={13} color={C.terra} />
            <Text style={styles.locationText}>Itaú de Minas, MG</Text>
            <Ionicons name="chevron-down" size={10} color={C.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={20} color={C.brown} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingSub}>Bom dia! 👋</Text>
          <Text style={styles.greetingTitle}>Empório Coisas de Minas</Text>
          <View style={styles.divider} />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search-outline" size={16} color={C.subtle} />
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Buscar queijos, cafés, doces..."
              placeholderTextColor={C.subtle}
              style={styles.searchText}
              onFocus={() => navigation.navigate('Search')}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="options-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Promo Banner */}
        <View style={styles.bannerWrap}>
          <LinearGradient colors={SLIDES[slide].colors} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>{SLIDES[slide].badge}</Text>
              </View>
              <Text style={styles.bannerTitle}>{SLIDES[slide].title}</Text>
              <Text style={styles.bannerSub}>{SLIDES[slide].sub}</Text>
              <TouchableOpacity style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Ver oferta</Text>
                <Ionicons name="arrow-forward" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
            <LinearGradient colors={[SLIDES[slide].colors[0] + '88', C.ochre]} style={styles.bannerCircle} />
          </LinearGradient>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setSlide(i)}
                style={[styles.dot, i === slide && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorias</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATS.map((c) => {
            const on = c.id === cat;
            return (
              <TouchableOpacity key={c.id} onPress={() => setCat(c.id)} style={styles.catItem}>
                <View style={[styles.catCircle, on && styles.catCircleActive]}>
                  <Text style={styles.catEmoji}>{c.emoji}</Text>
                </View>
                <Text style={[styles.catLabel, on && styles.catLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Mais Vendidos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Listing')} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>Ver todos</Text>
            <Ionicons name="arrow-forward" size={12} color={C.terra} />
          </TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {PRODUCTS.map((p) => (
            <ProductCard
              key={p.id} product={p}
              liked={liked.has(p.id)} onLike={() => toggleLike(p.id)}
              inCart={cart.has(p.id)} onAdd={() => addToCart(p.id)}
              onPress={() => navigation.navigate('ProductDetail', { product: p })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ product: p, liked, onLike, inCart, onAdd, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient colors={p.colors} style={styles.cardImg}>
        {p.sale && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>−{p.sale}%</Text>
          </View>
        )}
        <TouchableOpacity onPress={onLike} style={styles.likeBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? C.terra : C.brown} />
        </TouchableOpacity>
      </LinearGradient>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{p.name}</Text>
        <Text style={styles.cardProducer}>{p.producer}</Text>
        <View style={styles.cardRating}>
          <Ionicons name="star" size={11} color={C.ochre} />
          <Text style={styles.cardRatingText}>{p.rating}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>{p.price}</Text>
          <TouchableOpacity onPress={onAdd} style={[styles.addBtn, inCart && styles.addBtnDone]}>
            <Ionicons name="add" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 12.5, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  bellBtn: { width: 38, height: 38, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: C.terra, borderWidth: 1.5, borderColor: '#fff' },
  greetingWrap: { paddingHorizontal: 20, paddingBottom: 14 },
  greetingSub: { fontSize: 12.5, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  greetingTitle: { marginTop: 2, fontSize: 22, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.5, lineHeight: 28 },
  divider: { height: 1, backgroundColor: C.border, marginTop: 14, opacity: 0.7 },
  searchRow: { paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, height: 44, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchText: { flex: 1, fontSize: 13.5, color: C.ink, fontFamily: 'WorkSans_400Regular' },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  bannerWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  banner: { borderRadius: 16, padding: 18, minHeight: 152, overflow: 'hidden', flexDirection: 'row' },
  bannerContent: { flex: 1, gap: 8 },
  bannerBadge: { alignSelf: 'flex-start', backgroundColor: C.terra, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  bannerBadgeText: { color: '#fff', fontSize: 9.5, fontFamily: 'WorkSans_600SemiBold', letterSpacing: 1 },
  bannerTitle: { fontSize: 16, color: C.cream, fontFamily: 'PlusJakartaSans_700Bold', lineHeight: 20, maxWidth: 165 },
  bannerSub: { fontSize: 11, color: C.rose, lineHeight: 16, maxWidth: 170, fontFamily: 'WorkSans_400Regular' },
  bannerBtn: { alignSelf: 'flex-start', backgroundColor: C.terra, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerBtnText: { color: '#fff', fontSize: 12, fontFamily: 'WorkSans_600SemiBold' },
  bannerCircle: { position: 'absolute', right: -22, top: -28, width: 150, height: 150, borderRadius: 75 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { width: 18, backgroundColor: C.terra },
  sectionHeader: { paddingHorizontal: 20, paddingBottom: 12, marginTop: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, marginTop: 18 },
  sectionTitle: { fontSize: 15.5, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 12, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  catScroll: { paddingHorizontal: 20, paddingBottom: 4, gap: 14 },
  catItem: { alignItems: 'center', gap: 6, minWidth: 58 },
  catCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.softCream, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  catCircleActive: { backgroundColor: C.brown, borderWidth: 0 },
  catEmoji: { fontSize: 24 },
  catLabel: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  catLabelActive: { color: C.brown, fontFamily: 'WorkSans_600SemiBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  card: { width: '47.5%', backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  cardImg: { width: '100%', aspectRatio: 1 },
  saleBadge: { position: 'absolute', top: 9, left: 9, backgroundColor: C.terra, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  saleBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'WorkSans_600SemiBold' },
  likeBtn: { position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 11, gap: 3 },
  cardName: { fontSize: 13, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold', lineHeight: 17 },
  cardProducer: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardRatingText: { fontSize: 10.5, color: C.muted, fontFamily: 'WorkSans_600SemiBold' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  addBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
  addBtnDone: { backgroundColor: C.brown },
});
