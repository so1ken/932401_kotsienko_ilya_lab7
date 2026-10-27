const db = require('./database');

// Запрос объединяет courses и teachers, чтобы показать имя преподавателя.
// В таблице courses по-прежнему хранится только teacher_id.
const courseSelect = `
    SELECT
        courses.id,
        courses.course_name,
        courses.teacher_id,
        teachers.full_name AS teacher_name,
        courses.credits
    FROM courses
    JOIN teachers ON teachers.id = courses.teacher_id
`;

function getAllCourses(teacherId = null) {
    if (teacherId !== null) {
        return db.prepare(`${courseSelect} WHERE courses.teacher_id = ? ORDER BY courses.id ASC`)
            .all(teacherId);
    }

    return db.prepare(`${courseSelect} ORDER BY courses.id ASC`).all();
}

function getCourseById(id) {
    return db.prepare(`${courseSelect} WHERE courses.id = ?`).get(id) || null;
}

function createCourse(course) {
    const result = db.prepare(`
        INSERT INTO courses (course_name, teacher_id, credits)
        VALUES (?, ?, ?)
    `).run(course.course_name, course.teacher_id, course.credits);

    return getCourseById(Number(result.lastInsertRowid));
}

function updateCourse(id, course) {
    const result = db.prepare(`
        UPDATE courses
        SET course_name = ?,
            teacher_id = ?,
            credits = ?
        WHERE id = ?
    `).run(course.course_name, course.teacher_id, course.credits, id);

    if (result.changes === 0) {
        return null;
    }

    return getCourseById(id);
}

function deleteCourse(id) {
    const result = db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    return result.changes > 0;
}

function getCourseCount() {
    return db.prepare('SELECT COUNT(*) AS count FROM courses').get().count;
}

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseCount
};
