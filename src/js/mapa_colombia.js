

const colores_departamentos = {
  "Amazonas": { color: "rgba(23, 165, 137, 0.5)", border: "rgba(23, 165, 137, 1)" },
  "Antioquia": { color: "rgba(243, 156, 18, 0.5)", border: "rgba(243, 156, 18, 1)" },
  "Arauca": { color: "rgba(136, 78, 160, 0.5)", border: "rgba(136, 78, 160, 1)" },
  "Atlántico": { color: "rgba(231, 76, 60, 0.5)", border: "rgba(231, 76, 60, 1)" },
  "Bolívar": { color: "rgba(39, 174, 96, 0.5)", border: "rgba(39, 174, 96, 1)" },
  "Boyacá": { color: "rgba(22, 160, 133, 0.5)", border: "rgba(22, 160, 133, 1)" },
  "Caldas": { color: "rgba(250, 128, 114, 0.5)", border: "rgba(250, 128, 114, 1)" },
  "Caquetá": { color: "rgba(208, 46, 146, 0.5)", border: "rgba(208, 46, 146, 1)" },
  "Casanare": { color: "rgba(209, 118, 48, 0.5)", border: "rgba(209, 118, 48, 1)" },
  "Cauca": { color: "rgba(250, 128, 114, 0.5)", border: "rgba(250, 128, 114, 1)" },
  "Cesar": { color: "rgba(114, 31, 129, 0.5)", border: "rgba(114, 31, 129, 1)" },
  "Chocó": { color: "rgba(39, 174, 96, 0.5)", border: "rgba(39, 174, 96, 1)" },
  "Cundinamarca": { color: "rgba(208, 46, 146, 0.5)", border: "rgba(208, 46, 146, 1)" },
  "Córdoba": { color: "rgba(208, 46, 146, 0.5)", border: "rgba(208, 46, 146, 1)" },
  "Guainía": { color: "rgba(231, 76, 60, 0.5)", border: "rgba(231, 76, 60, 1)" },
  "Guaviare": { color: "rgba(39, 174, 96, 0.5)", border: "rgba(39, 174, 96, 1)" },
  "Huila": { color: "rgba(136, 78, 160, 0.5)", border: "rgba(136, 78, 160, 1)" },
  "La Guajira": { color: "rgba(209, 118, 48, 0.5)", border: "rgba(209, 118, 48, 1)" },
  "Magdalena": { color: "rgba(145, 240, 67, 0.5)", border: "rgba(145, 240, 67, 1)" },
  "Meta": { color: "rgba(243, 156, 18, 0.5)", border: "rgba(243, 156, 18, 1)" },
  "Nariño": { color: "rgba(231, 76, 60, 0.5)", border: "rgba(231, 76, 60, 1)" },
  "Norte de Santander": { color: "rgba(231, 76, 60, 0.5)", border: "rgba(231, 76, 60, 1)" },
  "Putumayo": { color: "rgba(244, 208, 63, 0.5)", border: "rgba(244, 208, 63, 1)" },
  "Quindío": { color: "rgba(231, 76, 60, 0.5)", border: "rgba(231, 76, 60, 1)" },
  "Risaralda": { color: "rgba(114, 31, 129, 0.5)", border: "rgba(114, 31, 129, 1)" },
  "San Andrés y Providencia": { color: "rgba(145, 240, 67, 0.5)", border: "rgba(145, 240, 67, 1)" },
  "Santander": { color: "rgba(250, 128, 114, 0.5)", border: "rgba(250, 128, 114, 1)" },
  "Sucre": { color: "rgba(244, 208, 63, 0.5)", border: "rgba(244, 208, 63, 1)" },
  "Tolima": { color: "rgba(22, 160, 133, 0.5)", border: "rgba(22, 160, 133, 1)" },
  "Valle del Cauca": { color: "rgba(244, 208, 63, 0.5)", border: "rgba(244, 208, 63, 1)" },
  "Vaupés": { color: "rgba(250, 128, 114, 0.5)", border: "rgba(250, 128, 114, 1)" },
  "Vichada": { color: "rgba(145, 240, 67, 0.5)", border: "rgba(145, 240, 67, 1)" }
};

const colores_regiones = {
  "R1": { color: "rgba(22, 160, 133, 0.5)", border: "rgba(22, 160, 133, 1)" },
  "R2": { color: "rgba(244, 208, 63, 0.5)", border: "rgba(244, 208, 63, 1)" },
  "R3": { color: "rgba(231, 76, 60, 0.5)", border: "rgba(231, 76, 60, 1)" },
  "R4": { color: "rgba(250, 128, 114, 0.5)", border: "rgba(250, 128, 114, 1)" },
  "R5": { color: "rgba(145, 240, 67, 0.5)", border: "rgba(145, 240, 67, 1)" },
  "R6": { color: "rgba(136, 78, 160, 0.5)", border: "rgba(136, 78, 160, 1)" },
  "R7": { color: "rgba(208, 46, 146, 0.5)", border: "rgba(208, 46, 146, 1)" },
  "R8": { color: "rgba(39, 174, 96, 0.5)", border: "rgba(39, 174, 96, 1)" }
}

let map;
const labelLayer = L.layerGroup();
if (!map) {

  const labelLayer = L.layerGroup();

  function style(feature) {
    const departamento = feature.properties.Depto;
    const colors = colores_departamentos[departamento] || { color: "red", border: "white" };

    return {
      fillColor: colors.color,
      color: colors.border,
      weight: 1,
      fillOpacity: 0.5
    };
  }

  function style2(feature) {
    const region = feature.properties.ZONA_TRANS;
    const colors = colores_regiones[region] || { color: "red", border: "white" };

    return {
      fillColor: colors.color,
      color: colors.border,
      weight: 1,
      fillOpacity: 0.5
    };
  }

  function label_nombreMunicipio(feature, layer) {
    const nombreMunicipio = feature.properties.MpNombre;
    const center = layer.getBounds().getCenter();
    const iconWidth = Math.max(50, nombreMunicipio.length * 7);

    // const label = L.marker(center, {
    //   icon: L.divIcon({
    //     className: 'municipio-label',
    //     html: nombreMunicipio,
    //     iconSize: [iconWidth, 20]
    //   })
    // });

    // labelLayer.addLayer(label);
  }

  map = L.map('map').setView([4, -73], 4);

  L.tileLayer.provider('OpenStreetMap.Mapnik', {
    maxZoom: 18,
  }).addTo(map);

  // Cargar el archivo GeoJSON
  fetch('../data/municipios_agosto_2023_simplify.geojson')
    .then(response => response.json())
    .then(geojsonData => {
      L.geoJSON(geojsonData, {
        style: style,
        onEachFeature: function (feature, layer) {
          layer.bindPopup(`Municipio: ${feature.properties.MpNombre}`);
          label_nombreMunicipio(feature, layer);
        }
      }).addTo(map);
    })
    .catch(error => console.error("Error al cargar el archivo GeoJSON:", error));

  function updateLabelVisibility() {
    if (map.getZoom() >= 9) {
      map.addLayer(labelLayer);
    } else {
      map.removeLayer(labelLayer);
    }
  }

  map.on('zoomend', updateLabelVisibility);
  updateLabelVisibility();



}
// Variable global para contar puntos y almacenar sus coordenadas
let puntoCounter = 0;
let allPoints = []; // arreglo para almacenar todas las coordenadas

function agregarPuntoSecuencial(lat, lng) {
  puntoCounter += 1; // Incrementar el contador
  allPoints.push([lat, lng]); // Guardar el punto

  // Crear marcador en la posición especificada
  const marker = L.marker([lat, lng]).addTo(map);

  // Asignar popup con el nombre "Punto {contador}"
  marker.bindPopup(`Punto ${puntoCounter} lat: ${lat.toFixed(3)} long: ${lng.toFixed(3)}`,
    {
      autoClose: false,
      closeOnClick: false
    }).openPopup();

  // Ajustar el mapa para mostrar todos los puntos
  const bounds = L.latLngBounds(allPoints);
  map.fitBounds(bounds);
}

function mapaDepartamentos() {
  if (map) {
    map.remove();
    map = null;
  }
  map = L.map('map').setView([4.5, -74], 4)
  L.tileLayer
    .provider('OpenStreetMap.Mapnik', {
      maxZoom: 18,
    })
    .addTo(map);

  // geojson de zonas 
  fetch('../data/municipios_agosto_2023_simplify.geojson')
  .then(response => response.json())
  .then(geojsonData => {
    L.geoJSON(geojsonData, {
      style: style,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(`Municipio: ${feature.properties.MpNombre}`);
        label_nombreMunicipio(feature, layer);
      }
    }).addTo(map);
  })
  .catch(error => console.error("Error al cargar el archivo GeoJSON:", error));




}

function mapaDatumBogota() {

  if (map) {
    map.remove();
    map = null;
  }

  map = L.map('map').setView([4.5, -74], 4)
  L.tileLayer
    .provider('OpenStreetMap.Mapnik', {
      maxZoom: 18,
    })
    .addTo(map);

  // geojson de zonas 
  fetch('../data/Bogota/Regiones.geojson')
    .then(response => response.json())
    .then(geojsonData => {
      L.geoJSON(geojsonData, {
        style: style2,
        onEachFeature: function (feature, layer) {
          layer.bindPopup(`Nombre: ${feature.properties.ZONA_TRANS}`);
        }
      }).addTo(map);
    })
    .catch(error => console.error("Error cargando otro GeoJSON:", error));

  
}

async function regionTransformacion(lat, lon) {
  try {
    
    const response = await fetch('../data/Magna/Regiones.geojson');
    const geojson = await response.json(); 

    const punto = turf.point([lon, lat]);

    for (const feature of geojson.features) {
      if (turf.booleanPointInPolygon(punto, feature)) {
        console.log('El punto cae en la región:', feature.properties.ZONA_TRANS);
        return feature.properties.ZONA_TRANS; 
      }
    }

   
    console.warn('El punto no se encuentra dentro de ninguna región');
    return null;
  } catch (error) {
    console.error('Error al cargar o procesar regiones.geojson:', error);
    return null;
  }
}






module.exports = { agregarPuntoSecuencial, mapaDatumBogota, mapaDepartamentos, regionTransformacion }