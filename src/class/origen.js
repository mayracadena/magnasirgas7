class origen {
    constructor(nombre, latitud, longitud, falso_norte, falso_este, k) {
        this._nombre = nombre;
        this._latitud = latitud;
        this._longitud = longitud;
        this._falso_norte = falso_norte;
        this._falso_este = falso_este;
        this._k = k;
    }

    // Getters
    get nombre() {
        return this._nombre;
    }

    get latitud() {
        return this._latitud;
    }

    get longitud() {
        return this._longitud;
    }

    get falso_norte() {
        return this._falso_norte;
    }

    get falso_este() {
        return this._falso_este;
    }

    get k() {
        return this._k;
    }

    // Setters
    set nombre(value) {
        this._nombre = value;
    }

    set latitud(value) {
        this._latitud = value;
    }

    set longitud(value) {
        this._longitud = value;
    }

    set falso_norte(value) {
        this._falso_norte = value;
    }

    set falso_este(value) {
        this._falso_este = value;
    }

    set k(value) {
        this._k = value;
    }
}

module.exports = origen;