import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: './src/js/conver_trans.js',  // Punto de entrada del proceso de renderizado
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.bundle.js',
  },
  target: 'web',  // Configuración para el navegador en el renderizador
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,  // Nueva regla para archivos CSS
        use: ['style-loader', 'css-loader'],  // Carga CSS con style-loader y css-loader
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.css'],
    alias: {
      rbush: path.resolve(__dirname, 'node_modules/rbush/rbush.js'),
    },
  },
  devtool: false,  // Desactiva eval para producción
};
