import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/firestore';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Field({ label, value, onChangeText, placeholder, keyboardType, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldRow, focused && styles.fieldRowFocused]}>
        {icon && <Ionicons name={icon} size={18} color={C.muted} style={{ marginRight: 8 }} />}
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.subtle}
          keyboardType={keyboardType || 'default'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function EditProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('MG');

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(p => {
      if (!p) return;
      setName(p.name || '');
      setPhone(p.phone || '');
      setBirthDate(p.birthDate || '');
      setCep(p.address?.cep || '');
      setStreet(p.address?.street || '');
      setNumber(p.address?.number || '');
      setComplement(p.address?.complement || '');
      setNeighborhood(p.address?.neighborhood || '');
      setCity(p.address?.city || '');
      setState(p.address?.state || 'MG');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Atenção', 'O nome é obrigatório'); return; }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        name: name.trim(),
        phone: phone.trim(),
        birthDate: birthDate.trim(),
        address: { cep, street, number, complement, neighborhood, city, state },
      });
      Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const displayName = name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.brown} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 38 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={C.brown} size="large" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <LinearGradient colors={[C.terra, C.brown]} style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </LinearGradient>
              <TouchableOpacity style={styles.cameraBtn}>
                <Ionicons name="camera" size={15} color={C.brown} />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 10 }}>
                <Text style={styles.alterarFoto}>Alterar foto</Text>
              </TouchableOpacity>
            </View>

            {/* Dados pessoais */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="person-outline" size={17} color={C.terra} />
                </View>
                <Text style={styles.cardTitle}>Dados pessoais</Text>
              </View>
              <Field label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome completo" icon="person-outline" />
              <Field label="WhatsApp" value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" icon="phone-portrait-outline" />
              <Field label="Data de nascimento" value={birthDate} onChangeText={setBirthDate} placeholder="DD/MM/AAAA" icon="calendar-outline" />
            </View>

            {/* Endereço */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="location-outline" size={17} color={C.terra} />
                </View>
                <Text style={styles.cardTitle}>Endereço de entrega</Text>
              </View>
              <Field label="CEP" value={cep} onChangeText={setCep} placeholder="00000-000" keyboardType="numeric" />
              <View style={styles.row}>
                <View style={{ flex: 2.2 }}>
                  <Field label="Rua" value={street} onChangeText={setStreet} placeholder="Nome da rua" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Número" value={number} onChangeText={setNumber} placeholder="Nº" keyboardType="numeric" />
                </View>
              </View>
              <Field label="Complemento" value={complement} onChangeText={setComplement} placeholder="Apto, bloco..." />
              <Field label="Bairro" value={neighborhood} onChangeText={setNeighborhood} placeholder="Seu bairro" />
              <View style={styles.row}>
                <View style={{ flex: 2.2 }}>
                  <Field label="Cidade" value={city} onChangeText={setCity} placeholder="Sua cidade" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Estado" value={state} onChangeText={setState} placeholder="UF" />
                </View>
              </View>
            </View>

          </ScrollView>
        )}

        {/* Botão salvar */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Salvar alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.cream },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  backBtn:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { flex: 1, textAlign: 'center', fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  scroll:          { paddingHorizontal: 16, paddingBottom: 24 },
  avatarWrap:      { alignItems: 'center', paddingVertical: 16 },
  avatar:          { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText:      { fontSize: 34, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  cameraBtn:       { position: 'absolute', right: '50%', bottom: 32, marginRight: -60, width: 32, height: 32, borderRadius: 16, backgroundColor: C.ochre, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  alterarFoto:     { fontSize: 13, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  card:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: C.brown, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardIconWrap:    { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f0ede9', alignItems: 'center', justifyContent: 'center' },
  cardTitle:       { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  fieldWrap:       { marginBottom: 12 },
  fieldLabel:      { fontSize: 12, fontFamily: 'WorkSans_600SemiBold', color: C.brown, marginBottom: 6 },
  fieldRow:        { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  fieldRowFocused: { borderWidth: 2, borderColor: C.brown },
  fieldInput:      { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular' },
  row:             { flexDirection: 'row', gap: 10 },
  footer:          { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border },
  saveBtn:         { height: 52, borderRadius: 12, backgroundColor: C.terra, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText:     { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
});
