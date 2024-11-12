// CONSTANTES Y CONFIGURACIÓN DE MODELOS
const a = 6378137.0; // Radio ecuatorial en metros
const f = 1 / 298.257223563; // Aplanamiento de la Tierra
// CONSTANTES Y CONFIGURACIÓN DE MODELOS
const modelosVelocidad = [
    { nombre: "VEMOS 2022", inicio: new Date("2017-02-01"), fin: null, archivo: "grids/Velogrid2022.txt" },
    { nombre: "VEMOS 2017", inicio: new Date("2014-01-01"), fin: new Date("2017-01-28"), archivo: "grids/Velogrid2017.txt" },
    { nombre: "VEMOS 2015", inicio: new Date("2010-03-14"), fin: new Date("2015-04-11"), archivo: "grids/Velogrid2015.txt" },
    { nombre: "VEMOS 2009", inicio: new Date("2000-01-02"), fin: new Date("2009-06-30"), archivo: "grids/Velogrid2010.txt" },
    { nombre: "VEMOS 2003", inicio: null, fin: new Date("1999-12-31"), archivo: "grids/Velogrid2003.txt" }
];


{}
// FUNCIONES DE CONVERSIÓN

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

// Función de interpolación inversa de distancia (IDW) para calcular NS y WE
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

// Cargar grilla de datos y calcular velocidades en NS y WE
async function calculateVelocitiesNSWE(lat, lon, archivo) {
    const response = await fetch(archivo);
    if (!response.ok) throw new Error("No se pudo cargar el archivo de grilla.");
    const textData = await response.text();
    const lines = textData.trim().split('\n');

    const matrix = [];
    for (const line of lines) {
        const [fileLat, fileLon, velocityNS, velocityWE] = line.split(';').map(parseFloat);
        const gridCoords = elipsoidalToCartesian(fileLat, fileLon);
        const position = elipsoidalToCartesian(lat, lon);
        const distance = Math.sqrt((gridCoords.X - position.X) ** 2 + (gridCoords.Y - position.Y) ** 2);
        matrix.push([velocityNS, velocityWE, distance]);
    }

    const velocityNS = idwInterpolate(matrix, 0);
    const velocityWE = idwInterpolate(matrix, 1);
    return { velocityNS, velocityWE };
}

// Convertir velocidades NS y WE a X, Y, Z usando coordenadas elipsoidales
function convertVelocitiesToXYZ(velNS, velWE, lat, lon) {
    const phi = (Math.PI / 180) * lat;
    const lambda = (Math.PI / 180) * lon;
    const velX = -velNS * Math.sin(phi) * Math.cos(lambda) - velWE * Math.sin(lambda);
    const velY = -velNS * Math.sin(phi) * Math.sin(lambda) + velWE * Math.cos(lambda);
    const velZ = velNS * Math.cos(phi);
    return { velX, velY, velZ };
}

// Seleccionar modelo de velocidad adecuado según las fechas
function obtenerModeloVelocidad(fechaInicio, fechaDestino) {
    return modelosVelocidad.find(modelo => {
        const inicioValido = modelo.inicio ? fechaInicio >= modelo.inicio : true;
        const finValido = modelo.fin ? fechaDestino <= modelo.fin : true;
        return inicioValido && finValido;
    });
}

// Calcular la nueva posición geocéntrica después del cambio de época usando las velocidades calculadas
function calcularCambioDeEpoca(x, y, z, velX, velY, velZ, deltaTiempo) {
    const nuevaX = x + (deltaTiempo * velX);
    const nuevaY = y + (deltaTiempo * velY);
    const nuevaZ = z + (deltaTiempo * velZ);
    return { nuevaX, nuevaY, nuevaZ };
}

async function realizarCambioDeEpocaPorModelos(fechaInicio, fechaDestino, lat, lon, h) {
    console.log(`Iniciando cambio de época desde ${fechaInicio.toLocaleDateString()} hasta ${fechaDestino.toLocaleDateString()}`);
    
    // Convertir coordenadas iniciales a cartesianas
    const { X: xInicial, Y: yInicial, Z: zInicial } = elipsoidalToCartesian(lat, lon, h);
    let coordX = xInicial, coordY = yInicial, coordZ = zInicial;

    console.log(`Coordenadas iniciales (X, Y, Z): (${coordX}, ${coordY}, ${coordZ})`);

    // Obtener todos los modelos aplicables entre fechaInicio y fechaDestino
    const modelos = obtenerModelosAplicables(fechaInicio, fechaDestino);
    if (modelos.length === 0) {
        console.error("No se encontraron modelos de velocidad aplicables para el rango de fechas seleccionado.");
        return null;
    }

    let fechaActual = fechaInicio;

    for (const modelo of modelos) {
        // Determinar la fecha de corte para este modelo (hasta dónde es válido)
       // Determinar la fecha de corte para este modelo
        const fechaCorte = modelo.fin && modelo.fin < fechaActual ? modelo.fin : fechaDestino;

        let deltaTiempoMs = fechaActual - fechaCorte;

        // Convertir delta de tiempo a años
        let deltaTiempo = Math.abs(deltaTiempoMs) / (1000 * 60 * 60 * 24 * 365.25);

        console.log(`Usando modelo: ${modelo.nombre}`);
        console.log(`Fecha actual: ${fechaActual.toLocaleDateString()}, Fecha de corte: ${fechaCorte.toLocaleDateString()}, Delta tiempo (años): ${deltaTiempo.toFixed(4)}`);

        // Calcular las velocidades NS y WE para el modelo actual usando su archivo de grilla
        const velocities = await calculateVelocitiesNSWE(lat, lon, modelo.archivo);
        if (!velocities) {
            console.error(`Error: No se pudieron obtener las velocidades para el modelo ${modelo.nombre}`);
            return null;
        }

        console.log(`Velocidades calculadas - NS: ${velocities.velocityNS}, WE: ${velocities.velocityWE}`);

        // Convertir las velocidades NS y WE a componentes X, Y, Z
        const { velX, velY, velZ } = convertVelocitiesToXYZ(velocities.velocityNS, velocities.velocityWE, lat, lon);

        console.log(`Velocidades en X, Y, Z: (${velX}, ${velY}, ${velZ})`);

        // Calcular la nueva posición geocéntrica aplicando el delta de tiempo y las velocidades calculadas
        const nuevaPosicion = calcularCambioDeEpoca(coordX, coordY, coordZ, velX, velY, velZ, deltaTiempo);
        coordX = nuevaPosicion.nuevaX;
        coordY = nuevaPosicion.nuevaY;
        coordZ = nuevaPosicion.nuevaZ;

        console.log(`Nueva posición después de aplicar ${modelo.nombre} hasta ${fechaCorte.toLocaleDateString()}: X=${coordX}, Y=${coordY}, Z=${coordZ}`);

        // Actualizar fecha actual para el siguiente ciclo usando la fecha de corte
        fechaActual = new Date(fechaCorte.getTime());

        // Si la fecha actual ya coincide con la fecha de destino, se termina el proceso
        if (fechaActual <= fechaDestino) break;

        console.log(`Fecha actualizada a: ${fechaActual.toLocaleDateString()}\n---`);
    }

    console.log(`Posición final (X, Y, Z): (${coordX}, ${coordY}, ${coordZ})`);
    return { coordX, coordY, coordZ };
}

// Función para obtener los modelos aplicables en el rango de fechas
function obtenerModelosAplicables(fechaInicio, fechaDestino) {
    const modelos = [
        { nombre: "VEMOS 2022", inicio: new Date("2017-02-01"), fin: null, archivo: "grids/Velogrid2022.txt" },
    { nombre: "VEMOS 2017", inicio: new Date("2014-01-01"), fin: new Date("2017-01-28"), archivo: "grids/Velogrid2017.txt" },
    { nombre: "VEMOS 2015", inicio: new Date("2010-03-14"), fin: new Date("2015-04-11"), archivo: "grids/Velogrid2015.txt" },
    { nombre: "VEMOS 2009", inicio: new Date("2000-01-02"), fin: new Date("2009-06-30"), archivo: "grids/Velogrid2010.txt" },
    { nombre: "VEMOS 2003", inicio: null, fin: new Date("1999-12-31"), archivo: "grids/Velogrid2003.txt" }
    ];

    // Filtrar los modelos que se aplican en el rango de fechas
    return modelos.filter(modelo => modelo.inicio <= fechaInicio && modelo.fin >= fechaDestino);
}





// EVENTOS DE LA INTERFAZ
document.addEventListener('DOMContentLoaded', function () {
    const calculateButton = document.getElementById('calcular');
    const clearButton = document.getElementById('limpiar');

    calculateButton.addEventListener('click', async function (event) {
        event.preventDefault();

        const fechaInicio = new Date(document.getElementById('fechaRastreoPartida').value);
        const fechaDestino = new Date(document.getElementById('fechaReferenciaPartida').value);


        if (fechaInicio <= fechaDestino) {
            alert("La fecha de inicio debe ser posterior a la fecha de destino para un cambio de época hacia el pasado.");
            return;
        }

        let lat = parseFloat(document.getElementById('latitud-decimal').value);
        let lon = parseFloat(document.getElementById('longitud-decimal').value);


        const resultado = await realizarCambioDeEpocaPorModelos(fechaInicio, fechaDestino, lat, lon);
        if (resultado) {
            alert(`Posición final en la época ${fechaDestino.toLocaleDateString()}:\nX: ${resultado.coordX.toFixed(4)}\nY: ${resultado.coordY.toFixed(4)}\nZ: ${resultado.coordZ.toFixed(4)}`);
        }
    });

    clearButton.addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('latitud-decimal').value = '';
        document.getElementById('longitud-decimal').value = '';
        document.getElementById('altura-elipsoidal').value = '';
    });
});
