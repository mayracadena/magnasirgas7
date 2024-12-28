//el siguiente código es para transformar coordenadas de datum Bogotá a Magna Sirgas
//la transformación de coordenadas se realizará con coordenadas geocentricas


const coord_geocentricas = require("../class/coord_geocentricas");
const {ArrayMatrix, doMatrixRotation, RotationMatrix} = require('../class/matrices')
const transformacion = require('../class/transformacion')
//nota: poner true o false en datum_bool significa:
//true = de datum bogota a magna sirgas
//false = de magna sirgas a datum bogota

async function transformacion3D(coord_geo, transf, datum_bool) {
    
    let X0 = transf.x0;
    let Y0 = transf.y0;
    let Z0 = transf.z0;

    let matrixCentral = new ArrayMatrix([[X0],[Y0],[Z0]]);

    let deltaX = coord_geo.X - X0;
    let deltaY = coord_geo.Y - Y0;
    let deltaZ = coord_geo.Z - Z0;

    let matrixDelta = new ArrayMatrix([[deltaX],[deltaY],[deltaZ]]);

    console.log('matriz delta ', matrixDelta)

    let translacion = new ArrayMatrix([[transf.dx], [transf.dy], [transf.dz]]);
    let rotacion = [transf.rx, transf.ry, transf.rz]
    let Escala = transf.e;

    let matrixArrival = null;

    if (datum_bool) {
        let arrayMatrix = doMatrixRotation(rotacion);
        let a = arrayMatrix.multiplicacion(matrixDelta);
        // console.log('array matrix a', a)
        let b = a.escalarmultiplicacion(1.0 + Escala);
        let c = b.adicion(translacion);
        matrixArrival = matrixCentral.adicion(c);
       
    } else {
        let a = matrixDelta.subtraction(translacion);
        let rotation = doMatrixRotation(rotacion).getInversa();
        let b = rotation.multiplicacion(a);
        let c = b.escalarmultiplicacion(1.0/(1.0+Escala));
        matrixArrival = c.adicion(matrixCentral);
    }

    let X = matrixArrival.getElementAt(0,0);
    let Y = matrixArrival.getElementAt(1,0);
    let Z = matrixArrival.getElementAt(2,0);

    return new coord_geocentricas(X, Y, Z);
}


module.exports = {transformacion3D};

// como funciona este apartado ejemplo
let region = new transformacion('R8',1738580.767, -6120500.388, 491473.3064,302.529, 317.979, -319.08,1.361566e-05, -2.17446e-06, -1.362418e-05, -2.19998e-06)

let coord = new coord_geocentricas( 1860274.5599, -6084683.9153, 441945.1052);
let coord2 = new coord_geocentricas( 1968272.7346, -6057720.5920, 331574.8387 );
let resultado = transformacion3D(coord2, region, true);
console.log(resultado);

//nota: poner true o false en datum_bool significa:
//true = de datum bogota a magna sirgas
//false = de magna sirgas a datum bogota
