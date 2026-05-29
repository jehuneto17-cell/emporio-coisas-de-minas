import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function CheckoutScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [method, setMethod] = useState('pac');
  const [tab, setTab] = useState('pix');
  const [seconds, setSeconds] = useState(15 * 60);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const shipping = method === 'pac' ? 15.90 : 28.90;
  const total = 143.20 + shipping - 11.00;

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
            <TouchableOpacity style={{ marginLeft: 'auto' }}><Text style={styles.changeBtn}>Alterar</Text></TouchableOpacity>
          </View>
          <Text style={styles.addrName}>João Silva</Text>
          <Text style={styles.addrLine}>Rua das Flores, 123 — Apto 45</Text>
          <Text style={styles.addrCity}>Itaú de Minas · MG · CEP 37.790-000</Text>
          <View style={styles.deliveryHint}>
            <Ionicons name="time-outline" size={14} color={C.muted} />
            <Text style={styles.deliveryText}>Entrega em até <Text style={styles.deliveryBold}>3 dias úteis</Text></Text>
          </View>
        </View>

        {/* Shipping */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🚚</Text>
            <Text style={styles.cardTitle}>Método de Envio</Text>
          </View>
          {[
            { id: 'pac', title: 'Padrão — Correios PAC', sub: '5 a 8 dias úteis', price: 'R$ 15,90' },
            { id: 'sedex', title: 'Expresso — SEDEX', sub: '2 a 3 dias úteis', price: 'R$ 28,90' },
          ].map((opt) => (
            <TouchableOpacity key={opt.id} onPress={() => setMethod(opt.id)}
              style={[styles.shippingOpt, method === opt.id && styles.shippingOptActive]}>
              <View style={[styles.radio, method === opt.id && styles.radioActive]}>
                {method === opt.id && <View style={styles.radioDot} />}
              </View>
              <View style={styles.shippingInfo}>
                <Text style={styles.shippingTitle}>{opt.title}</Text>
                <Text style={styles.shippingSub}>{opt.sub}</Text>
              </View>
              <Text style={styles.shippingPrice}>{opt.price}</Text>
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
          <SummaryRow label="3 itens" value={fmt(143.20)} />
          <SummaryRow label={method === 'pac' ? 'Frete PAC' : 'Frete SEDEX'} value={fmt(shipping)} />
          <SummaryRow label="Desconto" value={`− ${fmt(11.00)}`} highlight />
          <View style={styles.summaryDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{fmt(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmBtn} onPress={() => navigation.navigate('OrderConfirmation')}>
          <Text style={styles.confirmText}>Confirmar Pagamento · {fmt(total)}</Text>
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
