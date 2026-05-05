export function calcularEdad(nacimiento) {
  if (!nacimiento) return '—';
  const hoy = new Date();
  const nac = new Date(nacimiento);
  const años = hoy.getFullYear() - nac.getFullYear();
  const meses = hoy.getMonth() - nac.getMonth();
  const totalMeses = años * 12 + meses;
  if (totalMeses < 12) return `${totalMeses} mes${totalMeses !== 1 ? 'es' : ''}`;
  const a = Math.floor(totalMeses / 12);
  return `${a} año${a !== 1 ? 's' : ''}`;
}

export function initials(nombre) {
  if (!nombre) return '?';
  const words = nombre.trim().split(' ');
  return words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : (words[0][0] + words[1][0]).toUpperCase();
}

export function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-AR');
  } catch { return iso; }
}
