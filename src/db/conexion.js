const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class conexion {
    constructor() {
        this.dbFilePath = path.resolve('../db/coord_planas_cartesianas_igac.db3'); // Resolución de la ruta para evitar errores de ruta relativos
        this.db = null;
    }

    // Método para abrir la conexión
    async open() {
        return new Promise((resolve, reject) => {
           
            this.db = new sqlite3.Database(this.dbFilePath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error("Error al abrir la base de datos:", err.message);
                    
                    reject(err);
                } else {
                    console.log("Conectado a la base de datos:");
                    resolve(this.db);
                }
            });
        });
    }

    // Método para ejecutar una consulta sin retorno de datos (ej. INSERT, UPDATE, DELETE)
    async run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function (err) {
                if (err) {
                    console.error("Error ejecutando la consulta:", err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Para obtener el ID del último registro insertado si es necesario
                }
            });
        });
    }

    // Método para ejecutar una consulta que devuelve todas las filas (ej. SELECT)
    async getAll(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error("Error ejecutando la consulta:", err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Método para ejecutar una consulta que devuelve una sola fila
    async getOne(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    console.error("Error ejecutando la consulta:", err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }



    // Método para cerrar la conexión
    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.error("Error al cerrar la conexión:", err.message);
                    reject(err);
                } else {
                    console.log("Conexión cerrada con éxito.");
                    resolve(true);
                }
            });
        });
    }
}

module.exports = conexion;