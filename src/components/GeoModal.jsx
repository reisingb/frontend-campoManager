import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useConfig } from '../context/ConfigContext';
import './GeoModal.css';

function formatFechaHora(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// URL del mapa estático de OpenStreetMap (no requiere API key)
function staticMapUrl(lat, lng, zoom = 14, w = 600, h = 300) {
  // Usamos el tile de OSM embed via iframe src
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.02},${lat-0.01},${lng+0.02},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
}

function openInMaps(lat, lng, nombre) {
  // Abre en Google Maps (funciona en móvil y desktop)
  const url = `https://www.google.com/maps?q=${lat},${lng}&z=15&t=s`;
  window.open(url, '_blank');
}

export default function GeoModal({ animal, onClose }) {
  const { config } = useConfig();
  const api = useApi(config?.serverIp);

  const [ubicaciones,  setUbicaciones]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [gpsLoading,   setGpsLoading]   = useState(false);
  const [guardando,    setGuardando]    = useState(false);
  const [error,        setError]        = useState('');
  const [nota,         setNota]         = useState('');
  const [tab,          setTab]          = useState('mapa');   // 'mapa' | 'historial'
  const [selectedIdx,  setSelectedIdx]  = useState(0);
  const [manualLat,    setManualLat]    = useState('');
  const [manualLng,    setManualLng]    = useState('');
  const [modoManual,   setModoManual]   = useState(false);
  const [confirmBorrar,setConfirmBorrar]= useState(false);
  const [toast,        setToast]        = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Cargar historial
  const cargarUbicaciones = useCallback(async () => {
    if (!config?.serverIp) { setLoading(false); return; }
    try {
      const data = await api.getUbicaciones(animal.id);
      setUbicaciones(data);
    } catch (e) {
      setError('No se pudo cargar el historial de ubicaciones.');
    } finally {
      setLoading(false);
    }
  }, [animal.id, config?.serverIp]);

  useEffect(() => { cargarUbicaciones(); }, [cargarUbicaciones]);

  const ubicacionActual = ubicaciones[selectedIdx] || null;

  // ── GPS ─────────────────────────────────────────────────────────────
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      });
    });
  };

  const handleGPS = async () => {
    setGpsLoading(true);
    setError('');
    try {
      const pos = await getCurrentPosition();
      const { latitude, longitude, accuracy } = pos.coords;
      await guardarUbicacion(latitude, longitude, accuracy);
    } catch (e) {
      setError('Error obteniendo ubicación GPS: ' + e.message);
    } finally {
      setGpsLoading(false);
    }
  };

  const guardarUbicacion = async (lat, lng, precision = null) => {
    setGuardando(true);
    try {
      await api.guardarUbicacion(animal.id, { lat, lng, precision, nota: nota.trim() });
      showToast('Ubicación guardada');
      setNota('');
      await cargarUbicaciones();
    } catch (e) {
      setError('Error guardando ubicación: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleManualSave = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Coordenadas inválidas');
      return;
    }
    await guardarUbicacion(lat, lng);
    setManualLat('');
    setManualLng('');
    setModoManual(false);
  };

  const handleBorrarHistorial = async () => {
    try {
      await api.borrarUbicaciones(animal.id);
      setUbicaciones([]);
      setConfirmBorrar(false);
      showToast('Historial eliminado');
    } catch (e) {
      setError('Error al eliminar el historial.');
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="header">
          <div className="headerLeft">
            <div className="headerIcon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <div className="headerTitle">Ubicación — {animal.nombre}</div>
              <div className="headerSub">
                {animal.raza} · {animal.tipo === 'vacuno' ? 'Vacuno' : 'Equino'}
                {ubicaciones.length > 0 && (
                  <span className="headerCount"> · {ubicaciones.length} registro{ubicaciones.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
          <button className="btnClose" onClick={onClose}>✕</button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="tabs">
          <button className={`tab ${tab === 'mapa' ? 'tabActive' : ''}`} onClick={() => setTab('mapa')}>
            Mapa
          </button>
          <button className={`tab ${tab === 'historial' ? 'tabActive' : ''}`} onClick={() => setTab('historial')}>
            Historial {ubicaciones.length > 0 && <span className="tabBadge">{ubicaciones.length}</span>}
          </button>
          <button className={`tab ${tab === 'registrar' ? 'tabActive' : ''}`} onClick={() => setTab('registrar')}>
            Registrar
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="body">

          {error && (
            <div className="errorBanner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
              <button className="errorClose" onClick={() => setError('')}>✕</button>
            </div>
          )}

          {/* ── TAB MAPA ─────────────────────────────────────────────── */}
          {tab === 'mapa' && (
            <div className="mapaTab">
              {loading ? (
                <div className="emptyState">
                  <div className="emptyIcon">⏳</div>
                  <div className="emptyText">Cargando ubicaciones...</div>
                </div>
              ) : ubicaciones.length === 0 ? (
                <div className="emptyState">
                  <div className="emptyIcon">📍</div>
                  <div className="emptyText">Sin ubicaciones registradas</div>
                  <div className="emptySub">Registra la primera ubicación del animal</div>
                </div>
              ) : (
                <>
                  <iframe
                    src={staticMapUrl(ubicacionActual.lat, ubicacionActual.lng)}
                    width="100%"
                    height="300"
                    style={{ border: 'none', borderRadius: 'var(--radius-md)' }}
                    title="Mapa de ubicación"
                  />
                  <div className="mapaInfo">
                    <div className="mapaCoord">
                      📍 {ubicacionActual.lat.toFixed(6)}, {ubicacionActual.lng.toFixed(6)}
                      {ubicacionActual.precision && (
                        <span className="mapaPrecision"> (±{ubicacionActual.precision.toFixed(0)}m)</span>
                      )}
                    </div>
                    <div className="mapaFecha">{formatFechaHora(ubicacionActual.fecha)}</div>
                    {ubicacionActual.nota && <div className="mapaNota">{ubicacionActual.nota}</div>}
                    <div className="mapaActions">
                      <button className="histMapBtn" onClick={() => openInMaps(ubicacionActual.lat, ubicacionActual.lng, animal.nombre)}>
                        Abrir en Maps
                      </button>
                      {ubicaciones.length > 1 && (
                        <>
                          <button
                            className="histMapBtn"
                            onClick={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}
                            disabled={selectedIdx === 0}
                          >
                            ← Anterior
                          </button>
                          <button
                            className="histMapBtn"
                            onClick={() => setSelectedIdx(Math.min(ubicaciones.length - 1, selectedIdx + 1))}
                            disabled={selectedIdx === ubicaciones.length - 1}
                          >
                            Siguiente →
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB HISTORIAL ─────────────────────────────────────────── */}
          {tab === 'historial' && (
            <div className="historialTab">
              {ubicaciones.length === 0 ? (
                <div className="emptyState">
                  <div className="emptyIcon">📋</div>
                  <div className="emptyText">Sin historial</div>
                </div>
              ) : (
                <>
                  <div className="histList">
                    {ubicaciones.map((u, i) => (
                      <div
                        key={i}
                        className={`histItem ${i === selectedIdx ? 'historialItemActive' : ''}`}
                        onClick={() => setSelectedIdx(i)}
                      >
                        <div className="histHeader">
                          <div className="histCoord">
                            📍 {u.lat.toFixed(6)}, {u.lng.toFixed(6)}
                            {u.precision && <span className="histPrecision">(±{u.precision.toFixed(0)}m)</span>}
                          </div>
                          <div className="histFecha">{formatFechaHora(u.fecha)}</div>
                        </div>
                        {u.nota && <div className="histNota">{u.nota}</div>}
                        {i > 0 && (
                          <div className="histDist">
                            📏 {distanciaKm(u.lat, u.lng, ubicaciones[i-1].lat, ubicaciones[i-1].lng).toFixed(2)} km desde anterior
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="historialActions">
                    <button className="btnBorrar" onClick={() => setConfirmBorrar(true)}>
                      🗑️ Borrar historial
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB REGISTRAR ─────────────────────────────────────────── */}
          {tab === 'registrar' && (
            <div className="registrarTab">
              <div className="registrarSection">
                <div className="sectionTitle">Ubicación actual</div>
                <div className="gpsSection">
                  <button
                    className="btnGps"
                    onClick={handleGPS}
                    disabled={gpsLoading || guardando}
                  >
                    {gpsLoading ? '📡 Obteniendo GPS...' : '📍 Usar GPS'}
                  </button>
                  <div className="psHeglp">
                    Obtiene tu ubicación actual usando el GPS del dispositivo
                  </div>
                </div>
              </div>

              <div className="registrarSection">
                <div className="sectionTitle">Ubicación manual</div>
                {!modoManual ? (
                  <button className="btnManual" onClick={() => setModoManual(true)}>
                    ✏️ Ingresar coordenadas
                  </button>
                ) : (
                  <div className="manualInput">
                    <div className="coordRow">
                      <div className="coordField">
                        <label>Latitud</label>
                        <input
                          type="number"
                          step="0.000001"
                          min="-90"
                          max="90"
                          value={manualLat}
                          onChange={e => setManualLat(e.target.value)}
                          placeholder="-34.6037"
                        />
                      </div>
                      <div className="coordField">
                        <label>Longitud</label>
                        <input
                          type="number"
                          step="0.000001"
                          min="-180"
                          max="180"
                          value={manualLng}
                          onChange={e => setManualLng(e.target.value)}
                          placeholder="-58.3816"
                        />
                      </div>
                    </div>
                    <div className="manualRow">
                      <button className="btnCancel" onClick={() => { setModoManual(false); setManualLat(''); setManualLng(''); }}>
                        Cancelar
                      </button>
                      <button
                        className="btnManual"
                        onClick={handleManualSave}
                        disabled={!manualLat || !manualLng || guardando}
                      >
                        {guardando ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="registrarSection">
                <div className="sectionTitle">Nota (opcional)</div>
                <textarea
                  className="notaInput"
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Ej: En el potrero norte, cerca del bebedero..."
                  rows={2}
                />
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="footer">
          <button className="btnCancel" onClick={onClose}>Cerrar</button>
        </div>

      </div>

      {/* ── Confirm borrar ───────────────────────────────────────────── */}
      {confirmBorrar && (
        <div className="overlay">
          <div className="confirmModal">
            <div className="confirmTitle">¿Borrar historial?</div>
            <div className="confirmText">
              Se eliminarán todas las ubicaciones registradas de {animal.nombre}.
              Esta acción no se puede deshacer.
            </div>
            <div className="confirmActions">
              <button className="btnCancel" onClick={() => setConfirmBorrar(false)}>Cancelar</button>
              <button className="btnDanger" onClick={handleBorrarHistorial}>Borrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && <div className="toast">{toast}</div>}

    </div>
  );
}