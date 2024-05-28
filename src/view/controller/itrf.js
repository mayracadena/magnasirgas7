document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    const fileInput = document.getElementById('fileInput');
    const viewDataBtn = document.getElementById('viewDataBtn');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect, false);
    } else {
        console.error('fileInput element not found');
    }

    if (viewDataBtn) {
        viewDataBtn.addEventListener('click', showModal, false);
    } else {
        console.error('viewDataBtn element not found');
    }

    if (processBtn) {
        processBtn.addEventListener('click', processFile, false);
    } else {
        console.error('processBtn element not found');
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCSV, false);
    } else {
        console.error('downloadBtn element not found');
    }
});

let transformedData = [];

function handleFileSelect(event) {
    console.log('File selected');
    const file = event.target.files[0];
    const statusIndicator = document.getElementById('statusIndicator');
    const viewDataBtn = document.getElementById('viewDataBtn');

    if (!file) {
        statusIndicator.style.backgroundColor = 'red';
        viewDataBtn.disabled = true;
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        console.log("File contents:", contents);
        const data = parseCSV(contents);
        console.log("Parsed data:", data);
        displayData(data);
        statusIndicator.style.backgroundColor = 'green';
        viewDataBtn.disabled = false;
    };
    reader.readAsText(file);
}

function parseCSV(csv) {
    console.log('Parsing CSV');
    const lines = csv.split('\n');
    const rows = lines.map(line => line.split(';'));
    return rows;
}

function displayData(rows) {
    console.log('Displaying data');
    const headers = ['ID', 'Coordenada Eje X', 'Coordenada Eje Y', 'Coordenada Eje Z'];

    // Populate table headers
    const tableHead = document.getElementById('tableHead');
    tableHead.innerHTML = '';
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        tableHead.appendChild(th);
    });

    // Populate table rows
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

function showModal() {
    console.log('Showing modal');
    const dataModal = new bootstrap.Modal(document.getElementById('dataModal'));
    dataModal.show();
}

function processFile() {
    console.log('Processing file');
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) {
        alert('Por favor, cargue un archivo primero.');
        return;
    }

    const itrfStart = document.getElementById('itrfStart').value;
    const itrfEnd = document.getElementById('itrfEnd').value;
    console.log(`ITRF Start: ${itrfStart}, ITRF End: ${itrfEnd}`);
    if (!itrfStart || !itrfEnd) {
        alert('Por favor, seleccione ITRF de partida y de destino.');
        return;
    }

    const transformationFunc = getTransformationFunction(itrfStart, itrfEnd);
    if (!transformationFunc) {
        alert('No se encontró una función de transformación para el par seleccionado.');
        console.error(`No transformation function found for ITRF pair: ${itrfStart} to ${itrfEnd}`);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        const data = parseCSV(contents);
        console.log("Parsed data before transformation:", data);
        transformedData = transformCoordinates(data, transformationFunc);
        console.log("Transformed data:", transformedData);
        displayData(transformedData);
        showModal();

        // Habilitar el botón de descarga
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.disabled = false;
    };
    reader.readAsText(fileInput.files[0]);
}

function transformCoordinates(data, transformationFunc) {
    console.log('Transforming coordinates');
    return data.map((row, index) => {
        if (index === 0) return row; // Headers
        const [id, x, y, z] = row;

        // Verificar si las coordenadas son válidas
        if (!x || !y || !z) {
            console.warn(`Row ${index} is missing coordinates: ${row}`);
            return null; // Omitir esta fila
        }

        const [newX, newY, newZ] = transformationFunc(
            parseFloat(x.replace(',', '.')),
            parseFloat(y.replace(',', '.')),
            parseFloat(z.replace(',', '.'))
        );
        return [id, newX.toFixed(4), newY.toFixed(4), newZ.toFixed(4)];
    }).filter(row => row !== null); // Filtrar filas nulas
}

function getTransformationFunction(itrfStart, itrfEnd) {
    console.log(`Requested transformation from ${itrfStart} to ${itrfEnd}`);
    const transformations = {
        'ITRF1990:ITRF2014': itrf1990_to_itrf2014,
        'ITRF1991:ITRF2014': itrf1991_to_itrf2014,
        'ITRF1992:ITRF2014': itrf1992_to_itrf2014,
        'ITRF1993:ITRF2014': itrf1993_to_itrf2014,
        'ITRF1994:ITRF2014': itrf1994_to_itrf2014,
        'ITRF1996:ITRF2014': itrf1996_to_itrf2014,
        'ITRF1997:ITRF2014': itrf1997_to_itrf2014,
        'ITRF2000:ITRF2014': itrf2000_to_itrf2014,
        'ITRF2005:ITRF2014': itrf2005_to_itrf2014,
        'ITRF2008:ITRF2014': itrf2008_to_itrf2014,
        'ITRF2014:ITRF2020': itrf2014_to_itrf2020,
    };

    const key = `${itrfStart}:${itrfEnd}`;
    return transformations[key] || null;
}

function downloadCSV() {
    if (transformedData.length === 0) {
        alert('No hay datos transformados para descargar.');
        return;
    }

    const headers = ['ID', 'Coordenada Eje X', 'Coordenada Eje Y', 'Coordenada Eje Z'];
    const csvRows = [headers.join(',')];

    transformedData.forEach(row => {
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transformed_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// Ejemplos de funciones de transformación
function itrf1990_to_itrf2014(x, y, z) {
    // Transformación específica de ITRF1990 a ITRF2014
    const a = [-5.4e-09, 1.7e-09, 0];
    const b = [-1.7e-09, -5.4e-09, 0];
    const c = [0, 0, -5.4e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0259;
    const p2 = -0.009;
    const p3 = 0.1093;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf1991_to_itrf2014(x, y, z) {
    const a = [-5.1e-09, 1.7e-09, 0];
    const b = [-1.7e-09, -5.1e-09, 0];
    const c = [0, 0, -5.1e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0279;
    const p2 = -0.013;
    const p3 = 0.0933;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf1992_to_itrf2014(x, y, z) {
    const a = [-3.7e-09, 1.7e-09, 0];
    const b = [-1.7e-09, -3.7e-09, 0];
    const c = [0, 0, -3.7e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0159;
    const p2 = 0.001;
    const p3 = 0.0873;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf1993_to_itrf2014(x, y, z) {
    const a = [-4.9e-09, 3.6e-09, 0];
    const b = [-3.6e-09, -4.9e-09, 0];
    const c = [0, 0, -4.9e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = 0.0644;
    const p2 = -0.0028;
    const p3 = 0.0727;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf1994_to_itrf2014(x, y, z) {
    const a = [-4.4e-09, 1.7e-09, 0];
    const b = [-1.7e-09, -4.4e-09, 0];
    const c = [0, 0, -4.4e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0079;
    const p2 = 0.003;
    const p3 = 0.0793;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf1996_to_itrf2014(x, y, z) {
    const a = [-4.4e-09, 1.7e-09, 0];
    const b = [-1.7e-09, -4.4e-09, 0];
    const c = [0, 0, -4.4e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0079;
    const p2 = 0.003;
    const p3 = 0.0793;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf1997_to_itrf2014(x, y, z) {
    const a = [-4.4e-09, 1.7e-09, 0];
    const b = [-1.7e-09, -4.4e-09, 0];
    const c = [0, 0, -4.4e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0079;
    const p2 = 0.003;
    const p3 = 0.0793;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf2000_to_itrf2014(x, y, z) {
    const a = [-2.7e-09, 0, 0];
    const b = [0, -2.7e-09, 0];
    const c = [0, 0, -2.7e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0012;
    const p2 = -0.0017;
    const p3 = 0.0356;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf2005_to_itrf2014(x, y, z) {
    const a = [-1.1e-09, 0, 0];
    const b = [0, -1.1e-09, 0];
    const c = [0, 0, -1.1e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0041;
    const p2 = -0.001;
    const p3 = 0.0028;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf2008_to_itrf2014(x, y, z) {
    const a = [-1.3e-09, 0, 0];
    const b = [0, -1.3e-09, 0];
    const c = [0, 0, -1.3e-09];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = -0.0016;
    const p2 = -0.0019;
    const p3 = -0.0019;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}

function itrf2014_to_itrf2020(x, y, z) {
    const a = [4.2e-10, 0, 0];
    const b = [0, 4.2e-10, 0];
    const c = [0, 0, 4.2e-10];
    const d = [x, y, z];
    const e = a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
    const f = b[0] * d[0] + b[1] * d[1] + b[2] * d[2];
    const g = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    const t1 = e;
    const t2 = f;
    const t3 = g;
    const p1 = 0.0014;
    const p2 = 0.0014;
    const p3 = -0.0024;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}
