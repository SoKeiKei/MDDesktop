"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 确保类型安全的 API 实现
const api = {
    showOpenDialog: (options) => electron_1.ipcRenderer.invoke('showOpenDialog', options),
    readDirectory: (path) => electron_1.ipcRenderer.invoke('readDirectory', path),
    readFile: (path) => electron_1.ipcRenderer.invoke('readFile', path),
    writeFile: (path, content) => electron_1.ipcRenderer.invoke('writeFile', path, content)
};
// 暴露 API 到渲染进程
electron_1.contextBridge.exposeInMainWorld('electron', api);
