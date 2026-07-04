import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { getAllCategories, getSimilarProducts, getReviews, getUserReview, hasUserBoughtProduct, submitReview } from '../services/firestore';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

const DEFAULT_WEIGHTS = ['200g', '400g', '600g', '1kg'];

export default function ProductDetailScreen({ navigation, route }) {
  const product = route.params?.product ?? {};
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();

  const weights = product.weights ?? DEFAULT_WEIGHTS;
  const [slide, setSlide] = useState(1);
  const [weight, setWeight] = useState(weights[1] ?? weights[0]);
  const [qty, setQty] = useState(1);
  const [catName, setCatName] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [similares, setSimilares] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [localRating, setLocalRating] = useState(product.rating || 0);
  const [localReviewCount, setLocalReviewCount] = useState(product.reviewCount || 0);

  useEffect(() => {
    if (!product.category) return;
    getAllCategories()
      .then(cats => {
        const found = cats.find(c => c.id === product.category);
        if (found) setCatName(found.name);
      })
      .catch(() => {});
    getSimilarProducts(product.category, product.id)
      .then(setSimilares)
      .catch(() => {});

    // Carrega avaliações
    getReviews(product.id).then(setReviews).catch(() => {});

    // Verifica se usuário pode avaliar
    if (user?.uid) {
      Promise.all([
        hasUserBoughtProduct(user.uid, product.id),
        getUserReview(product.id, user.uid),
      ]).then(([bought, review]) => {
        setCanReview(bought);
        setUserReview(review);
        if (review) {
          setReviewRating(review.rating);
          setReviewComment(review.comment || '');
        }
      }).catch(() => {});
    }
  }, [product.id]);

  const liked = isFavorite(product.id);
  const heroColors = product.colors ?? ['#f1dca1', '#a87532'];
  const heroImage = (product.images && product.images[0]) || product.imageUrl || null;

  function handleAddToCart() {
    addItem({ ...product, price: product.promo || product.price, weight, qty });
    navigation.navigate('Main', { screen: 'Carrinho' });
  }

  function handleToggleFavorite() {
    toggleFavorite(product);
  }

  async function handleSubmitReview() {
    if (!reviewComment.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Por favor escreva um comentário.');
      } else {
        Alert.alert('Atenção', 'Por favor escreva um comentário.');
      }
      return;
    }
    setSubmittingReview(true);
    const userName = user?.displayName || 'Cliente';
    const success = await submitReview(product.id, user.uid, userName, reviewRating, reviewComment);
    setSubmittingReview(false);
    if (success) {
      setUserReview({ rating: reviewRating, comment: reviewComment });
      setShowReviewForm(false);
      getReviews(product.id).then(data => {
        setReviews(data);
        if (data.length > 0) {
          const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
          setLocalRating(Math.round(avg * 10) / 10);
          setLocalReviewCount(data.length);
        }
      }).catch(() => {});
      if (Platform.OS === 'web') {
        window.alert('Avaliação enviada com sucesso!');
      } else {
        Alert.alert('Obrigado!', 'Sua avaliação foi enviada.');
      }
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image — foto real se disponível, gradiente como placeholder */}
        <LinearGradient colors={heroColors} style={styles.heroImg}>
          {heroImage && (
            <Image
              source={{ uri: heroImage }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          )}
          <SafeAreaView edges={['top']}>
            <View style={styles.heroNav}>
              <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color={C.brown} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtn} onPress={handleToggleFavorite}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? C.terra : C.subtle} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <TouchableOpacity key={i} onPress={() => setSlide(i)}
                style={[styles.dot, i === slide && styles.dotActive]} />
            ))}
          </View>
        </LinearGradient>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoTopRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>
                {catName || 'Produto'}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={C.ochre} />
              <Text style={styles.ratingScore}>{localRating > 0 ? localRating.toFixed(1) : '—'}</Text>
              <Text style={styles.ratingCount}>
                {localReviewCount > 0 ? `(${localReviewCount} avaliações)` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.productName}>{product.name ?? 'Produto'}</Text>

          <View style={styles.producerRow}>
            <LinearGradient colors={[heroColors[0], heroColors[1]]} style={styles.producerAvatar} />
            <View style={styles.producerInfo}>
              <Text style={styles.producerName}>{product.producer ?? '—'}</Text>
              <Text style={styles.producerLocation}>{product.location ?? 'Minas Gerais · MG'}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={11} color="#3a7a3a" />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {weights.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Escolha o peso</Text>
              <View style={styles.weightsRow}>
                {weights.map((w) => (
                  <TouchableOpacity key={w} onPress={() => setWeight(w)}
                    style={[styles.weightBtn, weight === w && styles.weightBtnActive]}>
                    <Text style={[styles.weightBtnText, weight === w && styles.weightBtnTextActive]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {(product.description || product.longDesc) && (
            <>
              <Text style={styles.sectionLabel}>Sobre o produto</Text>
              {product.description && (
                <Text style={styles.description}>{product.description}</Text>
              )}
              {product.longDesc && !expanded && (
                <TouchableOpacity onPress={() => setExpanded(true)} style={styles.lerMaisBtn}>
                  <Text style={styles.lerMaisText}>Ler mais →</Text>
                </TouchableOpacity>
              )}
              {product.longDesc && expanded && (
                <>
                  <View style={{ marginTop: 8 }}>
                    {product.longDesc.split('\n').filter(l => l.trim()).map((line, i) => (
                      <Text key={i} style={[styles.description, { marginBottom: 8 }]}>{line.trim()}</Text>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => setExpanded(false)} style={styles.lerMaisBtn}>
                    <Text style={styles.lerMaisText}>Ler menos ↑</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <View style={styles.deliveryCard}>
            <Ionicons name="car-outline" size={16} color={C.terra} />
            <Text style={styles.deliveryText}>
              {product.weight > 0
                ? `Produto de ${product.weight < 1 ? `${Math.round(product.weight * 1000)}g` : `${product.weight}kg`} · `
                : ''}
              <Text style={styles.deliveryBold}>Frete calculado no checkout</Text>
            </Text>
          </View>

          <View style={[styles.divider, { marginTop: 20 }]} />
          <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Avaliações</Text>

          {/* Resumo de avaliações */}
          {reviews.length > 0 && (
            <View style={styles.reviewSummary}>
              <Text style={styles.reviewAvgNum}>
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </Text>
              <View>
                <View style={{ flexDirection: 'row', gap: 3, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <Ionicons key={i}
                      name={i <= Math.round(reviews.reduce((s,r) => s+r.rating,0)/reviews.length) ? 'star' : 'star-outline'}
                      size={14} color={C.ochre} />
                  ))}
                </View>
                <Text style={styles.reviewCountText}>{reviews.length} avaliação(ões)</Text>
              </View>
            </View>
          )}

          {/* Lista de avaliações */}
          {reviews.slice(0, 3).map((r, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>
                    {(r.userName || 'C')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewName}>{r.userName || 'Cliente'}</Text>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1,2,3,4,5].map(i => (
                      <Ionicons key={i} name={i <= r.rating ? 'star' : 'star-outline'} size={11} color={C.ochre} />
                    ))}
                  </View>
                </View>
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
            </View>
          ))}

          {/* Botão ou formulário de avaliação */}
          {canReview && !userReview && !showReviewForm && (
            <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReviewForm(true)}>
              <Ionicons name="star-outline" size={16} color={C.terra} />
              <Text style={styles.reviewBtnText}>Avaliar este produto</Text>
            </TouchableOpacity>
          )}

          {canReview && userReview && (
            <View style={styles.reviewedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#3a7a3a" />
              <Text style={styles.reviewedText}>Você já avaliou este produto</Text>
            </View>
          )}

          {!canReview && user && (
            <Text style={styles.cantReviewText}>
              Apenas quem comprou este produto pode avaliar.
            </Text>
          )}

          {showReviewForm && (
            <View style={styles.reviewForm}>
              <Text style={styles.sectionLabel}>Sua avaliação</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[1,2,3,4,5].map(i => (
                  <TouchableOpacity key={i} onPress={() => setReviewRating(i)}>
                    <Ionicons name={i <= reviewRating ? 'star' : 'star-outline'} size={32} color={C.ochre} />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Conte sua experiência com o produto..."
                placeholderTextColor={C.subtle}
                multiline
                numberOfLines={4}
                style={styles.reviewInput}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.reviewSubmitBtn, { backgroundColor: '#f0ede9', flex: 1 }]}
                  onPress={() => setShowReviewForm(false)}
                >
                  <Text style={[styles.reviewSubmitText, { color: C.muted }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reviewSubmitBtn, { flex: 2 }]}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  <Text style={styles.reviewSubmitText}>
                    {submittingReview ? 'Enviando...' : 'Enviar avaliação'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {similares.length > 0 && (
            <>
              <View style={[styles.divider, { marginTop: 20 }]} />
              <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Produtos similares</Text>
              <View style={styles.similarGrid}>
                {similares.map(p => {
                  const img = (p.images && p.images[0]) || p.imageUrl || null;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.similarCard}
                      onPress={() => navigation.replace('ProductDetail', { product: p })}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={p.colors ?? ['#e0c090', '#a07030']} style={styles.similarImg}>
                        {img && <Image source={{ uri: img }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />}
                      </LinearGradient>
                      <View style={{ padding: 10 }}>
                        <Text style={styles.similarName} numberOfLines={2}>{p.name}</Text>
                        <Text style={styles.similarPrice}>{fmt(p.price)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalWrap}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmt((product.price ?? 0) * qty)}</Text>
        </View>
        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}>
            <Ionicons name="remove" size={14} color={C.brown} />
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{qty}</Text>
          <TouchableOpacity onPress={() => setQty(qty + 1)} style={[styles.qtyBtn, styles.qtyBtnActive]}>
            <Ionicons name="add" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
          <Text style={styles.addBtnText}>Adicionar</Text>
          <Ionicons name="cart-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  heroImg: { width: '100%', height: 380, justifyContent: 'space-between' },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  heroBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.65)' },
  dotActive: { width: 16, backgroundColor: C.terra },
  infoCard: { backgroundColor: C.card, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  infoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { backgroundColor: '#fdddc8', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  catBadgeText: { color: C.brown, fontSize: 11, fontFamily: 'WorkSans_600SemiBold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingScore: { fontSize: 13, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  ratingCount: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  productName: { marginTop: 12, marginBottom: 14, fontSize: 22, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold', lineHeight: 28 },
  producerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  producerAvatar: { width: 32, height: 32, borderRadius: 16 },
  producerInfo: { flex: 1 },
  producerName: { fontSize: 13, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  producerLocation: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 1 },
  verifiedBadge: { backgroundColor: '#e7f1e6', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 10.5, color: '#3a7a3a', fontFamily: 'WorkSans_600SemiBold' },
  divider: { height: 1, backgroundColor: C.border, opacity: 0.7, marginVertical: 16 },
  sectionLabel: { fontSize: 13, color: C.brown, fontFamily: 'WorkSans_600SemiBold', marginBottom: 10 },
  weightsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  weightBtn: { flex: 1, height: 40, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  weightBtnActive: { backgroundColor: C.brown, borderWidth: 0 },
  weightBtnText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  weightBtnTextActive: { color: '#fff', fontFamily: 'WorkSans_600SemiBold' },
  description: { fontSize: 14, color: C.muted, lineHeight: 22, fontFamily: 'WorkSans_400Regular', marginBottom: 16 },
  lerMaisBtn: { marginTop: 4, marginBottom: 8 },
  lerMaisText: { fontSize: 13, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  deliveryCard: { backgroundColor: '#f6f3ef', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  deliveryText: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', flex: 1, lineHeight: 18 },
  deliveryBold: { color: C.brown, fontFamily: 'WorkSans_600SemiBold' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 30, flexDirection: 'row', alignItems: 'center', gap: 14 },
  totalWrap: { gap: 4 },
  totalLabel: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  totalValue: { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  qtyBtnActive: { backgroundColor: C.brown, borderWidth: 0 },
  qtyNum: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', minWidth: 16, textAlign: 'center' },
  addBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: C.terra, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' },
  similarGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  similarCard:  { width: '47.5%', backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  similarImg:   { width: '100%', aspectRatio: 1 },
  similarName:  { fontSize: 13, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', lineHeight: 17, marginBottom: 4 },
  similarPrice: { fontSize: 14, color: C.terra, fontFamily: 'PlusJakartaSans_700Bold' },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#f6f3ef', borderRadius: 12, padding: 14, marginBottom: 12 },
  reviewAvgNum: { fontSize: 36, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  reviewCountText: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  reviewCard: { backgroundColor: '#f6f3ef', borderRadius: 12, padding: 14, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  reviewName: { fontSize: 13, color: C.brown, fontFamily: 'WorkSans_600SemiBold', marginBottom: 2 },
  reviewComment: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', lineHeight: 19 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: C.terra, borderRadius: 10, padding: 12, marginTop: 8 },
  reviewBtnText: { fontSize: 14, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  reviewedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e7f1e6', borderRadius: 10, padding: 12, marginTop: 8 },
  reviewedText: { fontSize: 13, color: '#3a7a3a', fontFamily: 'WorkSans_600SemiBold' },
  cantReviewText: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  reviewForm: { backgroundColor: '#f6f3ef', borderRadius: 12, padding: 16, marginTop: 8 },
  reviewInput: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 12, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular', minHeight: 100, textAlignVertical: 'top', outlineStyle: 'none' },
  reviewSubmitBtn: { backgroundColor: C.terra, borderRadius: 10, padding: 13, alignItems: 'center', justifyContent: 'center' },
  reviewSubmitText: { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
