const GRS80 = require("../class/GRS80");
const CTM12 = require("../class/CTM12");
const UTM = require("../class/UTM")
//vamos a definir las variables a utilizar:
const grs = new GRS80();
const ctm = new CTM12();
const utm = new UTM();

//coordenadas planas UTM a curvilineas


//el siguiente desarrollo es basado a la recopilación de las formulas del ingeniero Siervo William León Callejas

function utm_to_curvilineas(norte, este){

//primero se determina una latitud preliminar
var phi = norte/((a+b/2)*utm.k);

//se halla el radio medio de curvatura de la primera vertical
var N = (grs.c/(Math.sqrt(1+(Math.pow(grs.es2,2)*Math.pow(Math.cos(phi),2)))))*utm.k;

var Y1 = (este-utm.falso_este)/N;

var phi2 = Math.sin(2*phi);
var phi3 = phi2*Math.pow(Math.cos(phi),2);
var phi4 = phi+(phi2/2);
var phi5 = (3*phi4+phi3)/4;

//calculo de la longitud preliminar

var lambda = (5*phi5*phi3*Math.pow(Math.cos(phi),2))/3;

var phi6 = (3/4)*grs.es2;
var phi7 = (5/3)*Math.pow(phi6,2);
var phi8 = (35/27)*Math.pow(phi6,3);

var NTE = utm.k*grs.c*(phi-(phi6*phi4)+(phi7*phi5)-(phi8*lambda));
var ENN = (norte-NTE)/N;

var EN2 = ((grs.es2*Math.pow(Y1,2))/2)*Math.pow(Math.cos(phi),2);

var EN = Y1*(1-(EN2/3));

var ENphi = ENN*(1-EN2)+phi;

var Ee = (Math.pow(Math.exp(1),EN)-Math.pow(Math.exp(1),-EN))/2;

var EAC = Math.atan2(Ee, Math.cos(ENphi));

var EAT = Math.atan(Math.cos(EAC)*Math.tan(ENphi));

//calculo de la longitud final

var lambda_final = (EAC/Math.PI)*180 + (6*utm.zona-183)




}

