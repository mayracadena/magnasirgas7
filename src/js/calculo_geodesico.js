//llamamos las funciones del calculo del problema geodesico directo e inverso
//este lo encontramos en controller/calculo_geodesico
const {problema_directo_Vicenty, problema_inverso_Vicenty} = require('../controller/calculo_geodesico');


//aca escucho el submit cuando envio los datos del calc_inver_direct.ejs
document.getElementById('cal_directo').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita que el formulario se envíe de la manera tradicional

    // Capturamos latitud
    var lat_gg = parseInt(document.getElementById('lat_gg_d').value);
    var lat_mm = parseInt(document.getElementById('lat_mm_d').value);
    var lat_ss =  parseFloat(document.getElementById('lat_ss_d').value);
    var hemisferio = document.getElementById('hemisferio').value;
    //capturamos longitud
    var long_gg = parseInt(document.getElementById('long_gg_d').value);
    var long_mm = parseInt(document.getElementById('long_mm_d').value);
    var long_ss =  parseFloat(document.getElementById('long_ss_d').value);
    //capturamos la distancia
    var dist =  parseFloat(document.getElementById('dist_d').value);
    //capturamos azimut de 1 a 2
    var az_gg = parseInt(document.getElementById('az_gg_d').value);
    var az_mm = parseInt(document.getElementById('az_mm_d').value);
    var az_ss =  parseFloat(document.getElementById('az_ss_d').value);

    //llamamos la funcion que lo vuelve a decimal
    var latitud = GMS_a_decimal(lat_gg, lat_mm, lat_ss);
    var longitud = GMS_a_decimal(long_gg, long_mm, long_ss);
    var azimut12 = GMS_a_decimal(az_gg, az_mm, az_ss);

    //cambiamos el signo si el hemisferio es sur en latitud
    if(hemisferio == 'S'){
        latitud = latitud*-1;
    }

    var resultado = problema_directo_Vicenty(latitud, longitud, azimut12,dist);
    console.log(resultado.phi2, resultado.lambda2, resultado.a21);
    //convertir la informacion en grados minutos y segundos
    var res_lat = grados_a_GMS(resultado.phi2);
    var res_long = grados_a_GMS(resultado.lambda2);
    var res_az21 = grados_a_GMS(resultado.a21);

    //ingresar los valores de grados minutos y segundos en los campos que definimos
    //latitud 2
    document.getElementById('res_lat_gg').value = res_lat.grados;
    document.getElementById('res_lat_mm').value = res_lat.minutos;
    document.getElementById('res_lat_ss').value = res_lat.segundos;
    //longitud 2
    document.getElementById('res_long_gg').value = res_long.grados;
    document.getElementById('res_long_mm').value = res_long.minutos;
    document.getElementById('res_long_ss').value = res_long.segundos;
    //azimut 2-1
    document.getElementById('res_az_gg').value = res_az21.grados;
    document.getElementById('res_az_mm').value = res_az21.minutos;
    document.getElementById('res_az_ss').value = res_az21.segundos;
    if(resultado.phi2 < 0){
        document.getElementById('res_hemisferio').value = 'S'
    }else{
        document.getElementById('res_hemisferio').value = 'N'
    }

});


//module.exports = { GMS_a_decimal };
//const { GMS_a_decimal } = require('./ruta');

function GMS_a_decimal(grados, minutos, segundos) {
    // Convertir minutos y segundos a grados decimales
    const decimalMinutos = minutos / 60;
    const decimalSegundos = segundos / 3600;
  
    // Sumar los grados decimales
    const grados_decimales = grados + decimalMinutos + decimalSegundos;
  
    return grados_decimales;
  }


  function grados_a_GMS(coordenada) {
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
