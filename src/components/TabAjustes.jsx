import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAnimales } from '../context/AnimalesContext';
import { useTheme, BG_PALETTES, ACCENT_PALETTES } from '../context/ThemeContext';
import styles from './TabAjustes.module.css';

// ── Sección: Personalización ─────────────────────────────────────────────────
function SeccionPersonalizacion() {
  const { theme, setLogo, removeLogo, setBg, setAccent, setGymName } = useTheme();
  const fileRef  = useRef(null);
  const [nameVal, setNameVal] = useState(theme.gymName || 'CampoManager');
  const [nameSaved, setNameSaved] = useState(false);
  const [logoErr, setLogoErr] = useState('');

  const handleLogoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoErr('');
    if (!file.type.startsWith('image/')) {
      setLogoErr('El archivo debe ser una imagen (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoErr('La imagen no debe superar 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveName = () => {
    setGymName(nameVal.trim() || 'CampoManager');
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  return (
    
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Personalización</h2>

      {/* Nombre del campo */}
      <div className={styles.subSection}>
        <p className={styles.subLabel}>Nombre del campo</p>
        <div className={styles.nameRow}>
          <input
            type="text"
            value={nameVal}
            maxLength={40}
            onChange={e => { setNameVal(e.target.value); setNameSaved(false); }}
            onKeyDown={e => e.key === 'Enter' && handleSaveName()}
            placeholder="Mi Campo"
            className={styles.nameInput}
          />
          <button className={styles.btnSaveName} onClick={handleSaveName}>
            {nameSaved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Logo */}
      <div className={styles.subSection}>
        <p className={styles.subLabel}>Logo</p>
        <div className={styles.logoRow}>
          <div className={styles.logoPreview}>
            {theme.logoBase64 ? (
              <img src={theme.logoBase64} alt="Logo" className={styles.logoImg} />
            ) : (
              <div className={styles.logoPlaceholder}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
          </div>
          <div className={styles.logoBtns}>
            <button
              className={styles.btnUpload}
              onClick={() => { setLogoErr(''); fileRef.current?.click(); }}
            >
              {theme.logoBase64 ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {theme.logoBase64 && (
              <button className={styles.btnRemoveLogo} onClick={removeLogo}>
                Quitar
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoFile}
            />
          </div>
        </div>
        {logoErr && <p className={styles.logoErr}>{logoErr}</p>}
        <p className={styles.hint}>PNG, JPG o SVG · máx. 2 MB. Se muestra en la barra superior.</p>
      </div>

      {/* Color de fondo */}
      <div className={styles.subSection}>
        <p className={styles.subLabel}>Color de fondo</p>
        <div className={styles.palette}>
          {BG_PALETTES.map(p => (
            <button
              key={p.id}
              className={`${styles.swatch} ${theme.bgId === p.id ? styles.swatchActive : ''}`}
              style={{ background: p.bg, border: `2px solid ${p.surface2}` }}
              onClick={() => setBg(p.id)}
              title={p.label}
            >
              {theme.bgId === p.id && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={p.id === 'dark' || p.id === 'midnight' ? '#fff' : '#1a1a18'}
                  strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className={styles.paletteLabels}>
          {BG_PALETTES.map(p => (
            <span
              key={p.id}
              className={`${styles.palLabel} ${theme.bgId === p.id ? styles.palLabelActive : ''}`}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Color de acento */}
      <div className={styles.subSection}>
        <p className={styles.subLabel}>Color de acento</p>
        <p className={styles.hint}>Afecta botones, estados activos y barras de progreso.</p>
        <div className={styles.accentPalette}>
          {ACCENT_PALETTES.map(a => (
            <button
              key={a.id}
              className={`${styles.accentSwatch} ${theme.accentId === a.id ? styles.accentActive : ''}`}
              style={{ background: a.color }}
              onClick={() => setAccent(a.id)}
              title={a.label}
            >
              {theme.accentId === a.id && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className={styles.accentLabels}>
          {ACCENT_PALETTES.map(a => (
            <span
              key={a.id}
              className={`${styles.palLabel} ${theme.accentId === a.id ? styles.palLabelActive : ''}`}
            >
              {a.label}
            </span>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className={styles.previewBox} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          {theme.logoBase64 ? (
            <img src={theme.logoBase64} alt="" style={{ width:28, height:28, objectFit:'contain', borderRadius:4 }} />
          ) : (
            <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', opacity:.15 }} />
          )}
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{nameVal || 'CampoManager'}</div>
            <div style={{ fontSize:11, color:'var(--text-3)' }}>Vista previa</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <div style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px' }}>
            <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:3 }}>Socio activo</div>
            <div style={{ fontSize:18, fontWeight:500, color:'var(--accent)' }}>22 días</div>
          </div>
          <button style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', padding:'7px 14px', fontSize:13, fontWeight:500, cursor:'default', opacity: 0.85 }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  
  );
}

// ── Sección: Conexión ────────────────────────────────────────────────────────
function SeccionConexion() {
  const { config, resetConfig, rediscover, getLocalIP } = useConfig();
  const { online, reload } = useAnimales();
  const [localIp, setLocalIp]         = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [msg, setMsg]                 = useState(null);

  useEffect(() => { getLocalIP().then(ip => setLocalIp(ip)); }, []);

  const handleRediscover = async () => {
    setDiscovering(true); setMsg(null);
    const result = await rediscover();
    if (result?.ok) { await reload(); setMsg({ ok: true, text: 'Servidor encontrado y reconectado.' }); }
    else setMsg({ ok: false, text: result?.error || 'No se encontró ningún servidor.' });
    setDiscovering(false);
  };

  const handleReset = async () => {
    if (window.confirm('¿Resetear la configuración?\n\nVolverá a la pantalla de configuración inicial.'))
      await resetConfig();
  };

  return (
    <>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Estado de conexión</h2>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Rol de esta PC</span>
          <span className={`${styles.badge} ${config?.role === 'server' ? styles.badgeServer : styles.badgeClient}`}>
            {config?.role === 'server' ? 'Servidor principal' : 'Cliente'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Estado</span>
          <span className={`${styles.badge} ${online ? styles.badgeOnline : styles.badgeOffline}`}>
            {online ? 'Conectado' : 'Sin conexión'}
          </span>
        </div>
        {config?.serverIp && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Dirección del servidor</span>
            <code className={styles.code}>{config.serverIp}</code>
          </div>
        )}
        {config?.role === 'server' && localIp && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>IP de esta PC en la red</span>
            <code className={styles.code}>{localIp}:4321</code>
          </div>
        )}
        {config?.role === 'server' && localIp && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Consulta web pública</span>
            <code className={styles.code}>{localIp}:4321/consulta</code>
            {window.electronAPI?.openWebConsulta && (
              <button
                className={styles.btnAction}
                style={{ marginTop: 6, padding: '6px 12px', fontSize: 12 }}
                onClick={() => window.electronAPI.openWebConsulta()}
              >
                Abrir en navegador
              </button>
            )}
          </div>
        )}
      </div>

      {config?.role === 'client' && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Reconectar al servidor</h2>
          <p className={styles.hint}>Buscá el servidor nuevamente si la app perdió la conexión.</p>
          {msg && <p className={msg.ok ? styles.msgOk : styles.msgErr}>{msg.text}</p>}
          <button className={styles.btnAction} onClick={handleRediscover} disabled={discovering}>
            {discovering ? 'Buscando…' : 'Buscar servidor automáticamente'}
          </button>
        </div>
      )}

      {config?.role === 'server' && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Esta PC es el servidor</h2>
          <div className={styles.serverInfo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Las PCs secundarias se conectan automáticamente a <code>{localIp}:4321</code>.
          </div>
        </div>
      )}

      <div className={`${styles.card} ${styles.dangerCard}`}>
        <h2 className={styles.cardTitle}>Restablecer configuración</h2>
        <p className={styles.hint}>Vuelve a la pantalla inicial. <strong>No borra los datos de animales.</strong></p>
        <button className={styles.btnDanger} onClick={handleReset}>Resetear configuración</button>
      </div>
    </>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function TabAjustes() {
  const [section, setSection] = useState('apariencia');

  return (
    <div className={styles.mainAjustes}>
    <div className={styles.card}>
      <div className={styles.sectionTabs}>
        <button
          className={`${styles.sectionTab} ${section === 'apariencia' ? styles.sectionTabActive : ''}`}
          onClick={() => setSection('apariencia')}
        >
          Apariencia
        </button>
        <button
          className={`${styles.sectionTab} ${section === 'conexion' ? styles.sectionTabActive : ''}`}
          onClick={() => setSection('conexion')}
        >
          Conexión
        </button>
      </div>

      <div className={styles.wrap}>
        {section === 'apariencia' && <SeccionPersonalizacion />}
        {section === 'conexion'   && <SeccionConexion />}
      </div>
    </div>
    </div>
  );
}
