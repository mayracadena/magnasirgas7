document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('coordinateFile');
    const calculateButton = document.getElementById('calculateButton');
    const outputDiv = document.getElementById('output');
    const vemosSelect = document.getElementById('vemosSelect');

    let fileContent = '';

    // Función para leer el archivo seleccionado
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                fileContent = e.target.result;
                console.log('Archivo cargado correctamente');
            };
            reader.readAsText(file);
        }
    });

    // Llamar a la función de cálculo cuando se presiona el botón
    calculateButton.addEventListener('click', function() {
        if (!fileContent) {
            alert('Por favor, carga un archivo antes de calcular.');
            return;
        }

        const model = vemosSelect.value;
        const coordinate = new EllipsoidalCoordinate(1.505264, -78.872308); // Ejemplo de coordenadas

        // Crear instancia de VelocitiesReader y procesar el contenido
        const reader = new VelocitiesReader(fileContent);
        const matrix = reader.getMatrix(coordinate);

        // Calcular las velocidades y coordenadas XYZ
        const velocities = calculateVelocities(matrix, coordinate);

        // Mostrar el resultado en el div de salida
        outputDiv.innerHTML = `
            <p>Velocidad Sur-Norte (SN): ${velocities.getVelocitySN().toFixed(4)}</p>
            <p>Velocidad Oeste-Este (WE): ${velocities.getVelocityWE().toFixed(4)}</p>
            <p>Diferencia en X: ${velocities.velocityX.toFixed(4)}</p>
            <p>Diferencia en Y: ${velocities.velocityY.toFixed(4)}</p>
            <p>Diferencia en Z: ${velocities.velocityZ.toFixed(4)}</p>
        `;
    });

});

// Clases y funciones para las coordenadas y cálculos
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

// Clase para leer el archivo cargado y extraer la información de velocidades
class VelocitiesReader {
    constructor(fileContent) {
        this.lines = fileContent.trim().split('\n');
    }

    getMatrix(coordinate1) {
        const latitude = coordinate1.latitude;
        const longitude = coordinate1.longitude;
        const matrix = [];

        this.lines.forEach(line => {
            const parts = line.split(';');
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            if (lat < latitude + 1.0 && lat > latitude - 1.0 &&
                lon < longitude + 1.0 && lon > longitude - 1.0) {
                const coordinate2 = new EllipsoidalCoordinate(lat, lon, null);
                const x = parseFloat(parts[2]);
                const y = parseFloat(parts[3]);
                console.log(`Latitud 2: ${lat}, Longitud 2: ${lon}`);
                const dist = calculateInverse(coordinate1, coordinate2)[0];
                matrix.push([x, y, dist]);
            }
        });

        return matrix;
    }
}

// Función de interpolación de distancia inversa (IDW)
function idwCalculate(matrix, posData) {
    let r = 0.0;
    if (matrix[0][2] === 0.0) {
        r = matrix[0][posData];
        return r;
    }
    let one = 0.0;
    let two = 0.0;
    for (let i = 0; i < matrix.length; i++) {
        let value = matrix[i][posData] / matrix[i][2];
        one += value;
        value = 1.0 / matrix[i][2];
        two += value;
    }
    r = one / two;
    return r;
}

// Función para calcular las velocidades y convertirlas a coordenadas XYZ
function calculateXYZ(vel, coordinate) {
    let sn = vel.getVelocitySN();
    let we = vel.getVelocityWE();
    let h = coordinate.ellipsoidalHeight || 0.0;

    // Ajuste de longitud
    const adjustedLongitude = coordinate.longitude + 2.777777777777777E-4;
    console.log(`adjustedLongitude: ${adjustedLongitude}`);

    const dist = calculateInverse(new EllipsoidalCoordinate(coordinate.latitude, adjustedLongitude, h), coordinate)[0];
    console.log(`distancia: =${dist}`);
    
    // Ajuste de las velocidades basado en la distancia
    sn1 = (sn / (dist * 3600.0));
    mk = (we / (dist * Math.cos(coordinate.latitude * Math.PI / 180) * 3600));

    console.log(`sn1: =${sn1}`);
    console.log(`mk: =${mk}`);
    console.log(`coordinate: =${coordinate.latitude}`);

    // Nuevas coordenadas elipsoidales ajustadas
    const adjustedLatitude = coordinate.latitude + sn1;
    const finalLongitude = coordinate.longitude + mk;

    const ellipsoidal = new EllipsoidalCoordinate(adjustedLatitude, finalLongitude, h);

    // Convertir ambas coordenadas a cartesianas
    const cartesian3D1 = cartesian3DConversion(coordinate);
    const cartesian3D2 = cartesian3DConversion(ellipsoidal);

    // Calcular las diferencias en coordenadas XYZ
    const x = Math.abs(cartesian3D2.X - cartesian3D1.X).toFixed(11);
    const y = Math.abs(cartesian3D2.Y - cartesian3D1.Y).toFixed(11);
    const z = Math.abs(cartesian3D2.Z - cartesian3D1.Z).toFixed(11);

    console.log(`Cartesian differences: x=${x}, y=${y}, z=${z}`);

    vel.setVelocityX(parseFloat(x));
    vel.setVelocityY(parseFloat(y));
    vel.setVelocityZ(parseFloat(z));

    return vel;
}

// Función de cálculo inverso (geodésico)
function calculateInverse(coordinate1, coordinate2) {
    const result = [0.0, 0.0, 0.0];

    const a = 6378137.0; // Radio ecuatorial de la Tierra en metros
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
    let lambdaP;
    const iterLimit = 100;
    let sinSigma, cosSigma, sigma, sinAlpha, cos2SigmaM, cosSqAlpha;
    let cosLambda, sinLambda;
    let i = 0;

    do {
        sinLambda = Math.sin(lambda);
        cosLambda = Math.cos(lambda);
        sinSigma = Math.sqrt(
            (Math.cos(U2) * sinLambda) * (Math.cos(U2) * sinLambda) +
            (Math.cos(U1) * Math.sin(U2) - Math.sin(U1) * Math.cos(U2) * cosLambda) *
            (Math.cos(U1) * Math.sin(U2) - Math.sin(U1) * Math.cos(U2) * cosLambda)
        );
        if (sinSigma === 0) return result; // coincident points
        cosSigma = Math.sin(U1) * Math.sin(U2) + Math.cos(U1) * Math.cos(U2) * cosLambda;
        sigma = Math.atan2(sinSigma, cosSigma);
        sinAlpha = Math.cos(U1) * Math.cos(U2) * sinLambda / sinSigma;
        cosSqAlpha = 1 - sinAlpha * sinAlpha;
        cos2SigmaM = cosSigma - 2 * Math.sin(U1) * Math.sin(U2) / cosSqAlpha;
        if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // equatorial line: cosSqAlpha=0 (§6)
        const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
        lambdaP = lambda;
        lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
        i++;
    } while (Math.abs(lambda - lambdaP) > 1e-12 && i < iterLimit);

    if (i >= iterLimit) return NaN; // formula failed to converge

    const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
        B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));

    const s = (b * A * (sigma - deltaSigma)).toFixed(4);

    const fwdAz = (Math.atan2(Math.cos(U2) * Math.sin(lambda), Math.cos(U1) * Math.sin(U2) - Math.sin(U1) * Math.cos(U2) * cosLambda) * (180 / Math.PI)).toFixed(4);
    const revAz = (Math.atan2(Math.cos(U1) * Math.sin(lambda), -Math.sin(U1) * Math.cos(U2) + Math.cos(U1) * Math.sin(U2) * cosLambda) * (180 / Math.PI)).toFixed(4);

    result[0] = parseFloat(s);
    result[1] = parseFloat(fwdAz) < 0 ? parseFloat(fwdAz) + 360 : parseFloat(fwdAz);
    result[2] = parseFloat(revAz) < 0 ? parseFloat(revAz) + 360 : parseFloat(revAz);

    console.log(`Inverse Calculation: s=${result[0].toFixed(4)}, fwdAz=${result[1].toFixed(4)}, revAz=${result[2].toFixed(4)}`);
    return result;
}

// Función principal para calcular las velocidades
function calculateVelocities(matrix, coordinate) {
    const velocitySN = idwCalculate(matrix, 0); // Posición de velX
    const velocityWE = idwCalculate(matrix, 1); // Posición de velY

    console.log(`Velocities calculated: velocitySN=${velocitySN.toFixed(6)}, velocityWE=${velocityWE.toFixed(6)}`);

    const vel = new Velocities();
    vel.setVelocitySN(velocitySN);
    vel.setVelocityWE(velocityWE);

    return calculateXYZ(vel, coordinate);
}

// Función para convertir coordenadas elipsoidales a cartesianas
function cartesian3DConversion(coordinate) {
    const phi = coordinate.latitude * (Math.PI / 180); // Convertir grados a radianes
    const lambda = coordinate.longitude * (Math.PI / 180); // Convertir grados a radianes
    const h = coordinate.ellipsoidalHeight || 0.0;

    const a = 6378137.0; // Radio ecuatorial de la Tierra en metros
    const f = 1 / 298.257223563; // Aplanamiento de la Tierra
    const e2 = 2 * f - Math.pow(f, 2); // Excentricidad cuadrada

    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const cosLambda = Math.cos(lambda);
    const sinLambda = Math.sin(lambda);

    const N = a / Math.sqrt(1 - e2 * Math.pow(sinPhi, 2));

    const X = (N + h) * cosPhi * cosLambda;
    const Y = (N + h) * cosPhi * sinLambda;
    const Z = ((1 - e2) * N + h) * sinPhi;

    return { X, Y, Z };
}
