import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig]   = useState(null);  // null = cargando
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // En Electron usamos la API del preload; en dev browser usamos mock
    if (window.electronAPI) {
      window.electronAPI.getConfig().then(cfg => {
        setConfig(cfg);
        setLoading(false);
      });
    } else {
      // Modo desarrollo sin Electron: simular servidor local
      setConfig({ role: 'server', serverIp: 'localhost:4321' });
      setLoading(false);
    }
  }, []);

  const setRoleServer = async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.setRoleServer();
    if (result.ok) {
      const cfg = await window.electronAPI.getConfig();
      setConfig(cfg);
    }
    return result;
  };

  const setRoleClient = async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.setRoleClient();
    const cfg = await window.electronAPI.getConfig();
    setConfig(cfg);
    return result;
  };

  const rediscover = async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.rediscoverServer();
    if (result.ok) {
      const cfg = await window.electronAPI.getConfig();
      setConfig(cfg);
    }
    return result;
  };

  const resetConfig = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.resetConfig();
    setConfig({ role: null, serverIp: null });
  };

  const getLocalIP = () => window.electronAPI?.getLocalIP() ?? Promise.resolve('localhost');

  return (
    <ConfigContext.Provider value={{
      config, loading,
      setRoleServer, setRoleClient, rediscover, resetConfig, getLocalIP,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
