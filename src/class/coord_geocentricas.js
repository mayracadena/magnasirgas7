export default class coord_geocentricas{
    constructor(X, Y, Z){
        this._X = X;
        this._Y = Y;
        this._Z = Z;
    }

    // Getter y Setter para X
    get X() {
        return this._X;
    }

    set X(value) {
        this._X = value;
    }

    // Getter y Setter para Y
    get Y() {
        return this._Y;
    }

    set Y(value) {
        this._Y = value;
    }

    // Getter y Setter para Z
    get Z() {
        return this._Z;
    }

    set Z(value) {
        this._Z = value;
    }
}

// module.exports = coord_geocentricas;