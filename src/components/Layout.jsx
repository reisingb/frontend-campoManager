import React, { useState } from 'react';
import { useAuth }     from '../context/AuthContext';
import { useConfig }   from '../context/ConfigContext';
import { useTheme }    from '../context/ThemeContext';
import { useAnimales } from '../context/AnimalesContext';
import ConnectionBanner from './ConnectionBanner';
import TabAnimales from './TabAnimales';
import TabExcel    from './TabExcel';
import TabAjustes  from './TabAjustes';
import styles from './Layout.module.css';

const TABS = [
  { id: 'animales', label: 'Animales'    },
  { id: 'excel',    label: 'Excel'       },
  { id: 'ajustes',  label: 'Ajustes'     },
];

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const { config }  = useConfig();
  const { online }  = useAnimales();
  const { theme }   = useTheme();
  const [activeTab, setActiveTab] = useState('animales');

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          {theme.logoBase64
            ? <img src={theme.logoBase64} alt="Logo" className={styles.logoImg} />
            : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={styles.logo}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            )
          }
          <div>
            <span className={styles.gymName}>{theme.gymName || 'CampoManager'}</span>
            <span className={styles.gymDate}>{today}</span>
          </div>
        </div>
        <div className={styles.topRight}>
          <span className={`${styles.roleBadge} ${config?.role === 'server' ? styles.roleServer : styles.roleClient}`}>
            {config?.role === 'server' ? 'Servidor' : 'Cliente'}
          </span>
          <span className={styles.userBadge}>
            <span className={`${styles.dot} ${online ? styles.dotOnline : styles.dotOffline}`} />
            {currentUser}
          </span>
          <button className={styles.btnLogout} onClick={logout}>Salir</button>
        </div>
      </header>

      <ConnectionBanner />

      <nav className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {activeTab === 'animales' && <TabAnimales />}
        {activeTab === 'excel'    && <TabExcel />}
        {activeTab === 'ajustes'  && <TabAjustes />}
      </main>
    </div>
  );
}
