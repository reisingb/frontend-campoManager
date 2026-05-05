import { useCallback } from 'react';

export function useApi(serverIp) {
  const base = serverIp ? `http://${serverIp}/api` : null;

  const request = useCallback(async (method, endpoint, body) => {
    if (!base) throw new Error('No hay servidor configurado');
    const res = await fetch(`${base}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || `Error ${res.status}`);
    }
    return res.json();
  }, [base]);

  return {
    getAnimales:  ()        => request('GET',    '/animales'),
    getAnimal:    (id)      => request('GET',    `/animales/${id}`),
    addAnimal:    (animal)  => request('POST',   '/animales', animal),
    updateAnimal: (id, d)   => request('PUT',    `/animales/${id}`, d),
    deleteAnimal: (id)      => request('DELETE', `/animales/${id}`),
    ping:         ()        => request('GET',    '/../api/ping'),

    // PDF: devuelve blob directamente
    getPdfUrl: (serverIp, id) => `http://${serverIp}/api/animales/${id}/pdf`,
  };
}
