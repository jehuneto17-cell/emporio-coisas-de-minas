import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { addOrder, getAddresses, getProductById } from '../services/firestore';

const CEP_ORIGEM = '37900900';

const FRETE_API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://emporio-coisas-de-minas.vercel.app/api/calcular-frete'
  : 'http://localhost:8081/api/calcular-frete';

export default function CheckoutScreen({ navigation }) {
  const { isAuthenticated, user } = useAuth();
  const { items, totalItems, subtotal, discount, couponApplied, clearCart } = useCart();

  const [tab, setTab] = useState('pix');
  const [seconds, setSeconds] = useState(15 * 60);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Endereço
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Frete
  const [shippingOptions, setShippingOptions] = useState([]);
  const [method, setMethod] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Carrega endereço padrão do usuário
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingAddress(true);
    getAddresses(user.uid)
      .then((list) => {
        if (!list || list.length === 0) return;
        const def = list.find((a) => a.isDefault) || list[0];
        setDeliveryAddress(def);
      })
      .catch((e) => console.warn('[Checkout] getAddresses error', e))
      .finally(() => setLoadingAddress(false));
  }, [user?.uid]);

  // Calcula frete quando o CEP do endereço está disponível
  useEffect(() => {
    if (!deliveryAddress?.cep) return;
    const cepDest = deliveryAddress.cep.replace(/\D/g, '');
    if (cepDest.length === 8) {
      calculateShipping(cepDest);
    }
  }, [deliveryAddress?.cep]);

  async function calculateShipping(cepDest) {
    setLoadingShipping(true);
    setShippingError(null);
    setShippingOptions([]);
    setMethod(null);

    // Busca dados de peso/dimensões de cada item do carrinho no Firestore
    // Fallback seguro: se o produto não tiver dados, usa valores padrão
    let totalWeight = 0;
    let maxHeight = 10;
    let maxWidth = 15;
    let totalLength = 0;

    try {
      const productDataList = await Promise.all(
        items.map(item => getProductById(String(item.id)))
      );
      productDataList.forEach((product, idx) => {
        const qty = items[idx]?.qty || 1;
        const w = product?.weight || 0.3;
        const h = product?.weightHeight || 10;
        const wi = product?.weightWidth || 15;
        const l = product?.weightLength || 10;
        totalWeight += w * qty;
        maxHeight = Math.max(maxHeight, h);
        maxWidth = Math.max(maxWidth, wi);
        totalLength += l * qty;
      });
    } catch (e) {
      console.warn('[Frete] erro ao buscar dimensões dos produtos, usando fallback:', e);
      totalWeight = 1;
      maxHeight = 10;
      maxWidth = 15;
      totalLength = 20;
    }

    // Garante mínimos exigidos pelo Melhor Envio
    totalWeight = Math.max(totalWeight, 0.1);
    maxHeight = Math.max(maxHeight, 2);
    maxWidth = Math.max(maxWidth, 11);
    totalLength = Math.max(totalLength, 16);

    const body = {
      from: { postal_code: CEP_ORIGEM },
      to: { postal_code: cepDest },
      package: {
        height: Math.round(maxHeight),
        width: Math.round(maxWidth),
        length: Math.round(totalLength),
        weight: parseFloat(totalWeight.toFixed(2)),
      },
      options: { receipt: false, own_hand: false },
      services: '',
    };

    // Timeout de 15s para o fetch nunca travar o spinner indefinidamente.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      console.log('[Frete] iniciando fetch para:', FRETE_API_URL);
      console.log('[Frete] body:', JSON.stringify(body));

      const res = await fetch(FRETE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      console.log('[Frete] status HTTP:', res.status, res.ok);

      const data = await res.json();
      console.log('[Frete] data recebida:', JSON.stringify(data));

      // O Melhor Envio devolve um array de transportadoras quando OK.
      // Qualquer outra coisa (ex.: { message: 'Unauthenticated.' }) é erro.
      if (!res.ok || !Array.isArray(data)) {
        const apiMsg = data?.message || data?.error;
        console.error('[Frete] resposta inesperada da API:', apiMsg || data);
        setShippingError(
          apiMsg
            ? `Não foi possível calcular o frete (${apiMsg}).`
            : 'Não foi possível calcular o frete. Tente novamente.'
        );
        return;
      }

      // Transportadoras preferidas — mostradas primeiro quando disponíveis
      const PREFERRED_SERVICES = ['.Package', 'PAC', 'SEDEX', 'Express'];

      const allValid = data
        .filter((opt) => !opt.error)
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

      const preferred = allValid.filter((opt) => PREFERRED_SERVICES.includes(opt.name));

      // Se nenhuma preferida cobrir o CEP, mostra todas as disponíveis como fallback
      const valid = preferred.length > 0 ? preferred : allValid;

      if (valid.length === 0) {
        console.warn('[Frete] nenhuma transportadora disponível para o CEP', cepDest);
        setShippingError('Nenhuma opção de frete disponível para este CEP.');
      } else {
        setShippingOptions(valid);
        setMethod(valid[0].id);
      }
    } catch (e) {
      console.error('[Frete] erro no fetch:', e?.message, e);
      setShippingError(
        e?.name === 'AbortError'
          ? 'O cálculo de frete demorou demais. Tente novamente.'
          : 'Não foi possível calcular o frete. Verifique o CEP.'
      );
    } finally {
      clearTimeout(timeoutId);
      setLoadingShipping(false);
    }
  }

  const selectedOption = shippingOptions.find((o) => o.id === method) || null;
  const shippingCost = selectedOption ? parseFloat(selectedOption.price) : 0;
  const checkoutTotal = Math.max(0, subtotal - discount + shippingCost);
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  async function handleConfirm() {
    setConfirming(true);
    try {
      const orderId = await addOrder(user?.uid, {
        items,
        subtotal,
        discount,
        shipping: shippingCost,
        total: checkoutTotal,
        paymentMethod: tab,
        shippingMethod: selectedOption?.name || method,
        shippingCompany: selectedOption?.company?.name || '',
        shippingCost,
        deliveryAddress: deliveryAddress || null,
      });
      clearCart();
      navigation.navigate('OrderConfirmation', { orderId });
    } catch (e) {
      console.warn('[Checkout] addOrder error', e);
      navigation.navigate('OrderConfirmation', { orderId: null });
    } finally {
      setConfirming(false);
    }
  }

  const shippingLabel = selectedOption
    ? `Frete ${selectedOption.company?.name || selectedOption.name}`
    : 'Frete';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modal de autenticação */}
      <Modal
        visible={showAuthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="bag-outline" size={40} color={C.brown} style={{ alignSelf: 'center', marginBottom: 4 }} />
            <Text style={styles.modalTitle}>Finalizar compra</Text>
            <Text style={styles.modalDesc}>
              Entre na sua conta para salvar seu pedido e acompanhar a entrega.
            </Text>
            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={() => { setShowAuthModal(false); navigation.navigate('Login'); }}
            >
              <Text style={styles.modalBtnPrimaryText}>Entrar / Criar conta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={() => setShowAuthModal(false)}
            >
              <Text style={styles.modalBtnSecondaryText}>Continuar como visitante</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {[
          { label: 'Carrinho', done: true },
          { label: 'Pagamento', active: true },
          { label: 'Confirmação', pending: true },
        ].map((s, i) => (
          <React.Fragment key={i}>
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, s.done && styles.circleDone, s.active && styles.circleActive]}>
                {s.done ? <Ionicons name="checkmark" size={13} color="#fff" /> : <Text style={[styles.circleNum, s.active && { color: '#fff' }]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.progressLabel, s.active && styles.labelActive]}>{s.label}</Text>
            </View>
            {i < 2 && <View style={[styles.progressLine, s.done && styles.lineDone]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
        {/* Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📍</Text>
            <Text style={styles.cardTitle}>Endereço de Entrega</Text>
            <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => navigation.navigate('Addresses')}>
              <Text style={styles.changeBtn}>Alterar</Text>
            </TouchableOpacity>
          </View>
          {loadingAddress ? (
            <ActivityIndicator size="small" color={C.brown} style={{ marginVertical: 8 }} />
          ) : deliveryAddress ? (
            <>
              <Text style={styles.addrName}>{deliveryAddress.label || 'Endereço'}</Text>
              <Text style={styles.addrLine}>
                {deliveryAddress.street}{deliveryAddress.number ? `, ${deliveryAddress.number}` : ''}
                {deliveryAddress.complement ? ` — ${deliveryAddress.complement}` : ''}
              </Text>
              <Text style={styles.addrCity}>
                {deliveryAddress.city} · {deliveryAddress.state} · CEP {deliveryAddress.cep}
              </Text>
            </>
          ) : (
            <Text style={styles.addrLine}>
              {isAuthenticated
                ? 'Nenhum endereço cadastrado. Toque em "Alterar" para adicionar.'
                : 'Faça login para usar um endereço salvo.'}
            </Text>
          )}
          {selectedOption && (
            <View style={styles.deliveryHint}>
              <Ionicons name="time-outline" size={14} color={C.muted} />
              <Text style={styles.deliveryText}>
                Entrega em até{' '}
                <Text style={styles.deliveryBold}>{selectedOption.delivery_time} dias úteis</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Shipping */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🚚</Text>
            <Text style={styles.cardTitle}>Método de Envio</Text>
          </View>

          {loadingShipping && (
            <View style={styles.shippingLoader}>
              <ActivityIndicator size="small" color={C.brown} />
              <Text style={styles.shippingLoaderText}>Calculando frete…</Text>
            </View>
          )}

          {!loadingShipping && shippingError && (
            <View style={styles.shippingErrorWrap}>
              <Ionicons name="alert-circle-outline" size={20} color={C.terra} />
              <Text style={styles.shippingErrorText}>{shippingError}</Text>
              {deliveryAddress?.cep && (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => calculateShipping(deliveryAddress.cep.replace(/\D/g, ''))}
                >
                  <Text style={styles.retryBtnText}>Tentar novamente</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!loadingShipping && !shippingError && shippingOptions.length === 0 && !deliveryAddress && (
            <Text style={styles.shippingPlaceholder}>
              Adicione um endereço de entrega para calcular o frete.
            </Text>
          )}

          {!loadingShipping && shippingOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setMethod(opt.id)}
              style={[styles.shippingOpt, method === opt.id && styles.shippingOptActive]}
            >
              <View style={[styles.radio, method === opt.id && styles.radioActive]}>
                {method === opt.id && <View style={styles.radioDot} />}
              </View>
              <View style={styles.shippingInfo}>
                <Text style={styles.shippingTitle}>{opt.name}</Text>
                <Text style={styles.shippingSub}>{opt.company?.name} · {opt.delivery_time} dias úteis</Text>
              </View>
              <Text style={styles.shippingPrice}>{fmt(parseFloat(opt.price))}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardTitle}>Forma de Pagamento</Text>
            <View style={styles.mpBadge}><Text style={styles.mpText}>MP</Text></View>
          </View>
          <View style={styles.payTabs}>
            {['pix', 'card', 'boleto'].map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)}
                style={[styles.payTab, tab === t && styles.payTabActive]}>
                <Text style={[styles.payTabText, tab === t && styles.payTabTextActive]}>
                  {t === 'pix' ? 'Pix' : t === 'card' ? 'Cartão' : 'Boleto'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tab === 'pix' && (
            <View style={styles.pixWrap}>
              <View style={styles.qrCode}>
                <Text style={styles.qrText}>QR Code Pix</Text>
              </View>
              <View style={styles.pixCopy}>
                <Text style={styles.pixCode} numberOfLines={1}>00020126580014br.gov.bcb.pix...</Text>
                <TouchableOpacity style={styles.copyBtn}>
                  <Ionicons name="copy-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.countdownRow}>
                <Ionicons name="time-outline" size={14} color={C.terra} />
                <Text style={styles.countdownText}>Código válido por <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{mmss}</Text></Text>
              </View>
            </View>
          )}
          {tab === 'card' && (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={32} color={C.muted} />
              <Text style={styles.emptyStateText}>Adicione um cartão para continuar.</Text>
            </View>
          )}
          {tab === 'boleto' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>O boleto será gerado após a confirmação do pedido.</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.summaryTitle}>Resumo</Text>
          <SummaryRow label={`${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`} value={fmt(subtotal)} />
          <SummaryRow
            label={shippingLabel}
            value={loadingShipping ? '…' : shippingCost > 0 ? fmt(shippingCost) : '—'}
          />
          {couponApplied && <SummaryRow label="Desconto" value={`− ${fmt(discount)}`} highlight />}
          <View style={styles.summaryDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{fmt(checkoutTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, confirming && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={confirming}
        >
          {confirming
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmText}>Confirmar Pagamento · {fmt(checkoutTotal)}</Text>
          }
        </TouchableOpacity>
        <View style={styles.secureHint}>
          <Ionicons name="lock-closed-outline" size={11} color={C.subtle} />
          <Text style={styles.secureText}>Pagamento 100% seguro via Mercado Pago</Text>
        </View>
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
  progress: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 24, paddingBottom: 14 },
  progressStep: { alignItems: 'center', gap: 6 },
  progressLine: { flex: 1, height: 2, backgroundColor: C.border, marginTop: 13, marginHorizontal: 6 },
  lineDone: { backgroundColor: C.brown },
  progressCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  circleDone: { backgroundColor: C.brown, borderWidth: 0 },
  circleActive: { backgroundColor: C.terra, borderWidth: 0 },
  circleNum: { fontSize: 12, color: C.subtle, fontFamily: 'PlusJakartaSans_700Bold' },
  progressLabel: { fontSize: 11, color: C.subtle, fontFamily: 'WorkSans_500Medium' },
  labelActive: { color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardIcon: { fontSize: 15 },
  cardTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold' },
  changeBtn: { fontSize: 12, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  addrName: { fontSize: 14, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  addrLine: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 3 },
  addrCity: { fontSize: 13, color: C.subtle, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  deliveryHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, borderStyle: 'dashed' },
  deliveryText: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  deliveryBold: { color: C.brown, fontFamily: 'WorkSans_600SemiBold' },
  shippingLoader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  shippingLoaderText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  shippingErrorWrap: { alignItems: 'center', gap: 8, paddingVertical: 14 },
  shippingErrorText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.terra },
  retryBtnText: { fontSize: 13, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  shippingPlaceholder: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', paddingVertical: 10 },
  shippingOpt: { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  shippingOptActive: { borderColor: C.brown, backgroundColor: '#f6f3ef' },
  radio: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: C.brown, borderColor: C.brown },
  radioDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' },
  shippingInfo: { flex: 1 },
  shippingTitle: { fontSize: 14, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  shippingSub: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  shippingPrice: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  mpBadge: { marginLeft: 'auto', width: 22, height: 22, borderRadius: 11, backgroundColor: '#009ee3', alignItems: 'center', justifyContent: 'center' },
  mpText: { fontSize: 10, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  payTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  payTab: { flex: 1, height: 36, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  payTabActive: { backgroundColor: C.brown, borderWidth: 0 },
  payTabText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  payTabTextActive: { color: '#fff', fontFamily: 'WorkSans_600SemiBold' },
  pixWrap: { alignItems: 'center', gap: 14 },
  qrCode: { width: 140, height: 140, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' },
  qrText: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  pixCopy: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.chip, borderRadius: 8, padding: 10, alignSelf: 'stretch' },
  pixCode: { flex: 1, fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  copyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countdownText: { fontSize: 13, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyStateText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center' },
  summaryTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  summaryValue: { fontSize: 13, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  summaryHighlight: { color: C.terra },
  summaryDivider: { height: 1, backgroundColor: C.border, opacity: 0.7, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  totalValue: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26 },
  confirmBtn: { height: 52, borderRadius: 12, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
  secureHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
  secureText: { fontSize: 11, color: C.subtle, fontFamily: 'WorkSans_400Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: C.cream, borderRadius: 20, padding: 24, width: '100%', gap: 12, borderWidth: 1, borderColor: C.border },
  modalTitle: { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold', textAlign: 'center' },
  modalDesc: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', marginBottom: 4 },
  modalBtnPrimary: { height: 50, borderRadius: 12, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  modalBtnPrimaryText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  modalBtnSecondary: { height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  modalBtnSecondaryText: { color: C.muted, fontSize: 15, fontFamily: 'WorkSans_500Medium' },
});
