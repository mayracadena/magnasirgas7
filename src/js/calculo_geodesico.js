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

    var resultado = problema_directo_Vicenty(latitud, -longitud, azimut12,dist);
    console.log(resultado.phi2, resultado.lambda2, resultado.a21);
    //convertir la informacion en grados minutos y segundos
    var res_lat = decimal_a_GMS(resultado.phi2);
    var res_long = decimal_a_GMS(resultado.lambda2);
    var res_az21 = decimal_a_GMS(resultado.a21);

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

//calculo del problema geodesico inverso
document.getElementById('cal_inverso').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita que el formulario se envíe de la manera tradicional

    //captura de latitud 1
    var lat1_gg = parseInt(document.getElementById('lat1_gg_i').value);
    var lat1_mm = parseInt(document.getElementById('lat1_mm_i').value);
    var lat1_ss =  parseFloat(document.getElementById('lat1_ss_i').value);
    var hemisferio1 = document.getElementById('hemisferio1_i').value;
    //capturamos longitud 1
    var long1_gg = parseInt(document.getElementById('long1_gg_i').value);
    var long1_mm = parseInt(document.getElementById('long1_mm_i').value);
    var long1_ss =  parseFloat(document.getElementById('long1_ss_i').value);

    //captura de latitud 2
    var lat2_gg = parseInt(document.getElementById('lat2_gg_i').value);
    var lat2_mm = parseInt(document.getElementById('lat2_mm_i').value);
    var lat2_ss =  parseFloat(document.getElementById('lat2_ss_i').value);
    var hemisferio2 = document.getElementById('hemisferio2_i').value;
    //capturamos longitud 2
    var long2_gg = parseInt(document.getElementById('long2_gg_i').value);
    var long2_mm = parseInt(document.getElementById('long2_mm_i').value);
    var long2_ss =  parseFloat(document.getElementById('long2_ss_i').value);

     //llamamos la funcion que lo vuelve a decimal
     var latitud = GMS_a_decimal(lat1_gg, lat1_mm, lat1_ss);
     var longitud = GMS_a_decimal(long1_gg, long1_mm, long1_ss);
     var latitud2 = GMS_a_decimal(lat2_gg, lat2_mm, lat2_ss);
     var longitud2 = GMS_a_decimal(long2_gg, long2_mm, long2_ss);

     if(hemisferio1 == 'S'){
        latitud = latitud*-1;
    }
    if(hemisferio2 == 'S'){
        latitud2 = latitud2*-1;
    }
    //llamamos la función que realiza 
    var resultado = problema_inverso_Vicenty(latitud,-longitud,latitud2,-longitud2);
    //convertirmos la información de los azimutes en gms
    var res_az12 = decimal_a_GMS(resultado.a12);
    var res_az21 = decimal_a_GMS(resultado.a21);
    var s = parseFloat(resultado.s.toFixed(5));

    console.log(resultado);

    //pintamos los cuadros de respuesta 

    //ingresar los valores de grados minutos y segundos en los campos que definimos
    //distancia
    document.getElementById('res_s_i').value = s;
    //azimut de 1 a 2
    document.getElementById('res_az12_gg_i').value = res_az12.grados;
    document.getElementById('res_az12_mm_i').value = res_az12.minutos;
    document.getElementById('res_az12_ss_i').value = res_az12.segundos;
    //azimut de 2 a 1
    document.getElementById('res_az21_gg_i').value = res_az21.grados;
    document.getElementById('res_az21_mm_i').value = res_az21.minutos;
    document.getElementById('res_az21_ss_i').value = res_az21.segundos;


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

//limpiar datos de los inputs problema geodesico directo
document.getElementById('btn_limpiar_d').addEventListener('click', function() {
    
    document.getElementById('lat_gg_d').value = '';
    document.getElementById('lat_mm_d').value = '';
    document.getElementById('lat_ss_d').value = '';

    document.getElementById('long_gg_d').value = '';
    document.getElementById('long_mm_d').value = '';
    document.getElementById('long_ss_d').value = '';
   
    document.getElementById('dist_d').value = '';
   
    document.getElementById('az_gg_d').value = '';
    document.getElementById('az_mm_d').value = '';
    document.getElementById('az_ss_d').value = '';

    document.getElementById('res_lat_gg').value = '';
    document.getElementById('res_lat_mm').value = '';
    document.getElementById('res_lat_ss').value = '';
    //longitud 2
    document.getElementById('res_long_gg').value = '';
    document.getElementById('res_long_mm').value = '';
    document.getElementById('res_long_ss').value = '';
    //azimut 2-1
    document.getElementById('res_az_gg').value = '';
    document.getElementById('res_az_mm').value = '';
    document.getElementById('res_az_ss').value = '';
});

//limpiar datos de los inputs problema geodesico inverso
document.getElementById('btn_limpiar_i').addEventListener('click', function() {

     //latitud 1
     document.getElementById('lat1_gg_i').value = '';
     document.getElementById('lat1_mm_i').value = '';
     document.getElementById('lat1_ss_i').value = '';
     
     //longitud 1
     document.getElementById('long1_gg_i').value = '';
     document.getElementById('long1_mm_i').value = '';
     document.getElementById('long1_ss_i').value = '';
 
     //latitud 2
     document.getElementById('lat2_gg_i').value = '';
     document.getElementById('lat2_mm_i').value = '';
     document.getElementById('lat2_ss_i').value = '';
     
     //longitud 2
     document.getElementById('long2_gg_i').value = '';
     document.getElementById('long2_mm_i').value = '';
     document.getElementById('long2_ss_i').value = '';

    //distancia
    document.getElementById('res_s_i').value = '';
    //azimut de 1 a 2
    document.getElementById('res_az12_gg_i').value = '';
    document.getElementById('res_az12_mm_i').value = '';
    document.getElementById('res_az12_ss_i').value = '';
    //azimut de 2 a 1
    document.getElementById('res_az21_gg_i').value = '';
    document.getElementById('res_az21_mm_i').value = '';
    document.getElementById('res_az21_ss_i').value = '';
});