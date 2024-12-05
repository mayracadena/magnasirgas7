class coord_utm {
  constructor(norte, este, h, huso) {
    this._norte = norte;
    this._este = este;
    this._h = h
    this._huso = huso;
    // this._k = 0.9996;

  }

  get k() {
    return this._k;
  }
  get zona() {
    //insertar aca formula para hallar la zona
  }

  // Getter para norte
  get norte() {
    return this._norte;
  }

  // Setter para norte
  set norte(value) {
    this._norte = value;
  }

  // Getter para este
  get este() {
    return this._este;
  }

  // Setter para este
  set este(value) {
    this._este = value;
  }

  get huso() {
    return this._huso;
  }

  // Setter para este
  set huso(value) {
    this._huso = value;
  }

  // Getter para h
  get h() {
    return this._h;
  }

  // Setter para h
  set h(value) {
    this._h = value;
  }
}

module.exports = coord_utm;
