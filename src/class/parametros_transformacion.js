class parametros_transformacion {
    constructor(id, nombre, dx, dy, dz, k, rx, ry, rz, xo, yo, zo) {
        this._id = id;
        this._nombre = nombre;
        this._dx = dx;
        this._dy = dy;
        this._dz = dz;
        this._k = k;
        this._rx = rx;
        this._ry = ry;
        this._rz = rz;
        this._xo = xo;
        this._yo = yo;
        this._zo = zo;
    }

    // Getters
    get id() {
        return this._id;
    }

    get nombre() {
        return this._nombre;
    }

    get dx() {
        return this._dx;
    }

    get dy() {
        return this._dy;
    }

    get dz() {
        return this._dz;
    }

    get k() {
        return this._k;
    }

    get rx() {
        return this._rx;
    }

    get ry() {
        return this._ry;
    }

    get rz() {
        return this._rz;
    }

    get xo() {
        return this._xo;
    }

    get yo() {
        return this._yo;
    }

    get zo() {
        return this._zo;
    }

    // Setters
    set id(value) {
        this._id = value;
    }

    set nombre(value) {
        this._nombre = value;
    }

    set dx(value) {
        this._dx = value;
    }

    set dy(value) {
        this._dy = value;
    }

    set dz(value) {
        this._dz = value;
    }

    set k(value) {
        this._k = value;
    }

    set rx(value) {
        this._rx = value;
    }

    set ry(value) {
        this._ry = value;
    }

    set rz(value) {
        this._rz = value;
    }

    set xo(value) {
        this._xo = value;
    }

    set yo(value) {
        this._yo = value;
    }

    set zo(value) {
        this._zo = value;
    }
}

module.exports = parametros_transformacion;