const GRS80 = require('../class/GRS80');
const CTM12 = require('../class/CTM12');
//vamos a definir las variables a utilizar:
const grs = new GRS80();
const ctm = new CTM12();

function m0() {
    //primeros parametros de la ecuacion M0
    var m0 = 0;
    var m1=0;
    var m2=0;
    var m3=0;
    var m4=0;

    //primera excentricidad
    let e = grs.e2;
    //coordenadas punto de origen CMT12
    let phi = (ctm.phi0)*(Math.PI/180);
    //radio a
    let a = grs.a;

    //para determinar Mo (distancia al meridiano a la latitud cero)
    // primero se separa las ecuaciones en m1, m2, m3 y m4 para facilitar su consulta y transformación a futuro
    m1= (1-(e/4)-((3*(e**2))/64)-((5*(e**3))/256))*phi;
    m2 =(((3*e)/8)+((3*(e**2))/32)+((45*(e**3))/1024))*Math.sin(2*phi);
    m3 =(((15*(e**2))/256)+((45*(e**3))/1024))*Math.sin(4*phi);
    m4 = ((35*(e**3))/3072)*Math.sin(6*phi);
    m0= a*(m1-m2+m3-m4);

    
    return m0;
}

//datos adicionales

//m = mo+((Y-N0)/k0)
function m (x, y){
    let m = 0;
    
    let n0 = ctm.N0;
    let k0 = ctm.k;
    m = m0()+((y-n0)/k0);

    return m;
}
//funcion de la rectificación de la latitud
function u (m){
    let u = 0;
    let e = grs.e2;
    let a = grs.a;
    //=E39/(E12*(1-(E16/4)-((3*(E16^2))/64)-((5*(E16^3))/256)))
    u = m/(a*(1-(e/4)-((3*(e**2))/64)-((5*(e**3))/256)))
    console.log(u);
}


u(m(5293373.2162, 1802673.2289));









