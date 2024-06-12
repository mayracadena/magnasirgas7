const GRS80 = require("../class/GRS80");
const grs = new GRS80();
//el apartado de bowring esta supeditado a la aprobación
//por ahora solo quedan los modulos sin uso
//para este calculo se tomo las ecuaciones encontradas en libro de Richard Rapp
//denominado curso geodesia, geodesia geometrica, volumn 1, principios basicos
//junio 1988, universidad estatal de Ohio

//para el calculo directo e inverso se usara las formulas de Bowring

function constantes_bowring(phi) {
  //lo primero es hallar las constantes A,B y C
  var A = Math.pow(1 + grs.e2 * Math.pow(Math.cos(phi), 4), 1 / 2);
  var B = Math.pow(1 + grs.e2 * Math.pow(Math.cos(phi), 2), 1 / 2);
  var C = Math.pow(1 + grs.e2, 1 / 2);

  return {
    A: A,
    B: B,
    C: C,
  };
}

function problema_directo_bowring(phi1, landa1, a12, s) {
  //las incognitas que recibe esta funcion son
  //latitud, longitud, azimut de 1a 2, y la distancia

  var constantes = constantes_bowring(phi1);
  let A = constantes.A;
  let B = constantes.B;
  let C = constantes.C;

  //sigma = sB^2/(aC)
  var sigma = (s * Math.pow(B, 2)) / (grs.a * C);

  //landa2 = landa1+(1/A)*tan^-1((A*tan(sigma)*sen(a12))/((B*cos(phi1)-tan(sigma)*sen(phi)*cos(a12))))
  var landa2 =
    landa1 +
    (1 / A) *
      Math.atan(
        (A * Math.tan(sigma) * Math.sin(a12)) /
          (B * Math.cos(phi1) -
            Math.tan(sigma) * Math.sin(phi1) * Math.cos(a12))
      );

  //w
  var w = (A * (landa2 - landa1)) / 2;
  //D
  var D =(1/2)*Math.asin(
      Math.sin(sigma) *
        (Math.cos(a12) - (1 / A) * Math.sin(phi1) * Math.sin(a12) * Math.tan(w))
    );
  //phi 2
  var phi2 =phi1+2*D*(B-(3/2)*grs.e2*D*Math.sin(2*phi1 + (4/3)*B*D));
  //Azimut de a21
  var a21 = Math.atan2(
    -B * Math.sin(a12),
    Math.cos(sigma) * (Math.tan(sigma) * Math.tan(phi1) - B * Math.cos(a12))
  );
  /* if(a12 <=90 && a12 > 0){
        a21 = 180+a21+a12;
    }else if(a12 >90 && a12 <=180){
        a21 = 180+a21+a12;
    }else if(a12 >180 && a12 <=270){
        a21 = 360+a21+a12;
    }else if(a12 >270 && a12 <=360){
        a21 = 360+a21+a12;
    }
     */

  //se tiene que revisar el sigma

  console.log("latitud: ", phi1);
  console.log("longitud: ", landa1);
  console.log("azimut 1-2: ", a12);
  console.log("__________________");
  console.log("latitud: ", phi2);
  console.log("longitud: ", landa2);
  console.log("azimut 2-1: ", a21);
}


//problema_directo_bowring(4, -73, 45, 100);

//Problema geodesico directo de Vincenty
//este es el algoritmo mas utilizado debidoa  su precisión
//tomado del siguiente link: https://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf

function problema_directo_Vicenty(phi1, landa1, a12, s) {
  //se convierten los datos de entrada de decimales a radianes para poder trabajar este procedimiento
  phi1 = phi1*(Math.PI/180);
  landa1 = landa1*(Math.PI/180);
  a12 = a12*(Math.PI/180);

  //a12 es el mismo alpha1

  //latitud reducida
  var U1 = Math.atan((1 - grs.f) * Math.tan(phi1));
  //azimut geodesico
  var alpha = Math.asin(Math.cos(U1) * Math.sin(a12));

  //sigma → tan(sigma) = tan(U1)/cos(a12)
  var sigma1 = Math.atan(Math.tan(U1) / Math.cos(a12));
  //u^2 = cos^2(alpha)*(a^2-b^2)/b
  var u2 =(Math.pow(Math.cos(alpha), 2)*((Math.pow(grs.a, 2) - Math.pow(grs.b, 2)))/Math.pow(grs.b, 2));

  //constantes A
  var A = 1 + ((u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2))));
  //constante B
  var B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (320 - 175 * u2)));

  var sigma = s / (grs.b * A);

  //no se sabe de donde viene esta constante por el momento
  var sigmaP = 2*Math.PI;
  const limit = 1.0e-12;

  //Se debe iterar hasta que halla un cambio insignificante en sigma
  while (Math.abs(sigma - sigmaP) > limit) {
    //se declara este 2sigmaM como sigmaM
    var sigmaM = (2 * sigma1) + sigma;

    //se va hallar deltaSigma por partes

    //cos(sigma)(-1+2*cos^2(2sigmaM))
    var deltaSigma1 = Math.cos(sigma) * (-1 + 2 * Math.pow(Math.cos(sigmaM), 2));
    //1/6*B*cos(2*sigmaM)
    var deltaSigma2 = (1 / 6) * B * Math.cos(sigmaM);
    //-3+4*sen^2sigma
    var deltaSigma3 = -3 + 4 * Math.pow(Math.sin(sigma), 2);
    //-3+4Cos^2(2*sigmaM)
    var deltaSigma4 = -3 + 4 * Math.pow(Math.cos(sigmaM), 2);
    //ahora juntamos todo para la ecuacion completa de deltaSigma
    var deltaSigma = B*Math.sin(sigma)*(Math.cos(sigmaM)+(B/4)*(deltaSigma1-deltaSigma2*deltaSigma3*deltaSigma4));
    sigmaP = sigma;
    sigma = s / (grs.b * A) + deltaSigma;
  }
//ahora procedemos a hallar phi2, tambien por partes
  
//parte 1
//sen(U1)*cos(sigma)
var phi_1=  Math.sin(U1)*Math.cos(sigma);
//parte 2
//cos(U1)*sen(sigma)*cos(a12)
var phi_2 = Math.cos(U1)*Math.sin(sigma)*Math.cos(a12);
//parte 3
//sen(U1)*sen(sigma)
var phi_3 = Math.sin(U1)*Math.sin(sigma);
//parte 4
//cos(U1)*cos(sigma)*cos(a12)
var phi_4 = Math.cos(U1)*Math.cos(sigma)*Math.cos(a12);

//aca se pondra la ecuación completa
var phi2 = Math.atan2((phi_1+phi_2),((1-grs.f)*Math.sqrt(Math.pow(Math.sin(alpha),2)+Math.pow(phi_3-phi_4,2))));

//procedemos a calcular landa tambien por partes

//parte 1
//sen(sigma)*sen(a12)
var landa_1 = Math.sin(sigma)*Math.sin(a12);
//parte 2
//cos(U1)*cos(sigma)
var landa_2 = Math.cos(U1)*Math.cos(sigma);
//parte 3
//sen(U1)*sen(sigma)*cos(a12)
var landa_3 = Math.sin(U1)*Math.sin(sigma)*Math.cos(a12);

//aca estará la ecuación completa
var landa = Math.atan2(landa_1,(landa_2-landa_3));

//hallaremos C con el fin de facilitar tambien las formulas para hallar el diferencial de landa L
var C = (grs.f/16)*(Math.pow(Math.cos(alpha),2)*(4+(grs.f*(4-(3*Math.pow(Math.cos(alpha),2))))));

//hallando la diferencial landa L
//tambien se hara por partes para facilitar el proceso

//cos(2sigmaM)+C*cos(sigma)
var L1 = Math.cos(sigmaM)+(C*Math.cos(sigma));
//-1+2*cos^2(2sigmaM)
var L2 = -1+(2*Math.pow(Math.cos(sigmaM),2));

//aca esta la ecuacion completa del diferencial
var L = landa-((1-C)*grs.f*Math.sin(alpha)*(sigma+C*(Math.sin(sigma)*(L1*L2))));
var landa2 = landa1+L;

//calculo para hallar el azimut de 2 a 1
var a21 = Math.atan((Math.sin(alpha)/((-Math.sin(U1)*Math.sin(sigma))+(Math.cos(U1)*Math.cos(sigma)*Math.cos(a12)))));

//una vez culminado el procedimiento se procede a pasar de radianes a decimales 
phi2 = phi2*(180/Math.PI);
landa2 = landa2*(180/Math.PI);
a21 = a21*(180/Math.PI);
//condicional para el azimut

/*
result[2] = Math.atan2(sinAlpha, -tmp) * 57.29577951308232D;
    if (result[2] < 0.0D)
      result[2] = result[2] + 360.0D; 
    result[2] = result[2] + 180.0D;
    if (result[2] > 360.0D)
      result[2] = result[2] - 360.0D; 
    result[1] = longitude1 + l;
    result[1] = result[1] * 57.29577951308232D;
    return result;
  }
*/

if(a21 < 0){
  a21 = a21+360;
}else if(a21 >360){
  a21 = a21-360;
}else{
  a21 = a21 + 180;
}



console.log('latitud: ',phi2);
console.log('longitud: ',landa2);
console.log('azimut 21: ',a21);



}

problema_directo_Vicenty(4, -73, 15, 100);