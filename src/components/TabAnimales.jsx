import React, { useState, useMemo, useRef } from 'react';
import { useAnimales } from '../context/AnimalesContext';
import {
  TIPOS_ANIMAL, RAZAS_VACUNO, RAZAS_EQUINO, TIPOS_ID,
  FOTOS_VACUNO, FOTOS_EQUINO, FOTOS_LABELS,
} from '../data/initialData';
import { calcularEdad, initials, formatFecha } from '../utils/animalUtils';
import GeoModal from './GeoModal';
import styles from './TabAnimales.module.css';

// ─── Utilidades ───────────────────────────────────────────────────────────────
function getSlots(tipo) {
  return tipo === 'equino' ? FOTOS_EQUINO : FOTOS_VACUNO;
}

// generateFichaHTML removed — PDF generado por el servidor NestJS via /api/animales/:id/pdf
function getAnimalImage(tipo) {
  const t = (tipo || '').toLowerCase().trim();
  return t === 'equino'
    ? '/assets/caballo.jpg'
    : '/assets/novillo.jpg';
}

function _unused(animal) {
  const slots  = getSlots(animal.tipo);
  const emoji  = getAnimalImage(animal.tipo);
  const edad   = calcularEdad(animal.nacimiento);
  const histRows = (animal.historial || []).map(h =>
    `<tr><td>${h.fecha}</td><td>${h.desc}</td><td>${h.vet || '—'}</td></tr>`
  ).join('');
  const fotosHTML = slots.map(s => {
    const src = animal.fotos?.[s];
    return `<div class="foto-item">
      ${src
        ? `<img src="${src}" alt="${FOTOS_LABELS[s]}">`
        : `<div class="foto-placeholder">📷</div>`}
      <div class="foto-label">${FOTOS_LABELS[s]}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Ficha — ${animal.nombre}</title>
<style>
  * { box-sizing: border-box; margin:0; padding:0; }
  body { font-family: Arial, sans-serif; font-size:13px; color:#1a1a18; padding:32px; max-width:760px; margin:auto; }
  h1 { font-size:24px; margin-bottom:2px; }
  .sub { color:#6b6860; margin-bottom:14px; font-size:13px; }
  .badges { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:20px; }
  .badge { display:inline-block; background:#f0ede8; border-radius:20px; padding:3px 10px; font-size:11px; color:#6b6860; }
  h2 { font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:#1a7a56;
       border-bottom:2px solid #1a7a56; padding-bottom:4px; margin:22px 0 12px; }
  table { width:100%; border-collapse:collapse; margin-bottom:8px; }
  th,td { border:1px solid #ddd; padding:7px 10px; text-align:left; font-size:12px; }
  th { background:#f7f6f3; font-weight:600; }
  .fotos { display:flex; flex-wrap:wrap; gap:10px; }
  .foto-item { text-align:center; font-size:11px; color:#6b6860; }
  .foto-item img { display:block; width:130px; height:95px; object-fit:cover; border:1px solid #ddd; border-radius:6px; margin-bottom:4px; }
  .foto-placeholder { width:130px; height:95px; background:#f0ede8; border:1px dashed #ccc; border-radius:6px;
                      display:flex; align-items:center; justify-content:center; font-size:28px; }
  .footer { margin-top:32px; font-size:11px; color:#9e9b95; border-top:1px solid #eee; padding-top:10px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:6px 20px; }
  .field label { font-size:11px; color:#9e9b95; display:block; margin-bottom:1px; }
  .field p { font-size:13px; }
  @media print { body { padding:16px; } }
</style></head><body>
<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
  <div style="font-size:48px;line-height:1">${emoji}</div>
  <div>
    <h1>${animal.nombre}</h1>
    <div class="sub">${animal.raza} · ${animal.sexo === 'macho' ? 'Macho' : 'Hembra'} · ${animal.tipo === 'vacuno' ? 'Vacuno' : 'Equino'}</div>
    <div class="badges">
      ${animal.idTipo !== 'ninguno' && animal.idNum ? `<span class="badge">${animal.idTipo}: ${animal.idNum}</span>` : ''}
      ${animal.color ? `<span class="badge">${animal.color}</span>` : ''}
      ${animal.procedencia ? `<span class="badge">Procedencia: ${animal.procedencia}</span>` : ''}
    </div>
  </div>
</div>

<h2>Datos generales</h2>
<div class="grid2">
  <div class="field"><label>Fecha de nacimiento</label><p>${formatFecha(animal.nacimiento)}</p></div>
  <div class="field"><label>Edad</label><p>${edad}</p></div>
  <div class="field"><label>Peso</label><p>${animal.peso ? animal.peso + ' kg' : '—'}</p></div>
  <div class="field"><label>Color / marcas</label><p>${animal.color || '—'}</p></div>
  <div class="field"><label>Padre</label><p>${animal.padre || '—'}</p></div>
  <div class="field"><label>Madre</label><p>${animal.madre || '—'}</p></div>
  ${animal.obs ? `<div class="field" style="grid-column:1/-1"><label>Observaciones</label><p>${animal.obs}</p></div>` : ''}
</div>

<h2>Fotos de reconocimiento</h2>
<div class="fotos">${fotosHTML}</div>

<h2>Historial médico</h2>
${histRows
  ? `<table><thead><tr><th>Fecha</th><th>Descripción</th><th>Veterinario / responsable</th></tr></thead><tbody>${histRows}</tbody></table>`
  : '<p style="font-size:12px;color:#9e9b95;">Sin registros médicos.</p>'}

<div class="footer">Generado por CampoManager · ${new Date().toLocaleDateString('es-AR')}</div>
</body></html>`;
}

// ─── Modal: Ficha de visualización ───────────────────────────────────────────
function FichaModal({ animal, onClose, onEdit, onGeo }) {
  const { descargarPdf } = useAnimales();
  const slots = getSlots(animal.tipo);
  const edad  = calcularEdad(animal.nacimiento);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const handleDownload = async () => {
    setPdfLoading(true);
    const result = await descargarPdf(animal.id);
    setPdfLoading(false);
    if (!result.ok) alert('Error al generar PDF: ' + result.msg);
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.fichaHeaderInner}>
            <div className={styles.fichaAvatar}>
              {animal.tipo === 'equino' ? <img src="/assets/caballo.jpg" alt="Caballo" /> : <img src="/assets/novillo.jpg" alt="Novillo" />}
            </div>
            <div>
              <div className={styles.fichaName}>{animal.nombre}</div>
              <div className={styles.fichaSub}>
                {animal.raza} · {animal.sexo === 'macho' ? 'Macho' : 'Hembra'}
              </div>
              <div className={styles.fichaBadges}>
                <span className={`${styles.badge} ${animal.tipo === 'equino' ? styles.badgeEquino : styles.badgeVacuno}`}>
                  {animal.tipo === 'equino' ? 'Equino' : 'Vacuno'}
                </span>
                {animal.idTipo !== 'ninguno' && animal.idNum && (
                  <span className={styles.badge}>
                    {animal.idTipo === 'caravana' ? '🏷' : animal.idTipo === 'chip' ? '📡' : '✒'} {animal.idTipo}: {animal.idNum}
                  </span>
                )}
                {animal.color && <span className={styles.badge}>{animal.color}</span>}
              </div>
            </div>
          </div>
          <button className={styles.btnClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Datos generales */}
          <div className={styles.sectionTitle}>Datos generales</div>
          <div className={styles.fichaGrid}>
            <div className={styles.fichaField}><label>Nacimiento</label><p>{formatFecha(animal.nacimiento)}</p></div>
            <div className={styles.fichaField}><label>Edad</label><p>{edad}</p></div>
            <div className={styles.fichaField}><label>Peso</label><p>{animal.peso ? `${animal.peso} kg` : '—'}</p></div>
            <div className={styles.fichaField}><label>Procedencia</label><p>{animal.procedencia || '—'}</p></div>
            <div className={styles.fichaField}><label>Padre</label><p>{animal.padre || '—'}</p></div>
            <div className={styles.fichaField}><label>Madre</label><p>{animal.madre || '—'}</p></div>
            {animal.ultimaUbicacion && (
              <div className={styles.fichaField}>
                <label>Última ubicación</label>
                <p>{animal.ultimaUbicacion.lat?.toFixed(4)}, {animal.ultimaUbicacion.lng?.toFixed(4)}</p>
              </div>
            )}
            {animal.obs && (
              <div className={`${styles.fichaField} ${styles.full}`}>
                <label>Observaciones</label><p>{animal.obs}</p>
              </div>
            )}
          </div>

          {/* Fotos */}
          <div className={styles.sectionTitle}>Fotos de reconocimiento</div>
          <div className={styles.fotosView}>
            {slots.map(s => {
              const src = animal.fotos?.[s];
              return (
                <div key={s} className={styles.fotoViewSlot}>
                 {src
                 ? <img 
                src={src} 
                alt={FOTOS_LABELS[s]} 
                onClick={() => setSelectedImg(src)}
                 className={styles.clickableImg}
                />
                : <div className={styles.fotoViewEmpty}>📷</div>}
                  <div className={styles.fotoViewLabel}>{FOTOS_LABELS[s]}</div>
                </div>
              );
            })}
                        {selectedImg && (
              <div 
                className={styles.imgOverlay} 
                onClick={() => setSelectedImg(null)}
              >
                <img src={selectedImg} className={styles.imgFull} />
              </div>
            )}
          </div>

          {/* Historial */}
          <div className={styles.sectionTitle}>Historial médico</div>
          {(!animal.historial || animal.historial.length === 0) ? (
            <p className={styles.empty}>Sin registros médicos.</p>
          ) : (
            <div className={styles.histList}>
              {animal.historial.map((h, i) => (
                <div key={i} className={styles.histItem}>
                  <span className={styles.histDate}>{h.fecha}</span>
                  <span className={styles.histDesc}>{h.desc}</span>
                  {h.vet && <span className={styles.histVet}>{h.vet}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnDownload} onClick={handleDownload} disabled={pdfLoading}>
            {pdfLoading ? 'Generando PDF…' : '↓ Descargar ficha PDF'}</button>
          <button className={styles.btnLocation} onClick={() => onGeo(animal)}>📍 Ubicación</button>
          <div style={{ flex: 1 }} />
          <button className={styles.btnCancel} onClick={onClose}>Cerrar</button>
          <button className={styles.btnSave} onClick={onEdit}>Editar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Formulario agregar/editar ────────────────────────────────────────
function FormModal({ animal, onClose, onSaved }) {
  const { agregarAnimal, editarAnimal, eliminarAnimal } = useAnimales();
  const fileInputRef = useRef(null);
  const [activePhotoSlot, setActivePhotoSlot] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err,      setErr]      = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const [form, setForm] = useState({
    nombre:      animal?.nombre      || '',
    tipo:        animal?.tipo        || 'vacuno',
    raza:        animal?.raza        || '',
    sexo:        animal?.sexo        || 'macho',
    color:       animal?.color       || '',
    nacimiento:  animal?.nacimiento  ? animal.nacimiento.split('T')[0] : '',
    peso:        animal?.peso        || '',
    idTipo:      animal?.idTipo      || 'caravana',
    idNum:       animal?.idNum       || '',
    padre:       animal?.padre       || '',
    madre:       animal?.madre       || '',
    procedencia: animal?.procedencia || '',
    obs:         animal?.obs         || '',
    fotos:       { ...(animal?.fotos || {}) },
    historial:   [...(animal?.historial || [])],
  });
  const [hFecha, setHFecha] = useState('');
  const [hDesc,  setHDesc]  = useState('');
  const [hVet,   setHVet]   = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(''); };

  const razas = form.tipo === 'equino' ? RAZAS_EQUINO : RAZAS_VACUNO;
  const slots = getSlots(form.tipo);

  const handlePhotoClick = (slot) => {
    setActivePhotoSlot(slot);
    fileInputRef.current?.click();
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !activePhotoSlot) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      set('fotos', { ...form.fotos, [activePhotoSlot]: ev.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const removePhoto = (slot) => {
    const f = { ...form.fotos };
    delete f[slot];
    set('fotos', f);
  };

  const addHistorial = () => {
    if (!hDesc.trim()) return;
    set('historial', [...form.historial, {
      fecha: hFecha || new Date().toISOString().split('T')[0],
      desc:  hDesc.trim(),
      vet:   hVet.trim(),
    }]);
    setHFecha(''); setHDesc(''); setHVet('');
  };
  const removeHistorial = (i) => {
    const h = [...form.historial];
    h.splice(i, 1);
    set('historial', h);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { setErr('El nombre no puede estar vacío.'); return; }
    setSaving(true);
    const data = {
      ...form,
      nombre:     form.nombre.trim(),
      peso:       parseFloat(form.peso) || 0,
      nacimiento: form.nacimiento ? new Date(form.nacimiento).toISOString() : null,
    };
    const result = animal
      ? await editarAnimal(animal.id, data)
      : await agregarAnimal(data);
    setSaving(false);
    if (result.ok) onSaved(animal ? 'Datos actualizados.' : 'Animal registrado.');
    else setErr(result.msg || 'Error al guardar.');
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await eliminarAnimal(animal.id);
    setDeleting(false);
    if (result.ok) onSaved('Animal eliminado.');
    else setErr(result.msg || 'Error al eliminar.');
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{animal ? 'Editar animal' : 'Nuevo animal'}</h2>
          <button className={styles.btnClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Identificación básica */}
          <div className={styles.sectionTitle}>Identificación</div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nombre / apodo</label>
              <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Pampa, Estrella..." autoFocus />
            </div>
            <div className={styles.field}>
              <label>Especie</label>
              <select value={form.tipo} onChange={e => { set('tipo', e.target.value); set('raza', ''); }}>
                <option value="vacuno">Vacuno (bovino)</option>
                <option value="equino">Equino (caballo)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Raza</label>
              <select value={form.raza} onChange={e => set('raza', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {razas.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Sexo</label>
              <select value={form.sexo} onChange={e => set('sexo', e.target.value)}>
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Color / marcas</label>
              <input type="text" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Ej: Colorado, overo negr..." />
            </div>
            <div className={styles.field}>
              <label>Fecha de nacimiento</label>
              <input type="date" value={form.nacimiento} onChange={e => set('nacimiento', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Peso (kg)</label>
              <input type="number" value={form.peso} onChange={e => set('peso', e.target.value)} placeholder="0" min="0" />
            </div>
            <div className={styles.field}>
              <label>Procedencia</label>
              <input type="text" value={form.procedencia} onChange={e => set('procedencia', e.target.value)} placeholder="Establecimiento de origen" />
            </div>
          </div>

          {/* Número de identificación */}
          <div className={styles.sectionTitle}>Número de identificación</div>
          <div className={styles.idRow}>
            <div className={styles.field} style={{ width: 140, flexShrink: 0 }}>
              <label>Tipo</label>
              <select value={form.idTipo} onChange={e => set('idTipo', e.target.value)}>
                <option value="caravana">Caravana</option>
                <option value="chip">Chip electrónico</option>
                <option value="tatuaje">Tatuaje</option>
                <option value="ninguno">Sin identificación</option>
              </select>
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>Número</label>
              <input
                type="text"
                value={form.idNum}
                onChange={e => set('idNum', e.target.value)}
                placeholder={form.idTipo === 'chip' ? 'Ej: 985112345678901' : 'Ej: AR-00123'}
                disabled={form.idTipo === 'ninguno'}
              />
            </div>
          </div>

          {/* Genealogía */}
          <div className={styles.sectionTitle}>Genealogía</div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Padre (nombre / ID)</label>
              <input type="text" value={form.padre} onChange={e => set('padre', e.target.value)} placeholder="Nombre o número" />
            </div>
            <div className={styles.field}>
              <label>Madre (nombre / ID)</label>
              <input type="text" value={form.madre} onChange={e => set('madre', e.target.value)} placeholder="Nombre o número" />
            </div>
          </div>

          {/* Fotos */}
          <div className={styles.sectionTitle}>
            Fotos de reconocimiento
            <span className={styles.sectionHint}>
              ({form.tipo === 'equino' ? 'Equino' : 'Vacuno'}: {slots.length} vistas)
            </span>
          </div>
          <div className={styles.fotosGrid}>
            {slots.map(s => {
              const src = form.fotos[s];
              return (
                <div
                  key={s}
                  className={`${styles.fotoSlot} ${src ? styles.fotoSlotFull : ''}`}
                  onClick={() => handlePhotoClick(s)}
                >
                  {src ? (
                    <>
                      <img src={src} alt={FOTOS_LABELS[s]} />
                      <button
                        className={styles.fotoDel}
                        onClick={e => { e.stopPropagation(); removePhoto(s); }}
                        title="Quitar foto"
                      >✕</button>
                    </>
                  ) : (
                    <span className={styles.fotoIcon}>📷</span>
                  )}
                  <div className={styles.fotoLabel}>{FOTOS_LABELS[s]}</div>
                </div>
              );
            })}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* Historial médico */}
          <div className={styles.sectionTitle}>Historial médico</div>
          {form.historial.length === 0
            ? <p className={styles.empty} style={{ marginBottom: 8 }}>Sin registros aún.</p>
            : (
              <div className={styles.histList}>
                {form.historial.map((h, i) => (
                  <div key={i} className={styles.histItem}>
                    <span className={styles.histDate}>{h.fecha}</span>
                    <span className={styles.histDesc}>{h.desc}</span>
                    {h.vet && <span className={styles.histVet}>{h.vet}</span>}
                    <button className={styles.histDel} onClick={() => removeHistorial(i)}>✕</button>
                  </div>
                ))}
              </div>
            )
          }
          <div className={styles.addHist}>
            <input type="date" value={hFecha} onChange={e => setHFecha(e.target.value)} style={{ width: 140, flexShrink: 0 }} />
            <input type="text"  value={hDesc}  onChange={e => setHDesc(e.target.value)}  placeholder="Descripción (vacuna, tratamiento...)" style={{ flex: 1 }} />
            <input type="text"  value={hVet}   onChange={e => setHVet(e.target.value)}   placeholder="Veterinario"                          style={{ width: 140, flexShrink: 0 }} />
            <button className={styles.btnCancel} onClick={addHistorial}>+ Agregar</button>
          </div>

          {/* Observaciones */}
          <div className={styles.sectionTitle}>Observaciones</div>
          <div className={styles.field}>
            <textarea value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Temperamento, estado sanitario general, notas..." />
          </div>

          {err && <p className={styles.modalErr}>{err}</p>}
        </div>

        <div className={styles.modalFooter}>
          {animal && !confirmDel && (
            <button className={styles.btnDelete} onClick={() => setConfirmDel(true)}>Eliminar</button>
          )}
          {confirmDel && (
            <button className={styles.btnDelete} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando…' : '¿Confirmar eliminación?'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TabAnimales() {
  const { animales } = useAnimales();

  const [search,     setSearch]     = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterRaza, setFilterRaza] = useState('');
  const [viewing,    setViewing]    = useState(null);
  const [editing,    setEditing]    = useState(null);   // null = cerrado, 'new' = nuevo, objeto = editar
  const [geoAnimal,  setGeoAnimal]  = useState(null);   // animal para modal de geolocalización
  const [toast,      setToast]      = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const razasDisponibles = useMemo(() =>
    [...new Set(animales.map(a => a.raza).filter(Boolean))].sort()
  , [animales]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return animales.filter(a => {
      const matchQ    = !q || a.nombre.toLowerCase().includes(q) || (a.idNum || '').toLowerCase().includes(q) || (a.raza || '').toLowerCase().includes(q);
      const matchTipo = !filterTipo || a.tipo === filterTipo;
      const matchRaza = !filterRaza || a.raza === filterRaza;
      return matchQ && matchTipo && matchRaza;
    });
  }, [animales, search, filterTipo, filterRaza]);

  const totalVacuno  = animales.filter(a => a.tipo === 'vacuno').length;
  const totalEquino  = animales.filter(a => a.tipo === 'equino').length;
  const conId        = animales.filter(a => a.idTipo !== 'ninguno' && a.idNum).length;

  const handleFormSaved = (msg) => {
    setEditing(null);
    setViewing(null);
    showToast(msg);
  };

  return (
    <div className={styles.container}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}><span className={styles.statLbl}>Total</span><span className={styles.statVal}>{animales.length}</span></div>
        <div className={styles.stat}><span className={styles.statLbl}>Vacunos</span><span className={`${styles.statVal} ${styles.green}`}>{totalVacuno}</span></div>
        <div className={styles.stat}><span className={styles.statLbl}>Equinos</span><span className={`${styles.statVal} ${styles.amber}`}>{totalEquino}</span></div>
        <div className={styles.stat}><span className={styles.statLbl}>Identificados</span><span className={`${styles.statVal}`}>{conId}</span></div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" className={styles.searchInput} placeholder="Buscar por nombre, caravana, chip…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <select className={styles.filterSel} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="vacuno">Vacunos</option>
            <option value="equino">Equinos</option>
          </select>
          <select className={styles.filterSel} value={filterRaza} onChange={e => setFilterRaza(e.target.value)}>
            <option value="">Todas las razas</option>
            {razasDisponibles.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button className={styles.btnAdd} onClick={() => setEditing('new')}>+ Agregar animal</button>
      </div>

      {/* Grid de tarjetas */}
      <div className={styles.grid}>
        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            {search || filterTipo || filterRaza ? 'Sin resultados para esa búsqueda.' : 'No hay animales registrados.'}
          </div>
        )}
        {filtered.map(a => {
          function getAnimalImage(tipo) {
             const t = (tipo || '').toLowerCase().trim();
              return t === 'equino'
              ? '/assets/caballo.jpg'
              : '/assets/novillo.jpg';
          }
          const portada = a.fotos ? Object.values(a.fotos)[0] : null;
          const idLabel = a.idTipo === 'caravana' ? '🏷' : a.idTipo === 'chip' ? '📡' : a.idTipo === 'tatuaje' ? '✒' : null;
          return (
            <div key={a.id} className={styles.card} onClick={() => setViewing(a)}>
              <div className={styles.cardImg}>
                {portada
                  ? <img src={portada} alt={a.nombre} />
                  : <img src={getAnimalImage(a.tipo)} alt={a.nombre} />}
                <span className={`${styles.cardBadge} ${a.tipo === 'equino' ? styles.badgeEquino : styles.badgeVacuno}`}>
                  {a.tipo === 'equino' ? 'Equino' : 'Vacuno'}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{a.nombre}</div>
                <div className={styles.cardId}>
                  {idLabel && <span className={styles.idTag}>{idLabel} {a.idTipo}</span>}
                  <span>{a.idNum || '—'}</span>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.cardRaza}>{a.raza || '—'}</span>
                  <span className={styles.cardSexo}>{a.sexo === 'macho' ? '♂' : '♀'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 0 && (search || filterTipo || filterRaza) && (
        <p className={styles.resultCount}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Modal: ver ficha */}
      {viewing && !editing && (
        <FichaModal
          animal={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onGeo={(animal) => { setGeoAnimal(animal); setViewing(null); }}
        />
      )}

      {/* Modal: formulario */}
      {editing && (
        <FormModal
          animal={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleFormSaved}
        />
      )}

      {/* Modal: geolocalización */}
      {geoAnimal && (
        <GeoModal
          animal={geoAnimal}
          onClose={() => setGeoAnimal(null)}
        />
      )}
    </div>
  );
}
