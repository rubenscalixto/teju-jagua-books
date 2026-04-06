import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  openFileDialog: () => Promise<string[]>
  readFile: (filePath: string) => Promise<Buffer | null>
  readDir: (dirPath: string) => Promise<string[]>
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  checkForUpdates: () => Promise<any>
  downloadUpdate: () => Promise<boolean>
  installUpdate: () => Promise<void>
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  readDir: (dirPath: string) => ipcRenderer.invoke('file:readDir', dirPath),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  downloadUpdate: () => ipcRenderer.invoke('app:downloadUpdate'),
  installUpdate: () => ipcRenderer.invoke('app:installUpdate')
})
