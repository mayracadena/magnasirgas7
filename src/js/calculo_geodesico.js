
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


    

});