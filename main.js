const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');

//codigo para mirar en tiempo real los cambios realizados
if(process.env.NODE_ENV !== 'production'){
    require('electron-reload')(__dirname,{

    })
}


//estas con las caracterisicas de la ventana (alto y ancho)
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

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})