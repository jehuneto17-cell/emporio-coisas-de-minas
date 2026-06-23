import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, fmt } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../services/firestore';

const FILTERS = [
  { key: 'todos',      label: 'Todos' },
  { key: 'pendente',   label: 'Pendente' },
  { key: 'transito',   label: 'Em Transporte' },
  { key: 'entregue',   label: 'Entregue' },
];

function getStatusColor(status) {
  if (!status) return C.ochre;
  const s = status.toLowerCase();
  if (s === 'entregue') return C.greenFg;
  if (s.includes('transit') || s.includes('transporte')) return C.terra;
  return C.ochre;
}

function getStatusLabel(status) {
  if (!status) return 'Pendente';
  switch (status.toLowerCase()) {
    case 'entregue': return 'Entregue';
    case 'em_transito':
    case 'em transito': return 'Em Transporte';
    case 'pendente': return 'Pendente';
    default: return status;
  }
}

function matchesFilter(order, key) {
  if (key === 'todos') return true;
  const s = (order.status || 'pendente').toLowerCase();
  if (key === 'entregue') return s === 'entregue';
  if (key === 'transito') return s.includes('transit') || s.includes('transporte');
  if (key === 'pendente') return s === 'pendente' || s === '' || !order.status;
  return true;
}

function formatDate(ts) {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

const PAY_LABELS = { card: 'Cartão', boleto: 'Boleto', pix: 'PIX' };

export default function MyOrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('todos');

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    getUserOrders(user.uid)
      .then((data) => {
        const sorted = [...data].sort((a, b) => (b.id > a.id ? 1 : -1));
        setOrders(sorted);
      })
      .catch((e) => console.warn('[MyOrders] load error', e))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(
    () => orders.filter((o) => matchesFilter(o, activeFilter)),
    [orders, activeFilter],
  );

  function renderOrder({ item: o }) {
    const statusColor = getStatusColor(o.status);
    const shortId = '#' + String(o.id).slice(-6);
    const totalStr = typeof o.total === 'number' ? fmt(o.total) : (o.total || '—');
    const itemCount = Array.isArray(o.items) ? o.items.length : 0;
    const payLabel = PAY_LABELS[o.paymentMethod] ?? 'PIX';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderTracking', { orderId: o.id })}
        activeOpacity={0.8}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderId}>{shortId}</Text>
            <Text style={styles.orderDate}>{formatDate(o.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(o.status)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <View style={styles.metaItem}>
            <Ionicons name="cube-outline" size={14} color={C.muted} />
            <Text style={styles.metaText}>
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="card-outline" size={14} color={C.muted} />
            <Text style={styles.metaText}>{payLabel}</Text>
          </View>
          <Text style={styles.orderTotal}>{totalStr}</Text>
        </View>

        {/* Track link */}
        <View style={styles.trackRow}>
          <Ionicons name="location-outline" size={13} color={C.terra} />
          <Text style={styles.trackText}>Rastrear pedido</Text>
          <Ionicons name="chevron-forward" size={13} color={C.terra} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.brown} />
        </View>
      ) : !user ? (
        <View style={styles.centered}>
          <Ionicons name="person-circle-outline" size={56} color={C.border} />
          <Text style={styles.emptyTitle}>Você não está logado</Text>
          <Text style={styles.emptyDesc}>Faça login para ver seus pedidos.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Entrar / Criar conta</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="bag-outline" size={56} color={C.border} />
          <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
          <Text style={styles.emptyDesc}>
            {activeFilter === 'todos'
              ? 'Você ainda não fez nenhum pedido.'
              : 'Nenhum pedido com esse status.'}
          </Text>
          {activeFilter === 'todos' && (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Main')}
            >
              <Text style={styles.loginBtnText}>Explorar produtos</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },

  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.brown,
    borderColor: C.brown,
  },
  chipText: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    color: C.muted,
  },
  chipTextActive: {
    color: C.cream,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 17, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', lineHeight: 20 },
  loginBtn: {
    marginTop: 8, height: 48, paddingHorizontal: 28,
    borderRadius: 12, backgroundColor: C.brown,
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtnText: { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },

  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

  orderCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId: { fontSize: 16, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  orderDate: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: 'WorkSans_600SemiBold' },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  orderTotal: {
    marginLeft: 'auto',
    fontSize: 16, color: C.brown,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  trackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  trackText: { fontSize: 12, color: C.terra, fontFamily: 'WorkSans_600SemiBold', flex: 1 },
});
