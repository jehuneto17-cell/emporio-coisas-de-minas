import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

import { C } from '../theme';
import { useAuth } from '../context/AuthContext';
import app from '../services/firebase';

// ─── Config ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFS = {
  orderStatus:    true,
  promotions:     true,
  favoritesOnSale: true,
  newProducts:    true,
  emailSummary:   true,
  newsletter:     true,
};

const SECTIONS = [
  {
    label: 'Pedidos',
    items: [
      {
        key: 'orderStatus',
        icon: 'bag-check-outline',
        title: 'Status do pedido',
        subtitle: 'Avisos de confirmação, envio e entrega',
      },
      {
        key: 'promotions',
        icon: 'pricetag-outline',
        title: 'Promoções e ofertas',
        subtitle: 'Cupons e descontos exclusivos',
      },
    ],
  },
  {
    label: 'Produtos',
    items: [
      {
        key: 'favoritesOnSale',
        icon: 'heart-outline',
        title: 'Favoritos em oferta',
        subtitle: 'Quando um produto favoritado entrar em promoção',
      },
      {
        key: 'newProducts',
        icon: 'sparkles-outline',
        title: 'Novidades',
        subtitle: 'Novos produtos adicionados ao catálogo',
      },
    ],
  },
  {
    label: 'Geral',
    items: [
      {
        key: 'emailSummary',
        icon: 'mail-outline',
        title: 'Notificações por e-mail',
        subtitle: 'Receber resumos por e-mail',
      },
      {
        key: 'newsletter',
        icon: 'newspaper-outline',
        title: 'Novidades do Empório',
        subtitle: 'Newsletter e atualizações',
      },
    ],
  },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function ToggleItem({ icon, title, subtitle, value, onChange, isLast }) {
  return (
    <View style={[styles.itemRow, !isLast && styles.itemRowBorder]}>
      <View style={[styles.itemIconWrap, { backgroundColor: C.terra + '18' }]}>
        <Ionicons name={icon} size={20} color={C.terra} />
      </View>
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.terra }}
        thumbColor={value ? '#fff' : '#fff'}
        ios_backgroundColor={C.border}
        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
      />
    </View>
  );
}

function InfoCard() {
  return (
    <View style={styles.infoCard}>
      <Ionicons name="information-circle-outline" size={22} color={C.ochre} style={styles.infoIcon} />
      <Text style={styles.infoText}>
        As notificações push serão ativadas em breve. Por enquanto, suas preferências já estão sendo salvas.
      </Text>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [prefs, setPrefs]     = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  // ── Load preferences ──────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.uid) {
        if (active) setLoading(false);
        return;
      }
      try {
        const db   = getFirestore(app);
        const ref  = doc(db, 'users', user.uid, 'settings', 'notifications');
        const snap = await getDoc(ref);
        if (active && snap.exists()) {
          setPrefs((prev) => ({ ...prev, ...snap.data() }));
        }
      } catch (_) {
        // keep defaults on error
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);

  // ── Save on toggle ────────────────────────────────────────────────────────
  const handleToggle = useCallback(async (key, newVal) => {
    const newPrefs = { ...prefs, [key]: newVal };
    setPrefs(newPrefs);
    if (!user?.uid) return;
    try {
      const db  = getFirestore(app);
      const ref = doc(db, 'users', user.uid, 'settings', 'notifications');
      await setDoc(ref, newPrefs, { merge: true });
    } catch (_) {
      // silently fail — UI already updated optimistically
    }
  }, [prefs, user]);

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
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={C.terra} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SECTIONS.map((section) => (
            <React.Fragment key={section.label}>
              <SectionLabel>{section.label}</SectionLabel>
              <View style={styles.card}>
                {section.items.map((item, idx) => (
                  <ToggleItem
                    key={item.key}
                    icon={item.icon}
                    title={item.title}
                    subtitle={item.subtitle}
                    value={prefs[item.key]}
                    onChange={(val) => handleToggle(item.key, val)}
                    isLast={idx === section.items.length - 1}
                  />
                ))}
              </View>
            </React.Fragment>
          ))}

          <InfoCard />
          <View style={styles.bottomPad} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

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

  // ── Loading ──
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: C.subtle,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
  },

  // ── Card ──
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: C.brown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },

  // ── Toggle item ──
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 15,
    color: C.ink,
  },
  itemSubtitle: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 13,
    color: C.subtle,
    lineHeight: 18,
  },

  // ── Info card ──
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.softCream,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  infoIcon: {
    flexShrink: 0,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontFamily: 'WorkSans_400Regular',
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
  },

  bottomPad: { height: 32 },
});
