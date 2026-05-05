import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Paleta de fondos predefinidos
export const BG_PALETTES = [
  { id: 'warm', label: 'Cálido', bg: '#fdf4e8', surface: '#fdf4e8', surface2: '#f5e3c8' },
  { id: 'mint', label: 'Menta', bg: '#edf7f1', surface: '#edf7f1', surface2: '#d7efe2' },
  { id: 'green', label: 'Verde Campo', bg: '#eaf4ec', surface: '#ffffff', surface2: '#cfe7d6' },
  { id: 'dark', label: 'Oscuro', bg: '#1f2a24', surface: '#2b3a33', surface2: '#3a4b45'},
];

// Colores de acento predefinidos
export const ACCENT_PALETTES = [
  { id: 'green', label: 'Verde', color: '#1a7a56', bg: '#e6f4ee', text: '#145c40' },
  { id: 'blue', label: 'Azul', color: '#1a5fa8', bg: '#e8f1fb', text: '#154d8a' },

];

const STORAGE_KEY = 'campo_theme_v1';

function loadTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return {
    gymName: 'CampoManager',
    bgId: 'stone',
    accentId: 'green',
    logoBase64: null,
  };
}

function saveTheme(theme) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(theme)); } catch { }
}

function applyTheme(theme) {
  const root = document.documentElement;
  const bg = BG_PALETTES.find(p => p.id === theme.bgId) || BG_PALETTES[0];
  const accent = ACCENT_PALETTES.find(p => p.id === theme.accentId) || ACCENT_PALETTES[0];

  root.style.setProperty('--bg', bg.bg);
  root.style.setProperty('--surface', bg.surface);
  root.style.setProperty('--surface-2', bg.surface2);

  // Textos adaptados a modo oscuro
  const isDark = bg.id === 'dark' || bg.id === 'midnight';
  root.style.setProperty('--text-1', isDark ? '#f4f4f5' : '#1a1a18');
  root.style.setProperty('--text-2', isDark ? '#a1a1aa' : '#6b6860');
  root.style.setProperty('--text-3', isDark ? '#71717a' : '#9e9b95');
  root.style.setProperty('--border', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
  root.style.setProperty('--border-strong', isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)');

  // Acento (reemplaza --green como color principal de acción)
  root.style.setProperty('--accent', accent.color);
  root.style.setProperty('--accent-bg', accent.bg);
  root.style.setProperty('--accent-text', accent.text);

  // Sobrescribimos --green con el acento para que MemberCard y botones usen el color elegido
  root.style.setProperty('--green', accent.color);
  root.style.setProperty('--green-bg', accent.bg);
  root.style.setProperty('--green-text', accent.text);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(loadTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const updateTheme = (changes) => {
    setThemeState(prev => {
      const next = { ...prev, ...changes };
      saveTheme(next);
      applyTheme(next);
      return next;
    });
  };

  const setLogo = (base64) => updateTheme({ logoBase64: base64 });
  const removeLogo = () => updateTheme({ logoBase64: null });
  const setBg = (id) => updateTheme({ bgId: id });
  const setAccent = (id) => updateTheme({ accentId: id });
  const setGymName = (name) => updateTheme({ gymName: name });

  return (
    <ThemeContext.Provider value={{ theme, setLogo, removeLogo, setBg, setAccent, setGymName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
