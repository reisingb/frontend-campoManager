import React, { useState, useRef, useEffect } from 'react';
import styles from './ActivationScreen.module.css';

const GROUPS     = 4;
const GROUP_LEN  = 5;
const PREFIX_LEN = 4;

function formatCode(raw) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, PREFIX_LEN + GROUPS * GROUP_LEN);
  if (!clean.length) return '';
  const prefix = clean.slice(0, PREFIX_LEN);
  const rest   = clean.slice(PREFIX_LEN);
  const groups = [];
  for (let i = 0; i < GROUPS; i++) {
    const chunk = rest.slice(i * GROUP_LEN, (i + 1) * GROUP_LEN);
    if (chunk.length > 0) groups.push(chunk);
  }
  return groups.length > 0 ? `${prefix}-${groups.join('-')}` : prefix;
}

export default function ActivationScreen({ onActivated }) {
  const [code,      setCode]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [machineId, setMachineId] = useState('Obteniendo ID...');
  const [copied,    setCopied]    = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (window.electronAPI?.getMachineId) {
      window.electronAPI.getMachineId().then(id => setMachineId(id || 'No disponible'));
    } else {
      setMachineId('DEV-MODE-NO-ID');
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(machineId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleActivate = async () => {
    const clean = code.replace(/-/g, '');
    if (clean.length < PREFIX_LEN + GROUPS * GROUP_LEN) {
      setError('Ingresá el código completo de 24 caracteres.');
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = window.electronAPI
        ? await window.electronAPI.activateLicense(code)
        : { ok: true }; // dev mode
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => onActivated(), 1400);
      } else {
        setError(result.error || 'Código inválido. Verificá que el código corresponde a esta PC.');
        inputRef.current?.focus();
      }
    } catch {
      setError('Error al verificar. Intentá de nuevo.');
    }
    setLoading(false);
  };

  const codeComplete = code.replace(/-/g, '').length === PREFIX_LEN + GROUPS * GROUP_LEN;

  if (success) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={`${styles.iconWrap} ${styles.iconSuccess}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#1a7a56" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className={styles.title}>¡Activación exitosa!</h1>
          <p className={styles.sub}>Licencia verificada. Iniciando la app…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>

        <div className={styles.iconWrap}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 className={styles.title}>Activar Gym Pulse</h1>
        <p className={styles.sub}>Ingresá el código de activación que recibiste.</p>

        {/* ID de esta PC — el cliente lo copia y te lo manda */}
        <div className={styles.idBox}>
          <div className={styles.idHeader}>
            <span className={styles.idLabel}>ID de esta PC</span>
            <button className={styles.btnCopy} onClick={handleCopy}>
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copiar
                </>
              )}
            </button>
          </div>
          <code className={styles.idValue}>{machineId}</code>
          <p className={styles.idHint}>
            Paso 1: copiá este ID y enviáselo al vendedor.<br/>
            Paso 2: el vendedor te genera un código único para esta PC.<br/>
            Paso 3: ingresá ese código abajo.
          </p>
        </div>

        {/* Input del código */}
        <div className={styles.codeWrap}>
          <label className={styles.codeLabel}>Código de activación</label>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.codeInput} ${error ? styles.codeErr : ''} ${codeComplete && !error ? styles.codeOk : ''}`}
            value={code}
            onChange={e => { setError(''); setCode(formatCode(e.target.value)); }}
            onKeyDown={e => e.key === 'Enter' && handleActivate()}
            placeholder="NNNN-XXXXX-XXXXX-XXXXX-XXXXX"
            maxLength={28}
            spellCheck={false}
            autoComplete="off"
            disabled={loading}
          />
          <div className={styles.dots}>
            {Array.from({ length: GROUPS + 1 }).map((_, i) => {
              const filled = code.replace(/-/g, '').length;
              const start  = i === 0 ? 0 : PREFIX_LEN + (i - 1) * GROUP_LEN;
              const end    = i === 0 ? PREFIX_LEN : PREFIX_LEN + i * GROUP_LEN;
              const pct    = Math.min(1, Math.max(0, (filled - start) / (end - start)));
              return <span key={i} className={styles.dot} style={{ opacity: pct > 0 ? 1 : 0.2 }} />;
            })}
          </div>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <button
          className={styles.btnActivate}
          onClick={handleActivate}
          disabled={loading || !codeComplete}
        >
          {loading ? <span className={styles.spinner} /> : 'Activar licencia'}
        </button>

      </div>
    </div>
  );
}