const conversion = require('../controller/conversion');

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


document.getElementById("calcular_trans_cover").addEventListener("click", function () {
  const sistemaPartidaActivo = document.querySelector('input[name="sistemaPartida"]:checked');
  const sistemaLlegadaActivo = document.querySelector('input[name="sistemaLlegada"]:checked');
  const myTabPartida = document.getElementById("myTabPartida");

  // Captura el id de la pestaña actualmente activa
  const activeTab = document.querySelector("#myTabPartida .nav-link.active");
  const activeTabId = activeTab ? activeTab.id : null;

  if (activeTabId) {
    console.log("Botón clickeado en la pestaña activa:", activeTabId);
    console.log("Botón sistema partida:", sistemaPartidaActivo.id);
    console.log("Botón sistema llegada:", sistemaLlegadaActivo.id);
    console.log("tab seleccionado:", activeTabId);

    if (activeTabId == 'elipsoidal-partida') {
      //captura de latitud
      var latitud_grados_partida = parseInt(document.getElementById('latitud-grados-partida').value);
      var latitud_minutos_partida = parseInt(document.getElementById('latitud-minutos-partida').value);
      var latitud_segundos_partida = parseFloat(document.getElementById('latitud-segundos-partida').value);
      var hemisferio_latitud = document.getElementById('latitud-hemisferio-partida').value;
      //captura longitud
      var longitud_grados_partida = parseInt(document.getElementById('longitud-grados-partida').value);
      var longitud_minutos_partida = parseInt(document.getElementById('longitud-minutos-partida').value);
      var longitud_segundos_partida = parseFloat(document.getElementById('longitud-segundos-partida').value);
      var hemisferio_longitud = document.getElementById('latitud-hemisferio-partida').value;

      //convertir en formato decimal

      var lat_par = GMS_a_decimal(latitud_grados_partida, latitud_minutos_partida, latitud_segundos_partida);
      var long_par = GMS_a_decimal(longitud_grados_partida, longitud_minutos_partida, longitud_segundos_partida);

      if (hemisferio_latitud == 'S') {
        latitud = latitud * -1;
      }
      if (hemisferio_longitud == 'W') {
        latitud = latitud * -1;
      }
    }


  } else {
    console.log("No hay ninguna pestaña activa.");
  }
});



