import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFile, readdir } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'

log.initialize()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  log.info('Creating main window...')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    log.info('Main window ready')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  log.info('App ready, initializing...')

  electronApp.setAppUserModelId('com.tejujagua.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Ebooks', extensions: ['epub', 'pdf'] }
      ]
    })
    return result.filePaths
  })

  ipcMain.handle('file:read', async (_, filePath: string) => {
    try {
      const buffer = await readFile(filePath)
      return buffer
    } catch (err) {
      log.error('Error reading file:', err)
      return null
    }
  })

  ipcMain.handle('file:readDir', async (_, dirPath: string) => {
    try {
      const entries = await readdir(dirPath)
      return entries
    } catch (err) {
      log.error('Error reading directory:', err)
      return []
    }
  })

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:getPlatform', () => {
    return process.platform
  })

  ipcMain.handle('app:checkForUpdates', async () => {
    try {
      const { autoUpdater } = await import('electron-updater')
      
      autoUpdater.logger = log
      autoUpdater.autoDownload = false
      autoUpdater.autoInstallOnAppQuit = true
      
      const result = await autoUpdater.checkForUpdates()
      return result?.updateInfo || null
    } catch (err) {
      log.error('Error checking for updates:', err)
      return null
    }
  })

  ipcMain.handle('app:downloadUpdate', async () => {
    try {
      const { autoUpdater } = await import('electron-updater')
      await autoUpdater.downloadUpdate()
      return true
    } catch (err) {
      log.error('Error downloading update:', err)
      return false
    }
  })

  ipcMain.handle('app:installUpdate', () => {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.quitAndInstall()
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  log.info('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

log.info('Main process initialized')
