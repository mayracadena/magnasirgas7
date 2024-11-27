const coord_curvilineas = require('../class/coord_curvilineas');
const coord_planas = require('../class/coord_planas');
const { utm_a_curvilineas, origen_nacional_a_curvilienas, planas_cartesianas_a_curvilienas, geocentricas_a_curvilineas, curvilienas_a_curvilienas, curvilienas_a_planas_cartesianas, curvilienas_a_origen_nacional, curvilienas_a_utm } = require('../controller/conversion');

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
    console.log("captura cordenadas", lat_par, long_par)
    var c_cc = new coord_curvilineas(lat_par, long_par);


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

      console.log(c_cc)
      console.log(coord_respuesta)
      console.log(sistemaPartidaActivo.id)
      console.log(sistemaLlegadaActivo.id)

      document.getElementById('norte-destino').value = c_on.norte;
      document.getElementById('este-destino').value = c_on.este;
    } else if (activeTabLlegadaId == 'utm-tab-destino') {
      let coord_respuesta = await curvilienas_a_utm(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);

      var c_utm = new coord_planas(coord_respuesta)
    }




  } else {
    console.log("No hay ninguna pestaña activa.");
  }
});



