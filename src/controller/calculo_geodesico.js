const GRS80 = require("../class/GRS80");
const grs = new GRS80();

//para este calculo se tomo las ecuaciones encontradas en libro de Richard Rapp
//denominado curso geodesia, geodesia geometrica, volumn 1, principios basicos
//junio 1988, universidad estatal de Ohio

//para el calculo directo e inverso se usara las formulas de Bowring 

function constantes_bowring(phi){
    //lo primero es hallar las constantes A,B y C
    var A = Math.pow((1+(grs.es2*Math.pow(Math.cos(phi),4))),1/2);
    var B = Math.pow(1-(grs.es2*Math.pow(Math.cos(phi))), 1/2);
    var C = Math.pow((1+grs.es2),1/2);

    return{
        A: A,
        B: B,
        C: C
    }
}

function problema_directo(phi1, landa1, a12, s){
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
    
    

}



