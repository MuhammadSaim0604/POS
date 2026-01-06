

import {app, BrowserWindow} from 'electron';
import path from 'path';
import {fork} from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL('http://localhost:5000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start the Node.js server
function startServer() {
  // Use fork to run your dist/index.js
  serverProcess = fork(path.join(__dirname, 'server', 'index.ts'));

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

app.on('ready', () => {
  startServer();

  // Give the server a few seconds to start
  setTimeout(createWindow, 3000);
});

app.on('window-all-closed', () => {
  // Stop the server when all windows are closed
  if (serverProcess) serverProcess.kill();

  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
