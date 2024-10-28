

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'images/marker-icon-2x.png',
    iconUrl: 'images/marker-icon.png',
    shadowUrl: 'images/marker-shadow.png',
});

// Inicializar el mapa
var map = L.map('map').setView([4.570868, -74.297333], 5);

// Agregar la capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    // attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);




// Cargar y agregar el archivo TopoJSON
fetch('../data/Municipios_agosto_2023.json')
    .then(function (response) {
        return response.json();
    })
    .then(function (topoData) {
        // Reemplaza 'YOUR_OBJECT_NAME' con el nombre real del objeto en tu TopoJSON
       
        var geojsonData = topojson.feature(topoData, topoData.objects.Municipios_agosto_2023);
       
        console.log(geojsonData)

        // Agregar la capa GeoJSON al mapa
        // L.geoJSON(geojsonData, {
        //     style: function (feature) {
        //         var departamento = feature.properties.Depto;
        //         var color, borde;

        //         // Asignar colores según el departamento
        //         switch (departamento) {
        //             case 'Amazonas':
        //                 color = 'rgba(23, 165, 137, 0.5)';
        //                 borde = 'rgba(23, 165, 137, 1)';
        //                 break;
        //             case "Antioquia":
        //                 color = "rgba(243, 156, 18, 0.5)";
        //                 borde = "rgba(243, 156, 18, 1)";
        //                 break;
        //             case "Arauca":
        //                 color = "rgba(136, 78, 160 , 0.5)";
        //                 borde = "rgba(136, 78, 160 , 1)";
        //                 break;

        //             case "Atlántico":
        //                 color = "rgba(231, 76, 60 , 0.5)";
        //                 borde = "rgba(231, 76, 60 , 1)";
        //                 break;
        //             case "Bolívar":
        //                 color = "rgba(39, 174, 96 , 0.5)";
        //                 borde = "rgba(39, 174, 96 , 1)";
        //                 break;
        //             case "Boyacá":
        //                 color = "rgba(22, 160, 133 , 0.5)";
        //                 borde = "rgba(22, 160, 133 , 1)";
        //                 break;
        //             case "Caldas":
        //                 color = "rgba(250, 128, 114 , 0.5)";
        //                 borde = "rgba(250, 128, 114 , 1)";
        //                 break;
        //             case "Caquetá":
        //                 color = "rgba(208, 46, 146 , 0.5)";
        //                 borde = "rgba(208, 46, 146 , 1)";
        //                 break;
        //             case "Casanare":
        //                 color = "rgba(209, 118, 48 , 0.5)";
        //                 borde = "rgba(209, 118, 48 , 1)";
        //                 break;
        //             case "Cauca":
        //                 color = "rgba(250, 128, 114 , 0.5)";
        //                 borde = "rgba(250, 128, 114 , 1)";
        //                 break;
        //             case "Cesar":
        //                 color = "rgba(114, 31, 129 , 0.5)";
        //                 borde = "rgba(114, 31, 129, 1)";
        //                 break;
        //             case "Chocó":
        //                 color = "rgba(39, 174, 96 , 0.5)";
        //                 borde = "rgba(39, 174, 96 , 1)";
        //                 break;
        //             case "Cundinamarca":
        //                 color = "rgba(208, 46, 146 , 0.5)";
        //                 borde = "rgba(208, 46, 146 , 1)";
        //                 break;

        //             case "Córdoba":
        //                 color = "rgba(208, 46, 146 , 0.5)";
        //                 borde = "rgba(208, 46, 146 , 1)";
        //                 break;
        //             case "Guainía":
        //                 color = "rgba(231, 76, 60 , 0.5)";
        //                 borde = "rgba(231, 76, 60 , 1)";
        //                 break;
        //             case "Guaviare":
        //                 color = "rgba(39, 174, 96 , 0.5)";
        //                 borde = "rgba(39, 174, 96 , 1)";
        //                 break;
        //             case "Huila":
        //                 color = "rgba(136, 78, 160 , 0.5)";
        //                 borde = "rgba(136, 78, 160 , 1)";
        //                 break;
        //             case "La Guajira":
        //                 color = "rgba(209, 118, 48 , 0.5)";
        //                 borde = "rgba(209, 118, 48 , 1)";
        //                 break;
        //             case "Magdalena":
        //                 color = "rgba(145, 240, 67 , 0.5)";
        //                 borde = "rgba(145, 240, 67   , 1)";
        //                 break;
        //             case "Meta":
        //                 color = "rgba(243, 156, 18 , 0.5)";
        //                 borde = "rgba(243, 156, 18 , 1)";
        //                 break;
        //             case "Nariño":
        //                 color = "rgba(231, 76, 60 , 0.5)";
        //                 borde = "rgba(231, 76, 60 , 1)";
        //                 break;
        //             case "Norte de Santander":
        //                 color = "rgba(231, 76, 60  , 0.5)";
        //                 borde = "rgba(231, 76, 60  , 1)";
        //                 break;
        //             case "Putumayo":
        //                 color = "rgba(244, 208, 63 , 0.5)";
        //                 borde = "rgba(244, 208, 63 , 1)";
        //                 break;
        //             case "Quindío":
        //                 color = "rgba(231, 76, 60 , 0.5)";
        //                 borde = "rgba(231, 76, 60 , 1)";
        //                 break;
        //             case "Risaralda":
        //                 color = "rgba(114, 31, 129 , 0.5)";
        //                 borde = "rgba(114, 31, 129 , 1)";
        //                 break;
        //             case "San Andrés y Providencia":
        //                 color = "rgba(145, 240, 67 , 0.5)";
        //                 borde = "rgba(145, 240, 67 , 1)";
        //                 break;
        //             case "Santander":
        //                 color = "rgba(250, 128, 114 , 0.5)";
        //                 borde = "rgba(250, 128, 114 , 1)";
        //                 break;
        //             case "Sucre":
        //                 color = "rgba(244, 208, 63 , 0.5)";
        //                 borde = "rgba(244, 208, 63  , 1)";
        //                 break;
        //             case "Tolima":
        //                 color = "rgba(22, 160, 133 , 0.5)";
        //                 borde = "rgba(22, 160, 133 , 1)";
        //                 break;
        //             case "Valle del Cauca":
        //                 color = "rgba(244, 208, 63, 0.5)";
        //                 borde = "rgba(244, 208, 63 , 1)";
        //                 break;
        //             case "Vaupés":
        //                 color = "rgba(250, 128, 114 , 0.5)";
        //                 borde = "rgba(250, 128, 114 , 1)";
        //                 break;
        //             case "Vichada":
        //                 color = "rgba(145, 240, 67 , 0.5)";
        //                 borde = "rgba(145, 240, 67 , 1)";
        //                 break;
        //             default:
        //                 color = 'red';
        //                 borde = 'white';
        //         }

        //         return {
        //             fillColor: color,
        //             color: borde,
        //             //weight: 1,
        //             fillOpacity: 0.5,
        //         };
        //     }
        // }).addTo(map);
    })
    .catch(function (error) {
        console.error('Error al cargar el archivo TopoJSON:', error);
    });