import Point from "ol/geom/Point.js";
import { Feature, Map, View } from "ol/index.js";
import TileLayer from "ol/layer/Tile.js";
import { Projection, fromLonLat, transform, addCoordinateTransforms } from "ol/proj.js";
import OSM from "ol/source/OSM.js";
import proj4 from "proj4";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import { register } from "ol/proj/proj4.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { get as getProjection, transformExtent } from "ol/proj.js";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style.js";
import TopoJSON from "ol/format/TopoJSON.js";



proj4.defs(
    "EPSG:9377",
    "+proj=tmerc +lat_0=4.0 +lon_0=-73.0 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
  );
  proj4.defs(
    "EPSG:32618",
    "+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs +type=crs");
  register(proj4);
  const origen_nacional = getProjection("EPSG:9377");

//utm
//       "EPSG:32618": {
//     "proj": '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs',
//     "wkid": 32618,
//     "labLat": "Norte (m)",
//     "labLng": "Este (m)",
//     "labelLat": "1000000.000",
//     "labelLng": "996000.000"
// },

  var coordenadas = transform(
    [-73 ,4 ],
    "EPSG:4326",
    "EPSG:32618"
    
  );
  console.log(coordenadas);