document.addEventListener('DOMContentLoaded', () => {
    // Configuración de eventos
    document.getElementById('calcular').addEventListener('click', calcularOndulaciones);
    document.getElementById('limpiar').addEventListener('click', limpiarTabla);
    document.getElementById('tipo-coordenada').addEventListener('change', generarCabeceras);
    document.getElementById('cargar-archivo').addEventListener('change', cargarArchivo);

    // Función para generar cabeceras dinámicas según el tipo de coordenada
    function generarCabeceras() {
        const tipo = document.getElementById('tipo-coordenada').value;
        console.log("Tipo de coordenada seleccionado:", tipo);

        const thead = document.querySelector('#tabla-datos thead');
        thead.innerHTML = '';

        let headers = [];
        switch (tipo) {
            case 'elipsoidal':
            case 'elipsoidales-grados':
                headers = ['ID', 'Latitud', 'Longitud'];
                break;
            case 'utm':
                headers = ['ID', 'Este', 'Norte', 'Zona'];
                break;
            case 'geocentrica':
                headers = ['ID', 'X', 'Y', 'Z'];
                break;
            case 'plana-cartesiana':
                headers = ['ID', 'X', 'Y'];
                break;
            case 'gauss-kruger':
                headers = ['ID', 'Este', 'Norte', 'Zona'];
                break;
            case 'origen-nacional':
                headers = ['ID', 'Este', 'Norte'];
                break;
            default:
                headers = ['ID'];
                break;
        }

        console.log("Cabeceras generadas:", headers);

        const tr = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            tr.appendChild(th);
        });
        thead.appendChild(tr);
    }

    // Función para cargar un archivo CSV
    function cargarArchivo(event) {
        const tipoCoordenada = document.getElementById('tipo-coordenada').value;
        console.log("Intentando cargar archivo CSV con tipo de coordenada:", tipoCoordenada);

        if (!tipoCoordenada) {
            alert('Por favor seleccione un tipo de coordenada antes de cargar el archivo.');
            this.value = '';
            return;
        }

        const file = event.target.files[0];
        console.log("Archivo seleccionado:", file);

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const lines = e.target.result.split('\n').map(line => line.trim()).filter(line => line !== '');
                console.log("Líneas leídas del CSV:", lines);

                const tableBody = document.querySelector('#tabla-datos tbody');
                tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar nuevos datos

                const dataLines = lines.slice(1); // Ignorar primera línea (encabezado del CSV)
                console.log("Líneas de datos (sin encabezado):", dataLines);

                const columnsCount = document.querySelectorAll('#tabla-datos thead th').length;
                console.log("Cantidad de columnas esperadas:", columnsCount);

                dataLines.forEach((line, index) => {
                    const columns = line.split(',').map(col => col.trim());
                    console.log(`Procesando línea ${index + 2}:`, columns);

                    if (columns.length === columnsCount) {
                        const tr = document.createElement('tr');
                        columns.forEach(col => {
                            const td = document.createElement('td');
                            td.textContent = col;
                            tr.appendChild(td);
                        });
                        tableBody.appendChild(tr);
                    } else {
                        console.warn(`La línea ${index + 2} no coincide con el número de columnas esperado.`);
                    }
                });

                console.log("Datos cargados en la tabla.");
            };
            reader.readAsText(file);
        } else {
            console.warn("No se seleccionó ningún archivo.");
        }
    }

    // Función para calcular ondulaciones
    function calcularOndulaciones() {
        const rows = document.querySelectorAll('#tabla-datos tbody tr');
        console.log("Iniciando cálculo de ondulaciones. Filas a procesar:", rows.length);

        if (rows.length === 0) {
            alert('No hay datos cargados para procesar.');
            return;
        }

        const resultados = [];
        let procesados = 0;

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            const id = cells[0].textContent.trim();
            const lat = parseFloat(cells[1].textContent.trim());
            const lon = parseFloat(cells[2].textContent.trim());

            console.log(`Fila ${rowIndex + 1} - ID:${id}, Latitud:${lat}, Longitud:${lon}`);

            if (!isNaN(lat) && !isNaN(lon)) {
                calcularOndulacionGeoidal(lat, lon)
                    .then(ondulacion => {
                        console.log(`Ondulación calculada para ID ${id}: ${ondulacion}`);
                        resultados.push({ id, lat, lon, ondulacion: ondulacion.toFixed(3) });
                        procesados++;
                        if (procesados === rows.length) {
                            console.log("Cálculos completados. Generando CSV...");
                            generarArchivoCSV(resultados);
                        }
                    })
                    .catch(err => {
                        console.error(`Error al calcular ondulación para ID ${id}:`, err);
                        procesados++;
                        if (procesados === rows.length) {
                            generarArchivoCSV(resultados);
                        }
                    });
            } else {
                console.warn(`Datos inválidos en la fila ${rowIndex + 1}. Lat o Lon no numéricas.`);
                procesados++;
                if (procesados === rows.length) {
                    generarArchivoCSV(resultados);
                }
            }
        });
    }

    // Función para limpiar la tabla
    function limpiarTabla() {
        console.log("Limpiando tabla...");
        document.querySelector('#tabla-datos thead').innerHTML = '';
        document.querySelector('#tabla-datos tbody').innerHTML = '';
        document.getElementById('cargar-archivo').value = '';
        document.getElementById('tipo-coordenada').value = '';
    }

    // Función principal para calcular la ondulación geoidal
    function calcularOndulacionGeoidal(latitud, longitud) {
        console.log(`Calculando ondulación para lat:${latitud}, lon:${longitud}`);
        return new Promise((resolve, reject) => {
            cargarGrillaGeoidal()
                .then(datosGrilla => {
                    if (latitud < datosGrilla.minLatitud || latitud > datosGrilla.maxLatitud) {
                        return reject("Latitud fuera del rango permitido.");
                    }
                    if (longitud < datosGrilla.minLongitud || longitud > datosGrilla.maxLongitud) {
                        return reject("Longitud fuera del rango permitido.");
                    }

                    const i = Math.floor((datosGrilla.maxLatitud - latitud) / datosGrilla.incrementoLat);
                    const j = Math.floor((longitud - datosGrilla.minLongitud) / datosGrilla.incrementoLon);

                    const norteOeste = datosGrilla.data[i][j];
                    const norteEste = datosGrilla.data[i][j + 1];
                    const surOeste = datosGrilla.data[i + 1][j];
                    const surEste = datosGrilla.data[i + 1][j + 1];

                    const latNorte = datosGrilla.maxLatitud - i * datosGrilla.incrementoLat;
                    const latSur = latNorte - datosGrilla.incrementoLat;
                    const lonOeste = datosGrilla.minLongitud + j * datosGrilla.incrementoLon;
                    const lonEste = lonOeste + datosGrilla.incrementoLon;

                    console.log("Puntos para interpolación bilineal:", {
                        latNorte, latSur, lonOeste, lonEste,
                        norteOeste, norteEste, surOeste, surEste
                    });

                    const ondulacion = interpolacionBilineal(
                        latitud, longitud,
                        latNorte, latSur, lonOeste, lonEste,
                        norteOeste, norteEste, surOeste, surEste
                    );

                    resolve(ondulacion);
                })
                .catch(err => {
                    console.error("Error al cargar la grilla geoidal:", err);
                    reject(`Error al cargar la grilla geoidal: ${err}`);
                });
        });
    }

    // Función para cargar la grilla geoidal
    function cargarGrillaGeoidal() {
        console.log("Cargando grilla geoidal...");
        return new Promise((resolve, reject) => {
            fetch('grids/Geocol2004.txt')
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

                    const cabecera = lineas[0].split(" ").filter(val => val.trim() !== '').map(parseFloat);
                    const minLatitud = cabecera[0];
                    const maxLatitud = cabecera[1];
                    const minLongitud = cabecera[2];
                    const maxLongitud = cabecera[3];
                    const incrementoLat = cabecera[4];
                    const incrementoLon = cabecera[5];

                    const dataGrilla = lineas.slice(1).map(linea =>
                        linea.split(" ").filter(val => val.trim() !== '').map(parseFloat)
                    );

                    console.log("Grilla geoidal cargada con éxito:", {
                        minLatitud,
                        maxLatitud,
                        minLongitud,
                        maxLongitud,
                        incrementoLat,
                        incrementoLon,
                        dataGrilla: dataGrilla.length
                    });

                    resolve({
                        minLatitud,
                        maxLatitud,
                        minLongitud,
                        maxLongitud,
                        incrementoLat,
                        incrementoLon,
                        data: dataGrilla
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    // Interpolación bilineal
    function interpolacionBilineal(
        lat, lon, latNorte, latSur, lonOeste, lonEste,
        norteOeste, norteEste, surOeste, surEste
    ) {
        console.log("Interpolando con bilineal:");
        const deltaLat = latNorte - lat;
        const deltaLon = lon - lonOeste;

        const t = deltaLat / (latNorte - latSur);
        const u = deltaLon / (lonEste - lonOeste);

        const resultado = (
            (1 - t) * (1 - u) * surOeste +
            (1 - t) * u * surEste +
            t * (1 - u) * norteOeste +
            t * u * norteEste
        );

        console.log("Resultado de interpolación:", resultado);
        return resultado;
    }

    // Generar CSV de resultados
    function generarArchivoCSV(resultados) {
        console.log("Generando archivo CSV con resultados:", resultados);
        const contenidoCSV = 'ID,Latitud,Longitud,Ondulación\n' +
            resultados.map(row => `${row.id},${row.lat},${row.lon},${row.ondulacion}`).join('\n');

        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'resultados_ondulacion.csv';
        link.click();
    }
});
