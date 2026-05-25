import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

const WEIGHTS = ['200g', '400g', '600g', '1kg'];

export default function ProductDetailScreen({ navigation, route }) {
  const [liked, setLiked] = useState(true);
  const [slide, setSlide] = useState(1);
  const [weight, setWeight] = useState('400g');
  const [qty, setQty] = useState(1);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image */}
        <LinearGradient colors={['#f1dca1', '#a87532']} style={styles.heroImg}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroNav}>
              <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color={C.brown} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtn} onPress={() => setLiked(!liked)}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? C.terra : C.subtle} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <View style={styles.dotsRow}>
            {[0,1,2,3,4].map((i) => (
              <TouchableOpacity key={i} onPress={() => setSlide(i)}
                style={[styles.dot, i === slide && styles.dotActive]} />
            ))}
          </View>
        </LinearGradient>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoTopRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>🧀 Queijos</Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={C.ochre} />
              <Text style={styles.ratingScore}>4.9</Text>
              <Text style={styles.ratingCount}>(128 avaliações)</Text>
            </View>
          </View>

          <Text style={styles.productName}>Queijo Canastra Maturado 60 dias</Text>

          <View style={styles.producerRow}>
            <LinearGradient colors={['#c89262', '#5a2b10']} style={styles.producerAvatar} />
            <View style={styles.producerInfo}>
              <Text style={styles.producerName}>Fazenda São João</Text>
              <Text style={styles.producerLocation}>Serra da Canastra · MG</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={11} color="#3a7a3a" />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Escolha o peso</Text>
          <View style={styles.weightsRow}>
            {WEIGHTS.map((w) => (
              <TouchableOpacity key={w} onPress={() => setWeight(w)}
                style={[styles.weightBtn, weight === w && styles.weightBtnActive]}>
                <Text style={[styles.weightBtnText, weight === w && styles.weightBtnTextActive]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Sobre o produto</Text>
          <Text style={styles.description}>
            Queijo artesanal produzido na Serra da Canastra com leite cru integral.
            Maturado por 60 dias, desenvolve casca firme e interior cremoso com notas
            de manteiga e ervas nativas...{' '}
            <Text style={styles.readMore}>Ler mais →</Text>
          </Text>

          <View style={styles.deliveryCard}>
            <Ionicons name="car-outline" size={16} color={C.terra} />
            <Text style={styles.deliveryText}>
              Entrega em até <Text style={styles.deliveryBold}>3 dias úteis</Text> · Frete a partir de <Text style={styles.deliveryBold}>R$ 15,90</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalWrap}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ 54,90</Text>
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
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Carrinho')}>
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
  readMore: { color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
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
});
