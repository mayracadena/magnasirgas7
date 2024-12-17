document.addEventListener('DOMContentLoaded', () => {
    // Configuración de eventos
    document.getElementById('calcular').addEventListener('click', calcularVelocidadesMasivas);
    document.getElementById('limpiar').addEventListener('click', limpiarTabla);
    document.getElementById('tipo-coordenada').addEventListener('change', generarCabeceras);
    document.getElementById('cargar-archivo').addEventListener('change', cargarArchivo);

    function generarCabeceras() {
        const tipo = document.getElementById('tipo-coordenada').value;
        console.log("generarCabeceras() - Tipo de coordenada seleccionado:", tipo);
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

    function cargarArchivo(event) {
        const tipoCoordenada = document.getElementById('tipo-coordenada').value;
        console.log("cargarArchivo() - Tipo de coordenada actual:", tipoCoordenada);

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
                tableBody.innerHTML = '';

                const dataLines = lines.slice(1);
                console.log("Líneas de datos (sin encabezado):", dataLines);

                const columnsCount = document.querySelectorAll('#tabla-datos thead th').length;
                console.log("Cantidad de columnas esperadas según tipo:", columnsCount);

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

    async function calcularVelocidadesMasivas() {
        console.log("Iniciando cálculo masivo de velocidades...");
        const rows = document.querySelectorAll('#tabla-datos tbody tr');
        console.log("Filas a procesar:", rows.length);

        if (rows.length === 0) {
            alert('No hay datos cargados para procesar.');
            return;
        }

        const tipoCoordenada = document.getElementById('tipo-coordenada').value;
        console.log("Tipo de coordenada para el cálculo:", tipoCoordenada);

        if (!tipoCoordenada) {
            alert("Por favor seleccione un tipo de coordenada.");
            return;
        }

        const modeloSelect = document.getElementById("modelo-velocidades"); // <-- Cambio
        const modelo = modeloSelect.value; // Por ejemplo "Velogrid2022.txt" // <-- Cambio

        const resultados = [];
        let procesados = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');

            const id = cells[0].textContent.trim();
            console.log(`Procesando fila #${i+1}, ID:${id}`);

            const coords = convertirCoordenadas(tipoCoordenada, cells);
            const {lat, lon, x, y, z} = coords;
            console.log(`Coordenadas convertidas para ID ${id}: lat=${lat}, lon=${lon}, x=${x}, y=${y}, z=${z}`);

            try {
                console.log(`Llamando a getVelocitiesFromFile() para ID ${id}`);
                const velocities = await getVelocitiesFromFile(lat, lon);
                console.log(`Velocidades obtenidas para ID ${id}:`, velocities);

                if (velocities) {
                    resultados.push({
                        id,
                        lat,
                        lon,
                        velocitySN: velocities.velocitySN.toFixed(4),
                        velocityWE: velocities.velocityWE.toFixed(4),
                        velocityX: velocities.velocityX.toFixed(4),
                        velocityY: velocities.velocityY.toFixed(4),
                        velocityZ: velocities.velocityZ.toFixed(4),
                        modelo: modelo // <-- Agregar el modelo al resultado
                    });
                } else {
                    console.error(`No se pudo calcular velocidades para ID ${id}.`);
                }
            } catch (error) {
                console.error(`Error en ID ${id}:`, error);
            } finally {
                procesados++;
                console.log(`Procesados: ${procesados}/${rows.length}`);
                if (procesados === rows.length) {
                    console.log("Todos los puntos procesados. Generando archivo CSV...");
                    generarArchivoCSV(resultados);
                }
            }
        }
    }

    function limpiarTabla() {
        console.log("Limpiando tabla...");
        document.querySelector('#tabla-datos thead').innerHTML = '';
        document.querySelector('#tabla-datos tbody').innerHTML = '';
        document.getElementById('cargar-archivo').value = '';
        document.getElementById('tipo-coordenada').value = '';
    }

    function generarArchivoCSV(resultados) {
        console.log("Generando archivo CSV con resultados:", resultados);
        // Agregamos la columna "Modelo"
        const encabezado = 'ID,Latitud,Longitud,VelocidadSN,VelocidadWE,VelocidadX,VelocidadY,VelocidadZ,Modelo'; // <-- Cambio
        const lineas = resultados.map(r =>
            `${r.id},${r.lat},${r.lon},${r.velocitySN},${r.velocityWE},${r.velocityX},${r.velocityY},${r.velocityZ},${r.modelo}` // <-- Cambio
        );
        const contenidoCSV = encabezado + '\n' + lineas.join('\n');

        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'resultados_velocidades.csv';
        link.click();
    }

    function getFilePathByModel() {
        const modelSelect = document.getElementById("modelo-velocidades");
        const filePath = `grids/${modelSelect.value}`;
        console.log("Modelo de velocidades seleccionado:", modelSelect.value, "Ruta:", filePath);
        return filePath;
    }

    async function getVelocitiesFromFile(lat, lon) {
        console.log("getVelocitiesFromFile() - lat:", lat, "lon:", lon);
        const filePath = getFilePathByModel();
        const response = await fetch(filePath);
        if (!response.ok) throw new Error("No se pudo cargar el archivo de grilla.");

        const textData = await response.text();
        const lines = textData.trim().split('\n');
        console.log("Total de líneas en el archivo de velocidades:", lines.length);

        const reader = new VelocitiesReader(lines);
        const matrix = reader.getMatrix(lat, lon);
        console.log("Matriz obtenida:", matrix);

        const velocities = await calculateVelocities(matrix, lat, lon);
        return velocities;
    }

    class EllipsoidalCoordinate {
        constructor(latitude, longitude, ellipsoidalHeight = 0) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.ellipsoidalHeight = ellipsoidalHeight;
        }
    }

    class Velocities {
        constructor() {
            this.velocitySN = 0;
            this.velocityWE = 0;
            this.velocityX = 0;
            this.velocityY = 0;
            this.velocityZ = 0;
        }

        setVelocitySN(v) { this.velocitySN = v; }
        setVelocityWE(v) { this.velocityWE = v; }
        setVelocityX(v) { this.velocityX = v; }
        setVelocityY(v) { this.velocityY = v; }
        setVelocityZ(v) { this.velocityZ = v; }
    }

    class VelocitiesReader {
        constructor(lines) {
            this.lines = lines;
        }

        getMatrix(lat, lon) {
            console.log("VelocitiesReader.getMatrix() - lat:", lat, "lon:", lon);
            const matrix = [];
            const coordinate = new EllipsoidalCoordinate(lat, lon);
            this.lines.forEach((line, idx) => {
                const parts = line.split(';');
                if (parts.length < 4) return;

                const fileLat = parseFloat(parts[0]);
                const fileLon = parseFloat(parts[1]);
                const velocityX = parseFloat(parts[2]);
                const velocityY = parseFloat(parts[3]);

                if (isNaN(fileLat) || isNaN(fileLon) || isNaN(velocityX) || isNaN(velocityY)) {
                    console.warn(`Línea ${idx+1}: valores inválidos`, parts);
                    return;
                }

                const gridCoordinate = new EllipsoidalCoordinate(fileLat, fileLon);
                const [distance] = calculateInverse(coordinate, gridCoordinate);
                if (!isNaN(distance)) {
                    matrix.push([velocityX, velocityY, distance]);
                }
            });
            return matrix;
        }
    }

    async function calculateVelocities(matrix, lat, lon) {
        console.log("calculateVelocities() - Iniciando con lat:", lat, "lon:", lon);
        if (matrix.length === 0) {
            console.warn("calculateVelocities(): matriz vacía");
            return null;
        }

        const velocitySN = idwCalculate(matrix, 0);
        const velocityWE = idwCalculate(matrix, 1);
        console.log("Velocidades IDW - SN:", velocitySN, "WE:", velocityWE);

        if (isNaN(velocitySN) || isNaN(velocityWE)) {
            console.error("Velocidades calculadas no válidas");
            return null;
        }

        const velocities = new Velocities();
        velocities.setVelocitySN(velocitySN);
        velocities.setVelocityWE(velocityWE);

        const coordinate = new EllipsoidalCoordinate(lat, lon, 0);
        const adjustedVelocities = calculateXYZ(velocities, coordinate);
        console.log("Velocidades ajustadas (XYZ):", adjustedVelocities);
        return adjustedVelocities;
    }

    function idwCalculate(matrix, posData) {
        if (matrix[0] && matrix[0][2] === 0.0) {
            return matrix[0][posData];
        }
        let numerator = 0.0;
        let denominator = 0.0;

        for (let i = 0; i < matrix.length; i++) {
            if (matrix[i].length < 3) continue;
            let value = matrix[i][posData] / matrix[i][2];
            numerator += value;
            value = 1.0 / matrix[i][2];
            denominator += value;
        }

        const result = numerator / denominator;
        console.log("IDW result (posData:", posData, "):", result);
        return result;
    }

    function calculateXYZ(vel, coordinate) {
        console.log("calculateXYZ() - Ajustando velocidades a XYZ");
        const cartesianOriginal = cartesian3DConversion(coordinate);

        let sn = vel.velocitySN;
        let we = vel.velocityWE;
        let h = coordinate.ellipsoidalHeight || 0.0;

        const adjustedLongitude = coordinate.longitude + 2.777777777777777E-4;
        const dist = calculateInverse(new EllipsoidalCoordinate(coordinate.latitude, adjustedLongitude, h), coordinate)[0];

        const snAdjusted = sn / (dist * 3600.0);
        const weAdjusted = we / (dist * Math.cos(coordinate.latitude * Math.PI / 180) * 3600);

        const adjustedLatitude = coordinate.latitude + snAdjusted;
        const finalLongitude = coordinate.longitude + weAdjusted;

        const adjustedCoordinate = new EllipsoidalCoordinate(adjustedLatitude, finalLongitude, h);
        const cartesianAdjusted = cartesian3DConversion(adjustedCoordinate);

        const x = Math.abs(cartesianAdjusted.X - cartesianOriginal.X);
        const y = Math.abs(cartesianAdjusted.Y - cartesianOriginal.Y);
        const z = Math.abs(cartesianAdjusted.Z - cartesianOriginal.Z);

        vel.setVelocityX(x);
        vel.setVelocityY(y);
        vel.setVelocityZ(z);

        return vel;
    }

    function calculateInverse(coordinate1, coordinate2) {
        const a = 6378137.0;
        const f = 1 / 298.257223563;
        const b = a * (1 - f);

        const lat1 = coordinate1.latitude * (Math.PI / 180);
        const lon1 = coordinate1.longitude * (Math.PI / 180);
        const lat2 = coordinate2.latitude * (Math.PI / 180);
        const lon2 = coordinate2.longitude * (Math.PI / 180);

        const U1 = Math.atan((1 - f) * Math.tan(lat1));
        const U2 = Math.atan((1 - f) * Math.tan(lat2));
        const L = lon2 - lon1;
        let lambda = L;
        let iterLimit = 100;
        let sinSigma, cosSigma, sigma, sinAlpha, cos2SigmaM, cosSqAlpha;
        let lambdaP, cosLambda, sinLambda;

        do {
            sinLambda = Math.sin(lambda);
            cosLambda = Math.cos(lambda);
            sinSigma = Math.sqrt((Math.cos(U2)*sinLambda)**2+(Math.cos(U1)*Math.sin(U2)-Math.sin(U1)*Math.cos(U2)*cosLambda)**2);
            if (sinSigma === 0) return [0,0,0];
            cosSigma = Math.sin(U1)*Math.sin(U2)+Math.cos(U1)*Math.cos(U2)*cosLambda;
            sigma = Math.atan2(sinSigma, cosSigma);
            sinAlpha = Math.cos(U1)*Math.cos(U2)*sinLambda/sinSigma;
            cosSqAlpha = 1-sinAlpha**2;
            cos2SigmaM = cosSigma - 2*Math.sin(U1)*Math.sin(U2)/cosSqAlpha;
            if (isNaN(cos2SigmaM)) cos2SigmaM=0;
            const C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
            lambdaP = lambda;
            lambda = L+(1-C)*f*sinAlpha*(sigma+C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM**2)));
        } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit>0);

        if (iterLimit===0) return [NaN,0,0];

        const uSq = cosSqAlpha*(a**2-b**2)/b**2;
        const A = 1+uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
        const B = uSq/1024*(256+uSq*(-128+uSq*(74-47*uSq)));
        const deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM**2)-B/6*cos2SigmaM*(-3+4*sinSigma**2)*(-3+4*cos2SigmaM**2)));
        const s = b*A*(sigma-deltaSigma);

        return [s,0,0];
    }

    function cartesian3DConversion(coordinate) {
        const phi = coordinate.latitude * (Math.PI / 180);
        const lambda = coordinate.longitude * (Math.PI / 180);
        const h = coordinate.ellipsoidalHeight || 0.0;

        const a = 6378137.0;
        const f = 1 / 298.257223563;
        const e2 = 2*f - f**2;

        const N = a / Math.sqrt(1 - e2*Math.sin(phi)**2);

        const X = (N+h)*Math.cos(phi)*Math.cos(lambda);
        const Y = (N+h)*Math.cos(phi)*Math.sin(lambda);
        const Z = ((1-e2)*N+h)*Math.sin(phi);

        return { X, Y, Z };
    }

    // Función para convertir según tipo (placeholder)
    function convertirCoordenadas(tipo, cells) {
        console.log("convertirCoordenadas() - Tipo:", tipo);
        let lat = null, lon = null, x = null, y = null, z = null;
        switch (tipo) {
            case 'elipsoidal':
            case 'elipsoidales-grados':
                lat = parseFloat(cells[1].textContent.trim());
                lon = parseFloat(cells[2].textContent.trim());
                break;
            case 'utm':
            case 'gauss-kruger':
            case 'origen-nacional':
            case 'plana-cartesiana':
                // Implementar conversión real aquí
                lat = 0; 
                lon = 0;
                break;
            case 'geocentrica':
                x = parseFloat(cells[1].textContent.trim());
                y = parseFloat(cells[2].textContent.trim());
                z = parseFloat(cells[3].textContent.trim());
                const ellipsoidal = geocentricToEllipsoidal(x,y,z);
                lat = ellipsoidal.latitude;
                lon = ellipsoidal.longitude;
                break;
        }
        return {lat, lon, x, y, z};
    }

    function geocentricToEllipsoidal(x, y, z) {
        const a = 6378137.0;
        const f = 1 / 298.257223563;
        const e2 = 2*f - f**2;

        const p = Math.sqrt(x*x + y*y);
        const theta = Math.atan2(z*a, p*(1-f));
        const lon = Math.atan2(y, x);
        const lat = Math.atan2(z + e2*(1-f)*Math.sin(theta)**3, p - e2*a*Math.cos(theta)**3);
        const N = a / Math.sqrt(1 - e2*Math.sin(lat)**2);
        const h = p/Math.cos(lat)-N;

        return {
            latitude: lat*(180/Math.PI),
            longitude: lon*(180/Math.PI),
            height: h
        };
    }
});

