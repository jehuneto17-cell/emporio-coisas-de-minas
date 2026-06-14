import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

const FAQS = [
  {
    q: 'Como faço um pedido?',
    a: 'Escolha os produtos, adicione ao carrinho e finalize no Checkout. Você pode pagar via PIX, cartão de crédito ou boleto bancário.',
  },
  {
    q: 'Qual o prazo de entrega?',
    a: 'O prazo varia conforme a modalidade escolhida: PAC (5–10 dias úteis) ou SEDEX (2–4 dias úteis). O prazo começa a contar após a confirmação do pagamento.',
  },
  {
    q: 'Posso rastrear meu pedido?',
    a: 'Sim! Após o envio, você recebe o código de rastreio e pode acompanhar pela tela "Rastreamento" no app ou diretamente no site dos Correios.',
  },
  {
    q: 'Como aplicar um cupom de desconto?',
    a: 'Na tela do Carrinho, toque em "Adicionar cupom", digite o código e toque em "Aplicar". O desconto é exibido no resumo do pedido.',
  },
  {
    q: 'Os produtos são artesanais e naturais?',
    a: 'Sim! Todos os produtos do Empório Coisas de Minas são selecionados diretamente de produtores da Serra da Canastra e região. Valorizamos produtos artesanais, sem conservantes artificiais.',
  },
  {
    q: 'Posso devolver um produto?',
    a: 'Aceitamos trocas e devoluções em até 7 dias após o recebimento, conforme o Código de Defesa do Consumidor. Entre em contato pelo WhatsApp para iniciar o processo.',
  },
  {
    q: 'Como criar uma conta?',
    a: 'Toque em "Perfil" no menu inferior e depois em "Entrar / Criar conta". Preencha nome, e-mail e senha. É rápido e gratuito!',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Sim. Utilizamos Firebase Auth e Firestore com regras de segurança que garantem que apenas você acessa seus dados. Nunca compartilhamos suas informações com terceiros.',
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQuestion}>{item.q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={C.brown}
        />
      </TouchableOpacity>
      {open && (
        <Text style={styles.faqAnswer}>{item.a}</Text>
      )}
    </View>
  );
}

const WHATSAPP_PHONE = '5535998539441';

export default function HelpScreen({ navigation }) {
  const whatsapp = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_PHONE}?text=Olá%2C%20preciso%20de%20ajuda%20com%20meu%20pedido%20no%20Empório%20Coisas%20de%20Minas.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajuda e Suporte</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="help-buoy-outline" size={32} color={C.brown} />
          <Text style={styles.introTitle}>Como podemos ajudar?</Text>
          <Text style={styles.introDesc}>
            Encontre respostas rápidas nas perguntas frequentes abaixo ou fale direto com a gente pelo WhatsApp.
          </Text>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
        <View style={styles.faqCard}>
          {FAQS.map((item, i) => (
            <View key={i}>
              <FaqItem item={item} />
              {i < FAQS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* WhatsApp CTA */}
        <View style={styles.ctaCard}>
          <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Falar com a gente</Text>
            <Text style={styles.ctaDesc}>Atendimento de seg a sáb, das 8h às 18h.</Text>
          </View>
          <TouchableOpacity style={styles.ctaBtn} onPress={whatsapp}>
            <Text style={styles.ctaBtnText}>Abrir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  introCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 8,
  },
  introTitle: { fontSize: 17, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' },
  introDesc: { fontSize: 14, color: C.muted, fontFamily: 'WorkSans_400Regular', textAlign: 'center', lineHeight: 22 },
  sectionTitle: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  faqCard: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  faqItem: { paddingHorizontal: 16, paddingVertical: 14 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQuestion: { flex: 1, fontSize: 14, color: C.ink, fontFamily: 'WorkSans_600SemiBold', lineHeight: 20 },
  faqAnswer: { fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', lineHeight: 21, marginTop: 10 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  ctaCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  ctaTitle: { fontSize: 14, color: C.ink, fontFamily: 'WorkSans_600SemiBold' },
  ctaDesc: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_400Regular', marginTop: 2 },
  ctaBtn: {
    backgroundColor: '#25D366', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  ctaBtnText: { fontSize: 13, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
});
