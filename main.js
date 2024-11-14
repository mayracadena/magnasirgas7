import { app, BrowserWindow } from "electron";
import { dirname } from "path";
import { fileURLToPath } from "url";
import ejse from "ejs-electron";
import { createRequire } from "module";
import * as path from "path"; // Importación de path

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

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
      contextIsolation: false,
    },
    icon: "./src/img/logo.ico",
  });

  // Cargar la ventana inicial usando loadURL con el archivo index.ejs
  // win.loadURL(`file://${path.join(__dirname, "src", "view", "index.ejs")}`);
  win.loadFile(path.join(__dirname, "src", "view", "index.ejs"));

  // Abre las herramientas de desarrollo al inicio
  win.webContents.openDevTools();
};

// Inicializar la aplicación cuando esté lista
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Cerrar la aplicación cuando todas las ventanas estén cerradas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
