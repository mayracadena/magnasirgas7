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

    // Obtener la ondulación geoidal desde el archivo JSON
    fetch('grids/ondulacion.json')
        .then(response => response.json())
        .then(data => {
            try {
                let undulation = findWeightedAverageUndulation(data, lat, lon);
                if (undulation !== null) {
                    document.getElementById('ondulacion-geoidal').value = undulation.toFixed(3);
                } else {
                    document.getElementById('ondulacion-geoidal').value = 'Ondulación no encontrada.';
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('ondulacion-geoidal').value = 'Error al calcular la ondulación.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('ondulacion-geoidal').value = 'Error al cargar los datos geoidales.';
        });
});

function findWeightedAverageUndulation(geoidData, lat, lon) {
    const nearestPoints = [];
    const maxDistance = 0.1; // Máxima distancia para considerar puntos cercanos en grados (~11 km)

    for (let point of geoidData) {
        let distance = Math.sqrt(Math.pow(lat - point.lat, 2) + Math.pow(lon - point.lon, 2));
        if (distance <= maxDistance) {
            nearestPoints.push({ point, distance });
        }
    }

    if (nearestPoints.length === 0) {
        return null;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (let { point, distance } of nearestPoints) {
        let weight = 1 / distance; // Peso inversamente proporcional a la distancia
        weightedSum += weight * point.alt;
        totalWeight += weight;
    }

    return weightedSum / totalWeight;
}

// Inicializar campos
toggleCoordinateInput(document.getElementById('coordenadas-decimales').checked);
