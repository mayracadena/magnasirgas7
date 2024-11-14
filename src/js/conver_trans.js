import RBush from "../../node_modules/rbush/rbush.js";
import Point from "ol/geom/Point.js";
import "ol/ol.css"
import Feature from "ol/Feature.js";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import { fromLonLat, transform } from "ol/proj.js";
import OSM from "ol/source/OSM.js";
import proj4 from "proj4/dist/proj4.js";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import { register } from "ol/proj/proj4.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { get as getProjection } from "ol/proj.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import TopoJSON from "ol/format/TopoJSON.js";

proj4.defs(
  "EPSG:9377",
  "+proj=tmerc +lat_0=4.0 +lon_0=-73.0 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);
register(proj4);
const origen_nacional = getProjection("EPSG:9377");

const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    Projection: "EPSG:4326",
    center: fromLonLat([-73, 4]),
    zoom: 5,
  }),
});

var marcador = new Feature({
  geometry: new Point(fromLonLat([-74.06, 4.62])),
});

var fuenteVectorial = new VectorSource({
  features: [marcador],
});

var capaVecotrial = new VectorLayer({
  source: fuenteVectorial,
});

map.addLayer(capaVecotrial);

function clicSobreMapa(evento) {
  var coordenadas = transform(
    [evento.coordinate[0], evento.coordinate[1]],
    "EPSG:3857",
    "EPSG:9377"
  );
  console.log(coordenadas);
  //console.log(transform([coordenadas], 'EPSG:4326', 'EPSG:9377'))
}

map.on("click", clicSobreMapa);

//prueba geojson
var mapa_municipios = new VectorLayer({
  source: new VectorSource({
    url: "../data/Municipios_agosto_2023.json",
    format: new TopoJSON({
      dataProjection: "EPSG:9377",
      featureProjection: "EPSG:4326",
    }),
  }),
  style:
    /* 
  new Style({
    stroke: new Stroke({
      color: 'black',
    }),
  })
  */
    function (feature) {
      const departamento = feature.get("Depto");
      let color;
      let borde;
      switch (departamento) {
        case "Amazonas":
          color = "rgba(23, 165, 137, 0.5)";
          borde = "rgba(23, 165, 137, 1)";
          break;
        case "Antioquia":
          color = "rgba(243, 156, 18, 0.5)";
          borde = "rgba(243, 156, 18, 1)";
          break;
        case "Arauca":
          color = "rgba(136, 78, 160 , 0.5)";
          borde = "rgba(136, 78, 160 , 1)";
          break;

        case "Atlántico":
          color = "rgba(231, 76, 60 , 0.5)";
          borde = "rgba(231, 76, 60 , 1)";
          break;
        case "Bolívar":
          color = "rgba(39, 174, 96 , 0.5)";
          borde = "rgba(39, 174, 96 , 1)";
          break;
        case "Boyacá":
          color = "rgba(22, 160, 133 , 0.5)";
          borde = "rgba(22, 160, 133 , 1)";
          break;
        case "Caldas":
          color = "rgba(250, 128, 114 , 0.5)";
          borde = "rgba(250, 128, 114 , 1)";
          break;
        case "Caquetá":
          color = "rgba(208, 46, 146 , 0.5)";
          borde = "rgba(208, 46, 146 , 1)";
          break;
        case "Casanare":
          color = "rgba(209, 118, 48 , 0.5)";
          borde = "rgba(209, 118, 48 , 1)";
          break;
        case "Cauca":
          color = "rgba(250, 128, 114 , 0.5)";
          borde = "rgba(250, 128, 114 , 1)";
          break;
        case "Cesar":
          color = "rgba(114, 31, 129 , 0.5)";
          borde = "rgba(114, 31, 129, 1)";
          break;
        case "Chocó":
          color = "rgba(39, 174, 96 , 0.5)";
          borde = "rgba(39, 174, 96 , 1)";
          break;
        case "Cundinamarca":
          color = "rgba(208, 46, 146 , 0.5)";
          borde = "rgba(208, 46, 146 , 1)";
          break;

        case "Córdoba":
          color = "rgba(208, 46, 146 , 0.5)";
          borde = "rgba(208, 46, 146 , 1)";
          break;
        case "Guainía":
          color = "rgba(231, 76, 60 , 0.5)";
          borde = "rgba(231, 76, 60 , 1)";
          break;
        case "Guaviare":
          color = "rgba(39, 174, 96 , 0.5)";
          borde = "rgba(39, 174, 96 , 1)";
          break;
        case "Huila":
          color = "rgba(136, 78, 160 , 0.5)";
          borde = "rgba(136, 78, 160 , 1)";
          break;
        case "La Guajira":
          color = "rgba(209, 118, 48 , 0.5)";
          borde = "rgba(209, 118, 48 , 1)";
          break;
        case "Magdalena":
          color = "rgba(145, 240, 67 , 0.5)";
          borde = "rgba(145, 240, 67   , 1)";
          break;
        case "Meta":
          color = "rgba(243, 156, 18 , 0.5)";
          borde = "rgba(243, 156, 18 , 1)";
          break;
        case "Nariño":
          color = "rgba(231, 76, 60 , 0.5)";
          borde = "rgba(231, 76, 60 , 1)";
          break;
        case "Norte de Santander":
          color = "rgba(231, 76, 60  , 0.5)";
          borde = "rgba(231, 76, 60  , 1)";
          break;
        case "Putumayo":
          color = "rgba(244, 208, 63 , 0.5)";
          borde = "rgba(244, 208, 63 , 1)";
          break;
        case "Quindío":
          color = "rgba(231, 76, 60 , 0.5)";
          borde = "rgba(231, 76, 60 , 1)";
          break;
        case "Risaralda":
          color = "rgba(114, 31, 129 , 0.5)";
          borde = "rgba(114, 31, 129 , 1)";
          break;
        case "San Andrés y Providencia":
          color = "rgba(145, 240, 67 , 0.5)";
          borde = "rgba(145, 240, 67 , 1)";
          break;
        case "Santander":
          color = "rgba(250, 128, 114 , 0.5)";
          borde = "rgba(250, 128, 114 , 1)";
          break;
        case "Sucre":
          color = "rgba(244, 208, 63 , 0.5)";
          borde = "rgba(244, 208, 63  , 1)";
          break;
        case "Tolima":
          color = "rgba(22, 160, 133 , 0.5)";
          borde = "rgba(22, 160, 133 , 1)";
          break;
        case "Valle del Cauca":
          color = "rgba(244, 208, 63, 0.5)";
          borde = "rgba(244, 208, 63 , 1)";
          break;
        case "Vaupés":
          color = "rgba(250, 128, 114 , 0.5)";
          borde = "rgba(250, 128, 114 , 1)";
          break;
        case "Vichada":
          color = "rgba(145, 240, 67 , 0.5)";
          borde = "rgba(145, 240, 67 , 1)";
          break;

        default:
          color = "red";
          borde = "white";
      }
      return new Style({
        fill: new Fill({
          color: color,
        }),
        stroke: new Stroke({
          color: borde,
        }),
      });
    },
});
map.addLayer(mapa_municipios);