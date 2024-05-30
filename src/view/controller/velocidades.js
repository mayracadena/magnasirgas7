const fs = require('fs');
const path = require('path');
const { dialog } = require('electron').remote;

document.getElementById('calculateButton').addEventListener('click', () => {
    const fileInput = document.getElementById('coordinateFile');
    const vemosSelect = document.getElementById('vemosSelect');
    const outputDiv = document.getElementById('output');
    const alertContainer = document.getElementById('alert-container');

    clearAlert();

    if (fileInput.files.length === 0) {
        showAlert('Por favor, selecciona un archivo de coordenadas.', 'danger');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const content = event.target.result;
        const lines = content.split('\n').map(line => line.split(','));

        // Cargar el archivo de grillas de velocidad correspondiente
        loadVelogrid(vemosSelect.value).then(velogrid => {
            // Realiza el cálculo de las velocidades aquí
            const velocities = calculateVelocities(lines, velogrid);

            // Muestra el resultado en la interfaz
            outputDiv.innerHTML = `<pre>${JSON.stringify(velocities, null, 2)}</pre>`;
            showAlert('Cálculo completado con éxito.', 'success');
        }).catch(err => {
            console.error('Error cargando el archivo de grillas de velocidad:', err);
            showAlert('Error cargando el archivo de grillas de velocidad.', 'danger');
        });
    };

    reader.readAsText(file);
});

function loadVelogrid(vemos) {
    return new Promise((resolve, reject) => {
        let filename;
        switch (vemos) {
            case "VEMOS 2009":
                filename = 'Velogrid2010.txt';
                break;
            case "VEMOS 2015":
                filename = 'Velogrid2015.txt';
                break;
            case "VEMOS 2017":
                filename = 'Velogrid2017.txt';
                break;
            default:
                return reject('Modelo VEMOS no válido');
        }

        fs.readFile(path.join(__dirname, filename), 'utf8', (err, data) => {
            if (err) return reject(err);
            const velogrid = data.split('\n').map(line => {
                const [lat, lon, vx, vy, vz] = line.split(',').map(Number);
                return { lat, lon, vx, vy, vz };
            });
            resolve(velogrid);
        });
    });
}

function calculateVelocities(lines, velogrid) {
    const velocities = [];

    lines.forEach((line, index) => {
        if (index === 0) return; // Saltar la cabecera
        const [id, x, y, z] = line.map(Number);

        // Encuentra la grilla de velocidad más cercana
        const nearestVelogrid = findNearestVelogrid(x, y, velogrid);

        const velocity = {
            id: id,
            vx: x * nearestVelogrid.vx,
            vy: y * nearestVelogrid.vy
