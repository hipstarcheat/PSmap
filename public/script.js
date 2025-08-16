// Координаты центра Санкт-Петербурга
const spbCenter = [59.93, 30.33];

// Создаем карту с центром на СПб, но масштаб достаточен, чтобы видеть всю Россию
const map = L.map('map', {
  minZoom: 3,   // минимальный масштаб для всей России
  maxZoom: 18
}).setView(spbCenter, 5);

// Тайлы OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Тестовый полигон в СПб (можно потом удалить)
L.polygon([
  [59.95, 30.30],
  [59.95, 30.35],
  [59.90, 30.35],
  [59.90, 30.30]
], { color: 'red', fillOpacity: 0.3 }).addTo(map);

map.on('click', async function(e) {
  const { lat, lng } = e.latlng;

  // Сначала тестовый вывод координат
  const popup = L.popup()
    .setLatLng([lat, lng])
    .setContent(`Клик по точке: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    .openOn(map);

  // Потом запрос на сервер
  try {
    const res = await fetch(`/api/calc?lat=${lat}&lng=${lng}`);
    const data = await res.json();

    // Обновляем содержимое popup с результатом
    popup.setContent(`Расчёт: ${data.result}`);
  } catch (err) {
    console.error(err);
    popup.setContent(`Ошибка при расчёте`);
  }
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





