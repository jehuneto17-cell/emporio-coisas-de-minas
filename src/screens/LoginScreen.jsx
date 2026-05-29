import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/auth';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!email.trim() || !pwd) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setError('');
    setLoadingAuth(true);
    try {
      await login(email.trim(), pwd);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('Main');
      }
    } catch (e) {
      setError(getAuthErrorMessage(e.code));
    } finally {
      setLoadingAuth(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <View style={styles.dot} />
            <View style={styles.line} />
          </View>
          <Text style={styles.tagline}>Delícias da Canastra e outros trem…</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrap}>
          <View style={styles.tabsContainer}>
            {[{ id: 'login', label: 'Entrar' }, { id: 'signup', label: 'Cadastrar' }].map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => t.id === 'signup' ? navigation.navigate('SignUp') : setTab('login')}
                style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
              >
                <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Field
            label="E-mail" icon="mail-outline" placeholder="seu@email.com"
            value={email} onChangeText={(v) => { setEmail(v); setError(''); }} keyboardType="email-address"
            focused={focus === 'email'} onFocus={() => setFocus('email')} onBlur={() => setFocus('')}
          />
          <View style={{ height: 14 }} />
          <Field
            label="Senha" icon="lock-closed-outline" placeholder="••••••••"
            value={pwd} onChangeText={(v) => { setPwd(v); setError(''); }}
            secureTextEntry={!show} focused={focus === 'pwd'}
            onFocus={() => setFocus('pwd')} onBlur={() => setFocus('')}
            right={
              <TouchableOpacity onPress={() => setShow(!show)} style={{ padding: 4 }}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.subtle} />
              </TouchableOpacity>
            }
          />
          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgot}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.ctaBtn, loadingAuth && styles.ctaBtnDisabled]}
            onPress={handleSignIn}
            disabled={loadingAuth}
          >
            {loadingAuth
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaBtnText}>Entrar na minha conta</Text>
            }
          </TouchableOpacity>

          <View style={styles.dividerSocial}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <SocialBtn label="Google" icon="logo-google" />
            <SocialBtn label="Facebook" icon="logo-facebook" />
          </View>
        </View>

        <View style={styles.bottomText}>
          <Text style={styles.bottomCaption}>
            Não tem conta?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
              Cadastre-se grátis
            </Text>
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
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={C.subtle}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize="none"
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
  tabsContainer: {
    backgroundColor: C.chip, borderRadius: 999, padding: 4,
    flexDirection: 'row', borderWidth: 1, borderColor: C.border,
  },
  tabBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  tabBtnActive: { backgroundColor: C.card },
  tabLabel: { fontSize: 15, color: C.subtle, fontFamily: 'WorkSans_500Medium' },
  tabLabelActive: { color: C.brown, fontFamily: 'PlusJakartaSans_600SemiBold' },
  formCard: {
    marginHorizontal: 20, marginTop: -1,
    backgroundColor: C.card, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: C.border, borderTopWidth: 0,
  },
  fieldLabel: { fontSize: 12, color: C.brown, fontFamily: 'WorkSans_600SemiBold', marginBottom: 6, letterSpacing: 0.5 },
  fieldRow: {
    height: 48, borderRadius: 10, backgroundColor: '#fff',
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10,
  },
  fieldRowFocused: { borderWidth: 2, borderColor: C.brown },
  input: { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_400Regular' },
  forgotWrap: { alignItems: 'flex-end', marginTop: 8, marginBottom: 6 },
  forgot: { fontSize: 13, color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
  errorText: { fontSize: 13, color: '#c0392b', fontFamily: 'WorkSans_500Medium', marginBottom: 8, textAlign: 'center' },
  ctaBtn: {
    height: 52, borderRadius: 12, backgroundColor: C.terra,
    alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  dividerSocial: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerText: { fontSize: 12, color: C.subtle, fontFamily: 'WorkSans_400Regular' },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1, height: 44, borderRadius: 10, backgroundColor: '#fff',
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  socialLabel: { fontSize: 13, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  bottomText: { padding: 20, alignItems: 'center' },
  bottomCaption: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center' },
  link: { color: C.terra, fontFamily: 'WorkSans_600SemiBold' },
});
