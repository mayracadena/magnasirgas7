const elipsoide_referencia = require("../class/elipsoide_referencia.js");
const CTM12 = require("../class/CTM12.js");
const coord_utm = require("../class/UTM.js");
const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");

const { utm_a_curvilineas, origen_nacional_a_curvilienas, planas_cartesianas_a_curvilienas, geocentricas_a_curvilineas, gauss_kruger_a_curvilineas, curvilienas_a_curvilienas, curvilienas_a_planas_cartesianas, curvilienas_a_origen_nacional, curvilienas_a_utm, curvilineas_a_geocentricas, curvilineas_a_gauss_kruger } = require('../controller/conversion');



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



//captura cuando se escoge coordenadas geocentricas y se pone la opcion de altura elipsoidal
document.getElementById('myTabPartida').addEventListener("click", function(){

  const activeTabPartida = document.querySelector("#myTabPartida .nav-link.active");

  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
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

  }
});

document.getElementById('myTabDestino').addEventListener("click", function(){

  const activeTabPartida = document.querySelector("#myTabPartida .nav-link.active");

  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
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

  }
});

 //fin de habilitacion de captura de altura elipsoidal



  
  





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
    console.log("tab seleccionado:", activeTabPartidaId);
/*
---------------------------------------------
INICIO DE ENVIO DE COORDENADAS ELIPSOIDALES
----------------------------------------------
*/


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
    }
    console.log("captura cordenadas", lat_par, long_par, altura)
    var c_cc = new coord_curvilineas(lat_par, long_par, altura);


    //seccion de envio de datos de elipsoidales sexagesimal
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

      document.getElementById('latitud-decimal-destino').value = c_cc_r.phi;
      document.getElementById('longitud-decimal-destino').value = c_cc_r.lambda;



    } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {
      let coord_respuesta = await curvilienas_a_origen_nacional(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);


      var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este);

      

      document.getElementById('norte-destino').value = c_on.norte;
      document.getElementById('este-destino').value = c_on.este;
    } else if (activeTabLlegadaId == 'utm-tab-destino') {
      let coord_respuesta = await curvilienas_a_utm(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);

      var c_utm = new coord_utm(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.huso);
      document.getElementById('norte-utm-destino').value = c_utm.norte;
      document.getElementById('este-utm-destino').value = c_utm.este;
      document.getElementById('huso-destino').value = c_utm.huso;


    } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
      let coord_respuesta = await curvilineas_a_geocentricas(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
      var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
      document.getElementById('x-destino').value = c_geo.X;
      document.getElementById('y-destino').value = c_geo.Y;
      document.getElementById('z-destino').value = c_geo.Z;



    }




  } else {
    console.log("No hay ninguna pestaña activa.");
  }
});



