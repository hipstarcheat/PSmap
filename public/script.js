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


// Загружаем районы СПб
fetch('spb_districts.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: (feature) => ({
        color: getRandomColor(), // случайный цвет для наглядности
        weight: 2,
        fillOpacity: 0.3
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(feature.properties.name);
      }
    }).addTo(map);
  });

// Функция для случайного цвета
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}






