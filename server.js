const express = require('express');
const path = require('path');

// Подключаем маршруты API. Работа с SQL находится в отдельных модулях.
const coursesRoutes = require('./routes/courses');
const teachersRoutes = require('./routes/teachers');
const { getCourseCount } = require('./database/coursesRepository');
const { getAllTeachers } = require('./database/teachersRepository');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, 'public');

// Разбираем JSON в теле POST и PUT запросов.
app.use(express.json());

// Отдаём HTML, CSS и клиентский JavaScript из папки public.
app.use(express.static(publicDirectory));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicDirectory, 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(publicDirectory, 'about.html'));
});

// Базовый маршрут статуса — помогает проверить, что сервер и БД доступны.
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        database: 'SQLite',
        courses: getCourseCount(),
        teachers: getAllTeachers().length
    });
});

app.use('/api/courses', coursesRoutes);
app.use('/api/teachers', teachersRoutes);

// Для неизвестных API-маршрутов возвращаем JSON, а не HTML-страницу.
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API-маршрут не найден.' });
});

// Страница 404 для неизвестных адресов сайта.
app.use((req, res) => {
    res.status(404).sendFile(path.join(publicDirectory, '404.html'));
});

// Единая обработка ошибок сервера.
app.use((error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log('База данных SQLite готова к работе.');
});
