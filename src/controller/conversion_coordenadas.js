//aca llamamos las clases para poder trabajar con ellas de manera global

const elipsoide_referencia = require("../class/elipsoide_referencia");
const CTM12 = require("../class/CTM12");
const coord_utm = require("../class/UTM");
const coord_planas_cartesianas = require("../class/coord_planas_cartesianas");
const coord_planas = require("../class/coord_planas");
const coord_curvilineas = require("../class/coord_curvilineas");
const fs = require('fs');
const conexion = require('../db/conexion');
const coord_geocentricas = require("../class/coord_geocentricas");
const origen = require("../class/origen.js");

// import elipsoide_referencia from "../class/elipsoide_referencia.js";
// import CTM12 from "../class/CTM12.js";
// import coord_utm from "../class/UTM.js";
// import coord_planas_cartesianas from "../class/coord_planas_cartesianas.js";
// import coord_planas from "../class/coord_planas.js";
// import coord_curvilineas from "../class/coord_curvilineas.js";
// import fs from 'fs';
// import conexion from '../db/conexion.js';
// import coord_geocentricas from "../class/coord_geocentricas.js";
// import origen from '../class/origen.js'


//funcion que llama el elipoide de referencia segun el datum escogido
async function elipoide(sistema) {
    var con = new conexion();
    try {
        await con.open();

        var query_elipsoide = "select e.semieje_mayor, e.achatamiento from elipsoide e inner join sistema_referencia sr on e.id = sr.fk_elipsoide where sr.nombre = ?";
        var result_elip = await con.getOne(query_elipsoide, [sistema]);
        const elipsoide_consultado = new elipsoide_referencia(result_elip.semieje_mayor, result_elip.achatamiento);

        return elipsoide_consultado;
    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }
}






//El siguiente desarrollo es basado a la recopilación de las formulas del ingeniero Siervo William León Callejas
//Este modulo fue programado por:
//Mayra Yesenia Cadena Blanco - Ingeniera Catastral y Geodesta - Tecnologa en Análisis y Desarrollo de Sistemas de Información
//Michael Steveen Ramirez Bohorquez - Ingeniero Catastral y Geodesta


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
        var oc = new coord_planas_cartesianas(result_origen.id, result_origen.fk_sistema, result_origen.detalle, result_origen.anio, result_origen.fk_corregimiento, result_origen.fk_municipio, result_origen.latitud, result_origen.longitud, result_origen.norte, result_origen.este, result_origen.plano_proyeccion, result_origen.descripcion, result_origen.oficial);

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
    var phi = (oc.latitud * Math.PI / 180) + D_phi;

    //cálculo de la normal en la latitud de la coordenada
    //se debe cambiar la latitud de la coordenada previamente calculada del punto de decimal a radianes
    var N_phi = (elip.a) / (Math.pow(1 - (elip.e2 * Math.pow(Math.sin(phi), 2)), (1 / 2)));

    //se debe verificar que phi este en radianes o en grados
    var D_lambda = D_E / (N_phi * Math.cos(phi) * (1 + (oc.plano_proyeccion / elip.a)));

    var lambda = (oc.longitud) + (D_lambda * (180 / Math.PI));

    var coord_curvilineas = new coord_curvilineas((phi * 180 / Math.PI), lambda);

    return coord_curvilineas;
}



//funcion para cambiar de geocentricas a curvilineas
async function geocentricas_a_curvilineas(coord_geoc, sist_refe) {
    var geo = new coord_geocentricas(coord_geoc.X, coord_geoc.Y, coord_geoc.Z);
    //llamar valores del sistema de referencia segun el nombre que se envie
    var elip = await elipoide(sist_refe);

    var x2 = Math.pow(geo.X, 2);
    var y2 = Math.pow(geo.Y, 2);

    var raizCuad = Math.sqrt(x2 + y2);
    var nu = Math.atan(geo.Z * elip.a / raizCuad * elip.b);
    var fi1 = geo.Z + elip.es2 * elip.b * Math.pow(Math.sin(nu), 3);
    var fi2 = raizCuad - elip.e2 * elip.a * Math.pow(Math.cos(nu), 3);
    var laRad = Math.atan(fi1 / fi2);
    var latitud = laRad * (180 / Math.PI);
    var lat = Math.atan(geo.Z / raizCuad * (1 - elip.e2));

    let latPrev;
    do {
        latPrev = lat;
        var sinLat = Math.sin(lat);
        N = elip.a / Math.sqrt(1 - elip.e2 * Math.pow(sinLat, 2));
        h = raizCuad / Math.cos(lat) - N;
        lat = Math.atan((geo.Z + elip.e2 * N * sinLat) / raizCuad);
    } while (Math.abs(lat - latPrev) > 1e-12);

    var longitud = Math.atan2(geo.Y, geo.X) * (180 / Math.PI);
    // var senLaRad = Math.sin(laRad);
    // var cosLaRad = Math.cos(laRad);
    // var n1 = 1 - elip.e2 * Math.pow(senLaRad, 2);
    // var N = elip.a / Math.sqrt(n1);
    // var h = raizCuad / cosLaRad - N;
    var coord_elip = new coord_curvilineas(lat * (180 / Math.PI), longitud, h);

    console.log("geocentricas: ", coord_elip);


    return coord_elip;

}



//coordenadas planas de Gauss, planas origen nacional o planas UTM a curvilineas

async function planas_a_curvilineas(c_planas, origen, sist_refe) {
    // Instancia de coordenadas planas (Norte, Este, Altura)
    var cp = new coord_planas(c_planas.norte, c_planas.este, c_planas.h);

    // Parámetros del elipsoide
    var elip = await elipoide(sist_refe);

    // Conversión de origen.longitud a radianes (si viene en grados)
    var lambda0 = origen.longitud * Math.PI / 180;

    // Ajuste de las coordenadas planas con los factores de escala y falsos orígenes
    var DN = (cp.norte - origen.falso_norte) / origen.k;
    var DE = (cp.este - origen.falso_este) / origen.k;

    // Cálculo de TN (relacionado con la excentricidad del elipsoide)
    var TN = (elip.a - elip.b) / (elip.a + elip.b);

    // Coeficientes de la serie (A0, A2, A4, A6, A8)
  
    var A0 = 1 - TN + (5 * (Math.pow(TN, 2) - Math.pow(TN, 3)) / 4) + (81 * (Math.pow(TN, 4) - Math.pow(TN, 5)) / 64);
    var A2 = (3 * (TN - Math.pow(TN, 2) + (7 * (Math.pow(TN, 3) - Math.pow(TN, 4)) / 8) + (55 * Math.pow(TN, 5) / 64))) / 2;
    var A4 = (15 * ((Math.pow(TN, 2) - Math.pow(TN, 3)) / 16) + (3 * (Math.pow(TN, 4) - Math.pow(TN, 5)) / 64));
    var A6 = (35 * (Math.pow(TN, 3) - (Math.pow(TN, 4) / 48)) + (11 * Math.pow(TN, 5) / 768));
    var A8 = (-135 * (Math.pow(TN, 4) - Math.pow(TN, 5))) / 512;

    // Aproximación inicial de phi1
    var phi1 = DN / (elip.a * A0);

    // Iteración para encontrar phi1 con precisión
    var DIF = 1e12;
    var count = 0;
    while (Math.abs(DIF) > 1e-12) {
        var FP = elip.a * (A0 * phi1 - A2 * Math.sin(2 * phi1) + A4 * Math.sin(4 * phi1) - A6 * Math.sin(6 * phi1) + A8 * Math.sin(8 * phi1)) - DN;
        var FH = elip.a * (A0 - 2 * A2 * Math.cos(2 * phi1) + 4 * A4 * Math.cos(4 * phi1) - 6 * A6 * Math.cos(6 * phi1) + 8 * A8 * Math.cos(8 * phi1));
        DIF = FP / FH;
        phi1 = phi1 - DIF;
        count++
    }
    console.log(count)
    // Cálculo de variables auxiliares
    var T = Math.tan(phi1);
    var SP = Math.sin(phi1);
    var CP = Math.cos(phi1);

    // Cálculo de η (ETA)
    var ETA = Math.sqrt((Math.pow(elip.a, 2) - Math.pow(elip.b, 2)) / Math.pow(elip.b, 2)) * CP;

    // Cálculo de N y rho
    var N = elip.a / Math.sqrt(1 - elip.e2 * Math.pow(SP, 2));
    var rho = elip.a * (1 - elip.e2) / Math.pow(1 - elip.e2 * Math.pow(SP, 2), 1.5);

    // Cálculo de phi (latitud)
    var phi = phi1
        - (T * Math.pow(DE, 2) / (2 * rho * N))
        + (T * Math.pow(DE, 4) / (24 * rho * Math.pow(N, 3))) * (5 + 3 * Math.pow(T, 2) + Math.pow(ETA, 2) - 9 * Math.pow(ETA, 2) * Math.pow(T, 2))
        - (T * Math.pow(DE, 6) / (720 * rho * Math.pow(N, 5))) * (61 + 90 * Math.pow(T, 2) + 45 * Math.pow(T, 4));

    // Cálculo de lambda (longitud)
    var lambda = lambda0
        + (DE / (N * CP))
        - (Math.pow(DE, 3) / (6 * Math.pow(N, 3) * CP)) * (1 + 2 * Math.pow(T, 2) + Math.pow(ETA, 2))
        + (Math.pow(DE, 5) / (120 * Math.pow(N, 5) * CP)) * (5 + 28 * Math.pow(T, 2) + 24 * Math.pow(T, 4) + 6 * Math.pow(ETA, 2));

    // Conversión a grados
    var phi_deg = phi * (180 / Math.PI);
    var lambda_deg = lambda * (180 / Math.PI);

    // Retornar las coordenadas curvilíneas
    var coord_curvi = new coord_curvilineas(phi_deg, lambda_deg, cp.h);
    console.log(coord_curvi);

    return coord_curvi;
}

async function curvilienas_a_planas(coord_curvi, origen, sist_refe) {

    var c_c = new coord_curvilineas(coord_curvi.phi, coord_curvi.lambda, coord_curvi.h);
 
    

    // Convertir a radianes
    let phi = c_c.phi * Math.PI / 180;
    let lambda = c_c.lambda * Math.PI / 180;

    var elip = await elipoide(sist_refe);
    var a = elip.a;
    var b = elip.b;

    var e2 = elip.e2; 

    // Cálculo de TN
    var TN = (a - b) / (a + b);

    var A0 = 1 - TN + (5 * (Math.pow(TN, 2) - Math.pow(TN, 3)) / 4) + (81 * (Math.pow(TN, 4) - Math.pow(TN, 5)) / 64);
    var A2 = (3 * (TN - Math.pow(TN, 2) + (7 * (Math.pow(TN, 3) - Math.pow(TN, 4)) / 8) + (55 * Math.pow(TN, 5) / 64))) / 2;
    var A4 = (15 * ((Math.pow(TN, 2) - Math.pow(TN, 3)) / 16) + (3 * (Math.pow(TN, 4) - Math.pow(TN, 5)) / 64));
    var A6 = (35 * (Math.pow(TN, 3) - (Math.pow(TN, 4) / 48)) + (11 * Math.pow(TN, 5) / 768));
    var A8 = (-135 * (Math.pow(TN, 4) - Math.pow(TN, 5))) / 512;

    // Calcular la zona UTM a partir de la longitud en grados
    let ZONA = Math.floor((c_c.lambda + 180) / 6) + 1;
    // Meridiano central en grados -> luego a radianes
    let lambda0_deg = (6 * ZONA - 183);
    let lambda0 = lambda0_deg * Math.PI / 180;

    // Parámetros auxiliares
    let SP = Math.sin(phi);
    let CP = Math.cos(phi);
    let TP = Math.tan(phi);
    let T = TP * TP;

   
    let es2 = elip.es2;
    let C = es2 * (CP*CP);

    let D_lambda = lambda - lambda0;
    let N = a / Math.sqrt(1 - e2 * SP*SP);

    // Calcular M (Arco meridiano)
    let M = a*(A0*phi
             - A2*Math.sin(2*phi)
             + A4*Math.sin(4*phi)
             - A6*Math.sin(6*phi)
             + A8*Math.sin(8*phi));

   
    let A = CP * D_lambda;

    // Expansiones para ESTE
    let E1 = A;
    let E2 = (Math.pow(A,3)/6)*(1 - T + C);
    let E3 = (Math.pow(A,5)/120)*(5 - 18*T + T*T + 72*C - 58*es2);
    let ESTE = origen.falso_este + origen.k * N * (E1 + E2 + E3);

    // Expansiones para NORTE
    let N1 = (Math.pow(A,2)/2)*TP;
    let N2 = (Math.pow(A,4)/24)*TP*(5 - T + 9*C + 4*C*C);
    let N3 = (Math.pow(A,6)/720)*TP*(61 - 58*T + T*T + 600*C - 330*es2);

    let NORTE = origen.falso_norte + origen.k*(M + N*(N1+N2+N3));

    var c_p = new coord_planas(NORTE, ESTE, c_c.h);

    console.log(c_p)

    return c_p
}


//coordenadas planas UTM a curvilineas
//
async function utm_a_curvilineas(c_utm, sist_refe) {
    var utm = new coord_utm(c_utm.norte, c_utm.este, c_utm.huso);
    var norte = utm.norte - utm.falso_norte;
    var este = utm.este;
    var huso = utm.huso;
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
    var EAC = Math.atan2(Ee, Math.cos(ENphi));
    var EAT = Math.atan(Math.cos(EAC) * Math.tan(ENphi));

    var lambda_final = (EAC * (180 / Math.PI)) + (6 * huso - 183);

    var phi_fr = phi + (1 + (elip.es2 * Math.pow(Math.cos(phi), 2)) - ((3 / 2) * elip.es2 * Math.sin(phi) * Math.cos(phi) * (EAT - phi))) * (EAT - phi);
    var phi_fd = phi_fr * (180 / Math.PI)





    var coord_elip = new coord_curvilineas(phi_fd, lambda_final);

    console.log("utm: ", coord_elip)

    return coord_elip;


}

async function origen_nacional_a_curvilienas(coord_on, sist_refe) {
    var ctm = new CTM12();
    var cp = new coord_planas(coord_on.norte, coord_on.este);
    //llamar valores del sistema de referencia
    var elip = await elipoide(sist_refe);

    var norte = cp.norte;
    var este = cp.este;

    var phi = (norte - ctm.N0) / (((elip.a + elip.b) / 2) * ctm.k);

    //se halla el radio medio de curvatura de la primera vertical
    var N = ((elip.c) / (Math.sqrt(1 + elip.es2 * Math.pow(Math.cos(phi), 2)))) * ctm.k;

    var Y1 = (este - ctm.E0) / N;

    var phi2 = Math.sin(2 * phi);
    var phi3 = phi2 * Math.pow(Math.cos(phi), 2);
    var phi4 = phi + (phi2 / 2);
    var phi5 = (3 * phi4 + phi3) / 4;

    //calculo de la longitud preliminar

    var lambda = ((5 * phi5) + (phi3 * Math.pow(Math.cos(phi), 2))) / 3;

    var phi6 = (3 / 4) * elip.es2;
    var phi7 = (5 / 3) * Math.pow(phi6, 2);
    var phi8 = (35 / 27) * Math.pow(phi6, 3);
    var NTE = ctm.k * elip.c * (phi - (phi6 * phi4) + (phi7 * phi5) - (phi8 * lambda));
    var ENN = (norte - ctm.N0 - NTE) / N;
    var EN2 = ((elip.es2 * Math.pow(Y1, 2)) / 2) * Math.pow(Math.cos(phi), 2);
    var EN = Y1 * (1 - (EN2 / 3));
    var ENphi = (ENN * (1 - EN2)) + phi;
    var Ee = (Math.exp(EN) - Math.exp(-EN)) / 2;
    var EAC = Math.atan(Ee / Math.cos(ENphi));
    var EAT = Math.atan(Math.cos(EAC) * Math.tan(ENphi));

    var lambda_final = (EAC * (180 / Math.PI)) + ctm.landa0;


    var phi_fr = phi + (1 + elip.es2 * Math.pow(Math.cos(phi), 2) - ((3 / 2) * elip.es2 * Math.sin(phi) * Math.cos(phi) * (EAT - phi))) * (EAT - phi);
    var phi_final = (phi_fr * (180 / Math.PI)) + ctm.phi0;

    console.log(phi_final, lambda_final)



}


async function curvilienas_a_planas_cartesianas(coord_curvi, sist_refe, id_pc) {
    // Cargar parámetros del elipsoide
    var elip = await elipoide(sist_refe);
    var e2 = elip.e2;
    var a = elip.a;

    // Crear instancia de coordenadas curvilíneas
    var cc = new coord_curvilineas(coord_curvi.phi, coord_curvi.lambda, coord_curvi.h);

    // Conexión a la base de datos para obtener el origen cartográfico
    let oc;
    var con = new conexion();
    try {
        await con.open();
        var query_origen = "select * from origen_cartografico where id = ?";
        var parametros = [id_pc];
        var result_origen = await con.getOne(query_origen, parametros);

        oc = new coord_planas_cartesianas(
            result_origen.id,
            result_origen.fk_sistema,
            result_origen.detalle,
            result_origen.anio,
            result_origen.fk_corregimiento,
            result_origen.fk_municipio,
            result_origen.latitud,
            result_origen.longitud,
            result_origen.norte,
            result_origen.este,
            result_origen.plano_proyeccion,
            result_origen.descripcion,
            result_origen.oficial
        );

    } catch (error) {
        console.error("Ocurrió un error:", error);
        return null;
    } finally {
        await con.close();
    }

    // Conversión de coordenadas a radianes
    var laORad = oc.latitud * (Math.PI / 180);
    var loORad = oc.longitud * (Math.PI / 180);
    var laRad = cc.phi * (Math.PI / 180);
    var loRad = cc.lambda * (Math.PI / 180);

    var deltaLa = laRad - laORad;
    var deltaLo = loRad - loORad;

    var pp = oc.plano_proyeccion;

    // Cálculos auxiliares
    var senLaRad = Math.sin(laRad);
    var cosLaRad = Math.cos(laRad);
    var n1 = 1 - e2 * Math.pow(senLaRad, 2);
    var N = a / Math.sqrt(n1);

    var senLaORad = Math.sin(laORad);
    var no = 1 - e2 * Math.pow(senLaORad, 2);
    var No = a / Math.sqrt(no);

    var laM = (laORad + laRad) / 2;
    var sinLaMRad = Math.sin(laM);
    var n3 = 1 - e2 * Math.pow(sinLaMRad, 2);

    // Cálculo de M y Mo (curvaturas meridianas)
    var M = a * (1 - e2) / Math.pow(n3, 1.5);
    var Mo = a * (1 - e2) / Math.pow(no, 1.5);

    // Cálculo de N1, N2, N3
    // Uso de laRad en lugar de laORad para la tangente
    var N1 = Math.tan(laRad) * Math.pow(deltaLo * N * cosLaRad, 2);
    var N2 = 1 + pp / M;
    var N3 = 2 * Mo * No;

    // Cálculo del norte y este
    var norte = oc.fnorte + Mo * deltaLa + (N1 * N2 / N3);
    var E1 = deltaLo * N * cosLaRad;
    var E2 = 1 + pp / No;
    var este = E1 * E2 + oc.feste;

    // Crear la instancia final de coord_planas y retornarla
    var cp = new coord_planas(norte, este, cc.h);
    console.log("elipsoidales a planas:");
    console.log("Norte:", norte);
    console.log("Este:", este);

    return cp;
}



//seccion de pruebas

//  var cutm = new coord_utm(442397.8228989, 722056.3830013, 18);
//  utm_a_curvilineas(cutm, 2);

// var cgeoc = new coord_geocentricas(1851153.085 , -6054848.9154, 772207.3386);

//geocentricas_a_curvilineas(cgeoc, 2)

// var on = new coord_planas(2033154.021, 4966724.022);
// origen_nacional_a_curvilienas(on, 2);

var cc = new coord_curvilineas(4, -74, 0);
// curvilienas_a_planas_cartesianas(cc, 'MAGNA-SIRGAS', 1106);

// var cutm = new coord_utm(774218.962, 720945.889, 18);
// var cutm = new coord_utm(182536.187, 767028.416, 17);
// utm_a_curvilineas(cutm, 1, 1);


//ejemplo de planas a curvilineas
var o = new origen('18N', 0, -75, 0, 500000, 0.9996);
// var p = new coord_planas(442194.970, 611011.330, 0);
// var prueba_utm = planas_a_curvilineas(p, o, 18, 'N', 'MAGNA-SIRGAS');
var prueba2 = curvilienas_a_planas(cc, o, 'MAGNA-SIRGAS');