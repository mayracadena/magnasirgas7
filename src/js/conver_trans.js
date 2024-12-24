const elipsoide_referencia = require("../class/elipsoide_referencia.js");
const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");
const conexion = require('../db/conexion.js');
const { origen_nacional, gauss_kruger, origen_UTM, origen_UTM_planas_a_curvilienas } = require('../controller/origen.js');
const origen = require('../class/origen.js');


//importacion de la libreria proj4
// const { utm_a_curvilineas, origen_nacional_a_curvilienas, planas_cartesianas_a_curvilienas, geocentricas_a_curvilineas, gauss_kruger_a_curvilineas, curvilienas_a_curvilienas, curvilienas_a_planas_cartesianas, curvilienas_a_origen_nacional, curvilineas_a_utm, curvilineas_a_geocentricas, curvilineas_a_gauss_kruger, origen_nacional_a_origen_nacional } = require('../controller/conversion');

//importación de modulos matemáticos
const { planas_cartesianas_a_curvilineas, geocentricas_a_curvilineas, curvilineas_a_geocentricas, planas_a_curvilineas, curvilineas_a_planas, curvilineas_a_planas_cartesianas } = require('../controller/conversion_coordenadas.js');

const map = require('../js/mapa_colombia.js');




function GMS_a_decimal(grados, minutos, segundos) {
  // Convertir minutos y segundos a grados decimales
  const decimalMinutos = minutos / 60;
  const decimalSegundos = segundos / 3600;

  // Sumar los grados decimales
  const grados_decimales = grados + decimalMinutos + decimalSegundos;

  return grados_decimales;
}


function decimal_a_GMS(coordenada) {
  //sacar valor absoluto
  var absolute = Math.abs(coordenada);
  var grados = Math.floor(absolute);
  var minutos_p = (absolute - grados) * 60;
  var minutos = Math.floor(minutos_p);
  //toFixed sirve para mostrar solo 5 decimales
  var segundos = parseFloat(((minutos_p - minutos) * 60).toFixed(5));

  return {
    grados: grados,
    minutos: minutos,
    segundos: segundos
  }
}

//devuelve el origen segun la longitud
async function origen_gauss_kruger(longitud, sist_refe) {

  var bogota, este_central, este_este, oeste, oeste_oeste, insular;

  if (sist_refe == 'BOGOTÁ') {
    bogota = -74.0809166666667;
    este_central = -71.0809166666667;
    este_este = -68.0809166666667;
    oeste = -77.0809166666667;
    oeste_oeste = -80.0809166666667;
    insular = -83.0809166666667;
  } else {
    bogota = -74.0775079166667;
    este_central = -71.0775079166667;
    este_este = -68.0775079166667;
    oeste = -77.0775079166667;
    oeste_oeste = -80.0775079166667;
    insular = -83.0775079166667;
  }


  /*
  Para cada origen se tiene 3 grados
  */

  var origen = "";

  if (longitud < insular + 1.5 && longitud >= insular - 1.5) {
    origen = "Insular"
  }
  else if (longitud < oeste_oeste + 1.5 && longitud >= oeste_oeste - 1.5) {
    origen = "Oeste-oeste"
  } else if (longitud < oeste + 1.5 && longitud >= oeste - 1.5) {
    origen = "Oeste"
  } else if (longitud < bogota + 1.5 && longitud >= bogota - 1.5) {
    origen = "Central"
  }
  else if (longitud < este_central + 1.5 && longitud >= este_central - 1.5) {
    origen = "Este"
  }
  else if (longitud < este_este + 1.5 && longitud >= este_este - 1.5) {
    origen = "Este-este"
  } else {
    return "El origen no se encuentra"
  }

  return origen;

}










document.getElementById("calcular_trans_cover").addEventListener("click", async function () {
  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
  const sistemaLlegadaActivo = document.querySelector('input[name="sistemaLlegada"]:checked');
  const myTabPartida = document.getElementById("myTabPartida");
  const myTabDestino = document.getElementById("myTabDestino");

  // Captura el id de la pestaña actualmente activa
  const activeTabPartida = document.querySelector("#myTabPartida .nav-link.active");
  const activeTabLlegada = document.querySelector("#myTabDestino .nav-link.active");

  const activeTabPartidaId = activeTabPartida ? activeTabPartida.id : null;
  const activeTabLlegadaId = activeTabLlegada ? activeTabLlegada.id : null;

  if (activeTabPartidaId) {

    console.log("Botón sistema partida:", sistemaPartidaActivo.id);
    console.log("Botón sistema llegada:", sistemaLlegadaActivo.id);
    console.log("tab seleccionado partida:", activeTabPartidaId);
    console.log("tab seleccionado llegada:", activeTabLlegadaId);
    /*
    ---------------------------------------------
    INICIO DE ENVIO DE COORDENADAS ELIPSOIDALES
    ----------------------------------------------
    */

    var sist_refe = sistemaPartidaActivo.id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'

    if (activeTabPartidaId == 'elipsoidal-tab-partida') {
      //captura de latitud
      var latitud_grados_partida = parseInt(document.getElementById('latitud-grados-partida').value);
      var latitud_minutos_partida = parseInt(document.getElementById('latitud-minutos-partida').value);
      var latitud_segundos_partida = parseFloat(document.getElementById('latitud-segundos-partida').value);
      var hemisferio_latitud = document.getElementById('latitud-hemisferio-partida').value;
      //captura longitud
      var longitud_grados_partida = parseInt(document.getElementById('longitud-grados-partida').value);
      var longitud_minutos_partida = parseInt(document.getElementById('longitud-minutos-partida').value);
      var longitud_segundos_partida = parseFloat(document.getElementById('longitud-segundos-partida').value);
      var hemisferio_longitud = document.getElementById('longitud-hemisferio-partida').value;

      //captura altura

      var altura = parseFloat(document.getElementById('altura-partida-elipsoidal').value) || 0;


      //convertir en formato decimal

      var lat_par = GMS_a_decimal(latitud_grados_partida, latitud_minutos_partida, latitud_segundos_partida);
      var long_par = GMS_a_decimal(longitud_grados_partida, longitud_minutos_partida, longitud_segundos_partida);



      if (hemisferio_latitud == 'S') {
        lat_par = lat_par * -1;
      }
      if (hemisferio_longitud == 'W') {
        long_par = long_par * -1;
      }


      var c_cc = new coord_curvilineas(lat_par, long_par, altura);

      map.agregarPuntoSecuencial(c_cc.phi, c_cc.lambda);


      //seccion de envio de datos de elipsoidales sexagesimal
      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        console.log(c_cc)

        if (c_cc.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc.lambda).segundos


      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {


        if (c_cc.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc.lambda;



      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
        //llamamos los valores del origen nacional
        let on = await origen_nacional();
        //mandamos valores para la conversion
        let coord_respuesta = await curvilineas_a_planas(c_cc, on, sist_refe);

        var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        //este espacio esta destinado para la transformacion

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;
        //guardar valor de altura mas adelante



      } else if (activeTabLlegadaId == 'utm-tab-destino') {
        //coordenadas de origen UTM
        let utmc = await origen_UTM(c_cc);
        //mandamos valores para conversion
        let coord_respuesta = await curvilineas_a_planas(c_cc, utmc, sist_refe);

        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;


      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
        let coord_respuesta = await curvilineas_a_geocentricas(c_cc, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {


        //llenar este apartado

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
        //coordenadas origen gauss, se llama el nombre del origen
        var origen_gauss = await origen_gauss_kruger(c_cc.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta = await curvilineas_a_planas(c_cc, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte.toFixed(6);
        document.getElementById('este-gk-destino').value = c_pgk.este.toFixed(6);
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h.toFixed(6);
        document.getElementById('origen-gauss-destino').value = origen_gauss;


      }

    }
    /*
   ---------------------------------------------
   INICIO DE ENVIO DE COORDENADAS ELIPSOIDALES DECIMALES
   ----------------------------------------------
   */
    else if (activeTabPartidaId == 'elipsoidal-decimal-tab-partida') {
      // captura de latitud y longitud
      var latitud_decimal_partida = parseFloat(document.getElementById('latitud-decimal-partida').value);
      var longitud_decimal_partida = parseFloat(document.getElementById('longitud-decimal-partida').value);
      var altura = parseFloat(document.getElementById('altura-partida-elipsoidal-decimal').value) || 0;

      var c_cc = new coord_curvilineas(latitud_decimal_partida, longitud_decimal_partida, altura);

      map.agregarPuntoSecuencial(c_cc.phi, c_cc.lambda);


      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        let coord_respuesta = await curvilienas_a_curvilienas(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);


        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos


      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        console.log("dentro de las mismas curvilienas ", c_cc)






        if (c_cc.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc.lambda;

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
        //llamamos los valores del origen nacional
        let on = await origen_nacional();
        //mandamos valores para la conversion
        let coord_respuesta = await curvilineas_a_planas(c_cc, on, sist_refe);
        var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;
        //guardar valor de altura mas adelante

      } else if (activeTabLlegadaId == 'utm-tab-destino') {
        //coordenadas de origen UTM
        let utmc = await origen_UTM(c_cc);
        //mandamos valores para conversion
        let coord_respuesta = await curvilineas_a_planas(c_cc, utmc, sist_refe);

        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;


      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

        let coord_respuesta = await curvilineas_a_geocentricas(c_cc, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;




      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {

        //llenar este apartado

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
        //coordenadas origen gauss, se llama el nombre del origen
        var origen_gauss = await origen_gauss_kruger(c_cc.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta = await curvilineas_a_planas(c_cc, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte;
        document.getElementById('este-gk-destino').value = c_pgk.este;
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h.toFixed(6);
        document.getElementById('origen-gauss-destino').value = origen_gauss;


      }
    }
    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS ORIGEN NACIONAL
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'origen-nacional-tab-partida') {

      //captura de norte, este y altura
      var norte_partida = parseFloat(document.getElementById('norte-partida').value);
      var este_partida = parseFloat(document.getElementById('este-partida').value);
      var altura = parseFloat(document.getElementById('altura-partida-origen-nacional').value) || 0;


      var c_on = new coord_planas(norte_partida, este_partida, altura);
      //llamamos los valores del origen nacional
      let on = await origen_nacional();

      let coord_respuesta_m = await planas_a_curvilineas(c_on, on, sist_refe);
      var c_cc_m = new coord_curvilineas(coord_respuesta_m.phi, coord_respuesta_m.lambda, coord_respuesta_m.h);

      map.agregarPuntoSecuencial(c_cc_m.phi, c_cc_m.lambda);

      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {



        let coord_respuesta = await planas_a_curvilineas(c_on, on, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos


      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_on, on, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;


      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {





        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        //origen nacional a curvilineas

        let on_a_cc = await planas_a_curvilineas(c_on, on, sist_refe);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);

        //coordenadas origen utm
        let utmc = await origen_UTM(c_cc_r);



        let coord_respuesta = await curvilineas_a_planas(c_cc_r, utmc, sist_refe);


        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;




      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
        //origen nacional a curvilineas
        let on_a_cc = await planas_a_curvilineas(c_on, on, sist_refe);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);

        //de curvilineas a geocentricas
        let coord_respuesta = await curvilineas_a_geocentricas(c_cc_r, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {





      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        let on_a_cc = await planas_a_curvilineas(c_on, on, sist_refe);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);

        //coordenadas origen gauss, se llama el nombre del origen
        var origen_gauss = await origen_gauss_kruger(c_cc_r.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta = await curvilineas_a_planas(c_cc_r, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte;
        document.getElementById('este-gk-destino').value = c_pgk.este;
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h;
        document.getElementById('origen-gauss-destino').value = origen_gauss;



      }

    }
    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS GEOCENTRICA
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'geocentrica-tab-partida') {

      var x_partida = parseFloat(document.getElementById('x-partida').value);
      var y_partida = parseFloat(document.getElementById('y-partida').value);
      var z_partida = parseFloat(document.getElementById('z-partida').value);

      var c_g = new coord_geocentricas(x_partida, y_partida, z_partida);

      var c_c_g = await geocentricas_a_curvilineas(c_g, sist_refe);

      var cc_g_r = new coord_curvilineas(c_c_g.phi, c_c_g.lambda, c_c_g.h);
      map.agregarPuntoSecuencial(cc_g_r.phi, cc_g_r.lambda);

      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {


        let coord_respuesta = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos

        document.getElementById('altura-destino-elipsoidal').value = c_cc_r.h;

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        let coord_respuesta = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;
        document.getElementById('altura-destino-elipsoidal-decimal').value = c_cc_r.h;


      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
        let on = await origen_nacional();
        //mandamos valores para la conversion

        let coord_r = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_r.phi, coord_r.lambda, coord_r.h);

        let coord_respuesta = await curvilineas_a_planas(c_cc_r, on, sist_refe);
        var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;
        document.getElementById('altura-destino-origen-nacional').value = c_on.h;

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        //mandamos valores para conversion

        let coord_r = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_r.phi, coord_r.lambda, coord_r.h);
        let utmc = await origen_UTM(c_cc_r);
        let coord_respuesta = await curvilineas_a_planas(c_cc_r, utmc, sist_refe);

        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;
        document.getElementById('altura-destino-utm').value = c_utm.h;


      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

        document.getElementById('x-destino').value = c_g.X;
        document.getElementById('y-destino').value = c_g.Y;
        document.getElementById('z-destino').value = c_g.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {





      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        
        let coord_r = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_r.phi, coord_r.lambda, coord_r.h);

        //coordenadas origen gauss, se llama el nombre del origen
        var origen_gauss = await origen_gauss_kruger(c_cc_r.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta = await curvilineas_a_planas(c_cc_r, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte;
        document.getElementById('este-gk-destino').value = c_pgk.este;
        document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h;
        document.getElementById('origen-gauss-destino').value = origen_gauss;
      }

    }
    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS PLANA CARTESIANA
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'plana-cartesiana-tab-partida') {




      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {


      } else if (activeTabLlegadaId == 'utm-tab-destino') {

      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {


      }
    }

    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS UTM
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'utm-tab-partida') {

      //captura de datos de UTM
      var norte_utm_partida = parseFloat(document.getElementById('norte-utm-partida').value);
      var este_utm_partida = parseFloat(document.getElementById('este-utm-partida').value);
      var huso_partida = parseInt(document.getElementById('huso-partida').value);
      var hemisferio_partida = document.getElementById('hemisferio-partida').value;
      var altura = parseFloat(document.getElementById('altura-partida-utm').value) || 0;

      var c_utm = new coord_planas(norte_utm_partida,este_utm_partida, altura)
      var origen_utm = await origen_UTM_planas_a_curvilienas(huso_partida, hemisferio_partida);

      let coord_respuesta_m = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
      var c_cc_m = new coord_curvilineas(coord_respuesta_m.phi, coord_respuesta_m.lambda, coord_respuesta_m.h);

      map.agregarPuntoSecuencial(c_cc_m.phi, c_cc_m.lambda);
      

      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos



      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;


      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let on = await origen_nacional();
        //mandamos valores para la conversion
        let coord_respuesta2 = await curvilineas_a_planas(c_cc_r, on, sist_refe);
        var c_on = new coord_planas(coord_respuesta2.norte, coord_respuesta2.este, coord_respuesta2.h);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;


      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = `${huso_partida}${hemisferio_partida}`;



      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let coord_respuesta2 = await curvilineas_a_geocentricas(c_cc_r, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta2.X, coord_respuesta2.Y, coord_respuesta2.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;


      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {








      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        var origen_gauss = await origen_gauss_kruger(c_cc_r.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta2 = await curvilineas_a_planas(c_cc_r, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta2.norte, coord_respuesta2.este, coord_respuesta2.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte;
        document.getElementById('este-gk-destino').value = c_pgk.este;
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h;
        document.getElementById('origen-gauss-destino').value = origen_gauss;

      }

    }

    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS GAUSS KRÜGER
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'gauss-kruger-tab-partida') {

      var norte_gk_partida = parseFloat(document.getElementById('norte-gk-partida').value);
      var este_gk_partida = parseFloat(document.getElementById('este-gk-partida').value);
      var altura_partida_gauss_kruger = parseFloat(document.getElementById('altura-partida-gauss-kruger').value) || 0 ;
      var origen_gauss_partida = document.getElementById('origen-gauss-partida').value;

      var c_gk = new coord_planas(norte_gk_partida, este_gk_partida, altura_partida_gauss_kruger);


      console.log("origen coordenadas", origen_gauss_partida)
      var o = await gauss_kruger(origen_gauss_partida, sist_refe);

      let coord_respuesta_m = await planas_a_curvilineas(c_gk, o, sist_refe);
      var c_cc_m = new coord_curvilineas(coord_respuesta_m.phi, coord_respuesta_m.lambda, coord_respuesta_m.h);

      map.agregarPuntoSecuencial(c_cc_m.phi, c_cc_m.lambda);

      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {



        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;


      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let on = await origen_nacional();
        let coord_respuesta2 = await curvilineas_a_planas(c_cc_r, on, sist_refe);
        var c_on = new coord_planas(coord_respuesta2.norte, coord_respuesta2.este, coord_respuesta2.h);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;
        document.getElementById('altura-destino-origen-nacional').value = c_on.h;


      } else if (activeTabLlegadaId == 'utm-tab-destino') {
        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let utmc = await origen_UTM(c_cc_r);
        let coord_respuesta2 = await curvilineas_a_planas(c_cc_r, utmc, sist_refe);

        var c_utm = new coord_planas(coord_respuesta2.norte, coord_respuesta2.este, coord_respuesta2.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;
        document.getElementById('altura-destino-utm').value = c_utm.h;



      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let coord_respuesta2 = await curvilineas_a_geocentricas(c_cc_r, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta2.X, coord_respuesta2.Y, coord_respuesta2.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        

        document.getElementById('norte-gk-destino').value = c_gk.norte;
        document.getElementById('este-gk-destino').value = c_gk.este;
        document.getElementById('altura-destino-gauss-kruger').value = c_gk.h;
        document.getElementById('origen-gauss-destino').value = origen_gauss_partida;
      }

    }


  } else {
    console.log("No hay ninguna pestaña activa.");
  }
});





/*
------------------------------------------------------------------------
habilitacion de altura elipsoidal
-------------------------------------------------------------------------

*/

//captura cuando se escoge coordenadas geocentricas y se pone la opcion de altura elipsoidal
document.getElementById('myTabPartida').addEventListener("click", async function () {

  const activeTabPartida = document.querySelector("#myTabPartida .nav-link.active");

  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
  const sistemaLlegadaActivo = document.querySelector('input[name="sistemaLlegada"]:checked');

  const activeTabLlegada = document.querySelector("#myTabDestino .nav-link.active");
  const activeTabPartidaId = activeTabPartida ? activeTabPartida.id : null;
  const activeTabLlegadaId = activeTabLlegada ? activeTabLlegada.id : null;
  var sist_refe = sistemaPartidaActivo.id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'


  if (activeTabLlegadaId == 'geocentrica-tab-destino') {


    if (activeTabPartidaId == 'elipsoidal-tab-partida') {

      var altura_visible_elipsoidal = document.getElementById('div-altura-partida-elipsoidal');
      altura_visible_elipsoidal.hidden = false;

    } else if (activeTabPartidaId == 'elipsoidal-decimal-tab-partida') {

      var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-partida-elipsoidal-decimal');
      altura_visible_elipsoidal_decimal.hidden = false;

    } else if (activeTabPartidaId == 'origen-nacional-tab-partida') {

      var altura_visible_origen_nacional = document.getElementById('div-altura-partida-origen-nacional');
      altura_visible_origen_nacional.hidden = false;

    } else if (activeTabPartidaId == 'plana-cartesiana-tab-partida') {

      var altura_visible_plana_cartesiana = document.getElementById('div-altura-partida-plana-cartesiana');
      altura_visible_plana_cartesiana.hidden = false;

    } else if (activeTabPartidaId == 'utm-tab-partida') {

      var altura_visible_utm = document.getElementById('div-altura-partida-utm');
      altura_visible_utm.hidden = false;

    } else if (activeTabPartidaId == 'gauss-kruger-tab-partida') {

      var altura_visible_gauss_kruger = document.getElementById('div-altura-partida-gauss-kruger');
      altura_visible_gauss_kruger.hidden = false;

    }
  } else {

    var altura_visible_elipsoidal = document.getElementById('div-altura-partida-elipsoidal');
    altura_visible_elipsoidal.hidden = true;

    var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-partida-elipsoidal-decimal');
    altura_visible_elipsoidal_decimal.hidden = true;

    var altura_visible_origen_nacional = document.getElementById('div-altura-partida-origen-nacional');
    altura_visible_origen_nacional.hidden = true;

    var altura_visible_plana_cartesiana = document.getElementById('div-altura-partida-plana-cartesiana');
    altura_visible_plana_cartesiana.hidden = true;

    var altura_visible_utm = document.getElementById('div-altura-partida-utm');
    altura_visible_utm.hidden = true;

    var altura_visible_gauss_kruger = document.getElementById('div-altura-partida-gauss-kruger');
    altura_visible_gauss_kruger.hidden = true;

    if (activeTabPartidaId == 'geocentrica-tab-partida') {
      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        var altura_visible_elipsoidal = document.getElementById('div-altura-destino-elipsoidal');
        altura_visible_elipsoidal.hidden = false;

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-destino-elipsoidal-decimal');
        altura_visible_elipsoidal_decimal.hidden = false;

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {

        var altura_visible_origen_nacional = document.getElementById('div-altura-destino-origen-nacional');
        altura_visible_origen_nacional.hidden = false;

      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {

        var altura_visible_plana_cartesiana = document.getElementById('div-altura-destino-plana-cartesiana');
        altura_visible_plana_cartesiana.hidden = false;

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        var altura_visible_utm = document.getElementById('div-altura-destino-utm');
        altura_visible_utm.hidden = false;

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        var altura_visible_gauss_kruger = document.getElementById('div-altura-destino-gauss-kruger');
        altura_visible_gauss_kruger.hidden = false;

      }

    }

  }

  if (activeTabPartidaId == 'plana-cartesiana-tab-partida') {
    var con = new conexion();

    console.log('dentro de planas cartesianas')

    var sist_refe = document.querySelector('input[name="sistemaPartida"]:checked').id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'

    try {
      await con.open();

      //seleccionar a todos los departamentos
      var query_departamentos = "select DISTINCT d.id, d.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where sr.nombre = ? order by d.nombre asc";
      var result_departamento = await con.getAll(query_departamentos, [sist_refe]);



      var select_departamento_planas_partida = document.getElementById('departamento-planas-partida');
      select_departamento_planas_partida.innerHTML = '<option value="defecto" >Seleccione Departamento</option>';

      result_departamento.forEach(i => {

        var option_departamento = document.createElement('option');
        option_departamento.value = i.id,
          option_departamento.textContent = i.nombre;


        select_departamento_planas_partida.appendChild(option_departamento);


      });



      //funcion para mostrar los municipios segun el departamento que se encuentre activo

      document.getElementById('departamento-planas-partida').addEventListener("change", async function () {
        //seleccionar a todos los departamentos
        var sist_refe = document.querySelector('input[name="sistemaPartida"]:checked').id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
        try {
          await con.open();
          var id_departamento = document.getElementById('departamento-planas-partida').value;
          var query_municipios = "select DISTINCT  m.id, m.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where m.fk_departamento = ? and sr.nombre = ? order by m.nombre asc";
          var parametros_municipio = [id_departamento.toString(), sist_refe]
          var result_municipio = await con.getAll(query_municipios, parametros_municipio);

          var select_municipios = document.getElementById('municipio-planas-partida');

          select_municipios.innerHTML = '<option value="defecto">Seleccione Municipio</option>';


          result_municipio.forEach(i => {

            var option_municipio = document.createElement('option');
            option_municipio.value = i.id,
              option_municipio.textContent = i.nombre;


            select_municipios.appendChild(option_municipio);
          });



          console.log(result_municipio)

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }





      });


      document.getElementById('municipio-planas-partida').addEventListener("change", async function () {
        var sist_refe = document.querySelector('input[name="sistemaPartida"]:checked').id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
        try {
          await con.open();
          var select_municipio_detalle = document.getElementById('municipio-planas-partida').value;

          //traer todos los datos del origen cartografico
          var query_origen = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia  from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where m.id = ? and s.nombre = ? ";
          var parametros_detalle = [select_municipio_detalle, sist_refe]
          var result_origen_detalle = await con.getAll(query_origen, parametros_detalle);

          var detalle_select_origen = document.getElementById('detalle-planas-partida');
          detalle_select_origen.innerHTML = '<option value="defecto">Seleccione año, municipio y/o corregimiento</option>';

          result_origen_detalle.forEach(i => {

            var option_detalle = document.createElement('option');
            option_detalle.value = i.id,
              option_detalle.textContent = i.detalle;


            detalle_select_origen.appendChild(option_detalle);
          });
          console.log(result_origen_detalle)

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }

      });

      const detalle_origen = document.getElementById('informacion_origen_partida');
      if (detalle_origen) {
        detalle_origen.addEventListener('show.bs.modal', async function () {
          const modalBodyContent = document.getElementById('modal-body-content-partida');

          var id_origen_cartesiano = document.getElementById('detalle-planas-partida').value;
          console.log(id_origen_cartesiano);
          var mensaje_detalle = '';
          if (id_origen_cartesiano == 'defecto') {
            mensaje_detalle = '<h4>No has escogido origen de coordenadas cartesianas</h4>';

          } else {
            try {
              await con.open();
              var select_detalle_id = document.getElementById('detalle-planas-partida').value;


              //traer todos los datos del origen cartografico
              var query_detalle_id = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia, o.latitud, o.longitud , o.norte, o.este, o.plano_proyeccion from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where o.id = ?";
              var parametros_detalle_id = [select_detalle_id]
              var roc = await con.getOne(query_detalle_id, parametros_detalle_id);

              var headModal = document.getElementById('informacion_origen_Label_partida')
              headModal.innerHTML = roc.detalle;

              mensaje_detalle = `<label>Departamento: </label>${roc.departamento} <br>
                     <label>Municipio: </label>${roc.municipio} <br>
                     <h4>Elipsoidales</h4>
                     <label>Latitud de origen: </label>${roc.latitud} grados<br>
                     <label>Longitud de origen: </label>${roc.longitud} grados<br>
                     <h4>Planas</h4>
                     <label>Falso norte: </label>${roc.norte} m<br>
                     <label>Falso este: </label>${roc.este} m<br>
                     <label>Plano de proyección: </label>${roc.plano_proyeccion} m<br>
                     <h4>Descripción</h4>
                     ${roc.descripcion}

                     `

              console.log(roc)

            } catch (error) {
              console.error("Ocurrió un error:", error);
              return null;
            } finally {
              await con.close();
            }
          }

          if (modalBodyContent) {
            // Cambia textContent a innerHTML para interpretar el HTML en mensaje_detalle
            modalBodyContent.innerHTML = mensaje_detalle;

          }
        });
      }




      // console.log('resultados de origenes cartograficos ', result_origen)



    } catch (error) {
      console.error("Ocurrió un error:", error);
      return null;
    } finally {
      await con.close();
    }





  }


});

document.getElementById('myTabDestino').addEventListener("click", async function () {

  const activeTabPartida = document.querySelector("#myTabPartida .nav-link.active");

  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
  const sistemaLlegadaActivo = document.querySelector('input[name="sistemaLlegada"]:checked');

  const activeTabLlegada = document.querySelector("#myTabDestino .nav-link.active");
  const activeTabPartidaId = activeTabPartida ? activeTabPartida.id : null;
  const activeTabLlegadaId = activeTabLlegada ? activeTabLlegada.id : null;




  if (activeTabLlegadaId == 'geocentrica-tab-destino') {


    if (activeTabPartidaId == 'elipsoidal-tab-partida') {

      var altura_visible_elipsoidal = document.getElementById('div-altura-partida-elipsoidal');
      altura_visible_elipsoidal.hidden = false;

    } else if (activeTabPartidaId == 'elipsoidal-decimal-tab-partida') {

      var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-partida-elipsoidal-decimal');
      altura_visible_elipsoidal_decimal.hidden = false;

    } else if (activeTabPartidaId == 'origen-nacional-tab-partida') {

      var altura_visible_origen_nacional = document.getElementById('div-altura-partida-origen-nacional');
      altura_visible_origen_nacional.hidden = false;

    } else if (activeTabPartidaId == 'plana-cartesiana-tab-partida') {

      var altura_visible_plana_cartesiana = document.getElementById('div-altura-partida-plana-cartesiana');
      altura_visible_plana_cartesiana.hidden = false;

    } else if (activeTabPartidaId == 'utm-tab-partida') {

      var altura_visible_utm = document.getElementById('div-altura-partida-utm');
      altura_visible_utm.hidden = false;

    } else if (activeTabPartidaId == 'gauss-kruger-tab-partida') {

      var altura_visible_gauss_kruger = document.getElementById('div-altura-partida-gauss-kruger');
      altura_visible_gauss_kruger.hidden = false;

    }
  } else {

    var altura_visible_elipsoidal = document.getElementById('div-altura-partida-elipsoidal');
    altura_visible_elipsoidal.hidden = true;

    var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-partida-elipsoidal-decimal');
    altura_visible_elipsoidal_decimal.hidden = true;

    var altura_visible_origen_nacional = document.getElementById('div-altura-partida-origen-nacional');
    altura_visible_origen_nacional.hidden = true;

    var altura_visible_plana_cartesiana = document.getElementById('div-altura-partida-plana-cartesiana');
    altura_visible_plana_cartesiana.hidden = true;

    var altura_visible_utm = document.getElementById('div-altura-partida-utm');
    altura_visible_utm.hidden = true;

    var altura_visible_gauss_kruger = document.getElementById('div-altura-partida-gauss-kruger');
    altura_visible_gauss_kruger.hidden = true;

    if (activeTabPartidaId == 'geocentrica-tab-partida') {
      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        var altura_visible_elipsoidal = document.getElementById('div-altura-destino-elipsoidal');
        altura_visible_elipsoidal.hidden = false;

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-destino-elipsoidal-decimal');
        altura_visible_elipsoidal_decimal.hidden = false;

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {

        var altura_visible_origen_nacional = document.getElementById('div-altura-destino-origen-nacional');
        altura_visible_origen_nacional.hidden = false;

      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {

        var altura_visible_plana_cartesiana = document.getElementById('div-altura-destino-plana-cartesiana');
        altura_visible_plana_cartesiana.hidden = false;

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        var altura_visible_utm = document.getElementById('div-altura-destino-utm');
        altura_visible_utm.hidden = false;

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        var altura_visible_gauss_kruger = document.getElementById('div-altura-destino-gauss-kruger');
        altura_visible_gauss_kruger.hidden = false;

      }

    }

  }


  /*
si se encuentra activa planas cartesianas de destino se debe activar la opcion de seleccionar
departamento, el municipio y el origen cartesiano

*/
  if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {
    var con = new conexion();

    console.log('dentro de planas cartesianas')


    var sist_refe = document.querySelector('input[name="sistemaLlegada"]:checked').id == 'magnaSIRGASLlegada' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
    try {
      await con.open();

      //seleccionar a todos los departamentos
      var query_departamentos = "select DISTINCT d.id, d.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where sr.nombre = ? order by d.nombre asc";
      var result_departamento = await con.getAll(query_departamentos, [sist_refe]);



      var select_departamento_planas_destino = document.getElementById('departamento-planas-destino');
      select_departamento_planas_destino.innerHTML = '<option value="defecto" >Seleccione Departamento</option>';

      result_departamento.forEach(i => {

        var option_departamento = document.createElement('option');
        option_departamento.value = i.id,
          option_departamento.textContent = i.nombre;


        select_departamento_planas_destino.appendChild(option_departamento);


      });



      //funcion para mostrar los municipios segun el departamento que se encuentre activo

      document.getElementById('departamento-planas-destino').addEventListener("change", async function () {
        //seleccionar a todos los departamentos

        try {
          var sist_refe = document.querySelector('input[name="sistemaLlegada"]:checked').id == 'magnaSIRGASLlegada' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
          await con.open();
          var id_departamento = document.getElementById('departamento-planas-destino').value;
          var query_municipios = "select DISTINCT  m.id, m.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where m.fk_departamento = ? and sr.nombre = ? order by m.nombre asc";
          var parametros_municipio = [id_departamento.toString(), sist_refe]
          var result_municipio = await con.getAll(query_municipios, parametros_municipio);

          var select_municipios = document.getElementById('municipio-planas-destino');

          select_municipios.innerHTML = '<option value="defecto">Seleccione Municipio</option>';


          result_municipio.forEach(i => {

            var option_municipio = document.createElement('option');
            option_municipio.value = i.id,
              option_municipio.textContent = i.nombre;


            select_municipios.appendChild(option_municipio);
          });



          console.log(result_municipio)

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }





      });


      document.getElementById('municipio-planas-destino').addEventListener("change", async function () {

        try {
          await con.open();
          var select_municipio_detalle = document.getElementById('municipio-planas-destino').value;

          //traer todos los datos del origen cartografico
          var query_origen = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia  from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where m.id = ? and s.nombre = ? ";
          var sist_refe = document.querySelector('input[name="sistemaLlegada"]:checked').id == 'magnaSIRGASLlegada' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'

          console.log("informacion de sistema de partida pc ", document.getElementById('magnaSIRGASLlegada').value)
          console.log("sistema de referencia ", sist_refe)

          var parametros_detalle = [select_municipio_detalle, sist_refe]
          var result_origen_detalle = await con.getAll(query_origen, parametros_detalle);

          var detalle_select_origen = document.getElementById('detalle-planas-destino');
          detalle_select_origen.innerHTML = '<option value="defecto">Seleccione año, municipio y/o corregimiento</option>';

          result_origen_detalle.forEach(i => {

            var option_detalle = document.createElement('option');
            option_detalle.value = i.id,
              option_detalle.textContent = i.detalle;


            detalle_select_origen.appendChild(option_detalle);
          });
          console.log(result_origen_detalle)

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }

      });

      const detalle_origen = document.getElementById('informacion_origen');
      if (detalle_origen) {
        detalle_origen.addEventListener('show.bs.modal', async function () {
          const modalBodyContent = document.getElementById('modal-body-content');

          var id_origen_cartesiano = document.getElementById('detalle-planas-destino').value;
          console.log(id_origen_cartesiano);
          var mensaje_detalle = '';
          if (id_origen_cartesiano == 'defecto') {
            mensaje_detalle = '<h4>No has escogido origen de coordenadas cartesianas</h4>';

          } else {
            try {
              await con.open();
              var select_detalle_id = document.getElementById('detalle-planas-destino').value;


              //traer todos los datos del origen cartografico
              var query_detalle_id = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia, o.latitud, o.longitud , o.norte, o.este, o.plano_proyeccion from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where o.id = ?";
              var parametros_detalle_id = [select_detalle_id]
              var roc = await con.getOne(query_detalle_id, parametros_detalle_id);

              var headModal = document.getElementById('informacion_origen_Label')
              headModal.innerHTML = roc.detalle;

              mensaje_detalle = `<label>Departamento: </label>${roc.departamento} <br>
                     <label>Municipio: </label>${roc.municipio} <br>
                     <h4>Elipsoidales</h4>
                     <label>Latitud de origen: </label>${roc.latitud} grados<br>
                     <label>Longitud de origen: </label>${roc.longitud} grados<br>
                     <h4>Planas</h4>
                     <label>Falso norte: </label>${roc.norte} m<br>
                     <label>Falso este: </label>${roc.este} m<br>
                     <label>Plano de proyección: </label>${roc.plano_proyeccion} m<br>
                     <h4>Descripción</h4>
                     ${roc.descripcion}

                     `

              console.log("info", roc)

            } catch (error) {
              console.error("Ocurrió un error:", error);
              return null;
            } finally {
              await con.close();
            }
          }

          if (modalBodyContent) {

            modalBodyContent.innerHTML = mensaje_detalle;

          }
        });
      }




      // console.log('resultados de origenes cartograficos ', result_origen)



    } catch (error) {
      console.error("Ocurrió un error:", error);
      return null;
    } finally {
      await con.close();
    }





  }


});

//fin de habilitacion de captura de altura elipsoidal
const elipsoide_referencia = require("../class/elipsoide_referencia.js");
const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");
const conexion = require('../db/conexion.js');
const { origen_nacional, gauss_kruger, origen_UTM, origen_UTM_planas_a_curvilienas } = require('../controller/origen.js');
const origen = require('../class/origen.js');


//importacion de la libreria proj4
// const { utm_a_curvilineas, origen_nacional_a_curvilienas, planas_cartesianas_a_curvilienas, geocentricas_a_curvilineas, gauss_kruger_a_curvilineas, curvilienas_a_curvilienas, curvilienas_a_planas_cartesianas, curvilienas_a_origen_nacional, curvilineas_a_utm, curvilineas_a_geocentricas, curvilineas_a_gauss_kruger, origen_nacional_a_origen_nacional } = require('../controller/conversion');

//importación de modulos matemáticos
const { planas_cartesianas_a_curvilineas, geocentricas_a_curvilineas, curvilineas_a_geocentricas, planas_a_curvilineas, curvilineas_a_planas, curvilineas_a_planas_cartesianas } = require('../controller/conversion_coordenadas.js');

const map = require('../js/mapa_colombia.js');




function GMS_a_decimal(grados, minutos, segundos) {
  // Convertir minutos y segundos a grados decimales
  const decimalMinutos = minutos / 60;
  const decimalSegundos = segundos / 3600;

  // Sumar los grados decimales
  const grados_decimales = grados + decimalMinutos + decimalSegundos;

  return grados_decimales;
}


function decimal_a_GMS(coordenada) {
  //sacar valor absoluto
  var absolute = Math.abs(coordenada);
  var grados = Math.floor(absolute);
  var minutos_p = (absolute - grados) * 60;
  var minutos = Math.floor(minutos_p);
  //toFixed sirve para mostrar solo 5 decimales
  var segundos = parseFloat(((minutos_p - minutos) * 60).toFixed(5));

  return {
    grados: grados,
    minutos: minutos,
    segundos: segundos
  }
}

//devuelve el origen segun la longitud
async function origen_gauss_kruger(longitud, sist_refe) {

  var bogota, este_central, este_este, oeste, oeste_oeste, insular;

  if (sist_refe == 'BOGOTÁ') {
    bogota = -74.0809166666667;
    este_central = -71.0809166666667;
    este_este = -68.0809166666667;
    oeste = -77.0809166666667;
    oeste_oeste = -80.0809166666667;
    insular = -83.0809166666667;
  } else {
    bogota = -74.0775079166667;
    este_central = -71.0775079166667;
    este_este = -68.0775079166667;
    oeste = -77.0775079166667;
    oeste_oeste = -80.0775079166667;
    insular = -83.0775079166667;
  }


  /*
  Para cada origen se tiene 3 grados
  */

  var origen = "";

  if (longitud < insular + 1.5 && longitud >= insular - 1.5) {
    origen = "Insular"
  }
  else if (longitud < oeste_oeste + 1.5 && longitud >= oeste_oeste - 1.5) {
    origen = "Oeste-oeste"
  } else if (longitud < oeste + 1.5 && longitud >= oeste - 1.5) {
    origen = "Oeste"
  } else if (longitud < bogota + 1.5 && longitud >= bogota - 1.5) {
    origen = "Central"
  }
  else if (longitud < este_central + 1.5 && longitud >= este_central - 1.5) {
    origen = "Este"
  }
  else if (longitud < este_este + 1.5 && longitud >= este_este - 1.5) {
    origen = "Este-este"
  } else {
    return "El origen no se encuentra"
  }

  return origen;

}










document.getElementById("calcular_trans_cover").addEventListener("click", async function () {
  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
  const sistemaLlegadaActivo = document.querySelector('input[name="sistemaLlegada"]:checked');
  const myTabPartida = document.getElementById("myTabPartida");
  const myTabDestino = document.getElementById("myTabDestino");

  // Captura el id de la pestaña actualmente activa
  const activeTabPartida = document.querySelector("#myTabPartida .nav-link.active");
  const activeTabLlegada = document.querySelector("#myTabDestino .nav-link.active");

  const activeTabPartidaId = activeTabPartida ? activeTabPartida.id : null;
  const activeTabLlegadaId = activeTabLlegada ? activeTabLlegada.id : null;

  if (activeTabPartidaId) {

    console.log("Botón sistema partida:", sistemaPartidaActivo.id);
    console.log("Botón sistema llegada:", sistemaLlegadaActivo.id);
    console.log("tab seleccionado partida:", activeTabPartidaId);
    console.log("tab seleccionado llegada:", activeTabLlegadaId);
    /*
    ---------------------------------------------
    INICIO DE ENVIO DE COORDENADAS ELIPSOIDALES
    ----------------------------------------------
    */

    var sist_refe = sistemaPartidaActivo.id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'

    if (activeTabPartidaId == 'elipsoidal-tab-partida') {
      //captura de latitud
      var latitud_grados_partida = parseInt(document.getElementById('latitud-grados-partida').value);
      var latitud_minutos_partida = parseInt(document.getElementById('latitud-minutos-partida').value);
      var latitud_segundos_partida = parseFloat(document.getElementById('latitud-segundos-partida').value);
      var hemisferio_latitud = document.getElementById('latitud-hemisferio-partida').value;
      //captura longitud
      var longitud_grados_partida = parseInt(document.getElementById('longitud-grados-partida').value);
      var longitud_minutos_partida = parseInt(document.getElementById('longitud-minutos-partida').value);
      var longitud_segundos_partida = parseFloat(document.getElementById('longitud-segundos-partida').value);
      var hemisferio_longitud = document.getElementById('longitud-hemisferio-partida').value;

      //captura altura

      var altura = parseFloat(document.getElementById('altura-partida-elipsoidal').value) || 0;


      //convertir en formato decimal

      var lat_par = GMS_a_decimal(latitud_grados_partida, latitud_minutos_partida, latitud_segundos_partida);
      var long_par = GMS_a_decimal(longitud_grados_partida, longitud_minutos_partida, longitud_segundos_partida);



      if (hemisferio_latitud == 'S') {
        lat_par = lat_par * -1;
      }
      if (hemisferio_longitud == 'W') {
        long_par = long_par * -1;
      }


      var c_cc = new coord_curvilineas(lat_par, long_par, altura);

      map.agregarPuntoSecuencial(c_cc.phi, c_cc.lambda);


      //seccion de envio de datos de elipsoidales sexagesimal
      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        console.log(c_cc)

        if (c_cc.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc.lambda).segundos


      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {


        if (c_cc.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc.lambda;



      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
        //llamamos los valores del origen nacional
        let on = await origen_nacional();
        //mandamos valores para la conversion
        let coord_respuesta = await curvilineas_a_planas(c_cc, on, sist_refe);

        var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        //este espacio esta destinado para la transformacion

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;
        //guardar valor de altura mas adelante



      } else if (activeTabLlegadaId == 'utm-tab-destino') {
        //coordenadas de origen UTM
        let utmc = await origen_UTM(c_cc);
        //mandamos valores para conversion
        let coord_respuesta = await curvilineas_a_planas(c_cc, utmc, sist_refe);

        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;


      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
        let coord_respuesta = await curvilineas_a_geocentricas(c_cc, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {

        var origen_cartesiano = document.getElementById('detalle-planas-destino').value;

        if (origen_cartesiano == 'defecto') {
          alert('Debes escoger un origen cartesiano');
        } else {
          let coord_respuesta = await curvilineas_a_planas_cartesianas(c_cc, sist_refe, origen_cartesiano);
          var c_p = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
          document.getElementById('norte-pc-destino').value = c_p.norte;
          document.getElementById('este-pc-destino').value = c_p.este;
          document.getElementById('altura-destino-plana-cartesiana').value = c_p.h;
        }


      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
        //coordenadas origen gauss, se llama el nombre del origen
        var origen_gauss = await origen_gauss_kruger(c_cc.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta = await curvilineas_a_planas(c_cc, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte.toFixed(6);
        document.getElementById('este-gk-destino').value = c_pgk.este.toFixed(6);
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h.toFixed(6);
        document.getElementById('origen-gauss-destino').value = origen_gauss;


      }

    }
    /*
   ---------------------------------------------
   INICIO DE ENVIO DE COORDENADAS ELIPSOIDALES DECIMALES
   ----------------------------------------------
   */
    else if (activeTabPartidaId == 'elipsoidal-decimal-tab-partida') {
      // captura de latitud y longitud
      var latitud_decimal_partida = parseFloat(document.getElementById('latitud-decimal-partida').value);
      var longitud_decimal_partida = parseFloat(document.getElementById('longitud-decimal-partida').value);
      var altura = parseFloat(document.getElementById('altura-partida-elipsoidal-decimal').value) || 0;

      var c_cc = new coord_curvilineas(latitud_decimal_partida, longitud_decimal_partida, altura);

      map.agregarPuntoSecuencial(c_cc.phi, c_cc.lambda);


      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        let coord_respuesta = await curvilienas_a_curvilienas(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);


        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos


      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {


        if (c_cc.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc.lambda;

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
        //llamamos los valores del origen nacional
        let on = await origen_nacional();
        //mandamos valores para la conversion
        let coord_respuesta = await curvilineas_a_planas(c_cc, on, sist_refe);
        var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;
        //guardar valor de altura mas adelante

      } else if (activeTabLlegadaId == 'utm-tab-destino') {
        //coordenadas de origen UTM
        let utmc = await origen_UTM(c_cc);
        //mandamos valores para conversion
        let coord_respuesta = await curvilineas_a_planas(c_cc, utmc, sist_refe);

        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;


      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

        let coord_respuesta = await curvilineas_a_geocentricas(c_cc, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;




      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {
        var origen_cartesiano = document.getElementById('detalle-planas-destino').value;
        console.log('dentro de coordenadas elipsoidales decimales ', origen_cartesiano)
        if (origen_cartesiano == 'defecto') {
          alert('Debes escoger un origen cartesiano');
        } else {
          let coord_respuesta = await curvilineas_a_planas_cartesianas(c_cc, sist_refe, origen_cartesiano);
          var c_p = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
          document.getElementById('norte-pc-destino').value = c_p.norte;
          document.getElementById('este-pc-destino').value = c_p.este;
          document.getElementById('altura-destino-plana-cartesiana').value = c_p.h;
        }

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
        //coordenadas origen gauss, se llama el nombre del origen
        var origen_gauss = await origen_gauss_kruger(c_cc.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta = await curvilineas_a_planas(c_cc, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte;
        document.getElementById('este-gk-destino').value = c_pgk.este;
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h.toFixed(6);
        document.getElementById('origen-gauss-destino').value = origen_gauss;


      }
    }
    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS ORIGEN NACIONAL
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'origen-nacional-tab-partida') {

      //captura de norte, este y altura
      var norte_partida = parseFloat(document.getElementById('norte-partida').value);
      var este_partida = parseFloat(document.getElementById('este-partida').value);
      var altura = parseFloat(document.getElementById('altura-partida-origen-nacional').value) || 0;


      var c_on = new coord_planas(norte_partida, este_partida, altura);
      //llamamos los valores del origen nacional
      let on = await origen_nacional();

      let coord_respuesta_m = await planas_a_curvilineas(c_on, on, sist_refe);
      var c_cc_m = new coord_curvilineas(coord_respuesta_m.phi, coord_respuesta_m.lambda, coord_respuesta_m.h);

      map.agregarPuntoSecuencial(c_cc_m.phi, c_cc_m.lambda);

      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {



        let coord_respuesta = await planas_a_curvilineas(c_on, on, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos


      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_on, on, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;


      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        //origen nacional a curvilineas

        let on_a_cc = await planas_a_curvilineas(c_on, on, sist_refe);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);

        //coordenadas origen utm
        let utmc = await origen_UTM(c_cc_r);



        let coord_respuesta = await curvilineas_a_planas(c_cc_r, utmc, sist_refe);


        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;




      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
        //origen nacional a curvilineas
        let on_a_cc = await planas_a_curvilineas(c_on, on, sist_refe);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);

        //de curvilineas a geocentricas
        let coord_respuesta = await curvilineas_a_geocentricas(c_cc_r, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {


        var origen_cartesiano = document.getElementById('detalle-planas-destino').value;

        if (origen_cartesiano == 'defecto') {
          alert('Debes escoger un origen cartesiano');
        } else {
          let coord_respuesta = await curvilineas_a_planas_cartesianas(c_cc_m, sist_refe, origen_cartesiano);
          var c_p = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
          document.getElementById('norte-pc-destino').value = c_p.norte;
          document.getElementById('este-pc-destino').value = c_p.este;
          document.getElementById('altura-destino-plana-cartesiana').value = c_p.h;
        }


      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        let on_a_cc = await planas_a_curvilineas(c_on, on, sist_refe);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);

        //coordenadas origen gauss, se llama el nombre del origen
        var origen_gauss = await origen_gauss_kruger(c_cc_r.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta = await curvilineas_a_planas(c_cc_r, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte;
        document.getElementById('este-gk-destino').value = c_pgk.este;
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h;
        document.getElementById('origen-gauss-destino').value = origen_gauss;



      }

    }
    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS GEOCENTRICA
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'geocentrica-tab-partida') {

      var x_partida = parseFloat(document.getElementById('x-partida').value);
      var y_partida = parseFloat(document.getElementById('y-partida').value);
      var z_partida = parseFloat(document.getElementById('z-partida').value);

      var c_g = new coord_geocentricas(x_partida, y_partida, z_partida);

      var c_c_g = await geocentricas_a_curvilineas(c_g, sist_refe);

      var cc_g_r = new coord_curvilineas(c_c_g.phi, c_c_g.lambda, c_c_g.h);
      map.agregarPuntoSecuencial(cc_g_r.phi, cc_g_r.lambda);

      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {


        let coord_respuesta = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos

        document.getElementById('altura-destino-elipsoidal').value = c_cc_r.h;

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        let coord_respuesta = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;
        document.getElementById('altura-destino-elipsoidal-decimal').value = c_cc_r.h;


      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
        let on = await origen_nacional();
        //mandamos valores para la conversion

        let coord_r = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_r.phi, coord_r.lambda, coord_r.h);

        let coord_respuesta = await curvilineas_a_planas(c_cc_r, on, sist_refe);
        var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;
        document.getElementById('altura-destino-origen-nacional').value = c_on.h;

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        //mandamos valores para conversion

        let coord_r = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_r.phi, coord_r.lambda, coord_r.h);
        let utmc = await origen_UTM(c_cc_r);
        let coord_respuesta = await curvilineas_a_planas(c_cc_r, utmc, sist_refe);

        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;
        document.getElementById('altura-destino-utm').value = c_utm.h;


      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

        document.getElementById('x-destino').value = c_g.X;
        document.getElementById('y-destino').value = c_g.Y;
        document.getElementById('z-destino').value = c_g.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {

        var origen_cartesiano = document.getElementById('detalle-planas-destino').value;

        if (origen_cartesiano == 'defecto') {
          alert('Debes escoger un origen cartesiano');
        } else {
          let coord_respuesta = await curvilineas_a_planas_cartesianas(cc_g_r, sist_refe, origen_cartesiano);
          var c_p = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
          document.getElementById('norte-pc-destino').value = c_p.norte;
          document.getElementById('este-pc-destino').value = c_p.este;
          document.getElementById('altura-destino-plana-cartesiana').value = c_p.h;
        }



      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {


        let coord_r = await geocentricas_a_curvilineas(c_g, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_r.phi, coord_r.lambda, coord_r.h);

        //coordenadas origen gauss, se llama el nombre del origen
        var origen_gauss = await origen_gauss_kruger(c_cc_r.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta = await curvilineas_a_planas(c_cc_r, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte;
        document.getElementById('este-gk-destino').value = c_pgk.este;
        document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h;
        document.getElementById('origen-gauss-destino').value = origen_gauss;
      }

    }
    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS PLANA CARTESIANA
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'plana-cartesiana-tab-partida') {

      var norte_pc_partida = parseFloat(document.getElementById('norte-pc-partida').value);
      var este_pc_partida = parseFloat(document.getElementById('este-pc-partida').value);
      var altura_partida_plana_cartesiana = parseFloat(document.getElementById('altura-partida-plana-cartesiana').value) || 0;;

      var origen_cartesiano = document.getElementById('detalle-planas-partida').value;

      if (origen_cartesiano == 'defecto') {
        alert('Debes escoger un origen cartesiano');
      } 
      
      else {

        var c_p = new coord_planas(norte_pc_partida, este_pc_partida, altura_partida_plana_cartesiana);

        
        let c_cc_m = await planas_cartesianas_a_curvilineas(c_p, origen_cartesiano);
        console.log(c_p, origen_cartesiano, c_cc_m)
        var c_cc_r = new coord_curvilineas(c_cc_m.phi, c_cc_m.lambda, c_cc_m.h);

        console.log(c_cc_m, c_cc_r)

        map.agregarPuntoSecuencial(c_cc_r.phi, c_cc_r.lambda);


        if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

          if (c_cc_r.phi < 0) {
            document.getElementById('latitud-hemisferio-destino').value = 'S'
          } else {
            document.getElementById('latitud-hemisferio-destino').value = 'N'
          }
          if (c_cc_r.lambda < 0) {
            document.getElementById('longitud-hemisferio-destino').value = 'W'
          } else {
            document.getElementById('longitud-hemisferio-destino').value = 'E'
          }

          document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
          document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
          document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
          document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
          document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
          document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos

        } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

          if (c_cc_r.phi < 0) {
            document.getElementById('latitud-hemisferio-destino').value = 'S'
          } else {
            document.getElementById('latitud-hemisferio-destino').value = 'N'
          }
          if (c_cc_r.lambda < 0) {
            document.getElementById('longitud-hemisferio-destino').value = 'W'
          } else {
            document.getElementById('longitud-hemisferio-destino').value = 'E'
          }

          document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
          document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;


        } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
          //llamamos los valores del origen nacional
          let on = await origen_nacional();
          //mandamos valores para la conversion
          let coord_respuesta = await curvilineas_a_planas(c_cc_r, on, sist_refe);
          var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

          document.getElementById('norte-destino').value = c_on.norte;
          document.getElementById('este-destino').value = c_on.este;

        } else if (activeTabLlegadaId == 'utm-tab-destino') {
          //coordenadas de origen UTM
          let utmc = await origen_UTM(c_cc_r);
          //mandamos valores para conversion
          let coord_respuesta = await curvilineas_a_planas(c_cc_r, utmc, sist_refe);

          var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
          document.getElementById('norte-utm-destino').value = c_utm.norte;
          document.getElementById('este-utm-destino').value = c_utm.este;
          document.getElementById('huso-destino').value = utmc.nombre;


        } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

          let coord_respuesta = await curvilineas_a_geocentricas(c_cc_r, sist_refe);
          var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
          document.getElementById('x-destino').value = c_geo.X;
          document.getElementById('y-destino').value = c_geo.Y;
          document.getElementById('z-destino').value = c_geo.Z;


        } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {

          var origen_cartesiano_d = document.getElementById('detalle-planas-destino').value;

          if (origen_cartesiano_d == 'defecto') {
            alert('Debes escoger un origen cartesiano');
          } else {
            let coord_respuesta = await curvilineas_a_planas_cartesianas(c_cc, sist_refe, origen_cartesiano_d);
            var c_p = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
            document.getElementById('norte-pc-destino').value = c_p.norte;
            document.getElementById('este-pc-destino').value = c_p.este;
            document.getElementById('altura-destino-plana-cartesiana').value = c_p.h;
          }


        } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
          //coordenadas origen gauss, se llama el nombre del origen
          var origen_gauss = await origen_gauss_kruger(c_cc_r.lambda);
          //se llaman los parametros de origen segun el nombre del origen
          var o = await gauss_kruger(origen_gauss, sist_refe);

          let coord_respuesta = await curvilineas_a_planas(c_cc_r, o, sist_refe);
          var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

          document.getElementById('norte-gk-destino').value = c_pgk.norte;
          document.getElementById('este-gk-destino').value = c_pgk.este;
          document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h;
          document.getElementById('origen-gauss-destino').value = origen_gauss;

        }
      }
    }

    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS UTM
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'utm-tab-partida') {

      //captura de datos de UTM
      var norte_utm_partida = parseFloat(document.getElementById('norte-utm-partida').value);
      var este_utm_partida = parseFloat(document.getElementById('este-utm-partida').value);
      var huso_partida = parseInt(document.getElementById('huso-partida').value);
      var hemisferio_partida = document.getElementById('hemisferio-partida').value;
      var altura = parseFloat(document.getElementById('altura-partida-utm').value) || 0;

      var c_utm = new coord_planas(norte_utm_partida, este_utm_partida, altura)
      var origen_utm = await origen_UTM_planas_a_curvilienas(huso_partida, hemisferio_partida);

      let coord_respuesta_m = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
      var c_cc_m = new coord_curvilineas(coord_respuesta_m.phi, coord_respuesta_m.lambda, coord_respuesta_m.h);

      map.agregarPuntoSecuencial(c_cc_m.phi, c_cc_m.lambda);


      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos



      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;


      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let on = await origen_nacional();
        //mandamos valores para la conversion
        let coord_respuesta2 = await curvilineas_a_planas(c_cc_r, on, sist_refe);
        var c_on = new coord_planas(coord_respuesta2.norte, coord_respuesta2.este, coord_respuesta2.h);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;


      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = `${huso_partida}${hemisferio_partida}`;



      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let coord_respuesta2 = await curvilineas_a_geocentricas(c_cc_r, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta2.X, coord_respuesta2.Y, coord_respuesta2.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;


      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {

        var origen_cartesiano = document.getElementById('detalle-planas-destino').value;

        if (origen_cartesiano == 'defecto') {
          alert('Debes escoger un origen cartesiano');
        } else {
          let coord_respuesta = await curvilineas_a_planas_cartesianas(c_cc_m, sist_refe, origen_cartesiano);
          var c_p = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
          document.getElementById('norte-pc-destino').value = c_p.norte;
          document.getElementById('este-pc-destino').value = c_p.este;
          document.getElementById('altura-destino-plana-cartesiana').value = c_p.h;
        }


      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
        let coord_respuesta = await planas_a_curvilineas(c_utm, origen_utm, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        var origen_gauss = await origen_gauss_kruger(c_cc_r.lambda);
        //se llaman los parametros de origen segun el nombre del origen
        var o = await gauss_kruger(origen_gauss, sist_refe);

        let coord_respuesta2 = await curvilineas_a_planas(c_cc_r, o, sist_refe);
        var c_pgk = new coord_planas(coord_respuesta2.norte, coord_respuesta2.este, coord_respuesta2.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte;
        document.getElementById('este-gk-destino').value = c_pgk.este;
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h;
        document.getElementById('origen-gauss-destino').value = origen_gauss;

      }

    }

    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS GAUSS KRÜGER
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'gauss-kruger-tab-partida') {

      var norte_gk_partida = parseFloat(document.getElementById('norte-gk-partida').value);
      var este_gk_partida = parseFloat(document.getElementById('este-gk-partida').value);
      var altura_partida_gauss_kruger = parseFloat(document.getElementById('altura-partida-gauss-kruger').value) || 0;
      var origen_gauss_partida = document.getElementById('origen-gauss-partida').value;

      var c_gk = new coord_planas(norte_gk_partida, este_gk_partida, altura_partida_gauss_kruger);


      console.log("origen coordenadas", origen_gauss_partida)
      var o = await gauss_kruger(origen_gauss_partida, sist_refe);

      let coord_respuesta_m = await planas_a_curvilineas(c_gk, o, sist_refe);
      var c_cc_m = new coord_curvilineas(coord_respuesta_m.phi, coord_respuesta_m.lambda, coord_respuesta_m.h);

      map.agregarPuntoSecuencial(c_cc_m.phi, c_cc_m.lambda);

      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {



        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-grados-destino').value = decimal_a_GMS(c_cc_r.phi).grados
        document.getElementById('latitud-minutos-destino').value = decimal_a_GMS(c_cc_r.phi).minutos
        document.getElementById('latitud-segundos-destino').value = decimal_a_GMS(c_cc_r.phi).segundos
        document.getElementById('longitud-grados-destino').value = decimal_a_GMS(c_cc_r.lambda).grados
        document.getElementById('longitud-minutos-destino').value = decimal_a_GMS(c_cc_r.lambda).minutos
        document.getElementById('longitud-segundos-destino').value = decimal_a_GMS(c_cc_r.lambda).segundos

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        if (c_cc_r.phi < 0) {
          document.getElementById('latitud-hemisferio-destino').value = 'S'
        } else {
          document.getElementById('latitud-hemisferio-destino').value = 'N'
        }
        if (c_cc_r.lambda < 0) {
          document.getElementById('longitud-hemisferio-destino').value = 'W'
        } else {
          document.getElementById('longitud-hemisferio-destino').value = 'E'
        }

        document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
        document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;


      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let on = await origen_nacional();
        let coord_respuesta2 = await curvilineas_a_planas(c_cc_r, on, sist_refe);
        var c_on = new coord_planas(coord_respuesta2.norte, coord_respuesta2.este, coord_respuesta2.h);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;
        document.getElementById('altura-destino-origen-nacional').value = c_on.h;


      } else if (activeTabLlegadaId == 'utm-tab-destino') {
        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let utmc = await origen_UTM(c_cc_r);
        let coord_respuesta2 = await curvilineas_a_planas(c_cc_r, utmc, sist_refe);

        var c_utm = new coord_planas(coord_respuesta2.norte, coord_respuesta2.este, coord_respuesta2.h);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = utmc.nombre;
        document.getElementById('altura-destino-utm').value = c_utm.h;



      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

        let coord_respuesta = await planas_a_curvilineas(c_gk, o, sist_refe);
        var c_cc_r = new coord_curvilineas(coord_respuesta.phi, coord_respuesta.lambda, coord_respuesta.h);

        let coord_respuesta2 = await curvilineas_a_geocentricas(c_cc_r, sist_refe);
        var c_geo = new coord_geocentricas(coord_respuesta2.X, coord_respuesta2.Y, coord_respuesta2.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {

        var origen_cartesiano = document.getElementById('detalle-planas-destino').value;

        if (origen_cartesiano == 'defecto') {
          alert('Debes escoger un origen cartesiano');
        } else {
          let coord_respuesta = await curvilineas_a_planas_cartesianas(c_cc_m, sist_refe, origen_cartesiano);
          var c_p = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
          document.getElementById('norte-pc-destino').value = c_p.norte;
          document.getElementById('este-pc-destino').value = c_p.este;
          document.getElementById('altura-destino-plana-cartesiana').value = c_p.h;
        }


      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {



        document.getElementById('norte-gk-destino').value = c_gk.norte;
        document.getElementById('este-gk-destino').value = c_gk.este;
        document.getElementById('altura-destino-gauss-kruger').value = c_gk.h;
        document.getElementById('origen-gauss-destino').value = origen_gauss_partida;
      }

    }


  } else {
    console.log("No hay ninguna pestaña activa.");
  }
});





/*
------------------------------------------------------------------------
habilitacion de altura elipsoidal
-------------------------------------------------------------------------

*/

//captura cuando se escoge coordenadas geocentricas y se pone la opcion de altura elipsoidal
document.getElementById('myTabPartida').addEventListener("click", async function () {

  const activeTabPartida = document.querySelector("#myTabPartida .nav-link.active");

  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
  const sistemaLlegadaActivo = document.querySelector('input[name="sistemaLlegada"]:checked');

  const activeTabLlegada = document.querySelector("#myTabDestino .nav-link.active");
  const activeTabPartidaId = activeTabPartida ? activeTabPartida.id : null;
  const activeTabLlegadaId = activeTabLlegada ? activeTabLlegada.id : null;
  var sist_refe = sistemaPartidaActivo.id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'


  if (activeTabLlegadaId == 'geocentrica-tab-destino') {


    if (activeTabPartidaId == 'elipsoidal-tab-partida') {

      var altura_visible_elipsoidal = document.getElementById('div-altura-partida-elipsoidal');
      altura_visible_elipsoidal.hidden = false;

    } else if (activeTabPartidaId == 'elipsoidal-decimal-tab-partida') {

      var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-partida-elipsoidal-decimal');
      altura_visible_elipsoidal_decimal.hidden = false;

    } else if (activeTabPartidaId == 'origen-nacional-tab-partida') {

      var altura_visible_origen_nacional = document.getElementById('div-altura-partida-origen-nacional');
      altura_visible_origen_nacional.hidden = false;

    } else if (activeTabPartidaId == 'plana-cartesiana-tab-partida') {

      var altura_visible_plana_cartesiana = document.getElementById('div-altura-partida-plana-cartesiana');
      altura_visible_plana_cartesiana.hidden = false;

    } else if (activeTabPartidaId == 'utm-tab-partida') {

      var altura_visible_utm = document.getElementById('div-altura-partida-utm');
      altura_visible_utm.hidden = false;

    } else if (activeTabPartidaId == 'gauss-kruger-tab-partida') {

      var altura_visible_gauss_kruger = document.getElementById('div-altura-partida-gauss-kruger');
      altura_visible_gauss_kruger.hidden = false;

    }
  } else {

    var altura_visible_elipsoidal = document.getElementById('div-altura-partida-elipsoidal');
    altura_visible_elipsoidal.hidden = true;

    var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-partida-elipsoidal-decimal');
    altura_visible_elipsoidal_decimal.hidden = true;

    var altura_visible_origen_nacional = document.getElementById('div-altura-partida-origen-nacional');
    altura_visible_origen_nacional.hidden = true;

    var altura_visible_plana_cartesiana = document.getElementById('div-altura-partida-plana-cartesiana');
    altura_visible_plana_cartesiana.hidden = true;

    var altura_visible_utm = document.getElementById('div-altura-partida-utm');
    altura_visible_utm.hidden = true;

    var altura_visible_gauss_kruger = document.getElementById('div-altura-partida-gauss-kruger');
    altura_visible_gauss_kruger.hidden = true;

    if (activeTabPartidaId == 'geocentrica-tab-partida') {
      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        var altura_visible_elipsoidal = document.getElementById('div-altura-destino-elipsoidal');
        altura_visible_elipsoidal.hidden = false;

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-destino-elipsoidal-decimal');
        altura_visible_elipsoidal_decimal.hidden = false;

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {

        var altura_visible_origen_nacional = document.getElementById('div-altura-destino-origen-nacional');
        altura_visible_origen_nacional.hidden = false;

      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {

        var altura_visible_plana_cartesiana = document.getElementById('div-altura-destino-plana-cartesiana');
        altura_visible_plana_cartesiana.hidden = false;

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        var altura_visible_utm = document.getElementById('div-altura-destino-utm');
        altura_visible_utm.hidden = false;

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        var altura_visible_gauss_kruger = document.getElementById('div-altura-destino-gauss-kruger');
        altura_visible_gauss_kruger.hidden = false;

      }

    }

  }

  if (activeTabPartidaId == 'plana-cartesiana-tab-partida') {
    var con = new conexion();

    console.log('dentro de planas cartesianas')

    var sist_refe = document.querySelector('input[name="sistemaPartida"]:checked').id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'

    try {
      await con.open();

      //seleccionar a todos los departamentos
      var query_departamentos = "select DISTINCT d.id, d.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where sr.nombre = ? order by d.nombre asc";
      var result_departamento = await con.getAll(query_departamentos, [sist_refe]);



      var select_departamento_planas_partida = document.getElementById('departamento-planas-partida');
      select_departamento_planas_partida.innerHTML = '<option value="defecto" >Seleccione Departamento</option>';

      result_departamento.forEach(i => {

        var option_departamento = document.createElement('option');
        option_departamento.value = i.id,
          option_departamento.textContent = i.nombre;


        select_departamento_planas_partida.appendChild(option_departamento);


      });



      //funcion para mostrar los municipios segun el departamento que se encuentre activo

      document.getElementById('departamento-planas-partida').addEventListener("change", async function () {
        //seleccionar a todos los departamentos
        var sist_refe = document.querySelector('input[name="sistemaPartida"]:checked').id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
        try {
          await con.open();
          var id_departamento = document.getElementById('departamento-planas-partida').value;
          var query_municipios = "select DISTINCT  m.id, m.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where m.fk_departamento = ? and sr.nombre = ? order by m.nombre asc";
          var parametros_municipio = [id_departamento.toString(), sist_refe]
          var result_municipio = await con.getAll(query_municipios, parametros_municipio);

          var select_municipios = document.getElementById('municipio-planas-partida');

          select_municipios.innerHTML = '<option value="defecto">Seleccione Municipio</option>';


          result_municipio.forEach(i => {

            var option_municipio = document.createElement('option');
            option_municipio.value = i.id,
              option_municipio.textContent = i.nombre;


            select_municipios.appendChild(option_municipio);
          });



          console.log(result_municipio)

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }





      });


      document.getElementById('municipio-planas-partida').addEventListener("change", async function () {
        var sist_refe = document.querySelector('input[name="sistemaPartida"]:checked').id == 'magnaSIRGASPartida' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
        try {
          await con.open();
          var select_municipio_detalle = document.getElementById('municipio-planas-partida').value;

          //traer todos los datos del origen cartografico
          var query_origen = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia  from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where m.id = ? and s.nombre = ? ";
          var parametros_detalle = [select_municipio_detalle, sist_refe]
          var result_origen_detalle = await con.getAll(query_origen, parametros_detalle);

          var detalle_select_origen = document.getElementById('detalle-planas-partida');
          detalle_select_origen.innerHTML = '<option value="defecto">Seleccione año, municipio y/o corregimiento</option>';

          result_origen_detalle.forEach(i => {

            var option_detalle = document.createElement('option');
            option_detalle.value = i.id,
              option_detalle.textContent = i.detalle;


            detalle_select_origen.appendChild(option_detalle);
          });
          console.log(result_origen_detalle)

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }

      });

      const detalle_origen = document.getElementById('informacion_origen_partida');
      if (detalle_origen) {
        detalle_origen.addEventListener('show.bs.modal', async function () {
          const modalBodyContent = document.getElementById('modal-body-content-partida');

          var id_origen_cartesiano = document.getElementById('detalle-planas-partida').value;
          console.log(id_origen_cartesiano);
          var mensaje_detalle = '';
          if (id_origen_cartesiano == 'defecto') {
            mensaje_detalle = '<h4>No has escogido origen de coordenadas cartesianas</h4>';

          } else {
            try {
              await con.open();
              var select_detalle_id = document.getElementById('detalle-planas-partida').value;


              //traer todos los datos del origen cartografico
              var query_detalle_id = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia, o.latitud, o.longitud , o.norte, o.este, o.plano_proyeccion from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where o.id = ?";
              var parametros_detalle_id = [select_detalle_id]
              var roc = await con.getOne(query_detalle_id, parametros_detalle_id);

              var headModal = document.getElementById('informacion_origen_Label_partida')
              headModal.innerHTML = roc.detalle;

              mensaje_detalle = `<label>Departamento: </label>${roc.departamento} <br>
                     <label>Municipio: </label>${roc.municipio} <br>
                     <h4>Elipsoidales</h4>
                     <label>Latitud de origen: </label>${roc.latitud} grados<br>
                     <label>Longitud de origen: </label>${roc.longitud} grados<br>
                     <h4>Planas</h4>
                     <label>Falso norte: </label>${roc.norte} m<br>
                     <label>Falso este: </label>${roc.este} m<br>
                     <label>Plano de proyección: </label>${roc.plano_proyeccion} m<br>
                     <h4>Descripción</h4>
                     ${roc.descripcion}

                     `

              console.log(roc)

            } catch (error) {
              console.error("Ocurrió un error:", error);
              return null;
            } finally {
              await con.close();
            }
          }

          if (modalBodyContent) {
            // Cambia textContent a innerHTML para interpretar el HTML en mensaje_detalle
            modalBodyContent.innerHTML = mensaje_detalle;

          }
        });
      }




      // console.log('resultados de origenes cartograficos ', result_origen)



    } catch (error) {
      console.error("Ocurrió un error:", error);
      return null;
    } finally {
      await con.close();
    }





  }


});

document.getElementById('myTabDestino').addEventListener("click", async function () {

  const activeTabPartida = document.querySelector("#myTabPartida .nav-link.active");

  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
  const sistemaLlegadaActivo = document.querySelector('input[name="sistemaLlegada"]:checked');

  const activeTabLlegada = document.querySelector("#myTabDestino .nav-link.active");
  const activeTabPartidaId = activeTabPartida ? activeTabPartida.id : null;
  const activeTabLlegadaId = activeTabLlegada ? activeTabLlegada.id : null;




  if (activeTabLlegadaId == 'geocentrica-tab-destino') {


    if (activeTabPartidaId == 'elipsoidal-tab-partida') {

      var altura_visible_elipsoidal = document.getElementById('div-altura-partida-elipsoidal');
      altura_visible_elipsoidal.hidden = false;

    } else if (activeTabPartidaId == 'elipsoidal-decimal-tab-partida') {

      var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-partida-elipsoidal-decimal');
      altura_visible_elipsoidal_decimal.hidden = false;

    } else if (activeTabPartidaId == 'origen-nacional-tab-partida') {

      var altura_visible_origen_nacional = document.getElementById('div-altura-partida-origen-nacional');
      altura_visible_origen_nacional.hidden = false;

    } else if (activeTabPartidaId == 'plana-cartesiana-tab-partida') {

      var altura_visible_plana_cartesiana = document.getElementById('div-altura-partida-plana-cartesiana');
      altura_visible_plana_cartesiana.hidden = false;

    } else if (activeTabPartidaId == 'utm-tab-partida') {

      var altura_visible_utm = document.getElementById('div-altura-partida-utm');
      altura_visible_utm.hidden = false;

    } else if (activeTabPartidaId == 'gauss-kruger-tab-partida') {

      var altura_visible_gauss_kruger = document.getElementById('div-altura-partida-gauss-kruger');
      altura_visible_gauss_kruger.hidden = false;

    }
  } else {

    var altura_visible_elipsoidal = document.getElementById('div-altura-partida-elipsoidal');
    altura_visible_elipsoidal.hidden = true;

    var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-partida-elipsoidal-decimal');
    altura_visible_elipsoidal_decimal.hidden = true;

    var altura_visible_origen_nacional = document.getElementById('div-altura-partida-origen-nacional');
    altura_visible_origen_nacional.hidden = true;

    var altura_visible_plana_cartesiana = document.getElementById('div-altura-partida-plana-cartesiana');
    altura_visible_plana_cartesiana.hidden = true;

    var altura_visible_utm = document.getElementById('div-altura-partida-utm');
    altura_visible_utm.hidden = true;

    var altura_visible_gauss_kruger = document.getElementById('div-altura-partida-gauss-kruger');
    altura_visible_gauss_kruger.hidden = true;

    if (activeTabPartidaId == 'geocentrica-tab-partida') {
      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

        var altura_visible_elipsoidal = document.getElementById('div-altura-destino-elipsoidal');
        altura_visible_elipsoidal.hidden = false;

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

        var altura_visible_elipsoidal_decimal = document.getElementById('div-altura-destino-elipsoidal-decimal');
        altura_visible_elipsoidal_decimal.hidden = false;

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {

        var altura_visible_origen_nacional = document.getElementById('div-altura-destino-origen-nacional');
        altura_visible_origen_nacional.hidden = false;

      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {

        var altura_visible_plana_cartesiana = document.getElementById('div-altura-destino-plana-cartesiana');
        altura_visible_plana_cartesiana.hidden = false;

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        var altura_visible_utm = document.getElementById('div-altura-destino-utm');
        altura_visible_utm.hidden = false;

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        var altura_visible_gauss_kruger = document.getElementById('div-altura-destino-gauss-kruger');
        altura_visible_gauss_kruger.hidden = false;

      }

    }

  }


  /*
si se encuentra activa planas cartesianas de destino se debe activar la opcion de seleccionar
departamento, el municipio y el origen cartesiano

*/
  if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {
    var con = new conexion();

    console.log('dentro de planas cartesianas')


    var sist_refe = document.querySelector('input[name="sistemaLlegada"]:checked').id == 'magnaSIRGASLlegada' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
    try {
      await con.open();

      //seleccionar a todos los departamentos
      var query_departamentos = "select DISTINCT d.id, d.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where sr.nombre = ? order by d.nombre asc";
      var result_departamento = await con.getAll(query_departamentos, [sist_refe]);



      var select_departamento_planas_destino = document.getElementById('departamento-planas-destino');
      select_departamento_planas_destino.innerHTML = '<option value="defecto" >Seleccione Departamento</option>';

      result_departamento.forEach(i => {

        var option_departamento = document.createElement('option');
        option_departamento.value = i.id,
          option_departamento.textContent = i.nombre;


        select_departamento_planas_destino.appendChild(option_departamento);


      });



      //funcion para mostrar los municipios segun el departamento que se encuentre activo

      document.getElementById('departamento-planas-destino').addEventListener("change", async function () {
        //seleccionar a todos los departamentos

        try {
          var sist_refe = document.querySelector('input[name="sistemaLlegada"]:checked').id == 'magnaSIRGASLlegada' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
          await con.open();
          var id_departamento = document.getElementById('departamento-planas-destino').value;
          var query_municipios = "select DISTINCT  m.id, m.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where m.fk_departamento = ? and sr.nombre = ? order by m.nombre asc";
          var parametros_municipio = [id_departamento.toString(), sist_refe]
          var result_municipio = await con.getAll(query_municipios, parametros_municipio);

          var select_municipios = document.getElementById('municipio-planas-destino');

          select_municipios.innerHTML = '<option value="defecto">Seleccione Municipio</option>';


          result_municipio.forEach(i => {

            var option_municipio = document.createElement('option');
            option_municipio.value = i.id,
              option_municipio.textContent = i.nombre;


            select_municipios.appendChild(option_municipio);
          });



          console.log(result_municipio)

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }





      });


      document.getElementById('municipio-planas-destino').addEventListener("change", async function () {

        try {
          await con.open();
          var select_municipio_detalle = document.getElementById('municipio-planas-destino').value;

          //traer todos los datos del origen cartografico
          var query_origen = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia  from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where m.id = ? and s.nombre = ? ";
          var sist_refe = document.querySelector('input[name="sistemaLlegada"]:checked').id == 'magnaSIRGASLlegada' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'

          console.log("informacion de sistema de partida pc ", document.getElementById('magnaSIRGASLlegada').value)
          console.log("sistema de referencia ", sist_refe)

          var parametros_detalle = [select_municipio_detalle, sist_refe]
          var result_origen_detalle = await con.getAll(query_origen, parametros_detalle);

          var detalle_select_origen = document.getElementById('detalle-planas-destino');
          detalle_select_origen.innerHTML = '<option value="defecto">Seleccione año, municipio y/o corregimiento</option>';

          result_origen_detalle.forEach(i => {

            var option_detalle = document.createElement('option');
            option_detalle.value = i.id,
              option_detalle.textContent = i.detalle;


            detalle_select_origen.appendChild(option_detalle);
          });
          console.log(result_origen_detalle)

        } catch (error) {
          console.error("Ocurrió un error:", error);
          return null;
        } finally {
          await con.close();
        }

      });

      const detalle_origen = document.getElementById('informacion_origen');
      if (detalle_origen) {
        detalle_origen.addEventListener('show.bs.modal', async function () {
          const modalBodyContent = document.getElementById('modal-body-content');

          var id_origen_cartesiano = document.getElementById('detalle-planas-destino').value;
          console.log(id_origen_cartesiano);
          var mensaje_detalle = '';
          if (id_origen_cartesiano == 'defecto') {
            mensaje_detalle = '<h4>No has escogido origen de coordenadas cartesianas</h4>';

          } else {
            try {
              await con.open();
              var select_detalle_id = document.getElementById('detalle-planas-destino').value;


              //traer todos los datos del origen cartografico
              var query_detalle_id = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia, o.latitud, o.longitud , o.norte, o.este, o.plano_proyeccion from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where o.id = ?";
              var parametros_detalle_id = [select_detalle_id]
              var roc = await con.getOne(query_detalle_id, parametros_detalle_id);

              var headModal = document.getElementById('informacion_origen_Label')
              headModal.innerHTML = roc.detalle;

              mensaje_detalle = `<label>Departamento: </label>${roc.departamento} <br>
                     <label>Municipio: </label>${roc.municipio} <br>
                     <h4>Elipsoidales</h4>
                     <label>Latitud de origen: </label>${roc.latitud} grados<br>
                     <label>Longitud de origen: </label>${roc.longitud} grados<br>
                     <h4>Planas</h4>
                     <label>Falso norte: </label>${roc.norte} m<br>
                     <label>Falso este: </label>${roc.este} m<br>
                     <label>Plano de proyección: </label>${roc.plano_proyeccion} m<br>
                     <h4>Descripción</h4>
                     ${roc.descripcion}

                     `

              console.log("info", roc)

            } catch (error) {
              console.error("Ocurrió un error:", error);
              return null;
            } finally {
              await con.close();
            }
          }

          if (modalBodyContent) {

            modalBodyContent.innerHTML = mensaje_detalle;

          }
        });
      }




      // console.log('resultados de origenes cartograficos ', result_origen)



    } catch (error) {
      console.error("Ocurrió un error:", error);
      return null;
    } finally {
      await con.close();
    }





  }


});

//fin de habilitacion de captura de altura elipsoidal
