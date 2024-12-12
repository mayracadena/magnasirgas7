
const conexion = require('../db/conexion.js');
const origen = require('../class/origen.js');
const coord_curvilineas = require('../class/coord_curvilineas.js');
const coord_planas = require('../class/coord_planas.js');

async function origen_nacional() {
    var con =  new conexion();
    var o;
    try{
        await con.open();
        var query = "select * from origen_nacional";
        var res = await con.getOne(query);

         o = new origen(res.nombre, res.latitud, res.longitud, res.norte, res.este, res.escala);

        
    }catch (error) {
        console.error("Ocurrió un error:", error);
        return null;
    } finally {
        await con.close();
    }

    
    return o;
    
}

async function gauss_kruger(nombre, sist_refe) {
    var con =  new conexion();
    var sistema, gauss;
    if(sist_refe == 'BOGOTÁ'){
        sistema = 1;
    }else{
        sistema = 2;
    }

    try{
        await con.open();
        var query = "select * from origenes_gauss where nombre = ? and fk_sistema = ?";
        var parametros = [nombre, sistema]
        var res = await con.getOne(query, parametros);

         gauss = new origen(res.nombre, 0, res.longitud, res.norte_0, res.este, 1);

        
    }catch (error) {
        console.error("Ocurrió un error:", error);
        return null;
    } finally {
        await con.close();
    }
    
    
    return gauss;
}

async function origen_UTM(cc) {
    var c = new coord_curvilineas(cc.phi, cc.lambda);

    var zona = Math.ceil((c.lambda + 180)/6);
    var hemisferio = c.phi >= 0 ? "N": "S";
    var longitud = -180 + 6 * (zona-1)+3;
    var falso_este = 500000;
    var falso_norte = hemisferio == "N" ? 0 : 10000000;

    var o =  new origen(`${zona}${hemisferio}`, 0, longitud, falso_norte, falso_este, 0.9996);

   
    console.log(o)
    return o;
}

async function origen_UTM_planas_a_curvilienas(zona, hemisferio) {
    
    var falso_este = 500000;
    var falso_norte = hemisferio == 'N' ? 0 : 10000000;

    var longitud = -180 + 6 * (zona-1)+3;

    var o =  new origen(`${zona}${hemisferio}`, 0, longitud, falso_norte, falso_este, 0.9996);

   
    console.log(o)
    return o;
}



module.exports = {origen_nacional, gauss_kruger, origen_UTM , origen_UTM_planas_a_curvilienas}