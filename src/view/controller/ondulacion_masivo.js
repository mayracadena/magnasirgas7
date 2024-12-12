// Función principal para calcular la ondulación geoidal


function calcularOndulacionGeoidal(latitud, longitud) {
    return new Promise((resolve, reject) => {
        cargarGrillaGeoidal()
            .then(datosGrilla => {
                // Validar si las coordenadas están dentro del rango permitido
                if (latitud < datosGrilla.minLatitud || latitud > datosGrilla.maxLatitud) {
                    return reject("Latitud fuera del rango permitido.");
                }
                if (longitud < datosGrilla.minLongitud || longitud > datosGrilla.maxLongitud) {
                    return reject("Longitud fuera del rango permitido.");
                }

                // Calcular los índices de la grilla
                const i = Math.floor((datosGrilla.maxLatitud - latitud) / datosGrilla.incrementoLat);
                const j = Math.floor((longitud - datosGrilla.minLongitud) / datosGrilla.incrementoLon);

                // Obtener las esquinas de la celda en la grilla
                const norteOeste = datosGrilla.data[i][j];
                const norteEste = datosGrilla.data[i][j + 1];
                const surOeste = datosGrilla.data[i + 1][j];
                const surEste = datosGrilla.data[i + 1][j + 1];

                // Coordenadas de la celda
                const latNorte = datosGrilla.maxLatitud - i * datosGrilla.incrementoLat;
                const latSur = latNorte - datosGrilla.incrementoLat;
                const lonOeste = datosGrilla.minLongitud + j * datosGrilla.incrementoLon;
                const lonEste = lonOeste + datosGrilla.incrementoLon;

                // Calcular la ondulación con interpolación bilineal
                const ondulacion = interpolacionBilineal(
                    latitud, longitud,
                    latNorte, latSur, lonOeste, lonEste,
                    norteOeste, norteEste, surOeste, surEste
                );

                resolve(ondulacion);
            })
            .catch(err => {
                reject(`Error al cargar la grilla geoidal: ${err}`);
            });
    });
}

// Función para cargar la grilla geoidal desde un archivo
function cargarGrillaGeoidal() {
    return new Promise((resolve, reject) => {
        fetch('grids/Geocol2004.txt') // Ruta al archivo de grilla geoidal
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al cargar el archivo: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                const lineas = data.split('\n').filter(linea => linea.trim() !== '');
                if (lineas.length < 2) {
                    throw new Error("El archivo de grilla no contiene datos suficientes.");
                }

                // Leer cabecera de la grilla
                const cabecera = lineas[0].split(" ").filter(val => val.trim() !== '').map(parseFloat);
                const minLatitud = cabecera[0];
                const maxLatitud = cabecera[1];
                const minLongitud = cabecera[2];
                const maxLongitud = cabecera[3];
                const incrementoLat = cabecera[4];
                const incrementoLon = cabecera[5];

                // Leer datos de la grilla
                const data = lineas.slice(1).map(linea =>
                    linea.split(" ").filter(val => val.trim() !== '').map(parseFloat)
                );

                resolve({
                    minLatitud,
                    maxLatitud,
                    minLongitud,
                    maxLongitud,
                    incrementoLat,
                    incrementoLon,
                    data
                });
            })
            .catch(err => {
                reject(err);
            });
    });
}

// Función para realizar interpolación bilineal
function interpolacionBilineal(
    lat, lon, latNorte, latSur, lonOeste, lonEste,
    norteOeste, norteEste, surOeste, surEste
) {
    const deltaLat = latNorte - lat;
    const deltaLon = lon - lonOeste;

    const t = deltaLat / (latNorte - latSur);
    const u = deltaLon / (lonEste - lonOeste);

    // Fórmula de interpolación bilineal
    return (
        (1 - t) * (1 - u) * surOeste +
        (1 - t) * u * surEste +
        t * (1 - u) * norteOeste +
        t * u * norteEste
    );
}

// Función para procesar el archivo cargado y calcular las ondulaciones
function procesarArchivo(datos) {
    const resultados = [];

    datos.forEach(row => {
        const id = row[0];
        const latitud = parseFloat(row[1]);
        const longitud = parseFloat(row[2]);

        calcularOndulacionGeoidal(latitud, longitud)
            .then(ondulacion => {
                resultados.push({ id, latitud, longitud, ondulacion: ondulacion.toFixed(3) });

                if (resultados.length === datos.length) {
                    generarArchivoCSV(resultados);
                }
            })
            .catch(err => console.error(`Error al calcular ondulación para ID ${id}:`, err));
    });
}

// Función para generar un archivo CSV con los resultados
function generarArchivoCSV(resultados) {
    const contenidoCSV = 'ID,Latitud,Longitud,Ondulación\n' +
        resultados.map(row => `${row.id},${row.latitud},${row.longitud},${row.ondulacion}`).join('\n');

    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resultados_ondulacion.csv';
    link.click();
}

document.getElementById('calcular').addEventListener('click', function () {
    const rows = [...document.querySelectorAll('#tabla-datos tbody tr')].map(row => {
        return [...row.querySelectorAll('td')].map(cell => cell.textContent.trim());
    });

    procesarArchivo(rows);
});