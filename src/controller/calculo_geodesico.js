const GRS80 = require("../class/GRS80");
const grs = new GRS80();

//para este calculo se tomo las ecuaciones encontradas en libro de Richard Rapp
//denominado curso geodesia, geodesia geometrica, volumn 1, principios basicos
//junio 1988, universidad estatal de Ohio

//para el calculo directo e inverso se usara las formulas de Bowring 

function constantes_bowring(phi){
    //lo primero es hallar las constantes A,B y C
    var A = Math.pow((1+(grs.e2*Math.pow(Math.cos(phi),4))),1/2);
    var B = Math.pow((1+(grs.e2*Math.pow(Math.cos(phi),2))),1/2);
    var C = Math.pow((1+grs.e2),1/2);

    return{
        A: A,
        B: B,
        C: C
    }
}

function problema_directo_bowring(phi1, landa1, a12, s){
    //las incognitas que recibe esta funcion son
    //latitud, longitud, azimut de 1a 2, y la distancia

    var constantes = constantes_bowring(phi1)
    let A = constantes.A;
    let B = constantes.B;
    let C = constantes.C;

    //sigma = sB^2/(aC)
    var sigma = (s*Math.pow(B,2))/(grs.a*C);

//landa2 = landa1+(1/A)*tan^-1((A*tan(sigma)*sen(a12))/((B*cos(phi1)-tan(sigma)*sen(phi)*cos(a12))))
    var landa2 = landa1+((1/A)*(Math.atan((A*Math.tan(sigma)*Math.sin(a12))/((B*Math.cos(phi1))-(Math.tan(sigma)*Math.sin(phi1)*Math.cos(a12))))));
    
    //w
    var w = A*(landa2-landa1)/2;
    //D
    var D = (1/2)*Math.asin(Math.sin(sigma)*(Math.cos(a12)-((1/A)*Math.sin(phi1)*Math.sin(a12)*Math.tan(w))));
    //phi 2
    var phi2 = phi1 + 2*D*(B-((3/2)*grs.e2*D*Math.sin(2*phi1+((4/3)*B*D))));
    //Azimut de a21
    var a21 = Math.atan2((-B*Math.sin(a12)),(Math.cos(sigma)*((Math.tan(sigma)*Math.tan(phi1))-(B*Math.cos(a12)))));
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

    console.log('latitud: ', phi1);
    console.log('longitud: ', landa1);
    console.log('azimut 1-2: ', a12);
    console.log('__________________');
    console.log('latitud: ', phi2);
    console.log('longitud: ', landa2);
    console.log('azimut 2-1: ', a21);
    


}

problema_directo_bowring(4,-73,45,100);

//Problema geodesico directo de Vincenty
//este es el algoritmo mas utilizado debidoa  su precisión
//tomado del siguiente link: https://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf
function problema_directo_Vicenty(phi1, landa1, a12, s){
//a12 es el mismo alpha1

//latitud reducida
var U1 = Math.atan((1-grs.f)*Math.tan(phi1));
//azimut geodesico 
var alpha = Math.asin(Math.cos(U1)*Math.sin(a12));


//sigma → tan(sigma) = tan(U1)/cos(a12)
var sigma1 = Math.atan(Math.tan(U1)/Math.cos(a12));
//u^2 = cos^2(alpha)*(a^2-b^2)/b
var u2 = Math.pow(Math.cos(alpha),2)*(Math.pow(grs.a, 2)-Math.pow(grs.b, 2))/Math.pow(grs.b,2);

//constantes A
var A = 1+((u2/16384*(4096+u2*(-768+(u2*(320-175*u2))))));
//constante B
var B = (u2/1024)*(256+u2*(-128+(u2*(320-175*u2))));

var sigma = s/(grs.b*A);

//no se sabe de donde viene esta constante por el momento
var sigmaP = 6.283185307179586;
const limit = 1.0e-12;

while(Math.abs(sigma-sigmaP)>limit){
    //se declara este 2sigmaM como sigmaM
    var sigmaM = (2*sigma1)+sigma;

    //se va hallar deltaSigma por partes

    //cos(sigma)(-1+2*cos^2(2sigmaM))
    //var deltaSigma1 = 
    //1/6*B*cos(2*sigmaM)

    //-3+4*sen^2sigma

    //-3+4Cos^2(2*sigmaM)
}

}