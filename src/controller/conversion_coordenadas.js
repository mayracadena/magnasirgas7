//aca llamamos las clases para poder trabajar con ellas de manera global

const elipsoide_referencia = require("../class/elipsoide_referencia");
const CTM12 = require("../class/CTM12");
const UTM = require("../class/UTM");
const planas_cartesianas = require("../class/planas_cartesianas");
const coord_planas = require("../class/coord_planas");
const coord_curvilineas = require("../class/coord_curvilineas");
const fs = require('fs');
const conexion = require('../db/conexion');


//funcion que llama el elipoide de referencia
async function elipoide(id) {
    var con = new conexion();
    try {
        await con.open();

        var elipsoide_grs80 = "select e.semieje_mayor, e.achatamiento from elipsoide e inner join sistema_referencia sr where sr.id = ?";
        var elip = await con.getOne(elipsoide_grs80, [id]);
        const elipsoide_consultado = new elipsoide_referencia(elip.semieje_mayor, elip.achatamiento);

        return elipsoide_consultado;
    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }
}


const ctm = new CTM12();
const utm = new UTM();

//coordenadas planas UTM a curvilineas


//El siguiente desarrollo es basado a la recopilación de las formulas del ingeniero Siervo William León Callejas
//Programado por:
//Mayra Yesenia Cadena Blanco - Ingeniera Catastral y Geodesta - Tecnologa en Análisis y Desarrollo de Sistemas de Información
//Michael Steveen Ramirez Bohorquez - Ingeniero Catastral y Geodesta


async function utm_a_curvilineas(norte, este, huso, sist_refe) {
    //llamar valores del sistema de referencia
    var elip = await elipoide(sist_refe);
    //primero se determina una latitud preliminar
    var phi = norte / (((elip.a + elip.b) / 2) * utm.k);

    //se halla el radio medio de curvatura de la primera vertical
    var N = ((elip.c) / (Math.sqrt(1 + elip.es2 * Math.pow(Math.cos(phi), 2)))) * utm.k;

    var Y1 = (este - utm.falso_este) / N;

    var phi2 = Math.sin(2 * phi);
    var phi3 = phi2 * Math.pow(Math.cos(phi), 2);
    var phi4 = phi + (phi2 / 2);
    var phi5 = (3 * phi4 + phi3) / 4;

    //calculo de la longitud preliminar

    var lambda = ((5 * phi5) + (phi3 * Math.pow(Math.cos(phi), 2))) / 3;

    var phi6 = (3 / 4) * elip.es2;
    var phi7 = (5 / 3) * Math.pow(phi6, 2);
    var phi8 = (35 / 27) * Math.pow(phi6, 3);

    var NTE = utm.k * elip.c * (phi - (phi6 * phi4) + (phi7 * phi5) - (phi8 * lambda));
    var ENN = (norte - NTE) / N;

    var EN2 = ((elip.es2 * Math.pow(Y1, 2)) / 2) * Math.pow(Math.cos(phi), 2);

    var EN = Y1 * (1 - (EN2 / 3));

    var ENphi = (ENN * (1 - EN2)) + phi;

    var Ee = (Math.exp(EN) - Math.exp(-EN)) / 2;

    var EAC = Math.atan(Ee / Math.cos(ENphi));

    var EAT = Math.atan(Math.cos(EAC) * Math.tan(ENphi));

    //calculo de la longitud final


    var lambda_final = (EAC * (180 / Math.PI)) + (6 * huso - 183);

    //var lambda_r = lambda_final*(Math.PI/180);

    //latitud final (radianes)

    var phi_fr = phi + (1 + (elip.es2 * Math.pow(Math.cos(phi), 2)) - ((3 / 2) * elip.es2 * Math.sin(phi) * Math.cos(phi) * (EAT - phi))) * (EAT - phi);
    var phi_fd = phi_fr * (180 / Math.PI)


    console.log(lambda_final);
    console.log(phi_fd);
    console.log(elip.f);




}

//utm_a_curvilineas(442397.820,722056.383,18);
//utm_a_curvilineas(553423.981,167286.202,19);




async function planas_cartesianas_a_curvilienas(coordenadas_planas, id_pc) {
    var con = new conexion();
    var oc = new coord_planas(coordenadas_planas.norte, coordenadas_planas.este);
    var elip = await elipoide();
    try {
        await con.open();
        var query_origen = "select * from origen_cartografico where id = ?";
        var parametros = [id_pc];
        var origen = await con.getOne(query_origen, parametros);
        var elipsoide_referencia = "select e.semieje_mayor, e.achatamiento from sistema_referencia sr inner join elipsoide e on e.id = sr.fk_elipsoide where sr.id = ?";
        var elip = await con.getOne(elipsoide_referencia, [origen.fk_sistema]);
        console.log(origen)
        console.log(elip)
    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }
}

var cpe = new coord_planas(27500, 26000);
planas_cartesianas_a_curvilienas(cpe, 2840);