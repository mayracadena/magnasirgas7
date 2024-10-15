document.getElementById('coordenadas-decimales').addEventListener('change', function() {
    const isChecked = this.checked;
    toggleCoordinateInput(isChecked);
});

function toggleCoordinateInput(isDecimal) {
    const dmsFields = document.querySelectorAll('.dms-field');
    const decimalFields = document.querySelectorAll('.decimal-field');
    if (isDecimal) {
        dmsFields.forEach(field => field.style.display = 'none');
        decimalFields.forEach(field => field.style.display = 'block');
    } else {
        dmsFields.forEach(field => field.style.display = 'block');
        decimalFields.forEach(field => field.style.display = 'none');
    }
}

document.getElementById('calcular').addEventListener('click', function(event) {
    event.preventDefault();

    let lat, lon;
    if (document.getElementById('coordenadas-decimales').checked) {
        // Leer coordenadas decimales directamente
        lat = parseFloat(document.getElementById('latitud-decimal').value);
        lon = parseFloat(document.getElementById('longitud-decimal').value);
    } else {
        // Obtener valores de latitud y longitud en grados, minutos y segundos
        const latGrados = parseFloat(document.getElementById('latitud-grados').value);
        const latMinutos = parseFloat(document.getElementById('latitud-minutos').value);
        const latSegundos = parseFloat(document.getElementById('latitud-segundos').value);
        const latHemisferio = document.getElementById('latitud-hemisferio').value;

        const lonGrados = parseFloat(document.getElementById('longitud-grados').value);
        const lonMinutos = parseFloat(document.getElementById('longitud-minutos').value);
        const lonSegundos = parseFloat(document.getElementById('longitud-segundos').value);
        const lonHemisferio = document.getElementById('longitud-hemisferio').value;

        // Convertir a coordenadas decimales
        lat = latGrados + (latMinutos / 60) + (latSegundos / 3600);
        if (latHemisferio === 'S') {
            lat = -lat;
        }

        lon = lonGrados + (lonMinutos / 60) + (lonSegundos / 3600);
        if (lonHemisferio === 'W') {
            lon = -lon;
        }
    }

    // Validar coordenadas
    if (isNaN(lat) || isNaN(lon)) {
        document.getElementById('ondulacion-geoidal').value = 'Coordenadas inválidas.';
        return;
    }

    // Calcular la ondulación geoidal utilizando la lógica del primer código
    ondulacion_geoidal(lat, lon)
        .then((result) => {
            document.getElementById('ondulacion-geoidal').value = result.toFixed(3); // Mostrar el resultado en el campo correspondiente
        })
        .catch((err) => {
            console.error('Error en el cálculo:', err);
            document.getElementById('ondulacion-geoidal').value = 'Error al calcular la ondulación.';
        });
});

function ondulacion_geoidal(latitud, longitud) {
    return new Promise((resolve, reject) => {
        cabecero()
            .then((datos) => {
                // Validar si las coordenadas están dentro del rango de la grilla
                if (latitud < datos.minLatitud || latitud > datos.maxLatitud) {
                    alert("Latitud fuera del rango permitido");
                    return reject("Latitud fuera del rango");
                }
                if (longitud < datos.minLongitud || longitud > datos.maxLongitud) {
                    alert("Longitud fuera del rango permitido");
                    return reject("Longitud fuera del rango");
                }

                // Obtener índices en la grilla
                var i = parseInt((datos.maxLatitud - latitud) / datos.incrementoLat);
                var j = parseInt((longitud - datos.minLongitud) / datos.incrementoLon);

                var lat = datos.maxLatitud - i * datos.incrementoLat;
                var lon = datos.minLongitud + j * datos.incrementoLon;

                const contenido = datos.data.split("\n")[i + 1].split(" ");
                const contenido2 = datos.data.split("\n")[i + 2].split(" ");
                    
                datos.norteOeste = parseFloat(contenido[j]);
                datos.norteEste = parseFloat(contenido[j + 1]);
                datos.surOeste = parseFloat(contenido2[j]);
                datos.surEste = parseFloat(contenido2[j + 1]);

                const resultado = interpolacion_bilineal(datos, lat, lon, latitud, longitud);
                resolve(resultado);
            })
            .catch(reject);
    });
}

function interpolacion_bilineal(datos, maxLatitud, minLongitud, latitud, longitud) {
    var v = parseFloat((maxLatitud - latitud) / datos.incrementoLat);
    var u = parseFloat((longitud - minLongitud) / datos.incrementoLon);

    // Fórmula de interpolación bilineal
    var q = ((1 - u) * (1 - v) * datos.norteOeste) +
            (u * (1 - v) * datos.surOeste) +
            (u * v * datos.surEste) +
            ((1 - u) * v * datos.norteEste);

    return q;
}

function cabecero() {
    return new Promise((resolve, reject) => {
        // Aquí hacemos la solicitud al archivo de ondulación geoidal directamente
        fetch('grids/Geocol2004.txt')  // Actualiza esta ruta con la dirección correcta del archivo
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al cargar el archivo: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                if (!data) {
                    console.error("El archivo no contiene datos o no se pudo leer correctamente.");
                    reject("Archivo vacío o no leído.");
                    return;
                }

                console.log("Contenido del archivo recibido: ", data); // Para verificar que se recibe el contenido
                const contenido = data.split("\n");
                
                if (contenido.length === 0 || !contenido[0]) {
                    console.error("Error: El archivo no contiene la información esperada.");
                    reject("El archivo no contiene datos válidos.");
                    return;
                }
                
                const primera_linea = contenido[0].split(" ");
                if (primera_linea.length < 6) {
                    console.error("Error: La primera línea no contiene suficientes datos.");
                    reject("Datos de cabecera incompletos.");
                    return;
                }

                var minLatitud = parseFloat(primera_linea[0]);
                var maxLatitud = parseFloat(primera_linea[1]);
                var minLongitud = parseFloat(primera_linea[2]);
                var maxLongitud = parseFloat(primera_linea[3]);
                var incrementoLat = parseFloat(primera_linea[4]);
                var incrementoLon = parseFloat(primera_linea[5]);

                var datos = {
                    minLatitud,
                    maxLatitud,
                    minLongitud,
                    maxLongitud,
                    incrementoLat,
                    incrementoLon,
                    data
                };
                resolve(datos);
            })
            .catch(err => {
                console.error("Error al leer el archivo de ondulación geoidal:", err);
                reject(err);
            });
    });
}