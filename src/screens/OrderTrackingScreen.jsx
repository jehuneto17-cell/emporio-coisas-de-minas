import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getOrder, getPedidoAdmin } from '../services/firestore';

function formatDate(ts) {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function buildTimeline(status, createdAt, tracking) {
  const statuses = [
    { key: 'pendente',    label: 'Pedido Confirmado',  desc: 'Seu pagamento foi recebido' },
    { key: 'preparando',  label: 'Preparando Pedido',   desc: 'Seu pedido está sendo preparado' },
    { key: 'enviado',     label: 'Enviado',              desc: tracking ? `Código: ${tracking}` : 'Pedido enviado' },
    { key: 'em trânsito', label: 'Em Transporte',        desc: 'Seu pedido está a caminho' },
    { key: 'entregue',    label: 'Entregue',             desc: 'Pedido entregue com sucesso!' },
  ];

  const statusOrder = ['pendente', 'preparando', 'enviado', 'em trânsito', 'entregue'];
  const currentIndex = statusOrder.findIndex(s =>
    (status || 'pendente').toLowerCase().includes(s)
  );

  return statuses.map((s, i) => ({
    ...s,
    done: i <= (currentIndex === -1 ? 0 : currentIndex),
    date: i === 0 ? formatDate(createdAt) : i <= currentIndex ? 'Concluído' : 'Pendente',
  }));
}

function getStatusLabel(s) {
  if (!s) return 'Pendente';
  const sl = s.toLowerCase();
  if (sl === 'entregue') return 'Entregue';
  if (sl.includes('trânsito') || sl.includes('transporte')) return 'Em Transporte';
  if (sl === 'enviado') return 'Enviado';
  if (sl === 'preparando') return 'Preparando';
  return 'Aguardando';
}

export default function OrderTrackingScreen({ navigation, route }) {
  const { user } = useAuth();
  const orderId = route.params?.orderId;

  const [order, setOrder] = useState(null);
  const [pedidoAdmin, setPedidoAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.uid || !orderId) {
      setLoading(false);
      return;
    }
    Promise.all([
      getOrder(user.uid, orderId),
      getPedidoAdmin(orderId),
    ]).then(([orderData, adminData]) => {
      setOrder(orderData);
      setPedidoAdmin(adminData);
    }).catch(e => console.warn('[OrderTracking]', e))
      .finally(() => setLoading(false));
  }, [orderId, user?.uid]);

  async function handleCopy(text) {
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.brown} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rastrear Pedido</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.brown} />
        </View>
      </SafeAreaView>
    );
  }

  const status = pedidoAdmin?.status || order?.status || 'pendente';
  const tracking = pedidoAdmin?.tracking || order?.tracking || '';
  const shippingMethod = order?.shippingMethod || pedidoAdmin?.shipping || '—';
  const shippingCompany = order?.shippingCompany || '—';
  const deliveryAddress = order?.deliveryAddress || pedidoAdmin?.deliveryAddress || {};
  const createdAt = order?.createdAt || pedidoAdmin?.createdAt;
  const timeline = buildTimeline(status, createdAt, tracking);
  const shortId = '#' + String(orderId || '').slice(-6);
  const items = order?.items || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rastrear Pedido</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Order Badge */}
        <View style={styles.orderBadge}>
          <View>
            <Text style={styles.orderLabel}>Pedido</Text>
            <Text style={styles.orderNum}>{shortId}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="car-outline" size={14} color={C.terra} />
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          </View>
        </View>

        {/* Carrier Info */}
        <View style={styles.carrierCard}>
          <View style={styles.carrierInfo}>
            <Text style={styles.carrierLabel}>Transportadora</Text>
            <Text style={styles.carrierName}>
              {shippingCompany !== '—' ? `${shippingCompany} · ${shippingMethod}` : shippingMethod}
            </Text>
          </View>
          {tracking ? (
            <>
              <View style={styles.carrierCode}>
                <Text style={styles.codeLabel}>Código</Text>
                <Text style={styles.codeValue}>{tracking}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopy(tracking)}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={C.terra} />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noTracking}>Código ainda não disponível</Text>
          )}
        </View>

        {/* PIX pendente — exibe QR Code salvo para o cliente pagar */}
        {(order?.pixQrCode || order?.pixStatus === 'pending') && order?.pixStatus !== 'approved' && (
          <View style={[styles.card, { alignItems: 'center', gap: 14 }]}>
            <Text style={[styles.cardTitle, { textAlign: 'center' }]}>💳 Pagar com PIX</Text>
            <Text style={{ fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center' }}>
              Seu pedido aguarda pagamento. Escaneie o QR Code ou copie o código.
            </Text>
            {order?.pixQrCodeBase64 ? (
              <View style={{ width: 180, height: 180, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={{ uri: `data:image/png;base64,${order.pixQrCodeBase64}` }}
                  style={{ width: 170, height: 170 }}
                  resizeMode="contain"
                />
              </View>
            ) : null}
            {order?.pixQrCode ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.chip, borderRadius: 12, padding: 14, alignSelf: 'stretch' }}
                onPress={() => handleCopy(order.pixQrCode)}
              >
                <Text style={{ flex: 1, fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' }} numberOfLines={3}>
                  {order.pixQrCode}
                </Text>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            ) : null}
            <Text style={{ fontSize: 11, color: C.subtle, fontFamily: 'WorkSans_400Regular', textAlign: 'center' }}>
              ⚠️ O QR Code PIX expira em 30 minutos após a criação do pedido.
            </Text>
          </View>
        )}

        {/* Produtos do pedido */}
        {items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Produtos</Text>
            {items.map((item, i) => {
              const img = (item.images && item.images[0]) || item.imageUrl || null;
              return (
                <View key={i} style={[styles.productRow, i < items.length - 1 && styles.productRowBorder]}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.productImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.productImg, { backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="cube-outline" size={20} color={C.muted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name || 'Produto'}</Text>
                    {item.producer ? <Text style={styles.productProducer}>{item.producer}</Text> : null}
                  </View>
                  <Text style={styles.productQty}>{item.qty || 1}×</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Histórico</Text>
          {timeline.map((step, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, step.done && styles.timelineDotDone]}>
                  {step.done
                    ? <Ionicons name="checkmark" size={11} color="#fff" />
                    : <View style={styles.emptyDot} />}
                </View>
                {i < timeline.length - 1 && (
                  <View style={[styles.timelineConnector, step.done && styles.connectorDone]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, step.done && styles.timelineLabelDone]}>{step.label}</Text>
                <Text style={styles.timelineDate}>{step.date}</Text>
                {step.desc ? <Text style={styles.timelineDesc}>{step.desc}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {/* Address */}
        <View style={styles.card}>
          <View style={styles.addressHeader}>
            <Ionicons name="location-sharp" size={16} color={C.terra} />
            <Text style={styles.cardTitle}>Endereço de Entrega</Text>
          </View>
          <Text style={styles.addrName}>{deliveryAddress.label || 'Endereço de entrega'}</Text>
          <Text style={styles.addrLine}>
            {deliveryAddress.street
              ? `${deliveryAddress.street}, ${deliveryAddress.number}${deliveryAddress.complement ? ' — ' + deliveryAddress.complement : ''}`
              : '—'}
          </Text>
          <Text style={styles.addrCity}>
            {deliveryAddress.city
              ? `${deliveryAddress.city} · ${deliveryAddress.state} · CEP ${deliveryAddress.cep}`
              : '—'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  orderBadge: { backgroundColor: C.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  orderLabel: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_500Medium', textTransform: 'uppercase', letterSpacing: 1 },
  orderNum: { fontSize: 22, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  statusBadge: { backgroundColor: '#fef3e2', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  carrierCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  carrierInfo: { flex: 1 },
  carrierLabel: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  carrierName: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 2 },
  carrierCode: { flex: 1, alignItems: 'flex-end' },
  codeLabel: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  codeValue: { fontSize: 12, color: C.ink, fontFamily: 'WorkSans_600SemiBold', marginTop: 2 },
  copyBtn: { padding: 8 },
  noTracking: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', fontStyle: 'italic' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 14 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 22 },
  timelineDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: C.greenLn, borderColor: C.greenLn },
  emptyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  timelineConnector: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 2 },
  connectorDone: { backgroundColor: C.greenLn },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, color: C.subtle, fontFamily: 'WorkSans_500Medium' },
  timelineLabelDone: { color: C.brown, fontFamily: 'WorkSans_600SemiBold' },
  timelineDate: { fontSize: 12, color: C.subtle, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  timelineDesc: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 4, lineHeight: 17 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  addrName: { fontSize: 14, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold' },
  addrLine: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 3 },
  addrCity: { fontSize: 13, color: C.subtle, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  productRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  productImg: { width: 56, height: 56, borderRadius: 10 },
  productName: { fontSize: 13, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', lineHeight: 17 },
  productProducer: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  productQty: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_600SemiBold' },
});
