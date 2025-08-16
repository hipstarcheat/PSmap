// Создаем карту и указываем начальную позицию (Москва)
const map = L.map('map').setView([55.751244, 37.618423], 10);

// Добавляем слой OpenStreetMap
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