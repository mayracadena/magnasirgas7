const GRS80 = require("../class/GRS80");
const grs = new GRS80();

//Problema geodesico directo de Vincenty
//este es el algoritmo mas utilizado debidoa  su precisión
//tomado del siguiente link: https://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf

function problema_directo_Vicenty(phi1, lambda1, a12, s) {
  //se convierten los datos de entrada de decimales a radianes para poder trabajar este procedimiento
  phi1 = phi1 * (Math.PI / 180);
  lambda1 = lambda1 * (Math.PI / 180);
  a12 = a12 * (Math.PI / 180);

  //a12 es el mismo alfa1

  //latitud reducida
  var U1 = Math.atan((1 - grs.f) * Math.tan(phi1));
  //azimut geodesico
  var alfa = Math.asin(Math.cos(U1) * Math.sin(a12));

  //sigma → tan(sigma) = tan(U1)/cos(a12)
  var sigma1 = Math.atan(Math.tan(U1) / Math.cos(a12));
  //u^2 = cos^2(alfa)*(a^2-b^2)/b
  var u2 = (Math.pow(Math.cos(alfa), 2) * ((Math.pow(grs.a, 2) - Math.pow(grs.b, 2))) / Math.pow(grs.b, 2));

  //constantes A
  var A = 1 + ((u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2))));
  //constante B
  var B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (320 - 175 * u2)));

  var sigma = s / (grs.b * A);

  //no se sabe de donde viene esta constante por el momento
  var sigmaP = 2 * Math.PI;
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
    var deltaSigma = B * Math.sin(sigma) * (Math.cos(sigmaM) + (B / 4) * (deltaSigma1 - deltaSigma2 * deltaSigma3 * deltaSigma4));
    sigmaP = sigma;
    sigma = s / (grs.b * A) + deltaSigma;
  }
  //ahora procedemos a hallar phi2, tambien por partes

  //parte 1
  //sen(U1)*cos(sigma)
  var phi_1 = Math.sin(U1) * Math.cos(sigma);
  //parte 2
  //cos(U1)*sen(sigma)*cos(a12)
  var phi_2 = Math.cos(U1) * Math.sin(sigma) * Math.cos(a12);
  //parte 3
  //sen(U1)*sen(sigma)
  var phi_3 = Math.sin(U1) * Math.sin(sigma);
  //parte 4
  //cos(U1)*cos(sigma)*cos(a12)
  var phi_4 = Math.cos(U1) * Math.cos(sigma) * Math.cos(a12);

  //aca se pondra la ecuación completa
  var phi2 = Math.atan2((phi_1 + phi_2), ((1 - grs.f) * Math.sqrt(Math.pow(Math.sin(alfa), 2) + Math.pow(phi_3 - phi_4, 2))));

  //procedemos a calcular lambda tambien por partes

  //parte 1
  //sen(sigma)*sen(a12)
  var lambda_1 = Math.sin(sigma) * Math.sin(a12);
  //parte 2
  //cos(U1)*cos(sigma)
  var lambda_2 = Math.cos(U1) * Math.cos(sigma);
  //parte 3
  //sen(U1)*sen(sigma)*cos(a12)
  var lambda_3 = Math.sin(U1) * Math.sin(sigma) * Math.cos(a12);

  //aca estará la ecuación completa
  var lambda = Math.atan2(lambda_1, (lambda_2 - lambda_3));

  //hallaremos C con el fin de facilitar tambien las formulas para hallar el diferencial de lambda L
  var C = (grs.f / 16) * (Math.pow(Math.cos(alfa), 2) * (4 + (grs.f * (4 - (3 * Math.pow(Math.cos(alfa), 2))))));

  //hallando la diferencial lambda L
  //tambien se hara por partes para facilitar el proceso

  //cos(2sigmaM)+C*cos(sigma)
  var L1 = Math.cos(sigmaM) + (C * Math.cos(sigma));
  //-1+2*cos^2(2sigmaM)
  var L2 = -1 + (2 * Math.pow(Math.cos(sigmaM), 2));

  //aca esta la ecuacion completa del diferencial
  var L = lambda - ((1 - C) * grs.f * Math.sin(alfa) * (sigma + C * (Math.sin(sigma) * (L1 * L2))));
  var lambda2 = lambda1 + L;

  //calculo para hallar el azimut de 2 a 1
  var a21 = Math.atan((Math.sin(alfa) / ((-Math.sin(U1) * Math.sin(sigma)) + (Math.cos(U1) * Math.cos(sigma) * Math.cos(a12)))));

  //una vez culminado el procedimiento se procede a pasar de radianes a decimales 
  phi2 = phi2 * (180 / Math.PI);
  lambda2 = lambda2 * (180 / Math.PI);
  a21 = a21 * (180 / Math.PI);
  //condicional para el azimut

  if (a21 < 0) {
    a21 = a21 + 360;
  } else if (a21 > 360) {
    a21 = a21 - 360;
  } else {
    a21 = a21 + 180;
  }



  console.log('latitud: ', phi2);
  console.log('longitud: ', lambda2);
  console.log('azimut 21: ', a21);

  return {
    phi2: phi2,
    lambda2: lambda2,
    a21: a21
  };

}

problema_directo_Vicenty(4, -73, 15, 100);

function problema_inverso_Vicenty(phi1, phi2, lambda1, lambda2) {
  //se convierten los datos de entrada de decimales a radianes para poder trabajar este procedimiento
  phi1 = phi1 * (Math.PI / 180);
  phi2 = phi2 * (Math.PI / 180);
  lambda1 = lambda1 * (Math.PI / 180);
  lambda2 = lambda2 * (Math.PI / 180);

  //diferencial lambda
  var l = lambda2 - lambda1;
  //latitud reducida de phi1 y phi2
  var U1 = (1 - grs.f) * Math.tan(phi1);
  var U2 = (1 - grs.f) * Math.tan(phi2);
  //primera aproximación
  var lambda = l;
  //se debe iterar la ecuacion con la ecuacion de sen^2(sigma), hasta que el cambio en lambda sea insignificante
  var limit = 1.0e-12;
  var interLimit = 100;
  var seno_sigma, coseno_sigma, sigma, alfa, sigmaM, C, lambdaP = 0;

  //valores a hallar
  var a12, a21, s = 0;

  do {
    //sen^2(sigma)= (cos(U1)*sen(lambda))^2+(cos(U1)*sen(U2)-sen(U1)*cos(U2)*cos(lambda))^2

    seno_sigma = Math.sqrt(Math.pow(Math.cos(U2) * Math.sin(lambda), 2) + (Math.pow((Math.cos(U1) * Math.sin(U2)) - (Math.sin(U1) * Math.cos(U2) * Math.cos(lambda)), 2)));
    coseno_sigma = (Math.sin(U1) * Math.sin(U2)) + (Math.cos(U1) * Math.cos(U2) * Math.cos(lambda));
    //se realiza una condicional si en caso de ser este cero se retorne los resultados
    if (seno_sigma == 0) {
      return {
        a12: 0,
        a21: 0,
        s: 0
      }
    }
    sigma = Math.atan2(seno_sigma, coseno_sigma);
    alfa = Math.asin((Math.cos(U1) * Math.cos(U2) * Math.sin(lambda) / seno_sigma));
    //validando si 1-sen^2(alfa) es cero
    if ((1 - (Math.pow(Math.cos(U1) * Math.cos(U2) * Math.sin(lambda) / seno_sigma, 2))) == 0) {
      sigmaM = 0;
    } else {
      //sigmaM = 2sigmaM
      //cos(2sigmaM)=(cos(sigma)-2*sen(U1)*sen(U2)/cos^2(alfa))
      sigmaM = Math.acos((Math.cos(sigma) - (2 * Math.sin(U1) * Math.sin(U2))) / Math.pow(Math.cos(alfa), 2));
    }
    
    C = (grs.f / 16) * Math.pow(Math.cos(alfa), 2) * (4 + (grs.f * (4 - 3 * Math.pow(Math.cos(alfa), 2))));
    lambdaP = lambda;
    lambda = l - (1 - C) * grs.f * Math.sin(alfa) * (sigma + C * Math.sin(sigma) * (Math.cos(sigmaM) + C * Math.cos(sigma) * (-1 + 2 * Math.pow(Math.cos(sigmaM), 2))));

  } while (Math.abs(lambda - lambdaP) > limit && --interLimit > 0);
  //u^2 = cos^2(alfa)*(a^2-b^2)/b
  var u2 = (Math.pow(Math.cos(alfa), 2) * ((Math.pow(grs.a, 2) - Math.pow(grs.b, 2))) / Math.pow(grs.b, 2));



}

