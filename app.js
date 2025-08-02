import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INITIALIZATION ---
    const firebaseConfig = {
        apiKey: "AIzaSyB90h6Yllco6LZfdyrSyBl0hc4bt6fbUDg",
        authDomain: "projmanage.firebaseapp.com",
        databaseURL: "https://projmanage-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "projmanage",
        storageBucket: "projmanage.firebasestorage.app",
        messagingSenderId: "362295689587",
        appId: "1:362295689587:web:ffe6a847b0e8a7fb920506",
        measurementId: "G-Z5JJT7XT5F"
    };
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const auth = getAuth(app);
    const dbRefProjects = ref(db, 'projects');
    const dbRefDeletedProjects = ref(db, 'deletedProjects');
    const dbRefTodoItems = ref(db, 'todoItems');

    // --- 2. DOM ELEMENT REFERENCES ---
    const dom = {
        loginModal: document.getElementById('loginModal'),
        googleSignInBtn: document.getElementById('googleSignInBtn'),
        guestLoginBtn: document.getElementById('guestLoginBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        datePickerModal: document.getElementById('datePickerModal'),
        confirmModal: document.getElementById('confirmModal'),
        promptModal: document.getElementById('promptModal'),
        dataActionModal: document.getElementById('dataActionModal'),
        todoInput: document.getElementById('todoInput'), 
        addTodoBtn: document.getElementById('addTodoBtn'),
        todoList: document.getElementById('todoList'), 
        projectNameInput: document.getElementById('projectName'),
        projectAddressInput: document.getElementById('projectAddress'), 
        contactInfoInput: document.getElementById('contactInfo'),
        startDateInput: document.getElementById('startDate'), 
        finishDateInput: document.getElementById('finishDate'),
        tasksDropdownGroup: document.querySelector('.tasks-dropdown-group'), 
        tasksDropdownButton: document.getElementById('tasksDropdownButton'),
        tasksDropdownText: document.getElementById('tasksDropdownText'),
        tasksChecklistContainer: document.getElementById('tasksChecklistContainer'), 
        taskProgressSelect: document.getElementById('taskProgress'), 
        furtherNotesInput: document.getElementById('furtherNotes'),
        addProjectBtn: document.getElementById('addProjectBtn'), 
        deleteProjectBtn: document.getElementById('deleteProjectBtn'),
        projectList: document.getElementById('projectList'), 
        projectHistoryList: document.getElementById('projectHistoryList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        projectModal: document.getElementById('projectModal'),
        dataMgmtBtn: document.getElementById('dataMgmtBtn'), 
        csvFileInput: document.getElementById('csvFileInput'),
        projectManagementContainer: document.getElementById('projectManagementContainer'),
        prevMonthBtn: document.getElementById('prevMonthBtn'),
        nextMonthBtn: document.getElementById('nextMonthBtn'),
        toggleHistoryBtn: document.getElementById('toggleHistoryBtn'),
        dataActionCancelBtn: document.getElementById('dataActionCancelBtn'),
        dataActionExportBtn: document.getElementById('dataActionExportBtn'),
        dataActionImportBtn: document.getElementById('dataActionImportBtn')
    };
    
    // --- 3. STATE MANAGEMENT ---
    const AppState = {
        isAuthenticated: false,
        currentUser: null,
        projects: {},
        deletedProjects: {},
        todoItems: [],
        displayedDate: new Date(),
        selectedProjectKey: null,
        activeDateInput: null,
        pickerDate: new Date()
    };

    const approvedEmails = [
        'mustakis@gmail.com',
        'office.airflow2019@gmail.com',
        'tal@air-flow.co.il',
        'eran@air-flow.co.il'
    ];

    const masterTaskList = ["מפוחי גג", "מפוחי חניון", "מפוח חדר משאבות", "משתיקים", "דאמפרים", "תעלות", "ברכי לובי", "ברך אשפה", "מהלכי ונטות", "ונטות", "מפוח in-line", "גרילים", "גרילים נגד יתושים", "ארון פיקוד", "ביקורת 1", "ביקורת 2", "ביקורת 3", "ביקורת 4"];
    const hebrewMonths = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

    // --- 4. FUNCTION DEFINITIONS ---
    function updateUIForAuthState() {
        document.querySelectorAll('.auth-controlled').forEach(el => {
            if (AppState.isAuthenticated) { el.classList.remove('hidden-for-guest'); } 
            else { el.classList.add('hidden-for-guest'); }
        });
        dom.todoList.style.pointerEvents = AppState.isAuthenticated ? 'auto' : 'none';
    }

    async function handleGoogleSignIn() {
        const provider = new GoogleAuthProvider();
        try { await signInWithPopup(auth, provider); } 
        catch (error) { console.error("Google Sign-In failed:", error); }
    }
    
    function handleLogout() {
        auth.signOut();
    }
    
    function getColorForName(name) {
        if (!name) return '#e0e0e0';
        let hash = 0;
        for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
        const colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'];
        return colors[Math.abs(hash % colors.length)];
    }

    function showConfirmation(title, text, confirmText = 'אישור', confirmClass = 'btn-danger', showCancel = true) {
        return new Promise((resolve) => {
            const titleEl = document.getElementById('confirmModalTitle');
            const textEl = document.getElementById('confirmModalText');
            const okBtn = document.getElementById('confirmOkBtn');
            const cancelBtn = document.getElementById('confirmCancelBtn');
            titleEl.textContent = title;
            textEl.innerHTML = text;
            okBtn.textContent = confirmText;
            okBtn.className = ""; okBtn.classList.add('btn', confirmClass);
            cancelBtn.style.display = showCancel ? 'inline-block' : 'none';
            cancelBtn.textContent = "ביטול";
            cancelBtn.className = "btn btn-secondary";
            confirmModal.classList.add('visible');
            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };
            const cleanup = () => {
                confirmModal.classList.remove('visible');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
            };
            okBtn.addEventListener('click', onOk, { once: true });
            cancelBtn.addEventListener('click', onCancel, { once: true });
        });
    }
    
    function showPrompt(title, text, inputType = 'text') {
        return new Promise((resolve) => {
            const titleEl = document.getElementById('promptModalTitle');
            const textEl = document.getElementById('promptModalText');
            const inputEl = document.getElementById('promptModalInput');
            const okBtn = document.getElementById('promptOkBtn');
            const cancelBtn = document.getElementById('promptCancelBtn');
            titleEl.textContent = title;
            textEl.textContent = text;
            inputEl.value = '';
            inputEl.type = inputType;
            dom.promptModal.classList.add('visible');
            inputEl.focus();
            const onOk = () => { cleanup(); resolve(inputEl.value); };
            const onCancel = () => { cleanup(); resolve(null); };
            const onKeypress = (e) => { if (e.key === 'Enter') onOk(); };
            const cleanup = () => {
                dom.promptModal.classList.remove('visible');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                inputEl.removeEventListener('keypress', onKeypress);
            };
            okBtn.addEventListener('click', onOk, { once: true });
            cancelBtn.addEventListener('click', onCancel, { once: true });
            inputEl.addEventListener('keypress', onKeypress);
        });
    }

    function renderDatePicker() {
        const month = AppState.pickerDate.getMonth();
        const year = AppState.pickerDate.getFullYear();
        datePickerModal.querySelector('.month-year').textContent = `${hebrewMonths[month]} ${year}`;
        const daysGrid = datePickerModal.querySelector('.date-picker-grid-days');
        daysGrid.innerHTML = '';
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDayOfMonth; i++) { daysGrid.insertAdjacentHTML('beforeend', '<div class="date-picker-day empty"></div>'); }
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'date-picker-day';
            dayEl.textContent = day;
            dayEl.dataset.day = day;
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            daysGrid.appendChild(dayEl);
        }
    }

    function openDatePicker(event) {
        AppState.activeDateInput = event.target;
        AppState.pickerDate = AppState.activeDateInput.value ? parseAndValidateDate(AppState.activeDateInput.value) : new Date();
        const inputRect = AppState.activeDateInput.getBoundingClientRect();
        dom.datePickerModal.style.width = `${inputRect.width}px`;
        dom.datePickerModal.style.display = 'block';
        dom.datePickerModal.style.top = `${inputRect.bottom + 5}px`;
        dom.datePickerModal.style.left = `${inputRect.left}px`;
        dom.datePickerModal.style.right = 'auto';
        renderDatePicker();
    }

    function hideDatePicker() {
        dom.datePickerModal.style.display = 'none';
        AppState.activeDateInput = null;
    }

    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function parseAndValidateDate(dateStr_DDMMYYYY) {
        if (!dateStr_DDMMYYYY) return new Date();
        const parts = dateStr_DDMMYYYY.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts.map(p => parseInt(p, 10));
            if (day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900) {
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) { return date; }
            }
        }
        return new Date();
    }

    async function saveProject() {
        if (!AppState.isAuthenticated) return;
        
        const requiredFields = {
            'שם היזם': dom.projectNameInput.value.trim(),
            'כתובת': dom.projectAddressInput.value.trim(),
            'פרטי יצירת קשר': dom.contactInfoInput.value.trim()
        };
        
        if (!AppState.selectedProjectKey) { 
            const emptyFields = Object.entries(requiredFields).filter(([_, value]) => !value).map(([key]) => key);
            if (emptyFields.length > 0) {
                await showConfirmation("שדות חובה", `נא למלא את השדות הבאים:<br>- ${emptyFields.join('<br>- ')}`, "הבנתי", "btn-secondary", false);
                return;
            }
        } else if (!requiredFields['שם היזם']) {
            await showConfirmation("שדה חובה", "שם היזם הוא שדה חובה.", "הבנתי", "btn-secondary", false);
            return;
        }
        
        const projectData = {
            name: requiredFields['שם היזם'], 
            address: requiredFields['כתובת'], 
            contactInfo: requiredFields['פרטי יצירת קשר'],
            startDate: dom.startDateInput.value ? parseAndValidateDate(dom.startDateInput.value).toISOString().split('T')[0] : '',
            finishDate: dom.finishDateInput.value ? parseAndValidateDate(dom.finishDateInput.value).toISOString().split('T')[0] : '',
            tasks: getTasksDataFromDOM(),
            progress: dom.taskProgressSelect.value, 
            furtherNotes: dom.furtherNotesInput.value.trim()
        };

        if (AppState.selectedProjectKey) {
            projectData.addedDateTime = AppState.projects[AppState.selectedProjectKey].addedDateTime; 
            projectData.whoCreated = AppState.projects[AppState.selectedProjectKey].whoCreated;
            projectData.lastEditedAt = formatDateTime(new Date()); 
            projectData.lastEditedBy = AppState.currentUser.displayName;
            update(ref(db, `projects/${AppState.selectedProjectKey}`), projectData).then(clearProjectForm);
        } else {
            projectData.addedDateTime = formatDateTime(new Date()); 
            projectData.whoCreated = AppState.currentUser.displayName;
            set(push(dbRefProjects), projectData).then(clearProjectForm);
        }
    }

    function populateFormForEditing(projectId, projectData) {
        AppState.selectedProjectKey = projectId;
        dom.projectNameInput.value = projectData.name; dom.projectAddressInput.value = projectData.address || '';
        dom.contactInfoInput.value = projectData.contactInfo || '';
        dom.startDateInput.value = formatDate(projectData.startDate);
        dom.finishDateInput.value = formatDate(projectData.finishDate);
        renderChecklist(projectData.tasks);
        dom.taskProgressSelect.value = projectData.progress; dom.furtherNotesInput.value = projectData.furtherNotes || '';
        dom.deleteProjectBtn.disabled = false; dom.deleteProjectBtn.style.display = 'inline-block';
        dom.addProjectBtn.textContent = 'שמור שינויים';
        dom.projectManagementContainer.scrollIntoView({ behavior: 'smooth' });
        hideProjectModal();
    }

    async function deleteProject() {
        if (!AppState.selectedProjectKey || !AppState.isAuthenticated) return;
        const projectToDelete = AppState.projects[AppState.selectedProjectKey];
        const confirmed = await showConfirmation("אישור מחיקה", `האם אתה בטוח שברצונך למחוק את "${projectToDelete.name}"?`);
        if (confirmed) {
            const pToMove = { ...projectToDelete, deletedAt: formatDateTime(new Date()), deletedBy: AppState.currentUser.displayName };
            update(ref(db), { [`/projects/${AppState.selectedProjectKey}`]: null, [`/deletedProjects/${AppState.selectedProjectKey}`]: pToMove }).then(clearProjectForm);
        }
    }

    function updateTime() { document.getElementById('currentTime').textContent = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

    function generateCalendar() {
        const calendarMonthYear = document.getElementById('calendarMonthYear'), calendarGrid = document.getElementById('calendarGrid'); if (!calendarMonthYear || !calendarGrid) return;
        const today = new Date(), year = AppState.displayedDate.getFullYear(), month = AppState.displayedDate.getMonth();
        calendarMonthYear.textContent = `${hebrewMonths[month]} ${year}`;
        while (calendarGrid.children.length > 7) { calendarGrid.removeChild(calendarGrid.lastChild); }
        const firstDayOfMonth = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDayOfMonth; i++) { calendarGrid.insertAdjacentHTML('beforeend', '<div class="calendar-day other-month"></div>'); }
        for (let day = 1; day <= daysInMonth; day++) { const dayEl = document.createElement('div'); dayEl.className = 'calendar-day'; dayEl.textContent = day; if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) { dayEl.classList.add('current-day'); } calendarGrid.appendChild(dayEl); }
    }

    function saveTodoItemsToFirebase() { set(dbRefTodoItems, AppState.todoItems); }

    function addTodo() {
        if (!AppState.isAuthenticated) return;
        const taskText = dom.todoInput.value.trim(); if (!taskText) return;
        const newTodo = { id: push(dbRefTodoItems).key, text: taskText, createdBy: AppState.currentUser.displayName, createdAt: new Date().toISOString(), color: getColorForName(AppState.currentUser.displayName) };
        if(!AppState.todoItems) AppState.todoItems = [];
        AppState.todoItems.push(newTodo);
        saveTodoItemsToFirebase(); dom.todoInput.value = ''; dom.todoInput.focus();
    }

    function renderTodoItems() {
        dom.todoList.innerHTML = '';
        if (!AppState.todoItems || AppState.todoItems.length === 0) { dom.todoList.innerHTML = '<li style="text-align: right; color: #888; font-style: italic; background: none; border: none; box-shadow: none; cursor: default; padding: 10px;">אין מטלות.</li>'; return; }
        AppState.todoItems.forEach((task) => {
            if(typeof task === 'string' || !task) return;
            const li = document.createElement('li'); li.style.backgroundColor = task.color;
            li.innerHTML = `<span class="todo-text">${task.text}</span><span class="todo-meta">נוצר על ידי ${task.createdBy} ב-${new Date(task.createdAt).toLocaleString('he-IL', dateOptions)}</span>`;
            li.addEventListener('click', function() { if(!AppState.isAuthenticated) return; AppState.todoItems = AppState.todoItems.filter(item => item.id !== task.id); saveTodoItemsToFirebase(); });
            dom.todoList.appendChild(li);
        });
    }

    function updateTasksButtonText() { 
        const textElement = dom.tasksDropdownButton.querySelector('.tasks-dropdown-button__text');
        const checkedCount = dom.tasksChecklistContainer.querySelectorAll('input:checked').length;
        if(textElement) {
            if (checkedCount > 0) {
                textElement.textContent = `נבחרו (${checkedCount} / ${masterTaskList.length})`; 
            } else {
                textElement.textContent = 'בחר מטלות...';
            }
        }
    }

    function renderChecklist(projectTasks = {}) {
        dom.tasksChecklistContainer.innerHTML = '';
        masterTaskList.forEach(taskName => { 
            const { checked = false, timestamp = '', user = '' } = projectTasks[taskName] || {}; 
            const formattedDate = timestamp ? new Date(timestamp).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
            dom.tasksChecklistContainer.insertAdjacentHTML('beforeend', 
                `<div class="task-item">
                    <div class="task-item__details">
                        <label for="task-${taskName.replace(/\s/g, '')}">${taskName}</label>
                        <span class="task-timestamp">${checked && user ? `${user} - ${formattedDate}` : ''}</span>
                    </div>
                    <input type="checkbox" id="task-${taskName.replace(/\s/g, '')}" data-task-name="${taskName}" ${checked ? 'checked' : ''} data-timestamp="${timestamp}" data-user="${user}">
                 </div>`
            ); 
        });
        updateTasksButtonText();
    }

    function getTasksDataFromDOM() { 
        const data = {}; 
        dom.tasksChecklistContainer.querySelectorAll('.task-item input[type="checkbox"]').forEach(cb => { 
            const taskName = cb.dataset.taskName; 
            if (taskName) { 
                data[taskName] = { 
                    checked: cb.checked, 
                    timestamp: cb.checked ? (cb.dataset.timestamp || new Date().toISOString()) : '',
                    user: cb.checked ? (cb.dataset.user || AppState.currentUser.displayName) : ''
                }; 
            } 
        }); 
        return data; 
    }

    function formatDateTime(d) { return d ? new Date(d).toISOString() : ''; }

    function showProjectModal(projectId, project) {
        const completedTasks = project.tasks ? Object.values(project.tasks).filter(t => t.checked).length : 0; const tasksSummary = `${completedTasks} / ${masterTaskList.length} הושלמו`;
        const startDateFormatted = project.startDate ? formatDate(project.startDate) : 'N/A';
        const finishDateFormatted = project.finishDate ? formatDate(project.finishDate) : 'N/A';
        const createdDateFormatted = project.addedDateTime ? new Date(project.addedDateTime).toLocaleString('he-IL', dateOptions) : '';
        const editedDateFormatted = project.lastEditedAt ? new Date(project.lastEditedAt).toLocaleString('he-IL', dateOptions) : '';
        dom.projectModal.innerHTML = `<div class="project-modal-content"><span class="project-modal-close">&times;</span><h3>${project.name}</h3><p><span class="info-label">כתובת:</span> ${project.address || 'לא צויין'}</p><p><span class="info-label">תאריכים:</span> ${startDateFormatted} - ${finishDateFormatted}</p><p><span class="info-label">מטלות:</span> ${tasksSummary}</p><p><span class="info-label">נוצר ב:</span> ${createdDateFormatted} על ידי <strong>${project.whoCreated || 'לא ידוע'}</strong></p>${project.lastEditedAt ? `<p><span class="info-label">עודכן לאחרונה:</span> ${editedDateFormatted} על ידי <strong>${project.lastEditedBy || 'לא ידוע'}</strong></p>` : ''}<p><span class="info-label">התקדמות כללית:</span> <span style="font-weight: bold; color: ${getProgressColor(project.progress)};">${getProgressTranslation(project.progress)}</span></p><p><span class="info-label">הערות:</span> ${project.furtherNotes || 'אין'}</p><div class="project-modal-actions"><button class="add-btn auth-controlled btn btn-primary">ערוך פרויקט</button></div></div>`;
        requestAnimationFrame(() => dom.projectModal.classList.add('visible'));
        dom.projectModal.querySelector('.project-modal-close').addEventListener('click', hideProjectModal);
        const editButton = dom.projectModal.querySelector('.add-btn'); if(AppState.isAuthenticated && editButton) { editButton.addEventListener('click', () => populateFormForEditing(projectId, project)); }
        updateUIForAuthState();
    }
    
    function showDeletedProjectModal(projectId, project) {
        const completedTasks = project.tasks ? Object.values(project.tasks).filter(t => t.checked).length : 0; const tasksSummary = `${completedTasks} / ${masterTaskList.length} הושלמו`;
        const startDateFormatted = project.startDate ? formatDate(project.startDate) : 'N/A';
        const finishDateFormatted = project.finishDate ? formatDate(project.finishDate) : 'N/A';
        const createdDateFormatted = project.addedDateTime ? new Date(project.addedDateTime).toLocaleString('he-IL', dateOptions) : 'N/A';
        const deletedDateFormatted = project.deletedAt ? new Date(project.deletedAt).toLocaleString('he-IL', dateOptions) : 'N/A';
        
        dom.projectModal.innerHTML = `<div class="project-modal-content"><span class="project-modal-close">&times;</span><h3>${project.name} (נמחק)</h3><p><span class="info-label">כתובת:</span> ${project.address || 'לא צויין'}</p><p><span class="info-label">תאריכים:</span> ${startDateFormatted} - ${finishDateFormatted}</p><p><span class="info-label">מטלות:</span> ${tasksSummary}</p><p><span class="info-label">נוצר ב:</span> ${createdDateFormatted} על ידי <strong>${project.whoCreated || 'לא ידוע'}</strong></p><p><span class="info-label">נמחק ב:</span> ${deletedDateFormatted} על ידי <strong>${project.deletedBy || 'לא ידוע'}</strong></p><p><span class="info-label">התקדמות כללית:</span> <span style="font-weight: bold; color: ${getProgressColor(project.progress)};">${getProgressTranslation(project.progress)}</span></p><p><span class="info-label">הערות:</span> ${project.furtherNotes || 'אין'}</p><div class="project-modal-actions"><button id="modalRestoreBtn" class="auth-controlled btn btn-success">שחזר פרויקט</button></div></div>`;
        
        requestAnimationFrame(() => dom.projectModal.classList.add('visible'));
        dom.projectModal.querySelector('.project-modal-close').addEventListener('click', hideProjectModal);
        const restoreBtn = dom.projectModal.querySelector('#modalRestoreBtn');
        if (AppState.isAuthenticated && restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                restoreProject(projectId);
                hideProjectModal();
            });
        }
        updateUIForAuthState();
    }

    function hideProjectModal() { dom.projectModal.classList.remove('visible'); }

    async function restoreProject(projectId) {
        if (!projectId || !AppState.isAuthenticated) return;
        const projectToRestore = AppState.deletedProjects[projectId];
        if (projectToRestore) {
            const pToRestore = { ...projectToRestore };
            delete pToRestore.deletedAt;
            delete pToRestore.deletedBy;
            update(ref(db), {
                [`/deletedProjects/${projectId}`]: null,
                [`/projects/${projectId}`]: pToRestore
            });
        }
    }

    async function clearHistory() {
        if (!AppState.isAuthenticated) return;
        const confirmed = await showConfirmation("אישור ניקוי היסטוריה", "פעולה זו תמחק לצמיתות את כל הפרויקטים שבארכיון. האם להמשיך?");
        if (confirmed) { set(dbRefDeletedProjects, {}); }
    }

    function renderProjects() {
        dom.projectList.innerHTML = ''; const projectsArray = Object.entries(AppState.projects || {}); if (projectsArray.length === 0) { dom.projectList.innerHTML = '<li style="grid-column: 1 / -1; text-align: right; color: #888; font-style: italic; background: none; border: none; box-shadow: none; cursor: default; padding: 10px;">אין פרויקטים נוכחיים.</li>'; return; }
        projectsArray.forEach(([key, project]) => { const li = document.createElement('li'); li.dataset.projectId = key; li.innerHTML = `<strong>${project.name}</strong>`; dom.projectList.appendChild(li); });
    }

    function renderDeletedProjects() {
        const historyList = dom.projectHistoryList; historyList.innerHTML = ''; const deletedArray = Object.entries(AppState.deletedProjects || {});
        if (deletedArray.length === 0) { historyList.innerHTML = '<li style="grid-column: 1 / -1; text-align: right; color: #888; font-style: italic; background: none; border: none; box-shadow: none; cursor: default; padding: 10px;">אין פרויקטים בהיסטוריה.</li>'; return; }
        deletedArray.forEach(([key, project]) => { 
            const li = document.createElement('li'); 
            li.dataset.projectId = key; 
            li.innerHTML = `<strong>${project.name}</strong>`; 
            historyList.appendChild(li); 
        });
        updateUIForAuthState();
    }

    function clearProjectForm() {
        dom.projectNameInput.value = ''; dom.projectAddressInput.value = ''; dom.contactInfoInput.value = ''; dom.startDateInput.value = ''; dom.finishDateInput.value = '';
        renderChecklist(); dom.taskProgressSelect.value = 'Not Started'; dom.furtherNotesInput.value = ''; AppState.selectedProjectKey = null;
        dom.deleteProjectBtn.disabled = true; dom.deleteProjectBtn.style.display = 'none'; dom.addProjectBtn.textContent = 'הוסף פרויקט';
        dom.tasksDropdownGroup.classList.remove('open');
    }

    function getProgressColor(p) { return {'Not Started': '#dc3545', 'In Progress': '#ffc107', 'On Hold': '#6c757d', 'Completed': '#28a745'}[p] || '#333'; }
    function getProgressTranslation(p) { const map = {'Not Started': 'לא התחיל', 'In Progress': 'בטיפול', 'On Hold': 'בהמתנה', 'Completed': 'הושלם'}; return map[p] || p; }

    function exportProjectsToCsv() {
        const headers = ["name", "address", "contactInfo", "startDate", "finishDate", "tasks", "progress", "furtherNotes", "addedDateTime", "whoCreated", "lastEditedAt", "lastEditedBy", "deletedAt", "deletedBy"];
        let csvContent = "\uFEFF" + headers.join(",") + "\n"; 
        Object.values(AppState.projects).forEach(p => {
            const row = headers.map(header => {
                let value = p[header] || "";
                if (header === 'tasks' && typeof value === 'object') { value = `"${JSON.stringify(value).replace(/"/g, '""')}"`; }
                let stringValue = String(value);
                if (stringValue.includes(',')) { stringValue = `"${stringValue}"`; }
                return stringValue;
            });
            csvContent += row.join(",") + "\n";
        });
        const todoJsonString = JSON.stringify(AppState.todoItems).replace(/"/g, '""');
        csvContent += `__TODOLIST__,"${todoJsonString}"\n`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "projects_and_todos_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function importProjectsFromCsv(file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const csv = event.target.result;
            const lines = csv.split("\n").filter(line => line.trim());
            if(lines.length < 1) return await showConfirmation("שגיאת קובץ", "קובץ ה-CSV ריק.", "הבנתי", "btn-danger", false);
            const headers = lines.shift().split(",").map(h => h.trim());
            const newDbState = { projects: {}, deletedProjects: {}, todoItems: AppState.todoItems };

            lines.forEach(line => {
                const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
                if(values[0] === '__TODOLIST__') {
                    try { newDbState.todoItems = JSON.parse(values[1]); } catch (e) { console.error("Could not parse todoItems JSON", e); }
                } else {
                    const projectData = {};
                    headers.forEach((header, index) => {
                        let value = values[index];
                        if (header === 'tasks' && value) {
                            try { value = JSON.parse(value); } 
                            catch (e) { value = {}; }
                        }
                        projectData[header] = value;
                    });
                    const newKey = push(dbRefProjects).key;
                    newDbState.projects[newKey] = projectData;
                }
            });
            try {
                await set(ref(db, '/'), newDbState);
                await showConfirmation("הצלחה", "הנתונים יובאו בהצלחה!", "אישור", "btn-success", false);
            } catch (error) {
                await showConfirmation("שגיאה", `נכשל בייבוא הנתונים: ${error.message}`, "הבנתי", "btn-danger", false);
            }
        };
        reader.readAsText(file);
    }

    // --- 5. EVENT LISTENERS & INITIAL CALLS ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (approvedEmails.includes(user.email)) {
                AppState.currentUser = user;
                AppState.isAuthenticated = true;
                dom.loginModal.classList.remove('visible');
            } else {
                await showConfirmation("גישה נדחתה", "כתובת האימייל אינה מורשית לגשת לאפליקציה זו.", "הבנתי", "btn-secondary", false);
                auth.signOut();
            }
        } else {
            AppState.currentUser = null;
            AppState.isAuthenticated = false;
            dom.loginModal.classList.add('visible');
        }
        updateUIForAuthState();
    });

    onValue(dbRefProjects, (snapshot) => { AppState.projects = snapshot.val() || {}; renderProjects(); });
    onValue(dbRefDeletedProjects, snapshot => { AppState.deletedProjects = snapshot.val() || {}; renderDeletedProjects(); });
    onValue(dbRefTodoItems, snapshot => { AppState.todoItems = Array.isArray(snapshot.val()) ? snapshot.val() : []; renderTodoItems(); });

    dom.googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    dom.guestLoginBtn.addEventListener('click', () => { AppState.isAuthenticated = false; AppState.currentUser = null; updateUIForAuthState(); dom.loginModal.classList.remove('visible'); });
    dom.logoutBtn.addEventListener('click', handleLogout);
    
    if (dom.prevMonthBtn && dom.nextMonthBtn) {
        dom.prevMonthBtn.addEventListener('click', () => { AppState.displayedDate.setMonth(AppState.displayedDate.getMonth() - 1); generateCalendar(); });
        dom.nextMonthBtn.addEventListener('click', () => { AppState.displayedDate.setMonth(AppState.displayedDate.getMonth() + 1); generateCalendar(); });
    }

    dom.addTodoBtn.addEventListener('click', addTodo);
    dom.todoInput.addEventListener('keypress', e => e.key === 'Enter' && addTodo());
    dom.addProjectBtn.addEventListener('click', saveProject);
    dom.deleteProjectBtn.addEventListener('click', deleteProject);
    dom.clearHistoryBtn.addEventListener('click', clearHistory);
    dom.projectList.addEventListener('click', (event) => { const listItem = event.target.closest('li'); if (!listItem) return; const projectId = listItem.dataset.projectId; if (AppState.projects[projectId]) showProjectModal(projectId, AppState.projects[projectId]); });
    dom.startDateInput.addEventListener('click', openDatePicker);
    dom.finishDateInput.addEventListener('click', openDatePicker);
    dom.projectHistoryList.addEventListener('click', (event) => {
        const listItem = event.target.closest('li');
        if (!listItem) return;
        const projectId = listItem.dataset.projectId;
        if (AppState.deletedProjects[projectId]) {
            showDeletedProjectModal(projectId, AppState.deletedProjects[projectId]);
        }
    });
    dom.tasksDropdownButton.addEventListener('click', (e) => { e.stopPropagation(); dom.tasksDropdownGroup.classList.toggle('open'); });
    dom.tasksDropdownButton.addEventListener('keypress', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); dom.tasksDropdownGroup.classList.toggle('open'); } });
    dom.tasksChecklistContainer.addEventListener('change', e => { 
        if (e.target.type === 'checkbox' && AppState.currentUser) { 
            const tsSpan = e.target.closest('.task-item').querySelector('.task-timestamp'); 
            if (e.target.checked) { 
                const now = new Date(); 
                e.target.dataset.timestamp = now.toISOString();
                e.target.dataset.user = AppState.currentUser.displayName;
                tsSpan.textContent = `${AppState.currentUser.displayName} - ${now.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
            } else { 
                e.target.dataset.timestamp = '';
                e.target.dataset.user = '';
                tsSpan.textContent = ''; 
            } 
            updateTasksButtonText(); 
        } 
    });
    datePickerModal.querySelector('.prev-month').addEventListener('click', () => { AppState.pickerDate.setMonth(AppState.pickerDate.getMonth() - 1); renderDatePicker(); });
    datePickerModal.querySelector('.next-month').addEventListener('click', () => { AppState.pickerDate.setMonth(AppState.pickerDate.getMonth() + 1); renderDatePicker(); });
    datePickerModal.querySelector('.date-picker-grid-days').addEventListener('click', (event) => { const dayEl = event.target.closest('.date-picker-day:not(.empty)'); if (dayEl && AppState.activeDateInput) { const day = dayEl.dataset.day; const selectedDate = new Date(AppState.pickerDate.getFullYear(), AppState.pickerDate.getMonth(), day); AppState.activeDateInput.value = formatDate(selectedDate); hideDatePicker(); } });
    document.addEventListener('click', (event) => {
        if (datePickerModal.style.display === 'block' && !datePickerModal.contains(event.target) && !event.target.classList.contains('date-input')) { hideDatePicker(); }
        if (dom.tasksDropdownGroup.classList.contains('open') && !dom.tasksDropdownGroup.contains(event.target)) { dom.tasksDropdownGroup.classList.remove('open'); }
    });
    
    dom.toggleHistoryBtn.addEventListener('click', (e) => { 
        const isCollapsed = dom.projectHistoryList.classList.toggle('collapsed');
        document.querySelector('.clear-history-btn-wrapper').classList.toggle('collapsed');
        e.currentTarget.innerHTML = isCollapsed ? '+' : '&#x2212;'; 
    });
    dom.dataMgmtBtn.addEventListener('click', () => dataActionModal.classList.add('visible'));
    document.getElementById('dataActionCancelBtn').addEventListener('click', () => dataActionModal.classList.remove('visible'));
    document.getElementById('dataActionExportBtn').addEventListener('click', () => {
        dataActionModal.classList.remove('visible');
        exportProjectsToCsv();
    });
    document.getElementById('dataActionImportBtn').addEventListener('click', async () => {
        dataActionModal.classList.remove('visible');
        const confirmed = await showConfirmation("אזהרה: פעולה הרסנית", "ייבוא קובץ יחליף לצמיתות את כל הנתונים הנוכחיים. האם אתה בטוח שברצונך להמשיך?", "כן, יבא את הקובץ", "btn-danger");
        if(confirmed) { dom.csvFileInput.click(); }
    });
    dom.csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) { importProjectsFromCsv(file); }
    });

    updateTime();
    setInterval(updateTime, 1000); 
    generateCalendar();
    clearProjectForm();
});
