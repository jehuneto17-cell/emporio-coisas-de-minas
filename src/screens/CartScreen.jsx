import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const {
    items,
    coupon,
    setCoupon,
    couponApplied,
    applyCoupon,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    shipping,
    discount,
    total,
  } = useCart();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Carrinho</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={clearCart}>
          <Ionicons name="trash-outline" size={19} color={C.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.count}>
          <Text style={styles.countBold}>{items.length}</Text>
          {' '}{items.length === 1 ? 'item' : 'itens'} no carrinho
        </Text>

        <View style={styles.section}>
          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
            </View>
          ) : items.map((it) => (
            <View key={it.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <LinearGradient colors={it.colors} style={styles.itemImg}>
                  {it.sale && (
                    <View style={styles.saleBadge}>
                      <Text style={styles.saleBadgeText}>−{it.sale}%</Text>
                    </View>
                  )}
                </LinearGradient>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{it.name}</Text>
                  <Text style={styles.itemProducer}>{it.producer}</Text>
                  <View style={styles.weightBadge}>
                    <Text style={styles.weightText}>{it.weight}</Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <TouchableOpacity onPress={() => removeItem(it.id)}>
                    <Ionicons name="close" size={14} color={C.subtle} />
                  </TouchableOpacity>
                  <Text style={styles.itemPrice}>{fmt(it.price * it.qty)}</Text>
                </View>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateQuantity(it.id, Math.max(1, it.qty - 1))} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={14} color={C.muted} />
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{it.qty}</Text>
                <TouchableOpacity onPress={() => updateQuantity(it.id, it.qty + 1)} style={[styles.qtyBtn, styles.qtyBtnActive]}>
                  <Ionicons name="add" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <View style={styles.couponCard}>
            <View style={styles.couponInput}>
              <Ionicons name="pricetag-outline" size={16} color={C.subtle} />
              <TextInput
                value={coupon} onChangeText={setCoupon}
                placeholder="Inserir cupom de desconto"
                placeholderTextColor={C.subtle}
                style={styles.couponText}
              />
            </View>
            <TouchableOpacity
              onPress={() => applyCoupon(coupon)}
              style={styles.couponBtn}
            >
              <Text style={styles.couponBtnText}>{couponApplied ? 'Aplicado' : 'Aplicar'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
            <SummaryRow label={`Subtotal (${items.length} itens)`} value={fmt(subtotal)} />
            <SummaryRow label="Frete" value={fmt(shipping)} />
            {discount > 0 && <SummaryRow label="Desconto" value={`− ${fmt(discount)}`} highlight />}
            <View style={styles.summaryDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{fmt(total)}</Text>
            </View>
            <View style={styles.deliveryHint}>
              <Ionicons name="car-outline" size={14} color={C.terra} />
              <Text style={styles.deliveryText}>Entrega em até <Text style={styles.deliveryBold}>3 dias úteis</Text></Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutText}>Finalizar Pedido · {fmt(total)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  count: { paddingHorizontal: 20, paddingBottom: 12, fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  countBold: { color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  section: { paddingHorizontal: 16, paddingBottom: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  itemCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, marginBottom: 10 },
  itemRow: { flexDirection: 'row', gap: 12 },
  itemImg: { width: 72, height: 72, borderRadius: 10 },
  saleBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: C.terra, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2.5 },
  saleBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'WorkSans_600SemiBold' },
  itemInfo: { flex: 1, paddingVertical: 2 },
  itemName: { fontSize: 14, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold', lineHeight: 18 },
  itemProducer: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 3 },
  weightBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: C.chip, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5 },
  weightText: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 72 },
  itemPrice: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 84, marginTop: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  qtyBtnActive: { backgroundColor: C.brown, borderWidth: 0 },
  qtyNum: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', minWidth: 16, textAlign: 'center' },
  couponCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  couponInput: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  couponText: { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular' },
  couponBtn: { height: 44, paddingHorizontal: 18, borderRadius: 8, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  couponBtnText: { color: '#fff', fontSize: 13, fontFamily: 'WorkSans_600SemiBold' },
  summaryCard: { backgroundColor: C.card, borderRadius: 16, padding: 16 },
  summaryTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  summaryValue: { fontSize: 13, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  summaryHighlight: { color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  summaryDivider: { height: 1, backgroundColor: C.border, opacity: 0.7, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 16, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  totalValue: { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  deliveryHint: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, borderStyle: 'dashed' },
  deliveryText: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  deliveryBold: { color: C.brown, fontFamily: 'WorkSans_600SemiBold' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, padding: 18, paddingBottom: 30 },
  checkoutBtn: { height: 52, borderRadius: 12, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
});
