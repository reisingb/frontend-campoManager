const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMachineId:     ()      => ipcRenderer.invoke('get-machine-id'),
  activateLicense:  (code)  => ipcRenderer.invoke('activate-license', code),
  checkLicense:     ()      => ipcRenderer.invoke('check-license'),
  getConfig:        ()      => ipcRenderer.invoke('get-config'),
  setRoleServer:    ()      => ipcRenderer.invoke('set-role-server'),
  setRoleClient:    ()      => ipcRenderer.invoke('set-role-client'),
  rediscoverServer: ()      => ipcRenderer.invoke('rediscover-server'),
  resetConfig:      ()      => ipcRenderer.invoke('reset-config'),
  getLocalIP:       ()      => ipcRenderer.invoke('get-local-ip'),
  openWebConsulta:  ()      => ipcRenderer.invoke('open-web-consulta'),
});
