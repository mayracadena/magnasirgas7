export default class coord_utm {
  constructor(norte, este, huso) {
    this._norte = norte;
    this._este = este;
    this._huso = huso;
    this._k = 0.9996;
    this._falso_norte = 0;
    this._falso_este = 500000;
    
  }

  get k() {
    return this._k;
  }
  get zona() {
    //insertar aca formula para hallar la zona
  }
  get falso_norte() {
    return this._falso_norte;
  }

  get falso_este() {
    return this._falso_este;
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
}

// module.exports = coord_utm;
