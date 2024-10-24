const { Console } = require("console");
const cuadrante_ondulacion = require("../class/cuadrante_ondulacion");
const fs = require("fs");
const path = require("path");

const geocol2004 = "../data/Geocol2004.txt";
const archivo = path.join(__dirname, geocol2004);


//para sacar los valores de ondulación utilizamos la grilla de 2' x 2'  de geocol2004
// para interpolar los puntos dentro de las grillas utilizamos el metodo de interpolación bilineal
//este es el método que tiene la versión magna pro 5.1 


//el siguiente desarrollo es basado en la anterior version del magna pro 5.1 en lenguaje Java
//este modulo fue programado por:
//Mayra Yesenia Cadena Blanco - Ingeniera Catastral y Geodesta - Tecnologa en Análisis y Desarrollo de Sistemas de Información

function cabecero() {
  return new Promise((resolve, reject) => {
    fs.readFile(archivo, "utf8", (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const contenido = data.split("\n")[0];
      const primera_linea = contenido.split(" ");

      var minLatitud = parseFloat(primera_linea[0]);
      var maxLatitud = parseFloat(primera_linea[1]);
      var minLongitud = parseFloat(primera_linea[2]);
      var maxLongitud = parseFloat(primera_linea[3]);
      var incrementoLat = parseFloat(primera_linea[4]);
      var incrementoLon = parseFloat(primera_linea[5]);

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

function ondulacion_geoidal(latitud, longitud) {
  cabecero()
    .then((datos) => {
       
      
      //se valida que no se encuentre las coordenadas fuera del rango de la grilla
      if (latitud < (datos.minLatitud + datos.incrementoLat) || latitud > (datos.maxLatitud - datos.incrementoLat)) {
        console.log("latitud fuera del rango");
        return null;
      }
      if (longitud < (datos.minLongitud + datos.incrementoLon) || longitud > (datos.maxLongitud - datos.incrementoLon)) {
        console.log("longitud fuera del rango");
        return null;
      }
        
     
      //se toma la parte entera para encontrar la posicion dentro del documento
      var i = parseInt((datos.maxLatitud - latitud) / datos.incrementoLat);
      var j = parseInt((longitud - datos.minLongitud) / datos.incrementoLon);
      

      var lat = parseFloat(datos.maxLatitud - i * datos.incrementoLat);
      var lon = parseFloat(datos.minLongitud + j * datos.incrementoLon);
      
      
      // se debe buscar la posicion de los cuadrilateros
      return new Promise((resolve, reject) => {
        fs.readFile(archivo, "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          //aca buscamos la posición en el archivo se pone i+1 para evitar tomar la primera columna que son las constantes
          const contenido = data.split("\n")[i+1];
          const primera_linea = contenido.split(" ");
          const contenido2 = data.split("\n")[i + 2];
          const segunda_linea = contenido2.split(" ");

          //se asignan al objeto de datos (que es el objeto de ondulación)
          datos.norteOeste = parseFloat(primera_linea[j]);
          datos.norteEste = parseFloat(primera_linea[j + 1]);
          datos.surOeste = parseFloat(segunda_linea[j]);
          datos.surEste = parseFloat(segunda_linea[j + 1]);

          //console.log(datos.norteOeste, datos.norteEste);
          //console.log(datos.surOeste, datos.surEste);

         //se debe mandar la latitud maxima pero dentro de la grilla, la longitud maxima y el valor del punto a calcular
          var ondulacion = interpolacion_bilineal(datos, lat, lon, latitud, longitud)

          return ondulacion;

        });
      });
    })
    .catch((err) => {
      console.error("Error en la lectura del archivo:", err);
    });
}

function interpolacion_bilineal(datos, maxLatitud, minLongitud, latitud, longitud){
    //v = (y-y1)/(y2-y1)
   
    var v = parseFloat((maxLatitud-latitud)/datos.incrementoLat);
    //u = (x-x1)/(x2-x1)
    var u = parseFloat((longitud-minLongitud)/datos.incrementoLon);
    //formula interpolacion lineal (Q11, Q12, Q21, Q22) son las esquinas de los cuadrilateros
    //Q = (1-u)(1-v)Q11 + u(1-v)(Q21) + uvQ22 + (1-u)vQ12
    var q = ((1-u)*(1-v)*datos.norteOeste) + (u*(1-v)*datos.surOeste) + (u*v*datos.surEste) + ((1-u)*v*datos.norteEste);
    console.log('El valor de la ondulacion es: ',q)
    console.log('El valor de la ondulacion es: ',q.toFixed(2))
    
    return q

}


ondulacion_geoidal(6.040497435, -72.285360800);
ondulacion_geoidal(4, -73);

