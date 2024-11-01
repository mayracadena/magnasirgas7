class coord_planas{
    constructor(norte, este){
        this._norte = norte;
        this._este = este;
       
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

    

}
//esto se realiza para usar esta clase en otros metodos
module.exports = coord_planas;