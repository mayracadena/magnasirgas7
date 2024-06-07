//PARAMETROS ORIGEN CTM12
//resolución 471 del 2020   IGAC

class CTM12 {
    constructor(){
        //latitud de origen
        this._phi0 = 4;
        //longitud de origen
        this._landa0 = -73;
        //norte cero
        this._N0 = 2000000;
        //este cero
        this._E0 = 5000000;
        //factor de escala
        this._k = 0.9992;

    }

    get phi0(){
        return this._phi0;
    }
    get landa0(){
        return this._landa0;
    }
    get N0(){
        return this._N0;
    }
    get E0(){
        return this._E0;
    }
    get k(){
        return this._k;
    }
}

module.exports = CTM12;