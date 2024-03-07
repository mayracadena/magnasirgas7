const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');

//estas con las catracterisicas de la ventana (alto y ancho)
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 800
    })
// aca cargamos la ventana inicial y le indicamos en que ruta inicia
   win.loadURL(url.format({
    pathname: path.join(__dirname, 'src/view/index.html'),
    protocol: 'file',
    slashes: true
    
}))}

app.whenReady().then(() => {
    createWindow()
//aca cuando
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})