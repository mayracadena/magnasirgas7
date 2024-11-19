

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

function label_nombreMunicipio(feature, layer) {
    const nombreMunicipio = feature.properties.MpNombre;
  
    const center = layer.getBounds().getCenter();
    const iconWidth = Math.max(50, nombreMunicipio.length * 7);
   
    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'municipio-label',
        html: nombreMunicipio,
        iconSize: [iconWidth, 20] 
      })
    });
  
   
    labelLayer.addLayer(label);
  }

const map = L.map('map').setView([4, -73], 5);

L.tileLayer.provider('OpenStreetMap.Mapnik', {
    maxZoom: 18,
}).addTo(map);


// Cargar el archivo Shapefile desde un archivo .zip y agregarlo al mapa
fetch('../data/Servicio-610.zip') 
  .then(response => response.arrayBuffer())
  .then(buffer => {
    L.shapefile(buffer, {
      style: style, // Aplicar la función de estilo
      onEachFeature: function (feature, layer) {
        
        // layer.bindPopup(`Municipio: ${feature.properties.MpNombre}`);
        label_nombreMunicipio(feature, layer)
      }
    }).addTo(map);
  })
  .catch(error => console.error("Error al cargar el archivo Shapefile:", error));


  function updateLabelVisibility() {
    if (map.getZoom() >= 9) { // Cambia 10 por el nivel de zoom deseado
      map.addLayer(labelLayer); // Mostrar etiquetas
    } else {
      map.removeLayer(labelLayer); // Ocultar etiquetas
    }
  }
  
  // Llamar a la función al iniciar y cada vez que cambie el nivel de zoom
  map.on('zoomend', updateLabelVisibility);
  updateLabelVisibility(); // Llamada inicial