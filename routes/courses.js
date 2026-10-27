const express = require('express');
const coursesRepository = require('../database/coursesRepository');
const teachersRepository = require('../database/teachersRepository');

const router = express.Router();

// Проверяет и приводит поля курса к ожидаемым типам.
function validateCourse(body) {
    const courseName = typeof body.course_name === 'string'
        ? body.course_name.trim()
        : '';
    const teacherId = Number(body.teacher_id);
    const credits = Number(body.credits);

    if (!courseName) {
        return { error: 'Поле course_name не должно быть пустым.' };
    }

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return { error: 'teacher_id должен быть положительным целым числом.' };
    }

    if (!Number.isFinite(credits) || credits <= 0) {
        return { error: 'credits должен быть положительным числом.' };
    }

    if (!teachersRepository.getTeacherById(teacherId)) {
        return { error: 'Преподаватель с указанным teacher_id не найден.' };
    }

    return {
        value: {
            course_name: courseName,
            teacher_id: teacherId,
            credits
        }
    };
}

// GET /api/courses?teacher_id=3 — список всех курсов или фильтр по преподавателю.
router.get('/', (req, res) => {
    let teacherId = null;

    if (req.query.teacher_id !== undefined) {
        teacherId = Number(req.query.teacher_id);

        if (!Number.isInteger(teacherId) || teacherId <= 0) {
            return res.status(400).json({
                error: 'Параметр teacher_id должен быть положительным целым числом.'
            });
        }

        if (!teachersRepository.getTeacherById(teacherId)) {
            return res.json([]);
        }
    }

    return res.json(coursesRepository.getAllCourses(teacherId));
});

// POST /api/courses — создание курса.
router.post('/', (req, res) => {
    const validation = validateCourse(req.body || {});

    if (validation.error) {
        return res.status(400).json({ error: validation.error });
    }

    const course = coursesRepository.createCourse(validation.value);
    return res.status(201).json(course);
});

// PUT /api/courses/:id — изменение названия, преподавателя и количества кредитов.
router.put('/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(404).json({ error: 'Курс не найден.' });
    }

    if (!coursesRepository.getCourseById(id)) {
        return res.status(404).json({ error: 'Курс не найден.' });
    }

    const validation = validateCourse(req.body || {});

    if (validation.error) {
        return res.status(400).json({ error: validation.error });
    }

    const course = coursesRepository.updateCourse(id, validation.value);
    return res.json(course);
});

// DELETE /api/courses/:id — удаление курса.
router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(404).json({ error: 'Курс не найден.' });
    }

    const deleted = coursesRepository.deleteCourse(id);

    if (!deleted) {
        return res.status(404).json({ error: 'Курс не найден.' });
    }

    return res.json({ message: 'Курс успешно удалён.', id });
});

module.exports = router;
