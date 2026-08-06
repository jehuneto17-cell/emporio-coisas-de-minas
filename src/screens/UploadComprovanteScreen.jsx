import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { C, fmt } from '../theme';
import { useAuth } from '../context/AuthContext';
import { uploadComprovante } from '../services/cloudinary';
import { marcarComprovanteEnviado } from '../services/firestore';

export default function UploadComprovanteScreen({ navigation, route }) {
  const { orderId, total } = route.params || {};
  const { user } = useAuth();

  const [file, setFile] = useState(null); // { uri, name, mimeType, webFile? }
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handlePickFile() {
    setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      setFile({
        uri: asset.uri,
        name: asset.name || 'comprovante',
        mimeType: asset.mimeType || 'application/octet-stream',
        webFile: asset.file || null, // File/Blob presente na web
      });
    } catch (e) {
      setError('Não foi possível abrir o seletor de arquivos. Tente novamente.');
    }
  }

  async function handleSend() {
    if (!file) {
      setError('Escolha um arquivo antes de enviar.');
      return;
    }
    if (!user?.uid || !orderId) {
      setError('Não foi possível identificar seu pedido. Volte e tente novamente.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const source = file.webFile || file.uri;
      const url = await uploadComprovante(source, file.name, file.mimeType);
      await marcarComprovanteEnviado(user.uid, orderId, url);
      navigation.navigate('OrderConfirmation', {
        orderId,
        paymentStatus: 'awaiting-confirmation',
      });
    } catch (e) {
      setError(e.message || 'Não foi possível enviar o comprovante. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  const isImage = file?.mimeType?.startsWith('image/');
  const isPdf = file?.mimeType === 'application/pdf';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.brown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enviar comprovante</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
        <View style={styles.introCard}>
          <Ionicons name="document-text-outline" size={22} color={C.brown} />
          <Text style={styles.introText}>
            Envie o comprovante do seu PIX. Assim que confirmarmos o pagamento, seu pedido será liberado.
          </Text>
        </View>

        {orderId ? (
          <View style={styles.orderCard}>
            <Text style={styles.orderLabel}>Pedido #{String(orderId).slice(-6)}</Text>
            {total ? <Text style={styles.orderTotal}>{fmt(total)}</Text> : null}
          </View>
        ) : null}

        <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile} disabled={uploading}>
          <Ionicons name="cloud-upload-outline" size={20} color={C.terra} />
          <Text style={styles.pickBtnText}>
            {file ? 'Escolher outro arquivo' : 'Escolher arquivo'}
          </Text>
        </TouchableOpacity>

        {file && (
          <View style={styles.previewCard}>
            {isImage ? (
              <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.previewFileRow}>
                <Ionicons
                  name={isPdf ? 'document-outline' : 'document-attach-outline'}
                  size={28}
                  color={C.brown}
                />
              </View>
            )}
            <Text style={styles.previewName} numberOfLines={1}>{file.name}</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#c0392b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, (uploading || !file) && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={uploading || !file}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmText}>Enviar comprovante</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.laterBtn}
          onPress={() => navigation.navigate('MyOrders')}
          disabled={uploading}
        >
          <Text style={styles.laterBtnText}>Enviar depois</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  introCard: { flexDirection: 'row', gap: 10, backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'flex-start' },
  introText: { flex: 1, fontSize: 13, color: C.muted, fontFamily: 'WorkSans_400Regular', lineHeight: 19 },
  orderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.softCream, borderRadius: 12, padding: 14, marginBottom: 16 },
  orderLabel: { fontSize: 13, color: C.brown, fontFamily: 'WorkSans_600SemiBold' },
  orderTotal: { fontSize: 15, color: C.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: C.terra, borderStyle: 'dashed', backgroundColor: '#fff' },
  pickBtnText: { color: C.terra, fontSize: 14, fontFamily: 'WorkSans_600SemiBold' },
  previewCard: { marginTop: 14, backgroundColor: C.card, borderRadius: 16, padding: 14, alignItems: 'center' },
  previewImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  previewFileRow: { width: '100%', height: 100, borderRadius: 10, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  previewName: { fontSize: 12, color: C.muted, fontFamily: 'WorkSans_500Medium' },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fdecea', borderRadius: 10, padding: 12, marginTop: 14 },
  errorText: { flex: 1, fontSize: 12.5, color: '#c0392b', fontFamily: 'WorkSans_500Medium', lineHeight: 18 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, gap: 10 },
  confirmBtn: { height: 52, borderRadius: 12, backgroundColor: C.terra, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
  laterBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
  laterBtnText: { color: C.subtle, fontSize: 13, fontFamily: 'WorkSans_500Medium' },
});
