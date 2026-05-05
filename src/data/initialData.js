// Credenciales de acceso
export const USERS = {
  admin:     '1234',
  recepcion: 'campo2026',
};


export const RAZAS_VACUNO = [
  'Angus', 'Hereford', 'Shorthorn', 'Limousin', 'Charolais',
  'Simmental', 'Brahman', 'Aberdeen Angus', 'Criolla', 'Otra',
];

export const RAZAS_EQUINO = [
  'Criollo', 'Cuarto de Milla', 'Pura Sangre', 'Árabe', 'Polo Argentino',
  'Percherón', 'Appaloosa', 'Frisón', 'Otra',
];

export const TIPOS_ID = ['caravana', 'chip', 'tatuaje', 'ninguno'];

// Vistas fotográficas según especie
export const FOTOS_VACUNO  = ['frente', 'lateral_izq', 'lateral_der', 'trasera'];
export const FOTOS_EQUINO  = ['frente', 'cabeza', 'lateral_izq', 'lateral_der', 'manos', 'zona_trasera'];

export const FOTOS_LABELS = {
  frente:       'Frente',
  cabeza:       'Cabeza',
  lateral_izq:  'Lateral izq.',
  lateral_der:  'Lateral der.',
  trasera:      'Trasera',
  manos:        'Manos',
  zona_trasera: 'Zona trasera',
};

function makeDate(offset = 0) {
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setFullYear(d.getFullYear() - offset);
  return d;
}

export const INITIAL_ANIMALES = [
  {
    id: 'a001',
    nombre: 'Pampa',
    tipo: 'vacuno',
    raza: 'Hereford',
    sexo: 'macho',
    color: 'Colorado',
    nacimiento: makeDate(3).toISOString(),
    peso: 480,
    idTipo: 'caravana',
    idNum: 'AR-00123',
    padre: 'Toro Rojo',
    madre: 'Luisa 14',
    procedencia: 'La Esperanza',
    obs: 'Buen temperamento, apto para reproducción.',
    fotos: {},
    historial: [
      { fecha: '2023-04-10', desc: 'Vacuna aftosa', vet: 'Dr. Romero' },
      { fecha: '2023-09-22', desc: 'Antiparasitario Ivermectina 1%', vet: '' },
    ],
  },
  {
    id: 'a002',
    nombre: 'Estrella',
    tipo: 'equino',
    raza: 'Criollo',
    sexo: 'hembra',
    color: 'Overa',
    nacimiento: makeDate(7).toISOString(),
    peso: 420,
    idTipo: 'chip',
    idNum: '985112345678901',
    padre: 'Huinca',
    madre: 'Mora',
    procedencia: 'Propia',
    obs: 'Yegua de campo, mansa y confiable.',
    fotos: {},
    historial: [
      { fecha: '2022-11-15', desc: 'Herrado completo', vet: 'Herrador Pérez' },
      { fecha: '2023-06-01', desc: 'Vacuna antigripal equina', vet: 'Dra. Sosa' },
    ],
  },
  {
    id: 'a003',
    nombre: 'Negro',
    tipo: 'vacuno',
    raza: 'Angus',
    sexo: 'macho',
    color: 'Negro entero',
    nacimiento: makeDate(4).toISOString(),
    peso: 510,
    idTipo: 'caravana',
    idNum: 'AR-00456',
    padre: 'Desconocido',
    madre: 'Negra 3',
    procedencia: 'Remate rural',
    obs: '',
    fotos: {},
    historial: [],
  },
];
