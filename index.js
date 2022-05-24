const { shell, app, BrowserWindow, dialog } = require('electron');
const os = require('os')
const path = require('path');
const fs = require('fs');
const Nuron = require('nurond');
const VERSION = "v0"


let mainWindow;
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('nuron', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('nuron')
}
const gotTheLock = app.requestSingleInstanceLock()
let url;
if (gotTheLock) {
  app.on('second-instance', (event, argv) => {
    if (process.platform !== 'darwin') {
      url = argv.find((arg) => arg.startsWith('nuron://'));
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      let p = url.replace("nuron://", "")
      mainWindow.loadURL('http://localhost:42000/' + p)
    }
  })
} else {
  app.quit()
  return
}
app.on("ready", () => {
  createWindow()
})
app.on('will-finish-launching', () => {
  app.on('open-url', (event, url) => {
    event.preventDefault()
    let p = url.replace("nuron://", "")
    mainWindow.loadURL('http://localhost:42000/' + p)
  })
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', function() {
  if (mainWindow === null) {
    createWindow()
  }
})

async function createWindow() {
  const nuron = new Nuron()
  const nuronHome = path.resolve(os.homedir(), `__nuron__/${VERSION}`, "home")
  const nuronTmp = path.resolve(os.homedir(), `__nuron__/${VERSION}`, "tmp")
  const keyportHome = path.resolve(os.homedir(), "__keyport__")
  console.log("nuron fs located at:", nuronHome);
  await fs.promises.mkdir(nuronHome, { recursive: true }).catch((e) => {})
  await fs.promises.mkdir(nuronTmp, { recursive: true }).catch((e) => {})
  await fs.promises.mkdir(keyportHome, { recursive: true }).catch((e) => {})
  await nuron.init({
    ipfs: {},
    path: nuronHome,
    tmp: nuronTmp,
    keyport: keyportHome
  })
  // Protocol handler for win32
  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: "#1a1920",
      symbolColor: "white"
    }
  })
  mainWindow.on('closed', function() {
    mainWindow = null
  })
  mainWindow.maximize()
  mainWindow.loadURL('http://localhost:42000')
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  if (process.platform == 'win32') {
    if (process.argv.length >= 2) {
      url = process.argv.find((arg) => arg.startsWith('nuron://'));
      if (url) {
        let p = url.replace("nuron://", "")
        mainWindow.loadURL('http://localhost:42000/' + p)  
      }
    }
  }
}
