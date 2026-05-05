import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import styles from './SetupScreen.module.css';

export default function SetupScreen() {
  const { setRoleServer, setRoleClient } = useConfig();
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState('choose'); // 'choose' | 'discovering' | 'error'
  const [error,   setError]   = useState('');

  const handleServer = async () => {
    setLoading(true);
    const result = await setRoleServer();
    setLoading(false);
    if (!result?.ok) setError('No se pudo iniciar el servidor.');
  };

  const handleClient = async () => {
    setStep('discovering');
    setLoading(true);
    const result = await setRoleClient();
    setLoading(false);
    if (!result?.ok) {
      setStep('error');
      setError(result?.error || 'No se encontró ningún servidor en la red.');
    }
  };

  if (step === 'discovering') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <h2 className={styles.title}>Buscando servidor…</h2>
          <p className={styles.sub}>Escaneando la red local. Esto puede tardar unos segundos.</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.iconWrap} style={{ background: 'var(--red-bg)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className={styles.title}>Servidor no encontrado</h2>
          <p className={styles.sub}>{error}</p>
          <p className={styles.hint}>
            Asegurate de que la PC principal tenga la app abierta y esté conectada a la misma red Wi-Fi o LAN.
          </p>
          <div className={styles.btnRow}>
            <button className={styles.btnSecondary} onClick={() => setStep('choose')}>Volver</button>
            <button className={styles.btnPrimary}   onClick={handleClient}>Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
            <line x1="4" y1="4" x2="20" y2="4"/>
            <line x1="4" y1="20" x2="20" y2="20"/>
            <line x1="12" y1="16" x2="12" y2="20"/>
          </svg>
        </div>
        <h1 className={styles.title}>Gym Pulse</h1>
        <p className={styles.sub}>Primera configuración — ¿cómo usarás esta PC?</p>

        <div className={styles.options}>
          <div className={styles.option}>
            <div className={styles.optIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div className={styles.optBody}>
              <h3>PC principal (servidor)</h3>
              <p>Esta PC guardará los datos y los compartirá con las demás en la red. Solo una PC debe tener este rol.</p>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={handleServer}
              disabled={loading}
            >
              {loading ? '…' : 'Configurar'}
            </button>
          </div>

          <div className={styles.divider}>o</div>

          <div className={styles.option}>
            <div className={styles.optIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <div className={styles.optBody}>
              <h3>PC secundaria (cliente)</h3>
              <p>Esta PC se conectará automáticamente a la PC principal. La app principal debe estar abierta.</p>
            </div>
            <button
              className={styles.btnSecondary}
              onClick={handleClient}
              disabled={loading}
            >
              {loading ? '…' : 'Buscar servidor'}
            </button>
          </div>
        </div>

        <p className={styles.footnote}>
          Esta configuración se guarda y no se vuelve a pedir. Podés cambiarla desde Ajustes.
        </p>
      </div>
    </div>
  );
}
