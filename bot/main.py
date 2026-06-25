import asyncio
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:5173")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


def main_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🎵 Открыть TorMus",
            web_app=WebAppInfo(url=WEBAPP_URL),
        )
    ]])


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "👋 Привет!\n\n"
        "🎵 <b>TorMus</b> — твой личный музыкальный сервер.\n\n"
        "Ищи любые альбомы, скачивай и слушай — без цензуры и подписок.",
        parse_mode="HTML",
        reply_markup=main_keyboard(),
    )


@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    await message.answer(
        "📖 <b>Как пользоваться:</b>\n\n"
        "1. Нажми <b>Открыть TorMus</b>\n"
        "2. Введи название исполнителя или альбома\n"
        "3. Выбери результат и нажми <b>Скачать</b>\n"
        "4. Дождись загрузки и жми Play\n\n"
        "⚡️ Треки стримятся с сервера — интернет нужен.",
        parse_mode="HTML",
        reply_markup=main_keyboard(),
    )


@dp.message(F.web_app_data)
async def on_web_app_data(message: types.Message):
    # Для будущих фич: получение данных из Mini App
    await message.answer(f"Данные из приложения: {message.web_app_data.data}")


async def main():
    print(f"Bot started. WebApp URL: {WEBAPP_URL}")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
