/**
 * EJEMPLO de cómo integrar la lógica del PRIMER SCRIPT para identificar y recepcionar
 * coordenadas en el SEGUNDO SCRIPT, basándonos en la pestaña activa y sus inputs.
 */

// Importaciones y requerimientos
const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");
const conexion = require('../db/conexion.js');

// Módulos de conversión y orígenes
const {
  planas_cartesianas_a_curvilineas,
  geocentricas_a_curvilineas,
  curvilineas_a_geocentricas,
  planas_a_curvilineas,
  curvilineas_a_planas,
  curvilineas_a_planas_cartesianas
} = require('../controller/conversion_coordenadas.js');

const {
  origen_nacional,
  gauss_kruger,
  origen_UTM,
  origen_UTM_planas_a_curvilienas
} = require('../controller/origen.js');

const origen = require('../class/origen.js');

// Evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  const calculateButton = document.getElementById('calcular');
  const clearButton = document.getElementById('limpiar');

  // ---------------------------
  // Referencias a campos de input
  // ---------------------------
  // Elipsoidal en grados, minutos, segundos (DMS)
  const latitudGrados       = document.getElementById('latitud-grados');
  const latitudMinutos      = document.getElementById('latitud-minutos');
  const latitudSegundos     = document.getElementById('latitud-segundos');
  const latitudHemisferio   = document.getElementById('latitud-hemisferio');
  const longitudGrados      = document.getElementById('longitud-grados');
  const longitudMinutos     = document.getElementById('longitud-minutos');
  const longitudSegundos    = document.getElementById('longitud-segundos');
  const longitudHemisferio  = document.getElementById('longitud-hemisferio');

  // Elipsoidal en decimal
  const latitudDecimal  = document.getElementById('latitud-decimal');
  const longitudDecimal = document.getElementById('longitud-decimal');

  // Modelo de velocidades
  const vemosSelect = document.getElementById('modelo-velocidades');

  // Campos de salida (velocidades)
  const velocidadNorteSur   = document.getElementById('velocidad-norte-sur');
  const velocidadEsteOeste  = document.getElementById('velocidad-este-oeste');
  const velocidadX          = document.getElementById('velocidad-x');
  const velocidadY          = document.getElementById('velocidad-y');
  const velocidadZ          = document.getElementById('velocidad-z');

  // -----------------------------------------------------------------
  // NUEVA LÓGICA: Identificar coordenadas según la PESTAÑA ACTIVA
  // -----------------------------------------------------------------
  /**
   * Extraemos la lógica del PRIMER SCRIPT, donde usas:
   *
   *   var nav_a = document.querySelector("#myTab .nav-link.active").id;
   *
   * y un if/else en función de ese `nav_a` para saber de dónde
   * tomar latitud y longitud (o x,y,z).
   */
  
  calculateButton.addEventListener('click', async function (event) {
    event.preventDefault();

    // 1. Obtenemos la pestaña activa
    const nav_a = document.querySelector("#myTab .nav-link.active")?.id;
    if (!nav_a) {
      alert("Error: No se pudo determinar la pestaña activa.");
      return;
    }
    console.log("Pestaña activa:", nav_a);

    // Variables donde vamos a guardar lat, lon o x,y,z
    let lat, lon, X, Y, Z;

    /**
     * 2. Lógica EXACTA del primer script:
     *    - Revisamos si nav_a == 'elipsoidaldecimal-tab'
     *      o 'elipsoidal-tab', 'origen-nacional-tab', etc.
     *    - Convertimos o asignamos lat/lon.
     */
    if (nav_a === 'elipsoidaldecimal-tab') {
      // Leer coordenadas decimales
      lat = parseFloat(latitudDecimal.value);
      lon = parseFloat(longitudDecimal.value);
      console.log("Elipsoidal decimal => lat:", lat, ", lon:", lon);

    } else if (nav_a === 'elipsoidal-tab') {
      // Obtener valores DMS
      const latGrados     = parseFloat(latitudGrados.value);
      const latMinutos    = parseFloat(latitudMinutos.value);
      const latSegundos   = parseFloat(latitudSegundos.value);
      const latHemisferio = latitudHemisferio.value;

      const lonGrados     = parseFloat(longitudGrados.value);
      const lonMinutos    = parseFloat(longitudMinutos.value);
      const lonSegundos   = parseFloat(longitudSegundos.value);
      const lonHemisferio = longitudHemisferio.value;

      // Convertir a decimal
      lat = latGrados + (latMinutos / 60) + (latSegundos / 3600);
      if (latHemisferio === 'S') lat = -lat;

      lon = lonGrados + (lonMinutos / 60) + (lonSegundos / 3600);
      if (lonHemisferio === 'W') lon = -lon;

      console.log("Elipsoidal DMS => lat:", lat, ", lon:", lon);

    } else if (nav_a === 'origen-nacional-tab') {
      // Campos de origen nacional
      const norte = parseFloat(document.getElementById('norte').value);
      const este  = parseFloat(document.getElementById('este').value);
      
      const cp_on = new coord_planas(norte, este, 0);
      const on    = await origen_nacional();
      const ccr   = await planas_a_curvilineas(cp_on, on, 'MAGNA-SIRGAS');
      const cc    = new coord_curvilineas(ccr.phi, ccr.lambda, 0);

      lat = cc.phi;
      lon = cc.lambda;
      console.log("Origen nacional => lat:", lat, ", lon:", lon);

    } else if (nav_a === 'geocentrica-tab') {
      // Campos geocéntricos
      X = parseFloat(document.getElementById('x').value);
      Y = parseFloat(document.getElementById('y').value);
      Z = parseFloat(document.getElementById('z').value);

      console.log("Geocéntricas => X:", X, " Y:", Y, " Z:", Z);

      // Si tu lógica requiere inmediatamente convertir
      // a elipsoidal, hazlo aquí (o abajo en el try).
      // Este ejemplo reutiliza la función que ya tenías
      // en tu segundo script:
      const ellipsoidalCoords = geocentricToEllipsoidal(X, Y, Z);
      lat = ellipsoidalCoords.latitude;
      lon = ellipsoidalCoords.longitude;
      console.log("Geocéntricas -> Elipsoidales => lat:", lat, ", lon:", lon);

    } else if (nav_a === 'plana-cartesiana-tab') {
      const npc              = parseFloat(document.getElementById('norte-pc').value);
      const epc              = parseFloat(document.getElementById('este-pc').value);
      const origen_cartesiano = document.getElementById('origenes-cartesianos').value;

      if (origen_cartesiano === 'defecto') {
        alert('Debes escoger un origen cartesiano');
        return;
      }
      const c_p   = new coord_planas(npc, epc, 0);
      const c_cc_m = await planas_cartesianas_a_curvilineas(c_p, origen_cartesiano);
      const cc    = new coord_curvilineas(c_cc_m.phi, c_cc_m.lambda, c_cc_m.h);

      lat = cc.phi;
      lon = cc.lambda;
      console.log("Plana Cartesiana => lat:", lat, ", lon:", lon);

    } else if (nav_a === 'utm-tab') {
      const nutm     = parseFloat(document.getElementById('norte-utm').value);
      const eutm     = parseFloat(document.getElementById('este-utm').value);
      const huso     = parseInt(document.getElementById('huso').value);
      const hemisf   = document.getElementById('hemisferio').value;
      
      const c_utm      = new coord_planas(nutm, eutm, 0);
      const origen_utm = await origen_UTM_planas_a_curvilienas(huso, hemisf);

      const cutm = await planas_a_curvilineas(c_utm, origen_utm, 'MAGNA-SIRGAS');
      const cc   = new coord_curvilineas(cutm.phi, cutm.lambda, cutm.h);

      lat = cc.phi;
      lon = cc.lambda;
      console.log("UTM => lat:", lat, ", lon:", lon);

    } else if (nav_a === 'gauss-kruger-tab') {
      const ngk                = parseFloat(document.getElementById('norte-gk').value);
      const egk                = parseFloat(document.getElementById('este-gk').value);
      const origen_gauss_partida = document.getElementById('origen-gauss').value;

      const c_gk = new coord_planas(ngk, egk, 0);
      const o    = await gauss_kruger(origen_gauss_partida, 'MAGNA-SIRGAS');
      const cgk  = await planas_a_curvilineas(c_gk, o, 'MAGNA-SIRGAS');
      const cc   = new coord_curvilineas(cgk.phi, cgk.lambda, cgk.h);

      lat = cc.phi;
      lon = cc.lambda;
      console.log("Gauss Krüger => lat:", lat, ", lon:", lon);
    }

    // -----------------------------------------------------------------
    // 3. Realizar cálculo de VELOCIDADES (o lo que requieras)
    // -----------------------------------------------------------------
    try {
      let velocities;
      
      // Si la pestaña es geocéntrica, quizá quieras usar las coords X, Y, Z directamente.
      // O puedes hacerlo como ya lo hiciste: convertir a elipsoidal y luego usar lat/lon.
      if (nav_a === 'geocentrica-tab') {
        // Llamar a la función para cálculo directo de geocentric
        // (si la tienes) o a la misma que use lat/lon:
        velocities = calculateVelocitiesFromGeocentric(X, Y, Z);
      } else {
        // Llamar a tu función de archivo de grilla con lat/lon
        velocities = await getVelocitiesFromFile(lat, lon);
      }

      if (velocities) {
        // Mostrar los resultados en los campos de salida
        velocidadNorteSur.value  = velocities.velocitySN.toFixed(4);
        velocidadEsteOeste.value = velocities.velocityWE.toFixed(4);
        velocidadX.value         = velocities.velocityX.toFixed(4);
        velocidadY.value         = velocities.velocityY.toFixed(4);
        velocidadZ.value         = velocities.velocityZ.toFixed(4);
      } else {
        alert("No se pudieron calcular las velocidades.");
      }
    } catch (error) {
      console.error("Error al calcular las velocidades:", error);
      alert("Ocurrió un error al calcular las velocidades.");
    }

  }); // Fin del evento 'click' de calcular

  // ----------------------
  // Evento de limpiar
  // ----------------------
  clearButton.addEventListener('click', function (event) {
    event.preventDefault();
    // Limpia los campos que te interesen
    latitudGrados.value   = '';
    latitudMinutos.value  = '';
    latitudSegundos.value = '';
    longitudGrados.value  = '';
    longitudMinutos.value = '';
    longitudSegundos.value= '';

    latitudDecimal.value  = '';
    longitudDecimal.value = '';

    // Y también los de salida:
    velocidadNorteSur.value   = '';
    velocidadEsteOeste.value  = '';
    velocidadX.value          = '';
    velocidadY.value          = '';
    velocidadZ.value          = '';
  });

}); // Fin del DOMContentLoaded


// ===================================================================
//           A PARTIR DE AQUÍ, TU LÓGICA DE CÁLCULO EXISTENTE
// ===================================================================

// Ejemplo de función: convertir geocéntricas a elipsoidales.
// (Esto ya lo tenías en el segundo script; se respeta igual.)
function geocentricToEllipsoidal(x, y, z) {
  const a = 6378137.0; // Radio ecuatorial en metros
  const f = 1 / 298.257223563; // Aplanamiento de la Tierra
  const e2 = 2 * f - f ** 2;

  const p = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(z * a, p * (1 - f));
  const lon = Math.atan2(y, x);
  const lat = Math.atan2(
      z + e2 * (1 - f) * Math.sin(theta) ** 3 * a,
      p - e2 * a * Math.cos(theta) ** 3
  );

  const N = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
  const h = p / Math.cos(lat) - N;

  return {
    latitude:  lat * (180 / Math.PI),  // Convertir a grados
    longitude: lon * (180 / Math.PI),  // Convertir a grados
    height:    h
  };
}

// Si tienes una función para cálculo directo en geocéntricas, la pones aquí.
// Ejemplo vaciado que podrías remplazar:
function calculateVelocitiesFromGeocentric(x, y, z) {
  // TU lógica para calcular velocidades en geocéntricas
  // ...
  return {
    velocitySN: 0,
    velocityWE: 0,
    velocityX:  0,
    velocityY:  0,
    velocityZ:  0
  };
}

// El resto de funciones para leer el archivo, IDW, etc., se mantienen igual.
async function getVelocitiesFromFile(lat, lon) {
  const filePath = getFilePathByModel();
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error("No se pudo cargar el archivo de grilla.");

    const textData = await response.text();
    console.log("Contenido del archivo:", textData);

    const lines = textData.trim().split('\n');
    const reader = new VelocitiesReader(lines);

    const matrix = reader.getMatrix(lat, lon);
    console.log("Matriz de datos cargada:", matrix);

    const velocities = calculateVelocities(matrix, lat, lon);
    return velocities;
  } catch (error) {
    console.error("Error al cargar las velocidades:", error);
    return null;
  }
}

// Clase y función para obtener la ruta del modelo de velocidades
function getFilePathByModel() {
  const modelSelect = document.getElementById("modelo-velocidades");
  return `grids/${modelSelect.value}`;
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

// Función para calcular las velocidades basadas en la matriz y coordenadas
async function calculateVelocities(matrix, lat, lon, coordType, geocentricCoords) {
  let coordinate;

  // Determina si la coordenada es geocéntrica o elipsoidal
  if (coordType === 'geocentric') {
    if (geocentricCoords && geocentricCoords.x && geocentricCoords.y && geocentricCoords.z) {
      console.log("Convirtiendo coordenadas geocéntricas a elipsoidales...");
      const ellipsoidalCoords = geocentricas_elipsoidales(geocentricCoords.x, geocentricCoords.y, geocentricCoords.z);
      console.log("Coordenadas elipsoidales convertidas:", ellipsoidalCoords);

      // Crear una instancia de EllipsoidalCoordinate con las coordenadas convertidas
      coordinate = new EllipsoidalCoordinate(ellipsoidalCoords.latDec, ellipsoidalCoords.lonDec, ellipsoidalCoords.hReferencia);
    } else {
      console.error("Coordenadas geocéntricas no válidas:", geocentricCoords);
      return null;
    }
  } else {
    // Usa las coordenadas elipsoidales directamente
    coordinate = new EllipsoidalCoordinate(lat, lon);
  }

  // Confirmar que las coordenadas sean válidas antes de proceder
  if (isNaN(coordinate.latitude) || isNaN(coordinate.longitude)) {
    console.error("Coordenadas inválidas en calculateVelocities:", coordinate);
    return null;
  }

  // Verificación de la matriz de datos
  if (matrix.length === 0) {
    console.error("No hay datos de velocidad disponibles en la grilla.");
    return null;
  }

  // Realizar el cálculo de las velocidades usando IDW
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

// ---------------------------------------------
// Lógica para cargar combos en pestaña Plana Cartesiana
// (Idéntica a la del segundo script original)
// ---------------------------------------------
document.getElementById('myTab').addEventListener("click", async function () {
  var nav_a = document.querySelector("#myTab .nav-link.active").id;
  if (nav_a == 'plana-cartesiana-tab') {
    var con = new conexion();

    console.log('dentro de planas cartesianas');

    var sist_refe = 'MAGNA-SIRGAS';
    try {
      await con.open();

      //seleccionar a todos los departamentos
      var query_departamentos = "select DISTINCT d.id, d.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where sr.nombre = ? order by d.nombre asc";
      var result_departamento = await con.getAll(query_departamentos, [sist_refe]);

      var select_departamento_planas_destino = document.getElementById('departamento');
      select_departamento_planas_destino.innerHTML = '<option value="defecto" >Seleccione Departamento</option>';

      result_departamento.forEach(i => {
        var option_departamento = document.createElement('option');
        option_departamento.value = i.id,
        option_departamento.textContent = i.nombre;
        select_departamento_planas_destino.appendChild(option_departamento);
      });

      //funcion para mostrar los municipios segun el departamento que se encuentre activo
      document.getElementById('departamento').addEventListener("change", async function () {
        try {
          var sist_refe = 'MAGNA-SIRGAS';
          await con.open();
          var id_departamento = document.getElementById('departamento').value;
          var query_municipios = "select DISTINCT  m.id, m.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where m.fk_departamento = ? and sr.nombre = ? order by m.nombre asc";
          var parametros_municipio = [id_departamento.toString(), sist_refe];
          var result_municipio = await con.getAll(query_municipios, parametros_municipio);

          var select_municipios = document.getElementById('municipio');
          select_municipios.innerHTML = '<option value="defecto">Seleccione Municipio</option>';

          result_municipio.forEach(i => {
            var option_municipio = document.createElement('option');
            option_municipio.value = i.id,
            option_municipio.textContent = i.nombre;
            select_municipios.appendChild(option_municipio);
          });

          console.log(result_municipio);

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }
      });

      document.getElementById('municipio').addEventListener("change", async function () {
        try {
          await con.open();
          var select_municipio_detalle = document.getElementById('municipio').value;

          //traer todos los datos del origen cartografico
          var query_origen = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia  from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where m.id = ? and s.nombre = ? ";
          var sist_refe = 'MAGNA-SIRGAS';

          var parametros_detalle = [select_municipio_detalle, sist_refe];
          var result_origen_detalle = await con.getAll(query_origen, parametros_detalle);

          var detalle_select_origen = document.getElementById('origenes-cartesianos');
          detalle_select_origen.innerHTML = '<option value="defecto">Seleccione año, municipio y/o corregimiento</option>';

          result_origen_detalle.forEach(i => {
            var option_detalle = document.createElement('option');
            option_detalle.value = i.id,
            option_detalle.textContent = i.detalle;
            detalle_select_origen.appendChild(option_detalle);
          });
          console.log(result_origen_detalle);

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }
      });
    } catch (error) {
      console.error("Ocurrió un error:", error);
      return null;
    } finally {
      await con.close();
    }
  }
});
