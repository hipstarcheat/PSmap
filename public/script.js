// Координаты центра Санкт-Петербурга
const spbCenter = [59.93, 30.33];
const messageDiv = document.getElementById('message');

let selectedLayer = null; // Для подсветки выбранного полигона

// Создаем карту с центром на СПб
const map = L.map('map', {
  minZoom: 4,
  maxZoom: 18
}).setView(spbCenter, 11);

// Тайлы OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Загружаем районы СПб
fetch('spb_districts.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: (feature) => ({
        color: '#c98200ff',       // цвет линии
        weight: 2,              // толщина линии
        fillColor: '#ffe884ff',   // цвет заливки
        fillOpacity: 0.3        // прозрачность заливки
      }),
      onEachFeature: (feature, layer) => {
        layer.on('click', (ev) => {
          ev.originalEvent.stopPropagation();

          const zoneName = feature.properties.name.trim();
          const zoneInfo = zonesData[zoneName];

          if (!zoneInfo) {
            messageDiv.innerHTML = `Данные для района "${zoneName}" не найдены`;
            return;
          }

          // Подсветка выбранного полигона
          if (selectedLayer) {
            selectedLayer.setStyle({
              color: '#ec9025ff',
              fillColor: '#ff3333ff'
            });
          }
          layer.setStyle({
            color: 'red',
            fillColor: 'red'
          });
          selectedLayer = layer;

          // Контент popup
          const popupContent = `
            <b>${zoneName}</b><br>
            Аренда: ${zoneInfo.rent} ₽/мес<br>
            Налоги и коммуналка: ${zoneInfo.taxes} ₽/мес<br>
            Проходка: ${zoneInfo.passability}<br>
            Пешеходный трафик: ${zoneInfo.pedestrianTraffic}<br>
            Автомобильный трафик: ${zoneInfo.carTraffic}<br>
            Конкурентов рядом: ${zoneInfo.nearbyStores}<br>
            Демография: ${zoneInfo.demographics}<br>
            Сезонность: ${zoneInfo.seasonality}<br>
            Развитие района: ${zoneInfo.development}<br>
            Новые ЖК и транспорт: ${zoneInfo.newInfrastructure}<br>
          `;

          layer.bindPopup(popupContent).openPopup();

          // Очистка сообщения
          messageDiv.innerHTML = '';
        });
      }
    }).addTo(map);
  })
  .catch(err => {
    console.error(err);
    messageDiv.innerHTML = 'Не удалось загрузить spb_districts.geojson';
  });

// При клике на карту вне полигона показываем координаты
map.on('click', function(e) {
  const latlng = e.latlng;
  messageDiv.innerHTML = `Клик по карте в точке: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;

  // Убираем подсветку предыдущего полигона
  if (selectedLayer) {
    selectedLayer.setStyle({
      color: '#3388ff',
      fillColor: '#3388ff'
    });
    selectedLayer = null;
  }
});
