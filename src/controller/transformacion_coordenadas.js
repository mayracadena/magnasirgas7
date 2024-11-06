//el siguiente código es para transformar coordenadas de datum Bogotá a Magna Sirgas
//la transformación de coordenadas se realizará con coordenadas geocentricas

const conexion = require('../db/conexion');
const coord_geocentricas = require("../class/coord_geocentricas");
const coord_curvilineas = require("../class/coord_curvilineas");

/*
Region I
phi = 10.0 13.3 N
lambda = 73.0 71.0 W

Region II
phi = 9.4 11.6 N
lambda =76 73 W

Region III
phi = 8.0 9.4 N
lambda =77.6 74.4 W

Region IV
phi = 5.0 9.4 N
lambda = 74.4 72.0 W

Region V
phi = 5.0 8.0 N
lambda = 78.0 74.4 W 

Region VI
phi = 3.0 5.0 N
lambda = 78.0 74.4 W

Region VII
phi = 1.0 S 3.0 N
lambda = 79.0 74.0 W

Region VIII
phi = 4.5 S 3.0 N
lambda = 74.0 66.5 w

phi = 3.0 5.0 N
lambda = 74.4 66.5 w

phi = 5.0 7.3 N
lambda = 72.0 66.5 w
*/

async function elipoide(id) {
    var con = new conexion();
    try {
        await con.open();

        var query_elipsoide = "select e.semieje_mayor, e.achatamiento from elipsoide e inner join sistema_referencia sr where sr.id = ?";
        var result_elip = await con.getOne(query_elipsoide, [id]);
        const elipsoide_consultado = new elipsoide_referencia(result_elip.semieje_mayor, result_elip.achatamiento);

        return elipsoide_consultado;
    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }
}