import React, { useState, useRef } from 'react';
import { useAnimales } from '../context/AnimalesContext';
import { useExcel }    from '../hooks/useExcel';
import styles from './TabExcel.module.css';

export default function TabExcel() {
  const { animales, agregarAnimal } = useAnimales();
  const { readFile, exportAnimales, downloadPlantilla } = useExcel();
  const fileRef = useRef(null);

  const [preview,   setPreview]   = useState(null);   // { count, dupes, data }
  const [loading,   setLoading]   = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [fileErr,   setFileErr]   = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileErr('');
    setPreview(null);
    setImportMsg(null);
    setLoading(true);
    try {
      const data  = await readFile(file);
      // Detectar duplicados por nombre exacto (los animales no tienen DNI único obligatorio)
      const dupes = data.filter(a =>
        animales.find(x => x.nombre.toLowerCase() === a.nombre.toLowerCase())
      ).length;
      setPreview({ count: data.length, dupes, data });
    } catch (err) {
      setFileErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    let added = 0, skipped = 0;
    for (const animal of preview.data) {
      // Saltar si ya existe un animal con el mismo nombre
      const existe = animales.find(x => x.nombre.toLowerCase() === animal.nombre.toLowerCase());
      if (existe) { skipped++; continue; }
      const result = await agregarAnimal(animal);
      if (result.ok) added++; else skipped++;
    }
    setImporting(false);
    setImportMsg({ added, skipped });
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className={styles.mainExcel}>
    <div className={styles.wrap}>

      {/* ── IMPORTAR ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Importar animales desde Excel</h2>
        <p className={styles.hint}>
          El archivo debe tener estas columnas (la primera fila es el encabezado):{' '}
          <code>nombre</code>, <code>tipo</code>, <code>raza</code>, <code>sexo</code>,{' '}
          <code>color</code>, <code>nacimiento</code>, <code>peso</code>,{' '}
          <code>idTipo</code>, <code>idNum</code>, <code>padre</code>,{' '}
          <code>madre</code>, <code>procedencia</code>, <code>obs</code>.{' '}
          Las fotos y el historial médico se cargan desde la ficha individual.
        </p>

        <div className={styles.dropZone} onClick={() => fileRef.current?.click()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>{loading ? 'Leyendo archivo…' : 'Tocá para seleccionar un .xlsx o .csv'}</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>

        {fileErr && <p className={styles.errTxt}>{fileErr}</p>}

        {preview && (
          <div className={styles.preview}>
            <span>
              <strong>{preview.count}</strong> fila{preview.count !== 1 ? 's' : ''} encontrada{preview.count !== 1 ? 's' : ''}
            </span>
            {preview.dupes > 0 && (
              <span className={styles.dupeWarn}>
                · {preview.dupes} nombre{preview.dupes > 1 ? 's' : ''} duplicado{preview.dupes > 1 ? 's' : ''} (se omitirán)
              </span>
            )}
          </div>
        )}

        {preview && preview.count > 0 && (
          <div className={styles.tableWrap} style={{ marginTop: 12 }}>
            <table className={styles.exTable}>
              <thead>
                <tr>
                  <th>Nombre</th><th>Tipo</th><th>Raza</th><th>ID</th><th>Nro</th>
                </tr>
              </thead>
              <tbody>
                {preview.data.slice(0, 5).map((a, i) => (
                  <tr key={i}>
                    <td>{a.nombre}</td>
                    <td>{a.tipo}</td>
                    <td>{a.raza || '—'}</td>
                    <td>{a.idTipo}</td>
                    <td>{a.idNum || '—'}</td>
                  </tr>
                ))}
                {preview.data.length > 5 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', fontStyle: 'italic' }}>
                      …y {preview.data.length - 5} más
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {importMsg && (
          <div className={styles.importOk}>
            {importMsg.added} animal{importMsg.added !== 1 ? 'es' : ''} importado{importMsg.added !== 1 ? 's' : ''}
            {importMsg.skipped > 0 && ` · ${importMsg.skipped} omitido${importMsg.skipped > 1 ? 's' : ''} por duplicado`}
          </div>
        )}

        <button
          className={styles.btnImport}
          disabled={!preview || preview.count === 0 || importing}
          onClick={handleImport}
        >
          {importing ? 'Importando…' : 'Importar animales'}
        </button>
      </div>

      {/* ── EXPORTAR ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Exportar listado completo</h2>
        <p className={styles.hint}>
          Descargá el listado de <strong>{animales.length}</strong> animal{animales.length !== 1 ? 'es' : ''} con todos
          sus datos (excepto fotos) en formato Excel. El historial médico se exporta como resumen de texto.
        </p>
        <button className={styles.btnExport} onClick={() => exportAnimales(animales)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar animales_campo.xlsx
        </button>
      </div>

      {/* ── PLANTILLA ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Plantilla de ejemplo</h2>
        <p className={styles.hint}>
          Descargá una plantilla con el formato correcto y 3 animales de ejemplo para completar.
        </p>
        <button className={styles.btnExport} onClick={downloadPlantilla}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar plantilla_animales.xlsx
        </button>

        <div className={styles.tableWrap} style={{ marginTop: 14 }}>
          <table className={styles.exTable}>
            <thead>
              <tr>
                <th>nombre</th><th>tipo</th><th>raza</th><th>sexo</th>
                <th>nacimiento</th><th>idTipo</th><th>idNum</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pampa</td><td>vacuno</td><td>Hereford</td><td>macho</td>
                <td>2021-03-15</td><td>caravana</td><td>AR-00123</td>
              </tr>
              <tr>
                <td>Estrella</td><td>equino</td><td>Criollo</td><td>hembra</td>
                <td>2019-07-08</td><td>chip</td><td>985112345678901</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
    </div>
  );
}
