const GRS80 = require("../class/GRS80");
const CTM12 = require("../class/CTM12");
//vamos a definir las variables a utilizar:
const grs = new GRS80();
const ctm = new CTM12();


//la documentación de esta transformación esta en base a este estudio
//https://www.accessengineeringlibrary.com/content/book/9780071761123/back-matter/appendix6#/apxFeq33
//y en base al excel proporcionado por 
function ctm12_elipsoidales(x, y) {
  //primeros parametros de la ecuacion M0
  var m0, m1, m2, m3, m4;

  //primera excentricidad
  let e = grs.e2;
  //coordenadas punto de origen CMT12
  let phi = ctm.phi0 * (Math.PI / 180);
  //radio a
  let a = grs.a;
  let m = 0;
  let n0 = ctm.N0;
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
  console.log(lat_pun_hue);
  
}

ctm12_elipsoidales(5293373.2162, 1802673.2289);
