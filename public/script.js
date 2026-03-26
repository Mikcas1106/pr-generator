let currentStep = 0;
const totalSteps = 7;

function updateCarousel() {
    const container = document.getElementById('carousel-container');
    container.style.transform = `translateX(-${currentStep * (100 / totalSteps)}%)`;
    
    // Update dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentStep);
    });

    // Update buttons
    document.getElementById('carousel-prev').style.display = currentStep === 0 ? 'none' : 'block';
    document.getElementById('carousel-next').style.display = currentStep === totalSteps - 1 ? 'none' : 'block';
    document.getElementById('carousel-finish').style.display = currentStep === totalSteps - 1 ? 'block' : 'none';
}

function nextStep() {
    if (currentStep < totalSteps - 1) {
        currentStep++;
        updateCarousel();
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        updateCarousel();
    }
}

function openManual() {
    currentStep = 0;
    updateCarousel();
    document.getElementById('onboarding-modal').style.display = 'flex';
}

function finishOnboarding() {
    document.getElementById('onboarding-modal').style.display = 'none';
    localStorage.setItem('onboarding_complete', 'true');
}

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const iconPool = [
        { icon: 'fa-php', color: '#777bb3' },
        { icon: 'fa-laravel', color: '#ff2d20' },
        { icon: 'fa-js', color: '#f7df1e' },
        { icon: 'fa-python', color: '#3776ab' },
        { icon: 'fa-react', color: '#61dafb' },
        { icon: 'fa-docker', color: '#2496ed' },
        { icon: 'fa-node-js', color: '#339933' },
        { icon: 'fa-github', color: '#ffffff' },
        { icon: 'fa-gitlab', color: '#fc6d26' },
        { icon: 'fa-rust', color: '#dea584' },
        { icon: 'fa-java', color: '#007396' },
        { icon: 'fa-golang', color: '#00add8' },
        { icon: 'fa-file-csv', color: '#1d6f42' }
    ];

    for (let i = 0; i < 45; i++) {
        const p = document.createElement('div');
        const isIcon = Math.random() > 0.5;
        
        if (isIcon) {
            const poolItem = iconPool[Math.floor(Math.random() * iconPool.length)];
            p.className = 'dev-icon';
            p.innerHTML = `<i class="fab ${poolItem.icon}"></i>`;
            p.style.color = poolItem.color;
        } else {
            p.className = 'particle';
            const size = Math.random() * 3 + 1;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
        }
        
        p.style.left = `${Math.random() * 100}%`;
        p.style.animationDelay = `${Math.random() * 25}s`;
        p.style.animationDuration = `${15 + Math.random() * 30}s`;
        container.appendChild(p);
    }
}

function loadState() {
    const saved = localStorage.getItem('pr_generator_state');
    if (saved) {
        const state = JSON.parse(saved);
        document.getElementById('employeeName').value = state.employeeName || '';
        document.getElementById('employeeId').value = state.employeeId || '';
        document.getElementById('author').value = state.author || '';
        document.getElementById('since').value = state.since || '';
        document.getElementById('until').value = state.until || '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initParticles();

    if (!localStorage.getItem('onboarding_complete')) {
        document.getElementById('onboarding-modal').style.display = 'flex';
    }

    document.getElementById('carousel-next').addEventListener('click', nextStep);
    document.getElementById('carousel-prev').addEventListener('click', prevStep);
    document.getElementById('carousel-finish').addEventListener('click', finishOnboarding);

    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmOk = document.getElementById('confirm-ok');
    const confirmCancel = document.getElementById('confirm-cancel');
    let confirmCallback = null;

    window.showConfirm = function(title, message, callback) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmCallback = callback;
        confirmModal.style.display = 'flex';
    };

    confirmCancel.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        confirmCallback = null;
    });

    confirmOk.addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        confirmModal.style.display = 'none';
        confirmCallback = null;
    });

    // Close on overlay click
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.style.display = 'none';
            confirmCallback = null;
        }
    });
});

function showTab(tab, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    
    const content = document.getElementById(`tab-${tab}`);
    if (content) content.classList.add('active');

    const activeBtn = btn || document.querySelector(`.tabs button[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

const statusLog = document.getElementById('status-log');

function log(msg, type = 'info') {
    statusLog.textContent = msg;
    statusLog.className = 'status-log';
    if (type === 'success') statusLog.classList.add('status-success');
    if (type === 'error') statusLog.classList.add('status-error');
}

let globalProjects = [];

function getAvailableProjects() {
    return globalProjects.filter(p => p.projectName.trim() !== '');
}

function updateAllTaskProjectDropdowns() {
    const projects = getAvailableProjects();
    const modalSelect = document.getElementById('modal-taskProject');
    if (modalSelect) {
        let html = '<option value="">-- No Project (Global) --</option>';
        projects.forEach(p => {
            html += `<option value="${p.projectName}" data-supervisor="${p.supervisorName}">${p.projectName}</option>`;
        });
        modalSelect.innerHTML = html;
    }
}

let globalDefaultTasks = [];

async function saveState() {
    const state = {
        employeeName: document.getElementById('employeeName').value,
        employeeId: document.getElementById('employeeId').value,
        author: document.getElementById('author').value,
        since: document.getElementById('since').value,
        until: document.getElementById('until').value,
        defaultTasks: globalDefaultTasks,
        projects: globalProjects
    };
    
    // Primary: Local Storage
    localStorage.setItem('pr_generator_state', JSON.stringify(state));

    // Secondary: Server Mirror
    try {
        await fetch('http://localhost:3001/save-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
    } catch (e) {
        console.error("Server sync failed:", e);
    }
}

async function loadState() {
    // 1. Load from Primary (Local Storage) for immediate UI response
    const localSaved = localStorage.getItem('pr_generator_state');
    let state = localSaved ? JSON.parse(localSaved) : null;
    let serverDataUsed = false;

    // 2. Fetch from Secondary (Server Mirror) for recovery/persistence
    try {
        const resp = await fetch('http://localhost:3001/get-config');
        const result = await resp.json();
        
        if (result.success && result.data) {
            // If Local Storage is empty (new browser/cache cleared), use server data
            if (!state) {
                state = result.data;
                serverDataUsed = true;
                log("Data recovered from server backup.", "success");
            }
        } else if (state) {
            // First run migration: Local exists but Server doesn't
            // Sync local data to server immediately
            saveState();
        }
    } catch (e) {
        console.error("Server load failed:", e);
    }

    if (!state) return;

    // Populate UI
    document.getElementById('employeeName').value = state.employeeName || '';
    document.getElementById('employeeId').value = state.employeeId || '';
    document.getElementById('author').value = state.author || '';
    document.getElementById('since').value = state.since || '';
    document.getElementById('until').value = state.until || '';

    globalProjects = state.projects || [];
    globalDefaultTasks = state.defaultTasks || [];

    renderProjectsTable();
    renderDefaultTasksTable();
    updateAllTaskProjectDropdowns();

    // If we recovered from server, ensure localStorage is also updated
    if (serverDataUsed) {
        localStorage.setItem('pr_generator_state', JSON.stringify(state));
    }
}

function renderDefaultTasksTable() {
    const container = document.getElementById('default-tasks-table-body');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (globalDefaultTasks.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 3rem; opacity:0.5;">No recurring tasks configured. Add one to automate your reports!</td></tr>';
        return;
    }

    const dayMap = { '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', 'all': 'Daily' };
    const typeLabels = {
        'normal': 'Normal',
        'meeting': '🏠 Meeting',
        'database': '💾 DB/Srvr',
        'holiday': '🎉 Holiday',
        'leave': '🌴 Leave'
    };

    globalDefaultTasks.forEach((task, index) => {
        const tr = document.createElement('tr');
        const isActive = task.taskEnabled !== false;
        
        tr.innerHTML = `
            <td>
                <div style="font-weight: 600;">${task.taskName}</div>
                <div style="font-size: 0.75rem; opacity: 0.5;">${task.taskRemarks || 'No default remarks'}</div>
            </td>
            <td><span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-main); border-color: var(--border);">${dayMap[task.taskDay] || task.taskDay}</span></td>
            <td>${task.taskProject || '<span style="opacity:0.3">Global</span>'}</td>
            <td>${typeLabels[task.taskType] || task.taskType}</td>
            <td style="text-align: right;">
                <span class="badge" style="background: ${isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${isActive ? 'var(--success)' : 'var(--error)'}; border-color: ${isActive ? 'var(--success)' : 'var(--error)'};">
                    ${isActive ? 'Active' : 'Disabled'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button type="button" class="btn-icon" onclick="openTaskModal(${index})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn-icon delete" onclick="removeDefaultTask(${index})" title="Remove"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        container.appendChild(tr);
    });
    filterDefaultTasksTable();
}

function filterDefaultTasksTable() {
    const query = (document.getElementById('defaults-search')?.value || '').toLowerCase().trim();
    document.querySelectorAll('#default-tasks-table-body tr').forEach(tr => {
        if (!query) { tr.style.display = ''; return; }
        const text = tr.innerText.toLowerCase();
        tr.style.display = text.includes(query) ? '' : 'none';
    });
}

function openTaskModal(index = -1) {
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('task-modal-title');
    const form = document.getElementById('task-modal-form');
    
    updateAllTaskProjectDropdowns(); // Refresh projects
    form.reset();
    document.getElementById('modal-task-index').value = index;
    
    if (index >= 0) {
        title.innerHTML = '<i class="fas fa-calendar-check"></i> Edit Recurring Task';
        const t = globalDefaultTasks[index];
        document.getElementById('modal-taskName').value = t.taskName;
        document.getElementById('modal-taskDay').value = t.taskDay;
        document.getElementById('modal-taskType').value = t.taskType;
        document.getElementById('modal-taskProject').value = t.taskProject || '';
        document.getElementById('modal-taskRemarks').value = t.taskRemarks || '';
        document.getElementById('modal-taskEnabled').checked = t.taskEnabled !== false;
        document.getElementById('modal-taskOnlyIfProjectActive').checked = t.taskOnlyIfProjectActive === true;
    } else {
        title.innerHTML = '<i class="fas fa-calendar-plus"></i> Add New Recurring Task';
    }
    
    modal.style.display = 'flex';
}

function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
}

function removeDefaultTask(index) {
    const task = globalDefaultTasks[index];
    showConfirm('Remove Task', `Are you sure you want to remove the recurring task "${task.taskName}"?`, () => {
        globalDefaultTasks.splice(index, 1);
        saveState();
        renderDefaultTasksTable();
    });
}

function renderProjectsTable() {
    const container = document.getElementById('projects-table-body');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (globalProjects.length === 0) {
        container.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 3rem; opacity:0.5;">No projects found. Add one to get started!</td></tr>';
        return;
    }

    globalProjects.forEach((proj, index) => {
        const tr = document.createElement('tr');
        const isActive = proj.projectEnabled !== false;
        tr.innerHTML = `
            <td>
                <div style="font-weight: 600;">${proj.projectName}</div>
                <div style="font-size: 0.75rem; opacity: 0.5;">${proj.repoPath}</div>
            </td>
            <td>${proj.supervisorName}</td>
            <td><i class="fab fa-${proj.repoPlatform}"></i> ${proj.repoPlatform.charAt(0).toUpperCase() + proj.repoPlatform.slice(1)}</td>
            <td>${proj.repoWorkspace || 'N/A'} / ${proj.repoName || 'N/A'}</td>
            <td style="text-align: right;">
                <span class="badge" style="background: ${isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${isActive ? 'var(--success)' : 'var(--error)'}; border-color: ${isActive ? 'var(--success)' : 'var(--error)'};">
                    ${isActive ? 'Active' : 'Disabled'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button type="button" class="btn-icon" onclick="openProjectModal(${index})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn-icon delete" onclick="removeProject(${index})" title="Remove"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        container.appendChild(tr);
    });
    filterProjectsTable();
}

function filterProjectsTable() {
    const query = (document.getElementById('project-search')?.value || '').toLowerCase().trim();
    document.querySelectorAll('#projects-table-body tr').forEach(tr => {
        if (!query) { tr.style.display = ''; return; }
        const text = tr.innerText.toLowerCase();
        tr.style.display = text.includes(query) ? '' : 'none';
    });
}

// Removed renderActiveProjectsList as per new layout UI simplification

function openProjectModal(index = -1) {
    const modal = document.getElementById('project-modal');
    const title = document.getElementById('project-modal-title');
    const form = document.getElementById('project-modal-form');
    
    // Reset form
    form.reset();
    document.getElementById('modal-project-index').value = index;
    
    if (index >= 0) {
        title.innerHTML = '<i class="fas fa-edit"></i> Edit Project Details';
        const p = globalProjects[index];
        document.getElementById('modal-repoPath').value = p.repoPath;
        document.getElementById('modal-projectName').value = p.projectName;
        document.getElementById('modal-supervisorName').value = p.supervisorName;
        document.getElementById('modal-repoPlatform').value = p.repoPlatform;
        document.getElementById('modal-repoWorkspace').value = p.repoWorkspace || '';
        document.getElementById('modal-repoName').value = p.repoName || '';
        document.getElementById('modal-projectEnabled').checked = p.projectEnabled !== false;
    } else {
        title.innerHTML = '<i class="fas fa-folder-plus"></i> Add New Project';
        document.getElementById('modal-projectEnabled').checked = true;
    }
    
    modal.style.display = 'flex';
}

function closeProjectModal() {
    document.getElementById('project-modal').style.display = 'none';
}

function removeProject(index) {
    const proj = globalProjects[index];
    showConfirm('Remove Project', `Are you sure you want to remove "${proj.projectName}"?`, () => {
        globalProjects.splice(index, 1);
        saveState();
        renderProjectsTable();
        updateAllTaskProjectDropdowns();
    });
}

// Global modal submit handler
document.addEventListener('DOMContentLoaded', () => {
    const projectForm = document.getElementById('project-modal-form');
    if (projectForm) {
        projectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const index = parseInt(document.getElementById('modal-project-index').value);
            const data = {
                repoPath: document.getElementById('modal-repoPath').value,
                projectName: document.getElementById('modal-projectName').value,
                supervisorName: document.getElementById('modal-supervisorName').value,
                repoPlatform: document.getElementById('modal-repoPlatform').value,
                repoWorkspace: document.getElementById('modal-repoWorkspace').value,
                repoName: document.getElementById('modal-repoName').value,
                projectEnabled: document.getElementById('modal-projectEnabled').checked
            };

            if (index >= 0) {
                globalProjects[index] = data;
            } else {
                globalProjects.push(data);
            }

            saveState();
            renderProjectsTable();
            closeProjectModal();
            updateAllTaskProjectDropdowns();
            log(`Project "${data.projectName}" saved successfully.`, 'success');
        });
    }
 
    const addBtn = document.getElementById('open-add-project-modal');
    if (addBtn) addBtn.addEventListener('click', () => openProjectModal());
    
    // Task modal submit handler
    const taskForm = document.getElementById('task-modal-form');
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const index = parseInt(document.getElementById('modal-task-index').value);
            const data = {
                taskName: document.getElementById('modal-taskName').value,
                taskDay: document.getElementById('modal-taskDay').value,
                taskType: document.getElementById('modal-taskType').value,
                taskProject: document.getElementById('modal-taskProject').value,
                taskRemarks: document.getElementById('modal-taskRemarks').value,
                taskEnabled: document.getElementById('modal-taskEnabled').checked,
                taskOnlyIfProjectActive: document.getElementById('modal-taskOnlyIfProjectActive').checked,
            };
 
            if (index >= 0) {
                globalDefaultTasks[index] = data;
            } else {
                globalDefaultTasks.push(data);
            }
 
            saveState();
            renderDefaultTasksTable();
            closeTaskModal();
            log(`Task "${data.taskName}" saved successfully.`, 'success');
        });
    }
 
    const addTaskBtn = document.getElementById('open-add-task-modal');
    if (addTaskBtn) addTaskBtn.addEventListener('click', () => openTaskModal());
 
    // Close modal on escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProjectModal();
            closeTaskModal();
        }
    });
 
    // Close on overlay click
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProjectModal();
        });
    }
 
    const taskModal = document.getElementById('task-modal');
    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) closeTaskModal();
        });
    }

    // Attach Search Handlers
    const projectSearch = document.getElementById('project-search');
    if (projectSearch) projectSearch.addEventListener('input', filterProjectsTable);

    const defaultsSearch = document.getElementById('defaults-search');
    if (defaultsSearch) defaultsSearch.addEventListener('input', filterDefaultTasksTable);
});

function updateDefaultFilename() {
    const name = document.getElementById('employeeName').value.trim();
    const untilDate = document.getElementById('until').value;

    if (!name && !untilDate) return 'report';

    let formattedName = name;
    if (name.includes(' ') && !name.includes(',')) {
        const parts = name.split(' ');
        const last = parts.pop();
        const first = parts.join(' ');
        formattedName = `${last}, ${first}`;
    }

    let datePart = '';
    if (untilDate) {
        const [y, m, d] = untilDate.split('-');
        datePart = ` - ${m}.${d}`;
    }

    return `PR - ${formattedName}${datePart}`;
}

// Clean up old function
function addProjectEntry() {
    console.warn("addProjectEntry is deprecated. Use the Projects List tab.");
}

// Deprecated old function
function addDefaultTaskEntry() {
    console.warn("addDefaultTaskEntry is deprecated. Use the Defaults tab table.");
}

// Deprecated old button logic
const oldAddTaskBtn = document.getElementById('add-default-task');
if (oldAddTaskBtn) oldAddTaskBtn.style.display = 'none';

// Auto-save global inputs
['employeeName', 'employeeId', 'author', 'since', 'until', 'holidayDates'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', saveState);
});

// Load state on start
window.addEventListener('DOMContentLoaded', loadState);

// Smart Date Shortcuts — Week of current month (Mon–Fri)
let loadingInterval = null;
const loadingMessages = [
    "Initializing Git engine...",
    "Scanning local repositories...",
    "Cloning metadata...",
    "Filtering authors...",
    "Analyzing commits...",
    "Detecting holidays...",
    "Calculating progress...",
    "Almost there...",
    "Finalizing report layout..."
];

function startLoadingAnimation(title = "Processing Repositories") {
    const modal = document.getElementById('loading-modal');
    const bar = document.getElementById('progress-bar');
    const status = document.getElementById('loading-status');
    const titleEl = document.getElementById('loading-title');
    const techIcon = document.getElementById('loader-tech-icon');
    
    titleEl.textContent = title;
    modal.style.display = 'flex';
    bar.style.width = '0%';
    
    let progress = 0;
    let msgIndex = 0;
    let iconIndex = 0;
    
    const loaderIcons = [
        { icon: 'fa-microchip', color: 'var(--primary)', type: 'fas' },
        { icon: 'fa-php', color: '#777bb3', type: 'fab' },
        { icon: 'fa-laravel', color: '#ff2d20', type: 'fab' },
        { icon: 'fa-python', color: '#3776ab', type: 'fab' },
        { icon: 'fa-js', color: '#f7df1e', type: 'fab' },
        { icon: 'fa-react', color: '#61dafb', type: 'fab' },
        { icon: 'fa-docker', color: '#2496ed', type: 'fab' },
        { icon: 'fa-node-js', color: '#339933', type: 'fab' },
        { icon: 'fa-rust', color: '#dea584', type: 'fab' }
    ];
    
    loadingInterval = setInterval(() => {
        // Slowing down animation
        if (progress < 40) progress += Math.random() * 5;
        else if (progress < 70) progress += Math.random() * 2;
        else if (progress < 95) progress += Math.random() * 0.5;
        
        bar.style.width = `${progress}%`;
        
        // Rotate messages every few seconds
        if (Math.random() > 0.9) {
            msgIndex = (msgIndex + 1) % loadingMessages.length;
            status.textContent = loadingMessages[msgIndex];
        }

        // Smooth Icon Swap
        if (Math.random() > 0.9) { // ~Every 1.5sec
            iconIndex = (iconIndex + 1) % loaderIcons.length;
            const item = loaderIcons[iconIndex];

            techIcon.classList.add('swapping');
            
            setTimeout(() => {
                techIcon.innerHTML = `<i class="${item.type} ${item.icon}"></i>`;
                techIcon.style.color = item.color;
                techIcon.style.filter = `drop-shadow(0 0 20px ${item.color})`;
                techIcon.classList.remove('swapping');
            }, 500);
        }
    }, 150);
}

function stopLoadingAnimation() {
    const modal = document.getElementById('loading-modal');
    const bar = document.getElementById('progress-bar');
    
    clearInterval(loadingInterval);
    bar.style.width = '100%';
    
    setTimeout(() => {
        modal.style.display = 'none';
        bar.style.width = '0%';
    }, 400);
}

document.querySelectorAll('.btn-shortcut').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const range = e.target.getAttribute('data-range');
        const today = new Date();

        // Find the first Monday of the current month
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const dayOfWeek = firstOfMonth.getDay(); // 0=Sun, 1=Mon...
        // Days to advance to reach the first Monday (0 if already Monday)
        const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
        const firstMonday = new Date(firstOfMonth);
        firstMonday.setDate(firstOfMonth.getDate() + daysToMonday);

        const weekNum = parseInt(range.split('-')[1]) - 1; // 0-indexed
        const since = new Date(firstMonday);
        since.setDate(firstMonday.getDate() + weekNum * 7);

        const until = new Date(since);
        until.setDate(since.getDate() + 4); // Friday

        // Use local date formatting (NOT toISOString which is UTC and shifts dates in UTC+8)
        const fmt = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        document.getElementById('since').value = fmt(since);
        document.getElementById('until').value = fmt(until);
        saveState();
    });
});

let currentPreviewData = [];

async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    log("Fetching data for preview...", "info");

    const since = document.getElementById('since').value;
    const until = document.getElementById('until').value;
    const activeProjects = globalProjects.filter(p => p.projectEnabled !== false);
    const projects = activeProjects.map(p => {
        const platform = p.repoPlatform;
        const workspace = p.repoWorkspace;
        const repoName = p.repoName;
        let baseUrl = '';
        if (workspace && repoName) {
            baseUrl = platform === 'bitbucket' ? `https://bitbucket.org/${workspace}/${repoName}/commits/` : `https://github.com/${workspace}/${repoName}/commit/`;
        }
        return {
            repoPath: p.repoPath,
            projectName: p.projectName,
            supervisorName: p.supervisorName,
            baseUrl: baseUrl
        };
    });

    if (!since || !until) {
        log('Please select both start and end dates', 'error');
        return;
    }

    const data = {
        since, until, author: document.getElementById('author').value,
        projects,
        defaultTasks: globalDefaultTasks.map(t => {
            const proj = globalProjects.find(p => p.projectName === t.taskProject);
            return {
                ...t,
                taskSupervisor: proj ? proj.supervisorName : ''
            };
        }).filter(t => {
            const isBasicEnabled = t.taskName.trim() !== '' && t.taskEnabled;
            if (!isBasicEnabled) return false;
            // If task is specific to a project, check if that project is enabled
            if (t.taskProject) {
                const proj = globalProjects.find(p => p.projectName === t.taskProject);
                if (proj && proj.projectEnabled === false) return false;
            }
            return true;
        })
    };

    startLoadingAnimation("Analyzing History");
    try {
        const response = await fetch('http://localhost:3001/preview-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            currentPreviewData = result.data.map(row => ({ ...row, included: true }));
            renderPreviewTable();
            document.getElementById('preview-modal').style.display = 'flex';
            log("Preview ready. Review and export when done.", "success");
        } else {
            log(result.message, "error");
        }
    } catch (err) {
        log("Error: " + err.message, "error");
    } finally {
        stopLoadingAnimation();
    }
}

function renderPreviewTable() {
    const body = document.getElementById('preview-body');
    body.innerHTML = '';
    currentPreviewData.forEach((row, index) => {
        const isEmptyDay = row.taskType === 'empty';
        if (isEmptyDay && row.included === undefined) row.included = false;

        const tr = document.createElement('tr');
        tr.setAttribute('data-index', index);
        tr.className = `type-${row.taskType}`;
        if (!row.included) tr.classList.add('row-excluded');

        if (isEmptyDay) {
            tr.innerHTML = `
                <td></td>
                <td>${row.dateFmt}</td>
                <td>
                    <span style="display:inline-flex; align-items:center; gap:0.5rem;">
                        ⚠️ <strong>No entries for this day</strong>
                        <span style="background:rgba(245,158,11,0.2); color:#f59e0b; padding:2px 8px; border-radius:20px; font-size:0.75rem; font-style:normal;">EMPTY DAY</span>
                    </span>
                </td>
                <td colspan="4" style="opacity:0.4; font-size:0.8rem;">Add a commit or default task for this date</td>
            `;
        } else {
            const typeOptions = [
                { value: 'normal',   label: 'Normal',      color: 'var(--text-muted)' },
                { value: 'meeting',  label: '🏠 Meeting',  color: '#4da6ff' },
                { value: 'database', label: '💾 Database', color: '#9ca3af' },
                { value: 'holiday',  label: '🎉 Holiday',  color: '#10b981' },
                { value: 'leave',    label: '🌴 Leave',    color: '#fb923c' },
            ];
            const optionsHtml = typeOptions.map(o =>
                `<option value="${o.value}" ${row.taskType === o.value ? 'selected' : ''}>${o.label}</option>`
            ).join('');

            const gitUrl = (row.hash && row.repoPlatform && row.repoWorkspace && row.repoName) ? (
                row.repoPlatform === 'bitbucket' 
                    ? `https://bitbucket.org/${row.repoWorkspace}/${row.repoName}/commits/${row.hash}`
                    : `https://github.com/${row.repoWorkspace}/${row.repoName}/commit/${row.hash}`
            ) : null;

            tr.innerHTML = `
                <td style="text-align: center; vertical-align: middle;">
                    <input type="checkbox" class="row-include" ${row.included ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                </td>
                <td>${row.dateFmt}</td>
                <td>
                    <div style="display: flex; align-items: start; gap: 0.8rem;">
                        <span style="flex: 1;">${row.subject}</span>
                        ${gitUrl ? `
                            <a href="${gitUrl}" target="_blank" class="commit-link" title="Source: ${row.hash.substring(0,8)}">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        ` : ''}
                    </div>
                </td>
                <td>${row.projectName}</td>
                <td>${row.supervisorName}</td>
                <td>
                    <select class="row-type" style="width:100%; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:inherit; border-radius:6px; padding:0.3rem 0.5rem; font-size:0.82rem; font-family:inherit; cursor:pointer;">
                        ${optionsHtml}
                    </select>
                </td>
                <td>
                    <textarea class="row-remarks" placeholder="Add remarks..." rows="1" style="height:auto; overflow-y:hidden; resize:none;">${row.remarks}</textarea>
                </td>
            `;
            tr.querySelector('.row-include').addEventListener('change', (e) => {
                currentPreviewData[index].included = e.target.checked;
                tr.classList.toggle('row-excluded', !e.target.checked);
                updatePreviewCount();
            });
            tr.querySelector('.row-type').addEventListener('change', (e) => {
                currentPreviewData[index].taskType = e.target.value;
                tr.className = `type-${e.target.value}`;
                if (!currentPreviewData[index].included) tr.classList.add('row-excluded');
            });
            const remarksArea = tr.querySelector('.row-remarks');
            const autoGrow = (el) => {
                el.style.height = 'auto';
                el.style.height = (el.scrollHeight) + 'px';
            };
            
            // Initial sizing
            autoGrow(remarksArea);

            remarksArea.addEventListener('input', (e) => {
                currentPreviewData[index].remarks = e.target.value;
                autoGrow(e.target);
            });
        }
        body.appendChild(tr);
    });
    filterPreviewTable(); // apply any active search after re-render
    updatePreviewCount();
}

function filterPreviewTable() {
    const query = (document.getElementById('preview-search')?.value || '').toLowerCase().trim();
    const clearBtn = document.getElementById('preview-search-clear');
    if (clearBtn) clearBtn.style.display = query ? 'inline' : 'none';

    document.querySelectorAll('#preview-body tr').forEach(tr => {
        if (!query) { tr.style.display = ''; return; }
        const idx = parseInt(tr.getAttribute('data-index'));
        const row = currentPreviewData[idx];
        if (!row) { tr.style.display = ''; return; }
        const haystack = `${row.dateFmt} ${row.subject} ${row.projectName} ${row.supervisorName} ${row.remarks}`.toLowerCase();
        tr.style.display = haystack.includes(query) ? '' : 'none';
    });
}

function updatePreviewCount() {
    const emptyDays = currentPreviewData.filter(r => r.taskType === 'empty');
    const included = currentPreviewData.filter(r => r.included && r.taskType !== 'empty').length;
    const total = currentPreviewData.filter(r => r.taskType !== 'empty').length;
    const el = document.getElementById('preview-row-count');
    if (!el) return;
    let text = `${included} of ${total} rows included in export`;
    if (emptyDays.length > 0) {
        text += ` &nbsp;·&nbsp; <span style="color:#f59e0b;">⚠️ ${emptyDays.length} empty day${emptyDays.length > 1 ? 's' : ''} detected</span>`;
    }
    el.innerHTML = text;
}

document.getElementById('select-all-preview').addEventListener('change', (e) => {
    const checked = e.target.checked;
    currentPreviewData.forEach(row => {
        if (row.taskType !== 'empty') row.included = checked;
    });
    renderPreviewTable();
    updatePreviewCount();
});

// Wire up live search
window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('preview-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterPreviewTable);
    }

    // Show Release Notes for V2.0 on every load (User request: "always pop up")
    const releaseModal = document.getElementById('release-notes-modal');
    if (releaseModal) {
        releaseModal.style.display = 'flex';
    }
});

document.getElementById('export-btn').addEventListener('click', async () => {
    // Always exclude empty-day warning rows from the export
    const includedData = currentPreviewData.filter(row => row.included && row.taskType !== 'empty');
    if (includedData.length === 0) {
        alert("Please include at least one row in the report.");
        return;
    }

    const outputFilename = updateDefaultFilename();
    const data = {
        employeeName: document.getElementById('employeeName').value,
        employeeId: document.getElementById('employeeId').value,
        outputFilename: outputFilename,
        reportData: includedData
    };

    log("Generating Excel file...", "info");
    startLoadingAnimation("Exporting Excel");
    try {
        const response = await fetch('http://localhost:3001/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Export failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${outputFilename}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        log("Report downloaded successfully!", "success");
        document.getElementById('success-message').textContent = "Your report has been generated and downloaded directly to your browser.";
        document.getElementById('success-modal').style.display = 'flex';
    } catch (err) {
        log("Export Error: " + err.message, "error");
    } finally {
        stopLoadingAnimation();
    }
});

// Generate Report Form
document.getElementById('report-form').addEventListener('submit', handleFormSubmit);
