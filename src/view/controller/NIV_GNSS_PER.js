let csvData = []; // Array para almacenar los datos cargados desde el CSV
let map; // Variable global para el mapa
let userMarker; // Marcador del usuario
const selectedPoints = []; // Lista de puntos seleccionados
// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  map = initializeMap(); // Inicializar el mapa al cargar la página
  initEventListeners(); // Inicializar eventos
});


// Función para inicializar el mapa
function initializeMap() {
  const map = L.map("map").setView([4.570868, -74.297333], 6); // Coordenadas iniciales (Colombia)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  return map;
}

// Función para manejar la carga de un archivo CSV
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file || file.type !== "text/csv") {
    alert("Por favor, selecciona un archivo CSV válido.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const csvContent = e.target.result;
    processCSV(csvContent);
  };
  reader.readAsText(file);
}

// Función para procesar el contenido del CSV
function processCSV(csvContent) {
  const rows = csvContent.split("\n").map((row) => row.split(","));
  const header = rows[0].map((h) => h.trim());

  if (
    !header.includes("ID") ||
    !header.includes("Latitud") ||
    !header.includes("Longitud") ||
    !header.includes("Altura Elipsoidal") ||
    !header.includes("Altura Geoidal")
  ) {
    alert(
      "El archivo CSV debe contener las columnas: ID, Latitud, Longitud, Altura Elipsoidal, Altura Geoidal."
    );
    return;
  }


  const idIndex = header.indexOf("ID");
  const latIndex = header.indexOf("Latitud");
  const longIndex = header.indexOf("Longitud");
  const altElipIndex = header.indexOf("Altura Elipsoidal");
  const altGeoIndex = header.indexOf("Altura Geoidal");

  csvData = rows.slice(1).map((row) => {
    const cols = row.map((col) => col.trim());
    return {
      id: cols[idIndex],
      latitud: parseFloat(cols[latIndex]),
      longitud: parseFloat(cols[longIndex]),
      alturaElipsoidal: parseFloat(cols[altElipIndex]),
      alturaGeoidal: parseFloat(cols[altGeoIndex]),
    };
  });

  renderPreview(csvData);
}

// Función para renderizar la vista previa de los datos cargados
function renderPreview(data) {
  const tableBody = document.getElementById("file-preview-body");
  const previewTable = document.getElementById("file-preview-table");
  const emptyMessage = document.getElementById("empty-preview");

  tableBody.innerHTML = ""; // Limpiar la tabla

  data.forEach((row) => {
    const tableRow = document.createElement("tr");
    tableRow.innerHTML = `
      <td>${row.id || "N/A"}</td>
      <td>${row.latitud || "N/A"}</td>
      <td>${row.longitud || "N/A"}</td>
      <td>${row.alturaElipsoidal || "N/A"}</td>
      <td>${row.alturaGeoidal || "N/A"}</td>
    `;
    tableBody.appendChild(tableRow);
  });

  previewTable.style.display = data.length > 0 ? "table" : "none";
  emptyMessage.style.display = data.length > 0 ? "none" : "block";
}

// Función para calcular y georreferenciar el promedio
function calculateAverageLocation() {
  if (!csvData || csvData.length === 0) {
    alert("No hay puntos disponibles para calcular el promedio.");
    return;
  }

  let totalLatitude = 0;
  let totalLongitude = 0;
  let validPoints = 0;

  csvData.forEach((point) => {
    const latitude = parseFloat(point.latitud);
    const longitude = parseFloat(point.longitud);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      totalLatitude += latitude;
      totalLongitude += longitude;
      validPoints++;
    }
  });

  if (validPoints === 0) {
    alert("No se encontraron coordenadas válidas para calcular el promedio.");
    return;
  }

  const averageLatitude = totalLatitude / validPoints;
  const averageLongitude = totalLongitude / validPoints;

  // Agregar un marcador en el mapa
  if (userMarker) {
    map.removeLayer(userMarker); // Elimina el marcador anterior si existe
  }
  userMarker = L.marker([averageLatitude, averageLongitude]).addTo(map);
  userMarker.bindPopup(
    `Punto promedio<br>Latitud: ${averageLatitude.toFixed(5)}<br>Longitud: ${averageLongitude.toFixed(5)}`
  ).openPopup();

  map.setView([averageLatitude, averageLongitude], 10);

  // Mostrar los puntos más cercanos desde un archivo JSON
  displayClosestPoints(averageLatitude, averageLongitude, "grids/nivelados.json");
}
// Función para cargar puntos desde un archivo JSON y calcular distancias
async function loadAndFilterPoints(lat, lon, jsonPath) {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error(`Error al cargar el archivo JSON: ${response.statusText}`);
      }
      const data = await response.json();
  
      const pointsWithDistance = data.features.map((feature) => {
        const pointLat = feature.geometry.coordinates[1];
        const pointLon = feature.geometry.coordinates[0];
        const distance = haversine(lat, lon, pointLat, pointLon);
  
        return {
          name: feature.properties.Nomenclatu,
          lat: pointLat,
          lon: pointLon,
          hNivelada: feature.properties.Altura_m_s,
          hElipsoidal: feature.properties.Alt_Elipso,
          ondulacion: feature.properties.Ondulacion || 0.0, // Ondulación conocida o 0
          distance,
        };
      });
  
      // Ordenar por distancia y devolver los 40 puntos más cercanos
      return pointsWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 40);
    } catch (error) {
      console.error("Error en loadAndFilterPoints:", error);
      throw error;
    }
  }


    // Función para seleccionar puntos
    function selectPoint(name, lat, lon, hNivelada, hElipsoidal, ondulacion) {
    if (selectedPoints.length >= 2) {
        alert("Solo puedes seleccionar dos puntos base.");
        return;
    }

    // Verificar si el punto ya está seleccionado
    if (selectedPoints.some(point => point.name === name)) {
        alert("Este punto ya fue seleccionado.");
        return;
    }

    
        // Agregar el punto a la lista de puntos seleccionados
        selectedPoints.push({ name, lat, lon, hNivelada, hElipsoidal, ondulacion });
        console.log("Punto seleccionado:", { name, lat, lon, hNivelada, hElipsoidal, ondulacion });
        alert(`Punto ${name} seleccionado correctamente.`);
    };
  
  // Función Haversine para calcular distancia
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // Distancia en km
  }
  
// Función para mostrar los puntos más cercanos en el mapa
async function displayClosestPoints(lat, lon, jsonPath) {
  try {
    const closestPoints = await loadAndFilterPoints(lat, lon, jsonPath);

    closestPoints.forEach((point) => {
      const marker = L.marker([point.lat, point.lon]).addTo(map);
      marker.bindPopup(`
        <b>Nomenclatura:</b> ${point.name}<br>
        <b>Altura Nivelada:</b> ${point.hNivelada} m<br>
        <b>Distancia:</b> ${point.distance.toFixed(2)} km<br>
        <button class="btn btn-primary" onclick="selectPoint('${point.name}', ${point.lat}, ${point.lon}, ${point.hNivelada}, ${point.hElipsoidal}, ${point.ondulacion})">Seleccionar</button>
        
      `);
    });
  } catch (err) {
    console.error("Error en displayClosestPoints:", err);
    alert("No se pudieron cargar los puntos cercanos.");
  }
}

// Inicializar eventos de la interfaz
function initEventListeners() {
  document.getElementById("file-upload").addEventListener("change", handleFileUpload);
  document.getElementById("clear-btn").addEventListener("click", clearData);

  // **Botón "Procesar" vinculado**
  document.getElementById("process-csv").addEventListener("click", () => {
    calculateAverageLocation();
  });
}

// Limpia la tabla y los datos cargados
function clearData() {
  csvData = [];
  const tableBody = document.getElementById("file-preview-body");
  const previewTable = document.getElementById("file-preview-table");
  const emptyMessage = document.getElementById("empty-preview");

  tableBody.innerHTML = "";
  previewTable.style.display = "none";
  emptyMessage.style.display = "block";

  if (userMarker) {
    map.removeLayer(userMarker); // Elimina el marcador si existe
  }
}

// FUNCION EVENTO CALCULAR NIVELACION 

// EVENTO PARA CALCULAR NIVELACIÓN
// EVENTO PARA CALCULAR NIVELACIÓN
// Función para calcular la corrección con la nueva lógica
function calcularCorreccion(punto1, punto2, puntosUsuario) {
    // Diferencia entre las alturas niveladas de los puntos base
    const diferencia = punto2.hNivelada - punto1.hNivelada;
    console.log("Diferencia entre puntos seleccionados (niveladas):", diferencia);

    const sumatoriaDeltaHGPSCorregido = puntosUsuario.reduce((acumulado, punto) => {
        const valor = parseFloat(punto.deltaHGPS_Corregido);
        console.log(`deltaHGPS_Corregido para punto ID ${punto.id}:`, valor);
        return acumulado + valor;
    }, 0);

    console.log("Sumatoria de deltaHGPS_Corregido:", sumatoriaDeltaHGPSCorregido);

    // Cantidad total de puntos para el cálculo
    const cantidadPuntos = puntosUsuario.length;
    console.log("Cantidad total de puntos para el cálculo:", cantidadPuntos);

    const correccion = (diferencia - sumatoriaDeltaHGPSCorregido) / cantidadPuntos;
    console.log("Corrección final calculada:", correccion);

    return correccion;
}

// EVENTO PARA CALCULAR NIVELACIÓN
// Función para calcular la corrección
function calcularCorreccion(punto1, punto2, puntosUsuario) {
    // Diferencia entre las alturas niveladas de los puntos base
    const diferencia = punto2.hNivelada - punto1.hNivelada;
    console.log("Diferencia entre puntos seleccionados (niveladas):", diferencia);

    // Sumar todos los deltaHGPS_Corregido
    const sumatoriaDeltaHGPSCorregido = puntosUsuario.reduce((acumulado, punto) => {
        const valor = parseFloat(punto.deltaHGPS_Corregido);
        console.log(`deltaHGPS_Corregido para punto ID ${punto.id}:`, valor);
        return acumulado + valor;
    }, 0);

    console.log("Sumatoria de deltaHGPS_Corregido:", sumatoriaDeltaHGPSCorregido);

    // Cantidad total de puntos para el cálculo
    const cantidadPuntos = puntosUsuario.length;
    console.log("Cantidad total de puntos para el cálculo:", cantidadPuntos);

    // Cálculo de la corrección
    const correccion = (diferencia - sumatoriaDeltaHGPSCorregido) / cantidadPuntos;
    console.log("Corrección final calculada:", correccion);

    return correccion;
}

// EVENTO PARA CALCULAR NIVELACIÓN
document.getElementById("calculate-leveling").addEventListener("click", () => {
    try {
        console.log("=== INICIO CÁLCULO DE NIVELACIÓN ===");

        if (selectedPoints.length !== 2) {
            throw new Error("Debe seleccionar exactamente dos puntos base para realizar el cálculo.");
        }

        if (csvData.length === 0) {
            throw new Error("No hay puntos cargados para realizar el cálculo.");
        }

        const punto1 = selectedPoints[0];
        const punto2 = selectedPoints[1];

        console.log("Punto base 1 (punto1):", punto1);
        console.log("Punto base 2 (punto2):", punto2);

        if (
            isNaN(punto1.hElipsoidal) || isNaN(punto1.hNivelada) ||
            isNaN(punto2.hElipsoidal) || isNaN(punto2.hNivelada)
        ) {
            console.error("Datos inválidos en los puntos seleccionados:", { punto1, punto2 });
            throw new Error("Los puntos seleccionados deben tener valores válidos para las alturas (hElipsoidal y hNivelada).");
        }

        // Definir altura geoidal (N) a partir de la ondulación
        punto1.alturaGeoidal = punto1.ondulacion;
        punto2.alturaGeoidal = punto2.ondulacion;

        console.log(`Ondulación punto1: ${punto1.ondulacion}, hElipsoidal punto1: ${punto1.hElipsoidal}, hNivelada punto1: ${punto1.hNivelada}, N_base: ${punto1.alturaGeoidal}`);
        console.log(`Ondulación punto2: ${punto2.ondulacion}, hElipsoidal punto2: ${punto2.hElipsoidal}, hNivelada punto2: ${punto2.hNivelada}, N_punto2: ${punto2.alturaGeoidal}`);

        // Filtrar puntos válidos
        console.log("Filtrando puntos válidos en csvData...");
        const puntosValidos = csvData.filter(p => {
            const esValido =
                !isNaN(p.alturaElipsoidal) &&
                !isNaN(p.alturaGeoidal) &&
                p.alturaElipsoidal !== undefined &&
                p.alturaGeoidal !== undefined;
            if (!esValido) {
                console.warn(`Punto ID ${p.id} inválido. Datos:`, p);
            }
            return esValido;
        });

        console.log("Puntos válidos obtenidos:", puntosValidos);

        if (puntosValidos.length === 0) {
            throw new Error("No hay puntos válidos en los datos cargados para realizar el cálculo.");
        }

        // Agregar el segundo punto seleccionado como el último punto
        const punto2Usuario = {
            id: punto2.id || "Punto2_User",
            latitud: punto2.lat,
            longitud: punto2.lon,
            alturaElipsoidal: punto2.hElipsoidal,
            alturaGeoidal: punto2.alturaGeoidal
        };
        puntosValidos.push(punto2Usuario);

        console.log("Conjunto final de puntos a procesar (incluye punto2):", puntosValidos);

        // PRIMERA PASADA: Calcular DH_gps_Corregido sin aplicar corrección
        let dhgAnterior = 0;
        let hgpsAnterior = punto1.hNivelada;

        console.log("=== PRIMERA PASADA: Cálculo de DH_gps_Corregido sin corrección ===");
        puntosValidos.forEach((punto, index) => {
            console.log("--------------------------------------------------");
            console.log(`Procesando punto ID ${punto.id} (Primera Pasada):`, punto);

            const Dh = parseFloat(punto.alturaElipsoidal) - parseFloat(punto1.hElipsoidal);
            const DNi = parseFloat(punto.alturaGeoidal) - parseFloat(punto1.alturaGeoidal);
            const DH_gps = Dh - DNi;

            console.log(`Dh = hElip_i (${punto.alturaElipsoidal}) - hElip_base (${punto1.hElipsoidal}) = ${Dh}`);
            console.log(`DNi = N_i (${punto.alturaGeoidal}) - N_base (${punto1.alturaGeoidal}) = ${DNi}`);
            console.log(`DH_gps = Dh (${Dh}) - DNi (${DNi}) = ${DH_gps}`);

            const hGPS = hgpsAnterior + DH_gps;
            console.log(`hGPS sin corrección = hgpsAnterior(${hgpsAnterior}) + DH_gps(${DH_gps}) = ${hGPS}`);

            const deltaHGPS_Corregido = DH_gps - dhgAnterior;
            console.log(`deltaHGPS_Corregido = DH_gps(${DH_gps}) - dhgAnterior(${dhgAnterior}) = ${deltaHGPS_Corregido}`);

            // Guardamos deltaHGPS_Corregido en el punto
            punto.deltaHGPS_Corregido = deltaHGPS_Corregido;

            dhgAnterior = DH_gps;
            hgpsAnterior = hGPS;
        });

        // Calcular corrección con la nueva lógica
        console.log("=== CÁLCULO DE CORRECCIÓN ===");
        const correccion = calcularCorreccion(punto1, punto2, puntosValidos);
        console.log("Corrección obtenida:", correccion);

        // SEGUNDA PASADA: Aplicar la corrección para obtener H_gps_Final
        dhgAnterior = 0;
        hgpsAnterior = punto1.hNivelada;

        console.log("=== SEGUNDA PASADA: Cálculo de H_gps_Final con corrección ===");
        const resultados = puntosValidos.map((punto, index) => {
            console.log("--------------------------------------------------");
            console.log(`Procesando punto ID ${punto.id} (Segunda Pasada):`, punto);

            const Dh = parseFloat(punto.alturaElipsoidal) - parseFloat(punto1.hElipsoidal);
            const DNi = parseFloat(punto.alturaGeoidal) - parseFloat(punto1.alturaGeoidal);
            const DH_gps = Dh - DNi;

            console.log(`Dh = ${Dh}, DNi = ${DNi}, DH_gps = ${DH_gps}`);
            console.log(`deltaHGPS_Corregido (almacenado en la primera pasada) = ${punto.deltaHGPS_Corregido}`);

            // H_gps_Final = H_gps_Anterior + deltaHGPS_Corregido + correccion
            const H_gps_Final = hgpsAnterior + punto.deltaHGPS_Corregido + correccion;

            console.log(`H_gps_Final = H_gps_Anterior(${hgpsAnterior}) + deltaHGPS_Corregido(${punto.deltaHGPS_Corregido}) + correccion(${correccion}) = ${H_gps_Final}`);

            dhgAnterior = DH_gps;
            hgpsAnterior = H_gps_Final;

            return {
                id: punto.id,
                latitud: punto.latitud,
                longitud: punto.longitud,
                alturaElipsoidal: punto.alturaElipsoidal,
                alturaGeoidal: punto.alturaGeoidal,
                alturaGNSS: H_gps_Final.toFixed(3),
            };
        });

        console.log("--------------------------------------------------");
        console.log("Resultados finales:", resultados);

        // Generar CSV
        const csvContent = "data:text/csv;charset=utf-8," +
            "ID,Latitud,Longitud,Altura Elipsoidal,Altura Geoidal,Altura GNSS\n" +
            resultados.map(row => `${row.id},${row.latitud},${row.longitud},${row.alturaElipsoidal},${row.alturaGeoidal},${row.alturaGNSS}`).join("\n");

        console.log("CSV generado:", csvContent);

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "nivelacion_gnss.csv");
        document.body.appendChild(link);

        console.log("Disparando la descarga del archivo CSV...");
        link.click();
        document.body.removeChild(link);

        alert("Cálculo completado y archivo descargado.");
        console.log("=== FIN DEL CÁLCULO DE NIVELACIÓN ===");
    } catch (error) {
        console.error("Error al calcular la nivelación:", error);
        alert(error.message);
    }
});
