export default class coord_planas_cartesianas {
    constructor(id, fk_sistema, detalle, anio, fk_corregimiento, fk_municipio, latitud, longitud, fnorte, feste, plano_proyeccion, descripcion, oficial) {
        this._id = id;
        this._fk_sistema = fk_sistema;
        this._detalle = detalle;
        this._anio = anio;
        this._fk_corregimiento = fk_corregimiento;
        this._fk_municipio = fk_municipio;
        this._latitud = latitud;
        this._longitud = longitud;
        this._fnorte = fnorte;
        this._feste = feste;
        this._plano_proyeccion = plano_proyeccion;
        this._descripcion = descripcion;
        this._oficial = oficial;
    }

    // Getter y Setter para id
    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    // Getter y Setter para fk_sistema
    get fk_sistema() {
        return this._fk_sistema;
    }

    set fk_sistema(value) {
        this._fk_sistema = value;
    }

    // Getter y Setter para detalle
    get detalle() {
        return this._detalle;
    }

    set detalle(value) {
        this._detalle = value;
    }

    // Getter y Setter para anio
    get anio() {
        return this._anio;
    }

    set anio(value) {
        this._anio = value;
    }

    // Getter y Setter para fk_corregimiento
    get fk_corregimiento() {
        return this._fk_corregimiento;
    }

    set fk_corregimiento(value) {
        this._fk_corregimiento = value;
    }

    // Getter y Setter para fk_municipio
    get fk_municipio() {
        return this._fk_municipio;
    }

    set fk_municipio(value) {
        this._fk_municipio = value;
    }

    // Getter y Setter para latitud
    get latitud() {
        return this._latitud;
    }

    set latitud(value) {
        this._latitud = value;
    }

    // Getter y Setter para longitud
    get longitud() {
        return this._longitud;
    }

    set longitud(value) {
        this._longitud = value;
    }

    // Getter y Setter para fnorte
    get fnorte() {
        return this._fnorte;
    }

    set fnorte(value) {
        this._fnorte = value;
    }

    // Getter y Setter para feste
    get feste() {
        return this._feste;
    }

    set feste(value) {
        this._feste = value;
    }

    // Getter y Setter para plano_proyeccion
    get plano_proyeccion() {
        return this._plano_proyeccion;
    }

    set plano_proyeccion(value) {
        this._plano_proyeccion = value;
    }

    // Getter y Setter para descripcion
    get descripcion() {
        return this._descripcion;
    }

    set descripcion(value) {
        this._descripcion = value;
    }

    // Getter y Setter para oficial
    get oficial() {
        return this._oficial;
    }

    set oficial(value) {
        this._oficial = value;
    }
}

// module.exports = coord_planas_cartesianas;