const express = require('express');
const path = require('path');
const turf = require('@turf/turf');
const zones = require('./zones'); // Подключаем наши зоны

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/api/calc', (req, res) => {
    const { lat, lng } = req.query;
    const point = turf.point([parseFloat(lng), parseFloat(lat)]);

    let zoneValue = 0;
    for (let zone of zones) {
        const polygon = turf.polygon([[...zone.coords.map(c => [c[1], c[0]]), [zone.coords[0][1], zone.coords[0][0]]]]);
        if (turf.booleanPointInPolygon(point, polygon)) {
            zoneValue = zone.value;
            break;
        }
    }

    res.json({ result: zoneValue });
});

app.listen(3000, () => {
    console.log('Сервер запущен: http://localhost:3000');
});

app.get('/api/zones', (req, res) => {
    res.json(zones);
});
