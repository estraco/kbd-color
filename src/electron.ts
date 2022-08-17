import { app, BrowserWindow } from 'electron';
import path from 'path';

function init() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, '..', 'scripts', 'preload.js')
        }
    });

    win.loadFile(path.join(__dirname, '..', 'pages', 'index.html'));
}

app.whenReady().then(() => {
    init();
});