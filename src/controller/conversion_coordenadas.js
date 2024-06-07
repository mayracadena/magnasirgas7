const GRS80 = require("../class/GRS80");
const CTM12 = require("../class/CTM12");
//vamos a definir las variables a utilizar:
const grs = new GRS80();
const ctm = new CTM12();


//la documentación de esta transformación esta en base a este estudio
//https://www.accessengineeringlibrary.com/content/book/9780071761123/back-matter/appendix6#/apxFeq33
//y en base al excel proporcionado por 
function ctm12_to_elipsoidales(x, y) {
  //primeros parametros de la ecuacion M0
  var m0, m1, m2, m3, m4;

  //primera excentricidad
  let e = grs.e2;
  //seegunda excentricidad
  let es2 = grs.es2;
  //coordenadas punto de origen CMT12
  let phi = ctm.phi0 * (Math.PI / 180);
  //radio a
  let a = grs.a;
  let m = 0;
  let n0 = ctm.N0;
  let e0 = ctm.E0;
  let k0 = ctm.k;
  //rectificación de la latitud
  let u = 0;

  var e1 = 0;
  //latitud de punto de huella
  var lat_pun_hue = 0;
  var lph1, lph2, lph3, lph4;

  //para determinar Mo (distancia al meridiano a la latitud cero)
  // primero se separa las ecuaciones en m1, m2, m3 y m4 para facilitar su consulta y transformación a futuro
  m1 = (1 - e / 4 - (3 * e ** 2) / 64 - (5 * e ** 3) / 256) * phi;
  m2 =
    ((3 * e) / 8 + (3 * e ** 2) / 32 + (45 * e ** 3) / 1024) *
    Math.sin(2 * phi);
  m3 = ((15 * e ** 2) / 256 + (45 * e ** 3) / 1024) * Math.sin(4 * phi);
  m4 = ((35 * e ** 3) / 3072) * Math.sin(6 * phi);
  m0 = a * (m1 - m2 + m3 - m4);

  //distancia del meridiano a la latitud
  //m = mo+((Y-N0)/k0)
  m = m0 + (y - n0) / k0;

  //funcion de la rectificación de la latitud
  //=m/(a*(1-(e^2/4)-((3*(e^4))/64)-((5*(e^6))/256)))
  u = m / (a * (1 - e / 4 - (3 * e ** 2) / 64 - (5 * e ** 3) / 256));

  e1 = (1 - Math.sqrt(1 - e)) / (1 + Math.sqrt(1 - e));


  //latitud de punto de huella
  //se tomara por sectores para hallar la latitud de punto de huella
  //lph1=(((3*e1)/2)-((27*(e1^3))/32))*(SENO(2*u))
  lph1 = ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * u);
  

  //lph2=(((21*(e1^2))/16)-((55*(e1^4))/32))*(SENO(4*u))
  lph2 = (((21 * (e1 ** 2)) / 16) - ((55 * (e1 ** 4)) / 32)) * (Math.sin(4 * u));
  //lph3=((151*(e1^3))/96)*(SENO(6*u))
  lph3 = ((151 * e1 ** 3) / 96) * Math.sin(6 * u);
  //lph4=((1097*(e1^4))/512)*(SENO(8*u))
  lph4 = ((1097 * e1 ** 4) / 512) * Math.sin(8 * u);

  //latitud de punto de huella total
  lat_pun_hue = u+lph1+lph2+lph3+lph4;
  
  
//terminos adicionales
var t1 = Math.pow(Math.tan(lat_pun_hue),2);
var c1 = es2*(Math.pow(Math.cos(lat_pun_hue),2));

//radio medio de curvatura
//R1=(a*(1-e^2))/((1-(e^2*((SENO(lat_pun_hue))^2)))^(3/2))
var R1 = (a*(1-e))/(Math.pow((1-(e*(Math.pow((Math.sin(lat_pun_hue)),2)))),1.5));

//radio de curvatura principal
//N1=a/(RAIZ(1-(e^2*((SENO(lat_pun_hue))^2))))
var N1 = a/(Math.sqrt((1-(e*(Math.pow(Math.sin(lat_pun_hue),2))))));

//parametro adicional
//D=(x-e0)/(n1*k)
var D = (x-e0)/(N1*k0);

//proceso para hallar latitud y longitud elipsoidales finales

//partes cortas de la ecuacion para hallar la latitud
var lat1 = (N1*Math.tan(lat_pun_hue))/R1;
var lat2 = Math.pow(D,2)/2;
//=(5+(3*t1)+(10*c1)-(4*(c1^2))-(9*es2))*((d^4)/24)
var lat3 = (5+(3*t1)+(10*c1)-(4*Math.pow(c1,2))-(9*es2))*(Math.pow(D,4)/24);
//=(61+(90*t1)+(298*c1)+(45*(t1^2))-(252*es2)-(3*(c1^2)))*((D^6)/720)
var lat4 = (61+(90*t1)+(298*c1)+(45*Math.pow(t1,2))-(252*es2)-(3*Math.pow(c1,2)))*(Math.pow(D,6)/720);

var latitud = lat_pun_hue-(lat1*(lat2-lat3+lat4));
var dms_lat =radians_to_degrees(latitud);

//partes de la ecuacion para hallar la longitud
var long_degrees = ctm.landa0*(Math.PI/180);
//1/cos(lat)
var lon1 = 1/Math.cos(lat_pun_hue);
//=(1+(2*t1)+c1)*((D^3)/6)
var lon2 = (1+(2*t1)+c1)*(Math.pow(D,3)/6);
//=(5-(2*c1)+(28*t1)-(3*(c1^2))+(8*es2)+(24*(t1^2)))*((D^5)/120)
var lon3 = (5-(2*c1)+(28*t1)-(3*(Math.pow(c1,2)))+(8*es2)+(24*(Math.pow(t1,2))))*((Math.pow(D,5))/120)

var longitud = long_degrees+lon1*(D-lon2+lon3);
var dms_long = radians_to_degrees(longitud);
console.log(longitud);
console.log(dms_long.grados);
console.log(dms_long.minutos);
console.log(dms_long.segundos);

console.log("__________________________________");
console.log(latitud);
console.log(dms_lat.grados);
console.log(dms_lat.minutos);
console.log(dms_lat.segundos);

}

function radians_to_degrees(rad){
  if(rad < 0){
    rad = rad*-1;
  }

  // Convertir radianes a grados
  var grados = rad * (180 / Math.PI);

  // Calcular los minutos y segundos
  var grados_enteros = Math.floor(grados);
  var minutos_totales = (grados - grados_enteros) * 60;
  var minutos = Math.floor(minutos_totales);
  var segundos = Number((minutos_totales - minutos) * 60).toFixed(5);

  return {
      grados: grados_enteros,
      minutos: minutos,
      segundos: segundos
  };
}


ctm12_to_elipsoidales(5293373.2162, 1802673.2289);
