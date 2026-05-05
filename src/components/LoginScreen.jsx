import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const { login, error, setError } = useAuth();
  const { theme } = useTheme();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(user, pass);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>

        <div className={styles.icon}>
          {theme.logoBase64 ? (
            <img
              src={theme.logoBase64}
              alt="Logo"
              className={styles.logoImg}
            />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
              <line x1="4" y1="4" x2="20" y2="4"/>
              <line x1="4" y1="20" x2="20" y2="20"/>
              <line x1="12" y1="16" x2="12" y2="20"/>
            </svg>
          )}
        </div>

        <h1 className={styles.title}>{theme.gymName || 'Gym Pulse'}</h1>
        <p className={styles.sub}>Acceso para recepcionistas</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Usuario</label>
            <input
              type="text"
              value={user}
              onChange={e => { setUser(e.target.value); setError(''); }}
              placeholder="admin"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(''); }}
              placeholder="••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p className={styles.err}>{error}</p>}
          <button type="submit" className={styles.btn}>Ingresar</button>
        </form>

      </div>
    </div>
  );
}