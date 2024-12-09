const proj4 = window.proj4;
const register = window.register;
const transform = window.transform;


const elipsoide_referencia = require("../class/elipsoide_referencia.js");
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
async function utm_a_curvilineas(c_utm, hemisferio, sist_refe_entrada, sist_refe_salida) {
  var utm = new coord_utm(c_utm.norte, c_utm.este, c_utm.h, c_utm.huso);
  var norte = utm.norte - (hemisferio === 'S' ? 10000000 : 0);
  var este = utm.este;
  var huso = utm.huso;

  proj4.defs(
    "hayford",
    "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs"
  );
  proj4.defs(
    "wgs_84_utm_generico",
    "+proj=utm +zone=" + huso + (hemisferio === 'S' ? " +south" : "") + " +datum=WGS84 +units=m +no_defs +type=crs"
  );
  proj4.defs(
    "hayford_utm_generico",
    "+proj=utm +zone=" + huso + (hemisferio === 'S' ? " +south" : "") + " +ellps=intl +towgs84=307,304,-318,0,0,0,0 +units=m +no_defs +type=crs"
  );

  var coordenadas;
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("hayford_utm_generico", "hayford", [este, norte]);
  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {
    coordenadas = proj4("hayford_utm_generico", "EPSG:4326", [este, norte]);
  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("wgs_84_utm_generico", "hayford", [este, norte]);
  } else {
    coordenadas = proj4("wgs_84_utm_generico", "EPSG:4326", [este, norte]);
  }

  var coord_elip = new coord_curvilineas(coordenadas[1], coordenadas[0], utm.h );
  console.log(coord_elip);

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
    if (sist_refe_salida == 'datumBogotaLlegada' && oc.fk_sistema == 1) {
      coordenadas = proj4("planascolombia1", "hayford", [cp.este, cp.norte]);
    } else if (sist_refe_salida == 'magnaSIRGASLlegada' && oc.fk_sistema == 1) {
      coordenadas = proj4("planascolombia1", "EPSG:4326", [cp.este, cp.norte]);
    } else if (sist_refe_salida == 'datumBogotaLlegada' && oc.fk_sistema == 2) {
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
  var cp = new coord_planas(coord_on.norte, coord_on.este, coord_on.h);


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
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("EPSG:9378", "hayford", [cp.este, cp.norte]);
  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {
    coordenadas = proj4("EPSG:9378", "EPSG:4326", [cp.este, cp.norte]);
  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("EPSG:9377", "hayford", [cp.este, cp.norte]);
  } else {
    coordenadas = proj4("EPSG:9377", "EPSG:4326", [cp.este, cp.norte]);
  }
  var coord_elip = new coord_curvilineas(coordenadas[1], coordenadas[0], coord_on.h);
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
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = transform([geo.X, geo.Y, geo.Z],
      "EPSG:4979",
      "hayford"
    )
    //si es datum bogota con salida datum magna
  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {
    coordenadas = transform([geo.X, geo.Y, geo.Z],
      "EPSG:4979",
      "EPSG:4326"
    )
    //si es datum magna con salida datum bogota
  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {
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


async function gauss_kruger_a_curvilineas(coord_pgk, origen, sist_refe_entrada, sist_refe_salida) {
  var c_pgk = new coord_planas(coord_pgk.norte, coord_pgk.este);
  proj4.defs("hayford", "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs");
  //Oeste
  proj4.defs("EPSG:3115", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-77.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Oeste Oeste
  proj4.defs("EPSG:3114", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-80.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Bogotá
  proj4.defs("EPSG:3116", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-74.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Este Central
  proj4.defs("EPSG:3117", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-71.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Este Este
  proj4.defs("EPSG:3118", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-68.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Insular
  proj4.defs("EPSG:3119", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-83.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")

  //datum bogota 

  //esta seccion se debe entrar a revision, ya que se plantean unos parametros de transformacion que se desconocen el motivo


  //Oeste Oeste
  proj4.defs("EPSG:21894", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-80.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=221.899,274.136,-397.554,-2.80844591036278,0.44850858891268,2.81017234679107,-2.199943 +units=m +no_defs");
  //Oeste
  proj4.defs("EPSG:21896", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-77.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=307,304,-318,0,0,0,0 +units=m +no_defs");

  //Bogotá
  proj4.defs("EPSG:21897", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-74.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=307,304,-318,0,0,0,0 +units=m +no_defs");
  //Este Central
  proj4.defs("EPSG:21898", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-71.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=307,304,-318,0,0,0,0 +units=m +no_defs");
  //Este Este
  proj4.defs("EPSG:21899", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-68.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=221.899,274.136,-397.554,-2.80844591036278,0.44850858891268,2.81017234679107,-2.199943 +units=m +no_defs");
  //insular
  proj4.defs("EPSG:21900", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-83.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");


  //esta seccion se debe modificar 
  var coordenadas;
  //si es datum bogota con salida en datum bogota
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {

    switch (origen) {
      case 'Bogotá':
        coordenadas = proj4("EPSG:21897", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Este Central':
        coordenadas = proj4("EPSG:21898", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Este Este':
        coordenadas = proj4("EPSG:21899", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Oeste':
        coordenadas = proj4("EPSG:21896", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Oeste Oeste':
        coordenadas = proj4("EPSG:21894", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Insular':
        coordenadas = proj4("EPSG:21900", "hayford", [c_pgk.este, c_pgk.norte]);
        break


    }


  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {


    switch (origen) {
      case 'Bogotá':
        coordenadas = proj4("EPSG:21897", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Este Central':
        coordenadas = proj4("EPSG:21898", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Este Este':
        coordenadas = proj4("EPSG:21899", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Oeste':
        coordenadas = proj4("EPSG:21896", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Oeste Oeste':
        coordenadas = proj4("EPSG:21894", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Insular':
        coordenadas = proj4("EPSG:21900", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break


    }


  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {


    switch (origen) {
      case 'Bogotá':
        coordenadas = proj4("EPSG:3116", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Este Central':
        coordenadas = proj4("EPSG:3117", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Este Este':
        coordenadas = proj4("EPSG:3118", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Oeste':
        coordenadas = proj4("EPSG:3115", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Oeste Oeste':
        coordenadas = proj4("EPSG:3114", "hayford", [c_pgk.este, c_pgk.norte]);
        break
      case 'Insular':
        coordenadas = proj4("EPSG:3119", "hayford", [c_pgk.este, c_pgk.norte]);
        break


    }



  } else {

    switch (origen) {
      case 'Bogotá':
        coordenadas = proj4("EPSG:3116", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Este Central':
        coordenadas = proj4("EPSG:3117", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Este Este':
        coordenadas = proj4("EPSG:3118", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Oeste':
        coordenadas = proj4("EPSG:3115", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Oeste Oeste':
        coordenadas = proj4("EPSG:3114", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break
      case 'Insular':
        coordenadas = proj4("EPSG:3119", "EPSG:4326", [c_pgk.este, c_pgk.norte]);
        break

    }

  }
  var coord_elip = new coord_curvilineas(coordenadas[1], coordenadas[0]);
  console.log("Coordenadas curvilíneas:", coord_elip);
  return coord_elip


}


async function curvilienas_a_planas_cartesianas(coord_curvi, id_pc, sist_refe_salida) {

  var cc = new coord_curvilineas(coord_curvi.phi, coord_curvi.lambda, coord_cc.h);

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
    if (sist_refe_salida == 'datumBogotaLlegada' && oc.fk_sistema == 1) {
      coordenadas = transform([cc.lambda, cc.phi], "hayford", "planascolombia1");
    } else if (sist_refe_salida == 'magnaSIRGASLlegada' && oc.fk_sistema == 1) {
      coordenadas = transform([cc.lambda, cc.phi], "EPSG:4326", "planascolombia1");
    } else if (sist_refe_salida == 'datumBogotaLlegada' && oc.fk_sistema == 2) {
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

async function curvilienas_a_curvilienas(c_cc, sist_refe_entrada, sist_refe_salida) {

  var cc = new coord_curvilineas(c_cc.phi, c_cc.lambda, c_cc.h);

  proj4.defs("hayford", "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs");


  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = [cc.lambda, cc.phi];
  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {
    coordenadas = proj4("hayford", "EPSG:4326", [cc.lambda, cc.phi]);
  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("EPSG:4326", "hayford", [cc.lambda, cc.phi]);
  } else {
    coordenadas = [cc.lambda, cc.phi];
  }

  var coord_elip = new coord_curvilineas(coordenadas[1], coordenadas[0]);
  console.log("Coordenadas curvilíneas:", coord_elip);
  return coord_elip

}


async function curvilienas_a_origen_nacional(coord_cc, sist_refe_entrada, sist_refe_salida) {
  var ctm = new CTM12();
  var c_cc = new coord_curvilineas(coord_cc.phi, coord_cc.lambda, coord_cc.h);


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
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("hayford", 'EPSG:9378'[c_cc.lambda, c_cc.phi]);
  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {
    coordenadas = proj4("hayford", "EPSG:9377", [c_cc.lambda, c_cc.phi]);
  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("EPSG:4326", "EPSG:9378", [c_cc.lambda, c_cc.phi]);
  } else {
    coordenadas = proj4("EPSG:4326", "EPSG:9377", [c_cc.lambda, c_cc.phi]);
  }
  var c_p = new coord_planas(coordenadas[1], coordenadas[0])
  console.log("Coordenadas curvilíneas:", c_p);
  return c_p
}


async function curvilineas_a_utm(coord_cc, sist_refe_entrada, sist_refe_salida) {

  var c_cc = new coord_curvilineas(coord_cc.phi, coord_cc.lambda, coord_cc.h);

  //determinación del huso
  const huso = Math.floor((c_cc.lambda + 180) / 6) + 1;

  //determinación del hemisferios
  const hemisferio = c_cc.phi >= 0 ? "N" : "S";
  const datum = sist_refe_salida === 'datumBogotaLlegada' ? "intl" : "WGS84";

  //se pone condicion de si es hemisferio sur para poner en la cadena de la proyeccion, en caso de ser del hemisferio norte no se debe poner nada
  proj4.defs('utm_generico', `+proj=utm +zone=${huso} +datum=${datum} +units=m +no_defs ${hemisferio === "S" ? " +south" : ""}`);
  proj4.defs(
    "hayford",
    "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs"
  );

  //proj4Module.register(proj4);
  //si es datum bogota con salida en datum bogota
  var coordenadas;
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("hayford", "utm_generico", [c_cc.lambda, c_cc.phi]);
  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {
    coordenadas = proj4("hayford", "utm_generico", [c_cc.lambda, c_cc.phi]);
  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("EPSG:4326", "utm_generico", [c_cc.lambda, c_cc.phi]);
  } else {
    coordenadas = proj4("EPSG:4326", "utm_generico", [c_cc.lambda, c_cc.phi]);
  }

  var utm_gen = new coord_utm(coordenadas[1], coordenadas[0], c_cc.h, huso);
 console.log("información utm", utm_gen)
  return utm_gen;
}


async function curvilineas_a_geocentricas(coord_cc, sist_refe_entrada, sist_refe_salida) {


  var c_cc = new coord_curvilineas(coord_cc.phi, coord_cc.lambda, coord_cc.h);



  proj4.defs("hayford", "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs");
  proj4.defs("EPSG:4978", "+proj=geocent +ellps=GRS80 +units=m +no_defs");
  //Creado temporalmente para usar el elipsoide de hayford origen bogota
  proj4.defs("EPSG:4979", "+proj=geocent +ellps=intl +units=m +no_defs");
  register(proj4);
  var coordenadas;
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = transform([c_cc.lambda, c_cc.phi, c_cc.h],
       "hayford",
       "EPSG:4979"
    )
    //si es datum bogota con salida datum magna
  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {
    coordenadas = transform([c_cc.lambda, c_cc.phi, c_cc.h],
      "EPSG:4326",
      "EPSG:4979"
      
    )
    //si es datum magna con salida datum bogota
  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = transform([c_cc.lambda, c_cc.phi, c_cc.h],
      "hayford",
      "EPSG:4978"
      
    )

  } else {
    coordenadas = transform([c_cc.lambda, c_cc.phi, c_cc.h],
      "EPSG:4326",
      "EPSG:4978"
      
    )
  }


   var geo = new coord_geocentricas(coordenadas[0], coordenadas[1],coordenadas[2]);
  console.log(geo)
  return geo;
}

async function curvilineas_a_gauss_kruger(coord_cc, origen, sist_refe_entrada, sist_refe_salida) {
  

  var c_cc = new coord_curvilineas(coord_cc.phi, coord_cc.lambda, coord_cc.h);


  proj4.defs("hayford", "+proj=longlat +ellps=intl +towgs84=307,304,-318,0,0,0,0 +no_defs +type=crs");
  //Oeste
  proj4.defs("EPSG:3115", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-77.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Oeste Oeste
  proj4.defs("EPSG:3114", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-80.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Bogotá
  proj4.defs("EPSG:3116", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-74.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Este Central
  proj4.defs("EPSG:3117", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-71.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Este Este
  proj4.defs("EPSG:3118", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-68.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
  //Insular
  proj4.defs("EPSG:3119", "+proj=tmerc +lat_0=4.59620041666667 +lon_0=-83.0775079166667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")

  //datum bogota 

  //esta seccion se debe entrar a revision, ya que se plantean unos parametros de transformacion que se desconocen el motivo


  //Oeste Oeste
  proj4.defs("EPSG:21894", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-80.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=221.899,274.136,-397.554,-2.80844591036278,0.44850858891268,2.81017234679107,-2.199943 +units=m +no_defs");
  //Oeste
  proj4.defs("EPSG:21896", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-77.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=307,304,-318,0,0,0,0 +units=m +no_defs");

  //Bogotá
  proj4.defs("EPSG:21897", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-74.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=307,304,-318,0,0,0,0 +units=m +no_defs");
  //Este Central
  proj4.defs("EPSG:21898", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-71.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=307,304,-318,0,0,0,0 +units=m +no_defs");
  //Este Este
  proj4.defs("EPSG:21899", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-68.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=221.899,274.136,-397.554,-2.80844591036278,0.44850858891268,2.81017234679107,-2.199943 +units=m +no_defs");
  //insular
  proj4.defs("EPSG:21900", "+proj=tmerc +lat_0=4.59904722222222 +lon_0=-83.0809166666667 +k=1 +x_0=1000000 +y_0=1000000 +ellps=intl +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");


  //esta seccion se debe modificar 
  var coordenadas;
  //si es datum bogota con salida en datum bogota
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {

    switch (origen) {
      case 'Bogotá':
        coordenadas = proj4("hayford","EPSG:21897",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Este Central':
        coordenadas = proj4("hayford","EPSG:21898",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Este Este':
        coordenadas = proj4("hayford","EPSG:21899",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Oeste':
        coordenadas = proj4("hayford","EPSG:21896",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Oeste Oeste':
        coordenadas = proj4("hayford","EPSG:21894",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Insular':
        coordenadas = proj4("hayford","EPSG:21900",  [c_cc.lambda, c_cc.phi]);
        break


    }


  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {


    switch (origen) {
      case 'Bogotá':
        coordenadas = proj4("EPSG:4326","EPSG:21897",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Este Central':
        coordenadas = proj4("EPSG:4326","EPSG:21898",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Este Este':
        coordenadas = proj4( "EPSG:4326","EPSG:21899", [c_cc.lambda, c_cc.phi]);
        break
      case 'Oeste':
        coordenadas = proj4( "EPSG:4326","EPSG:21896", [c_cc.lambda, c_cc.phi]);
        break
      case 'Oeste Oeste':
        coordenadas = proj4("EPSG:4326","EPSG:21894",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Insular':
        coordenadas = proj4("EPSG:4326","EPSG:21900",  [c_cc.lambda, c_cc.phi]);
        break


    }


  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {


    switch (origen) {
      case 'Bogotá':
        coordenadas = proj4("hayford","EPSG:3116",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Este Central':
        coordenadas = proj4( "hayford","EPSG:3117", [c_cc.lambda, c_cc.phi]);
        break
      case 'Este Este':
        coordenadas = proj4("hayford","EPSG:3118",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Oeste':
        coordenadas = proj4("hayford","EPSG:3115",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Oeste Oeste':
        coordenadas = proj4("hayford","EPSG:3114",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Insular':
        coordenadas = proj4("hayford","EPSG:3119",  [c_cc.lambda, c_cc.phi]);
        break


    }



  } else {

    switch (origen) {
      case 'Bogotá':
        coordenadas = proj4("EPSG:4326","EPSG:3116",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Este Central':
        coordenadas = proj4("EPSG:4326","EPSG:3117",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Este Este':
        coordenadas = proj4("EPSG:4326", "EPSG:3118", [c_cc.lambda, c_cc.phi]);
        break
      case 'Oeste':
        coordenadas = proj4("EPSG:4326","EPSG:3115",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Oeste Oeste':
        coordenadas = proj4("EPSG:4326","EPSG:3114",  [c_cc.lambda, c_cc.phi]);
        break
      case 'Insular':
        coordenadas = proj4("EPSG:4326","EPSG:3119",  [c_cc.lambda, c_cc.phi]);
        break

    }

  }


  var c_pgk = new coord_planas(coordenadas[1], coordenadas[0]);
 
  console.log("Coordenadas curvilíneas:", c_pgk);
  return c_pgk


}

async function origen_nacional_a_origen_nacional(coord_on, sist_refe_entrada, sist_refe_salida) {

  var ctm = new CTM12();
  var cp = new coord_planas(coord_on.norte, coord_on.este, coord_on.h);


  proj4.defs(
    "EPSG:9377",
    "+proj=tmerc +lat_0=" + ctm.phi0 + " +lon_0=" + ctm.landa0 + " +k=" + ctm.k + " +x_0=" + ctm.E0 + " +y_0=" + ctm.N0 + " +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
  );
  //se definio temporalmente es origen nacional pero con el elipsoide de hayford
  proj4.defs(
    "EPSG:9378",
    "+proj=tmerc +lat_0=4.0 +lon_0=-73.0 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=intl +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
  );

  var coordenadas;
  //si es datum bogota con salida en datum bogota
  if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("EPSG:9378", "EPSG:9378", [cp.este, cp.norte]);
  } else if (sist_refe_entrada == 'datumBogotaPartida' && sist_refe_salida == 'magnaSIRGASLlegada') {
    coordenadas = proj4("EPSG:9378", "EPSG:9377", [cp.este, cp.norte]);
  } else if (sist_refe_entrada == 'magnaSIRGASPartida' && sist_refe_salida == 'datumBogotaLlegada') {
    coordenadas = proj4("EPSG:9377", "EPSG:9378", [cp.este, cp.norte]);
  } else {
    coordenadas = proj4("EPSG:9377", "EPSG:9377", [cp.este, cp.norte]);
  }
  var coord_origen_nacional = new coord_planas(coordenadas[1],coordenadas[0], cp.h);
 
  return coord_origen_nacional

}



//sección de pruebas 

// var cp = new coord_planas(85751.864, 94803.436);
// planas_cartesianas_a_curvilienas(cp, 1106, 2)

// var cutm = new coord_utm(442194.9725088, 611011.3296834, 18);
// utm_a_curvilineas(cutm, "magnaSIRGASPartida", "magnaSIRGASLlegada");

//  var on = new coord_planas(2033154.021, 4966724.022);
//  origen_nacional_a_curvilienas(on, 2, 2 );

// var geo = new coord_geocentricas(1860857.8789, -6086591.8657, 442084.6182)
// geocentricas_a_curvilineas(geo, 2, 2)

// var pgk = new coord_planas(934072.252, 1008607.267);
// gauss_kruger_a_curvilineas(pgk, "Bogotá", "magnaSIRGASPartida", "magnaSIRGASLlegada");

  //  var cc = new coord_curvilineas(4.4673476317148735, -74.1243491172994, 2600);
// curvilineas_a_gauss_kruger(cc, "Bogotá" ,"magnaSIRGASPartida", "magnaSIRGASLlegada" )
// curvilineas_a_geocentricas(cc, "magnaSIRGASPartida", "magnaSIRGASLlegada" )
// curvilienas_a_planas_cartesianas(cc, 1106, 2);
//  curvilineas_a_utm(cc, "magnaSIRGASPartida", "magnaSIRGASLlegada");




module.exports = { utm_a_curvilineas, origen_nacional_a_curvilienas, planas_cartesianas_a_curvilienas, geocentricas_a_curvilineas, gauss_kruger_a_curvilineas, curvilienas_a_curvilienas, curvilienas_a_planas_cartesianas, curvilienas_a_origen_nacional, curvilineas_a_utm,curvilineas_a_geocentricas, curvilineas_a_gauss_kruger, origen_nacional_a_origen_nacional }