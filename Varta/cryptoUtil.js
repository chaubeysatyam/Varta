const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEY_FILE = path.join(__dirname, 'secret.key');
const AES_ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LEN = 16; // 128-bit tag

function ensureKey() {
  if (!fs.existsSync(KEY_FILE)) {
    const key = crypto.randomBytes(32); // 256-bit key
    fs.writeFileSync(KEY_FILE, key.toString('base64'), 'utf8');
  }
}

function getKey() {
  ensureKey();
  try {
    const contentUtf8 = fs.readFileSync(KEY_FILE, 'utf8').trim();
    // Try base64 decode first
    let key = Buffer.from(contentUtf8, 'base64');
    if (key.length === 32) return key;

    // Try hex string
    if (/^[0-9a-fA-F]+$/.test(contentUtf8)) {
      key = Buffer.from(contentUtf8, 'hex');
      if (key.length === 32) return key;
    }

    // Try reading as raw binary
    const raw = fs.readFileSync(KEY_FILE);
    if (raw.length === 32) return raw;

    // If nothing worked, regenerate
    const newKey = crypto.randomBytes(32);
    fs.writeFileSync(KEY_FILE, newKey.toString('base64'), 'utf8');
    return newKey;
  } catch (e) {
    // Regenerate on any error
    const newKey = crypto.randomBytes(32);
    fs.writeFileSync(KEY_FILE, newKey.toString('base64'), 'utf8');
    return newKey;
  }
}

function encryptText(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plainText, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Layout: [IV][TAG][CIPHERTEXT]
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

function decryptText(b64) {
  const key = getKey();
  const buf = Buffer.from(b64, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LEN);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LEN);
  const decipher = crypto.createDecipheriv(AES_ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}

function encryptJsonToFile(targetFile, object) {
  const json = JSON.stringify(object, null, 2);
  const b64 = encryptText(json);
  fs.writeFileSync(targetFile, b64, 'utf8');
}

function decryptJsonFromFile(targetFile, defaultValue) {
  if (!fs.existsSync(targetFile)) return defaultValue;
  const content = fs.readFileSync(targetFile, 'utf8');
  if (!content) return defaultValue;
  try {
    const json = decryptText(content);
    return JSON.parse(json);
  } catch (err) {
    // If decryption fails, assume legacy plaintext JSON
    try {
      return JSON.parse(content);
    } catch (e) {
      return defaultValue;
    }
  }
}

function encryptFileAtPath(inputPath, outputPath) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const data = fs.readFileSync(inputPath);
  const cipher = crypto.createCipheriv(AES_ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  fs.writeFileSync(outputPath, combined);
}

function streamDecryptedFile(encryptedFilePath, res, contentType, downloadName) {
  if (!fs.existsSync(encryptedFilePath)) {
    res.statusCode = 404;
    res.end('File not found');
    return;
  }
  const key = getKey();
  const combined = fs.readFileSync(encryptedFilePath);
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LEN);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LEN);
  const decipher = crypto.createDecipheriv(AES_ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  if (contentType) res.setHeader('Content-Type', contentType);
  if (downloadName) res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
  res.setHeader('Content-Length', plain.length);
  res.end(plain);
}

function isLikelyMediaFile(name) {
  const allowed = [
    '.jpeg', '.jpg', '.png', '.webp', '.gif', '.ico', '.bmp',
    '.apk', '.pdf', '.doc', '.docx', '.txt',
    '.mp3', '.wav', '.ogg',
    '.mp4', '.avi', '.mov', '.webm',
    '.zip', '.rar', '.tar', '.7z',
    '.csv', '.ppt', '.pptx', '.svg'
  ];
  const ext = path.extname(name || '').toLowerCase();
  return allowed.includes(ext);
}

function getContentTypeForName(name) {
  const ext = path.extname(name || '').toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.bmp': return 'image/bmp';
    case '.mp4': return 'video/mp4';
    case '.mov': return 'video/quicktime';
    case '.avi': return 'video/x-msvideo';
    case '.webm': return 'video/webm';
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.ogg': return 'audio/ogg';
    case '.pdf': return 'application/pdf';
    case '.txt': return 'text/plain';
    case '.csv': return 'text/csv';
    case '.doc': return 'application/msword';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.ppt': return 'application/vnd.ms-powerpoint';
    case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case '.zip': return 'application/zip';
    case '.rar': return 'application/vnd.rar';
    case '.7z': return 'application/x-7z-compressed';
    case '.apk': return 'application/vnd.android.package-archive';
    default: return 'application/octet-stream';
  }
}

module.exports = {
  ensureKey,
  encryptText,
  decryptText,
  encryptJsonToFile,
  decryptJsonFromFile,
  encryptFileAtPath,
  streamDecryptedFile,
  isLikelyMediaFile,
  getContentTypeForName,
};


