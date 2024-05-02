
const fs = require('fs');

function readFile20202014() {
    const nomenclatura = [];
    const xTransformed = [];
    const yTransformed = [];
    const zTransformed = [];
    const xItrf = [];
    const yItrf = [];
    const zItrf = [];
    let t1, t2, t3;

    const epochOrig = parseFloat(entryEpochOrig);
    const epochItrf2014 = parseFloat(entryEpochOrig);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        const lines = data.split('\n');
        lines.forEach(line => {
            const parts = line.split(';');
            const timeInterval = epochItrf2014 - epochOrig;
            nomenclatura.push(parts[0]);
            const xOrig = parseFloat(parts[1].replace(',', '.'));
            const yOrig = parseFloat(parts[2].replace(',', '.'));
            const zOrig = parseFloat(parts[3].replace(',', '.'));
            const velX = parseFloat(parts[4].replace(',', '.'));
            const velY = parseFloat(parts[5].replace(',', '.'));
            const velZ = parseFloat(parts[6].replace(',', '.'));
            // Add other elements to corresponding arrays

            const a = 4.2e-10;
            const b = 4.2e-10;
            const c = 4.2e-10;
            const d = xOrig;
            const e = a * d;
            const f = b * d;
            const g = c * d;
            t1 = e;
            t2 = f;
            t3 = g;
            const p1 = 0.0014;
            const p2 = 0.0014;
            const p3 = -0.0024;
            const z1 = p1 + t1;
            const z2 = p2 + t2;
            const z3 = p3 + t3;
            xTransformed.push(xOrig + z1);
            yTransformed.push(yOrig + z2);
            zTransformed.push(zOrig + z3);
            xItrf.push(xOrig + z1 + (velX * 6));
            yItrf.push(yOrig + z2 + (velY * 6));
            zItrf.push(zOrig + z3 + (velZ * 6));
            // Print t1, t2, t3
            console.log(`t1: ${t1}, t2: ${t2}, t3: ${t3}`);
        });
    });
}
