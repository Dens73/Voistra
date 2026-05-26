# Voistra

![Логотип Voistra](./apps/desktop/public/voistra-mark.svg)

`Voistra` — настольное голосовое рабочее пространство для команд, учебных проектов и демонстраций.  
Проект объединяет серверы, текстовые и голосовые каналы, личные сообщения, демонстрацию экрана, систему друзей, уведомления и Windows-установщик в одном desktop-клиенте.

## Что уже реализовано

- desktop-клиент на `Electron + React + TypeScript`
- backend на `NestJS + TypeORM + WebSocket Gateway`
- регистрация, вход, access/refresh токены
- серверы, текстовые и голосовые каналы
- приватные каналы с паролями
- личные сообщения, друзья, заявки в друзья
- уведомления, модерация, профиль пользователя
- демонстрация экрана и голосовое присутствие
- сборка Windows-приложения через `electron-builder`

## Как скачать и установить

### Готовая версия

Рекомендуемый способ:

1. Открой вкладку `Actions` в репозитории.
2. Выбери последний запуск `Voistra Windows Build`.
3. Скачай артефакт `voistra-windows`.
4. Распакуй архив.
5. Запусти `Voistra Setup 0.1.0.exe`.

### Как это работает

В репозитории уже настроено:

- каждый push в `main` собирает свежую Windows-версию
- каждый тег вида `v0.1.0` может публиковать артефакты в GitHub Release

То есть основная ветка подходит как для обычного скачивания, так и для демонстрации дипломного проекта.

## Локальный запуск

```powershell
npm install
npm run dev --workspace @diplom/server
npm run dev:renderer --workspace @diplom/desktop
npm run dev:electron --workspace @diplom/desktop
```

Подробности локального запуска: [LOCAL_RUN.md](./LOCAL_RUN.md)

## Сборка установщика

```powershell
npm install
npm run dist:desktop
```

Готовые файлы появляются здесь:

- `release/voistra/win-unpacked`
- `release/voistra/Voistra Setup 0.1.0.exe`

## Структура репозитория

```text
.
├─ .github/
│  └─ workflows/
├─ apps/
│  ├─ desktop/
│  └─ server/
├─ scripts/
├─ docker-compose.yml
├─ package.json
└─ README.md
```

## Технологии

- Electron
- React 19
- Tailwind CSS
- NestJS
- TypeORM
- SQLite
- Redis
- coturn
- RNNoise-based noise suppression

## Назначение проекта

`Voistra` уже подходит для:

- защиты диплома
- локальной демонстрации на Windows
- демонстрации voice workspace-сценариев

Проект ещё можно развивать дальше, но уже сейчас он оформлен как полноценный desktop-продукт, а не просто как черновой прототип.

## Автор

Автор проекта: `Dens73`
