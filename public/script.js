// ---- Базовые настройки карты ----
const spbCenter = [59.93, 30.33];
const messageDiv = document.getElementById('message');

let selectedLayer = null; // текущий подсвеченный полигон

const BASE_STYLE = {
  color: '#c98200',
  weight: 2,
  fillColor: '#ffe884',
  fillOpacity: 0.3
};
const HIGHLIGHT_STYLE = {
  color: '#ff3333',
  weight: 3,
  fillColor: '#ff6666',
  fillOpacity: 0.35
};

const map = L.map('map', { minZoom: 4, maxZoom: 18 }).setView(spbCenter, 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ---- Константы и коэффициенты ----
const PAYROLL = 100000; // Зарплатный фонд (в мес.)

// Первоначальные вложения по форматам (CAPEX)
const CAPEX_BY_FORMAT = {
  'Витрина PiterSmoke': 1200000,
  'Vape Shop': 1700000,
  'Street Retail': 2500000,
  'Premium Retail': 3500000,
  'PiterSmoke X МЭТЧ': 4000000
};

// Глобально выбранный формат для синхронизации всех попапов
let currentFormat = 'Vape Shop';

// Уровень → коэффициент
function levelToCoef(level) {
  if (!level) return 0.5;
  const v = String(level).toLowerCase();
  if (v.includes('очень') && v.includes('высок')) return 1.0; // Очень высокая
  if (v.includes('высок')) return 0.75;                       // Высокая
  if (v.includes('низк')) return 0.25;                        // Низкая
  return 0.5;                                                 // Средняя / другое
}

// форматирование рублей
function rub(n) {
  return (Number(n) || 0).toLocaleString('ru-RU');
}

// Расчёты
function calcBreakEvenRevenue(rent, taxes) {
  const r = Number(rent) || 0;
  const t = Number(taxes) || 0;
  return Math.round((r + t + PAYROLL) / 0.38);
}

function calcPaybackMonths(capex, breakEvenRevenue, passabilityLevel, profitabilityLevel) {
  const coefPass = levelToCoef(passabilityLevel);
  const coefProf = levelToCoef(profitabilityLevel);
  const denom = (Number(breakEvenRevenue) || 0) * 3 * 0.38 * (coefPass * coefProf);
  const safeDenom = Math.max(denom, 1);
  const months = (Number(capex) || 0) / safeDenom;
  return Math.ceil(months);
}

// ---- Клик по пустой карте — показать координаты и снять подсветку ----
map.on('click', (e) => {
  const { lat, lng } = e.latlng;
  messageDiv.innerHTML = `Клик по карте в точке: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  if (selectedLayer) {
    selectedLayer.setStyle({ ...BASE_STYLE });
    selectedLayer = null;
  }
});

// ---- Хранилище всех открытых попапов ----
const openPopups = new Map(); // key = uid слоя, value = {pbEl, beEl, selectEl, zoneInfo}

// ---- Загрузка районов СПб ----
fetch('spb_districts.geojson')
  .then(res => res.json())
  .then(geo => {
    L.geoJSON(geo, {
      style: () => ({ ...BASE_STYLE }),
      onEachFeature: (feature, layer) => {
        layer.on('click', (ev) => {
          if (ev.originalEvent && ev.originalEvent.stopPropagation) {
            ev.originalEvent.stopPropagation();
          }

          const zoneName = (feature?.properties?.name || '').trim();
          const zoneInfo = (typeof zonesData !== 'undefined') ? zonesData[zoneName] : null;

          if (selectedLayer) selectedLayer.setStyle({ ...BASE_STYLE });
          layer.setStyle({ ...HIGHLIGHT_STYLE });
          selectedLayer = layer;

          if (!zoneInfo) {
            messageDiv.innerHTML = `Данные для района "${zoneName || '—'}" не найдены`;
            layer.bindPopup(`<b>${zoneName || 'Район'}</b><br>Нет данных в zonesData.`).openPopup();
            return;
          }

          const breakEven = calcBreakEvenRevenue(zoneInfo.rent, zoneInfo.taxes);
          const capex = CAPEX_BY_FORMAT[currentFormat] || 0;
          const payback = calcPaybackMonths(capex, breakEven, zoneInfo.passability, zoneInfo.profitability);

          const uid = L.Util.stamp(layer);
          const selectId = `formatSelect_${uid}`;
          const beId = `be_${uid}`;
          const pbId = `pb_${uid}`;
          const btnId = `recalcBtn_${uid}`;

          const popupHtml = `
            <div style="min-width:260px">
              <div style="margin-bottom:8px;"><b>${zoneName}</b></div>
              <div><b>Аренда:</b> ${rub(zoneInfo.rent)} ₽/мес</div>
              <div><b>Налоги и коммуналка:</b> ${rub(zoneInfo.taxes)} ₽/мес</div>
              <div><b>Проходимость:</b> ${zoneInfo.passability || '—'}</div>
              <div><b>Доходность населения:</b> ${zoneInfo.profitability || '—'}</div>
              <div><b>Пешеходный трафик:</b> ${zoneInfo.pedestrianTraffic || '—'}</div>
              <div><b>Автомобильный трафик:</b> ${zoneInfo.carTraffic || '—'}</div>
              <div><b>Конкурентов рядом:</b> ${zoneInfo.nearbyStores ?? '—'}</div>
              <div><b>Демография:</b> ${zoneInfo.demographics || '—'}</div>
              <div><b>Сезонность:</b> ${zoneInfo.seasonality || '—'}</div>
              <div><b>Развитие района:</b> ${zoneInfo.development || '—'}</div>
              <div><b>Новые ЖК и транспорт:</b> ${zoneInfo.newInfrastructure || '—'}</div>

              <hr style="margin:10px 0;">

              <div><b>Выручка по точке безубыточности:</b> <span id="${beId}">${rub(breakEven)} ₽/мес</span></div>

              <div style="margin-top:6px;">
                <label for="${selectId}"><b>Формат магазина:</b></label><br>
                <select id="${selectId}" style="width:100%; margin-top:4px;">
                  ${Object.keys(CAPEX_BY_FORMAT).map(name =>
                    `<option value="${name}" ${name === currentFormat ? 'selected' : ''}>${name} — ${rub(CAPEX_BY_FORMAT[name])} ₽</option>`
                  ).join('')}
                </select>
              </div>

              <div style="margin-top:6px;">
                <button id="${btnId}" style="width:100%; margin-top:6px;">Пересчитать</button>
              </div>

              <div style="margin-top:6px;"><b>Период окупаемости:</b> <span id="${pbId}">${payback} мес.</span></div>
            </div>
          `;

          layer.bindPopup(popupHtml).openPopup();

          layer.on('popupopen', () => {
            const selectEl = document.getElementById(selectId);
            const pbEl = document.getElementById(pbId);
            const beEl = document.getElementById(beId);
            const btnEl = document.getElementById(btnId);
            if (!selectEl || !pbEl || !beEl || !btnEl) return;

            openPopups.set(uid, { pbEl, beEl, selectEl, zoneInfo });

            btnEl.addEventListener('click', () => {
              currentFormat = selectEl.value;
              openPopups.forEach(({ pbEl, beEl, zoneInfo }) => {
                const be = calcBreakEvenRevenue(zoneInfo.rent, zoneInfo.taxes);
                const capex = CAPEX_BY_FORMAT[currentFormat] || 0;
                const months = calcPaybackMonths(capex, be, zoneInfo.passability, zoneInfo.profitability);
                pbEl.textContent = `${months} мес.`;
              });
            });
          });

          messageDiv.innerHTML = '';
        });
      }
    }).addTo(map);
  })
  .catch(err => {
    console.error(err);
    messageDiv.innerHTML = 'Не удалось загрузить spb_districts.geojson';
  });
