const { app, BrowserWindow } = require("electron");
const url = require("url");
const path = require("path");
const ejse = require("ejs-electron");

// Código para mirar en tiempo real los cambios realizados
if (process.env.NODE_ENV !== "production") {
  require("electron-reload")(__dirname, {});
}

// Initialize the ejs parser
ejse.data({ titulo: "Bienvenido" });

// Función para crear la ventana
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Necesario para usar Node.js en el renderer
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"], // Permite cargar recursos desde el mismo origen
          imgSrc: ["'self'", "data:"], // Permite cargar imágenes desde 'self' y 'data:'
          // Otras directivas según sea necesario
        },
      },
    },
    icon: "./src/img/logo.ico",
  });

  // Cargar la ventana inicial y le indicamos en qué ruta inicia
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "src/view/index.ejs"),
      protocol: "file",
      slashes: true,
    })
  );

  // Abre las herramientas de desarrollo al inicio
  win.webContents.openDevTools();

  // Ajustar Content Security Policy
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
