const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');

const APP_PORT = process.env.PORT || '3001';
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const APP_TITLE = 'Git Report Pro';
const APP_ICON = path.join(app.getAppPath(), 'public', 'favicon.png');

let mainWindow = null;
let serverProcess = null;
let isQuitting = false;

function startBackendServer() {
  const serverEntry = path.join(app.getAppPath(), 'server.js');
  serverProcess = fork(serverEntry, [], {
    env: { ...process.env, PORT: APP_PORT },
    silent: true
  });

  if (serverProcess.stdout) {
    serverProcess.stdout.on('data', (data) => {
      console.log(`[server] ${data.toString().trim()}`);
    });
  }

  if (serverProcess.stderr) {
    serverProcess.stderr.on('data', (data) => {
      console.error(`[server:error] ${data.toString().trim()}`);
    });
  }

  serverProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    serverProcess = null;

    if (!isQuitting) {
      dialog.showErrorBox(
        'App Server Stopped',
        'The local server unexpectedly stopped. Please restart the app.'
      );
      app.quit();
    }
  });
}

async function loadAppWithRetry(windowRef, retries = 40, delayMs = 500) {
  for (let i = 0; i < retries; i += 1) {
    try {
      await windowRef.loadURL(APP_URL);
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Unable to connect to ${APP_URL}`);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: APP_TITLE,
    icon: APP_ICON,
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await loadAppWithRetry(mainWindow);
  mainWindow.show();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function stopBackendServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

app.whenReady().then(async () => {
  startBackendServer();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  stopBackendServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
