import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Jar, Cake, Pepper, FireSimple, Bread, Wine, ShoppingBag } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';
import { getSubcategories } from '../services/firestore';

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

export default function SubcategoryScreen({ navigation, route }) {
  const parentCategory = route.params?.category;
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentCategory?.id) return;
    getSubcategories(parentCategory.id)
      .then(setSubcategories)
      .catch(err => console.warn('[SubcategoryScreen]', err))
      .finally(() => setLoading(false));
  }, [parentCategory?.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{parentCategory?.name || 'Subcategorias'}</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={C.brown} />
      ) : subcategories.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={52} color={C.border} />
          <Text style={styles.emptyTitle}>Nenhuma subcategoria encontrada</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Listing', { category: parentCategory })} style={styles.verTodosBtn}>
            <Text style={styles.verTodosText}>Ver todos os produtos desta categoria</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: '#fdf0e6' }]}
            onPress={() => navigation.navigate('Listing', { category: parentCategory })}
            activeOpacity={0.85}
          >
            <View style={styles.iconWrap}>
              {getCatIcon(parentCategory?.name)}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>Todos de {parentCategory?.name}</Text>
              <Text style={styles.cardCount}>{parentCategory?.count || 0} produtos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </TouchableOpacity>

          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.card}
              onPress={() => navigation.navigate('Listing', { category: { ...sub, isSubcategory: true, parentId: parentCategory.id } })}
              activeOpacity={0.85}
            >
              <View style={styles.iconWrap}>
                {getCatIcon(sub.name)}
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{sub.name}</Text>
                <Text style={styles.cardCount}>{sub.count} {sub.count === 1 ? 'produto' : 'produtos'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.cream },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, textAlign: 'center', fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle:   { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: C.brown, textAlign: 'center' },
  verTodosBtn:  { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.terra, borderRadius: 12 },
  verTodosText: { color: '#fff', fontSize: 13, fontFamily: 'WorkSans_600SemiBold' },
  list:         { padding: 20, gap: 12 },
  card:         { backgroundColor: C.card, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 14, paddingRight: 16 },
  iconWrap:     { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf5ec', borderRadius: 12, margin: 8 },
  cardInfo:     { flex: 1 },
  cardName:     { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  cardCount:    { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 3 },
});
