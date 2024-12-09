//el siguiente código es para transformar coordenadas de datum Bogotá a Magna Sirgas
//la transformación de coordenadas se realizará con coordenadas geocentricas

const conexion = require('../db/conexion');
const coord_geocentricas = require("../class/coord_geocentricas");
const coord_curvilineas = require("../class/coord_curvilineas");


async function elipoide(id) {
    var con = new conexion();
    try {
        await con.open();

        var query_elipsoide = "select e.semieje_mayor, e.achatamiento from elipsoide e inner join sistema_referencia sr where sr.id = ?";
        var result_elip = await con.getOne(query_elipsoide, [id]);
        const elipsoide_consultado = new elipsoide_referencia(result_elip.semieje_mayor, result_elip.achatamiento);

        return elipsoide_consultado;
    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }
}


// Función para encontrar el polígono que contiene un punto dado
async function encontrarRegion(cc) {
    try {
        // Cargar el shapefile desde el zip (puede ser una URL pública)
        // shp() devuelve una Promesa con el GeoJSON
        const geojson = await shp(zipUrl);

        // Crear un punto (GeoJSON) con las coord. elipsoidales
        const point = turf.point([cc.lambda, cc.phi]); // Nota: [lon, lat]

        // Verificar las features
        if (geojson && geojson.features) {
            for (let feature of geojson.features) {
                if (feature.geometry && feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                    // Usar Turf para verificar si el punto cae dentro
                    const inside = turf.booleanPointInPolygon(point, feature);
                    if (inside) {
                        return feature;
                    }
                }
            }
        }

        return null; 
    } catch (error) {
        console.error("Error al cargar/analizar el shapefile:", error);
        return null;
    }
}

// Ejemplo de uso con Leaflet
// Suponiendo que tienes un mapa Leaflet inicializado en la variable `map`
async function ejemploUso(cc, zipUrl) {
    const polygonFeature = await encontrarRegion(cc.lambda, cc.phi, zipUrl);
    if (polygonFeature) {
        console.log("El punto está dentro del polígono:", polygonFeature);

        // Opcional: mostrar el polígono en Leaflet
        // Convertir el feature a capa Leaflet
        const polygonLayer = L.geoJSON(polygonFeature).addTo(map);

        // Hacer zoom al polígono
        map.fitBounds(polygonLayer.getBounds());
    } else {
        console.log("El punto no cae dentro de ningún polígono del shapefile.");
    }
}

// Llamar a la función ejemplo (los valores deben ser sustituidos con reales):
// ejemploUso(4.5, -74.1, 'ruta/a/tu/archivo.zip');

var cc = new coord_curvilineas(4,-73, 0);
ejemploUso(cc, '../data/Regiones.zip');
