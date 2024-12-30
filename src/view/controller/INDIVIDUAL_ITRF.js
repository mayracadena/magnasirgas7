document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    const processBtn = document.getElementById('processBtn');
    
    if (processBtn) {
        processBtn.addEventListener('click', processCoordinates, false);
    } else {
        console.error('processBtn element not found');
    }
});

function processCoordinates() {
    console.log('Processing coordinates');

    const coordX = parseFloat(document.getElementById('coordX').value);
    const coordY = parseFloat(document.getElementById('coordY').value);
    const coordZ = parseFloat(document.getElementById('coordZ').value);

    if (isNaN(coordX) || isNaN(coordY) || isNaN(coordZ)) {
        alert('Por favor, ingrese coordenadas válidas.');
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

    const [newX, newY, newZ] = transformationFunc(coordX, coordY, coordZ);

    // Mostrar los resultados transformados en los campos correspondientes
    document.getElementById('coordX_T').value = newX.toFixed(4);
    document.getElementById('coordY_T').value = newY.toFixed(4);
    document.getElementById('coordZ_T').value = newZ.toFixed(4);
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
        'ITRF2020:ITRF2014': itrf2020_to_itrf2014,
    };

    const key = `${itrfStart}:${itrfEnd}`;
    return transformations[key] || null;
}

// Asegúrate de incluir tus funciones de transformación como itrf1990_to_itrf2014, itrf1991_to_itrf2014, etc.

// Functions for transformations (e.g., itrf1990_to_itrf2014) should be included below
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

function itrf2020_to_itrf2014(x, y, z) {
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
    const p1 = -0.0014;
    const p2 = -0.0014;
    const p3 = 0.0024;
    const z1 = p1 + t1;
    const z2 = p2 + t2;
    const z3 = p3 + t3;
    return [x + z1, y + z2, z + z3];
}