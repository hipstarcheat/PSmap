// Координаты центра Санкт-Петербурга
const spbCenter = [59.93, 30.33];
const messageDiv = document.getElementById('message');

// Создаем карту с центром на СПб
const map = L.map('map', {
  minZoom: 4,
  maxZoom: 18
}).setView(spbCenter, 11);

// Тайлы OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Функция для случайного цвета
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Проверка, находится ли точка внутри многоугольника (с поддержкой MultiPolygon)
function pointInPolygon(latlng, latlngs) {
  // latlngs — массив массивов (MultiPolygon)
  const x = latlng.lng;
  const y = latlng.lat;

  const inside = (polygon) => {
    let insidePoly = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1], yi = polygon[i][0];
      const xj = polygon[j][1], yj = polygon[j][0];
      const intersect = ((yi > y) != (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) insidePoly = !insidePoly;
    }
    return insidePoly;
  };

  // Проверяем MultiPolygon
  for (const poly of latlngs) {
    for (const ring of poly) {
      if (inside(ring)) return true;
    }
  }
  return false;
}

// Загружаем районы СПб
fetch('spb_districts.geojson')
  .then(res => res.json())
  .then(data => {
    const geoJsonLayer = L.geoJSON(data, {
      style: (feature) => ({
        color: getRandomColor(),
        weight: 2,
        fillOpacity: 0.3
      })
    }).addTo(map);

    // Клик по карте
    map.on('click', function(e) {
      const latlng = e.latlng;
      let found = false;

      geoJsonLayer.eachLayer(layer => {
        if (!layer.feature) return;
        const coords = layer.feature.geometry.coordinates;
        const type = layer.feature.geometry.type;

        let multiPolygonCoords;
        if (type === "Polygon") {
          multiPolygonCoords = [coords];
        } else if (type === "MultiPolygon") {
          multiPolygonCoords = coords;
        } else {
          return;
        }

        if (pointInPolygon(latlng, multiPolygonCoords)) {
          const zoneName = layer.feature.properties.name.trim();
          const zoneInfo = zonesData[zoneName];

          if (!zoneInfo) {
            messageDiv.innerHTML = `Данные для района "${zoneName}" не найдены`;
            found = true;
            return;
          }

          const popupContent = `
            <b>${zoneName}</b><br>
            Аренда: ${zoneInfo.rent} ₽/мес<br>
            Налоги и коммунальные: ${zoneInfo.taxes} ₽/мес<br>
            Проходимость: ${zoneInfo.passability}<br>
            Пешеходный трафик: ${zoneInfo.pedestrianTraffic}<br>
            Автомобильный трафик: ${zoneInfo.carTraffic}<br>
            Аналогичных магазинов рядом: ${zoneInfo.nearbyStores}<br>
            Демография: ${zoneInfo.demographics}<br>
            Сезонность: ${zoneInfo.seasonality}<br>
            Развитие района: ${zoneInfo.development}<br>
            Новые ЖК и транспорт: ${zoneInfo.newInfrastructure}<br>
          `;
          layer.bindPopup(popupContent).openPopup();
          messageDiv.innerHTML = '';
          found = true;
        }
      });

      if (!found) {
        messageDiv.innerHTML = `Клик по карте в точке: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)} (не найден район)`;
      }
    });
  })
  .catch(err => {
    console.error(err);
    messageDiv.innerHTML = 'Не удалось загрузить spb_districts.geojson';
  });


// Случайный цвет для визуализации районов
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
