import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { useConfig } from './ConfigContext';
import { INITIAL_ANIMALES } from '../data/initialData';

const AnimalesContext = createContext(null);

export function AnimalesProvider({ children }) {
  const { config } = useConfig();
  const api = useApi(config?.serverIp);

  const [animales,    setAnimales]    = useState([]);
  const [online,      setOnline]      = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const socketRef = useRef(null);

  const reload = useCallback(async () => {
    if (!config?.serverIp) { setAnimales(INITIAL_ANIMALES); setOnline(false); return; }
    setLoadingData(true);
    try {
      const data = await api.getAnimales();
      setAnimales(data);
      setOnline(true);
    } catch {
      setOnline(false);
      setAnimales(prev => prev.length ? prev : INITIAL_ANIMALES);
    } finally {
      setLoadingData(false);
    }
  }, [config?.serverIp]);

  // ── WebSocket tiempo real ──────────────────────────────────────────────────
  useEffect(() => {
    if (!config?.serverIp) return;
    const connectWS = async () => {
      try {
        const { io } = await import('socket.io-client');
        const url    = `http://${config.serverIp.split('/')[0]}`;
        const socket = io(url, { transports: ['websocket', 'polling'], reconnection: true });
        socketRef.current = socket;

        socket.on('animal:creado',      a     => setAnimales(prev => prev.find(x=>x.id===a.id) ? prev : [...prev, a]));
        socket.on('animal:actualizado', a     => setAnimales(prev => prev.map(x => x.id===a.id ? {...x,...a} : x)));
        socket.on('animal:eliminado',   ({id})=> setAnimales(prev => prev.filter(x => x.id !== id)));
        // Actualizar ultimaUbicacion en tiempo real sin recargar fotos
        socket.on('animal:ubicacion',   ({ id, ubicacion }) =>
          setAnimales(prev => prev.map(x => x.id === id
            ? { ...x, ultimaUbicacion: ubicacion }
            : x
          ))
        );
        socket.on('connect',    () => setOnline(true));
        socket.on('disconnect', () => setOnline(false));
      } catch {
        const interval = setInterval(reload, 15000);
        return () => clearInterval(interval);
      }
    };
    connectWS();
    return () => { socketRef.current?.disconnect(); };
  }, [config?.serverIp]);

  useEffect(() => { reload(); }, [reload]);

  const buscarPorId = (id) => animales.find(a => a.id === id) || null;

  const agregarAnimal = async (animal) => {
    if (config?.serverIp) {
      try {
        const r = await api.addAnimal(animal);
        setAnimales(prev => prev.find(x=>x.id===r.id) ? prev : [...prev, r]);
        return { ok: true };
      } catch (e) { return { ok: false, msg: e.message }; }
    } else {
      const nuevo = { ...animal, id: `a${Date.now()}` };
      setAnimales(prev => [...prev, nuevo]);
      return { ok: true };
    }
  };

  const editarAnimal = async (id, cambios) => {
    if (config?.serverIp) {
      try {
        const r = await api.updateAnimal(id, cambios);
        setAnimales(prev => prev.map(a => a.id === id ? r : a));
        return { ok: true };
      } catch (e) { return { ok: false, msg: e.message }; }
    } else {
      setAnimales(prev => prev.map(a => a.id === id ? { ...a, ...cambios } : a));
      return { ok: true };
    }
  };

  const eliminarAnimal = async (id) => {
    if (config?.serverIp) {
      try {
        await api.deleteAnimal(id);
        setAnimales(prev => prev.filter(a => a.id !== id));
        return { ok: true };
      } catch (e) { return { ok: false, msg: e.message }; }
    } else {
      setAnimales(prev => prev.filter(a => a.id !== id));
      return { ok: true };
    }
  };

  const descargarPdf = async (id) => {
    if (!config?.serverIp) return { ok: false, msg: 'Sin servidor' };
    try {
      const url  = `http://${config.serverIp}/api/animales/${id}/pdf`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const blob = await res.blob();
      const a    = animales.find(x => x.id === id);
      const link = document.createElement('a');
      link.href     = URL.createObjectURL(blob);
      link.download = `ficha-${(a?.nombre || id).replace(/\s+/g,'-')}.pdf`;
      link.click();
      return { ok: true };
    } catch (e) { return { ok: false, msg: e.message }; }
  };

  return (
    <AnimalesContext.Provider value={{
      animales, online, loadingData,
      reload, buscarPorId,
      agregarAnimal, editarAnimal, eliminarAnimal, descargarPdf,
    }}>
      {children}
    </AnimalesContext.Provider>
  );
}

export function useAnimales() { return useContext(AnimalesContext); }
