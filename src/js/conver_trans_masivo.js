document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('calcular').addEventListener('click', calcularCambioEpocaMasivo);
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

    async function calcularCambioEpocaMasivo() {
        console.log("Iniciando cálculo masivo de cambio de época...");
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

        const fechaInicio = new Date(document.getElementById('fecha-inicio').value);
        const fechaDestino = new Date(document.getElementById('fecha-destino').value);
        console.log("Fecha inicio:", fechaInicio, "Fecha destino:", fechaDestino);

        if (isNaN(fechaInicio) || isNaN(fechaDestino)) {
            alert("Verifique que las fechas sean válidas.");
            return;
        }

        const resultados = [];
        let procesados = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');
            const id = cells[0].textContent.trim();
            console.log(`Procesando fila #${i+1}, ID: ${id}`);

            const coords = convertirCoordenadas(tipoCoordenada, cells);
            const {lat, lon} = coords; 
            console.log(`Coordenadas convertidas para ID ${id}: lat=${lat}, lon=${lon}`);

            if (isNaN(lat) || isNaN(lon)) {
                console.error(`Coordenadas inválidas en la fila ${i+1}, ID:${id}`);
                procesados++;
                if (procesados === rows.length) {
                    console.log("Todos los puntos procesados. Generando archivo CSV...");
                    generarArchivoCSV(resultados, fechaDestino);
                }
                continue;
            }

            try {
                console.log(`Llamando a realizarCambioDeEpocaPorModelos para ID ${id}`);
                const resultadoFinal = await realizarCambioDeEpocaPorModelos(fechaInicio, fechaDestino, lat, lon);
                console.log(`Resultado para ID ${id}:`, resultadoFinal);

                if (resultadoFinal) {
                    resultados.push({
                        id,
                        lat,
                        lon,
                        finalX: resultadoFinal.coordX.toFixed(4),
                        finalY: resultadoFinal.coordY.toFixed(4),
                        finalZ: resultadoFinal.coordZ.toFixed(4),
                    });
                } else {
                    console.warn(`No se pudo calcular el cambio de época para ID ${id}`);
                }
            } catch (error) {
                console.error(`Error en ID ${id}:`, error);
            } finally {
                procesados++;
                console.log(`Procesados: ${procesados}/${rows.length}`);
                if (procesados === rows.length) {
                    console.log("Todos los puntos procesados. Generando archivo CSV...");
                    generarArchivoCSV(resultados, fechaDestino);
                }
            }
        }
    }

    function limpiarTabla() {
        console.log("Limpiando tabla y reseteando formulario...");
        document.querySelector('#tabla-datos thead').innerHTML = '';
        document.querySelector('#tabla-datos tbody').innerHTML = '';
        document.getElementById('cargar-archivo').value = '';
        document.getElementById('tipo-coordenada').value = '';
        document.getElementById('fecha-inicio').value = '';
        document.getElementById('fecha-destino').value = '';
    }

    function generarArchivoCSV(resultados, fechaDestino) {
        console.log("Generando archivo CSV con resultados:", resultados);
        const encabezado = 'ID,Latitud,Longitud,FinalX,FinalY,FinalZ,FechaDestino';
        const lineas = resultados.map(r => `${r.id},${r.lat},${r.lon},${r.finalX},${r.finalY},${r.finalZ},${fechaDestino.toLocaleDateString()}`);
        const contenidoCSV = encabezado + '\n' + lineas.join('\n');

        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'resultados_cambio_epoca.csv';
        link.click();
        console.log("CSV descargado con éxito.");
    }

    // ======================================
    // LÓGICA DE CAMBIO DE ÉPOCA (ADAPTADA) CON LOGS
    // ======================================

    const a = 6378137.0; 
    const f = 1 / 298.257223563;

    const modelosVelocidad = [
        { nombre: "VEMOS 2022", inicio: new Date("2017-02-01"), fin: null, archivo: "grids/Velogrid2022.txt" },
        { nombre: "VEMOS 2017", inicio: new Date("2014-01-01"), fin: new Date("2017-01-28"), archivo: "grids/Velogrid2017.txt" },
        { nombre: "VEMOS 2015", inicio: new Date("2010-03-14"), fin: new Date("2015-04-11"), archivo: "grids/Velogrid2015.txt" },
        { nombre: "VEMOS 2009", inicio: new Date("2000-01-02"), fin: new Date("2009-06-30"), archivo: "grids/Velogrid2010.txt" },
        { nombre: "VEMOS 2003", inicio: null, fin: new Date("1999-12-31"), archivo: "grids/Velogrid2003.txt" }
    ];

    function elipsoidalToCartesian(lat, lon, h = 0) {
        const e2 = 2 * f - f ** 2;
        const phi = (Math.PI / 180) * lat;
        const lambda = (Math.PI / 180) * lon;
        const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
        const X = (N + h) * Math.cos(phi) * Math.cos(lambda);
        const Y = (N + h) * Math.cos(phi) * Math.sin(lambda);
        const Z = ((1 - e2) * N + h) * Math.sin(phi);
        return { X, Y, Z };
    }

    function idwInterpolate(matrix, index) {
        let numerator = 0;
        let denominator = 0;
        for (const row of matrix) {
            const distance = row[2];
            if (distance === 0) return row[index];
            const weight = 1 / distance;
            numerator += row[index] * weight;
            denominator += weight;
        }
        return numerator / denominator;
    }

    async function calculateVelocitiesNSWE(lat, lon, archivo) {
        console.log(`calculateVelocitiesNSWE() - Cargando archivo: ${archivo}, Lat: ${lat}, Lon: ${lon}`);
        const response = await fetch(archivo);
        if (!response.ok) {
            console.error("No se pudo cargar el archivo de grilla:", archivo);
            throw new Error("No se pudo cargar el archivo de grilla.");
        }
        const textData = await response.text();
        const lines = textData.trim().split('\n');
        console.log(`Archivo ${archivo} cargado con ${lines.length} líneas.`);

        const position = elipsoidalToCartesian(lat, lon, 0);
        const matrix = [];
        lines.forEach((line, idx) => {
            const [fileLat, fileLon, velocityNS, velocityWE] = line.split(';').map(parseFloat);
            if (isNaN(fileLat) || isNaN(fileLon) || isNaN(velocityNS) || isNaN(velocityWE)) {
                console.warn(`Línea ${idx+1} del archivo ${archivo}: datos inválidos`, line);
                return;
            }
            const gridCoords = elipsoidalToCartesian(fileLat, fileLon, 0);
            const distance = Math.sqrt((gridCoords.X - position.X) ** 2 + (gridCoords.Y - position.Y) ** 2);
            matrix.push([velocityNS, velocityWE, distance]);
        });

        console.log("Matriz creada para IDW:", matrix.length, "puntos.");
        const velocityNS = idwInterpolate(matrix, 0);
        const velocityWE = idwInterpolate(matrix, 1);
        console.log(`Velocidades IDW obtenidas: NS=${velocityNS.toFixed(4)}, WE=${velocityWE.toFixed(4)}`);
        return { velocityNS, velocityWE };
    }

    function convertVelocitiesToXYZ(velNS, velWE, lat, lon) {
        console.log(`convertVelocitiesToXYZ() - velNS:${velNS}, velWE:${velWE}, lat:${lat}, lon:${lon}`);
        const phi = (Math.PI / 180) * lat;
        const lambda = (Math.PI / 180) * lon;
        const velX = -velNS * Math.sin(phi) * Math.cos(lambda) - velWE * Math.sin(lambda);
        const velY = -velNS * Math.sin(phi) * Math.sin(lambda) + velWE * Math.cos(lambda);
        const velZ = velNS * Math.cos(phi);
        console.log(`Velocidades en XYZ: X:${velX.toFixed(6)}, Y:${velY.toFixed(6)}, Z:${velZ.toFixed(6)}`);
        return { velX, velY, velZ };
    }

    function obtenerModelosAplicables(fechaInicio, fechaDestino) {
        console.log("obtenerModelosAplicables() - Fecha inicio:", fechaInicio, "Fecha destino:", fechaDestino);
        const goingBackwards = fechaInicio > fechaDestino;
        const minDate = new Date(-8640000000000000);
        const maxDate = new Date(8640000000000000);

        const fechaInicioReal = goingBackwards ? fechaInicio : fechaDestino;
        const fechaDestinoReal = goingBackwards ? fechaDestino : fechaInicio;

        const modelosAplicables = modelosVelocidad.filter(modelo => {
            const start = modelo.inicio || minDate;
            const end = modelo.fin || maxDate;
            return start <= fechaInicioReal && end >= fechaDestinoReal;
        });

        modelosAplicables.sort((a, b) => {
            const startA = a.inicio || minDate;
            const startB = b.inicio || minDate;
            if (goingBackwards) {
                return startB - startA;
            } else {
                return startA - startB;
            }
        });

        console.log("Modelos aplicables encontrados:", modelosAplicables.map(m => m.nombre));
        return modelosAplicables;
    }

    function calcularCambioDeEpoca(x, y, z, velX, velY, velZ, deltaTiempo) {
        console.log(`calcularCambioDeEpoca() - x:${x}, y:${y}, z:${z}, velX:${velX}, velY:${velY}, velZ:${velZ}, deltaTiempo:${deltaTiempo}`);
        const nuevaX = x + (deltaTiempo * velX);
        const nuevaY = y + (deltaTiempo * velY);
        const nuevaZ = z + (deltaTiempo * velZ);
        console.log(`Nuevas coordenadas: X:${nuevaX.toFixed(4)}, Y:${nuevaY.toFixed(4)}, Z:${nuevaZ.toFixed(4)}`);
        return { nuevaX, nuevaY, nuevaZ };
    }

    async function realizarCambioDeEpocaPorModelos(fechaInicio, fechaDestino, lat, lon) {
        console.log("realizarCambioDeEpocaPorModelos() - Inicio:", fechaInicio, "Destino:", fechaDestino, "lat:", lat, "lon:", lon);
        const { X: xInicial, Y: yInicial, Z: zInicial } = elipsoidalToCartesian(lat, lon, 0);
        let coordX = xInicial, coordY = yInicial, coordZ = zInicial;
        console.log(`Posición inicial: X=${coordX.toFixed(4)}, Y=${coordY.toFixed(4)}, Z=${coordZ.toFixed(4)}`);

        const modelos = obtenerModelosAplicables(fechaInicio, fechaDestino);
        if (modelos.length === 0) {
            console.warn("No se encontraron modelos de velocidad aplicables.");
            return null;
        }

        const goingBackwards = fechaInicio > fechaDestino;
        let fechaActual = new Date(fechaInicio.getTime());
        const minDate = new Date(-8640000000000000);
        const maxDate = new Date(8640000000000000);

        const startTotal = goingBackwards ? fechaDestino : fechaInicio;
        const endTotal = goingBackwards ? fechaInicio : fechaDestino;

        for (const modelo of modelos) {
            console.log(`Procesando modelo: ${modelo.nombre}`);
            const modeloInicio = modelo.inicio || minDate;
            const modeloFin = modelo.fin || maxDate;

            const intersectStart = (modeloInicio > startTotal) ? modeloInicio : startTotal;
            const intersectEnd = (modeloFin < endTotal) ? modeloFin : endTotal;
            console.log(`Intersección de tiempo con el modelo ${modelo.nombre}: inicio=${intersectStart.toLocaleDateString()}, fin=${intersectEnd.toLocaleDateString()}`);

            if (intersectStart > intersectEnd) {
                console.log("Sin intersección real con este modelo.");
                continue;
            }

            if (goingBackwards) {
                let fechaCorte = intersectStart;
                if (fechaCorte < fechaDestino) fechaCorte = fechaDestino;
                if (fechaCorte < intersectStart) fechaCorte = intersectStart;

                if (fechaCorte < fechaActual) {
                    const deltaTiempoMs = fechaCorte - fechaActual;
                    const deltaTiempo = deltaTiempoMs / (1000 * 60 * 60 * 24 * 365.25);
                    console.log(`Hacia atrás - fechaActual:${fechaActual.toLocaleDateString()}, fechaCorte:${fechaCorte.toLocaleDateString()}, deltaTiempo:${deltaTiempo.toFixed(4)}`);

                    const velocities = await calculateVelocitiesNSWE(lat, lon, modelo.archivo);
                    const { velX, velY, velZ } = convertVelocitiesToXYZ(velocities.velocityNS, velocities.velocityWE, lat, lon);
                    const nuevaPosicion = calcularCambioDeEpoca(coordX, coordY, coordZ, velX, velY, velZ, deltaTiempo);
                    coordX = nuevaPosicion.nuevaX;
                    coordY = nuevaPosicion.nuevaY;
                    coordZ = nuevaPosicion.nuevaZ;

                    fechaActual = new Date(fechaCorte.getTime());
                    if (fechaActual <= fechaDestino) {
                        console.log("Se alcanzó la fecha destino.");
                        break;
                    }
                } else {
                    console.log("No hay rango hacia atrás para este modelo.");
                }
            } else {
                let fechaCorte = intersectEnd;
                if (fechaCorte > fechaDestino) fechaCorte = fechaDestino;

                if (fechaCorte > fechaActual) {
                    const deltaTiempoMs = fechaCorte - fechaActual;
                    const deltaTiempo = deltaTiempoMs / (1000 * 60 * 60 * 24 * 365.25);
                    console.log(`Hacia adelante - fechaActual:${fechaActual.toLocaleDateString()}, fechaCorte:${fechaCorte.toLocaleDateString()}, deltaTiempo:${deltaTiempo.toFixed(4)}`);

                    const velocities = await calculateVelocitiesNSWE(lat, lon, modelo.archivo);
                    const { velX, velY, velZ } = convertVelocitiesToXYZ(velocities.velocityNS, velocities.velocityWE, lat, lon);
                    const nuevaPosicion = calcularCambioDeEpoca(coordX, coordY, coordZ, velX, velY, velZ, deltaTiempo);
                    coordX = nuevaPosicion.nuevaX;
                    coordY = nuevaPosicion.nuevaY;
                    coordZ = nuevaPosicion.nuevaZ;

                    fechaActual = new Date(fechaCorte.getTime());
                    if (fechaActual >= fechaDestino) {
                        console.log("Se alcanzó la fecha destino.");
                        break;
                    }
                } else {
                    console.log("No hay rango hacia adelante para este modelo.");
                }
            }
        }

        console.log(`Posición final: X=${coordX.toFixed(4)}, Y=${coordY.toFixed(4)}, Z=${coordZ.toFixed(4)}`);
        return { coordX, coordY, coordZ };
    }

    function convertirCoordenadas(tipo, cells) {
        console.log("convertirCoordenadas() - Tipo:", tipo);
        let lat = null, lon = null;
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
                // Aquí implementar la conversión real a lat/lon
                // Por ahora, 0,0
                lat = 0;
                lon = 0;
                console.warn(`No implementada la conversión para ${tipo}. Usando (0,0).`);
                break;
            case 'geocentrica':
                const x = parseFloat(cells[1].textContent.trim());
                const y = parseFloat(cells[2].textContent.trim());
                const z = parseFloat(cells[3].textContent.trim());
                console.log(`Geocéntricas detectadas: X:${x}, Y:${y}, Z:${z}`);
                const ellipsoidal = geocentricToEllipsoidal(x,y,z);
                lat = ellipsoidal.latitude;
                lon = ellipsoidal.longitude;
                break;
        }
        return {lat, lon};
    }

    function geocentricToEllipsoidal(x, y, z) {
        console.log("geocentricToEllipsoidal() - X:", x, "Y:", y, "Z:", z);
        const e2 = 2*f - f**2;
        const p = Math.sqrt(x*x + y*y);
        const theta = Math.atan2(z*a, p*(1-f));
        const lon = Math.atan2(y, x);
        const lat = Math.atan2(z + e2*(1-f)*Math.sin(theta)**3, p - e2*a*Math.cos(theta)**3);
        const N = a / Math.sqrt(1 - e2*Math.sin(lat)**2);
        const h = p/Math.cos(lat)-N;

        const latDeg = lat*(180/Math.PI);
        const lonDeg = lon*(180/Math.PI);
        console.log(`Convertido a elipsoidales: Lat:${latDeg.toFixed(6)}, Lon:${lonDeg.toFixed(6)}, h:${h.toFixed(3)}`);
        return {
            latitude: latDeg,
            longitude: lonDeg,
            height: h
        };
    }

});
