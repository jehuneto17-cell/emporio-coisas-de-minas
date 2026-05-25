import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

const TIMELINE = [
  { label: 'Pedido Confirmado', date: '24 Mai · 10:32', done: true, desc: 'Seu pagamento foi aprovado via Pix' },
  { label: 'Preparando Pedido', date: '24 Mai · 14:15', done: true, desc: 'A Fazenda São João está preparando seu pedido' },
  { label: 'Em Transporte', date: 'Previsão: 25 Mai', done: false, desc: 'Seu pedido será coletado pelo Correios' },
  { label: 'Saiu para Entrega', date: 'Previsão: 27 Mai', done: false, desc: '' },
  { label: 'Entregue', date: 'Previsão: 27 Mai', done: false, desc: '' },
];

export default function OrderTrackingScreen({ navigation }) {
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
            <Text style={styles.orderNum}>#1043</Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="car-outline" size={14} color={C.terra} />
            <Text style={styles.statusText}>Em Trânsito</Text>
          </View>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color={C.border} />
          <Text style={styles.mapText}>Rastreamento em tempo real</Text>
        </View>

        {/* Carrier Info */}
        <View style={styles.carrierCard}>
          <View style={styles.carrierInfo}>
            <Text style={styles.carrierLabel}>Transportadora</Text>
            <Text style={styles.carrierName}>Correios PAC</Text>
          </View>
          <View style={styles.carrierCode}>
            <Text style={styles.codeLabel}>Código</Text>
            <Text style={styles.codeValue}>AA123456789BR</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn}>
            <Ionicons name="copy-outline" size={16} color={C.terra} />
          </TouchableOpacity>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Histórico</Text>
          {TIMELINE.map((step, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, step.done && styles.timelineDotDone]}>
                  {step.done
                    ? <Ionicons name="checkmark" size={11} color="#fff" />
                    : <View style={styles.emptyDot} />}
                </View>
                {i < TIMELINE.length - 1 && (
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
          <Text style={styles.addrName}>João Silva</Text>
          <Text style={styles.addrLine}>Rua das Flores, 123 — Apto 45</Text>
          <Text style={styles.addrCity}>Itaú de Minas · MG · CEP 37.790-000</Text>
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
  mapPlaceholder: { height: 160, backgroundColor: C.chip, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  mapText: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  carrierCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  carrierInfo: { flex: 1 },
  carrierLabel: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  carrierName: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 2 },
  carrierCode: { flex: 1, alignItems: 'flex-end' },
  codeLabel: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  codeValue: { fontSize: 12, color: C.ink, fontFamily: 'WorkSans_600SemiBold', marginTop: 2 },
  copyBtn: { padding: 8 },
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
});
