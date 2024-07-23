const elipsoide_referencia = require("../class/elipsoide_referencia");
const CTM12 = require("../class/CTM12");
const UTM = require("../class/UTM");
const fs = require('fs');

//llamar al json de elipsoides donde tenemos los parametros a y f
ruta_elipsoide = "../data/elipsoides.json";
//leer el archivo
const contenido = fs.readFileSync(ruta_elipsoide, 'utf8');

const jsonElipsoide = JSON.parse(contenido);
const grs80 = jsonElipsoide.GRS80;
const hayford = jsonElipsoide.HAYFORD;


//vamos a definir las variables a utilizar:
const grs = new elipsoide_referencia(grs80.a, grs80.f);
const hyfrd = new elipsoide_referencia(hayford.a, hayford.f);
const ctm = new CTM12();
const utm = new UTM();

//coordenadas planas UTM a curvilineas


//El siguiente desarrollo es basado a la recopilación de las formulas del ingeniero Siervo William León Callejas
//Programado por:
//Mayra Yesenia Cadena Blanco - Ingeniera Catastral y Geodesta - Tecnologa en Análisis y Desarrollo de Sistemas de Información
//Michael Steveen Ramirez Bohorquez - Ingeniero Catastral y Geodesta


function utm_a_curvilineas(norte, este, huso){

//primero se determina una latitud preliminar
var phi = norte/(((grs.a+grs.b)/2)*utm.k);

//se halla el radio medio de curvatura de la primera vertical
var N = ((grs.c)/(Math.sqrt(1+grs.es2*Math.pow(Math.cos(phi),2))))*utm.k;

var Y1 = (este-utm.falso_este)/N;

var phi2 = Math.sin(2*phi);
var phi3 = phi2*Math.pow(Math.cos(phi),2);
var phi4 = phi+(phi2/2);
var phi5 = (3*phi4+phi3)/4;

//calculo de la longitud preliminar

var lambda = ((5*phi5)+(phi3*Math.pow(Math.cos(phi),2)))/3;

var phi6 = (3/4)*grs.es2;
var phi7 = (5/3)*Math.pow(phi6,2);
var phi8 = (35/27)*Math.pow(phi6,3);

var NTE = utm.k*grs.c*(phi-(phi6*phi4)+(phi7*phi5)-(phi8*lambda));
var ENN = (norte-NTE)/N;

var EN2 = ((grs.es2*Math.pow(Y1,2))/2)*Math.pow(Math.cos(phi),2);

var EN = Y1*(1-(EN2/3));

var ENphi = (ENN*(1-EN2))+phi;

var Ee = (Math.exp(EN)-Math.exp(-EN))/2;

var EAC = Math.atan(Ee/ Math.cos(ENphi));

var EAT = Math.atan(Math.cos(EAC)*Math.tan(ENphi));

//calculo de la longitud final


var lambda_final = (EAC*(180/Math.PI)) + (6*huso-183);

//var lambda_r = lambda_final*(Math.PI/180);

//latitud final (radianes)

var phi_fr = phi + (1+(grs.es2*Math.pow(Math.cos(phi),2))-((3/2)*grs.es2*Math.sin(phi)*Math.cos(phi)*(EAT-phi)))*(EAT-phi);
var phi_fd = phi_fr*(180/Math.PI)


console.log(lambda_final);
console.log(phi_fd);
console.log(grs.f);




}

//utm_a_curvilineas(442397.820,722056.383,18);
//utm_a_curvilineas(553423.981,167286.202,19);




function planas_cartesianas_a_curvilienas(){

}