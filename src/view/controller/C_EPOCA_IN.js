// Ruta: magnasirgas7\src\view\controller\C_EPOCA_IND.js

document.addEventListener('DOMContentLoaded', function () {
    const calculateButton = document.getElementById('calcular');
    const clearButton = document.getElementById('limpiar');
    const latitudGrados = document.getElementById('latitud-grados');
    const latitudMinutos = document.getElementById('latitud-minutos');
    const latitudSegundos = document.getElementById('latitud-segundos');
    const latitudHemisferio = document.getElementById('latitud-hemisferio');
    const longitudGrados = document.getElementById('longitud-grados');
    const longitudMinutos = document.getElementById('longitud-minutos');
    const longitudSegundos = document.getElementById('longitud-segundos');
    const longitudHemisferio = document.getElementById('longitud-hemisferio');
    const latitudDecimal = document.getElementById('latitud-decimal');
    const longitudDecimal = document.getElementById('longitud-decimal');
    const fechaInicioInput = document.getElementById('fechaRastreoPartida');
    const fechaDestinoInput = document.getElementById('fechaReferenciaPartida');

    // Modelos de velocidad y sus periodos de vigencia
    const modelosVelocidad = [
        { nombre: "VEMOS 2022", inicio: new Date("2017-02-01"), fin: null },
        { nombre: "VEMOS 2017", inicio: new Date("2014-01-01"), fin: new Date("2017-01-28") },
        { nombre: "VEMOS 2015", inicio: new Date("2010-03-14"), fin: new Date("2015-04-11") },
        { nombre: "VEMOS 2009", inicio: new Date("2000-01-02"), fin: new Date("2009-06-30") },
        { nombre: "VEMOS 2003", inicio: null, fin: new Date("1999-12-31") }
    ];

    // Función para calcular el cambio de época
    async function realizarCambioEpoca(fechaInicio, fechaDestino, x, y, z) {
        let fechaActual = fechaInicio;
        let coordX = x, coordY = y, coordZ = z;
        const modelosUtilizados = [];

        while (fechaActual > fechaDestino) {
            const modelo = obtenerModeloVelocidad(fechaActual, fechaDestino);
            if (!modelo) {
                console.error("No se encontró un modelo de velocidad válido.");
                return null;
            }

            const fechaCorte = modelo.inicio || fechaDestino;
            const deltaTiempo = (fechaActual - fechaCorte) / (1000 * 60 * 60 * 24 * 365.25);
            const velocities = await velocidades(coordX, coordY, coordZ);

            if (!velocities) {
                console.error(`Error al obtener las velocidades para el modelo ${modelo.nombre}`);
                return null;
            }

            const nuevaPosicion = calcularCambioDeEpoca(
                coordX, coordY, coordZ,
                velocities.velocityX, velocities.velocityY, velocities.velocityZ,
                deltaTiempo
            );

            coordX = nuevaPosicion.nuevaX;
            coordY = nuevaPosicion.nuevaY;
            coordZ = nuevaPosicion.nuevaZ;
            modelosUtilizados.push(`${modelo.nombre} (de ${fechaCorte.toLocaleDateString()} a ${fechaActual.toLocaleDateString()})`);
            fechaActual = fechaCorte;
        }

        mostrarModelosUtilizados(modelosUtilizados);
        return { coordX, coordY, coordZ };
    }

    // Obtener el modelo de velocidad según las fechas
    function obtenerModeloVelocidad(fechaInicio, fechaDestino) {
        return modelosVelocidad.find(modelo => {
            const inicioValido = modelo.inicio ? fechaInicio >= modelo.inicio : true;
            const finValido = modelo.fin ? fechaDestino <= modelo.fin : true;
            return inicioValido && finValido;
        });
    }

    // Función para calcular el día del año
    function calcularDiaDelAno(fecha) {
        const inicioAño = new Date(fecha.getFullYear(), 0, 0);
        const tiempoTranscurrido = fecha - inicioAño;
        const milisegundosEnUnDía = 24 * 60 * 60 * 1000;
        return Math.floor(tiempoTranscurrido / milisegundosEnUnDía);
    }

 // Función para mostrar los modelos utilizados y los rangos de fechas en un modal
function mostrarModelosUtilizados(modelos) {
    // Crear el diálogo modal
    const dialogo = document.createElement('div');
    dialogo.classList.add('modal');
    
    // Construir el contenido del modal incluyendo los detalles de las fechas y modelos utilizados
    dialogo.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modelos de Velocidad Utilizados</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Se utilizaron los siguientes modelos de velocidad con sus respectivos rangos de fechas:</p>
                    <ul>
                        ${modelos.map(modelo => `
                            <li>
                                <strong>Modelo:</strong> ${modelo.nombre} <br>
                                <strong>Rango de fechas aplicado:</strong> 
                                ${modelo.fechaInicio ? modelo.fechaInicio.toLocaleDateString() : "Inicio"} - 
                                ${modelo.fechaFin ? modelo.fechaFin.toLocaleDateString() : "Final"}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    // Agregar el diálogo modal al documento y mostrarlo
    document.body.appendChild(dialogo);
    new bootstrap.Modal(dialogo).show();
}


    // Evento de cálculo del cambio de época
    calculateButton.addEventListener('click', async function (event) {
        event.preventDefault();

        const fechaInicio = new Date(fechaInicioInput.value);
        const fechaDestino = new Date(fechaDestinoInput.value);

        if (fechaInicio <= fechaDestino) {
            alert("La fecha de inicio debe ser posterior a la fecha de destino.");
            return;
        }

        const coordinateType = getActiveCoordinateType();
        if (!coordinateType) {
            alert("Error: No se pudo determinar el tipo de coordenada activa.");
            return;
        }

        let x, y, z;
        if (coordinateType === 'geocentric') {
            x = parseFloat(document.getElementById('x').value);
            y = parseFloat(document.getElementById('y').value);
            z = parseFloat(document.getElementById('z').value);
        } else {
            const latitud = parseFloat(latitudDecimal.value) || parseSexagesimal(
                parseInt(latitudGrados.value),
                parseInt(latitudMinutos.value),
                parseFloat(latitudSegundos.value),
                latitudHemisferio.value
            );
            const longitud = parseFloat(longitudDecimal.value) || parseSexagesimal(
                parseInt(longitudGrados.value),
                parseInt(longitudMinutos.value),
                parseFloat(longitudSegundos.value),
                longitudHemisferio.value
            );
            const geocentricCoords = cartesian3DConversion(new EllipsoidalCoordinate(latitud, longitud));
            x = geocentricCoords.X;
            y = geocentricCoords.Y;
            z = geocentricCoords.Z;
        }

        const resultado = await realizarCambioEpoca(fechaInicio, fechaDestino, x, y, z);
        if (resultado) {
            alert(`Posición final en la época ${fechaDestino.toLocaleDateString()}:\nX: ${resultado.coordX.toFixed(4)}\nY: ${resultado.coordY.toFixed(4)}\nZ: ${resultado.coordZ.toFixed(4)}`);
        }
    });

    // Función para calcular la nueva posición geocéntrica después del cambio de época
    function calcularCambioDeEpoca(x, y, z, velocidadX, velocidadY, velocidadZ, deltaTiempo) {
        return {
            nuevaX: x + (deltaTiempo * velocidadX),
            nuevaY: y + (deltaTiempo * velocidadY),
            nuevaZ: z + (deltaTiempo * velocidadZ)
        };
    }

    // Función para convertir coordenadas sexagesimales a decimales
    function parseSexagesimal(grados, minutos, segundos, hemisferio) {
        let decimal = Math.abs(grados) + minutos / 60 + segundos / 3600;
        return hemisferio === 'S' || hemisferio === 'W' ? -decimal : decimal;
    }

    // Determina el tipo de coordenada activa en la interfaz
    function getActiveCoordinateType() {
        if (latitudGrados.value && longitudGrados.value) return 'sexagesimal';
        if (latitudDecimal.value && longitudDecimal.value) return 'decimal';
        if (document.getElementById('x').value) return 'geocentric';
        return null;
    }

    // Función para convertir coordenadas elipsoidales a geocéntricas
    function cartesian3DConversion(coordinate) {
        const phi = coordinate.latitude * (Math.PI / 180);
        const lambda = coordinate.longitude * (Math.PI / 180);
        const h = coordinate.ellipsoidalHeight || 0.0;
        const a = 6378137.0;
        const f = 1 / 298.257223563;
        const e2 = 2 * f - f ** 2;
        const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
        return {
            X: (N + h) * Math.cos(phi) * Math.cos(lambda),
            Y: (N + h) * Math.cos(phi) * Math.sin(lambda),
            Z: ((1 - e2) * N + h) * Math.sin(phi)
        };
    }
});


