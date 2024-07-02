class GRS80 {
    constructor(){
        //semieje mayor
       
        this._a = 6378137;
        //semieje menor
       // this._b = 6356752.31414;
        this._f=1/298.257222101;
       
        
    }

    get a(){
        return this._a;
    }

    get b(){
        const b = this._a*(1-this._f);
        return b;
    }

    get f(){
        //el aplanamiento f=(a-b)/a
       // const f = (this._a-this._b)/this._a;
        return this._f;
    }
    get e2(){
        //primera excentricidad e^2 = 2f-(f^2)
        const e2 = (2*this._f)-(this._f**2);
        return e2;
    }
    get es2(){
        //segunda excentricidad e^´2 = e^2/(1-e^2)
        const es2 = (this.e2)/(1-this.e2);
        return es2;
    }
    get c(){
        const c = (Math.pow(this._a,2) / this.b);
        return c;
    }
    

}

//esto se realiza para usar esta clase en otros metodos
module.exports = GRS80;