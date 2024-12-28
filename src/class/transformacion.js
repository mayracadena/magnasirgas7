

class transformacion {
    constructor(region, x0, y0, z0, dx, dy, dz, rx, ry, rz, e) {
        this._region = region;
        this._x0 = x0;
        this._y0 = y0;
        this._z0 = z0;
        this._dx = dx;
        this._dy = dy;
        this._dz = dz;
        this._rx = rx;
        this._ry = ry;
        this._rz = rz;
        this._e = e
    }

    get region() {
        return this._region;
    }
    get x0() {
        return this._x0;
    }
    get y0() {
        return this._y0;
    }
    get z0() {
        return this._z0;
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

    get rx() {
        return this._rx;
    }

    get ry() {
        return this._ry;
    }

    get rz() {
        return this._rz;
    }
    get e() {
        return this._e;
    }
  
    get Rotacion() {
        return [this.rx, this.ry, this.rz];
    }
}

module.exports = transformacion;