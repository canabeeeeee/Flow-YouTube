const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');


app.setName('YouTube');


let mainWindow, splash;



function createWindows() {
  // Splash screen
  splash = new BrowserWindow({
    width: 900,
    height: 700,
    frame: false,
    autoHideMenuBar: true,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    center: true
  });
  splash.loadFile('yt-animation.html');

  


  // Main YouTube window (hidden at start)
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    frame: false,           // no default window controls!
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'youtube.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')  // custom IPC for controls
    }
  });
  mainWindow.loadURL('https://youtube.com');

  

  // Inject CSS & disable right-click after page load
  mainWindow.webContents.on('did-finish-load', () => {


    mainWindow.webContents.insertCSS(`
      * {
        user-select: none !important;
        --yt-frosted-glass-backdrop-filter-override: blur(40px) !important;
        -webkit-user-select: none !important;
      }
      input, textarea, [contenteditable="true"] {
        user-select: text !important;
        -webkit-user-select: text !important;
      }
    `);

    mainWindow.webContents.on('context-menu', (e) => {
      e.preventDefault();
    });
  });

  mainWindow.webContents.executeJavaScript(`
  if (!document.getElementById('custom-win-controls')) {
    const style = document.createElement('style');
    style.textContent = \`
      #custom-win-controls {
        position: fixed;
        top: 10px;
        left:184px;
        z-index: 999999;
        display: flex;
        gap: 10px;
        border-radius: 50px;
        backdrop-filter: blur(0px);
        transition: all 0.3s ease;
        animation-delay: 3s;
      }
    
      #custom-win-controls:hover {
        backdrop-filter: blur(20px);
        transition: all 0.3s ease;
      }
      #custom-win-controls button {
        width: 36px;
        height: 36px;
        border: none;
        background: rgba(255, 255, 255, 0);
        color: white;
        backdrop-filter: blur(0px);
        font-weight: bold;
        opacity:0.1;
        cursor: pointer;
        border-radius: 50%;
        font-size: 16px;
        user-select: none;
        transition: all, backdrop-filter 0.3s, opacity 0.3s;
      }
      #custom-win-controls button:hover {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        opacity:1;
      }
    \`;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'custom-win-controls';

    const minBtn = document.createElement('button');
    minBtn.textContent = '—';
    minBtn.onclick = () => window.electronAPI.minimize();

    const maxBtn = document.createElement('button');
    maxBtn.textContent = '☐';
    maxBtn.onclick = () => window.electronAPI.maximize();

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => window.electronAPI.close();

    container.appendChild(minBtn);
    container.appendChild(maxBtn);
    container.appendChild(closeBtn);

    document.body.appendChild(container);
  }
`);


  // Show main window after splash delay
  setTimeout(() => {
    splash.close();
    mainWindow.show();
  }, 3000);
}

// IPC for window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(createWindows);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

