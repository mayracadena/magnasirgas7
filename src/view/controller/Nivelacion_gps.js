document.addEventListener("DOMContentLoaded", () => {
  const selectedPoints = []; // Lista de puntos seleccionados
  const map = L.map("map").setView([4.7110, -74.0721], 6); // Inicializar el mapa
  let userMarker = null; // Marcador del usuario para el punto ingresado

  // Capa base del mapa
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Icono para marcadores
  const hexagonIcon = L.divIcon({
    className: "custom-icon",
    html: `
      <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" style="fill:#0078ff;stroke:#0044aa;stroke-width:5" />
      </svg>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  // Función global para seleccionar un punto
  window.selectPoint = function (name, lat, lon, hNivelada, hElipsoidal, ondulacion) {
    // Verificar si el punto ya está seleccionado
    if (selectedPoints.find(point => point.name === name)) {
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

  // Función para obtener coordenadas ingresadas por el usuario
  function getCoordinates() {
    const lat = parseFloat(document.getElementById("latitud-decimal").value);
    const lon = parseFloat(document.getElementById("longitud-decimal").value);
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error("Por favor ingrese coordenadas válidas.");
    }
    return { lat, lon };
  }

  // Función para cargar puntos desde un archivo JSON y calcular distancias
  async function loadAndFilterPoints(lat, lon, jsonPath) {
    const response = await fetch(jsonPath);
    const data = await response.json();

    const pointsWithDistance = data.features.map(feature => {
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
  }

  // Función para mostrar los puntos más cercanos en el mapa
  async function displayClosestPoints(lat, lon, jsonPath) {
    try {
      const closestPoints = await loadAndFilterPoints(lat, lon, jsonPath);

      // Limpiar marcadores existentes, excepto el marcador del usuario
      map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer !== userMarker) {
          map.removeLayer(layer);
        }
      });

      // Mostrar marcadores para los puntos más cercanos
      closestPoints.forEach(point => {
        const marker = L.marker([point.lat, point.lon], { icon: hexagonIcon }).addTo(map);

        marker.bindPopup(`
          <b>Nomenclatura:</b> ${point.name}<br>
          <b>Altura Nivelada:</b> ${point.hNivelada} m<br>
          <b>Altura Elipsoidal:</b> ${point.hElipsoidal} m<br>
          <b>Distancia:</b> ${point.distance.toFixed(2)} km<br>
          <button class="btn btn-primary" onclick="selectPoint('${point.name}', ${point.lat}, ${point.lon}, ${point.hNivelada}, ${point.hElipsoidal}, ${point.ondulacion})">Seleccionar</button>
        `);

        marker.bindTooltip(point.name, {
          permanent: true,
          direction: "top",
          className: "custom-tooltip",
        });
      });

      map.setView([lat, lon], 10); // Centrar el mapa en la ubicación del usuario
    } catch (err) {
      console.error("Error en displayClosestPoints:", err);
      alert("No se pudieron cargar los puntos cercanos.");
    }
  }

  // Botón "Procesar"
  document.getElementById("procesar").addEventListener("click", async () => {
    try {
      const { lat, lon } = getCoordinates();
      const jsonPath = "grids/nivelados.json";

      if (userMarker) {
        map.removeLayer(userMarker);
      }

      userMarker = L.marker([lat, lon], { icon: hexagonIcon }).addTo(map).bindPopup("Punto ingresado por el usuario").openPopup();
      map.setView([lat, lon], 10);

      await displayClosestPoints(lat, lon, jsonPath);
    } catch (err) {
      console.error("Error al procesar:", err.message);
      alert("Error al procesar: " + err.message);
    }
  });

  // Botón "Calcular Nivelación"
  document.getElementById("calculate-leveling").addEventListener("click", () => {
    try {
      if (selectedPoints.length < 2) {
        throw new Error("Debe seleccionar al menos dos puntos base para realizar el cálculo.");
      }

      const userPoint = {
        hElipsoidal: parseFloat(document.getElementById("altura-elipsoidal").value),
        ondulacion: parseFloat(document.getElementById("ondulacion").value),
      };

      if (isNaN(userPoint.hElipsoidal) || isNaN(userPoint.ondulacion)) {
        throw new Error("Ingrese valores válidos para altura elipsoidal y ondulación.");
      }

      const differences = calculateDifferences(userPoint, selectedPoints);
      console.log("Diferencias Δh:", differences.deltaHi);
      console.log("Diferencias ΔN:", differences.deltaNi);
      console.log("Diferencias ΔH_GPS:", differences.deltaHGPSi);

      // Ajuste por mínimos cuadrados
      const { V, L_corr } = calculateLeastSquares(differences.deltaHGPSi, selectedPoints);
      console.log("Correcciones V:", V);
      console.log("Observaciones corregidas L*:", L_corr);
      
      function calculateCorrectedHeightAvg(L_corr, selectedPoints) {
        if (L_corr.length !== selectedPoints.length) {
          throw new Error("El tamaño de L_corr debe coincidir con el número de puntos base seleccionados.");
        }
      
        // Crear un nuevo vector de alturas corregidas
        const correctedHeights = selectedPoints.map((point, index) => {
          const correctedHeight = point.hNivelada + L_corr[index];
          console.log(`Altura corregida para el punto ${point.name}: ${point.hNivelada} + ${L_corr[index]} = ${correctedHeight}`);
          return correctedHeight;
        });
      
        // Calcular el promedio de las alturas corregidas
        const avgHeight = correctedHeights.reduce((sum, height) => sum + height, 0) / correctedHeights.length;
      
        // Redondear el promedio a 4 decimales y actualizar el campo de la interfaz
        document.getElementById("Altura_Nivelada").value = avgHeight.toFixed(4);
        console.log(`Promedio de las alturas corregidas: ${avgHeight.toFixed(4)}`);
      
        return avgHeight;
      }
      
      // Al finalizar el ajuste por mínimos cuadrados
      const avgHeight = calculateCorrectedHeightAvg(L_corr, selectedPoints);
      document.getElementById("Altura_Nivelada").value = avgHeight.toFixed(4);
    } catch (err) {
      console.error(err);
      alert("Error en el cálculo: " + err.message);
    }
  });
  function constructMatrixB(cLength, n) {
    const B = []; // Matriz B
  
    for (let i = 0; i < cLength; i++) {
      const row = Array(n).fill(0); // Inicializamos una fila con ceros
      row[i] = -1; // Columna correspondiente al primer punto de la resta
      row[i + 1] = 1; // Columna correspondiente al segundo punto de la resta
      B.push(row); // Añadimos la fila a la matriz B
    }
  
    console.log("Matriz B:");
    B.forEach(row => console.log(row));
    return B;
  }
  
  function calculateVectorC(stations) {
    const C = [];
    const calculations = []; // Para registrar las restas realizadas y sus posiciones
  
    // Iterar sobre las estaciones en pares consecutivos
    for (let i = 0; i < stations.length - 1; i++) {
      const currentNivelada = stations[i].hNivelada; // Altura nivelada de la estación actual
      const nextNivelada = stations[i + 1].hNivelada; // Altura nivelada de la estación siguiente
  
      // Calcular la diferencia
      const diferencia = currentNivelada - nextNivelada;
      C.push(diferencia.toFixed(4)); // Guardar en el vector \( C \), redondeado a 4 decimales
  
      // Registrar la resta realizada y las posiciones
      calculations.push({
        resta: `${currentNivelada} (posición ${i}) - ${nextNivelada} (posición ${i + 1})`,
        resultado: diferencia.toFixed(4),
      });
    }
  
    // Mostrar los cálculos realizados
    console.log("Cálculo del Vector C (secuencial):");
    calculations.forEach(calc => {
      console.log(`Resta: ${calc.resta} = ${calc.resultado}`);
    });
  
    return C; // Devolver el vector \( C \)
  }
  
  // Función para calcular ajustes por mínimos cuadrados
  function calculateLeastSquares(deltaHGPSi, stations) {
    const n = stations.length;
  
    if (n < 2) {
      throw new Error("Se requieren al menos dos estaciones para realizar el ajuste por mínimos cuadrados.");
    }
  
    if (deltaHGPSi.some(value => isNaN(value))) {
      throw new Error("Las diferencias ΔH_GPS contienen valores inválidos.");
    }
  
 
    // Vector C
    const C = calculateVectorC(stations); // Llamada para calcular el vector C
     console.log("Vector C:", C); // Imprimir el vector C completo

        // Matriz B
    const B = constructMatrixB(C.length, stations.length); // Construir \( B \) dinámicamente
    console.log("Matriz B Calculada:", B);
    
      console.log("B:", B);
    // Vector L
    const L = deltaHGPSi.map(value => parseFloat(value.toFixed(4)));
    console.log("L", L);
    // Matriz P
    const P = Array(n)
      .fill(0)
      .map((_, i) => {
        return Array(n)
          .fill(0)
          .map((_, j) => (i === j ? 1 : 0));
      });
      console.log("P", P);
    const BL = multiplyMatrixVector(B, L);
    console.log("BL", BL);
    const W = subtractVectors(C, BL);
    console.log("W", W);
    const BPT = multiplyMatrices(B, P);
    console.log("BPT", BPT);
    const BPTB = multiplyMatrices(BPT, transposeMatrix(B));
    console.log("BPTB", BPTB);
    const BPTB_inv = invertMatrix(BPTB);
    console.log("BPTB_inv", BPTB_inv);
  
    const V = multiplyMatrixVector(
      multiplyMatrices(multiplyMatrices(P, transposeMatrix(B)), BPTB_inv),
      W
    );
    console.log("V", V);
    const L_corr = L.map((value, i) => value + V[i]);
    console.log("L_corr", L_corr);
  
    return { V, L_corr, B, C, W };
  }
  

  // Función para calcular diferencias
  function calculateDifferences(userPoint, stations) {
    const { hElipsoidal: hTG13, ondulacion: NTG13 } = userPoint;

    const deltaHi = [];
    const deltaNi = [];
    const deltaHGPSi = [];

    stations.forEach(station => {
      const { hElipsoidal: hElipsoidalStation, ondulacion: NNPi } = station;

      const deltaHiValue = hTG13 - hElipsoidalStation;
      const deltaNiValue = NTG13 - NNPi;
      const deltaHGPSiValue = deltaHiValue - deltaNiValue;

      deltaHi.push(deltaHiValue);
      deltaNi.push(deltaNiValue);
      deltaHGPSi.push(deltaHGPSiValue);
    });

    return { deltaHi, deltaNi, deltaHGPSi };
  }

  // Funciones matemáticas auxiliares para matrices
  function multiplyMatrices(A, B) {
    return A.map(row => B[0].map((_, i) => row.reduce((sum, val, j) => sum + val * B[j][i], 0)));
  }

  function multiplyMatrixVector(A, v) {
    return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
  }

  function subtractVectors(v1, v2) {
    return v1.map((val, i) => val - v2[i]);
  }

  function transposeMatrix(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  function invertMatrix(matrix) {
    return math.inv(matrix); // Requiere math.js
  }
});
