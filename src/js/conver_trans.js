

// delete L.Icon.Default.prototype._getIconUrl;

// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'images/marker-icon-2x.png',
//     iconUrl: 'images/marker-icon.png',
//     shadowUrl: 'images/marker-shadow.png',
// });

const epsg9377 = new L.Proj.CRS('EPSG:9377',
    '+proj=tmerc +lat_0=4.0 +lon_0=-73.0 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    {
        resolutions: [
            8192, 4096, 2048, 1024, 512, 256, 128
        ],
        origin: [5000000, 2000000] 
    });

    const map = L.map('map').setView([4, -73], 5); 

   
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);





