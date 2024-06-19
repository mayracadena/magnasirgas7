class UTM {
  constructor() {
    this.k = 0.996;
    this.falso_norte = 0;
    this.falso_este = 500000;
    this.zona = 18;
  }

  get k() {
    return this.k;
  }
  get zona() {
    //insertar aca formula para hallar la zona
  }
  get falso_norte() {
    return this.falso_norte;
  }

  get falso_este() {
    return this.falso_este;
  }
}

module.exports = UTM;
