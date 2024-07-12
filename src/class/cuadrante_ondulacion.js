

class cuadrante_ondulacion {
  constructor(minLatitud, maxLatitud, minLongitud, maxLongitud, incrementoLat, incrementoLon) {
    this._minLatitud = minLatitud;
    this._maxLatitud = maxLatitud;
    this._minLongitud = minLongitud;
    this._maxLongitud = maxLongitud;
    this._incrementoLat = incrementoLat;
    this._incrementoLon = incrementoLon;
    }

    get minLatitud() {
        return this._minLatitud;
    }
    get maxLatitud() {
        return this._maxLatitud;
    }
    get minLongitud() {
        return this._minLongitud;
    }
    get maxLongitud() {
        return this._maxLongitud;
    }
    get incrementoLat() {
        return this._incrementoLat;
    }
    get incrementoLon() {
        return this._incrementoLon;
    }

    get norteEste() {
        return this._norteEste;
    }
    get norteOeste() {
        return this._norteOeste;
    }
    get surEste() {
        return this._surEste;
    }
    get surOeste() {
        return this._surOeste;
    }

    set minLatitud(valor) {
        this._minLatitud = valor;
    }
    set maxLatitud(valor) {
        this._maxLatitud = valor;
    }
    set minLongitud(valor) {
        this._minLongitud = valor;
    }
    set maxLongitud(valor) {
        this._maxLongitud = valor;
    }
    set incrementoLat(valor) {
        this._incrementoLat = valor;
    }
    set incrementoLon(valor) {
        this._incrementoLon = valor;
    }

    set norteEste(valor){
        this._norteEste = valor;
    }

    set norteOeste(valor){
        this._norteOeste = valor;
    }

    set surEste(valor){
        this._surEste = valor;
    }

    set surOeste(valor){
        this._surOeste = valor;
    }
}

module.exports = cuadrante_ondulacion;
