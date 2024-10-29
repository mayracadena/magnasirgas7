//aca llamamos las clases para poder trabajar con ellas de manera global

const elipsoide_referencia = require("../class/elipsoide_referencia");
const CTM12 = require("../class/CTM12");
const UTM = require("../class/UTM");
const planas_cartesianas = require("../class/coord_planas_cartesianas");
const coord_planas = require("../class/coord_planas");
const coord_curvilineas = require("../class/coord_curvilineas");
const fs = require('fs');
const conexion = require('../db/conexion');
const coord_curvilineas = require("../class/coord_curvilineas");


//funcion que llama el elipoide de referencia segun el datum escogido
async function elipoide(id) {
    var con = new conexion();
    try {
        await con.open();

        var query_elipsoide = "select e.semieje_mayor, e.achatamiento from elipsoide e inner join sistema_referencia sr where sr.id = ?";
        var reult_elip = await con.getOne(query_elipsoide, [id]);
        const elipsoide_consultado = new elipsoide_referencia(reult_elip.semieje_mayor, reult_elip.achatamiento);

        return elipsoide_consultado;
    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }
}


const ctm = new CTM12();
const utm = new UTM();



//El siguiente desarrollo es basado a la recopilación de las formulas del ingeniero Siervo William León Callejas
//Este modulo fue programado por:
//Mayra Yesenia Cadena Blanco - Ingeniera Catastral y Geodesta - Tecnologa en Análisis y Desarrollo de Sistemas de Información
//Michael Steveen Ramirez Bohorquez - Ingeniero Catastral y Geodesta


//coordenadas planas UTM a curvilineas
//
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



//esta funcion recibe un objeto de coordenadas planas y el id del origen cartografico escogido
async function planas_cartesianas_a_curvilienas(coordenadas_planas, id_pc) {
    var con = new conexion();
    var cp = new coord_planas(coordenadas_planas.norte, coordenadas_planas.este);

    //traer informacion de las coordenadas planas al hacer la conversion
    try {
        await con.open();
        //traer todos los datos del origen cartografico
        var query_origen = "select * from origen_cartografico where id = ?";
        var parametros = [id_pc];
        var result_origen = await con.getOne(query_origen, parametros);
        var oc = new planas_cartesianas(result_origen.id, result_origen.fk_sistema, result_origen.detalle, result_origen.anio, result_origen.fk_corregimiento, result_origen.fk_municipio, result_origen.latitud, result_origen.longitud, result_origen.norte, result_origen.este, result_origen.plano_proyeccion, result_origen.descripcion, result_origen.oficial);

        //traer todos los datos del elipsoide del sistema de referencia escogido
        var query_elipsoide_referencia = "select e.semieje_mayor, e.achatamiento from sistema_referencia sr inner join elipsoide e on e.id = sr.fk_elipsoide where sr.id = ?";
        var result_elip = await con.getOne(query_elipsoide_referencia, [result_origen.fk_sistema]);
        var elip = new elipsoide_referencia(result_elip.semieje_mayor, result_elip.achatamiento)

    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }

    
    //diferencia de coordenadas ingresadas y coordenadas de origen plano cartesiano
    var D_N = cp.norte - oc.fnorte;
    var D_E = cp.este - oc.feste;

    //cálculo de la normal en la latitud de origen de coordenadas
    //se debe cambiar la latitud del origen de coordenadasde decimal a radianes
    var N_phi0 = (elip.a) / (Math.sqrt(1 - (elip.e2 * Math.pow(Math.sin(oc.latitud * (Math.PI / 180)), 2))));
    //calculo del radio medio de curvatura
    var rho = (elip.a * (1 - elip.e2)) / (Math.pow(1 - (elip.e2 * (Math.pow(Math.sin(oc.latitud * (Math.PI / 180)), 2))), 3 / 2));

    //diferencias de latitud

    var D_phi = D_N / ((1 + oc.plano_proyeccion / (elip.a * (1 - elip.e2))) * rho) - ((Math.tan(oc.latitud * (Math.PI / 180)) / (2 * rho * N_phi0)) * (Math.pow(D_E / (1 + oc.plano_proyeccion / elip.a), 2)));

    //resultado final de latitud 
    var phi = (oc.latitud*Math.PI/180) + D_phi;

    //cálculo de la normal en la latitud de la coordenada
    //se debe cambiar la latitud de la coordenada previamente calculada del punto de decimal a radianes
    var N_phi = (elip.a) / (Math.pow(1 - (elip.e2 * Math.pow(Math.sin(phi), 2)), (1 / 2)));

    //se debe verificar que phi este en radianes o en grados
    var D_lambda = D_E / (N_phi * Math.cos(phi) * (1 + (oc.plano_proyeccion / elip.a)));

    var lambda = (oc.longitud) + (D_lambda*(180/Math.PI));

    var  coord_curvilineas = new coord_curvilineas((phi*180/Math.PI), lambda);

    return coord_curvilineas;
}



async function planas_cartesianas_a_curvilienas2(coordenadas_planas, id_pc) {
    var con = new conexion();
    var cp = new coord_planas(coordenadas_planas.norte, coordenadas_planas.este);

    //traer informacion de las coordenadas planas al hacer la conversion
    try {
        await con.open();
        //traer todos los datos del origen cartografico
        var query_origen = "select * from origen_cartografico where id = ?";
        var parametros = [id_pc];
        var result_origen = await con.getOne(query_origen, parametros);
        var oc = new planas_cartesianas(result_origen.id, result_origen.fk_sistema, result_origen.detalle, result_origen.anio, result_origen.fk_corregimiento, result_origen.fk_municipio, result_origen.latitud, result_origen.longitud, result_origen.norte, result_origen.este, result_origen.plano_proyeccion, result_origen.descripcion, result_origen.oficial);

        //traer todos los datos del elipsoide del sistema de referencia escogido
        var query_elipsoide_referencia = "select e.semieje_mayor, e.achatamiento from sistema_referencia sr inner join elipsoide e on e.id = sr.fk_elipsoide where sr.id = ?";
        var result_elip = await con.getOne(query_elipsoide_referencia, [result_origen.fk_sistema]);
        var elip = new elipsoide_referencia(result_elip.semieje_mayor, result_elip.achatamiento)

    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }

    var TN = (elip.a - elip.b) / (elip.a + elip.b);
    var A0 = 1 - TN + (5 * ((Math.pow(TN, 2) - Math.pow(TN, 3)) / 4)) + (81 * ((Math.pow(TN, 4) - Math.pow(TN, 5)) / 64));
    var A2 = 3 * ((TN - Math.pow(TN, 2) + ((7 * (Math.pow(TN, 3) - Math.pow(TN, 4) / 8)) + ((55 * Math.pow(TN, 5)) / 64))) / 2);
    var A4 = 15 * ((Math.pow(TN, 2) - Math.pow(TN, 3)) / 16) + ((3 * (Math.pow(TN, 4) - Math.pow(TN, 5))) / 64);
    var A6 = 35 * ((Math.pow(TN, 3) - Math.pow(TN, 4)) / 48) + ((11 * Math.pow(TN, 5)) / 64);
    //verificar si es -315
    var A8 = -315 * ((Math.pow(TN, 4) - Math.pow(TN, 5)) / 512);
    //k para planas cartesianas
    var D_N = (cp.norte - oc.fnorte);
    var D_E = cp.este - oc.feste;

    var phi1 = D_N / ((elip.a + elip.b) / 2);
    console.log("antes del do: ", phi1)
    var limite = 1e-12;

    do {
        var FP = elip.a * ((A0 * phi1) - A2 * Math.sin(2 * phi1) + (A4 * Math.sin(4 * phi1)) - (A6 * Math.sin(6 * phi1)) + A8 * Math.sin(8 * phi1)) * D_N;
        var FH = elip.a * (A0 - 2 * A2 * Math.cos(2 * phi1) + 4 * A4 * Math.cos(4 * phi1) - 6 * A6 * Math.cos(6 * phi1) + 8 * A8 * Math.cos(8 * phi1));
        var DIF = FP / FH;
        var phi2 = phi1 - DIF;
        DIF = phi2 - phi1;
        phi1 = phi2

        console.log("dentro del do: ", phi1)
        console.log("DIF abs: ", Math.abs(DIF))
    } while (Math.abs(DIF) < limite)

    var ETA = Math.sqrt((Math.pow(elip.a, 2) - Math.pow(elip.b, 2)) / (Math.pow(elip.b, 2) * Math.pow(Math.cos(phi1), 2)));
    var N = elip.a / Math.sqrt(1 - elip.e2 * (Math.pow(Math.sin(phi1), 2)))
    var rho = (elip.a * (1 - elip.e2)) / (Math.pow(1 - (elip.e2 * (Math.pow(Math.sin(phi1), 2))), 3 / 2));

    var T = Math.tan(phi1);
    var SP = Math.sin(phi1);
    var CP = Math.cos(phi1);

    //la latitud del punto esta dada por:
    var phip = phi1 - T * (D_E / N) * (D_E / (2 * rho)) + T * (Math.pow(D_E / N), 3) * (D_E / (24 * rho)) * (5 + 3 * Math.pow(T, 2) + Math.pow(ETA, 2) - T * (Math.pow(D_E / N, 5)) * (D_E / (720 * rho)) * (61 - 90 * Math.pow(T, 2)));

    //la longitud del punto está dada por:
    var lambdap = oc.longitud + (((D_E / N) - (Math.pow(D_E / N, 3) / 6) * (1 + 2 * Math.pow(T, 2) + Math.pow(ETA, 2) + (Math.pow(D_E / N, 5) / 120) * (5 + 6 * Math.pow(ETA, 2) + 28 * T - 3 * Math.pow(ETA, 4)))) / Math.cos(phi1));

    console.log("phi1: ", phi1)
    console.log("lambda 0: ", oc.longitud)
    console.log("phip: ", phip * (180 / Math.PI))
    console.log("lambdap: ", lambdap)

}





