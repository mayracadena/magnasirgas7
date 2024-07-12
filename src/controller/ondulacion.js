const { Console } = require("console");
const cuadrante_ondulacion = require("../class/cuadrante_ondulacion");
const fs = require("fs");
const path = require("path");

const geocol2004 = "../data/Geocol2004.txt";
const archivo = path.join(__dirname, geocol2004);

function cabecero() {
  return new Promise((resolve, reject) => {
    fs.readFile(archivo, "utf8", (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const contenido = data.split("\n")[0];
      const primera_linea = contenido.split(" ");

      var minLatitud = primera_linea[0];
      var maxLatitud = primera_linea[1];
      var minLongitud = primera_linea[2];
      var maxLongitud = primera_linea[3];
      var incrementoLat = primera_linea[4];
      var incrementoLon = primera_linea[5];

      var datos = new cuadrante_ondulacion(
        minLatitud,
        maxLatitud,
        minLongitud,
        maxLongitud,
        incrementoLat,
        incrementoLon
      );
      resolve(datos);
    });
  });
}

function cuadrante(latitud, longitud) {
  cabecero()
    .then((datos) => {
        console.log('datos min lat: ',datos.minLatitud)
        console.log('datos max lon: ',datos.maxLongitud)
        console.log('datos min lon: ',datos.minLongitud)
        console.log('datos inc lon: ',datos.incrementoLon)
     
      //se valida que no se encuentre las coordenadas fuera del rango de la grilla
      if (latitud < (datos.minLatitud + datos.incrementoLat) || latitud > (datos.maxLatitud - datos.incrementoLat)) {
        console.log("latitud fuera del rango");
        return null;
      }
      if (longitud < (datos.minLongitud + datos.incrementoLon) || longitud > (datos.maxLongitud - datos.incrementoLon)) {
        console.log("longitud fuera del rango");
        return null;
      }
        
      console.log('datos min lat2: ',datos.minLatitud)
      console.log('datos max lon2: ',datos.maxLongitud)
      //se toma la parte entera para encontrar la posicion dentro del documento
      var i = parseInt((datos.maxLatitud - latitud) / datos.incrementoLat);
      var j = parseInt((longitud - datos.minLongitud) / datos.incrementoLon);
      console.log('datos incremento longitud',datos.incrementoLon)

      var lat = datos.maxLatitud - i * datos.incrementoLat;
      var lon = datos.minLongitud + j * datos.incrementoLon;
      console.log('la latitud: ', lat, " esta en la posicion: ", i, " la longitud: ", lon, " esta en la posicion: ", j);

      // se debe buscar la posicion de los cuadrilateros
      return new Promise((resolve, reject) => {
        fs.readFile(archivo, "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          const contenido = data.split("\n")[i+1];
          const primera_linea = contenido.split(" ");
          const contenido2 = data.split("\n")[i + 2];
          const segunda_linea = contenido2.split(" ");
          datos.norteOeste = primera_linea[j];
          datos.norteEste = primera_linea[j + 1];
          datos.surOeste = segunda_linea[j];
          datos.surEste = segunda_linea[j + 1];

          //console.log(datos.norteOeste, datos.norteEste);
          //console.log(datos.surOeste, datos.surEste);
          //console.log(datos);
          interpolacion_bilineal(datos, lat, lon)

          return datos;

        });
      });
    })
    .catch((err) => {
      console.error("Error en la lectura del archivo:", err);
    });
}

function interpolacion_bilineal(datos, latitud, longitud){
    //v = (y-y1)/(y2-y1)
   
    var v = (datos.maxLatitud-latitud)/datos.incrementoLat;
    console.log('latitud maxima: ',datos.maxLatitud);
    console.log('latitud: ',latitud);
    console.log('latitud incremento: ',datos.maxLatitud);
    //u = (x-x1)/(x2-x1)
    var u = (longitud-datos.minLongitud)/datos.incrementoLon;
    //formula interpolacion lineal (Q11, Q12, Q21, Q22) son las esquinas de los cuadrilateros
    //Q = (1-u)(1-v)Q11 + u(1-v)(Q21) + uvQ22 + (1-u)vQ12
    var q = ((1-u)*(1-v)*datos.norteOeste) + (v*(1-u)*datos.surOeste) + (u*v*datos.surEste) + ((1-v)*u*datos.norteEste);
    console.log('El valor de la ondulacion es: ',q)
    console.log('Q11', datos.norteOeste)
    console.log('Q12', datos.norteEste)
    console.log('Q21', datos.surOeste)
    console.log('Q22', datos.surEste)
    console.log('t', v)
    console.log('v', u)

}

cuadrante(4, -79.9);
