const coord_planas_cartesianas = require("../class/coord_planas_cartesianas.js");
const coord_planas = require("../class/coord_planas.js");
const coord_curvilineas = require("../class/coord_curvilineas.js");
const coord_geocentricas = require("../class/coord_geocentricas.js");
const conexion = require('../db/conexion.js');
//importación de modulos matemáticos
const { planas_cartesianas_a_curvilineas, geocentricas_a_curvilineas, curvilineas_a_geocentricas, planas_a_curvilineas, curvilineas_a_planas, curvilineas_a_planas_cartesianas } = require('../controller/conversion_coordenadas.js');
const { origen_nacional, gauss_kruger, origen_UTM, origen_UTM_planas_a_curvilienas } = require('../controller/origen.js');


document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('calcular').addEventListener('click', calcularCambioEpocaMasivo);
    document.getElementById('limpiar').addEventListener('click', limpiarTabla);
    document.getElementById('tipo-coordenada').addEventListener('change', generarCabeceras);
    document.getElementById('cargar-archivo').addEventListener('change', cargarArchivo);

    function generarCabeceras() {
        const tipo = document.getElementById('tipo-coordenada').value;
        console.log("generarCabeceras() - Tipo de coordenada seleccionado:", tipo);
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

    function cargarArchivo(event) {
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

    async function calcularCambioEpocaMasivo() {
        console.log("Iniciando cálculo masivo de cambio de época...");
        const rows = document.querySelectorAll('#tabla-datos tbody tr');
        console.log("Filas a procesar:", rows.length);

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

        const fechaInicio = new Date(document.getElementById('fecha-inicio').value);
        const fechaDestino = new Date(document.getElementById('fecha-destino').value);
        console.log("Fecha inicio:", fechaInicio, "Fecha destino:", fechaDestino);

        if (isNaN(fechaInicio) || isNaN(fechaDestino)) {
            alert("Verifique que las fechas sean válidas.");
            return;
        }

        const resultados = [];
        let procesados = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');
            const id = cells[0].textContent.trim();
            console.log(`Procesando fila #${i + 1}, ID: ${id}`);

            const coords = await convertirCoordenadas(tipoCoordenada, cells);
            const { lat, lon } = coords;
            console.log(`Coordenadas convertidas para ID ${id}: lat=${lat}, lon=${lon}`);

            if (isNaN(lat) || isNaN(lon)) {
                console.error(`Coordenadas inválidas en la fila ${i + 1}, ID:${id}`);
                procesados++;
                if (procesados === rows.length) {
                    console.log("Todos los puntos procesados. Generando archivo CSV...");
                    generarArchivoCSV(resultados, fechaDestino);
                }
                continue;
            }

            try {
                console.log(`Llamando a realizarCambioDeEpocaPorModelos para ID ${id}`);
                const resultadoFinal = await realizarCambioDeEpocaPorModelos(fechaInicio, fechaDestino, lat, lon);
                console.log(`Resultado para ID ${id}:`, resultadoFinal);

                if (resultadoFinal) {
                    resultados.push({
                        id,
                        lat,
                        lon,
                        finalX: resultadoFinal.coordX.toFixed(4),
                        finalY: resultadoFinal.coordY.toFixed(4),
                        finalZ: resultadoFinal.coordZ.toFixed(4),
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
                    generarArchivoCSV(resultados, fechaDestino);
                }
            }
        }
    }

    function limpiarTabla() {
        console.log("Limpiando tabla y reseteando formulario...");
        document.querySelector('#tabla-datos thead').innerHTML = '';
        document.querySelector('#tabla-datos tbody').innerHTML = '';
        document.getElementById('cargar-archivo').value = '';
        document.getElementById('tipo-coordenada').value = '';
        document.getElementById('fecha-inicio').value = '';
        document.getElementById('fecha-destino').value = '';
    }

    function generarArchivoCSV(resultados, fechaDestino) {
        console.log("Generando archivo CSV con resultados:", resultados);
        const encabezado = 'ID,Latitud,Longitud,FinalX,FinalY,FinalZ,FechaDestino';
        const lineas = resultados.map(r => `${r.id},${r.lat},${r.lon},${r.finalX},${r.finalY},${r.finalZ},${fechaDestino.toLocaleDateString()}`);
        const contenidoCSV = encabezado + '\n' + lineas.join('\n');

        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'resultados_cambio_epoca.csv';
        link.click();
        console.log("CSV descargado con éxito.");
    }

    // ======================================
    // LÓGICA DE CAMBIO DE ÉPOCA (ADAPTADA) CON LOGS
    // ======================================

    const a = 6378137.0;
    const f = 1 / 298.257223563;

    const modelosVelocidad = [
        { nombre: "VEMOS 2022", inicio: new Date("2017-02-01"), fin: null, archivo: "grids/Velogrid2022.txt" },
        { nombre: "VEMOS 2017", inicio: new Date("2014-01-01"), fin: new Date("2017-01-28"), archivo: "grids/Velogrid2017.txt" },
        { nombre: "VEMOS 2015", inicio: new Date("2010-03-14"), fin: new Date("2015-04-11"), archivo: "grids/Velogrid2015.txt" },
        { nombre: "VEMOS 2009", inicio: new Date("2000-01-02"), fin: new Date("2009-06-30"), archivo: "grids/Velogrid2010.txt" },
        { nombre: "VEMOS 2003", inicio: null, fin: new Date("1999-12-31"), archivo: "grids/Velogrid2003.txt" }
    ];

    function elipsoidalToCartesian(lat, lon, h = 0) {
        const e2 = 2 * f - f ** 2;
        const phi = (Math.PI / 180) * lat;
        const lambda = (Math.PI / 180) * lon;
        const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
        const X = (N + h) * Math.cos(phi) * Math.cos(lambda);
        const Y = (N + h) * Math.cos(phi) * Math.sin(lambda);
        const Z = ((1 - e2) * N + h) * Math.sin(phi);
        return { X, Y, Z };
    }

    function idwInterpolate(matrix, index) {
        let numerator = 0;
        let denominator = 0;
        for (const row of matrix) {
            const distance = row[2];
            if (distance === 0) return row[index];
            const weight = 1 / distance;
            numerator += row[index] * weight;
            denominator += weight;
        }
        return numerator / denominator;
    }

    async function calculateVelocitiesNSWE(lat, lon, archivo) {
        console.log(`calculateVelocitiesNSWE() - Cargando archivo: ${archivo}, Lat: ${lat}, Lon: ${lon}`);
        const response = await fetch(archivo);
        if (!response.ok) {
            console.error("No se pudo cargar el archivo de grilla:", archivo);
            throw new Error("No se pudo cargar el archivo de grilla.");
        }
        const textData = await response.text();
        const lines = textData.trim().split('\n');
        console.log(`Archivo ${archivo} cargado con ${lines.length} líneas.`);

        const position = elipsoidalToCartesian(lat, lon, 0);
        const matrix = [];
        lines.forEach((line, idx) => {
            const [fileLat, fileLon, velocityNS, velocityWE] = line.split(';').map(parseFloat);
            if (isNaN(fileLat) || isNaN(fileLon) || isNaN(velocityNS) || isNaN(velocityWE)) {
                console.warn(`Línea ${idx + 1} del archivo ${archivo}: datos inválidos`, line);
                return;
            }
            const gridCoords = elipsoidalToCartesian(fileLat, fileLon, 0);
            const distance = Math.sqrt((gridCoords.X - position.X) ** 2 + (gridCoords.Y - position.Y) ** 2);
            matrix.push([velocityNS, velocityWE, distance]);
        });

        console.log("Matriz creada para IDW:", matrix.length, "puntos.");
        const velocityNS = idwInterpolate(matrix, 0);
        const velocityWE = idwInterpolate(matrix, 1);
        console.log(`Velocidades IDW obtenidas: NS=${velocityNS.toFixed(4)}, WE=${velocityWE.toFixed(4)}`);
        return { velocityNS, velocityWE };
    }

    function convertVelocitiesToXYZ(velNS, velWE, lat, lon) {
        console.log(`convertVelocitiesToXYZ() - velNS:${velNS}, velWE:${velWE}, lat:${lat}, lon:${lon}`);
        const phi = (Math.PI / 180) * lat;
        const lambda = (Math.PI / 180) * lon;
        const velX = -velNS * Math.sin(phi) * Math.cos(lambda) - velWE * Math.sin(lambda);
        const velY = -velNS * Math.sin(phi) * Math.sin(lambda) + velWE * Math.cos(lambda);
        const velZ = velNS * Math.cos(phi);
        console.log(`Velocidades en XYZ: X:${velX.toFixed(6)}, Y:${velY.toFixed(6)}, Z:${velZ.toFixed(6)}`);
        return { velX, velY, velZ };
    }

    function obtenerModelosAplicables(fechaInicio, fechaDestino) {
        console.log("obtenerModelosAplicables() - Fecha inicio:", fechaInicio, "Fecha destino:", fechaDestino);
        const goingBackwards = fechaInicio > fechaDestino;
        const minDate = new Date(-8640000000000000);
        const maxDate = new Date(8640000000000000);

        const fechaInicioReal = goingBackwards ? fechaInicio : fechaDestino;
        const fechaDestinoReal = goingBackwards ? fechaDestino : fechaInicio;

        const modelosAplicables = modelosVelocidad.filter(modelo => {
            const start = modelo.inicio || minDate;
            const end = modelo.fin || maxDate;
            return start <= fechaInicioReal && end >= fechaDestinoReal;
        });

        modelosAplicables.sort((a, b) => {
            const startA = a.inicio || minDate;
            const startB = b.inicio || minDate;
            if (goingBackwards) {
                return startB - startA;
            } else {
                return startA - startB;
            }
        });

        console.log("Modelos aplicables encontrados:", modelosAplicables.map(m => m.nombre));
        return modelosAplicables;
    }

    function calcularCambioDeEpoca(x, y, z, velX, velY, velZ, deltaTiempo) {
        console.log(`calcularCambioDeEpoca() - x:${x}, y:${y}, z:${z}, velX:${velX}, velY:${velY}, velZ:${velZ}, deltaTiempo:${deltaTiempo}`);
        const nuevaX = x + (deltaTiempo * velX);
        const nuevaY = y + (deltaTiempo * velY);
        const nuevaZ = z + (deltaTiempo * velZ);
        console.log(`Nuevas coordenadas: X:${nuevaX.toFixed(4)}, Y:${nuevaY.toFixed(4)}, Z:${nuevaZ.toFixed(4)}`);
        return { nuevaX, nuevaY, nuevaZ };
    }

    async function realizarCambioDeEpocaPorModelos(fechaInicio, fechaDestino, lat, lon) {
        console.log("realizarCambioDeEpocaPorModelos() - Inicio:", fechaInicio, "Destino:", fechaDestino, "lat:", lat, "lon:", lon);
        const { X: xInicial, Y: yInicial, Z: zInicial } = elipsoidalToCartesian(lat, lon, 0);
        let coordX = xInicial, coordY = yInicial, coordZ = zInicial;
        console.log(`Posición inicial: X=${coordX.toFixed(4)}, Y=${coordY.toFixed(4)}, Z=${coordZ.toFixed(4)}`);

        const modelos = obtenerModelosAplicables(fechaInicio, fechaDestino);
        if (modelos.length === 0) {
            console.warn("No se encontraron modelos de velocidad aplicables.");
            return null;
        }

        const goingBackwards = fechaInicio > fechaDestino;
        let fechaActual = new Date(fechaInicio.getTime());
        const minDate = new Date(-8640000000000000);
        const maxDate = new Date(8640000000000000);

        const startTotal = goingBackwards ? fechaDestino : fechaInicio;
        const endTotal = goingBackwards ? fechaInicio : fechaDestino;

        for (const modelo of modelos) {
            console.log(`Procesando modelo: ${modelo.nombre}`);
            const modeloInicio = modelo.inicio || minDate;
            const modeloFin = modelo.fin || maxDate;

            const intersectStart = (modeloInicio > startTotal) ? modeloInicio : startTotal;
            const intersectEnd = (modeloFin < endTotal) ? modeloFin : endTotal;
            console.log(`Intersección de tiempo con el modelo ${modelo.nombre}: inicio=${intersectStart.toLocaleDateString()}, fin=${intersectEnd.toLocaleDateString()}`);

            if (intersectStart > intersectEnd) {
                console.log("Sin intersección real con este modelo.");
                continue;
            }

            if (goingBackwards) {
                let fechaCorte = intersectStart;
                if (fechaCorte < fechaDestino) fechaCorte = fechaDestino;
                if (fechaCorte < intersectStart) fechaCorte = intersectStart;

                if (fechaCorte < fechaActual) {
                    const deltaTiempoMs = fechaCorte - fechaActual;
                    const deltaTiempo = deltaTiempoMs / (1000 * 60 * 60 * 24 * 365.25);
                    console.log(`Hacia atrás - fechaActual:${fechaActual.toLocaleDateString()}, fechaCorte:${fechaCorte.toLocaleDateString()}, deltaTiempo:${deltaTiempo.toFixed(4)}`);

                    const velocities = await calculateVelocitiesNSWE(lat, lon, modelo.archivo);
                    const { velX, velY, velZ } = convertVelocitiesToXYZ(velocities.velocityNS, velocities.velocityWE, lat, lon);
                    const nuevaPosicion = calcularCambioDeEpoca(coordX, coordY, coordZ, velX, velY, velZ, deltaTiempo);
                    coordX = nuevaPosicion.nuevaX;
                    coordY = nuevaPosicion.nuevaY;
                    coordZ = nuevaPosicion.nuevaZ;

                    fechaActual = new Date(fechaCorte.getTime());
                    if (fechaActual <= fechaDestino) {
                        console.log("Se alcanzó la fecha destino.");
                        break;
                    }
                } else {
                    console.log("No hay rango hacia atrás para este modelo.");
                }
            } else {
                let fechaCorte = intersectEnd;
                if (fechaCorte > fechaDestino) fechaCorte = fechaDestino;

                if (fechaCorte > fechaActual) {
                    const deltaTiempoMs = fechaCorte - fechaActual;
                    const deltaTiempo = deltaTiempoMs / (1000 * 60 * 60 * 24 * 365.25);
                    console.log(`Hacia adelante - fechaActual:${fechaActual.toLocaleDateString()}, fechaCorte:${fechaCorte.toLocaleDateString()}, deltaTiempo:${deltaTiempo.toFixed(4)}`);

                    const velocities = await calculateVelocitiesNSWE(lat, lon, modelo.archivo);
                    const { velX, velY, velZ } = convertVelocitiesToXYZ(velocities.velocityNS, velocities.velocityWE, lat, lon);
                    const nuevaPosicion = calcularCambioDeEpoca(coordX, coordY, coordZ, velX, velY, velZ, deltaTiempo);
                    coordX = nuevaPosicion.nuevaX;
                    coordY = nuevaPosicion.nuevaY;
                    coordZ = nuevaPosicion.nuevaZ;

                    fechaActual = new Date(fechaCorte.getTime());
                    if (fechaActual >= fechaDestino) {
                        console.log("Se alcanzó la fecha destino.");
                        break;
                    }
                } else {
                    console.log("No hay rango hacia adelante para este modelo.");
                }
            }
        }

        console.log(`Posición final: X=${coordX.toFixed(4)}, Y=${coordY.toFixed(4)}, Z=${coordZ.toFixed(4)}`);
        return { coordX, coordY, coordZ };
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
                var huso_pre = cells[3].textContent.trim();
                var huso = huso_pre.substring(0, 2); 
                var hemisferio = huso_pre.charAt(huso_pre.length - 1);

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

    function geocentricToEllipsoidal(x, y, z) {
        console.log("geocentricToEllipsoidal() - X:", x, "Y:", y, "Z:", z);
        const e2 = 2 * f - f ** 2;
        const p = Math.sqrt(x * x + y * y);
        const theta = Math.atan2(z * a, p * (1 - f));
        const lon = Math.atan2(y, x);
        const lat = Math.atan2(z + e2 * (1 - f) * Math.sin(theta) ** 3, p - e2 * a * Math.cos(theta) ** 3);
        const N = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
        const h = p / Math.cos(lat) - N;

        const latDeg = lat * (180 / Math.PI);
        const lonDeg = lon * (180 / Math.PI);
        console.log(`Convertido a elipsoidales: Lat:${latDeg.toFixed(6)}, Lon:${lonDeg.toFixed(6)}, h:${h.toFixed(3)}`);
        return {
            latitude: latDeg,
            longitude: lonDeg,
            height: h
        };
    }

});
