class planas_cartesianas {
    constructor(municipio, departamento, latitud, longitud, year, fNorte, fEste, planoProyeccion, descripcion, oficial) {
        this._municipio = municipio;
        this._departamento = departamento;
        this._latitud = latitud;
        this._longitud = longitud;
        this._year = year;
        this._fNorte = fNorte;
        this._fEste = fEste;
        this._planoProyeccion = planoProyeccion;
        this._descripcion = descripcion;
        this._oficial = oficial;
    }

    // Getters
    get municipio() {
        return this._municipio;
    }

    get departamento() {
        return this._departamento;
    }

    get latitud() {
        return this._latitud;
    }

    get longitud() {
        return this._longitud;
    }

    get year() {
        return this._year;
    }

    get fNorte() {
        return this._fNorte;
    }

    get fEste() {
        return this._fEste;
    }

    get planoProyeccion() {
        return this._planoProyeccion;
    }

    get descripcion() {
        return this._descripcion;
    }

    get oficial() {
        return this._oficial;
    }

    // Setters
    set municipio(value) {
        this._municipio = value;
    }

    set departamento(value) {
        this._departamento = value;
    }

    set latitud(value) {
        this._latitud = value;
    }

    set longitud(value) {
        this._longitud = value;
    }

    set year(value) {
        this._year = value;
    }

    set fNorte(value) {
        this._fNorte = value;
    }

    set fEste(value) {
        this._fEste = value;
    }

    set planoProyeccion(value) {
        this._planoProyeccion = value;
    }

    set descripcion(value) {
        this._descripcion = value;
    }

    set oficial(value) {
        this._oficial = value;
    }
}

//esto se realiza para usar esta clase en otros metodos
module.exports = planas_cartesianas;