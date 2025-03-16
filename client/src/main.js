const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true // Mudando para true
        }
    });

    // Load the index.html file
    win.loadFile(path.join(__dirname, 'index.html'));

    // Log any console messages from the renderer process
    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log('Renderer Console:', message);
    });
}

// Create window when app is ready
app.whenReady().then(() => {
    createWindow();

    // On macOS, create a new window when clicking the dock icon if no windows are open
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});