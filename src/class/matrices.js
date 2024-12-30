class ArrayMatrix {
    constructor(array) {
        this.array = array; 
    }

    
    multiplicacion(other) {
        
        const a = this.array;
        const b = other.array;
        
        let res = [
            [a[0][0]*b[0][0] + a[0][1]*b[1][0] + a[0][2]*b[2][0]],
            [a[1][0]*b[0][0] + a[1][1]*b[1][0] + a[1][2]*b[2][0]],
            [a[2][0]*b[0][0] + a[2][1]*b[1][0] + a[2][2]*b[2][0]]
        ];
        return new ArrayMatrix(res);
    }

    escalarmultiplicacion(s) {
        let res = this.array.map(row => [row[0]*s]);
        return new ArrayMatrix(res);
    }

    adicion(other) {
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

    
    getInversa() {
       

        throw new Error("getInverse() debe aplicarse a una matriz de rotación 3x3, no a un vector 3x1");
    }
}

class RotationMatrix extends ArrayMatrix {
    getInversa() {
        //transpuesta
        let m = this.array;
        let transpose = [
            [m[0][0], m[1][0], m[2][0]],
            [m[0][1], m[1][1], m[2][1]],         
            [m[0][2], m[1][2], m[2][2]]
        ];
        return new RotationMatrix(transpose);
    }
}

function doMatrixRotation(pRotation) {
    let X = pRotation[0]; 
    let Y = pRotation[1];
    let Z = pRotation[2];
    
    let mat = [
        [1.0,  Z,   -Y ],
        [-Z,   1.0,  X ],
        [ Y,  -X,   1.0]
    ];

    return new RotationMatrix(mat);
}

module.exports = {ArrayMatrix, doMatrixRotation, RotationMatrix}