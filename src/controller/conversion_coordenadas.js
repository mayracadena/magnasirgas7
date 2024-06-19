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


}

