import aiohttp
import asyncio
import json
from datetime import datetime
from aiohttp import web
from pathlib import Path

ROOT = Path(__file__).parent.parent
APP_DIR = Path(__file__).parent
DATA_DIR = ROOT / "data"
OUTPUT_FILE = ROOT / "output" / "data.json"
HAIR_TYPES_FILE = DATA_DIR / "api_hair_types.json"

OUTPUT_FILE.parent.mkdir(exist_ok=True) 
DATA_DIR.mkdir(exist_ok=True) 

SERVICES_API_URL = "https://dummyjson.com/products/category/beauty?_limit=5"
MASTERS_API_URL = "https://dummyjson.com/users?_limit=3"
HAIR_API_URL = "https://dummyjson.com/products/category/skin-care?_limit=3"

sem = asyncio.Semaphore(3)

async def fetch_data(url, session):
    async with sem:
        try:
            async with session.get(url, timeout=5) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"Ошибка {response.status} при запросе {url}")
        except asyncio.TimeoutError:
            print(f"Таймаут при запросе {url}")
        except Exception as e:
            print(f"Ошибка {e} при запросе {url}")
        return None

async def collect_data_async():
    async with aiohttp.ClientSession() as session:
        task1 = fetch_data(SERVICES_API_URL, session)
        task2 = fetch_data(MASTERS_API_URL, session)
        
        services_data, masters_data = await asyncio.gather(task1, task2)
        return services_data, masters_data

async def generate_hair_types():
    async with aiohttp.ClientSession() as session:
        data = await fetch_data(HAIR_API_URL, session)
        if data and "products" in data:
            hair_types = {"hair_types": []}
            for i, item in enumerate(data["products"], start=1):
                hair_types["hair_types"].append({
                    "id": i,
                    "name": item["title"].split()[0]
                })
            
            hair_types["hair_types"].extend([
                {"id": 10, "name": "Прямые"},
                {"id": 11, "name": "Волнистые"},
                {"id": 12, "name": "Кудрявые"},
                {"id": 13, "name": "Кучерявые (афро)"}
            ])

            with open(HAIR_TYPES_FILE, "w", encoding="utf-8") as f:
                json.dump(hair_types, f, ensure_ascii=False, indent=2)
            print("Файл api_hair_types.json успешно создан!")

asyncio.run(generate_hair_types())

def save_data(data, filename=OUTPUT_FILE):
    with open(filename, "a", encoding="utf-8") as file:
        file.write(json.dumps(data, ensure_ascii=False) + "\n")

async def get_data(request):
    if not OUTPUT_FILE.exists():
        return web.json_response([])
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        lines = [json.loads(line) for line in f if line.strip()]
    return web.json_response(lines)

async def post_booking(request):
    data = await request.json()
    
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    service = data.get("service", "").strip()
    master = data.get("master", "").strip()
    hair = data.get("hair", "").strip()
    
    if len(name) < 2:
        return web.json_response({"ok": False, "error": "Имя слишком короткое"})
    if len(phone) < 5:
        return web.json_response({"ok": False, "error": "Введите телефон"})
    if not service or not master or not hair:
        return web.json_response({"ok": False, "error": "Заполните все поля"})

    booking = {
        "client": name,
        "phone": phone,
        "service": service,
        "master": master,
        "hair": hair,
        "timestamp": datetime.now().isoformat()
    }
    
    save_data(booking)
    print(f"[+] Сохранено: {name} -> {service} ({hair})")
    return web.json_response({"ok": True})

async def index(request):
    return web.FileResponse(APP_DIR / "index.html")

async def script(request):
    return web.FileResponse(APP_DIR / "script.js")

app = web.Application()
app.router.add_get("/", index)
app.router.add_get("/script.js", script)
app.router.add_get("/api/data", get_data)
app.router.add_post("/api/book", post_booking)
app.router.add_static("/data/", DATA_DIR)

if __name__ == "__main__":
    print("Сервер запущен: http://localhost:8000")
    web.run_app(app, host="localhost", port=8000)