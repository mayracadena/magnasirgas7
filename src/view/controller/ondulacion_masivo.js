const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");
const conexion = require('../db/conexion.js');
//importación de modulos matemáticos
const { planas_cartesianas_a_curvilineas, geocentricas_a_curvilineas, curvilineas_a_geocentricas, planas_a_curvilineas, curvilineas_a_planas, curvilineas_a_planas_cartesianas } = require('../controller/conversion_coordenadas.js');
const { origen_nacional, gauss_kruger, origen_UTM, origen_UTM_planas_a_curvilienas } = require('../controller/origen.js');
const origen = require('../class/origen.js');


document.addEventListener('DOMContentLoaded', () => {
    // Configuración de eventos
    document.getElementById('calcular').addEventListener('click', calcularOndulaciones);
    document.getElementById('limpiar').addEventListener('click', limpiarTabla);
    document.getElementById('tipo-coordenada').addEventListener('change', generarCabeceras);
    document.getElementById('cargar-archivo').addEventListener('change', cargarArchivo);

    // Función para generar cabeceras dinámicas según el tipo de coordenada
    function generarCabeceras() {
        const tipo = document.getElementById('tipo-coordenada').value;
        console.log("Tipo de coordenada seleccionado:", tipo);

        const thead = document.querySelector('#tabla-datos thead');
        thead.innerHTML = '';

        let headers = [];
        switch (tipo) {
            case 'elipsoidal':
            case 'elipsoidales-grados':
                headers = ['ID', 'Latitud', 'Longitud'];
                break;
            case 'utm':
                headers = ['ID', 'Este', 'Norte', 'Zona'];
                break;
            case 'geocentrica':
                headers = ['ID', 'X', 'Y', 'Z'];
                break;
            case 'plana-cartesiana':
                headers = ['ID', 'X', 'Y'];
                break;
            case 'gauss-kruger':
                headers = ['ID', 'Este', 'Norte', 'Zona'];
                break;
            case 'origen-nacional':
                headers = ['ID', 'Este', 'Norte'];
                break;
            default:
                headers = ['ID'];
                break;
        }

        console.log("Cabeceras generadas:", headers);

        const tr = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            tr.appendChild(th);
        });
        thead.appendChild(tr);
    }

    // Función para cargar un archivo CSV
    function cargarArchivo(event) {
        const tipoCoordenada = document.getElementById('tipo-coordenada').value;
        console.log("Intentando cargar archivo CSV con tipo de coordenada:", tipoCoordenada);

        if (!tipoCoordenada) {
            alert('Por favor seleccione un tipo de coordenada antes de cargar el archivo.');
            this.value = '';
            return;
        }

        const file = event.target.files[0];
        console.log("Archivo seleccionado:", file);

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const lines = e.target.result.split('\n').map(line => line.trim()).filter(line => line !== '');
                console.log("Líneas leídas del CSV:", lines);

                const tableBody = document.querySelector('#tabla-datos tbody');
                tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar nuevos datos

                const dataLines = lines.slice(1); // Ignorar primera línea (encabezado del CSV)
                console.log("Líneas de datos (sin encabezado):", dataLines);

                const columnsCount = document.querySelectorAll('#tabla-datos thead th').length;
                console.log("Cantidad de columnas esperadas:", columnsCount);

                dataLines.forEach((line, index) => {
                    const columns = line.split(',').map(col => col.trim());
                    console.log(`Procesando línea ${index + 2}:`, columns);

                    if (columns.length === columnsCount) {
                        const tr = document.createElement('tr');
                        columns.forEach(col => {
                            const td = document.createElement('td');
                            td.textContent = col;
                            tr.appendChild(td);
                        });
                        tableBody.appendChild(tr);
                    } else {
                        console.warn(`La línea ${index + 2} no coincide con el número de columnas esperado.`);
                    }
                });

                console.log("Datos cargados en la tabla.");
            };
            reader.readAsText(file);
        } else {
            console.warn("No se seleccionó ningún archivo.");
        }
    }

    // Función para calcular ondulaciones
    async function calcularOndulaciones() {
        const rows = document.querySelectorAll('#tabla-datos tbody tr');
        console.log("Iniciando cálculo de ondulaciones. Filas a procesar:", rows.length);

        if (rows.length === 0) {
            alert('No hay datos cargados para procesar.');
            return;
        }

        const tipoCoordenada = document.getElementById('tipo-coordenada').value;
        console.log("Tipo de coordenada para el cálculo:", tipoCoordenada);

        if (!tipoCoordenada) {
            alert("Por favor seleccione un tipo de coordenada.");
            return;
        }
        const resultados = [];
        let procesados = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');
            const id = cells[0].textContent.trim();
            // const lat = parseFloat(cells[1].textContent.trim());
            // const lon = parseFloat(cells[2].textContent.trim());

            const coords = await convertirCoordenadas(tipoCoordenada, cells);
            const { lat, lon } = coords;

            if (!isNaN(lat) && !isNaN(lon)) {
                calcularOndulacionGeoidal(lat, lon)
                    .then(ondulacion => {
                        console.log(`Ondulación calculada para ID ${id}: ${ondulacion}`);
                        resultados.push({ id, lat, lon, ondulacion: ondulacion.toFixed(3) });
                        procesados++;
                        if (procesados === rows.length) {
                            console.log("Cálculos completados. Generando CSV...");
                            generarArchivoCSV(resultados);
                        }
                    })
                    .catch(err => {
                        console.error(`Error al calcular ondulación para ID ${id}:`, err);
                        procesados++;
                        if (procesados === rows.length) {
                            generarArchivoCSV(resultados);
                        }
                    });
            } else {
                console.warn(`Datos inválidos en la fila ${rowIndex + 1}. Lat o Lon no numéricas.`);
                procesados++;
                if (procesados === rows.length) {
                    generarArchivoCSV(resultados);
                }
            }
        }

    }

    // Función para limpiar la tabla
    function limpiarTabla() {
        console.log("Limpiando tabla...");
        document.querySelector('#tabla-datos thead').innerHTML = '';
        document.querySelector('#tabla-datos tbody').innerHTML = '';
        document.getElementById('cargar-archivo').value = '';
        document.getElementById('tipo-coordenada').value = '';
    }

    // Función principal para calcular la ondulación geoidal
    function calcularOndulacionGeoidal(latitud, longitud) {
        console.log(`Calculando ondulación para lat:${latitud}, lon:${longitud}`);
        return new Promise((resolve, reject) => {
            cargarGrillaGeoidal()
                .then(datosGrilla => {
                    if (latitud < datosGrilla.minLatitud || latitud > datosGrilla.maxLatitud) {
                        return reject("Latitud fuera del rango permitido.");
                    }
                    if (longitud < datosGrilla.minLongitud || longitud > datosGrilla.maxLongitud) {
                        return reject("Longitud fuera del rango permitido.");
                    }

                    const i = Math.floor((datosGrilla.maxLatitud - latitud) / datosGrilla.incrementoLat);
                    const j = Math.floor((longitud - datosGrilla.minLongitud) / datosGrilla.incrementoLon);

                    const norteOeste = datosGrilla.data[i][j];
                    const norteEste = datosGrilla.data[i][j + 1];
                    const surOeste = datosGrilla.data[i + 1][j];
                    const surEste = datosGrilla.data[i + 1][j + 1];

                    const latNorte = datosGrilla.maxLatitud - i * datosGrilla.incrementoLat;
                    const latSur = latNorte - datosGrilla.incrementoLat;
                    const lonOeste = datosGrilla.minLongitud + j * datosGrilla.incrementoLon;
                    const lonEste = lonOeste + datosGrilla.incrementoLon;

                    console.log("Puntos para interpolación bilineal:", {
                        latNorte, latSur, lonOeste, lonEste,
                        norteOeste, norteEste, surOeste, surEste
                    });

                    const ondulacion = interpolacionBilineal(
                        latitud, longitud,
                        latNorte, latSur, lonOeste, lonEste,
                        norteOeste, norteEste, surOeste, surEste
                    );

                    resolve(ondulacion);
                })
                .catch(err => {
                    console.error("Error al cargar la grilla geoidal:", err);
                    reject(`Error al cargar la grilla geoidal: ${err}`);
                });
        });
    }

    // Función para cargar la grilla geoidal
    function cargarGrillaGeoidal() {
        console.log("Cargando grilla geoidal...");
        return new Promise((resolve, reject) => {
            fetch('grids/Geocol2004.txt')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error al cargar el archivo: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(data => {
                    const lineas = data.split('\n').filter(linea => linea.trim() !== '');
                    if (lineas.length < 2) {
                        throw new Error("El archivo de grilla no contiene datos suficientes.");
                    }

                    const cabecera = lineas[0].split(" ").filter(val => val.trim() !== '').map(parseFloat);
                    const minLatitud = cabecera[0];
                    const maxLatitud = cabecera[1];
                    const minLongitud = cabecera[2];
                    const maxLongitud = cabecera[3];
                    const incrementoLat = cabecera[4];
                    const incrementoLon = cabecera[5];

                    const dataGrilla = lineas.slice(1).map(linea =>
                        linea.split(" ").filter(val => val.trim() !== '').map(parseFloat)
                    );

                    console.log("Grilla geoidal cargada con éxito:", {
                        minLatitud,
                        maxLatitud,
                        minLongitud,
                        maxLongitud,
                        incrementoLat,
                        incrementoLon,
                        dataGrilla: dataGrilla.length
                    });

                    resolve({
                        minLatitud,
                        maxLatitud,
                        minLongitud,
                        maxLongitud,
                        incrementoLat,
                        incrementoLon,
                        data: dataGrilla
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    // Interpolación bilineal
    function interpolacionBilineal(
        lat, lon, latNorte, latSur, lonOeste, lonEste,
        norteOeste, norteEste, surOeste, surEste
    ) {
        console.log("Interpolando con bilineal:");
        const deltaLat = latNorte - lat;
        const deltaLon = lon - lonOeste;

        const t = deltaLat / (latNorte - latSur);
        const u = deltaLon / (lonEste - lonOeste);

        const resultado = (
            (1 - t) * (1 - u) * surOeste +
            (1 - t) * u * surEste +
            t * (1 - u) * norteOeste +
            t * u * norteEste
        );

        console.log("Resultado de interpolación:", resultado);
        return resultado;
    }


    // funcion para mostrar el origen de coordenadas cuando este se seleccione
    document.getElementById('tipo-coordenada').addEventListener('change', async function () {
        var opcion = document.getElementById('tipo-coordenada').value;
        var div_planas = document.getElementById('origen-cartesiano-tab');
        var div_origen_gauss = document.getElementById('origen-gauss-tab');
        if (opcion == 'plana-cartesiana') {
            div_origen_gauss.hidden = true;
            div_planas.hidden = false;
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
        } else if (opcion == 'gauss-kruger') {
            div_origen_gauss.hidden = false;
            div_planas.hidden = true;
        } else {
            div_origen_gauss.hidden = true;
            div_planas.hidden = true;
        }
    });



    //funcion para mostrar informacion de planas cartesianas
    const detalle_origen = document.getElementById('informacion_origen');
    if (detalle_origen) {
        detalle_origen.addEventListener('show.bs.modal', async function () {
            const modalBodyContent = document.getElementById('modal-body-content');

            var id_origen_cartesiano = document.getElementById('origenes-cartesianos').value;
            console.log(id_origen_cartesiano);
            var mensaje_detalle = '';
            if (id_origen_cartesiano == 'defecto') {
                mensaje_detalle = '<h4>No has escogido origen de coordenadas cartesianas</h4>';

            } else {
                try {
                    await con.open();
                    var select_detalle_id = document.getElementById('origenes-cartesianos').value;


                    //traer todos los datos del origen cartografico
                    var query_detalle_id = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia, o.latitud, o.longitud , o.norte, o.este, o.plano_proyeccion from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where o.id = ?";
                    var parametros_detalle_id = [select_detalle_id]
                    var roc = await con.getOne(query_detalle_id, parametros_detalle_id);

                    var headModal = document.getElementById('informacion_origen_Label')
                    headModal.innerHTML = roc.detalle;

                    mensaje_detalle = `Departamento: ${roc.departamento} <br>
                           Municipio: ${roc.municipio} <br>
                           <h4>Elipsoidales</h4>
                           Latitud de origen: ${roc.latitud} grados<br>
                           Longitud de origen: ${roc.longitud} grados<br>
                           <h4>Planas</h4>
                           Falso norte: ${roc.norte} m<br>
                           Falso este: ${roc.este} m<br>
                           Plano de proyección: ${roc.plano_proyeccion} m<br>
                           <h4>Descripción</h4>
                           ${roc.descripcion}
      
                           `

                    console.log("info", roc)

                } catch (error) {
                    console.error("Ocurrió un error:", error);
                    return null;
                } finally {
                    await con.close();
                }
            }

            if (modalBodyContent) {

                modalBodyContent.innerHTML = mensaje_detalle;

            }
        });
    }


    // Función para convertir según tipo (placeholder)
    async function convertirCoordenadas(tipo, cells) {

        let lat = null, lon = null;
        switch (tipo) {
            case 'elipsoidal':
            case 'elipsoidales-grados':
                lat = parseFloat(cells[1].textContent.trim());
                lon = parseFloat(cells[2].textContent.trim());
                break;
            case 'utm':
                var nutm = parseFloat(cells[2].textContent.trim());
                var eutm = parseFloat(cells[1].textContent.trim());
                var huso = parseInt(cells[3].textContent.trim());
                var hemisferio = huso.charAt(huso.length - 1);

                var c_utm = new coord_planas(nutm, eutm, 0)
                var origen_utm = await origen_UTM_planas_a_curvilienas(huso, hemisferio);

                let cutm = await planas_a_curvilineas(c_utm, origen_utm, 'MAGNA-SIRGAS');
                var cc = new coord_curvilineas(cutm.phi, cutm.lambda, cutm.h);

                lat = cc.phi;
                lon = cc.lambda;
                break;
            case 'gauss-kruger':
                var ngk = parseFloat(cells[2].textContent.trim());
                var egk = parseFloat(cells[1].textContent.trim());
                var origen_gauss_partida = document.getElementById('origen-gauss').value;
                var c_gk = new coord_planas(ngk, egk, 0);

                var o = await gauss_kruger(origen_gauss_partida, 'MAGNA-SIRGAS');

                let cgk = await planas_a_curvilineas(c_gk, o, 'MAGNA-SIRGAS');
                var cc = new coord_curvilineas(cgk.phi, cgk.lambda, cgk.h);

                lat = cc.phi;
                lon = cc.lambda;

                break;

            case 'origen-nacional':
                var norte_on = parseFloat(cells[2].textContent.trim());
                var este_on = parseFloat(cells[1].textContent.trim());
                var cp_on = new coord_planas(norte_on, este_on, 0);
                let on = await origen_nacional();
                var ccr = await planas_a_curvilineas(cp_on, on, 'MAGNA-SIRGAS');
                var cc = new coord_curvilineas(ccr.phi, ccr.lambda, 0);


                lat = cc.phi;
                lon = cc.lambda;


                break;
            case 'plana-cartesiana':
                var npc = parseFloat(cells[2].textContent.trim());
                var epc = parseFloat(cells[1].textContent.trim());

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
                    console.log('coordenadas planas', lat, lon)
                }


                break;
            case 'geocentrica':
                x = parseFloat(cells[1].textContent.trim());
                y = parseFloat(cells[2].textContent.trim());
                z = parseFloat(cells[3].textContent.trim());
                const ellipsoidal = geocentricToEllipsoidal(x, y, z);
                lat = ellipsoidal.latitude;
                lon = ellipsoidal.longitude;
                break;
        }
        return { lat, lon };
    }




    // Generar CSV de resultados
    function generarArchivoCSV(resultados) {
        console.log("Generando archivo CSV con resultados:", resultados);
        const contenidoCSV = 'ID,Latitud,Longitud,Ondulación\n' +
            resultados.map(row => `${row.id},${row.lat},${row.lon},${row.ondulacion}`).join('\n');

        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'resultados_ondulacion.csv';
        link.click();
    }
});
