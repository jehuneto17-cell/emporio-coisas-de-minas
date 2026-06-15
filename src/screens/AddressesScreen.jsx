import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, Modal, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  getAddresses, saveAddress, deleteAddress, setDefaultAddress,
} from '../services/firestore';

const LABELS = ['Casa', 'Trabalho', 'Outro'];
const EMPTY_FORM = {
  label: 'Casa', cep: '', street: '', number: '',
  complement: '', neighborhood: '', city: '', state: 'MG',
};

function Field({ label, value, onChangeText, placeholder, keyboardType, editable = true, loading, rightIcon }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldRow, focused && styles.fieldRowFocused, !editable && styles.fieldRowDisabled]}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.subtle}
          keyboardType={keyboardType || 'default'}
          editable={editable && !loading}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {loading ? <ActivityIndicator size="small" color={C.terra} /> : rightIcon}
      </View>
    </View>
  );
}

function AddressCard({ address, onEdit, onDelete, onSetDefault }) {
  const line1 = [address.street, address.number].filter(Boolean).join(', ');
  const line2 = [address.neighborhood, address.city, address.state].filter(Boolean).join(' · ');
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLabelRow}>
          <View style={styles.labelChip}>
            <Ionicons
              name={address.label === 'Trabalho' ? 'briefcase-outline' : 'home-outline'}
              size={12} color={C.terra}
            />
            <Text style={styles.labelChipText}>{address.label || 'Endereço'}</Text>
          </View>
          {address.isDefault && (
            <View style={styles.defaultChip}>
              <Ionicons name="star" size={10} color={C.ochre} />
              <Text style={styles.defaultChipText}>Padrão</Text>
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={16} color={C.brown} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color="#e05555" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardLine1} numberOfLines={1}>{line1 || '—'}</Text>
      {address.complement ? <Text style={styles.cardLine2}>{address.complement}</Text> : null}
      <Text style={styles.cardLine2} numberOfLines={1}>{line2}</Text>
      {address.cep ? <Text style={styles.cardCep}>CEP {address.cep}</Text> : null}
      {!address.isDefault && (
        <TouchableOpacity style={styles.setDefaultBtn} onPress={onSetDefault}>
          <Ionicons name="star-outline" size={14} color={C.terra} />
          <Text style={styles.setDefaultText}>Definir como padrão</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AddressesScreen({ navigation }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    if (!user) { setLoading(false); return; }
    try {
      const data = await getAddresses(user.uid);
      setAddresses(data);
    } catch (e) {
      console.warn('[Addresses] load error', e);
    } finally {
      setLoading(false);
    }
  }

  function openModal(address = null) {
    setForm(address ? { ...address } : { ...EMPTY_FORM });
    setEditingId(address?.id ?? null);
    setModalVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start();
  }

  function closeModal() {
    Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    });
  }

  async function handleCepBlur() {
    const raw = form.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    } catch {
      // ViaCEP offline — usuário preenche manualmente
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSave() {
    if (!form.street.trim()) {
      Alert.alert('Atenção', 'Informe o nome da rua.');
      return;
    }
    if (!form.city.trim()) {
      Alert.alert('Atenção', 'Informe a cidade.');
      return;
    }
    setSaving(true);
    try {
      const isFirst = addresses.length === 0 && !editingId;
      await saveAddress(user.uid, {
        ...form,
        id: editingId,
        isDefault: editingId
          ? (addresses.find(a => a.id === editingId)?.isDefault ?? false)
          : isFirst,
      });
      await load();
      closeModal();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o endereço.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert(
      'Excluir endereço',
      'Tem certeza que deseja remover este endereço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(user.uid, id);
              await load();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  }

  async function handleSetDefault(id) {
    try {
      await setDefaultAddress(user.uid, id);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    } catch {
      Alert.alert('Erro', 'Não foi possível definir o endereço padrão.');
    }
  }

  function setField(key) {
    return (val) => setForm(f => ({ ...f, [key]: val }));
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.brown} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Endereços</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.guestState}>
          <Ionicons name="location-outline" size={60} color={C.border} />
          <Text style={styles.guestTitle}>Você não está logado</Text>
          <Text style={styles.guestDesc}>Faça login para gerenciar seus endereços de entrega.</Text>
          <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.guestBtnText}>Entrar / Criar conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Endereços</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <Ionicons name="add" size={22} color={C.brown} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.brown} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="location-outline" size={40} color={C.border} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum endereço salvo</Text>
              <Text style={styles.emptyDesc}>
                Adicione um endereço de entrega para agilizar suas compras.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => openModal()}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Adicionar endereço</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {addresses
                .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                .map(addr => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    onEdit={() => openModal(addr)}
                    onDelete={() => handleDelete(addr.id)}
                    onSetDefault={() => handleSetDefault(addr.id)}
                  />
                ))}
              <TouchableOpacity style={styles.addMoreBtn} onPress={() => openModal()}>
                <Ionicons name="add-circle-outline" size={18} color={C.terra} />
                <Text style={styles.addMoreText}>Adicionar novo endereço</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* Modal de form */}
      <Modal transparent visible={modalVisible} animationType="none" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal} />
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingId ? 'Editar endereço' : 'Novo endereço'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Label */}
              <Text style={[styles.fieldLabel, { marginHorizontal: 16, marginBottom: 8 }]}>Tipo</Text>
              <View style={styles.labelRow}>
                {LABELS.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.labelOption, form.label === l && styles.labelOptionActive]}
                    onPress={() => setForm(f => ({ ...f, label: l }))}
                  >
                    <Ionicons
                      name={l === 'Trabalho' ? 'briefcase-outline' : l === 'Casa' ? 'home-outline' : 'location-outline'}
                      size={14}
                      color={form.label === l ? '#fff' : C.muted}
                    />
                    <Text style={[styles.labelOptionText, form.label === l && styles.labelOptionTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formPad}>
                <Field
                  label="CEP"
                  value={form.cep}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, '').slice(0, 8);
                    const fmt = digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits;
                    setField('cep')(fmt);
                  }}
                  placeholder="00000-000"
                  keyboardType="numeric"
                  loading={cepLoading}
                  rightIcon={
                    <TouchableOpacity onPress={handleCepBlur}>
                      <Ionicons name="search-outline" size={18} color={C.terra} />
                    </TouchableOpacity>
                  }
                />

                <View style={styles.row}>
                  <View style={{ flex: 2.2 }}>
                    <Field label="Rua / Logradouro" value={form.street} onChangeText={setField('street')} placeholder="Nome da rua" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Número" value={form.number} onChangeText={setField('number')} placeholder="Nº" keyboardType="numeric" />
                  </View>
                </View>

                <Field label="Complemento" value={form.complement} onChangeText={setField('complement')} placeholder="Apto, bloco, casa..." />
                <Field label="Bairro" value={form.neighborhood} onChangeText={setField('neighborhood')} placeholder="Seu bairro" />

                <View style={styles.row}>
                  <View style={{ flex: 2.2 }}>
                    <Field label="Cidade" value={form.city} onChangeText={setField('city')} placeholder="Sua cidade" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Estado" value={form.state} onChangeText={setField('state')} placeholder="UF" />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={styles.saveBtnText}>Salvar endereço</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: C.cream },
  header:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle:          { flex: 1, textAlign: 'center', fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  backBtn:              { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addBtn:               { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  loadingWrap:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:               { padding: 16, paddingBottom: 40 },

  // cards
  card:                 { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: C.brown, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardTop:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLabelRow:         { flexDirection: 'row', gap: 8, alignItems: 'center' },
  labelChip:            { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fdf0e8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  labelChipText:        { fontSize: 12, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  defaultChip:          { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff8ec', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  defaultChipText:      { fontSize: 11, color: C.ochre, fontFamily: 'WorkSans_600SemiBold' },
  cardActions:          { flexDirection: 'row', gap: 8 },
  actionBtn:            { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  cardLine1:            { fontSize: 15, color: C.ink, fontFamily: 'WorkSans_500Medium', marginBottom: 2 },
  cardLine2:            { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', marginBottom: 2 },
  cardCep:              { fontSize: 12, color: C.subtle, fontFamily: 'WorkSans_400Regular', marginTop: 4 },
  setDefaultBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  setDefaultText:       { fontSize: 13, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },

  // add more
  addMoreBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 1.5, borderColor: C.terra, borderRadius: 14, borderStyle: 'dashed', backgroundColor: '#fffaf6' },
  addMoreText:          { fontSize: 14, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },

  // empty
  emptyState:           { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, gap: 12 },
  emptyIconWrap:        { width: 80, height: 80, borderRadius: 40, backgroundColor: C.softCream, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:           { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' },
  emptyDesc:            { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', lineHeight: 22 },
  emptyBtn:             { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: C.terra, borderRadius: 12 },
  emptyBtnText:         { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },

  // guest
  guestState:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  guestTitle:           { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' },
  guestDesc:            { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', lineHeight: 22 },
  guestBtn:             { marginTop: 8, height: 50, paddingHorizontal: 32, borderRadius: 12, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  guestBtnText:         { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },

  // modal
  modalOverlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: 34 },
  sheetHandle:          { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  sheetTitle:           { fontSize: 17, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },

  // label selector
  labelRow:             { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  labelOption:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.cream },
  labelOptionActive:    { backgroundColor: C.terra, borderColor: C.terra },
  labelOptionText:      { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  labelOptionTextActive:{ color: '#fff' },

  // form
  formPad:              { paddingHorizontal: 16, paddingBottom: 16 },
  fieldWrap:            { marginBottom: 12 },
  fieldLabel:           { fontSize: 12, fontFamily: 'WorkSans_600SemiBold', color: C.brown, marginBottom: 6 },
  fieldRow:             { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  fieldRowFocused:      { borderWidth: 2, borderColor: C.brown },
  fieldRowDisabled:     { backgroundColor: C.softCream },
  fieldInput:           { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular' },
  row:                  { flexDirection: 'row', gap: 10 },
  saveBtn:              { height: 52, borderRadius: 12, backgroundColor: C.terra, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  saveBtnText:          { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
});
