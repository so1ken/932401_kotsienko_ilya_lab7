const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

// Файл БД хранится в папке data в корне проекта.
const dataDirectory = path.join(__dirname, '..', 'data');
const databasePath = path.join(dataDirectory, 'courses.db');

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const db = new DatabaseSync(databasePath);

// Проверка внешних ключей включена для подключения к SQLite.
db.exec('PRAGMA foreign_keys = ON;');

// Создаём таблицы, если они ещё не существуют.
db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        teacher_id INTEGER NOT NULL,
        credits REAL NOT NULL CHECK (credits > 0),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
    );
`);

// Добавляем примеры только при первом запуске на пустой базе.
const teacherCount = db.prepare('SELECT COUNT(*) AS count FROM teachers').get().count;

if (teacherCount === 0) {
    const insertTeacher = db.prepare('INSERT INTO teachers (full_name) VALUES (?)');
    const initialTeachers = [
        'Иванов Иван Иванович',
        'Петрова Анна Алексеевна',
        'Сидоров Дмитрий Михайлович'
    ];

    for (const teacher of initialTeachers) {
        insertTeacher.run(teacher);
    }
}

const courseCount = db.prepare('SELECT COUNT(*) AS count FROM courses').get().count;

if (courseCount === 0) {
    const insertCourse = db.prepare(`
        INSERT INTO courses (course_name, teacher_id, credits)
        VALUES (?, ?, ?)
    `);
    const initialCourses = [
        { course_name: 'Web-технологии', teacher_id: 1, credits: 4 },
        { course_name: 'Базы данных', teacher_id: 2, credits: 3 },
        { course_name: 'Алгоритмы и структуры данных', teacher_id: 3, credits: 5 },
        { course_name: 'Основы программирования', teacher_id: 1, credits: 4 }
    ];

    for (const course of initialCourses) {
        insertCourse.run(course.course_name, course.teacher_id, course.credits);
    }
}

module.exports = db;
