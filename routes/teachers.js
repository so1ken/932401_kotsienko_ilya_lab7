const express = require('express');
const teachersRepository = require('../database/teachersRepository');

const router = express.Router();

// Вспомогательный маршрут для заполнения списка преподавателей в интерфейсе.
router.get('/', (req, res) => {
    res.json(teachersRepository.getAllTeachers());
});

module.exports = router;
