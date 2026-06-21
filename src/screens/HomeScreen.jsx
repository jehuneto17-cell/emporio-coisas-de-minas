import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { C, fmt } from '../theme';
import { getProducts, getCategories, getBanners, getProductsByCategory } from '../services/firestore';
import { Jar, Cake, Pepper, FireSimple, Bread, Wine, ShoppingBag } from 'phosphor-react-native';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from './NotificationsPanel';

const { width: SW } = Dimensions.get('window');
const CARD_W        = 168;
const GRID_W        = (SW - 20 * 2 - 10) / 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia! 👋';
  if (h < 18) return 'Boa tarde! ☀️';
  return 'Boa noite! 🌙';
}

function productImage(p) {
  return p?.images?.[0] || p?.imageUrl || null;
}

// ─── ProductCard (horizontal list) ───────────────────────────────────────────

function ProductCard({ product, onAddCart, onToggleFav, isFav, onPress, style }) {
  const img = productImage(product);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(product)} style={[productCardStyles.card, style]}>
      {/* Image / gradient fallback */}
      <View style={productCardStyles.imgWrap}>
        {img ? (
          <Image source={{ uri: img }} style={productCardStyles.img} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[C.brown, C.terra]}
            style={productCardStyles.img}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        {/* Sale badge */}
        {product.sale > 0 && (
          <View style={productCardStyles.saleBadge}>
            <Text style={productCardStyles.saleBadgeText}>-{product.sale}%</Text>
          </View>
        )}
        {/* Fav button */}
        <TouchableOpacity
          onPress={() => onToggleFav(product)}
          style={productCardStyles.favBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={18}
            color={isFav ? '#e53935' : C.subtle}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={productCardStyles.info}>
        <Text style={productCardStyles.producer} numberOfLines={1}>{product.producer || ''}</Text>
        <Text style={productCardStyles.name} numberOfLines={2}>{product.name}</Text>
        {product.rating > 0 && (
          <View style={productCardStyles.ratingRow}>
            <Ionicons name="star" size={11} color={C.ochre} />
            <Text style={productCardStyles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
          </View>
        )}
        <View style={productCardStyles.priceRow}>
          <Text style={productCardStyles.price}>{fmt(product.price)}</Text>
          <TouchableOpacity onPress={() => onAddCart(product)} style={productCardStyles.addBtn}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const productCardStyles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.brown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 2,
  },
  imgWrap: { width: '100%', aspectRatio: 1, position: 'relative' },
  img: { width: '100%', height: '100%' },
  saleBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#e53935', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  saleBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: '#fff' },
  favBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { padding: 10 },
  producer: { fontFamily: 'WorkSans_400Regular', fontSize: 11, color: C.subtle, marginBottom: 2 },
  name: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: C.ink, lineHeight: 18, minHeight: 36 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  ratingText: { fontFamily: 'WorkSans_400Regular', fontSize: 11, color: C.muted },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  price: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: C.terra },
  addBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center',
  },
});

// ─── ProductGridCard (2-col grid) ─────────────────────────────────────────────

function ProductGridCard({ product, onAddCart, onToggleFav, isFav, onPress }) {
  const img = productImage(product);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(product)} style={[gridCardStyles.card, { width: GRID_W }]}>
      <View style={gridCardStyles.imgWrap}>
        {img ? (
          <Image source={{ uri: img }} style={gridCardStyles.img} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[C.brown, C.terra]} style={gridCardStyles.img} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
        {product.sale > 0 && (
          <View style={productCardStyles.saleBadge}>
            <Text style={productCardStyles.saleBadgeText}>-{product.sale}%</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => onToggleFav(product)}
          style={productCardStyles.favBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? '#e53935' : C.subtle} />
        </TouchableOpacity>
      </View>
      <View style={gridCardStyles.info}>
        <Text style={gridCardStyles.producer} numberOfLines={1}>{product.producer || ''}</Text>
        <Text style={gridCardStyles.name} numberOfLines={2}>{product.name}</Text>
        {product.rating > 0 && (
          <View style={productCardStyles.ratingRow}>
            <Ionicons name="star" size={11} color={C.ochre} />
            <Text style={productCardStyles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
          </View>
        )}
        <View style={productCardStyles.priceRow}>
          <Text style={gridCardStyles.price}>{fmt(product.price)}</Text>
          <TouchableOpacity onPress={() => onAddCart(product)} style={productCardStyles.addBtn}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const gridCardStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
    shadowColor: C.brown, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09, shadowRadius: 10, elevation: 2,
  },
  imgWrap: { width: '100%', aspectRatio: 1, position: 'relative' },
  img: { width: '100%', height: '100%' },
  info: { padding: 10 },
  producer: { fontFamily: 'WorkSans_400Regular', fontSize: 11, color: C.subtle, marginBottom: 2 },
  name: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: C.ink, lineHeight: 17, minHeight: 34 },
  price: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: C.terra },
});

// ─── Banner Carousel ──────────────────────────────────────────────────────────

function BannerCarousel({ banners, onPress }) {
  const [active, setActive] = useState(0);
  const scrollRef           = useRef(null);
  const timer               = useRef(null);
  const list                = banners.filter((b) => b.active !== false);

  const startTimer = useCallback(() => {
    clearInterval(timer.current);
    if (list.length < 2) return;
    timer.current = setInterval(() => setActive((prev) => {
      const next = (prev + 1) % list.length;
      scrollRef.current?.scrollTo({ x: next * (SW - 40), animated: true });
      return next;
    }), 4500);
  }, [list.length]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timer.current);
  }, [startTimer]);

  if (!list.length) return null;

  return (
    <View style={bannerStyles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (SW - 40));
          setActive(idx);
          startTimer();
        }}
        style={{ width: SW - 40 }}
      >
        {list.map((b) => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.92}
            onPress={() => b.productId && onPress(b.productId)}
            style={[bannerStyles.slide, { width: SW - 40 }]}
          >
            <LinearGradient
              colors={[b.bg || C.brown, b.bg2 || C.terra]}
              style={bannerStyles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {b.badge && (
                <View style={bannerStyles.badge}>
                  <Text style={bannerStyles.badgeText}>{b.badge}</Text>
                </View>
              )}
              {b.title && <Text style={bannerStyles.title}>{b.title}</Text>}
              {b.subtitle && <Text style={bannerStyles.subtitle}>{b.subtitle}</Text>}
              {b.imageUrl && (
                <Image
                  source={{ uri: b.imageUrl }}
                  style={bannerStyles.img}
                  resizeMode="cover"
                />
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Dots */}
      {list.length > 1 && (
        <View style={bannerStyles.dots}>
          {list.map((_, i) => (
            <View key={i} style={[bannerStyles.dot, i === active && bannerStyles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: { marginHorizontal: 20, borderRadius: 18, overflow: 'hidden' },
  slide: { aspectRatio: 2.13 },
  gradient: { flex: 1, padding: 20, justifyContent: 'flex-end', position: 'relative' },
  img: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: C.ochre, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: C.brown },
  title: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: '#fff', lineHeight: 25, maxWidth: '55%' },
  subtitle: { fontFamily: 'WorkSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.80)', marginTop: 4, maxWidth: '55%' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { backgroundColor: C.terra, width: 18 },
});

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }) {
  return (
    <View style={sectionStyles.header}>
      <Text style={sectionStyles.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={sectionStyles.seeAll}>Ver todos →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  title:  { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: C.brown },
  seeAll: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: C.terra },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { user }                        = useAuth();
  const { addItem }                     = useCart();
  const { favorites, toggleFavorite }   = useFavorites();
  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [banners, setBanners]           = useState([]);
  const [doces, setDoces]               = useState([]);
  const [antepastos, setAntepastos]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [unreadNotif, setUnreadNotif]   = useState(0);

  // Load data
  useEffect(() => {
    Promise.all([
      getProducts(),
      getCategories(),
      getBanners(),
      getProductsByCategory('TyLolkWBnAXMLgxCwL75'),
      getProductsByCategory('gAFuanOffULW48wD066v'),
    ]).then(([prods, cats, bans, docesData, antepastosData]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setBanners(Array.isArray(bans) ? bans : []);
      setDoces(Array.isArray(docesData) ? docesData.slice(0, 6) : []);
      setAntepastos(Array.isArray(antepastosData) ? antepastosData.slice(0, 6) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Badge do sino
  useEffect(() => {
    if (!user?.uid) return;
    getUnreadCount(user.uid).then(setUnreadNotif).catch(() => {});
  }, [user?.uid]);

  // Derived lists
  const featured = useMemo(() => products.filter((p) => p.featured), [products]);

  const newArrivals = useMemo(() =>
    [...products]
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .slice(0, 4),
    [products]
  );


  const isFav = useCallback((p) => favorites?.some?.((f) => f.id === p.id) || false, [favorites]);

  const handleAddCart    = useCallback((p) => addItem({ ...p, qty: 1 }),  [addItem]);
  const handleToggleFav  = useCallback((p) => toggleFavorite(p),          [toggleFavorite]);
  const handleProductNav = useCallback((p) => navigation.navigate('ProductDetail', { product: p }), [navigation]);
  const handleBannerPress = useCallback((productId) => {
    navigation.navigate('ProductDetail', { productId });
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.terra} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── 1. Header ── */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={C.terra} />
            <Text style={styles.locationText}>Itaú de Minas, MG</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationsPanel')}
            style={styles.bellBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={C.brown} />
            {unreadNotif > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotif > 9 ? '9+' : unreadNotif}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── 2. Greeting + search ── */}
        <View style={styles.greetingWrap}>
          <Text style={styles.greetText}>{greeting()}</Text>
          <Text style={styles.brandName}>Empório Coisas{'\n'}de Minas</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Search')}
          style={styles.searchBar}
        >
          <Ionicons name="search-outline" size={18} color={C.subtle} />
          <Text style={styles.searchPlaceholder}>Buscar produtos, produtores…</Text>
        </TouchableOpacity>

        {/* ── 3. Banners ── */}
        {banners.length > 0 && (
          <View style={styles.section}>
            <BannerCarousel banners={banners} onPress={handleBannerPress} />
          </View>
        )}

        {/* ── 4. Categories ── */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Categorias" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
              style={{ marginTop: 14 }}
            >
              {categories
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Listing', { category: cat })}
                    style={styles.catItem}
                  >
                    <View style={styles.catCircle}>
                      {getCatIcon(cat.name, 26, C.terra)}
                    </View>
                    <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* ── 5. Destaques ── */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Destaques" onSeeAll={() => navigation.navigate('Listing', { filter: 'featured' })} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hListContent}
              style={{ marginTop: 14 }}
            >
              {featured.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddCart={handleAddCart}
                  onToggleFav={handleToggleFav}
                  isFav={isFav(p)}
                  onPress={handleProductNav}
                  style={{ marginRight: 12 }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── 6. Novidades ── */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Novidades" onSeeAll={() => navigation.navigate('Listing', { filter: 'new' })} />
            <View style={styles.grid}>
              {newArrivals.map((p) => (
                <ProductGridCard
                  key={p.id}
                  product={p}
                  onAddCart={handleAddCart}
                  onToggleFav={handleToggleFav}
                  isFav={isFav(p)}
                  onPress={handleProductNav}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── 7. Doces em Geral ── */}
        {doces.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Doces em Geral"
              onSeeAll={() => navigation.navigate('Subcategory', { category: { id: 'TyLolkWBnAXMLgxCwL75', name: 'Doces em Geral' } })}
            />
            <View style={styles.grid}>
              {doces.slice(0, 4).map((p) => (
                <ProductGridCard
                  key={p.id}
                  product={p}
                  onAddCart={handleAddCart}
                  onToggleFav={handleToggleFav}
                  isFav={isFav(p)}
                  onPress={handleProductNav}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── 8. Antepastos, Patês e Pastas ── */}
        {antepastos.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Antepastos, Patês e Pastas"
              onSeeAll={() => navigation.navigate('Subcategory', { category: { id: 'gAFuanOffULW48wD066v', name: 'Antepastos, Patês e Pastas' } })}
            />
            <View style={styles.grid}>
              {antepastos.slice(0, 4).map((p) => (
                <ProductGridCard
                  key={p.id}
                  product={p}
                  onAddCart={handleAddCart}
                  onToggleFav={handleToggleFav}
                  isFav={isFav(p)}
                  onPress={handleProductNav}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.cream },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:     { paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: C.muted },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border, position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, color: '#fff' },

  // Greeting
  greetingWrap: { paddingHorizontal: 20, marginTop: 6, marginBottom: 14 },
  greetText:    { fontFamily: 'WorkSans_500Medium', fontSize: 14, color: C.muted },
  brandName:    { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 26, color: C.brown, lineHeight: 32, marginTop: 2 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 20,
    height: 48, borderRadius: 12, backgroundColor: C.card,
    paddingHorizontal: 14, borderWidth: 1, borderColor: C.border,
  },
  searchPlaceholder: { fontFamily: 'WorkSans_400Regular', fontSize: 14, color: C.subtle },

  // Sections
  section: { marginTop: 24 },

  // Categories
  categoriesRow: { paddingHorizontal: 20, gap: 16 },
  catItem:  { alignItems: 'center', gap: 7, width: 72 },
  catCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.softCream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  catEmoji: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
  catName:  { fontFamily: 'WorkSans_500Medium', fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 15 },

  // Horizontal product list
  hListContent: { paddingHorizontal: 20, paddingBottom: 4, gap: 0 },

  // 2-col grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 20, marginTop: 14,
  },
});
