const db = require('./database');

function getAllTeachers() {
    return db.prepare('SELECT id, full_name FROM teachers ORDER BY full_name ASC').all();
}

function getTeacherById(id) {
    return db.prepare('SELECT id, full_name FROM teachers WHERE id = ?').get(id) || null;
}

module.exports = {
    getAllTeachers,
    getTeacherById
};
