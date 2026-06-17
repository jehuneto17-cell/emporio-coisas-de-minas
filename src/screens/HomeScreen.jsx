import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator, Image, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { getProducts, getCategories, getBanners, getProductById } from '../services/firestore';
import { Jar, Cake, Pepper, FireSimple, Bread, Wine, ShoppingBag } from 'phosphor-react-native';

function getCatIcon(name = '', size = 28, color = '#964904') {
  const n = name.toLowerCase();
  if (n.includes('antepasto') || n.includes('patê') || n.includes('pasta')) return <Jar size={size} color={color} weight="light" />;
  if (n.includes('doce'))      return <Cake size={size} color={color} weight="light" />;
  if (n.includes('geleia'))    return <Pepper size={size} color={color} weight="light" />;
  if (n.includes('pimenta') || n.includes('molho')) return <FireSimple size={size} color={color} weight="light" />;
  if (n.includes('torrada') || n.includes('pão') || n.includes('pao')) return <Bread size={size} color={color} weight="light" />;
  if (n.includes('vinho'))     return <Wine size={size} color={color} weight="light" />;
  return <ShoppingBag size={size} color={color} weight="light" />;
}

export default function HomeScreen({ navigation }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [slide, setSlide] = useState(0);
  const slideRef = React.useRef(0);
  const [cat, setCat] = useState('');
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const screenWidth = Dimensions.get('window').width - 40;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [nextSlide, setNextSlide] = React.useState(null);
  const nextSlideAnim = React.useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBanners().then(setBanners).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (slideRef.current + 1) % Math.max(banners.length, 1);
      goToSlide(next);
    }, 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  function goToSlide(next) {
    if (next === slideRef.current) return;
    slideRef.current = next;
    setNextSlide(next);
    nextSlideAnim.setValue(screenWidth);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(nextSlideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSlide(next);
      setNextSlide(null);
      slideAnim.setValue(0);
      nextSlideAnim.setValue(0);
    });
  }

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
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('NotificationsPanel')}
          >
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
        {banners.length > 0 && (
          <View style={styles.bannerWrap}>
            <View style={{ overflow: 'hidden', borderRadius: 16 }}>
              {/* Banner atual */}
              <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
                <LinearGradient
                  colors={[banners[slide]?.bg || '#52170c', banners[slide]?.bg2 || '#6f2c1f']}
                  style={styles.banner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {banners[slide]?.imageUrl ? (
                    <Image source={{ uri: banners[slide].imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
                  ) : (
                    <View style={styles.bannerContent}>
                      {banners[slide]?.badge ? <View style={styles.bannerBadge}><Text style={styles.bannerBadgeText}>{banners[slide].badge}</Text></View> : null}
                      <Text style={styles.bannerTitle}>{banners[slide]?.title}</Text>
                      <Text style={styles.bannerSub}>{banners[slide]?.subtitle}</Text>
                    </View>
                  )}
                  {!banners[slide]?.imageUrl && <LinearGradient colors={[banners[slide]?.bg + '88' || '#52170c88', C.ochre]} style={styles.bannerCircle} />}
                  <TouchableOpacity style={[StyleSheet.absoluteFillObject, { justifyContent: 'flex-end', padding: 16 }]} activeOpacity={0.9}
                    onPress={() => { const b = banners[slide]; if (b?.productId) getProductById(b.productId).then(p => { if (p) navigation.navigate('ProductDetail', { product: p }); }); }} />
                </LinearGradient>
              </Animated.View>

              {/* Próximo banner — aparece por baixo deslizando */}
              {nextSlide !== null && banners[nextSlide] && (
                <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transform: [{ translateX: nextSlideAnim }] }}>
                  <LinearGradient
                    colors={[banners[nextSlide]?.bg || '#52170c', banners[nextSlide]?.bg2 || '#6f2c1f']}
                    style={styles.banner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {banners[nextSlide]?.imageUrl ? (
                      <Image source={{ uri: banners[nextSlide].imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
                    ) : (
                      <View style={styles.bannerContent}>
                        {banners[nextSlide]?.badge ? <View style={styles.bannerBadge}><Text style={styles.bannerBadgeText}>{banners[nextSlide].badge}</Text></View> : null}
                        <Text style={styles.bannerTitle}>{banners[nextSlide]?.title}</Text>
                        <Text style={styles.bannerSub}>{banners[nextSlide]?.subtitle}</Text>
                      </View>
                    )}
                    {!banners[nextSlide]?.imageUrl && <LinearGradient colors={[banners[nextSlide]?.bg + '88' || '#52170c88', C.ochre]} style={styles.bannerCircle} />}
                  </LinearGradient>
                </Animated.View>
              )}
            </View>

            <View style={styles.dotsRow}>
              {banners.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToSlide(i)}
                  style={[styles.dot, i === slide && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorias</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map((c) => {
            const on = c.id === cat;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  setCat(c.id);
                  navigation.navigate('Listing', { category: c });
                }}
                style={styles.catItem}
              >
                <View style={[styles.catCircle, on && styles.catCircleActive]}>
                  {getCatIcon(c.name, 26, on ? '#fff' : '#964904')}
                </View>
                <Text style={[styles.catLabel, on && styles.catLabelActive]}>{c.name}</Text>
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

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={C.brown} />
          </View>
        ) : (
          <View style={styles.grid}>
            {products.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                liked={isFavorite(p.id)}
                onLike={() => toggleFavorite(p)}
                inCart={false}
                onAdd={() => addItem({ ...p, qty: 1 })}
                onPress={() => navigation.navigate('ProductDetail', { product: p })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ product: p, liked, onLike, inCart, onAdd, onPress }) {
  const heroImage = (p.images && p.images[0]) || p.imageUrl || null;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient colors={p.colors ?? ['#e0c090', '#a07030']} style={styles.cardImg}>
        {heroImage && (
          <Image
            source={{ uri: heroImage }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        )}
        {p.sale && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>−{p.sale}%</Text>
          </View>
        )}
        <TouchableOpacity onPress={onLike} style={styles.likeBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? C.brown : C.subtle} />
        </TouchableOpacity>
      </LinearGradient>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{p.name}</Text>
        <Text style={styles.cardProducer}>{p.producer}</Text>
        <View style={styles.cardRating}>
          <Ionicons name="star" size={11} color={C.ochre} />
          <Text style={styles.cardRatingText}>{p.rating?.toFixed(1) ?? '—'}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>{fmt(p.price)}</Text>
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
  banner: { borderRadius: 16, overflow: 'hidden', flexDirection: 'row', width: '100%', aspectRatio: 2.13 },
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
  catLabel: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  catLabelActive: { color: C.brown, fontFamily: 'WorkSans_600SemiBold' },
  loadingWrap: { height: 200, alignItems: 'center', justifyContent: 'center' },
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
