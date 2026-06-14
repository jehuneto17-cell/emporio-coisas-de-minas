import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, fmt } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { getUserProfile, getUserOrders } from '../services/firestore';

const MENU = [
  { icon: 'bag-outline',             label: 'Meus Pedidos',            screen: 'MyOrders',  target: 'stack' },
  { icon: 'location-outline',        label: 'Endereços',               screen: null,         target: null },
  { icon: 'card-outline',            label: 'Formas de Pagamento',     screen: null,         target: null },
  { icon: 'heart-outline',           label: 'Favoritos',               screen: 'Favoritos',  target: 'tab' },
  { icon: 'notifications-outline',   label: 'Notificações',            screen: null,         target: null },
  { icon: 'shield-outline',          label: 'Privacidade e Segurança', screen: 'Privacy',    target: 'stack' },
  { icon: 'help-circle-outline',     label: 'Ajuda e Suporte',         screen: 'Help',       target: 'stack' },
  { icon: 'star-outline',            label: 'Avaliar o App',           screen: null,         target: null },
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

function formatOrderDate(createdAt) {
  if (!createdAt) return '';
  try {
    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { count: favoritesCount } = useFavorites();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    Promise.all([getUserProfile(user.uid), getUserOrders(user.uid)])
      .then(([profileData, ordersData]) => {
        setProfile(profileData);
        setOrders(ordersData);
      })
      .catch((e) => console.warn('[Profile] load error', e))
      .finally(() => setLoadingProfile(false));
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </View>
        <View style={styles.guestState}>
          <Ionicons name="person-circle-outline" size={80} color={C.border} />
          <Text style={styles.guestTitle}>Você não está logado</Text>
          <Text style={styles.guestDesc}>
            Faça login para acessar seu perfil, pedidos e favoritos.
          </Text>
          <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.guestBtnText}>Entrar / Criar conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile?.name || user.displayName || user.email?.split('@')[0] || 'Usuário';
  const memberYear = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).getFullYear()
    : null;
  const recentOrders = [...orders]
    .sort((a, b) => (b.id > a.id ? 1 : -1))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="pencil-outline" size={18} color={C.brown} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        {loadingProfile ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={C.brown} />
          </View>
        ) : (
          <View style={styles.avatarSection}>
            <LinearGradient colors={[C.terra, C.brown]} style={styles.avatar}>
              <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
            </LinearGradient>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {memberYear ? (
              <View style={styles.memberBadge}>
                <Ionicons name="star" size={12} color={C.ochre} />
                <Text style={styles.memberText}>Membro desde {memberYear}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{orders.length}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{favoritesCount}</Text>
            <Text style={styles.statLabel}>Favoritos</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Avaliações</Text>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
            <TouchableOpacity><Text style={styles.seeAll}>Ver todos</Text></TouchableOpacity>
          </View>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyOrders}>Nenhum pedido realizado ainda.</Text>
          ) : (
            recentOrders.map((o) => {
              const statusColor = getStatusColor(o.status);
              const total = typeof o.total === 'number' ? fmt(o.total) : (o.total || '—');
              const shortId = '#' + String(o.id).slice(-6);
              return (
                <TouchableOpacity
                  key={o.id}
                  style={styles.orderCard}
                  onPress={() => navigation.navigate('OrderTracking')}
                >
                  <View style={styles.orderLeft}>
                    <Text style={styles.orderId}>{shortId}</Text>
                    <Text style={styles.orderDate}>{formatOrderDate(o.createdAt)}</Text>
                  </View>
                  <View style={styles.orderRight}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(o.status)}</Text>
                    </View>
                    <Text style={styles.orderTotal}>{total}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            {MENU.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i < MENU.length - 1 && styles.menuItemBorder]}
                onPress={() => {
                  if (!item.screen) return;
                  if (item.target === 'tab') navigation.navigate('Main', { screen: item.screen });
                  else navigation.navigate(item.screen);
                }}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={C.brown} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.subtle} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={C.terra} />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 24, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  editBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  loadingSection: { alignItems: 'center', paddingVertical: 32 },
  avatarSection: { alignItems: 'center', paddingBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarInitials: { fontSize: 28, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  userName: { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  userEmail: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 4 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  memberText: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  statsRow: { flexDirection: 'row', backgroundColor: C.card, marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  statLabel: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  statSep: { width: 1, backgroundColor: C.border, opacity: 0.7, marginVertical: 4 },
  section: { paddingHorizontal: 20, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  seeAll: { fontSize: 12, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  emptyOrders: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', paddingVertical: 16 },
  orderCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderLeft: { gap: 3 },
  orderId: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  orderDate: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: 'WorkSans_600SemiBold' },
  orderTotal: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  menuCard: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.softCream, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, color: C.ink, fontFamily: 'WorkSans_500Medium', flex: 1 },
  logoutBtn: { backgroundColor: '#fff5f5', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#ffd0d0' },
  logoutText: { fontSize: 15, color: C.terra, fontFamily: 'PlusJakartaSans_600SemiBold' },
  guestState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  guestTitle: { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' },
  guestDesc: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', lineHeight: 22 },
  guestBtn: { marginTop: 8, height: 50, paddingHorizontal: 32, borderRadius: 12, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  guestBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
});
