// import Point from "../../node_modules/ol/geom/Point.js";
// import { Feature, Map, View } from "../../node_modules/ol/index.js";
// import TileLayer from "../../node_modules/ol/layer/Tile.js";
// import { Projection, fromLonLat, transform, addCoordinateTransforms, get as getProjection, transformExtent, addProjection } from "../../node_modules/ol/proj.js";
// import OSM from "../../node_modules/ol/source/OSM.js";
// import proj4 from "../../node_modules/proj4/lib/index.js";
// import VectorSource from "../../node_modules/ol/source/Vector.js";
// import VectorLayer from "../../node_modules/ol/layer/Vector.js";
// import { register } from "../../node_modules/ol/proj/proj4.js";
// import GeoJSON from "../../node_modules/ol/format/GeoJSON.js";
// import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "../../node_modules/ol/style.js";
// import TopoJSON from "../../node_modules/ol/format/TopoJSON.js";

const proj4 = window.proj4;
const register = window.register;
const transform = window.transform;


const elipsoide_referencia = require("../class/elipsoide_referencia.js");
const CTM12 = require("../class/CTM12.js");
const coord_utm = require("../class/UTM.js");
const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const fs = require('fs');
const conexion = require('../db/conexion.js');
const coord_geocentricas = require("../class/coord_geocentricas.js");



//funcion que llama el elipoide de referencia segun el datum escogido
async function elipoide(id) {
  var con = new conexion();
  try {
    await con.open();

    var query_elipsoide = "select e.semieje_mayor, e.achatamiento from elipsoide e inner join sistema_referencia sr on e.id = sr.fk_elipsoide where sr.id = ?";
    var result_elip = await con.getOne(query_elipsoide, [id]);
    const elipsoide_consultado = new elipsoide_referencia(result_elip.semieje_mayor, result_elip.achatamiento);

    return elipsoide_consultado;
  } catch (error) {
    console.error("Ocurrió un error:", error);
  } finally {
    await con.close();
  }
}

//uso con libreria
async function utm_a_curvilineas(c_utm, sist_refe_entrada, sist_refe_salida) {
  var utm = new coord_utm(c_utm.norte, c_utm.este, c_utm.huso);
  var norte = utm.norte - utm.falso_norte;
  var este = utm.este;
  var huso = utm.huso;
  //llamar valores del sistema de referencia
  var elip = await elipoide(sist_refe_entrada);
  var elip2 = await elipoide(sist_refe_salida);
  proj4.defs(
    "hayford",
    "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs"
  );
  proj4.defs(
    "EPSG:32618",
    "+proj=utm +zone=" + huso + " +datum=WGS84 +units=m +no_defs +type=crs");
  proj4.defs(
    "EPSG:21818",
    "+proj=utm +zone=" + huso + "+ellps=intl +towgs84=307,304,-318,0,0,0,0 +units=m +no_defs +type=crs");

  //proj4Module.register(proj4);
  //si es datum bogota con salida en datum bogota
  var coordenadas;
  if (sist_refe_entrada === 1 && sist_refe_salida === 1) {
    coordenadas = proj4("EPSG:21818", "hayford", [este, norte]);
  } else if (sist_refe_entrada === 1 && sist_refe_salida === 2) {
    coordenadas = proj4("EPSG:21818", "EPSG:4326", [este, norte]);
  } else if (sist_refe_entrada === 2 && sist_refe_salida === 1) {
    coordenadas = proj4("EPSG:32618", "hayford", [este, norte]);
  } else {
    coordenadas = proj4("EPSG:32618", "EPSG:4326", [este, norte]);
  }

  var coord_elip = new coord_curvilineas(coordenadas[1], coordenadas[0]);
  console.log(coord_elip)

  return coord_elip;
}



async function planas_cartesianas_a_curvilienas(coordenadas_planas, id_pc, sist_refe_salida) {
  var con = new conexion();
  var cp = new coord_planas(coordenadas_planas.norte, coordenadas_planas.este);

  // Traer información de las coordenadas planas al hacer la conversión
  try {
    await con.open();
    var query_origen = "select * from origen_cartografico where id = ?";
    var parametros = [id_pc];
    var result_origen = await con.getOne(query_origen, parametros);
    var oc = new coord_planas_cartesianas(result_origen.id, result_origen.fk_sistema, result_origen.detalle, result_origen.anio, result_origen.fk_corregimiento, result_origen.fk_municipio, result_origen.latitud, result_origen.longitud, result_origen.norte, result_origen.este, result_origen.plano_proyeccion, result_origen.descripcion, result_origen.oficial);

    var query_elipsoide_referencia = "select e.semieje_mayor, e.achatamiento from sistema_referencia sr inner join elipsoide e on e.id = sr.fk_elipsoide where sr.id = ?";
    var result_elip = await con.getOne(query_elipsoide_referencia, [result_origen.fk_sistema]);
    var elip = new elipsoide_referencia(result_elip.semieje_mayor, result_elip.achatamiento);
  } catch (error) {
    console.error("Ocurrió un error al consultar la base de datos:", error);
    return;  // Salir de la función si ocurre un error en la base de datos
  } finally {
    await con.close();
  }

  try {

    proj4.defs("hayford", "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs");
    proj4.defs("planascolombia1",
      "+proj=tmerc +lat_0=" + oc.latitud + " +lon_0=" + oc.longitud + " +k=1 +x_0=" + oc.feste + " +y_0=" + oc.fnorte + " +ellps=intl +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("planascolombia2",
      "+proj=tmerc +lat_0=" + oc.latitud + " +lon_0=" + oc.longitud + " +k=1 +x_0=" + oc.feste + " +y_0=" + oc.fnorte + " +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

    //proj4Module.register(proj4);

    let coordenadas;
    if (sist_refe_salida === 1 && oc.fk_sistema === 1) {
      coordenadas = proj4("planascolombia1", "hayford", [cp.este, cp.norte]);
    } else if (sist_refe_salida === 2 && oc.fk_sistema === 1) {
      coordenadas = proj4("planascolombia1", "EPSG:4326", [cp.este, cp.norte]);
    } else if (sist_refe_salida === 1 && oc.fk_sistema === 2) {
      coordenadas = proj4("planascolombia2", "hayford", [cp.este, cp.norte]);
    } else {
      coordenadas = proj4("planascolombia2", "EPSG:4326", [cp.este, cp.norte]);
    }

    var coord_elip = new coord_curvilineas(coordenadas[1], coordenadas[0]);
    console.log("Coordenadas curvilíneas:", coord_elip);
    console.log("Coordenadas de proyeccion :", coordenadas);
    return coord_elip

  } catch (error) {
    console.error("Error en la configuración de proyecciones o en la transformación de coordenadas:", error);
  }
}

async function origen_nacional_a_curvilienas(coord_on, sist_refe_entrada, sist_refe_salida) {
  var ctm = new CTM12();
  var cp = new coord_planas(coord_on.norte, coord_on.este);


  proj4.defs(
    "EPSG:9377",
    "+proj=tmerc +lat_0=" + ctm.phi0 + " +lon_0=" + ctm.landa0 + " +k=" + ctm.k + " +x_0=" + ctm.E0 + " +y_0=" + ctm.N0 + " +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
  );
  //se definio temporalmente es origen nacional pero con el elipsoide de hayford
  proj4.defs(
    "EPSG:9378",
    "+proj=tmerc +lat_0=4.0 +lon_0=-73.0 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=intl +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
  );
  proj4.defs("hayford", "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs");
  //proj4Module.register(proj4);
  var coordenadas;
  //si es datum bogota con salida en datum bogota
  if (sist_refe_entrada === 1 && sist_refe_salida === 1) {
    coordenadas = proj4("EPSG:9378", "hayford", [cp.este, cp.norte]);
  } else if (sist_refe_entrada === 1 && sist_refe_salida === 2) {
    coordenadas = proj4("EPSG:9378", "EPSG:4326", [cp.este, cp.norte]);
  } else if (sist_refe_entrada === 2 && sist_refe_salida === 1) {
    coordenadas = proj4("EPSG:9377", "hayford", [cp.este, cp.norte]);
  } else {
    coordenadas = proj4("EPSG:9377", "EPSG:4326", [cp.este, cp.norte]);
  }
  var coord_elip = new coord_curvilineas(coordenadas[1], coordenadas[0]);
  console.log("Coordenadas curvilíneas:", coord_elip);
  return coord_elip
}



async function geocentricas_a_curvilineas(coord_geoc, sist_refe_entrada, sist_refe_salida) {
  var geo = new coord_geocentricas(coord_geoc.X, coord_geoc.Y, coord_geoc.Z);
  proj4.defs("hayford", "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs");
  proj4.defs("EPSG:4978", "+proj=geocent +ellps=GRS80 +units=m +no_defs");
  //Creado temporalmente para usar el elipsoide de hayford origen bogota
  proj4.defs("EPSG:4979", "+proj=geocent +ellps=intl +units=m +no_defs");
  register(proj4);
  var coordenadas;
  if (sist_refe_entrada == 1 && sist_refe_salida == 1) {
    coordenadas = transform([geo.X, geo.Y, geo.Z],
      "EPSG:4979",
      "hayford"
    )
    //si es datum bogota con salida datum magna
  } else if (sist_refe_entrada == 1 && sist_refe_salida == 2) {
    coordenadas = transform([geo.X, geo.Y, geo.Z],
      "EPSG:4979",
      "EPSG:4326"
    )
    //si es datum magna con salida datum bogota
  } else if (sist_refe_entrada == 2 && sist_refe_salida == 1) {
    coordenadas = transform([geo.X, geo.Y, geo.Z],
      "EPSG:4978",
      "hayford"
    )

  } else {
    coordenadas = transform([geo.X, geo.Y, geo.Z],
      "EPSG:4978",
      "EPSG:4326"
    )
  }


  var coord_elip = new coord_curvilineas(coordenadas[1], coordenadas[0], coordenadas[2]);
  console.log(coord_elip);

  return coord_elip;
}

async function curvilienas_a_planas_cartesianas(coord_curvi, id_pc, sist_refe_salida) {

  var cc = new coord_curvilineas(coord_curvi.phi, coord_curvi.lambda);

  var con = new conexion();
  try {
    await con.open();
    //traer todos los datos del origen cartografico
    var query_origen = "select * from origen_cartografico where id = ?";
    var parametros = [id_pc];
    var result_origen = await con.getOne(query_origen, parametros);
    var oc = new coord_planas_cartesianas(result_origen.id, result_origen.fk_sistema, result_origen.detalle, result_origen.anio, result_origen.fk_corregimiento, result_origen.fk_municipio, result_origen.latitud, result_origen.longitud, result_origen.norte, result_origen.este, result_origen.plano_proyeccion, result_origen.descripcion, result_origen.oficial);

  } catch (error) {
    console.error("Ocurrió un error:", error);
  } finally {
    await con.close();
  }

  try {

    proj4.defs("hayford", "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs");
    proj4.defs("planascolombia1",
      "+proj=tmerc +lat_0=" + oc.latitud + " +lon_0=" + oc.longitud + " +k=1 +x_0=" + oc.feste + " +y_0=" + oc.fnorte + " +ellps=intl +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("planascolombia2",
      "+proj=tmerc +lat_0=" + oc.latitud + " +lon_0=" + oc.longitud + " +k=1 +x_0=" + oc.feste + " +y_0=" + oc.fnorte + " +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

    //proj4Module.register(proj4);

    var coordenadas;
    //sist_refe= 1 datum bogota 
    //sist_refe = 2 datum magna 
    if (sist_refe_salida == 1 && oc.fk_sistema == 1) {
      coordenadas = transform([cc.lambda, cc.phi], "hayford", "planascolombia1");
    } else if (sist_refe_salida == 2 && oc.fk_sistema == 1) {
      coordenadas = transform([cc.lambda, cc.phi], "EPSG:4326", "planascolombia1");
    } else if (sist_refe_salida == 1 && oc.fk_sistema == 2) {
      coordenadas = transform([cc.lambda, cc.phi], "hayford", "planascolombia2");
    } else {
      coordenadas = transform([cc.lambda, cc.phi], "EPSG:4326", "planascolombia2");
    }

    // var c9 = new coord_planas(coordenadas[1], coordenadas[0]);
    console.log("Coordenadas curvilíneas:", coordenadas);
    // return coord_elip

  } catch (error) {
    console.error("Error en la configuración de proyecciones o en la transformación de coordenadas:", error);
  }
}

// var cp = new coord_planas(85751.864, 94803.436);
// planas_cartesianas_a_curvilienas(cp, 1106, 2)

// var cutm = new coord_utm(774218.962, 720945.889, 18);
// utm_a_curvilineas(cutm, 2, 2);

//  var on = new coord_planas(2033154.021, 4966724.022);
//  origen_nacional_a_curvilienas(on, 2, 2 );

// var geo = new coord_geocentricas(1860857.8789, -6086591.8657, 442084.6182)
// geocentricas_a_curvilineas(geo, 2, 2)

// var cc = new coord_curvilineas(4.4673476317148735, -74.1243491172994);
// curvilienas_a_planas_cartesianas(cc, 1106, 2);


