import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth }       from './context/AuthContext';
import { ConfigProvider, useConfig }   from './context/ConfigContext';
import { AnimalesProvider }            from './context/AnimalesContext';
import { ThemeProvider }               from './context/ThemeContext';
import ActivationScreen from './components/ActivationScreen';
import SetupScreen      from './components/SetupScreen';
import LoginScreen      from './components/LoginScreen';
import Layout           from './components/Layout';

function AppContent() {
  const { config, loading } = useConfig();
  const { currentUser }     = useAuth();
  const [activated, setActivated] = useState(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.checkLicense().then(r => setActivated(r.activated));
    } else {
      setActivated(true);
    }
  }, []);

  if (activated === null || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--text-1)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!activated) return <ActivationScreen onActivated={() => setActivated(true)} />;
  if (!config?.role) return <SetupScreen />;
  if (!currentUser) return <LoginScreen />;

  return (
    <AnimalesProvider>
      <Layout />
    </AnimalesProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}
