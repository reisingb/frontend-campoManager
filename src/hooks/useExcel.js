import * as XLSX from 'xlsx';

/**
 * Columnas del Excel para animales:
 * nombre | tipo | raza | sexo | color | nacimiento (YYYY-MM-DD) |
 * peso | idTipo | idNum | padre | madre | procedencia | obs
 *
 * El historial médico NO se incluye en el Excel de importación masiva
 * (se carga desde la ficha individual). Sí se exporta como columna resumen.
 */
export function useExcel() {

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb   = XLSX.read(e.target.result, { type: 'binary' });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

          if (data.length < 2) {
            reject(new Error('El archivo está vacío o no tiene datos.'));
            return;
          }

          // Header row (case-insensitive)
          const header = data[0].map(h => String(h).toLowerCase().trim());
          const col = (name) => header.indexOf(name);

          const rows = data.slice(1).filter(r => r[0]); // requiere al menos nombre

          const animales = rows.map(r => {
            const get = (name, fallback = '') => {
              const i = col(name);
              return i >= 0 && r[i] != null ? String(r[i]).trim() : fallback;
            };
            const tipo = get('tipo', 'vacuno').toLowerCase().includes('equino') ? 'equino' : 'vacuno';
            return {
              nombre:      get('nombre'),
              tipo,
              raza:        get('raza'),
              sexo:        get('sexo', 'macho').toLowerCase().includes('hembra') ? 'hembra' : 'macho',
              color:       get('color'),
              nacimiento:  get('nacimiento') ? new Date(get('nacimiento')).toISOString() : null,
              peso:        parseFloat(get('peso')) || 0,
              idTipo:      get('idtipo', 'caravana'),
              idNum:       get('idnum') || get('id') || get('caravana') || get('chip') || '',
              padre:       get('padre'),
              madre:       get('madre'),
              procedencia: get('procedencia'),
              obs:         get('obs') || get('observaciones') || '',
              fotos:       {},
              historial:   [],
            };
          }).filter(a => a.nombre);

          resolve(animales);
        } catch {
          reject(new Error('No se pudo leer el archivo. Verificá el formato.'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsBinaryString(file);
    });
  };

  const exportAnimales = (animales) => {
    const rows = [
      [
        'nombre', 'tipo', 'raza', 'sexo', 'color',
        'nacimiento', 'peso', 'idTipo', 'idNum',
        'padre', 'madre', 'procedencia', 'obs',
        'registros_medicos',
      ],
      ...animales.map(a => [
        a.nombre,
        a.tipo,
        a.raza || '',
        a.sexo || 'macho',
        a.color || '',
        a.nacimiento ? new Date(a.nacimiento).toISOString().split('T')[0] : '',
        a.peso || '',
        a.idTipo || 'ninguno',
        a.idNum  || '',
        a.padre  || '',
        a.madre  || '',
        a.procedencia || '',
        a.obs || '',
        (a.historial || []).map(h => `${h.fecha}: ${h.desc}`).join(' | '),
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 8 }, { wch: 16 },
      { wch: 14 }, { wch: 8  }, { wch: 12 }, { wch: 18 },
      { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 28 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Animales');
    XLSX.writeFile(wb, 'animales_campo.xlsx');
  };

  const downloadPlantilla = () => {
    const rows = [
      [
        'nombre', 'tipo', 'raza', 'sexo', 'color',
        'nacimiento', 'peso', 'idTipo', 'idNum',
        'padre', 'madre', 'procedencia', 'obs',
      ],
      ['Pampa',    'vacuno', 'Hereford', 'macho',  'Colorado',    '2021-03-15', 480, 'caravana', 'AR-00123', 'Toro Rojo', 'Luisa 14', 'La Esperanza', ''],
      ['Estrella', 'equino', 'Criollo',  'hembra', 'Overa',       '2019-07-08', 420, 'chip',     '985112345678901', 'Huinca', 'Mora', 'Propia', 'Yegua mansa'],
      ['Negro',    'vacuno', 'Angus',    'macho',  'Negro entero','2020-11-20', 510, 'caravana', 'AR-00456', '', '', 'Remate rural', ''],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 14 },
      { wch: 14 }, { wch: 6 }, { wch: 10 }, { wch: 18 },
      { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Animales');
    XLSX.writeFile(wb, 'plantilla_animales.xlsx');
  };

  return { readFile, exportAnimales, downloadPlantilla };
}
