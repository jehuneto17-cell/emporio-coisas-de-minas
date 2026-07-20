import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, TextInput, Alert,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';
import { useAuth } from '../context/AuthContext';
import { sendPasswordResetEmail, deleteAccount, getAuthErrorMessage } from '../services/auth';

const PRIVACY_SECTIONS = [
  {
    title: 'Quais dados coletamos',
    body: 'Coletamos nome, e-mail e telefone no cadastro. Também armazenamos os itens do seu carrinho, favoritos e histórico de pedidos para personalizar sua experiência.',
  },
  {
    title: 'Como usamos seus dados',
    body: 'Seus dados são usados exclusivamente para processar pedidos, enviar atualizações sobre entregas e melhorar o app. Nunca vendemos ou compartilhamos suas informações com terceiros.',
  },
  {
    title: 'Armazenamento e segurança',
    body: 'Os dados são armazenados no Firebase (Google Cloud) com criptografia em trânsito e em repouso. As regras de acesso garantem que apenas você visualiza seus próprios dados.',
  },
  {
    title: 'Seus direitos (LGPD)',
    body: 'Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento através do botão "Excluir minha conta" nesta tela.',
  },
  {
    title: 'Cookies e rastreamento',
    body: 'Na versão web usamos cookies estritamente necessários para manter sua sessão ativa. Não utilizamos cookies de rastreamento ou publicidade.',
  },
  {
    title: 'Contato',
    body: 'Dúvidas sobre privacidade? Envie um e-mail para emporiominas00@gmail.com ou acesse o suporte pelo WhatsApp na tela de Ajuda.',
  },
];

function SectionItem({ item, index, total }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{item.title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.brown} />
      </TouchableOpacity>
      {open && <Text style={styles.sectionBody}>{item.body}</Text>}
      {index < total - 1 && <View style={styles.divider} />}
    </View>
  );
}

export default function PrivacyScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [resetModal, setResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeletePwd, setShowDeletePwd] = useState(false);

  async function handlePasswordReset() {
    if (!resetEmail.trim()) {
      Alert.alert('Informe o e-mail', 'Digite o e-mail cadastrado para redefinir a senha.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(resetEmail.trim());
      setResetDone(true);
    } catch (e) {
      Alert.alert('Erro', getAuthErrorMessage(e.code));
    } finally {
      setResetLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword.trim()) {
      Alert.alert('Senha obrigatória', 'Digite sua senha atual para confirmar a exclusão.');
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
      await logout();
      setDeleteModal(false);
      Alert.alert(
        'Conta excluída',
        'Seus dados pessoais (carrinho, favoritos, endereços e preferências) foram removidos. O histórico de pedidos é mantido por período determinado, conforme exigido pela legislação fiscal e de defesa do consumidor.'
      );
    } catch (e) {
      const msg = e.code
        ? getAuthErrorMessage(e.code)
        : 'Não foi possível excluir a conta. Verifique sua senha e tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidade e Segurança</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Ações de segurança */}
        <View style={styles.actionsCard}>
          <View style={styles.actionsIntro}>
            <Ionicons name="shield-checkmark-outline" size={28} color={C.brown} />
            <Text style={styles.actionsTitle}>Segurança da conta</Text>
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              setResetDone(false);
              setResetEmail(user?.email || '');
              setResetModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="key-outline" size={20} color={C.brown} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Redefinir senha</Text>
              <Text style={styles.actionDesc}>Enviaremos um link de redefinição para o seu e-mail</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.subtle} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={() => {
              setDeletePassword('');
              setDeleteModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, styles.actionIconDanger]}>
              <Ionicons name="trash-outline" size={20} color="#d32f2f" />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionLabel, styles.actionLabelDanger]}>Excluir minha conta</Text>
              <Text style={styles.actionDesc}>Remove permanentemente todos os seus dados</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.subtle} />
          </TouchableOpacity>
        </View>

        {/* Política de Privacidade */}
        <Text style={styles.policyHeading}>Política de Privacidade</Text>
        <Text style={styles.policyDate}>Última atualização: junho de 2026</Text>
        <View style={styles.policyCard}>
          {PRIVACY_SECTIONS.map((item, i) => (
            <SectionItem key={i} item={item} index={i} total={PRIVACY_SECTIONS.length} />
          ))}
        </View>

        <Text style={styles.lgpdNote}>
          Este app segue as diretrizes da LGPD (Lei Geral de Proteção de Dados — Lei nº 13.709/2018).
        </Text>
      </ScrollView>

      {/* Modal: Redefinir Senha */}
      <Modal
        visible={resetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Redefinir senha</Text>

            {resetDone ? (
              <>
                <Ionicons name="checkmark-circle-outline" size={48} color={C.greenFg} style={styles.modalIcon} />
                <Text style={styles.modalDesc}>
                  E-mail enviado para {resetEmail}. Verifique sua caixa de entrada (e o spam) para redefinir a senha.
                </Text>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setResetModal(false)}>
                  <Text style={styles.modalBtnText}>Fechar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalDesc}>
                  Digite o e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
                </Text>
                <TextInput
                  style={styles.input}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor={C.subtle}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalBtnOutline} onPress={() => setResetModal(false)}>
                    <Text style={styles.modalBtnOutlineText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnFlex, resetLoading && styles.modalBtnDisabled]}
                    onPress={handlePasswordReset}
                    disabled={resetLoading}
                  >
                    {resetLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.modalBtnText}>Enviar link</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Excluir conta */}
      <Modal
        visible={deleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Ionicons name="warning-outline" size={36} color="#d32f2f" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Excluir conta</Text>
            <Text style={styles.modalDesc}>
              Esta ação é irreversível. Todos os seus dados (pedidos, favoritos, perfil) serão removidos permanentemente.
            </Text>
            <Text style={styles.modalDesc}>Digite sua senha atual para confirmar:</Text>
            <View style={styles.pwdRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Sua senha atual"
                placeholderTextColor={C.subtle}
                secureTextEntry={!showDeletePwd}
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowDeletePwd((v) => !v)}>
                <Ionicons name={showDeletePwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.subtle} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnOutline} onPress={() => setDeleteModal(false)}>
                <Text style={styles.modalBtnOutlineText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnFlex, styles.modalBtnDanger, deleteLoading && styles.modalBtnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalBtnText}>Excluir</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, color: C.brown, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },

  actionsCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 12 },
  actionsIntro: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  actionsTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionRowLast: { marginTop: 4 },
  actionIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.softCream, alignItems: 'center', justifyContent: 'center',
  },
  actionIconDanger: { backgroundColor: '#fdecea' },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 14, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  actionLabelDanger: { color: '#d32f2f' },
  actionDesc: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 2 },

  policyHeading: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  policyDate: { fontSize: 12, color: C.subtle, fontFamily: 'WorkSans_400Regular', marginTop: -8 },
  policyCard: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  sectionTitle: { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_600SemiBold', lineHeight: 20 },
  sectionBody: {
    fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular',
    lineHeight: 21, paddingHorizontal: 16, paddingBottom: 14,
  },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  lgpdNote: {
    fontSize: 12, color: C.subtle, fontFamily: 'WorkSans_400Regular',
    textAlign: 'center', lineHeight: 18,
  },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, width: '100%', gap: 12,
  },
  modalIcon: { alignSelf: 'center' },
  modalTitle: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' },
  modalDesc: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', lineHeight: 21, textAlign: 'center' },
  input: {
    height: 48, borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 14, color: C.ink,
    fontFamily: 'WorkSans_400Regular', backgroundColor: C.cream,
  },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: {
    backgroundColor: C.brown, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnFlex: { flex: 1 },
  modalBtnDanger: { backgroundColor: '#d32f2f' },
  modalBtnDisabled: { opacity: 0.6 },
  modalBtnText: { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  modalBtnOutline: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  modalBtnOutlineText: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_600SemiBold' },
});
