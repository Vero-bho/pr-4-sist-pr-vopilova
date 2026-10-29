async function loadSelects() {
    const serviceSelect = document.getElementById('service');
    const masterSelect = document.getElementById('master');
    const hairSelect = document.getElementById('hair');

    try {
        const servResp = await fetch('/data/api_services.json');
        const servData = await servResp.json();
        serviceSelect.innerHTML = '<option value=""> Выберите услугу </option>';
        servData.services.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.name;
            opt.textContent = `${s.name} (${s.price} ₽)`;
            serviceSelect.appendChild(opt);
        });

        const mastResp = await fetch('/data/api_masters.json');
        const mastData = await mastResp.json();
        masterSelect.innerHTML = '<option value=""> Выберите мастера </option>';
        mastData.masters.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            opt.textContent = `${m.name} — стаж ${m.experience} лет`;
            masterSelect.appendChild(opt);
        });

        const hairResp = await fetch('/data/api_hair_types.json');
        const hairData = await hairResp.json();
        hairSelect.innerHTML = '<option value=""> Выберите тип волос </option>';
        hairData.hair_types.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h.name;
            opt.textContent = h.name;
            hairSelect.appendChild(opt);
        });

    } catch (error) {
        console.error("ОШИБКА: Не удалось загрузить JSON-файлы. Проверь, лежат ли они в папке data!", error);
    }
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
    const hair = document.getElementById('hair').value;
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
            body: JSON.stringify({ name, phone, service, master, hair })
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