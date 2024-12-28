//el siguiente código es para transformar coordenadas de datum Bogotá a Magna Sirgas
//la transformación de coordenadas se realizará con coordenadas geocentricas

const conexion = require('../db/conexion');
const coord_geocentricas = require("../class/coord_geocentricas");
const coord_curvilineas = require("../class/coord_curvilineas");
const transformacion = require('../class/transformacion');
const {ArrayMatrix, doMatrixRotation, RotationMatrix} = require('../class/matrices')


async function elipoide(id) {
    var con = new conexion();
    try {
        await con.open();

        var query_elipsoide = "select e.semieje_mayor, e.achatamiento from elipsoide e inner join sistema_referencia sr where sr.id = ?";
        var result_elip = await con.getOne(query_elipsoide, [id]);
        const elipsoide_consultado = new elipsoide_referencia(result_elip.semieje_mayor, result_elip.achatamiento);

        return elipsoide_consultado;
    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await con.close();
    }
}





function transformacion3D(coord_geo, transf, sense) {
    
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

    if (sense) {
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



let region = new transformacion('R8',1738580.767, -6120500.388, 491473.3064,302.529, 317.979, -319.08,1.361566e-05, -2.17446e-06, -1.362418e-05, -2.19998e-06)

let coord = new coord_geocentricas( 1860274.5599, -6084683.9153, 441945.1052);
let resultado = transformacion3D(coord, region, true);
console.log(resultado);

//nota: poner true o false en sense significa:
//true = de datum bogota a magna sirgas
//false = de magna sirgas a datum bogota
