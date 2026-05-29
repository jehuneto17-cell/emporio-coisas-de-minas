import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { icon: 'bag-outline', label: 'Meus Pedidos', badge: '3' },
  { icon: 'location-outline', label: 'Endereços' },
  { icon: 'card-outline', label: 'Formas de Pagamento' },
  { icon: 'heart-outline', label: 'Favoritos' },
  { icon: 'notifications-outline', label: 'Notificações' },
  { icon: 'shield-outline', label: 'Privacidade e Segurança' },
  { icon: 'help-circle-outline', label: 'Ajuda e Suporte' },
  { icon: 'star-outline', label: 'Avaliar o App' },
];

const ORDERS = [
  { id: '#1043', date: '24 Mai 2026', status: 'Em Transporte', total: 'R$ 148,10', color: C.terra },
  { id: '#1031', date: '12 Mai 2026', status: 'Entregue', total: 'R$ 89,00', color: C.greenFg },
  { id: '#1019', date: '02 Mai 2026', status: 'Entregue', total: 'R$ 62,40', color: C.greenFg },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={18} color={C.brown} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={[C.terra, C.brown]} style={styles.avatar}>
            <Text style={styles.avatarInitials}>JS</Text>
          </LinearGradient>
          <Text style={styles.userName}>João Silva</Text>
          <Text style={styles.userEmail}>joao.silva@gmail.com</Text>
          <View style={styles.memberBadge}>
            <Ionicons name="star" size={12} color={C.ochre} />
            <Text style={styles.memberText}>Membro desde 2024</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>12</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>8</Text>
            <Text style={styles.statLabel}>Favoritos</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>3</Text>
            <Text style={styles.statLabel}>Avaliações</Text>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
            <TouchableOpacity><Text style={styles.seeAll}>Ver todos</Text></TouchableOpacity>
          </View>
          {ORDERS.map((o) => (
            <TouchableOpacity key={o.id} style={styles.orderCard} onPress={() => navigation.navigate('OrderTracking')}>
              <View style={styles.orderLeft}>
                <Text style={styles.orderId}>{o.id}</Text>
                <Text style={styles.orderDate}>{o.date}</Text>
              </View>
              <View style={styles.orderRight}>
                <View style={[styles.statusBadge, { backgroundColor: o.color + '18' }]}>
                  <Text style={[styles.statusText, { color: o.color }]}>{o.status}</Text>
                </View>
                <Text style={styles.orderTotal}>{o.total}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            {MENU.map((item, i) => (
              <TouchableOpacity key={i} style={[styles.menuItem, i < MENU.length - 1 && styles.menuItemBorder]}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={C.brown} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.badge && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={C.subtle} style={{ marginLeft: 'auto' }} />
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
  orderCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderLeft: { gap: 3 },
  orderId: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  orderDate: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: 'WorkSans_600SemiBold' },
  orderTotal: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  menuCard: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.softCream, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, color: C.ink, fontFamily: 'WorkSans_500Medium', flex: 1 },
  menuBadge: { backgroundColor: C.terra, borderRadius: 999, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  menuBadgeText: { fontSize: 11, color: '#fff', fontFamily: 'WorkSans_700Bold' },
  logoutBtn: { backgroundColor: '#fff5f5', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#ffd0d0' },
  logoutText: { fontSize: 15, color: C.terra, fontFamily: 'PlusJakartaSans_600SemiBold' },
  guestState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  guestTitle: { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' },
  guestDesc: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', lineHeight: 22 },
  guestBtn: { marginTop: 8, height: 50, paddingHorizontal: 32, borderRadius: 12, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  guestBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
});
