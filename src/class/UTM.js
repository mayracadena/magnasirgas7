class UTM {
  constructor() {
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
}

module.exports = UTM;
