const map = L.map('map').setView([59.93, 30.33], 11); // Центр СПб

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


// Обработчик клика
map.on('click', async function(e) {
    const { lat, lng } = e.latlng;

    // Запрос на сервер для расчета
    const res = await fetch(`/api/calc?lat=${lat}&lng=${lng}`);
    const data = await res.json();

    // Показываем результат
    L.popup()
        .setLatLng([lat, lng])
        .setContent(`Расчёт: ${data.result}`)
        .openOn(map);
});

// Загружаем зоны и рисуем полигоны
fetch('/api/zones')
    .then(res => res.json())
    .then(zones => {
        zones.forEach(zone => {
            const polygon = L.polygon(zone.coords, {
                color: 'red',         // цвет линии
                weight: 2,            // толщина линии
                fillColor: 'red',     // цвет заливки
                fillOpacity: 0.3      // прозрачность заливки
            }).addTo(map);

            polygon.bindPopup(`${zone.name} (значение: ${zone.value})`);
        });
    });

import { calculateCosts } from './zones.js';
import { districts } from './public/data/districts.js';

Object.keys(districts).forEach(districtName => {
  fetch(districts[districtName].geojson)
    .then(response => response.json())
    .then(geojson => {
      L.geoJSON(geojson, {
        style: { color: 'red', weight: 2, fillOpacity: 0.3 },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <b>${districtName}</b><br>
            Стоимость открытия: ${districts[districtName].openingCost}<br>
            Содержание: ${districts[districtName].maintenanceCost}
          `);

          // Обработчик клика
          layer.on('click', () => {
            const costs = calculateCosts(districtName);

            // Обновляем HTML элемент
            const costsDiv = document.getElementById('costs');
            costsDiv.innerHTML = `
              <b>${districtName}</b><br>
              Стоимость открытия: ${costs.totalOpening} ₽<br>
              Ежемесячное содержание: ${costs.totalMonthly} ₽
            `;
          });
        }
      }).addTo(map);
    });
});


