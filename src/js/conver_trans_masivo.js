const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");
const conexion = require('../db/conexion.js');
const { origen_nacional, gauss_kruger, origen_UTM, origen_UTM_planas_a_curvilienas, origen_gauss_kruger } = require('../controller/origen.js');
const transformacion = require('../class/transformacion');
const { transformacion3D } = require('../controller/transformacion_coordenadas.js');
const { planas_cartesianas_a_curvilineas, geocentricas_a_curvilineas, curvilineas_a_geocentricas, planas_a_curvilineas, curvilineas_a_planas, curvilineas_a_planas_cartesianas } = require('../controller/conversion_coordenadas.js');

const map = require('../js/mapa_colombia.js');


document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('calcular').addEventListener('click', calcular_trans_cover);
    
    document.getElementById('tipo-coordenada').addEventListener('change', generarCabeceras);
    document.getElementById('archivo-coordenadas').addEventListener('change', cargarArchivo);

    function generarCabeceras() {
        const tipo = document.getElementById('tipo-coordenada').value;

        const thead = document.querySelector('#tabla-datos thead');
        thead.innerHTML = '';

        let headers = [];
        switch (tipo) {
            case 'elipsoidal':

                headers = ['ID', 'Latitud', 'Longitud', 'Altura'];
                break;
            case 'utm':
                headers = ['ID', 'Este', 'Norte', 'Altura', 'Zona'];
                break;
            case 'geocentrica':
                headers = ['ID', 'X', 'Y', 'Z'];
                break;
            case 'plana-cartesiana':
                headers = ['ID', 'X', 'Y', 'Altura'];
                break;
            case 'gauss-kruger':
                headers = ['ID', 'Este', 'Norte', 'Altura'];
                break;
            case 'origen-nacional':
                headers = ['ID', 'Este', 'Norte', 'Altura'];
                break;
            default:
                headers = ['ID'];
                break;
        }


        const tr = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            tr.appendChild(th);
        });
        thead.appendChild(tr);
    }

    async function cargarArchivo(event) {
        const tipoCoordenada = document.getElementById('tipo-coordenada').value;
        console.log("cargarArchivo() - Tipo de coordenada actual:", tipoCoordenada);

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
                tableBody.innerHTML = '';

                const dataLines = lines.slice(1);
                const columnsCount = document.querySelectorAll('#tabla-datos thead th').length;
                console.log("Cantidad de columnas esperadas según tipo:", columnsCount);

                dataLines.forEach((line, index) => {
                    const columns = line.split(',').map(col => col.trim());
                    

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

    async function calcular_trans_cover() {


        var coord_partida = document.getElementById('tipo-coordenada').value;
        var coord_destino = document.getElementById('tipo-coordenada-destino').value;


        if (coord_partida == 'default' || coord_destino == 'default') {
            alert('Debes escoger el tipo de coordenada origen e inicio')
        } else {

            console.log("Iniciando cálculo masivo de transformacion de coordenadas");
            const rows = document.querySelectorAll('#tabla-datos tbody tr');
            console.log("Filas a procesar:", rows.length);

            if (rows.length === 0) {
                alert('No hay datos cargados para procesar.');
                return;
            }

            //captura de datum
            var srp = document.querySelector('input[name="sistemaRefOrigen"]:checked').id == 'refOrigenMagna' ? 'MAGNA-SIRGAS' : 'BOGOTÁ';
            var srd = document.querySelector('input[name="sistemaRefDestino"]:checked').id == 'refDestinoMagna' ? 'MAGNA-SIRGAS' : 'BOGOTÁ';

            const resultados = [];
            let procesados = 0;

            console.log('COORDENDAS DESTINO 1', coord_destino)
                    console.log('COORDENDAS partida 1', coord_partida)

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll('td');
                const id = cells[0].textContent.trim();
                
                //sistema de referencia partida, sistema referencia destino, tipo de coordenada y celdas del csv
                var coords = await convertirCoordenadasCurvilineas(srp, coord_partida, cells);
                var cc = new coord_curvilineas(coords.phi, coords.lambda, coords.h);

                await map.agregarPuntoSecuencial(cc.phi, cc.lambda, id);


                if (isNaN(cc.phi) || isNaN(cc.lambda)) {
                    console.error(`Coordenadas inválidas en la fila ${i + 1}, ID:${id}`);
                    procesados++;
                    if (procesados === rows.length) {
                        console.log("Todos los puntos procesados. Generando archivo CSV...");
                        generarArchivoCSV(resultados);
                    }
                    continue;
                }

                try {
                   
                    if ((srp == 'MAGNA-SIRGAS' && srd == 'BOGOTÁ') || (srd == 'MAGNA-SIRGAS' && srp == 'BOGOTÁ')) {

                        var boolDatum = (srp == 'MAGNA-SIRGAS' && srd == 'BOGOTÁ') ? false : true;
                        var transf = await map.regionTransformacion(cc.phi, cc.lambda);
                        //pasar a geocentricas para la transformacion
                        var cg = await curvilineas_a_geocentricas(cc, srp);
                        //transformacion de datos
                        var cgr = await transformacion3D(cg, transf, boolDatum)
                        var cgeotransf = new coord_geocentricas(cgr.X, cgr.Y, cgr.Z);
                        //volver a convertir a elipsoidales
                        var cctransf = await geocentricas_a_curvilineas(cgeotransf, srd);
                        var coord_curvili_transformadas = new coord_curvilineas(cctransf.phi, cctransf.lambda, cctransf.h);
                        //reasignacion de coordenadas capturadas
                        cc = coord_curvili_transformadas;
                    }

                    console.log('COORDENDAS DESTINO ', coord_destino)
                    console.log('COORDENDAS partida ', coord_partida)
                    if (coord_destino == 'elipsoidal') {
                        resultados.push({
                            id: cells[0].textContent.trim(),
                            latitud: cc.phi,
                            longitud: cc.lambda,
                            altura: cc.h
                        });
                    } else if (coord_destino == 'utm') {
                        let utmc = await origen_UTM(cc);
                        let coord_respuesta = await curvilineas_a_planas(cc, utmc, srd);
                        var c_utm = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

                        resultados.push({
                            id: cells[0].textContent.trim(),
                            este: c_utm.este,
                            norte: c_utm.norte,
                            altura: c_utm.h,
                            zona: utmc.nombre
                        });
                    } else if (coord_destino == 'geocentrica') {
                        let coord_respuesta = await curvilineas_a_geocentricas(cc, srd);
                        var c_geo = new coord_geocentricas(coord_respuesta.X, coord_respuesta.Y, coord_respuesta.Z);

                        resultados.push({
                            id: cells[0].textContent.trim(),
                            x: c_geo.X,
                            y: c_geo.Y,
                            z: c_geo.Z
                        });
                    } else if (coord_destino == 'plana-cartesiana') {


                        var origen_cartesiano = document.getElementById('origenes-cartesianos-destino').value;

                        if (origen_cartesiano == 'defecto') {
                            alert('Debes escoger un origen cartesiano');
                        } else {
                            let coord_respuesta = await curvilineas_a_planas_cartesianas(cc, srd, origen_cartesiano);
                            var c_p = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

                            resultados.push({
                                id: cells[0].textContent.trim(),
                                este: c_p.este,
                                norte: c_p.norte,
                                altura: c_p.h
                            });

                        }

                    } else if (coord_destino == 'gauss-kruger') {
                        var origen_gauss = await origen_gauss_kruger(cc.lambda);

                        var o = await gauss_kruger(origen_gauss, srd);

                        let coord_respuesta = await curvilineas_a_planas(cc, o, srd);
                        var c_pgk = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);

                        resultados.push({
                            id: cells[0].textContent.trim(),
                            este: c_pgk.este,
                            norte: c_pgk.norte,
                            altura: c_pgk.h,
                            origen: origen_gauss
                        });

                    } else if (coord_destino == 'origen-nacional') {
                        let on = await origen_nacional();

                        let coord_respuesta = await curvilineas_a_planas(cc, on, srd);
                        var c_on = new coord_planas(coord_respuesta.norte, coord_respuesta.este, coord_respuesta.h);
                        resultados.push({
                            id: cells[0].textContent.trim(),
                            este: c_on.este,
                            norte: c_on.norte,
                            altura: c_on.h
                        });

                    } else {
                        console.warn(`No se pudo calcular el cambio de época para ID ${id}`);
                    }
                } catch (error) {
                    console.error(`Error en ID ${id}:`, error);
                } finally {
                    procesados++;
                    console.log(`Procesados: ${procesados}/${rows.length}`);
                    if (procesados === rows.length) {
                        console.log("Todos los puntos procesados. Generando archivo CSV...");
                        generarArchivoCSV(resultados);
                    }
                }
            }
        }
    }



    function generarArchivoCSV(resultados) {
        var coord_partida = document.getElementById('tipo-coordenada').value;
        var coord_destino = document.getElementById('tipo-coordenada-destino').value;
        console.log("Generando archivo CSV con resultados:", coord_destino);


        var encabezado, lineas;
        if (coord_destino == 'elipsoidal') {
            encabezado = 'ID,Latitud,Longitud,Altura';
            lineas = resultados.map(r => `${r.id},${r.latitud},${r.longitud},${r.altura}`);

        } else if (coord_destino == 'utm') {
            encabezado = 'ID,Este,Norte,Altura,Zona';
            lineas = resultados.map(r => `${r.id},${r.este},${r.norte},${r.altura},${r.zona}`);
        } else if (coord_destino == 'geocentrica') {
            encabezado = 'ID,X,Y,Z';
            lineas = resultados.map(r => `${r.id},${r.x},${r.y},${r.z}`);
        } else if (coord_destino == 'plana-cartesiana') {
            encabezado = 'ID,Este,Norte,Altura';
            lineas = resultados.map(r => `${r.id},${r.este},${r.norte},${r.altura}`);
        } else if (coord_destino == 'gauss-kruger') {
            encabezado = 'ID,Este,Norte,Altura,Origen';
            lineas = resultados.map(r => `${r.id},${r.este},${r.norte},${r.altura},${r.origen}`);
        } else if (coord_destino == 'origen-nacional') {
            encabezado = 'ID,Este,Norte,Altura';
            lineas = resultados.map(r => `${r.id},${r.este},${r.norte},${r.altura}`);
        }

        const contenidoCSV = encabezado + '\n' + lineas.join('\n');

        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `conversion_de_${coord_partida}_a_${coord_destino}.csv`;
        link.click();
        console.log("CSV descargado con éxito.");
    }




    //funcion para convertir todo tipo de coordenadas a curvilineas
    async function convertirCoordenadasCurvilineas(srp, tipo, cells) {


        console.log("convertirCoordenadas() - Tipo:", tipo);
        var cc;
        switch (tipo) {
            case 'elipsoidal':
                var lat = parseFloat(cells[1].textContent.trim());
                var lon = parseFloat(cells[2].textContent.trim());
                var alt = parseFloat(cells[3].textContent.trim());
                var cc = new coord_curvilineas(lat, lon, alt);
                break;
            case 'utm':
                var nutm = parseFloat(cells[2].textContent.trim());
                var eutm = parseFloat(cells[1].textContent.trim());
                var alt = parseFloat(cells[3].textContent.trim());
                var huso_pre = cells[4].textContent.trim();
                var huso = huso_pre.substring(0, 2);
                var hemisferio = huso_pre.charAt(huso_pre.length - 1);

                var c_utm = new coord_planas(nutm, eutm, alt)
                var origen_utm = await origen_UTM_planas_a_curvilienas(huso, hemisferio);

                let cutm = await planas_a_curvilineas(c_utm, origen_utm, srp);
                cc = new coord_curvilineas(cutm.phi, cutm.lambda, cutm.h);

                break;
            case 'gauss-kruger':
                var ngk = parseFloat(cells[2].textContent.trim());
                var egk = parseFloat(cells[1].textContent.trim());
                var alt = parseFloat(cells[3].textContent.trim());
                var origen_gauss_partida = document.getElementById('origen-gauss').value;
                var c_gk = new coord_planas(ngk, egk, alt);

                var o = await gauss_kruger(origen_gauss_partida, srp);

                let cgk = await planas_a_curvilineas(c_gk, o, srp);
                cc = new coord_curvilineas(cgk.phi, cgk.lambda, cgk.h);

                break;
            case 'origen-nacional':
                var norte_on = parseFloat(cells[2].textContent.trim());
                var este_on = parseFloat(cells[1].textContent.trim());
                var alt = parseFloat(cells[3].textContent.trim());
                var cp_on = new coord_planas(norte_on, este_on, alt);
                let on = await origen_nacional();
                var ccr = await planas_a_curvilineas(cp_on, on, srp);
                cc = new coord_curvilineas(ccr.phi, ccr.lambda, ccr.h);

                break;
            case 'plana-cartesiana':
                var npc = parseFloat(cells[2].textContent.trim());
                var epc = parseFloat(cells[1].textContent.trim());
                var alt = parseFloat(cells[3].textContent.trim());
                var origen_cartesiano = document.getElementById('origenes-cartesianos').value;

                if (origen_cartesiano == 'defecto') {
                    alert('Debes escoger un origen cartesiano');
                }

                else {
                    var c_p = new coord_planas(npc, epc, alt);
                    let c_cc_m = await planas_cartesianas_a_curvilineas(c_p, origen_cartesiano);

                    cc = new coord_curvilineas(c_cc_m.phi, c_cc_m.lambda, c_cc_m.h);
                }


                break;
            case 'geocentrica':
                const x = parseFloat(cells[1].textContent.trim());
                const y = parseFloat(cells[2].textContent.trim());
                const z = parseFloat(cells[3].textContent.trim());
                var cg = new coord_geocentricas(x, y, z);
                let c_ccg = await geocentricas_a_curvilineas(cg, srp)
                cc = new coord_curvilineas(c_ccg.phi, c_ccg.lambda, c_ccg.h);
                break;
        }
        return cc;
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


            var sist_refe = document.querySelector('input[name="sistemaRefOrigen"]:checked').id == 'refOrigenMagna' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
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

                        var sist_refe = document.querySelector('input[name="sistemaRefOrigen"]:checked').id == 'refOrigenMagna' ? 'MAGNA-SIRGAS' : 'BOGOTÁ';
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
                        var sist_refe = document.querySelector('input[name="sistemaRefOrigen"]:checked').id == 'refOrigenMagna' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'



                        var parametros_detalle = [select_municipio_detalle, sist_refe]
                        var result_origen_detalle = await con.getAll(query_origen, parametros_detalle);
                        console.log(result_origen_detalle);
                        var detalle_select_origen = document.getElementById('origenes-cartesianos');
                        detalle_select_origen.innerHTML = '<option value="defecto">Seleccione año, municipio y/o corregimiento</option>';

                        result_origen_detalle.forEach(i => {

                            var option_detalle = document.createElement('option');
                            option_detalle.value = i.id,
                                option_detalle.textContent = i.detalle;


                            detalle_select_origen.appendChild(option_detalle);
                        });


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




    // funcion para mostrar el origen de coordenadas del destino cuando este se seleccione

    document.getElementById('tipo-coordenada-destino').addEventListener('change', async function () {
        var opcion = document.getElementById('tipo-coordenada-destino').value;
        var div_planas = document.getElementById('origen-cartesiano-destino-tab');
       
        if (opcion == 'plana-cartesiana') {
            
            div_planas.hidden = false;
            var con = new conexion();

            console.log('dentro de planas cartesianas')


            var sist_refe = document.querySelector('input[name="sistemaRefDestino"]:checked').id == 'refDestinoMagna' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
            try {
                await con.open();

                //seleccionar a todos los departamentos
                var query_departamentos = "select DISTINCT d.id, d.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where sr.nombre = ? order by d.nombre asc";
                var result_departamento = await con.getAll(query_departamentos, [sist_refe]);



                var select_departamento_planas_destino = document.getElementById('departamento-destino');
                select_departamento_planas_destino.innerHTML = '<option value="defecto" >Seleccione Departamento</option>';

                result_departamento.forEach(i => {

                    var option_departamento = document.createElement('option');
                    option_departamento.value = i.id,
                        option_departamento.textContent = i.nombre;


                    select_departamento_planas_destino.appendChild(option_departamento);


                });



                //funcion para mostrar los municipios segun el departamento que se encuentre activo

                document.getElementById('departamento-destino').addEventListener("change", async function () {
                    //seleccionar a todos los departamentos

                    try {

                        var sist_refe = document.querySelector('input[name="sistemaRefDestino"]:checked').id == 'refDestinoMagna' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'
                        await con.open();
                        var id_departamento = document.getElementById('departamento-destino').value;
                        var query_municipios = "select DISTINCT  m.id, m.nombre from departamento d inner join municipio m on m.fk_departamento = d.id inner join origen_cartografico oc on oc.fk_municipio = m.id inner join sistema_referencia sr on sr.id = oc.fk_sistema where m.fk_departamento = ? and sr.nombre = ? order by m.nombre asc";
                        var parametros_municipio = [id_departamento.toString(), sist_refe]
                        var result_municipio = await con.getAll(query_municipios, parametros_municipio);

                        var select_municipios = document.getElementById('municipio-destino');

                        select_municipios.innerHTML = '<option value="defecto">Seleccione Municipio</option>';


                        result_municipio.forEach(i => {

                            var option_municipio = document.createElement('option');
                            option_municipio.value = i.id,
                                option_municipio.textContent = i.nombre;


                            select_municipios.appendChild(option_municipio);
                        });


                    } catch (error) {
                        console.error("Ocurrió un error:", error);
                        return null;
                    } finally {
                        await con.close();
                    }





                });


                document.getElementById('municipio-destino').addEventListener("change", async function () {

                    try {
                        await con.open();
                        var select_municipio_detalle = document.getElementById('municipio-destino').value;

                        //traer todos los datos del origen cartografico
                        var query_origen = "select o.id, d.nombre as departamento, m.nombre as municipio, c.nombre as corregimiento, o.detalle as detalle , o.descripcion as descripcion, s.nombre as sistema_referencia  from departamento d inner join municipio m on d.id = m.fk_departamento  inner join origen_cartografico o on m.id = o.fk_municipio LEFT join  corregimiento c on c.id = o.fk_corregimiento  inner join sistema_referencia s on s.id = o.fk_sistema where m.id = ? and s.nombre = ? ";
                        var sist_refe = document.querySelector('input[name="sistemaRefDestino"]:checked').id == 'refDestinoMagna' ? 'MAGNA-SIRGAS' : 'BOGOTÁ'



                        var parametros_detalle = [select_municipio_detalle, sist_refe]
                        var result_origen_detalle = await con.getAll(query_origen, parametros_detalle);

                        console.log(result_origen_detalle);

                        var detalle_select_origen = document.getElementById('origenes-cartesianos-destino');
                        detalle_select_origen.innerHTML = '<option value="defecto">Seleccione año, municipio y/o corregimiento</option>';

                        result_origen_detalle.forEach(i => {

                            var option_detalle = document.createElement('option');
                            option_detalle.value = i.id,
                                option_detalle.textContent = i.detalle;


                            detalle_select_origen.appendChild(option_detalle);
                        });


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
        }  else {           
            div_planas.hidden = true;
        }
    });


});
