import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Jar, Cake, Pepper, FireSimple, Bread, Wine, ShoppingBag } from 'phosphor-react-native';
import { C } from '../theme';
import { getCategories } from '../services/firestore';

function getCatIcon(name = '', size = 36, color = '#964904') {
  const n = name.toLowerCase();
  if (n.includes('antepasto') || n.includes('patê') || n.includes('pasta')) return <Jar size={size} color={color} weight="light" />;
  if (n.includes('doce'))      return <Cake size={size} color={color} weight="light" />;
  if (n.includes('geleia'))    return <Pepper size={size} color={color} weight="light" />;
  if (n.includes('pimenta') || n.includes('molho')) return <FireSimple size={size} color={color} weight="light" />;
  if (n.includes('torrada') || n.includes('pão') || n.includes('pao')) return <Bread size={size} color={color} weight="light" />;
  if (n.includes('vinho'))     return <Wine size={size} color={color} weight="light" />;
  return <ShoppingBag size={size} color={color} weight="light" />;
}

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(cats => { setCategories(cats); setLoading(false); })
      .catch(err => { console.warn('[CategoriesScreen]', err); setLoading(false); });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categorias</Text>
        <Text style={styles.headerSub}>Explore os sabores de Minas</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={C.brown} />
      ) : categories.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={52} color={C.border} />
          <Text style={styles.emptyTitle}>Nenhuma categoria disponível ainda</Text>
          <Text style={styles.emptySub}>Os produtos aparecerão aqui assim que forem cadastrados.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catCard}
              onPress={() => navigation.navigate('Subcategory', { category: cat })}
              activeOpacity={0.85}
            >
              <View style={styles.catIconWrap}>
                {getCatIcon(cat.name)}
              </View>
              <View style={styles.catInfo}>
                <Text style={styles.catLabel}>{cat.name}</Text>
                <Text style={styles.catCount}>
                  {cat.count} {cat.count === 1 ? 'produto' : 'produtos'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} style={{ marginRight: 16 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.cream },
  header:      { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 24, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  headerSub:   { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  loader:      { flex: 1 },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle:  { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: C.brown, textAlign: 'center', marginTop: 8 },
  emptySub:    { fontSize: 13, fontFamily: 'WorkSans_400Regular', color: C.muted, textAlign: 'center', lineHeight: 20 },
  grid:        { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  catCard:     { backgroundColor: C.card, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  catIconWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf5ec', borderRadius: 12, margin: 8 },
  catInfo:     { flex: 1 },
  catLabel:    { fontSize: 16, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  catCount:    { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 3 },
});
