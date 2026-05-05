/**
 * license.js — Va DENTRO de la app (electron/)
 * Solo valida — no puede generar códigos sin SECRET_KEY
 *
 * Formato: SSSS-XXXXX-XXXXX-XXXXX-XXXXX
 *   SSSS     = serial en hex (4 chars)
 *   XXXXX... = HMAC(serialHex + '|' + machineId) en base32 (20 chars)
 */

const crypto = require('crypto');

// !! MISMA CLAVE QUE EN TU GENERADOR !!
const SECRET_KEY = 'e003d5588d9880748dfe139fc702161645871e05431e82428ed97bc85055983b';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function toBase32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += CHARS[(value << (5 - bits)) & 31];
  return out;
}

/**
 * Valida el código contra el machineId de esta PC.
 * @param {string} code      - código ingresado por el usuario
 * @param {string} machineId - ID de esta instalación (de getMachineId())
 */
function validateLicense(code, machineId) {
  try {
    if (!code || !machineId) return false;

    const clean = code.toUpperCase().replace(/[-\s]/g, '');
    if (clean.length !== 24) return false;

    const serialHex = clean.slice(0, 4);
    const hashPart  = clean.slice(4);

    if (!/^[0-9A-F]{4}$/.test(serialHex)) return false;

    // PAYLOAD: mismo que usa el generador
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(serialHex + '|' + machineId);
    const expected = toBase32(hmac.digest()).slice(0, 20).toUpperCase();

    return crypto.timingSafeEqual(
      Buffer.from(hashPart.padEnd(20, '_')),
      Buffer.from(expected.padEnd(20, '_'))
    );
  } catch {
    return false;
  }
}

module.exports = { validateLicense };