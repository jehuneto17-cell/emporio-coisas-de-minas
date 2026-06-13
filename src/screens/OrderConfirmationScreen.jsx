import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getOrder } from '../services/firestore';

// Dados de fallback exibidos para visitantes ou quando o pedido não carrega.
const ITEMS_MOCK = [
  { name: 'Queijo Canastra Maturado · 400g', price: 'R$ 54,90', colors: ['#efd7a0', '#b88a3e'] },
  { name: 'Café Especial Cerrado · 250g',    price: 'R$ 69,80', colors: ['#8a4f30', '#3a1d0e'] },
  { name: 'Doce de Leite Cremoso · 350g',    price: 'R$ 18,50', colors: ['#e3a96a', '#7a3c0e'], badge: '−20%' },
];

const STEPS = ['Confirmado', 'Preparando', 'Enviado', 'Entregue'];

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PAY_LABELS = { card: 'Cartão', boleto: 'Boleto', pix: 'Pix' };

export default function OrderConfirmationScreen({ navigation, route }) {
  const { orderId } = route.params ?? {};
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !user?.uid) {
      setLoading(false);
      return;
    }
    getOrder(user.uid, orderId)
      .then((data) => setOrder(data))
      .catch((e) => console.warn('[OrderConfirmation]', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={C.brown} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const displayItems  = order?.items   ?? ITEMS_MOCK;
  const displayTotal  = order           ? fmt(order.total)           : 'R$ 148,10';
  const displayNum    = order           ? `#${orderId.slice(-6)}`    : '#1043';
  const displayDate   = order           ? formatDate(order.createdAt): '24 Mai 2026';
  const displayMethod = PAY_LABELS[order?.paymentMethod] ?? 'Pix';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Confirmação</Text>
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {['Carrinho', 'Pagamento', 'Confirmação'].map((s, i) => (
          <React.Fragment key={i}>
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, { backgroundColor: C.brown }]}>
                <Ionicons name="checkmark" size={13} color="#fff" />
              </View>
              <Text style={[styles.progressLabel, i === 2 && styles.labelActive]}>{s}</Text>
            </View>
            {i < 2 && <View style={[styles.progressLine, { backgroundColor: C.brown }]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Success Hero */}
        <View style={styles.successHero}>
          <View style={styles.ringOuter}>
            <View style={styles.ringMid}>
              <View style={styles.ringInner}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={36} color={C.greenFg} />
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.successTitle}>Pedido Confirmado!</Text>
          <Text style={styles.successSub}>Seu pagamento foi aprovado com sucesso</Text>
        </View>

        {/* Order Number */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.orderNumWrap}>
              <Text style={styles.orderNumLabel}>Pedido</Text>
              <Text style={styles.orderNum}>{displayNum}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.orderMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={C.muted} />
                <Text style={styles.metaText}>{displayDate}</Text>
              </View>
              <View style={styles.metaSep} />
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={C.muted} />
                <Text style={styles.metaText}>Entrega em 3–5 dias</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumo do Pedido</Text>
            <View style={{ gap: 12 }}>
              {displayItems.map((it, i) => {
                const colors  = it.colors?.length ? it.colors : ['#e0c090', '#a07030'];
                const priceStr = order ? fmt(it.price * (it.qty ?? 1)) : it.price;
                const badge    = order ? (it.sale > 0 ? `−${it.sale}%` : null) : it.badge;
                return (
                  <View key={i} style={styles.summaryItem}>
                    <LinearGradient colors={colors} style={styles.itemImg} />
                    <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                    <View style={styles.itemRight}>
                      {badge && (
                        <View style={styles.itemBadge}>
                          <Text style={styles.itemBadgeText}>{badge}</Text>
                        </View>
                      )}
                      <Text style={styles.itemPrice}>{priceStr}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total pago</Text>
              <Text style={styles.totalValue}>{displayTotal}</Text>
            </View>
          </View>
        </View>

        {/* Delivery */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.deliveryHeader}>
              <View style={styles.deliveryTitleRow}>
                <Ionicons name="car-outline" size={16} color={C.brown} />
                <Text style={styles.cardTitle}>Entrega</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('OrderTracking')} style={styles.trackBtn}>
                <Text style={styles.trackBtnText}>Rastrear</Text>
                <Ionicons name="arrow-forward" size={12} color={C.terra} />
              </TouchableOpacity>
            </View>
            <Text style={styles.addrName}>João Silva</Text>
            <Text style={styles.addrLine}>Rua das Flores, 123 — Apto 45</Text>
            <Text style={styles.addrCity}>Itaú de Minas · MG</Text>

            {/* Timeline */}
            <View style={styles.timeline}>
              <View style={styles.timelineLine} />
              <View style={styles.timelineProgress} />
              <View style={styles.timelineSteps}>
                {STEPS.map((st, i) => (
                  <View key={i} style={styles.timelineStep}>
                    <View style={[styles.timelineDot, i === 0 && styles.timelineDotDone]}>
                      {i === 0
                        ? <Ionicons name="checkmark" size={11} color="#fff" />
                        : <View style={styles.emptyDot} />}
                    </View>
                    <Text style={[styles.timelineLabel, i === 0 && styles.timelineLabelDone]}>{st}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <View style={styles.payCard}>
            <View style={styles.mpLogo}><Text style={styles.mpText}>MP</Text></View>
            <Text style={styles.payLabel}>Mercado Pago</Text>
            <View style={styles.payBadge}><Text style={styles.payBadgeText}>{displayMethod}</Text></View>
            <View style={{ flex: 1 }} />
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>Aprovado</Text>
              <Ionicons name="checkmark" size={11} color={C.greenFg} />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={styles.primaryBtnText}>Continuar Comprando</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={styles.secondaryBtnText}>Ver Meus Pedidos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { alignItems: 'center', paddingVertical: 10 },
  headerTitle: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  progress: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 32, paddingBottom: 18 },
  progressStep: { alignItems: 'center', gap: 6 },
  progressLine: { flex: 1, height: 2, marginTop: 13, marginHorizontal: 6, borderRadius: 2 },
  progressCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  progressLabel: { fontSize: 11, color: C.brown, fontFamily: 'WorkSans_600SemiBold' },
  labelActive: { color: C.terra },
  successHero: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 24 },
  ringOuter: { width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(76,175,80,0.07)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  ringMid: { width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(76,175,80,0.15)', alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(76,175,80,0.30)', alignItems: 'center', justifyContent: 'center' },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.greenBg, borderWidth: 3, borderColor: C.greenLn, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold', textAlign: 'center' },
  successSub: { marginTop: 8, fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', lineHeight: 20 },
  section: { paddingHorizontal: 20, paddingBottom: 14 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 12 },
  cardDivider: { height: 1, backgroundColor: C.border, opacity: 0.7, marginVertical: 14 },
  orderNumWrap: { alignItems: 'center', gap: 2 },
  orderNumLabel: { fontSize: 12, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'WorkSans_500Medium' },
  orderNum: { fontSize: 28, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  metaSep: { width: 1, height: 18, backgroundColor: C.border },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImg: { width: 44, height: 44, borderRadius: 10 },
  itemName: { flex: 1, fontSize: 13, color: C.ink, fontFamily: 'WorkSans_500Medium' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemBadge: { backgroundColor: C.terra, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2.5 },
  itemBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'WorkSans_700Bold' },
  itemPrice: { fontSize: 13.5, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  totalValue: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  deliveryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  deliveryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackBtnText: { fontSize: 12, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  addrName: { fontSize: 14, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold' },
  addrLine: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  addrCity: { fontSize: 13, color: C.subtle, fontFamily: 'WorkSans_400Regular', marginTop: 2, marginBottom: 14 },
  timeline: { position: 'relative', paddingTop: 6 },
  timelineLine: { position: 'absolute', top: 17, left: 10, right: 10, height: 2, backgroundColor: C.border, borderRadius: 2 },
  timelineProgress: { position: 'absolute', top: 17, left: 10, width: '8%', height: 2, backgroundColor: C.greenLn, borderRadius: 2 },
  timelineSteps: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineStep: { alignItems: 'center', gap: 6, width: 60 },
  timelineDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: C.greenLn, borderColor: C.greenLn },
  emptyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  timelineLabel: { fontSize: 10, color: C.subtle, fontFamily: 'WorkSans_500Medium', textAlign: 'center', lineHeight: 13 },
  timelineLabelDone: { color: C.greenFg, fontFamily: 'WorkSans_600SemiBold' },
  payCard: { backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mpLogo: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#009ee3', alignItems: 'center', justifyContent: 'center' },
  mpText: { fontSize: 11, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  payLabel: { fontSize: 13, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold' },
  payBadge: { backgroundColor: C.chip, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  payBadgeText: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_600SemiBold' },
  approvedBadge: { backgroundColor: C.greenBg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  approvedText: { fontSize: 11, color: C.greenFg, fontFamily: 'WorkSans_700Bold' },
  primaryBtn: { height: 52, borderRadius: 12, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  secondaryBtn: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: C.brown, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
