import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/auth';
import { createUserProfile } from '../services/firestore';

export default function SignUpScreen({ navigation }) {
  const { signup } = useAuth();
  const [tab, setTab] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !pwd) {
      setError('Preencha nome, e-mail e senha.');
      return;
    }
    if (pwd.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (pwd !== pwd2) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { user } = await signup(email.trim(), pwd);
      await createUserProfile(user.uid, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      navigation.replace('Main');
    } catch (e) {
      setError(getAuthErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.dividerRow}>
            <View style={styles.line} /><View style={styles.dot} /><View style={styles.line} />
          </View>
          <Text style={styles.tagline}>Delícias da Canastra e outros trem…</Text>
        </View>

        <View style={styles.tabsWrap}>
          <View style={styles.tabsContainer}>
            {[{ id: 'login', label: 'Entrar' }, { id: 'signup', label: 'Cadastrar' }].map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => t.id === 'login' ? navigation.navigate('Login') : setTab('signup')}
                style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
              >
                <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formCard}>
          <Field label="Nome completo" icon="person-outline" placeholder="João Silva" value={name} onChangeText={setName} focused={focus === 'name'} onFocus={() => setFocus('name')} onBlur={() => setFocus('')} />
          <View style={{ height: 12 }} />
          <Field label="E-mail" icon="mail-outline" placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" focused={focus === 'email'} onFocus={() => setFocus('email')} onBlur={() => setFocus('')} />
          <View style={{ height: 12 }} />
          <Field label="WhatsApp / Telefone" icon="call-outline" placeholder="(35) 99999-9999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" focused={focus === 'phone'} onFocus={() => setFocus('phone')} onBlur={() => setFocus('')} />
          <View style={{ height: 12 }} />
          <Field
            label="Criar senha" icon="lock-closed-outline" placeholder="mínimo 8 caracteres"
            value={pwd} onChangeText={setPwd} secureTextEntry={!show1}
            focused={focus === 'pwd'} onFocus={() => setFocus('pwd')} onBlur={() => setFocus('')}
            right={<TouchableOpacity onPress={() => setShow1(!show1)} style={{ padding: 4 }}><Ionicons name={show1 ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.subtle} /></TouchableOpacity>}
          />
          <View style={{ height: 12 }} />
          <Field
            label="Confirmar senha" icon="lock-closed-outline" placeholder="repita a senha"
            value={pwd2} onChangeText={setPwd2} secureTextEntry={!show2}
            focused={focus === 'pwd2'} onFocus={() => setFocus('pwd2')} onBlur={() => setFocus('')}
            right={<TouchableOpacity onPress={() => setShow2(!show2)} style={{ padding: 4 }}><Ionicons name={show2 ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.subtle} /></TouchableOpacity>}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaBtnText}>Criar minha conta grátis</Text>
            }
          </TouchableOpacity>

          <View style={styles.dividerSocial}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>ou cadastre com</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <SocialBtn label="Google" icon="logo-google" />
            <SocialBtn label="Facebook" icon="logo-facebook" />
          </View>
        </View>

        <View style={styles.bottomText}>
          <Text style={styles.bottomCaption}>
            Já tem conta?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>Entrar</Text>
          </Text>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, focused, onFocus, onBlur, right }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldRow, focused && styles.fieldRowFocused]}>
        <Ionicons name={icon} size={18} color={C.subtle} />
        <TextInput
          style={styles.input} placeholder={placeholder} placeholderTextColor={C.subtle}
          value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry}
          keyboardType={keyboardType} onFocus={onFocus} onBlur={onBlur} autoCapitalize="none"
          outlineStyle="none"
        />
        {right}
      </View>
    </View>
  );
}

function SocialBtn({ label, icon }) {
  return (
    <TouchableOpacity style={styles.socialBtn}>
      <Ionicons name={icon} size={16} color={C.ink} />
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, backgroundColor: C.cream },
  logo: { width: 200, height: 80 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: 180, marginTop: 10, gap: 8 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.border },
  tagline: { marginTop: 12, fontStyle: 'italic', fontSize: 13, color: C.muted, textAlign: 'center' },
  tabsWrap: { paddingHorizontal: 32, marginTop: -20, zIndex: 5 },
  tabsContainer: { backgroundColor: C.chip, borderRadius: 999, padding: 4, flexDirection: 'row', borderWidth: 1, borderColor: C.border },
  tabBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  tabBtnActive: { backgroundColor: C.card },
  tabLabel: { fontSize: 15, color: C.subtle, fontFamily: 'WorkSans_500Medium' },
  tabLabelActive: { color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold' },
  formCard: { marginHorizontal: 20, marginTop: -1, backgroundColor: C.card, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: C.border, borderTopWidth: 0 },
  fieldLabel: { fontSize: 12, color: C.brown, fontFamily: 'WorkSans_600SemiBold', marginBottom: 6, letterSpacing: 0.5 },
  fieldRow: { height: 48, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  fieldRowFocused: { borderWidth: 2, borderColor: C.brown },
  input: { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular' },
  errorText: { fontSize: 13, color: '#c0392b', fontFamily: 'WorkSans_500Medium', marginBottom: 8, textAlign: 'center' },
  ctaBtn: { height: 52, borderRadius: 12, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  dividerSocial: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerText: { fontSize: 12, color: C.subtle, fontFamily: 'WorkSans_400Regular' },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  socialLabel: { fontSize: 13, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  bottomText: { padding: 20, alignItems: 'center' },
  bottomCaption: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center' },
  link: { color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
});
