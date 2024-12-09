//el siguiente código es para transformar coordenadas de datum Bogotá a Magna Sirgas
//la transformación de coordenadas se realizará con coordenadas geocentricas

const conexion = require('../db/conexion');
const coord_geocentricas = require("../class/coord_geocentricas");
const coord_curvilineas = require("../class/coord_curvilineas");
const parametros_transformacion = require('../class/parametros_transformacion')


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


class Cartesian3DCoordinate {
    constructor(id, X, Y, Z) {
        this.id = id;
        this.X = X;
        this.Y = Y;
        this.Z = Z;
    }
}

class ArrayMatrix {
    constructor(array) {
        this.array = array; // array es un arreglo bidimensional: [[x],[y],[z]]
    }

    // Ejemplos de métodos mínimos. Ajusta según tu implementación real:
    multiplication(other) {
        // Multiplicación de matrices 3x3 por 3x1
        const a = this.array;
        const b = other.array;
        // Asumimos que this es 3x3 y other es 3x1
        let res = [
            [a[0][0]*b[0][0] + a[0][1]*b[1][0] + a[0][2]*b[2][0]],
            [a[1][0]*b[0][0] + a[1][1]*b[1][0] + a[1][2]*b[2][0]],
            [a[2][0]*b[0][0] + a[2][1]*b[1][0] + a[2][2]*b[2][0]]
        ];
        return new ArrayMatrix(res);
    }

    scalarMultiplication(s) {
        let res = this.array.map(row => [row[0]*s]);
        return new ArrayMatrix(res);
    }

    adition(other) {
        let res = [
            [this.array[0][0] + other.array[0][0]],
            [this.array[1][0] + other.array[1][0]],
            [this.array[2][0] + other.array[2][0]]
        ];
        return new ArrayMatrix(res);
    }

    subtraction(other) {
        let res = [
            [this.array[0][0] - other.array[0][0]],
            [this.array[1][0] - other.array[1][0]],
            [this.array[2][0] - other.array[2][0]]
        ];
        return new ArrayMatrix(res);
    }

    getElementAt(i, j) {
        return this.array[i][j];
    }

    // Método inverso suponiendo que doMatrixRotation genera matriz ortogonal
    getInverse() {
       

        throw new Error("getInverse() debe aplicarse a una matriz de rotación 3x3, no a un vector 3x1");
    }
}

// Suponiendo una clase para rotación (3x3):
class RotationMatrix extends ArrayMatrix {
    getInverse() {
        // La inversa de una matriz de rotación ortonormal es su traspuesta
        let m = this.array;
        let transpose = [
            [m[0][0], m[1][0], m[2][0]],
            [m[0][1], m[1][1], m[2][1]],
            [m[0][2], m[1][2], m[2][2]]
        ];
        return new RotationMatrix(transpose);
    }
}

// Función doMatrixRotation análoga:
function doMatrixRotation(pRotation, sense) {
    let X = pRotation[0]; 
    let Y = pRotation[1];
    let Z = pRotation[2];
    // Usamos la misma lógica del código Java
    let mat = [
        [1.0,  Z,   -Y ],
        [-Z,   1.0,  X ],
        [ Y,  -X,   1.0]
    ];

    return new RotationMatrix(mat);
}

// Clases simuladas
class ParametersMB {
    constructor(translation, escaleFactor, rotation) {
        this.translation = translation;
        this.escalefactor = escaleFactor;
        this.rotation = rotation;
    }
    getTranslation() {
        return new ArrayMatrix([[this.translation.dx],[this.translation.dy],[this.translation.dz]]);
    }
    getEscaleFactor() {
        return this.escalefactor;
    }
    getRotation() {
        return [this.rotation.X, this.rotation.Y, this.rotation.Z];
    }
}

class Region {
    constructor(centralCoordinate, parametersMB) {
        this.centralCoordinate = centralCoordinate;
        this.parametersMB = parametersMB;
    }
    getCentralCoordinate() {
        return this.centralCoordinate;
    }
    getParametersMB() {
        return this.parametersMB;
    }
}

// Ahora la función en JavaScript que imita `transformation3D`:
function transformation3D(coordinate, region, sense) {
    let central = region.getCentralCoordinate();
    let parameters = region.getParametersMB();

    let X0 = central.X;
    let Y0 = central.Y;
    let Z0 = central.Z;

    let matrixCentral = new ArrayMatrix([[X0],[Y0],[Z0]]);

    let deltaX = coordinate.X - X0;
    let deltaY = coordinate.Y - Y0;
    let deltaZ = coordinate.Z - Z0;

    let matrixDelta = new ArrayMatrix([[deltaX],[deltaY],[deltaZ]]);

    let translation = parameters.getTranslation();
    let Escala = parameters.getEscaleFactor();

    let matrixArrival = null;

    if (sense) {
        let arrayMatrix = doMatrixRotation(parameters.getRotation(), sense);
        let a = arrayMatrix.multiplication(matrixDelta);
        let b = a.scalarMultiplication(1.0 + Escala);
        let c = b.adition(translation);
        matrixArrival = matrixCentral.adition(c);
    } else {
        let a = matrixDelta.subtraction(translation);
        let rotation = doMatrixRotation(parameters.getRotation(), sense).getInverse();
        let b = rotation.multiplication(a);
        let c = b.scalarMultiplication(1.0/(1.0+Escala));
        matrixArrival = c.adition(matrixCentral);
    }

    let X = matrixArrival.getElementAt(0,0);
    let Y = matrixArrival.getElementAt(1,0);
    let Z = matrixArrival.getElementAt(2,0);

    return new Cartesian3DCoordinate(null, X, Y, Z);
}

// Ejemplo de uso (tendrás que ajustar los valores reales):
let centralCoord = new Cartesian3DCoordinate(null, 1738580.767, -6120500.388, 491473.3064);
let translationParams = {dx:302.529, dy:317.979, dz:-319.08}; // ejemplo
let rotationParams = {X:1.361566e-05, Y:-2.17446e-06, Z:-1.362418e-05};     // ejemplo
let parametersMB = new ParametersMB(translationParams, -2.19998e-06, rotationParams);
let region = new Region(centralCoord, parametersMB);

let coord = new Cartesian3DCoordinate(null, 1860274.5599, -6084683.9153, 441945.1052);
let resultado = transformation3D(coord, region, true);
console.log(resultado);

//nota: poner true o false en sense significa:
//true = de datum bogota a magna sirgas
//false = de magna sirgas a datum bogota
