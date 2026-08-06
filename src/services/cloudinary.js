const CLOUD_NAME = 'dv62fwdtv';
const UPLOAD_PRESET = 'emporio-produtos';
const FOLDER = 'emporio-minas/comprovantes';

function randomPublicId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `comprovante_${ts}_${rand}`;
}

function resourceTypeFor(mimeType) {
  if (mimeType === 'application/pdf') return 'raw';
  if (mimeType?.startsWith('image/')) return 'image';
  return 'auto';
}

// Faz upload do comprovante (imagem ou PDF) para o Cloudinary e retorna a
// secure_url. Aceita tanto o formato nativo { uri, name, type } (iOS/Android)
// quanto um File/Blob da web (fileUri é o próprio File nesse caso).
export async function uploadComprovante(fileUri, fileName, mimeType) {
  const resourceType = resourceTypeFor(mimeType);
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const form = new FormData();
  if (fileUri instanceof Blob) {
    form.append('file', fileUri, fileName);
  } else {
    form.append('file', { uri: fileUri, name: fileName, type: mimeType });
  }
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', FOLDER);
  form.append('public_id', randomPublicId());

  let res;
  try {
    res = await fetch(url, { method: 'POST', body: form });
  } catch (e) {
    throw new Error('Falha de rede ao enviar o comprovante. Verifique sua conexão e tente novamente.');
  }

  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data?.error?.message || '';
    } catch {}
    throw new Error(detail || 'Não foi possível enviar o comprovante. Tente novamente.');
  }

  const data = await res.json();
  return data.secure_url;
}
