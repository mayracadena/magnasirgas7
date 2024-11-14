import path from 'path';
import { fileURLToPath } from 'url';
import webpackNodeExternals from 'webpack-node-externals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: './main.js',  // Ruta de entrada del proceso principal
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.bundle.js',
  },
  target: 'electron-main',  // Configuración específica para el proceso principal de Electron
  externals: [webpackNodeExternals()],  // Excluye módulos de node_modules
  resolve: {
    extensions: ['.js'],
  },
};
