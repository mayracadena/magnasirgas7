document.addEventListener('DOMContentLoaded', function () {
    const calculateButton = document.getElementById('calcular');
    const clearButton = document.getElementById('limpiar');
    
    // Coordenadas elipsoidales en formato sexagesimal
    const latitudGrados = document.getElementById('latitud-grados');
    const latitudMinutos = document.getElementById('latitud-minutos');
    const latitudSegundos = document.getElementById('latitud-segundos');
    const latitudHemisferio = document.getElementById('latitud-hemisferio');
    const longitudGrados = document.getElementById('longitud-grados');
    const longitudMinutos = document.getElementById('longitud-minutos');
    const longitudSegundos = document.getElementById('longitud-segundos');
    const longitudHemisferio = document.getElementById('longitud-hemisferio');
    
    // Campos de coordenadas decimales
    const latitudDecimal = document.getElementById('latitud-decimal');
    const longitudDecimal = document.getElementById('longitud-decimal');
    
    const vemosSelect = document.getElementById('modelo-velocidades');
    
    // Campos de salida
    const velocidadNorteSur = document.getElementById('velocidad-norte-sur');
    const velocidadEsteOeste = document.getElementById('velocidad-este-oeste');
    const velocidadX = document.getElementById('velocidad-x');
    const velocidadY = document.getElementById('velocidad-y');
    const velocidadZ = document.getElementById('velocidad-z');
    function geocentricToEllipsoidal(x, y, z) {
        const a = 6378137.0; // Radio ecuatorial en metros
        const f = 1 / 298.257223563; // Aplanamiento de la Tierra
        const e2 = 2 * f - f ** 2;
    
        const p = Math.sqrt(x * x + y * y);
        const theta = Math.atan2(z * a, p * (1 - f));
        const lon = Math.atan2(y, x);
        const lat = Math.atan2(z + e2 * (1 - f) * Math.sin(theta) ** 3 * a, p - e2 * a * Math.cos(theta) ** 3);
    
        const N = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
        const h = p / Math.cos(lat) - N;
    
        return {
            latitude: lat * (180 / Math.PI), // Convertir a grados
            longitude: lon * (180 / Math.PI), // Convertir a grados
            height: h
        };
    }
    
    // Detectar qué pestaña está activa
    function getActiveCoordinateType() {
        // Verificar si las coordenadas sexagesimales están activas
        if (document.getElementById('latitud-grados') && !document.getElementById('latitud-grados').disabled) {
            return 'sexagesimal';
        }
        // Verificar si las coordenadas decimales están activas
        if (document.getElementById('latitud-decimal') && !document.getElementById('latitud-decimal').disabled) {
            return 'decimal';
        }
        // Verificar si las coordenadas geocéntricas están activas
        if (document.getElementById('coord-x') && !document.getElementById('coord-x').disabled) {
            return 'geocentric';
        }
        // Si ninguna de las opciones está activa, devolver null
        return null;
    }
    
   // Evento de cálculo
   calculateButton.addEventListener('click', async function (event) {
    event.preventDefault();

    const coordinateType = getActiveCoordinateType();
    if (!coordinateType) {
        alert("Error: No se pudo determinar el tipo de coordenada activa.");
        return;
    }

    let latitud, longitud, x, y, z;
    let geocentricCoords = null;
       
    // Procesar según el formato activo
    if (coordinateType === 'sexagesimal') {
        latitud = parseSexagesimal(
            parseInt(latitudGrados.value),
            parseInt(latitudMinutos.value),
            parseFloat(latitudSegundos.value),
            latitudHemisferio.value
        );
        longitud = parseSexagesimal(
            parseInt(longitudGrados.value),
            parseInt(longitudMinutos.value),
            parseFloat(longitudSegundos.value),
            longitudHemisferio.value
        );
    } else if (coordinateType === 'decimal') {
        latitud = parseFloat(latitudDecimal.value);
        longitud = parseFloat(longitudDecimal.value);
    } else if (coordinateType === 'geocentric') {
        x = parseFloat(document.getElementById('coord-x').value);
        y = parseFloat(document.getElementById('coord-y').value);
        z = parseFloat(document.getElementById('coord-z').value);
        geocentricCoords = { X: x, Y: y, Z: z }; // Asignar coordenadas geocéntricas directamente
    }

    try {
        let velocities;

        if (coordinateType === 'geocentric') {
            // Realizar el cálculo directamente con las coordenadas geocéntricas
            velocities = calculateVelocitiesFromGeocentric(x, y, z);
        } else {
            // Llamada a getVelocitiesFromFile para coordenadas elipsoidales
            velocities = await getVelocitiesFromFile(latitud, longitud);
        }

        if (velocities) {
            // Mostrar los resultados en los campos de salida
            velocidadNorteSur.value = velocities.velocitySN.toFixed(4);
            velocidadEsteOeste.value = velocities.velocityWE.toFixed(4);
            velocidadX.value = velocities.velocityX.toFixed(4);
            velocidadY.value = velocities.velocityY.toFixed(4);
            velocidadZ.value = velocities.velocityZ.toFixed(4);
        } else {
            alert("No se pudieron calcular las velocidades.");
        }
    } catch (error) {
        console.error("Error al calcular las velocidades:", error);
        alert("Ocurrió un error al calcular las velocidades.");
    }
});


    // Evento de limpiar
    clearButton.addEventListener('click', function (event) {
        event.preventDefault();
        latitudGrados.value = '';
        latitudMinutos.value = '';
        latitudSegundos.value = '';
        longitudGrados.value = '';
        longitudMinutos.value = '';
        longitudSegundos.value = '';
        velocidadNorteSur.value = '';
        velocidadEsteOeste.value = '';
        velocidadX.value = '';
        velocidadY.value = '';
        velocidadZ.value = '';
    });
    
    // Función para convertir coordenadas sexagesimales a decimales
    function parseSexagesimal(grados, minutos, segundos, hemisferio) {
        let decimal = Math.abs(grados) + minutos / 60 + segundos / 3600;
        return hemisferio === 'S' || hemisferio === 'W' ? -decimal : decimal;
    }
});

// Clases y funciones de cálculo

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

    setVelocitySN(velocity) {
        this.velocitySN = velocity;
    }

    setVelocityWE(velocity) {
        this.velocityWE = velocity;
    }

    setVelocityX(velocity) {
        this.velocityX = velocity;
    }

    setVelocityY(velocity) {
        this.velocityY = velocity;
    }

    setVelocityZ(velocity) {
        this.velocityZ = velocity;
    }

    getVelocitySN() {
        return this.velocitySN;
    }

    getVelocityWE() {
        return this.velocityWE;
    }
}

// Función principal para obtener velocidades desde el archivo Velogrid2017.txt
async function getVelocitiesFromFile(lat, lon) {
    const filePath = 'grids/Velogrid2017.txt'; 
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error("No se pudo cargar el archivo de grilla.");

        const textData = await response.text();
        console.log("Contenido del archivo:", textData); // Verifica el contenido del archivo aquí

        const lines = textData.trim().split('\n');
        const reader = new VelocitiesReader(lines);

        const matrix = reader.getMatrix(lat, lon);
        console.log("Matriz de datos cargada:", matrix); // Verifica el contenido de la matriz aquí

        const velocities = calculateVelocities(matrix, lat, lon);
        return velocities;
    } catch (error) {
        console.error("Error al cargar las velocidades:", error);
        return null;
    }
}


// Clase para procesar el archivo y obtener la matriz de velocidades
class VelocitiesReader {
    constructor(lines) {
        this.lines = lines;
    }
    
    getMatrix(lat, lon) {
        const matrix = [];
        const coordinate = new EllipsoidalCoordinate(lat, lon);
        
        this.lines.forEach(line => {
            const parts = line.split(';');
            const fileLat = parseFloat(parts[0]);
            const fileLon = parseFloat(parts[1]);
            const velocityX = parseFloat(parts[2]);
            const velocityY = parseFloat(parts[3]);
            
            // Verificar que los valores son números válidos
            if (isNaN(fileLat) || isNaN(fileLon) || isNaN(velocityX) || isNaN(velocityY)) {
                console.warn(`Valores inválidos en la línea: ${line}`);
                return;
            }
            
            // Crear coordenada de la grilla
            const gridCoordinate = new EllipsoidalCoordinate(fileLat, fileLon);
            
            // Calcular la distancia usando calculateInverse
            const [distance] = calculateInverse(coordinate, gridCoordinate);
            console.log(`Procesando punto: (${fileLat}, ${fileLon}), Distancia: ${distance}`);
            
            if (distance < 1000) { // Ajusta el umbral de distancia si es necesario
                matrix.push([velocityX, velocityY, distance]);
            }
        });
        
        console.log("Matriz final de datos:", matrix);
        return matrix;
    }
}

// Función para calcular las velocidades basadas en la matriz y coordenadas
function calculateVelocities(matrix, lat, lon, coordType, geocentricCoords) {
    let coordinate;
    
    if (coordType === 'geocentric') {
        // Convertir coordenadas geocéntricas a elipsoidales
        const ellipsoidalCoords = geocentricToEllipsoidal(geocentricCoords.x, geocentricCoords.y, geocentricCoords.z);
        coordinate = new EllipsoidalCoordinate(ellipsoidalCoords.latitude, ellipsoidalCoords.longitude, ellipsoidalCoords.height);
    } else {
        // Utilizar directamente las coordenadas elipsoidales ingresadas
        coordinate = new EllipsoidalCoordinate(lat, lon);
    }

    if (matrix.length === 0) {
        console.error("No hay datos de velocidad disponibles en la grilla.");
        return null;
    }

    const velocitySN = idwCalculate(matrix, 0);
    const velocityWE = idwCalculate(matrix, 1);

    if (isNaN(velocitySN) || isNaN(velocityWE)) {
        console.error("Las velocidades calculadas no son válidas.");
        return null;
    }

    const velocities = new Velocities();
    velocities.setVelocitySN(velocitySN);
    velocities.setVelocityWE(velocityWE);

    const adjustedVelocities = calculateXYZ(velocities, coordinate);
    return adjustedVelocities;
}

// Función de interpolación de distancia inversa (IDW) para calcular la velocidad
function idwCalculate(matrix, posData) {
    let result = 0.0;
    if (matrix[0] && matrix[0][2] === 0.0) {
        result = matrix[0][posData];
        return result;
    }

    let numerator = 0.0;
    let denominator = 0.0;

    for (let i = 0; i < matrix.length; i++) {
        if (matrix[i].length < 3) continue; // Asegúrate de que cada fila tenga al menos 3 elementos

        let value = matrix[i][posData] / matrix[i][2];
        numerator += value;
        value = 1.0 / matrix[i][2];
        denominator += value;
    }

    result = numerator / denominator;
    return result;
}

// Función para convertir las velocidades SN y WE a coordenadas XYZ basadas en la coordenada elipsoidal
function calculateXYZ(vel, coordinate, geocentricCoords = null) {
    // Si las coordenadas geocéntricas son proporcionadas, úsalas directamente
    let cartesianOriginal;
    if (geocentricCoords) {
        cartesianOriginal = geocentricCoords;
    } else {
        // Convertir coordenadas elipsoidales a geocéntricas
        cartesianOriginal = cartesian3DConversion(coordinate);
    }

    // Calcular coordenadas ajustadas
    let sn = vel.getVelocitySN();
    let we = vel.getVelocityWE();
    let h = coordinate.ellipsoidalHeight || 0.0;

    // Ajuste en longitud y cálculo de distancia entre coordenadas
    const adjustedLongitude = coordinate.longitude + 2.777777777777777E-4;
    const dist = calculateInverse(new EllipsoidalCoordinate(coordinate.latitude, adjustedLongitude, h), coordinate)[0];
    
    // Ajuste de las velocidades basadas en la distancia calculada
    const snAdjusted = sn / (dist * 3600.0);
    const weAdjusted = we / (dist * Math.cos(coordinate.latitude * Math.PI / 180) * 3600);

    // Nueva coordenada elipsoidal ajustada
    const adjustedLatitude = coordinate.latitude + snAdjusted;
    const finalLongitude = coordinate.longitude + weAdjusted;

    // Crear coordenada elipsoidal ajustada y convertir ambas a coordenadas cartesianas
    const adjustedCoordinate = new EllipsoidalCoordinate(adjustedLatitude, finalLongitude, h);
    const cartesianAdjusted = cartesian3DConversion(adjustedCoordinate);

    // Calcular las diferencias en coordenadas XYZ
    const x = Math.abs(cartesianAdjusted.X - cartesianOriginal.X).toFixed(11);
    const y = Math.abs(cartesianAdjusted.Y - cartesianOriginal.Y).toFixed(11);
    const z = Math.abs(cartesianAdjusted.Z - cartesianOriginal.Z).toFixed(11);

    // Asignar las diferencias de velocidad en XYZ
    vel.setVelocityX(parseFloat(x));
    vel.setVelocityY(parseFloat(y));
    vel.setVelocityZ(parseFloat(z));

    return vel;
}


// Función de cálculo inverso (geodésico) para calcular la distancia entre dos coordenadas elipsoidales
function calculateInverse(coordinate1, coordinate2) {
    // Verifica que las coordenadas sean números válidos
    if (
        isNaN(coordinate1.latitude) || isNaN(coordinate1.longitude) ||
        isNaN(coordinate2.latitude) || isNaN(coordinate2.longitude)
    ) {
        console.error("Coordenadas inválidas en calculateInverse:", coordinate1, coordinate2);
        return [NaN, 0, 0];
    }

    const a = 6378137.0; // Radio ecuatorial en metros
    const f = 1 / 298.257223563; // Aplanamiento de la Tierra
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
        sinSigma = Math.sqrt(
            (Math.cos(U2) * sinLambda) ** 2 +
            (Math.cos(U1) * Math.sin(U2) - Math.sin(U1) * Math.cos(U2) * cosLambda) ** 2
        );

        if (sinSigma === 0) return [0, 0, 0]; // Coordenadas coincidentes

        cosSigma = Math.sin(U1) * Math.sin(U2) + Math.cos(U1) * Math.cos(U2) * cosLambda;
        sigma = Math.atan2(sinSigma, cosSigma);
        sinAlpha = Math.cos(U1) * Math.cos(U2) * sinLambda / sinSigma;
        cosSqAlpha = 1 - sinAlpha ** 2;
        cos2SigmaM = cosSigma - 2 * Math.sin(U1) * Math.sin(U2) / cosSqAlpha;

        if (isNaN(cos2SigmaM)) cos2SigmaM = 0;

        const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
        lambdaP = lambda;
        lambda = L + (1 - C) * f * sinAlpha *
            (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));

    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

    if (iterLimit === 0) {
        console.error("Convergencia no alcanzada en calculateInverse.");
        return NaN;
    }

    const uSq = cosSqAlpha * (a ** 2 - b ** 2) / (b ** 2);
    const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
        B / 6 * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2)));

    const s = b * A * (sigma - deltaSigma);

    return [s, 0, 0]; // Devuelve solo la distancia
}


// Función para convertir coordenadas elipsoidales a cartesianas
function cartesian3DConversion(coordinate) {
    const phi = coordinate.latitude * (Math.PI / 180);
    const lambda = coordinate.longitude * (Math.PI / 180);
    const h = coordinate.ellipsoidalHeight || 0.0;

    const a = 6378137.0;
    const f = 1 / 298.257223563;
    const e2 = 2 * f - f ** 2;

    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);

    const X = (N + h) * Math.cos(phi) * Math.cos(lambda);
    const Y = (N + h) * Math.cos(phi) * Math.sin(lambda);
    const Z = ((1 - e2) * N + h) * Math.sin(phi);

    return { X, Y, Z };
}
