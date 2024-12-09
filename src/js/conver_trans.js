const elipsoide_referencia = require("../class/elipsoide_referencia.js");
const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");
const conexion = require('../db/conexion.js');


//importacion de la libreria proj4
// const { utm_a_curvilineas, origen_nacional_a_curvilienas, planas_cartesianas_a_curvilienas, geocentricas_a_curvilineas, gauss_kruger_a_curvilineas, curvilienas_a_curvilienas, curvilienas_a_planas_cartesianas, curvilienas_a_origen_nacional, curvilineas_a_utm, curvilineas_a_geocentricas, curvilineas_a_gauss_kruger, origen_nacional_a_origen_nacional } = require('../controller/conversion');

//importación de modulos matemáticos
const {planas_cartesianas_a_curvilienas,geocentricas_a_curvilineas, curvilienas_a_geocentricas,planas_a_curvilineas, curvilienas_a_planas,curvilienas_a_planas_cartesianas } = require('../controller/conversion_coordenadas.js');

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
async function origen_gauss_kruger(longitud) {

  /*
  
  Estos valores fueron extraidos de la pagina oficial del IGAC 
  https://origen.igac.gov.co/herramientas.html
  
  Bogotá
  4.59904722222222
  -74.0809166666667
  _________________________
  Este Central
  4.59904722222222
  -71.0809166666667
  ________________________
  Este Este
  4.59904722222222
  -68.0809166666667
  ________________________
  Oeste
  4.59904722222222
  -77.0809166666667
  _________________________
  Oeste Oeste
  4.59904722222222
  -80.0809166666667
  __________________________
  Insular
  4.59904722222222
  -83.0809166666667
  
  */

  var bogota = -74.0809166666667;
  var este_central = -71.0809166666667;
  var este_este = -68.0809166666667;
  var oeste = -77.0809166666667;
  var oeste_oeste = -80.0809166666667;
  var insular = -83.0809166666667;

  /*
  Para cada origen se tiene 3 grados
  */

  var origen = "";

  if (longitud < insular + 1.5 && longitud >= insular - 1.5) {
    origen = "Insular"
  }
  else if (longitud < oeste_oeste + 1.5 && longitud >= oeste_oeste - 1.5) {
    origen = "Oeste Oeste"
  } else if (longitud < oeste + 1.5 && longitud >= oeste - 1.5) {
    origen = "Oeste"
  } else if (longitud < bogota + 1.5 && longitud >= bogota - 1.5) {
    origen = "Bogotá"
  }
  else if (longitud < este_central + 1.5 && longitud >= este_central - 1.5) {
    origen = "Este Central"
  }
  else if (longitud < este_este + 1.5 && longitud >= este_este - 1.5) {
    origen = "Este Este"
  } else {
    return "El origen no se encuentra"
  }

  return origen;

}


//captura cuando se escoge coordenadas geocentricas y se pone la opcion de altura elipsoidal
document.getElementById('myTabPartida').addEventListener("click", async function () {

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

  }


  /*
si se encuentra activa planas cartesianas de destino se debe activar la opcion de seleccionar
departamento, el municipio y el origen cartesiano

*/
  if (activeTabLlegadaId == 'plana-cartesiana-tab-destino') {
    var con = new conexion();

    console.log('dentro de planas cartesianas')

    if (sistemaLlegadaActivo.id == 'magnaSIRGASLlegada') {

      try {
        await con.open();

        //seleccionar a todos los departamentos
        var query_departamentos = "select * from departamento";
        var result_departamento = await con.getAll(query_departamentos);



        var select_departamento_planas_destino = document.getElementById('departamento-planas-destino');
        select_departamento_planas_destino.innerHTML = '';

        result_departamento.forEach(i => {

          var option_departamento = document.createElement('option');
          option_departamento.value = i.id,
            option_departamento.textContent = i.nombre;


          select_departamento_planas_destino.appendChild(option_departamento);
        });





        //traer todos los datos del origen cartografico
        var query_origen = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia from departamento d inner join municipio m on d.id = m.fk_departamento right join origen_cartografico o on m.id = o.fk_municipio left join  corregimiento c on c.id = o.fk_corregimiento left join sistema_referencia s on s.id = o.fk_sistema where s.nombre = 'MAGNA-SIRGAS' ";

        var result_origen = await con.getAll(query_origen);




        // console.log('resultados de origenes cartograficos ', result_origen)


      } catch (error) {
        console.error("Ocurrió un error:", error);
      } finally {
        await con.close();
      }
    }





  }

});

//fin de habilitacion de captura de altura elipsoidal


//funcion para mostrar los municipios segun el departamento que se encuentre activo

document.getElementById('departamento-planas-destino').addEventListener("change", async function () {
  //seleccionar a todos los departamentos
  var con = new conexion();
  var id_departamento = document.getElementById('departamento-planas-destino').value;
  //  var query_departamentos = "select id, nombre from municipio where fk_departamento = ?";
  //  var result_municipio = await con.getAll(query_departamentos, id_departamento);

  console.log(id_departamento)


 

});





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
        let coord_respuesta = await curvilienas_a_origen_nacional(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);


        var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este);

        document.getElementById('norte-destino').value = c_on.norte;
        document.getElementById('este-destino').value = c_on.este;

        

      } else if (activeTabLlegadaId == 'utm-tab-destino') {
        let coord_respuesta = await curvilineas_a_utm(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);

        var c_utm = new coord_utm(coord_respuesta.norte, coord_respuesta.este, altura, coord_respuesta.huso);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = c_utm.huso;


      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
        let coord_respuesta = await curvilineas_a_geocentricas(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
        var origen = await origen_gauss_kruger(c_cc.lambda);



        let coord_respuesta = await curvilineas_a_gauss_kruger(c_cc, origen, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte.toFixed(6);
        document.getElementById('este-gk-destino').value = c_pgk.este.toFixed(6);
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h.toFixed(6);
        document.getElementById('origen-gauss-destino').value = origen;


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

        let coord_respuesta = await curvilineas_a_utm(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);

        var c_utm = new coord_utm(coord_respuesta.norte, coord_respuesta.este, altura, coord_respuesta.huso);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = c_utm.huso;


      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

        let coord_respuesta = await curvilineas_a_geocentricas(c_cc, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;




      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {



      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {

        var origen = await origen_gauss_kruger(c_cc.lambda);

        let coord_respuesta = await curvilineas_a_gauss_kruger(c_cc, origen, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte.toFixed(6);
        document.getElementById('este-gk-destino').value = c_pgk.este.toFixed(6);
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h.toFixed(6);
        document.getElementById('origen-gauss-destino').value = origen;


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


      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {
        let coord_respuesta = await origen_nacional_a_curvilienas(c_on, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
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

        let coord_respuesta = await origen_nacional_a_curvilienas(c_on, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
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
        let coord_respuesta = await origen_nacional_a_origen_nacional(c_on, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);


        var c_on_r = new coord_planas(coord_respuesta.norte, coord_respuesta.este);



        document.getElementById('norte-destino').value = c_on_r.norte.toFixed(6);
        document.getElementById('este-destino').value = c_on_r.este.toFixed(6);

      } else if (activeTabLlegadaId == 'utm-tab-destino') {

        //origen nacional a curvilineas

        let on_a_cc = await origen_nacional_a_curvilienas(c_on, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);

        //de curvilineas a UTM
        let coord_respuesta = await curvilineas_a_utm(c_cc_r, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);


        var c_utm = new coord_utm(coord_respuesta.norte, coord_respuesta.este, altura, coord_respuesta.huso);
        document.getElementById('norte-utm-destino').value = c_utm.norte;
        document.getElementById('este-utm-destino').value = c_utm.este;
        document.getElementById('huso-destino').value = c_utm.huso;




      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {
        //origen nacional a curvilineas
        let on_a_cc = await origen_nacional_a_curvilienas(c_on, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);

        //de curvilineas a geocentricas
        let coord_respuesta = await curvilineas_a_geocentricas(c_cc_r, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z)
        document.getElementById('x-destino').value = c_geo.X;
        document.getElementById('y-destino').value = c_geo.Y;
        document.getElementById('z-destino').value = c_geo.Z;



      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {
        let on_a_cc = await origen_nacional_a_curvilienas(c_on, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);

        var c_cc_r = new coord_curvilineas(on_a_cc.phi, on_a_cc.lambda, on_a_cc.h);
        var origen = await origen_gauss_kruger(c_cc_r.lambda);

        let coord_respuesta = await curvilineas_a_gauss_kruger(c_cc_r, origen, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);
        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

        document.getElementById('norte-gk-destino').value = c_pgk.norte.toFixed(6);
        document.getElementById('este-gk-destino').value = c_pgk.este.toFixed(6);
        // document.getElementById('altura-destino-gauss-kruger').value = c_pgk.h.toFixed(6);
        document.getElementById('origen-gauss-destino').value = origen;



      }

    }
    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS GEOCENTRICA
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'geocentrica-tab-partida') {




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

      var c_utm = new coord_utm(norte_utm_partida, este_utm_partida, altura, huso_partida);

      console.log(c_utm);
      console.log(hemisferio_partida);

      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {
        let coord_respuesta = await utm_a_curvilineas(c_utm, hemisferio_partida, sistemaPartidaActivo.id, sistemaLlegadaActivo.id);


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

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {


      } else if (activeTabLlegadaId == 'utm-tab-destino') {

      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {


      }

    }

    /*
  ---------------------------------------------
  INICIO DE ENVIO DE COORDENADAS GAUSS KRÜGER
  ----------------------------------------------
  */
    else if (activeTabPartidaId == 'gauss-kruger-tab-partida') {




      if (activeTabLlegadaId == 'elipsoidal-tab-destino') {

      } else if (activeTabLlegadaId == 'elipsoidal-decimal-tab-destino') {

      } else if (activeTabLlegadaId == 'origen-nacional-tab-destino') {


      } else if (activeTabLlegadaId == 'utm-tab-destino') {

      } else if (activeTabLlegadaId == 'geocentrica-tab-destino') {

      } else if (activeTabLlegadaId == 'plana-cartesiana-tab-partida') {

      } else if (activeTabLlegadaId == 'gauss-kruger-tab-destino') {


      }

    }


  } else {
    console.log("No hay ninguna pestaña activa.");
  }
});



