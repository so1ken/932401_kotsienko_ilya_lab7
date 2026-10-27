// Общая функция темы используется как на главной странице, так и на странице «О работе».
const themeToggle = document.getElementById('themeToggle');

function applySavedTheme() {
    try {
        if (localStorage.getItem('lab7-theme') === 'dark') {
            document.body.classList.add('dark-theme');
        }
    } catch (error) {
        // Если localStorage недоступен, сайт продолжает работать в светлой теме.
    }

    updateThemeButton();
}

function updateThemeButton() {
    if (themeToggle) {
        themeToggle.textContent = document.body.classList.contains('dark-theme')
            ? 'Светлая тема'
            : 'Тёмная тема';
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        updateThemeButton();

        try {
            localStorage.setItem(
                'lab7-theme',
                document.body.classList.contains('dark-theme') ? 'dark' : 'light'
            );
        } catch (error) {
            // Смена темы работает и без сохранения настройки.
        }
    });
}

applySavedTheme();

// Код управления курсами запускается только на главной странице.
const courseForm = document.getElementById('courseForm');

if (courseForm) {
    const courseNameInput = document.getElementById('courseName');
    const teacherSelect = document.getElementById('teacherId');
    const creditsInput = document.getElementById('credits');
    const teacherFilter = document.getElementById('teacherFilter');
    const courseTableBody = document.getElementById('courseTableBody');
    const formTitle = document.getElementById('formTitle');
    const saveButton = document.getElementById('saveButton');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const formMessage = document.getElementById('formMessage');
    const listMessage = document.getElementById('listMessage');
    const databaseStatus = document.getElementById('databaseStatus');
    const courseCount = document.getElementById('courseCount');
    const teacherCount = document.getElementById('teacherCount');

    let courses = [];
    let editingCourseId = null;

    async function requestJson(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {})
            }
        });

        let result = {};
        try {
            result = await response.json();
        } catch (error) {
            result = {};
        }

        if (!response.ok) {
            throw new Error(result.error || `Ошибка запроса: ${response.status}`);
        }

        return result;
    }

    function showMessage(element, message, isError = false) {
        element.textContent = message;
        element.classList.toggle('is-error', isError);
    }

    function setDatabaseStatus(isOnline, message) {
        databaseStatus.classList.toggle('is-online', isOnline);
        databaseStatus.classList.toggle('is-offline', !isOnline);
        databaseStatus.lastElementChild.textContent = message;
    }

    function createCell(text, className = '') {
        const cell = document.createElement('td');
        cell.textContent = text;
        if (className) {
            cell.className = className;
        }
        return cell;
    }

    function createActionButton(label, action, id, extraClass = '') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `button button-secondary table-button ${extraClass}`.trim();
        button.textContent = label;
        button.dataset.action = action;
        button.dataset.id = String(id);
        return button;
    }

    function renderCourses() {
        courseTableBody.replaceChildren();

        if (courses.length === 0) {
            const row = document.createElement('tr');
            const cell = createCell('Курсы не найдены. Добавь новую запись или измени фильтр.', 'empty-cell');
            cell.colSpan = 5;
            row.append(cell);
            courseTableBody.append(row);
            return;
        }

        for (const course of courses) {
            const row = document.createElement('tr');
            row.append(
                createCell(String(course.id)),
                createCell(course.course_name),
                createCell(course.teacher_name),
                createCell(String(course.credits))
            );

            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell';
            actionsCell.append(
                createActionButton('Изменить', 'edit', course.id),
                createActionButton('Удалить', 'delete', course.id, 'delete-button')
            );
            row.append(actionsCell);
            courseTableBody.append(row);
        }
    }

    async function loadTeachers() {
        const teachers = await requestJson('/api/teachers');
        const currentTeacherId = teacherSelect.value;
        const currentFilter = teacherFilter.value;

        teacherSelect.replaceChildren();
        const chooseTeacher = document.createElement('option');
        chooseTeacher.value = '';
        chooseTeacher.textContent = 'Выбери преподавателя';
        chooseTeacher.disabled = true;
        chooseTeacher.selected = true;
        teacherSelect.append(chooseTeacher);

        teacherFilter.replaceChildren();
        const allTeachersOption = document.createElement('option');
        allTeachersOption.value = '';
        allTeachersOption.textContent = 'Все преподаватели';
        teacherFilter.append(allTeachersOption);

        for (const teacher of teachers) {
            const option = document.createElement('option');
            option.value = String(teacher.id);
            option.textContent = teacher.full_name;
            teacherSelect.append(option);

            const filterOption = document.createElement('option');
            filterOption.value = String(teacher.id);
            filterOption.textContent = teacher.full_name;
            teacherFilter.append(filterOption);
        }

        if (teachers.some((teacher) => String(teacher.id) === currentTeacherId)) {
            teacherSelect.value = currentTeacherId;
        }
        if (teachers.some((teacher) => String(teacher.id) === currentFilter)) {
            teacherFilter.value = currentFilter;
        }

        teacherCount.textContent = String(teachers.length);
    }

    async function loadCourses() {
        const selectedTeacher = teacherFilter.value;
        const url = selectedTeacher
            ? `/api/courses?teacher_id=${encodeURIComponent(selectedTeacher)}`
            : '/api/courses';

        courses = await requestJson(url);
        renderCourses();
        showMessage(listMessage, '');
    }

    async function loadStatus() {
        const status = await requestJson('/api/status');
        courseCount.textContent = String(status.courses);
        teacherCount.textContent = String(status.teachers);
        setDatabaseStatus(true, 'SQLite подключена');
    }

    function resetForm() {
        editingCourseId = null;
        courseForm.reset();
        creditsInput.value = '3';
        formTitle.textContent = 'Добавить курс';
        saveButton.textContent = 'Добавить курс';
        cancelEditButton.hidden = true;
        showMessage(formMessage, '');
    }

    function startEditing(course) {
        editingCourseId = course.id;
        courseNameInput.value = course.course_name;
        teacherSelect.value = String(course.teacher_id);
        creditsInput.value = String(course.credits);
        formTitle.textContent = `Изменить курс №${course.id}`;
        saveButton.textContent = 'Сохранить изменения';
        cancelEditButton.hidden = false;
        showMessage(formMessage, 'Измени нужные поля и сохрани запись.');
        courseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        courseNameInput.focus({ preventScroll: true });
    }

    courseForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const course = {
            course_name: courseNameInput.value.trim(),
            teacher_id: Number(teacherSelect.value),
            credits: Number(creditsInput.value)
        };

        if (!course.course_name) {
            showMessage(formMessage, 'Название курса не должно быть пустым.', true);
            courseNameInput.focus();
            return;
        }

        if (!Number.isFinite(course.credits) || course.credits <= 0) {
            showMessage(formMessage, 'Количество кредитов должно быть положительным числом.', true);
            creditsInput.focus();
            return;
        }

        const isEditing = editingCourseId !== null;
        const url = isEditing ? `/api/courses/${editingCourseId}` : '/api/courses';

        try {
            await requestJson(url, {
                method: isEditing ? 'PUT' : 'POST',
                body: JSON.stringify(course)
            });

            resetForm();
            showMessage(formMessage, isEditing ? 'Курс успешно изменён.' : 'Курс успешно добавлен.');
            await Promise.all([loadCourses(), loadStatus()]);
        } catch (error) {
            showMessage(formMessage, error.message, true);
        }
    });

    cancelEditButton.addEventListener('click', resetForm);
    teacherFilter.addEventListener('change', async () => {
        try {
            await loadCourses();
        } catch (error) {
            showMessage(listMessage, error.message, true);
        }
    });

    courseTableBody.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }

        const id = Number(button.dataset.id);
        const course = courses.find((item) => item.id === id);

        if (button.dataset.action === 'edit' && course) {
            startEditing(course);
            return;
        }

        if (button.dataset.action === 'delete') {
            if (!window.confirm(`Удалить курс №${id}?`)) {
                return;
            }

            try {
                await requestJson(`/api/courses/${id}`, { method: 'DELETE' });
                if (editingCourseId === id) {
                    resetForm();
                }
                showMessage(listMessage, `Курс №${id} удалён.`);
                await Promise.all([loadCourses(), loadStatus()]);
            } catch (error) {
                showMessage(listMessage, error.message, true);
            }
        }
    });

    async function initializePage() {
        try {
            await loadTeachers();
            await Promise.all([loadCourses(), loadStatus()]);
        } catch (error) {
            setDatabaseStatus(false, 'Нет подключения к серверу');
            showMessage(listMessage, `Не удалось загрузить данные: ${error.message}`, true);
            courseTableBody.replaceChildren();
            const row = document.createElement('tr');
            const cell = createCell('Проверь, что сервер запущен командой npm start.', 'empty-cell');
            cell.colSpan = 5;
            row.append(cell);
            courseTableBody.append(row);
        }
    }

    initializePage();
}
