import React, { useState } from 'react';
import { useAnimales } from '../context/AnimalesContext';
import { useConfig } from '../context/ConfigContext';
import styles from './ConnectionBanner.module.css';

export default function ConnectionBanner() {
  const { online, reload } = useAnimales();
  const { config, rediscover } = useConfig();
  const [discovering, setDiscovering] = useState(false);

  if (online) return null;

  const handleRediscover = async () => {
    setDiscovering(true);
    if (config?.role === 'client') {
      await rediscover();
    }
    await reload();
    setDiscovering(false);
  };

  return (
    <div className={styles.banner}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>
        {config?.role === 'server'
          ? 'Error al acceder a los datos locales.'
          : 'Sin conexión al servidor principal.'}
      </span>
      <button
        className={styles.btnRetry}
        onClick={handleRediscover}
        disabled={discovering}
      >
        {discovering ? 'Buscando…' : 'Reconectar'}
      </button>
    </div>
  );
}
