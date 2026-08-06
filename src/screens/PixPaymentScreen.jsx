import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { C, fmt } from '../theme';
import { getConfigPagamento } from '../services/firestore';

const STEPS = [
  '1. Abra o app do seu banco',
  '2. Escaneie o QR ou cole a chave',
  '3. Confirme o valor e pague',
  '4. Volte aqui e envie o comprovante',
];

export default function PixPaymentScreen({ navigation, route }) {
  const { orderId, total } = route.params || {};

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getConfigPagamento()
      .then(setConfig)
      .catch((e) => console.warn('[PixPayment]', e))
      .finally(() => setLoading(false));
  }, []);

  async function handleCopy() {
    if (!config?.pixChave) return;
    try {
      await Clipboard.setStringAsync(config.pixChave);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('[PixPayment] erro ao copiar chave:', e.message);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.brown} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pague com PIX</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.brown} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pague com PIX</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Valor a pagar</Text>
          <Text style={styles.totalValue}>{fmt(total || 0)}</Text>
          {orderId ? <Text style={styles.orderRef}>Pedido #{String(orderId).slice(-6)}</Text> : null}
        </View>

        <View style={styles.card}>
          {config?.pixQrCodeUrl ? (
            <View style={styles.qrWrap}>
              <Image
                source={{ uri: config.pixQrCodeUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.qrMissing}>
              <Ionicons name="qr-code-outline" size={40} color={C.muted} />
              <Text style={styles.qrMissingText}>QR Code indisponível, use a chave abaixo</Text>
            </View>
          )}

          <Text style={styles.chaveLabel}>Chave PIX</Text>
          <View style={styles.chaveBox}>
            <Text style={styles.chaveText} numberOfLines={2}>{config?.pixChave || 'Chave não configurada'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.copyBtn, !config?.pixChave && { opacity: 0.5 }]}
            onPress={handleCopy}
            disabled={!config?.pixChave}
          >
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#fff" />
            <Text style={styles.copyBtnText}>{copied ? 'Copiada!' : 'Copiar chave'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.stepsTitle}>Como pagar</Text>
          {STEPS.map((s) => (
            <Text key={s} style={styles.stepText}>{s}</Text>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => navigation.navigate('UploadComprovante', { orderId, total })}
        >
          <Text style={styles.confirmText}>Já paguei — enviar comprovante</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.laterBtn}
          onPress={() => navigation.navigate('MyOrders')}
        >
          <Text style={styles.laterBtnText}>Pagar depois</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  totalCard: { backgroundColor: C.brown, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontSize: 13, color: '#f0e4de', fontFamily: 'WorkSans_500Medium' },
  totalValue: { fontSize: 30, color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold', marginTop: 4 },
  orderRef: { fontSize: 12, color: '#f0e4de', fontFamily: 'WorkSans_400Regular', marginTop: 6 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  qrWrap: { alignItems: 'center', paddingVertical: 8, marginBottom: 14 },
  qrImage: { width: 200, height: 200, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  qrMissing: { alignItems: 'center', gap: 8, paddingVertical: 20, marginBottom: 14 },
  qrMissingText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center' },
  chaveLabel: { fontSize: 12, color: C.brown, fontFamily: 'WorkSans_600SemiBold', marginBottom: 6, letterSpacing: 0.5 },
  chaveBox: { backgroundColor: C.chip, borderRadius: 10, padding: 12, marginBottom: 10 },
  chaveText: { fontSize: 14, color: C.ink, fontFamily: 'WorkSans_500Medium' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 10, backgroundColor: C.terra },
  copyBtnText: { color: '#fff', fontSize: 14, fontFamily: 'WorkSans_600SemiBold' },
  stepsTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 10 },
  stepText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginBottom: 6, lineHeight: 19 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, gap: 10 },
  confirmBtn: { height: 52, borderRadius: 12, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
  laterBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
  laterBtnText: { color: C.subtle, fontSize: 13, fontFamily: 'WorkSans_500Medium' },
});
