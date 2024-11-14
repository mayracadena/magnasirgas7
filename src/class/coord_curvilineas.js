export default class coord_curvilineas{
    constructor(phi, lambda, h){
        this._phi = phi;
        this._lambda = lambda;
        this._h = h;
    }
    


    // Getter para phi
    get phi() {
        return this._phi;
    }

    // Setter para phi
    set phi(value) {
        this._phi = value;
    }

    // Getter para lambda
    get lambda() {
        return this._lambda;
    }

    // Setter para lambda
    set lambda(value) {
        this._lambda = value;
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
// module.exports = coord_curvilineas;