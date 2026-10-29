// Запасные данные
const fallbackServices = [
    { name: "Женская стрижка", price: 2500 },
    { name: "Мужская стрижка", price: 1500 },
    { name: "Окрашивание в один тон", price: 4500 },
    { name: "Мелирование / Балаяж", price: 6000 },
    { name: "Укладка и сушка", price: 1200 },
    { name: "Плетение кос", price: 2000 },
    { name: "Химическая завивка", price: 3500 },
    { name: "Уход и ботокс для волос", price: 3000 }
];

const fallbackMasters = [
    { name: "Офелия", experience: 7 },
    { name: "Улита", experience: 10 },
    { name: "Маргарита", experience: 2 },
    { name: "Софья", experience: 67 },
    { name: "Эдвард", experience: 100 },
    { name: "Джейкоб", experience: 3 }
];

const fallbackHair = [
    { name: "Прямые" },
    { name: "Волнистые" },
    { name: "Кудрявые" },
    { name: "Кучерявые (афро)" },
    { name: "Жёсткие / Толстые" },
    { name: "Тонкие / Мягкие" }
];

async function loadSelects() {
    const serviceSelect = document.getElementById('service');
    const masterSelect = document.getElementById('master');
    const hairSelect = document.getElementById('hair');

    let services = fallbackServices;
    let masters = fallbackMasters;
    let hairs = fallbackHair;

    // Загрузка услуг
    try {
        const servResp = await fetch('/data/api_services.json');
        if (servResp.ok) {
            const servData = await servResp.json();
            if (servData && servData.services) services = servData.services;
        }
    } catch (e) { console.log('JSON услуг не найден'); }

    // Загрузка мастеров
    try {
        const mastResp = await fetch('/data/api_masters.json');
        if (mastResp.ok) {
            const mastData = await mastResp.json();
            if (mastData && mastData.masters) masters = mastData.masters;
        }
    } catch (e) { console.log('JSON мастеров не найден'); }

    // Загрузка типов волос
    try {
        const hairResp = await fetch('/data/api_hair_types.json');
        if (hairResp.ok) {
            const hairData = await hairResp.json();
            if (hairData && hairData.hair_types) hairs = hairData.hair_types;
        }
    } catch (e) { console.log('JSON волос не найден'); }

    // Отрисовка
    serviceSelect.innerHTML = '<option value=""> Выберите услугу </option>';
    services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.name} (${s.price} ₽)`;
        serviceSelect.appendChild(opt);
    });

    masterSelect.innerHTML = '<option value=""> Выберите мастера </option>';
    masters.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = `${m.name} — стаж ${m.experience} лет`;
        masterSelect.appendChild(opt);
    });

    hairSelect.innerHTML = '<option value=""> Выберите тип волос </option>';
    hairs.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.name;
        opt.textContent = h.name;
        hairSelect.appendChild(opt);
    });
}

async function loadData() {
    try {
        const resp = await fetch('/api/data');
        const data = await resp.json();
        const ul = document.getElementById('list');
        ul.innerHTML = '';
        
        if (data.length === 0) {
            ul.innerHTML = '<li>Заявок пока нет</li>';
            return;
        }

        data.reverse().forEach(item => {
            const li = document.createElement('li');
            // Выводим тип волос, если он есть
            li.innerHTML = `<b>${item.client}</b> — ${item.service} <br><small>Мастер: ${item.master} | Волосы: ${item.hair || '—'}</small>`;
            ul.appendChild(li);
        });
    } catch (e) {
        console.log('Ошибка истории:', e);
    }
}

document.getElementById('send').addEventListener('click', async () => {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const service = document.getElementById('service').value;
    const master = document.getElementById('master').value;
    const hair = document.getElementById('hair').value; // новое поле
    const msg = document.getElementById('msg');

    if (name.trim().length < 2) { msg.textContent = 'Введите имя'; return; }
    if (phone.trim().length < 5) { msg.textContent = 'Введите телефон'; return; }
    if (!service) { msg.textContent = 'Выберите услугу'; return; }
    if (!master) { msg.textContent = 'Выберите мастера'; return; }
    if (!hair) { msg.textContent = 'Выберите тип волос'; return; }

    msg.textContent = 'Отправка...';
    msg.style.color = 'gray';

    try {
        const resp = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, service, master, hair }) // добавили hair
        });
        
        const result = await resp.json();

        if (result.ok) {
            msg.style.color = 'green';
            msg.textContent = 'Заявка сохранена!';
            document.getElementById('name').value = '';
            document.getElementById('phone').value = '';
            loadData();
        } else {
            msg.style.color = 'red';
            msg.textContent = result.error;
        }
    } catch (e) {
        msg.style.color = 'red';
        msg.textContent = 'Ошибка сервера!';
    }
});

loadSelects();
loadData();