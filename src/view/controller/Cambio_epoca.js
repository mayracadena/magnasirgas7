// CONSTANTES Y CONFIGURACIÓN DE MODELOS
const a = 6378137.0; 
const f = 1 / 298.257223563;

const modelosVelocidad = [
    { nombre: "VEMOS 2022", inicio: new Date("2017-02-01"), fin: null, archivo: "grids/Velogrid2022.txt" },
    { nombre: "VEMOS 2017", inicio: new Date("2014-01-01"), fin: new Date("2017-01-28"), archivo: "grids/Velogrid2017.txt" },
    { nombre: "VEMOS 2015", inicio: new Date("2010-03-14"), fin: new Date("2015-04-11"), archivo: "grids/Velogrid2015.txt" },
    { nombre: "VEMOS 2009", inicio: new Date("2000-01-02"), fin: new Date("2009-06-30"), archivo: "grids/Velogrid2010.txt" },
    { nombre: "VEMOS 2003", inicio: null, fin: new Date("1999-12-31"), archivo: "grids/Velogrid2003.txt" }
];

// FUNCIONES DE CONVERSIÓN
function elipsoidalToCartesian(lat, lon, h = 0) {
    // Mantener logs en funciones críticas, pero no saturar con datos innecesarios
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
    // Removemos console.log del proceso de carga y cálculo de la matriz
    const response = await fetch(archivo);
    if (!response.ok) throw new Error("No se pudo cargar el archivo de grilla.");
    const textData = await response.text();
    const lines = textData.trim().split('\n');

    const position = elipsoidalToCartesian(lat, lon, 0);
    const matrix = [];
    for (const line of lines) {
        const [fileLat, fileLon, velocityNS, velocityWE] = line.split(';').map(parseFloat);
        const gridCoords = elipsoidalToCartesian(fileLat, fileLon, 0);
        const distance = Math.sqrt((gridCoords.X - position.X) ** 2 + (gridCoords.Y - position.Y) ** 2);
        matrix.push([velocityNS, velocityWE, distance]);
    }

    const velocityNS = idwInterpolate(matrix, 0);
    const velocityWE = idwInterpolate(matrix, 1);
    return { velocityNS, velocityWE };
}

function convertVelocitiesToXYZ(velNS, velWE, lat, lon) {
    const phi = (Math.PI / 180) * lat;
    const lambda = (Math.PI / 180) * lon;
    const velX = -velNS * Math.sin(phi) * Math.cos(lambda) - velWE * Math.sin(lambda);
    const velY = -velNS * Math.sin(phi) * Math.sin(lambda) + velWE * Math.cos(lambda);
    const velZ = velNS * Math.cos(phi);
    return { velX, velY, velZ };
}

function obtenerModelosAplicables(fechaInicio, fechaDestino) {
    const goingBackwards = fechaInicio > fechaDestino;

    const minDate = new Date(-8640000000000000);
    const maxDate = new Date(8640000000000000);

    const fechaInicioReal = goingBackwards ? fechaInicio : fechaDestino;
    const fechaDestinoReal = goingBackwards ? fechaDestino : fechaInicio;

    const modelosAplicables = modelosVelocidad.filter(modelo => {
        const start = modelo.inicio || minDate;
        const end = modelo.fin || maxDate;
        // El modelo aplica si su rango se superpone con [fechaDestinoReal, fechaInicioReal]
        return start <= fechaInicioReal && end >= fechaDestinoReal;
    });

    // Ordenar según la dirección
    modelosAplicables.sort((a, b) => {
        const startA = a.inicio || minDate;
        const startB = b.inicio || minDate;
        if (goingBackwards) {
            return startB - startA; // hacia atrás: más reciente a más antiguo
        } else {
            return startA - startB; // hacia adelante: más antiguo a más reciente
        }
    });

    return modelosAplicables;
}

function calcularCambioDeEpoca(x, y, z, velX, velY, velZ, deltaTiempo) {
    const nuevaX = x + (deltaTiempo * velX);
    const nuevaY = y + (deltaTiempo * velY);
    const nuevaZ = z + (deltaTiempo * velZ);
    return { nuevaX, nuevaY, nuevaZ };
}

function addLog(message) {
    console.log(`LOG: ${message}`);
    const logsContent = document.getElementById('logsContent');
    const logMessage = document.createElement('p');
    logMessage.textContent = message;
    logsContent.appendChild(logMessage);
    logsContent.scrollTop = logsContent.scrollHeight;
}

async function realizarCambioDeEpocaPorModelos(fechaInicio, fechaDestino, lat, lon) {
    addLog(`Iniciando cambio de época de ${fechaInicio.toLocaleDateString()} a ${fechaDestino.toLocaleDateString()}`);

    const { X: xInicial, Y: yInicial, Z: zInicial } = elipsoidalToCartesian(lat, lon, 0);
    let coordX = xInicial, coordY = yInicial, coordZ = zInicial;
    addLog(`Coordenadas iniciales (X, Y, Z): (${coordX.toFixed(4)}, ${coordY.toFixed(4)}, ${coordZ.toFixed(4)})`);

    const modelos = obtenerModelosAplicables(fechaInicio, fechaDestino);
    if (modelos.length === 0) {
        addLog("No se encontraron modelos de velocidad aplicables para el rango seleccionado.");
        return null;
    }

    const goingBackwards = fechaInicio > fechaDestino;
    let fechaActual = new Date(fechaInicio.getTime());
    const minDate = new Date(-8640000000000000);
    const maxDate = new Date(8640000000000000);

    // Intervalo total en orden ascendente
    const startTotal = goingBackwards ? fechaDestino : fechaInicio;
    const endTotal = goingBackwards ? fechaInicio : fechaDestino;

    for (const modelo of modelos) {
        const modeloInicio = modelo.inicio || minDate;
        const modeloFin = modelo.fin || maxDate;

        // Intersección en orden ascendente
        const intersectStart = (modeloInicio > startTotal) ? modeloInicio : startTotal;
        const intersectEnd = (modeloFin < endTotal) ? modeloFin : endTotal;

        // Chequear que haya una intersección válida
        if (intersectStart > intersectEnd) {
            // No hay intersección real
            addLog(`El modelo ${modelo.nombre} no cubre el rango seleccionado. Se omite.`);
            continue;
        }

        // Ahora aplicamos el modelo en el subrango permitido.
        // Para el caso hacia atrás:
        if (goingBackwards) {
            // Vamos desde fechaActual hacia el pasado (fechaDestino)
            // El modelo aplica en [intersectStart, intersectEnd]
            // fechaActual >= fechaDestino siempre.
            // Debemos encontrar un corte que vaya desde fechaActual hacia abajo.
            // El siguiente corte es el máximo entre fechaDestino e intersectStart
            // pues no podemos ir más allá (más atrás en el tiempo) de lo permitido.
            let fechaCorte = intersectStart;
            if (fechaCorte < fechaDestino) fechaCorte = fechaDestino;
            if (fechaCorte < intersectStart) fechaCorte = intersectStart; 

            // Solo aplicamos si fechaCorte < fechaActual (hay un intervalo real a retroceder)
            if (fechaCorte < fechaActual) {
                const deltaTiempoMs = fechaCorte - fechaActual;
                const deltaTiempo = deltaTiempoMs / (1000 * 60 * 60 * 24 * 365.25);

                addLog(`Usando modelo: ${modelo.nombre}`);
                addLog(`Rango modelo: inicio=${modelo.inicio ? modelo.inicio.toLocaleDateString() : "N/A"} fin=${modelo.fin ? modelo.fin.toLocaleDateString() : "N/A"}`);
                addLog(`Fecha actual: ${fechaActual.toLocaleDateString()}, Fecha corte: ${fechaCorte.toLocaleDateString()}, Delta tiempo (años): ${deltaTiempo.toFixed(4)}`);

                const velocities = await calculateVelocitiesNSWE(lat, lon, modelo.archivo);
                if (!velocities) {
                    addLog(`Error: No se pudieron obtener las velocidades para ${modelo.nombre}`);
                    return null;
                }

                addLog(`Velocidades calculadas - NS: ${velocities.velocityNS.toFixed(4)}, WE: ${velocities.velocityWE.toFixed(4)}`);

                const { velX, velY, velZ } = convertVelocitiesToXYZ(velocities.velocityNS, velocities.velocityWE, lat, lon);
                addLog(`Velocidades en X, Y, Z: (${velX.toFixed(6)}, ${velY.toFixed(6)}, ${velZ.toFixed(6)})`);

                const nuevaPosicion = calcularCambioDeEpoca(coordX, coordY, coordZ, velX, velY, velZ, deltaTiempo);
                coordX = nuevaPosicion.nuevaX;
                coordY = nuevaPosicion.nuevaY;
                coordZ = nuevaPosicion.nuevaZ;

                addLog(`Nueva posición tras aplicar ${modelo.nombre} del ${fechaActual.toLocaleDateString()} al ${fechaCorte.toLocaleDateString()}: X=${coordX.toFixed(4)}, Y=${coordY.toFixed(4)}, Z=${coordZ.toFixed(4)}`);

                fechaActual = new Date(fechaCorte.getTime());

                // Si ya llegamos a fechaDestino, paramos.
                if (fechaActual <= fechaDestino) {
                    addLog("Se alcanzó la fecha destino, deteniendo el proceso.");
                    break;
                } else {
                    addLog(`Fecha actualizada a: ${fechaActual.toLocaleDateString()}\n---`);
                }
            } else {
                // No hay tramo temporal que aplicar en este modelo
                addLog(`No se aplica ${modelo.nombre} porque el rango no es válido o ya se pasó.`);
            }
        } else {
            // Hacia adelante
            // Aquí el modelo aplica en [intersectStart, intersectEnd]
            // Vamos desde fechaActual hacia el futuro.
            let fechaCorte = intersectEnd;
            if (fechaCorte > fechaDestino) fechaCorte = fechaDestino;

            // Aplicamos solo si fechaCorte > fechaActual (hay un intervalo real)
            if (fechaCorte > fechaActual) {
                const deltaTiempoMs = fechaCorte - fechaActual;
                const deltaTiempo = deltaTiempoMs / (1000 * 60 * 60 * 24 * 365.25);

                addLog(`Usando modelo: ${modelo.nombre}`);
                addLog(`Rango modelo: inicio=${modelo.inicio ? modelo.inicio.toLocaleDateString() : "N/A"} fin=${modelo.fin ? modelo.fin.toLocaleDateString() : "N/A"}`);
                addLog(`Fecha actual: ${fechaActual.toLocaleDateString()}, Fecha corte: ${fechaCorte.toLocaleDateString()}, Delta tiempo (años): ${deltaTiempo.toFixed(4)}`);

                const velocities = await calculateVelocitiesNSWE(lat, lon, modelo.archivo);
                if (!velocities) {
                    addLog(`Error: No se pudieron obtener las velocidades para ${modelo.nombre}`);
                    return null;
                }

                addLog(`Velocidades calculadas - NS: ${velocities.velocityNS.toFixed(4)}, WE: ${velocities.velocityWE.toFixed(4)}`);

                const { velX, velY, velZ } = convertVelocitiesToXYZ(velocities.velocityNS, velocities.velocityWE, lat, lon);
                addLog(`Velocidades en X, Y, Z: (${velX.toFixed(6)}, ${velY.toFixed(6)}, ${velZ.toFixed(6)})`);

                const nuevaPosicion = calcularCambioDeEpoca(coordX, coordY, coordZ, velX, velY, velZ, deltaTiempo);
                coordX = nuevaPosicion.nuevaX;
                coordY = nuevaPosicion.nuevaY;
                coordZ = nuevaPosicion.nuevaZ;

                addLog(`Nueva posición tras aplicar ${modelo.nombre} del ${fechaActual.toLocaleDateString()} al ${fechaCorte.toLocaleDateString()}: X=${coordX.toFixed(4)}, Y=${coordY.toFixed(4)}, Z=${coordZ.toFixed(4)}`);

                fechaActual = new Date(fechaCorte.getTime());
                // Si llegamos a fechaDestino, paramos.
                if (fechaActual >= fechaDestino) {
                    addLog("Se alcanzó la fecha destino, deteniendo el proceso.");
                    break;
                } else {
                    addLog(`Fecha actualizada a: ${fechaActual.toLocaleDateString()}\n---`);
                }
            } else {
                addLog(`No se aplica ${modelo.nombre} porque no hay intervalo válido hacia adelante.`);
            }
        }
    }

    addLog(`Posición final (X, Y, Z): (${coordX.toFixed(4)}, ${coordY.toFixed(4)}, ${coordZ.toFixed(4)})`);
    return { coordX, coordY, coordZ };
}

// EVENTOS DE LA INTERFAZ
document.addEventListener('DOMContentLoaded', function () {
    const calculateButton = document.getElementById('calcular');
    const clearButton = document.getElementById('limpiar');

    calculateButton.addEventListener('click', async function (event) {
        event.preventDefault();
        document.getElementById('logsContent').innerHTML = ''; // Limpiar logs

        const fechaInicio = new Date(document.getElementById('fechaRastreoPartida').value);
        const fechaDestino = new Date(document.getElementById('fechaReferenciaPartida').value);
        const lat = parseFloat(document.getElementById('latitud-decimal').value);
        const lon = parseFloat(document.getElementById('longitud-decimal').value);

        if (isNaN(lat) || isNaN(lon) || isNaN(fechaInicio) || isNaN(fechaDestino)) {
            alert("Verifique que las fechas y coordenadas sean válidas.");
            return;
        }

        const resultado = await realizarCambioDeEpocaPorModelos(fechaInicio, fechaDestino, lat, lon);
        if (resultado) {
            addLog(`Posición final en la época ${fechaDestino.toLocaleDateString()}:\nX: ${resultado.coordX.toFixed(4)}\nY: ${resultado.coordY.toFixed(4)}\nZ: ${resultado.coordZ.toFixed(4)}`);
            alert(`Posición final en la época ${fechaDestino.toLocaleDateString()}:\nX: ${resultado.coordX.toFixed(4)}\nY: ${resultado.coordY.toFixed(4)}\nZ: ${resultado.coordZ.toFixed(4)}`);
        }
    });

    clearButton.addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('latitud-decimal').value = '';
        document.getElementById('longitud-decimal').value = '';
        document.getElementById('logsContent').innerHTML = '';
    });
});
