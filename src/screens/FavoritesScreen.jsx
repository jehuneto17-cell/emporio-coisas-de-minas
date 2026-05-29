import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesScreen({ navigation }) {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <Text style={styles.headerCount}>{favorites.length} produtos</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color={C.border} />
          <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
          <Text style={styles.emptyText}>Salve os produtos que você adorou para encontrá-los facilmente.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.exploreBtnText}>Explorar produtos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {favorites.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { product: p })}
              activeOpacity={0.9}
            >
              <LinearGradient colors={p.colors} style={styles.cardImg}>
                {p.sale && (
                  <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>−{p.sale}%</Text>
                  </View>
                )}
              </LinearGradient>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={2}>{p.name}</Text>
                <Text style={styles.cardProducer}>{p.producer}</Text>
                <View style={styles.cardRating}>
                  <Ionicons name="star" size={11} color={C.ochre} />
                  <Text style={styles.ratingText}>{p.rating}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{p.price}</Text>
                  <TouchableOpacity style={styles.cartBtn}>
                    <Ionicons name="cart-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFavorite(p.id)}>
                <Ionicons name="heart" size={20} color={C.terra} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 24, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  headerCount: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' },
  emptyText: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', lineHeight: 20 },
  exploreBtn: { height: 48, paddingHorizontal: 24, borderRadius: 12, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  exploreBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  card: { backgroundColor: C.card, borderRadius: 16, flexDirection: 'row', overflow: 'hidden', alignItems: 'center' },
  cardImg: { width: 90, height: 90 },
  saleBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: C.terra, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2.5 },
  saleBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'WorkSans_600SemiBold' },
  cardInfo: { flex: 1, padding: 12, gap: 3 },
  cardName: { fontSize: 14, color: C.ink, fontFamily: 'PlusJakartaSans_600SemiBold', lineHeight: 18 },
  cardProducer: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular' },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 11, color: C.muted, fontFamily: 'WorkSans_600SemiBold' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice: { fontSize: 14, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  cartBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { padding: 16 },
});
