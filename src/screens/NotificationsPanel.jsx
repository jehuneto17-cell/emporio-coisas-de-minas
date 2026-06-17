import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

import { C } from '../theme';
import { useAuth } from '../context/AuthContext';
import app from '../services/firebase';

// ─── Constants ────────────────────────────────────────────────────────────────

const UNREAD_DOT = '#1976d2';

const TYPE_CONFIG = {
  welcome: { icon: 'person-add-outline',          color: C.terra      },
  order:   { icon: 'bag-check-outline',            color: '#2e7d32'    },
  promo:   { icon: 'pricetag-outline',             color: C.ochre      },
  system:  { icon: 'information-circle-outline',   color: C.muted      },
};

const WELCOME_NOTIF = {
  type: 'welcome',
  title: 'Bem-vindo ao Empório Coisas de Minas! 🎉',
  body: 'Estamos felizes em ter você aqui! Explore nossos produtos e aproveite as melhores delícias mineiras.',
  read: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `há ${h} hora${h > 1 ? 's' : ''}`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? 's' : ''}`;
}

function notifRef(uid) {
  return collection(getFirestore(app), 'users', uid, 'notifications');
}

// ── Exported helper for badge counts ─────────────────────────────────────────
export async function getUnreadCount(uid) {
  if (!uid) return 0;
  try {
    const snap = await getDocs(notifRef(uid));
    return snap.docs.filter((d) => d.data().read === false).length;
  } catch (_) {
    return 0;
  }
}

// ─── NotifCard ────────────────────────────────────────────────────────────────

function NotifCard({ item, onPress }) {
  const cfg   = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
  const unread = !item.read;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress(item)}
      style={[styles.card, unread && styles.cardUnread]}
    >
      {/* Left accent bar for unread */}
      {unread && <View style={styles.unreadBar} />}

      <View style={[styles.iconWrap, { backgroundColor: cfg.color + '18' }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, unread && styles.cardTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          {unread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.cardBodyText} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsPanel({ navigation }) {
  const { user }                          = useAuth();
  const [items, setItems]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);

  const hasUnread = items.some((n) => !n.read);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user?.uid) { setLoading(false); return; }
    try {
      const ref  = notifRef(user.uid);
      const q    = query(ref, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      // If no notifications exist, create the welcome one
      if (snap.empty) {
        const newRef = await addDoc(ref, { ...WELCOME_NOTIF, createdAt: serverTimestamp() });
        setItems([{ id: newRef.id, ...WELCOME_NOTIF, createdAt: null }]);
      } else {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Mark single as read ───────────────────────────────────────────────────
  const handleRead = useCallback(async (item) => {
    if (item.read || !user?.uid) return;
    // Optimistic update
    setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, read: true } : n));
    try {
      await updateDoc(doc(getFirestore(app), 'users', user.uid, 'notifications', item.id), { read: true });
    } catch (_) {
      // revert on failure
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, read: false } : n));
    }
  }, [user]);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const handleMarkAll = useCallback(async () => {
    if (!user?.uid || markingAll) return;
    setMarkingAll(true);
    const unread = items.filter((n) => !n.read);
    // Optimistic
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const db = getFirestore(app);
      await Promise.all(
        unread.map((n) =>
          updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true })
        )
      );
    } catch (_) {
      // revert
      setItems((prev) =>
        prev.map((n) => {
          const wasUnread = unread.find((u) => u.id === n.id);
          return wasUnread ? { ...n, read: false } : n;
        })
      );
    } finally {
      setMarkingAll(false);
    }
  }, [user, items, markingAll]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={C.brown} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notificações</Text>

        {hasUnread ? (
          <TouchableOpacity
            onPress={handleMarkAll}
            disabled={markingAll}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {markingAll
              ? <ActivityIndicator size="small" color={C.terra} />
              : <Text style={styles.markAllBtn}>Marcar todas</Text>
            }
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.terra} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-outline" size={36} color={C.terra} />
          </View>
          <Text style={styles.emptyText}>Nenhuma notificação ainda</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotifCard item={item} onPress={handleRead} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.cream,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: C.brown,
  },
  markAllBtn: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.terra,
    textAlign: 'right',
    width: 80,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 10,
  },

  // ── Card ──
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    overflow: 'hidden',
    shadowColor: C.brown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: C.softCream,
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: C.terra,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    color: C.ink,
  },
  cardTitleUnread: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: C.brown,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: UNREAD_DOT,
    flexShrink: 0,
  },
  cardBodyText: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 13,
    color: C.muted,
    lineHeight: 19,
  },
  cardTime: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 12,
    color: C.subtle,
    marginTop: 2,
  },

  // ── States ──
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 14,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.softCream,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: C.muted,
  },
});
