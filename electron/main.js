"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
let mainWindow = null;
async function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true, // 确保这个是 true
            preload: path.join(__dirname, '../preload.js') // 使用相对路径
        }
    });
    if (process.env.NODE_ENV === 'development') {
        await mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        await mainWindow.loadFile('dist/index.html');
    }
    mainWindow.on('ready-to-show', () => {
        console.log('Window ready to show');
        mainWindow?.show();
    });
}
// 等待应用准备就绪后再设置 IPC 处理器
electron_1.app.whenReady().then(() => {
    createWindow();
    // 设置 IPC 处理器
    electron_1.ipcMain.handle('showOpenDialog', async (event, options) => {
        try {
            if (!mainWindow)
                throw new Error('Main window is not available');
            const result = await electron_1.dialog.showOpenDialog(mainWindow, {
                title: '选择目录',
                properties: ['openDirectory'],
                ...options
            });
            return result;
        }
        catch (error) {
            console.error('Failed to show open dialog:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('readDirectory', async (event, dirPath) => {
        try {
            const files = await fs.readdir(dirPath);
            const fileInfos = await Promise.all(files.map(async (name) => {
                const filePath = path.join(dirPath, name);
                const stats = await fs.stat(filePath);
                return {
                    path: filePath,
                    name,
                    lastModified: stats.mtimeMs
                };
            }));
            return fileInfos;
        }
        catch (error) {
            console.error('Failed to read directory:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('readFile', async (event, filePath) => {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        }
        catch (error) {
            console.error('Failed to read file:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('writeFile', async (event, filePath, content) => {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
        }
        catch (error) {
            console.error('Failed to write file:', error);
            throw error;
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
