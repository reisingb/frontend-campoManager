const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');
const url    = require('url');
const crypto = require('crypto');
const { spawn } = require('child_process');

const isDev = !app.isPackaged;

// ── Rutas ───────────────────────────────────────────────────────────────────
const USER_DATA    = app.getPath('userData');
const CONFIG_FILE  = path.join(USER_DATA, 'config.json');
const LICENSE_FILE = path.join(USER_DATA, 'license.json');
const DATA_DIR     = path.join(USER_DATA, 'data');

// ── Machine ID ──────────────────────────────────────────────────────────────
const MACHINE_ID_FILE = path.join(USER_DATA, 'machine.json');

function getMachineId() {
  try {
    if (fs.existsSync(MACHINE_ID_FILE)) {
      const d = JSON.parse(fs.readFileSync(MACHINE_ID_FILE, 'utf8'));
      if (d?.id?.length === 16) return d.id;
    }
  } catch {}
  const raw = `${os.hostname()}|${os.cpus()[0]?.model}|${os.totalmem()}|${crypto.randomBytes(8).toString('hex')}`;
  const id  = crypto.createHash('sha256').update(raw).digest('hex').slice(0,16).toUpperCase();
  fs.mkdirSync(USER_DATA, { recursive: true });
  fs.writeFileSync(MACHINE_ID_FILE, JSON.stringify({ id }));
  return id;
}
const MACHINE_ID = getMachineId();

// ── Licencia ─────────────────────────────────────────────────────────────────
const { validateLicense } = require('./license');
function loadLicense()   { try { if (fs.existsSync(LICENSE_FILE)) return JSON.parse(fs.readFileSync(LICENSE_FILE,'utf8')); } catch {} return null; }
function saveLicense(d)  { fs.mkdirSync(USER_DATA,{recursive:true}); fs.writeFileSync(LICENSE_FILE,JSON.stringify(d,null,2)); }
function isActivated()   { const l=loadLicense(); if(!l?.code) return false; return validateLicense(l.code,MACHINE_ID); }

// ── Config ───────────────────────────────────────────────────────────────────
function loadConfig()    { try { if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE,'utf8')); } catch {} return { role:null, serverIp:null }; }
function saveConfig(c)   { fs.mkdirSync(USER_DATA,{recursive:true}); fs.writeFileSync(CONFIG_FILE,JSON.stringify(c,null,2)); }

let mainWindow = null;
let config     = loadConfig();

// ── NestJS backend process ───────────────────────────────────────────────────
let nestProcess = null;
const NEST_PORT = 4321;

function getBackendPath() {
  if (isDev) {
    // En dev: el backend corre separado con `npm run start:dev`
    return null;
  }
  // En producción: el backend compilado está en resources/backend/dist/main.js
  return path.join(process.resourcesPath, 'backend', 'dist', 'main.js');
}

function startNestBackend() {
  const backendMain = getBackendPath();
  if (!backendMain || !fs.existsSync(backendMain)) {
    console.log('[Electron] Backend NestJS no encontrado en', backendMain, '— asumiendo que corre externamente');
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  nestProcess = spawn(process.execPath, [backendMain], {
    env: { ...process.env, PORT: String(NEST_PORT), DATA_DIR },
    stdio: ['ignore','pipe','pipe'],
  });
  nestProcess.stdout.on('data', d => console.log('[NestJS]', d.toString().trim()));
  nestProcess.stderr.on('data', d => console.error('[NestJS]', d.toString().trim()));
  nestProcess.on('exit', (code) => { console.log(`[NestJS] Proceso terminado con código ${code}`); nestProcess = null; });
  console.log(`[Electron] NestJS iniciado (PID ${nestProcess.pid})`);
}

function stopNestBackend() {
  if (nestProcess) { nestProcess.kill(); nestProcess = null; }
}

// ── mDNS discovery ───────────────────────────────────────────────────────────
let bonjourInstance = null;

function publishBonjour(port) {
  try {
    const { Bonjour } = require('bonjour-service');
    bonjourInstance = new Bonjour();
    bonjourInstance.publish({ name:'Campo Manager', type:'campomanager', port });
    console.log('[mDNS] Publicado: type=campomanager port='+port);
  } catch(e) { console.warn('[mDNS]', e.message); }
}

function discoverServer(ms=10000) {
  return new Promise((resolve,reject)=>{
    const { Bonjour } = require('bonjour-service');
    const b = new Bonjour();
    const browser = b.find({ type:'campomanager' });
    const timer = setTimeout(()=>{ browser.stop(); b.destroy(); reject(new Error('No se encontró ningún servidor en la red.')); }, ms);
    browser.on('up', svc => {
      clearTimeout(timer); browser.stop(); b.destroy();
      const ip = svc.addresses?.find(a=>a.includes('.'))||svc.host;
      resolve({ ip, port: svc.port });
    });
  });
}

// ── Ventana ───────────────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, '..', 'assets', 'icon.ico')
    : path.join(process.resourcesPath, 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width:1100, height:720, minWidth:860, minHeight:600,
    title:'CampoManager',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences:{
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : url.pathToFileURL(path.join(__dirname,'..','build','index.html')).toString();

  mainWindow.loadURL(startUrl);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.on('closed', ()=>{ mainWindow=null; });
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('get-machine-id',  ()    => MACHINE_ID);
ipcMain.handle('check-license',   ()    => ({ activated: isActivated() }));
ipcMain.handle('activate-license',(_,c) => {
  if (validateLicense(c, MACHINE_ID)) { saveLicense({ code:c.toUpperCase().replace(/[-\s]/g,''), machineId:MACHINE_ID }); return { ok:true }; }
  return { ok:false, error:'Código de activación inválido.' };
});
ipcMain.handle('get-config',  ()     => config);
ipcMain.handle('get-local-ip',()     => getLocalIP());

ipcMain.handle('set-role-server', async () => {
  startNestBackend();
  publishBonjour(NEST_PORT);
  const ip = getLocalIP();
  config = { role:'server', serverIp:`${ip}:${NEST_PORT}` };
  saveConfig(config);
  return { ok:true, ip, port:NEST_PORT };
});

ipcMain.handle('set-role-client', async () => {
  config = { role:'client', serverIp:null };
  saveConfig(config);
  try {
    const { ip, port } = await discoverServer();
    config.serverIp = `${ip}:${port}`;
    saveConfig(config);
    return { ok:true, serverIp:config.serverIp };
  } catch(e) { return { ok:false, error:e.message }; }
});

ipcMain.handle('rediscover-server', async () => {
  try {
    const { ip, port } = await discoverServer();
    config.serverIp = `${ip}:${port}`;
    saveConfig(config);
    return { ok:true, serverIp:config.serverIp };
  } catch(e) { return { ok:false, error:e.message }; }
});

ipcMain.handle('reset-config', () => {
  stopNestBackend();
  if (bonjourInstance) { bonjourInstance.destroy(); bonjourInstance=null; }
  config = { role:null, serverIp:null };
  saveConfig(config);
  if (mainWindow) mainWindow.reload();
  return { ok:true };
});

// Abrir la web de consulta pública en el navegador del sistema
ipcMain.handle('open-web-consulta', () => {
  shell.openExternal(`http://${config.serverIp ? config.serverIp : 'localhost:'+NEST_PORT}/consulta`);
});

function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces) { if (i.family==='IPv4' && !i.internal) return i.address; }
  }
  return '127.0.0.1';
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (config.role === 'server') { startNestBackend(); publishBonjour(NEST_PORT); }
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on('window-all-closed', () => {
  stopNestBackend();
  if (bonjourInstance) { bonjourInstance.destroy(); }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { stopNestBackend(); });
