const { app, BrowserWindow } = require("electron");
const url = require("url");
const path = require("path");
const ejse = require("ejs-electron");



if (process.env.NODE_ENV !== "production") {
  require("electron-reload")(__dirname, {});
}

ejse.data({ titulo: "Bienvenido" });

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // Cambiado a true
      contextIsolation: false, // Cambiado a false
    },
    icon: "./src/img/logo.ico",
  });
  
  // Establecer Content Security Policy para mejorar la seguridad
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; media-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
        ],
      },
    });
  });

  // Cargar la ventana inicial con index.ejs
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "src/view/index.ejs"),
      protocol: "file",
      slashes: true,
    })
  );

  // Abre las herramientas de desarrollo si estás en modo de desarrollo
  win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});