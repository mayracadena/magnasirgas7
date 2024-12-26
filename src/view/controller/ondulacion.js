const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");
const conexion = require('../db/conexion.js');
//importación de modulos matemáticos
const { planas_cartesianas_a_curvilineas, geocentricas_a_curvilineas, curvilineas_a_geocentricas, planas_a_curvilineas, curvilineas_a_planas, curvilineas_a_planas_cartesianas } = require('../controller/conversion_coordenadas.js');
const { origen_nacional, gauss_kruger, origen_UTM, origen_UTM_planas_a_curvilienas } = require('../controller/origen.js');
const origen = require('../class/origen.js');


document.getElementById('coordenadas-decimales').addEventListener('change', function () {
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

document.getElementById('calcular').addEventListener('click', async function (event) {
    event.preventDefault();
    console.log('dentro de funcion ', document.querySelector("#myTab .nav-link.active").id);

    var nav_a = document.querySelector("#myTab .nav-link.active").id;

    let lat, lon;
    if (nav_a == 'elipsoidaldecimal-tab') {
        // Leer coordenadas decimales directamente
        lat = parseFloat(document.getElementById('latitud-decimal').value);
        lon = parseFloat(document.getElementById('longitud-decimal').value);
    } else if (nav_a == 'elipsoidal-tab') {
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
    } else if (nav_a == 'origen-nacional-tab') {
        var norte_on = parseFloat(document.getElementById('norte').value);
        var este_on = parseFloat(document.getElementById('este').value);

        console.log('dentro de origen nacional')

        var cp_on = new coord_planas(norte_on, este_on, 0);
        let on = await origen_nacional();
        var ccr = await planas_a_curvilineas(cp_on, on, 'MAGNA-SIRGAS');
        var cc = new coord_curvilineas(ccr.phi, ccr.lambda, 0);
        console.log('coordenadas calculadas ', cc)

        lat = cc.phi;
        lon = cc.lambda;



    } else if (nav_a == 'geocentrica-tab') {

        var x = parseFloat(document.getElementById('x').value);
        var y = parseFloat(document.getElementById('y').value);
        var z = parseFloat(document.getElementById('z').value);

        var cg = new coord_geocentricas(x, y, z);

        var cgr = await geocentricas_a_curvilineas(cg, 'MAGNA-SIRGAS')
        var cc = new coord_curvilineas(cgr.phi, cgr.lambda, cgr.h);

        lat = cc.phi;
        lon = cc.lambda;


    } else if (nav_a == 'plana-cartesiana-tab') {
        var npc = parseFloat(document.getElementById('norte-pc').value);
        var epc = parseFloat(document.getElementById('este-pc').value);

        var origen_cartesiano = document.getElementById('origenes-cartesianos').value;

        if (origen_cartesiano == 'defecto') {
            alert('Debes escoger un origen cartesiano');
        }

        else {
            var c_p = new coord_planas(npc, epc, 0);
            let c_cc_m = await planas_cartesianas_a_curvilineas(c_p, origen_cartesiano);

            var cc = new coord_curvilineas(c_cc_m.phi, c_cc_m.lambda, c_cc_m.h);

            lat = cc.phi;
            lon = cc.lambda;

        }

    } else if (nav_a == 'utm-tab') {
        var nutm = parseFloat(document.getElementById('norte-utm').value);
        var eutm = parseFloat(document.getElementById('este-utm').value);
        var huso = parseInt(document.getElementById('huso').value);
        var hemisferio = document.getElementById('hemisferio').value;

        var c_utm = new coord_planas(nutm, eutm, 0)
        var origen_utm = await origen_UTM_planas_a_curvilienas(huso, hemisferio);

        let cutm = await planas_a_curvilineas(c_utm, origen_utm, 'MAGNA-SIRGAS');
        var cc = new coord_curvilineas(cutm.phi, cutm.lambda, cutm.h);

        lat = cc.phi;
        lon = cc.lambda;

    } else if (nav_a == 'gauss-kruger-tab') {
        var ngk = parseFloat(document.getElementById('norte-gk').value);
        var egk = parseFloat(document.getElementById('este-gk').value);
        var origen_gauss_partida = document.getElementById('origen-gauss').value;

        var c_gk = new coord_planas(ngk, egk, 0);

        var o = await gauss_kruger(origen_gauss_partida, 'MAGNA-SIRGAS');

        let cgk = await planas_a_curvilineas(c_gk, o, 'MAGNA-SIRGAS');
        var cc = new coord_curvilineas(cgk.phi, cgk.lambda, cgk.h);

        lat = cc.phi;
        lon = cc.lambda;

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


document.getElementById('myTab').addEventListener("click", async function () {
    var nav_a = document.querySelector("#myTab .nav-link.active").id;
    if (nav_a == 'plana-cartesiana-tab') {
        var con = new conexion();

        console.log('dentro de planas cartesianas')


        var sist_refe = 'MAGNA-SIRGAS';
        try {
            await con.open();

            //seleccionar a todos los departamentos
            var query_departamentos = "select DISTINCT d.id, d.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where sr.nombre = ? order by d.nombre asc";
            var result_departamento = await con.getAll(query_departamentos, [sist_refe]);



            var select_departamento_planas_destino = document.getElementById('departamento');
            select_departamento_planas_destino.innerHTML = '<option value="defecto" >Seleccione Departamento</option>';

            result_departamento.forEach(i => {

                var option_departamento = document.createElement('option');
                option_departamento.value = i.id,
                    option_departamento.textContent = i.nombre;


                select_departamento_planas_destino.appendChild(option_departamento);


            });



            //funcion para mostrar los municipios segun el departamento que se encuentre activo

            document.getElementById('departamento').addEventListener("change", async function () {
                //seleccionar a todos los departamentos

                try {
                    var sist_refe = 'MAGNA-SIRGAS';
                    await con.open();
                    var id_departamento = document.getElementById('departamento').value;
                    var query_municipios = "select DISTINCT  m.id, m.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where m.fk_departamento = ? and sr.nombre = ? order by m.nombre asc";
                    var parametros_municipio = [id_departamento.toString(), sist_refe]
                    var result_municipio = await con.getAll(query_municipios, parametros_municipio);

                    var select_municipios = document.getElementById('municipio');

                    select_municipios.innerHTML = '<option value="defecto">Seleccione Municipio</option>';


                    result_municipio.forEach(i => {

                        var option_municipio = document.createElement('option');
                        option_municipio.value = i.id,
                            option_municipio.textContent = i.nombre;


                        select_municipios.appendChild(option_municipio);
                    });



                    console.log(result_municipio)

                } catch (error) {
                    console.error("Ocurrió un error:", error);
                    return null;
                } finally {
                    await con.close();
                }





            });


            document.getElementById('municipio').addEventListener("change", async function () {

                try {
                    await con.open();
                    var select_municipio_detalle = document.getElementById('municipio').value;

                    //traer todos los datos del origen cartografico
                    var query_origen = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia  from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where m.id = ? and s.nombre = ? ";
                    var sist_refe = 'MAGNA-SIRGAS'



                    var parametros_detalle = [select_municipio_detalle, sist_refe]
                    var result_origen_detalle = await con.getAll(query_origen, parametros_detalle);

                    var detalle_select_origen = document.getElementById('origenes-cartesianos');
                    detalle_select_origen.innerHTML = '<option value="defecto">Seleccione año, municipio y/o corregimiento</option>';

                    result_origen_detalle.forEach(i => {

                        var option_detalle = document.createElement('option');
                        option_detalle.value = i.id,
                            option_detalle.textContent = i.detalle;


                        detalle_select_origen.appendChild(option_detalle);
                    });
                    console.log(result_origen_detalle)

                } catch (error) {
                    console.error("Ocurrió un error:", error);
                    return null;
                } finally {
                    await con.close();
                }
            })
        } catch (error) {
            console.error("Ocurrió un error:", error);
            return null;
        } finally {
            await con.close();
        }
    }
});