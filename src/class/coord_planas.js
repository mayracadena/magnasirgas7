class coord_planas{
    constructor(norte, este, h){
        this._norte = norte;
        this._este = este;
        this._h = h;
       
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
    // Getter para h
    get h() {
        return this._h;
    }

    // Setter para h
    set h(value) {
        this._h = value;
    }
    

}
//esto se realiza para usar esta clase en otros metodos
module.exports = coord_planas;