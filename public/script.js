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

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('onboarding_complete')) {
        document.getElementById('onboarding-modal').style.display = 'flex';
    }

    document.getElementById('carousel-next').addEventListener('click', nextStep);
    document.getElementById('carousel-prev').addEventListener('click', prevStep);
    document.getElementById('carousel-finish').addEventListener('click', finishOnboarding);
});

function showTab(tab, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tab}`).classList.add('active');

    // btn is passed explicitly from HTML (onclick="showTab('x', this)")
    // or resolved here when called programmatically
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

function getAvailableProjects() {
    return Array.from(document.querySelectorAll('.project-entry')).map(entry => ({
        projectName: entry.querySelector('.projectName').value,
        supervisorName: entry.querySelector('.supervisorName').value
    })).filter(p => p.projectName.trim() !== '');
}

function updateAllTaskProjectDropdowns() {
    const projects = getAvailableProjects();
    document.querySelectorAll('.default-task-entry').forEach(entry => {
        const select = entry.querySelector('.taskProject');
        const supervisorInput = entry.querySelector('.taskSupervisor');
        const currentVal = select.getAttribute('data-value') || select.value;
        
        let html = '<option value="">-- Select Project --</option>';
        projects.forEach(p => {
            html += `<option value="${p.projectName}" ${p.projectName === currentVal ? 'selected' : ''} data-supervisor="${p.supervisorName}">${p.projectName}</option>`;
        });
        select.innerHTML = html;
        select.setAttribute('data-value', select.value);

        // Update supervisor
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.value) {
            supervisorInput.value = selectedOption.getAttribute('data-supervisor') || '';
        }
    });
}

function saveState() {
    const projectEntries = document.querySelectorAll('.project-entry');
    const projects = Array.from(projectEntries).map(entry => ({
        repoPath: entry.querySelector('.repoPath').value,
        projectName: entry.querySelector('.projectName').value,
        supervisorName: entry.querySelector('.supervisorName').value,
        repoPlatform: entry.querySelector('.repoPlatform').value,
        repoWorkspace: entry.querySelector('.repoWorkspace').value,
        repoName: entry.querySelector('.repoName').value
    }));

    const state = {
        employeeName: document.getElementById('employeeName').value,
        employeeId: document.getElementById('employeeId').value,
        author: document.getElementById('author').value,
        since: document.getElementById('since').value,
        until: document.getElementById('until').value,
        defaultTasks: Array.from(document.querySelectorAll('.default-task-entry')).map(entry => ({
            taskName: entry.querySelector('.taskName').value,
            taskDay: entry.querySelector('.taskDay').value,
            taskProject: entry.querySelector('.taskProject').value,
            taskSupervisor: entry.querySelector('.taskSupervisor').value,
            taskRemarks: entry.querySelector('.taskRemarks').value,
            taskEnabled: entry.querySelector('.taskEnabled').checked,
            taskType: entry.querySelector('.taskType').value
        })),
        projects: projects
    };
    localStorage.setItem('pr_generator_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('pr_generator_state');
    if (!saved) return;

    const state = JSON.parse(saved);
    document.getElementById('employeeName').value = state.employeeName || '';
    document.getElementById('employeeId').value = state.employeeId || '';
    document.getElementById('author').value = state.author || '';
    document.getElementById('since').value = state.since || '';
    document.getElementById('until').value = state.until || '';

    if (state.defaultTasks && state.defaultTasks.length > 0) {
        const container = document.getElementById('default-tasks-container');
        container.innerHTML = '';
        state.defaultTasks.forEach(task => {
            addDefaultTaskEntry(task);
        });
    } else {
        addDefaultTaskEntry();
    }

    if (state.projects && state.projects.length > 0) {
        const container = document.getElementById('projects-container');
        container.innerHTML = ''; // Clear default
        state.projects.forEach((proj, index) => {
            addProjectEntry(proj);
        });
    }

    updateAllTaskProjectDropdowns();
}

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

function addProjectEntry(data = { repoPath: '', projectName: '', supervisorName: '', repoPlatform: 'bitbucket', repoWorkspace: '', repoName: '' }) {
    const container = document.getElementById('projects-container');
    const newEntry = document.createElement('div');
    newEntry.className = 'project-entry glass';
    newEntry.innerHTML = `
        <button type="button" class="remove-project">×</button>
        <h3 class="full-width" style="margin-top:0; color:var(--primary); font-size:1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; margin-bottom: 1rem;">
            <i class="fas fa-folder-open"></i> Project Details
        </h3>
        <div class="input-group full-width">
            <label>Local Project Folder Directory</label>
            <input type="text" class="repoPath" placeholder="C:\\path\\to\\your\\repository" value="${data.repoPath}">
        </div>
        <div class="input-group">
            <label>Project Name</label>
            <input type="text" class="projectName" placeholder="Project Name" value="${data.projectName}">
        </div>
        <div class="input-group">
            <label>Supervisor Name</label>
            <input type="text" class="supervisorName" placeholder="Supervisor Name" value="${data.supervisorName}">
        </div>
        <div class="input-group">
            <label>Platform</label>
            <select class="repoPlatform">
                <option value="bitbucket" ${data.repoPlatform === 'bitbucket' ? 'selected' : ''}>Bitbucket</option>
                <option value="github" ${data.repoPlatform === 'github' ? 'selected' : ''}>GitHub</option>
            </select>
        </div>
        <div class="input-group">
            <label>Workspace / User</label>
            <input type="text" class="repoWorkspace" placeholder="e.g., telcomliveph" value="${data.repoWorkspace || ''}">
        </div>
        <div class="input-group full-width">
            <label>Repository Name</label>
            <input type="text" class="repoName" placeholder="e.g., ibppms" value="${data.repoName || ''}">
        </div>
    `;
    container.appendChild(newEntry);

    newEntry.querySelector('.remove-project').addEventListener('click', () => {
        newEntry.remove();
        saveState();
    });

    // Auto-save on input change
    newEntry.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
            saveState();
            if (input.classList.contains('projectName') || input.classList.contains('supervisorName')) {
                updateAllTaskProjectDropdowns();
            }
        });
    });
}

document.getElementById('add-project').addEventListener('click', () => {
    addProjectEntry();
    saveState();
    updateAllTaskProjectDropdowns();
});

function addDefaultTaskEntry(data = { taskName: '', taskDay: '1', taskProject: '', taskSupervisor: '', taskRemarks: '', taskEnabled: true, taskType: 'normal' }) {
    const container = document.getElementById('default-tasks-container');
    const newEntry = document.createElement('div');
    newEntry.className = 'default-task-entry';
    newEntry.style.display = 'flex';
    newEntry.style.flexDirection = 'column';
    newEntry.style.gap = '1rem';
    newEntry.style.marginBottom = '1.5rem';
    newEntry.style.padding = '1rem';
    newEntry.style.background = 'rgba(255, 255, 255, 0.02)';
    newEntry.style.border = '1px solid var(--border)';
    newEntry.style.borderRadius = '8px';
    newEntry.style.position = 'relative';
    
    // Get current project list
    const projects = getAvailableProjects();
    let projectOptions = '<option value="">-- Select Project --</option>';
    projects.forEach(p => {
        projectOptions += `<option value="${p.projectName}" ${p.projectName === data.taskProject ? 'selected' : ''} data-supervisor="${p.supervisorName}">${p.projectName}</option>`;
    });

    newEntry.innerHTML = `
        <button type="button" class="remove-task btn-secondary" style="position: absolute; top: 10px; right: 10px; height: 30px; width: 30px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border-radius: 50%;">×</button>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-right: 40px;">
            <div class="input-group" style="flex: 2; min-width: 200px;">
                <label>Task Name</label>
                <input type="text" class="taskName" placeholder="e.g., Weekly Meeting" value="${data.taskName || ''}">
            </div>
            <div class="input-group" style="flex: 1; min-width: 150px;">
                <label>Day of Week</label>
                <select class="taskDay">
                    <option value="1" ${data.taskDay == '1' ? 'selected' : ''}>Monday</option>
                    <option value="2" ${data.taskDay == '2' ? 'selected' : ''}>Tuesday</option>
                    <option value="3" ${data.taskDay == '3' ? 'selected' : ''}>Wednesday</option>
                    <option value="4" ${data.taskDay == '4' ? 'selected' : ''}>Thursday</option>
                    <option value="5" ${data.taskDay == '5' ? 'selected' : ''}>Friday</option>
                    <option value="all" ${data.taskDay == 'all' ? 'selected' : ''}>Everyday</option>
                </select>
            </div>
            <div class="input-group" style="flex: 1; min-width: 150px;">
                <label>Report Type / Color</label>
                <select class="taskType">
                    <option value="normal" ${data.taskType === 'normal' ? 'selected' : '' }>Normal Task (Clear)</option>
                    <option value="meeting" ${data.taskType === 'meeting' ? 'selected' : '' }>🏠 Meeting (Blue)</option>
                    <option value="database" ${data.taskType === 'database' ? 'selected' : '' }>💾 Database & Server (Gray)</option>
                    <option value="holiday" ${data.taskType === 'holiday' ? 'selected' : '' }>🎉 Holiday (Green)</option>
                    <option value="leave" ${data.taskType === 'leave' ? 'selected' : '' }>🌴 Leave (Orange)</option>
                </select>
            </div>
        </div>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div class="input-group" style="flex: 1; min-width: 150px;">
                <label>Project Name</label>
                <select class="taskProject" data-value="${data.taskProject || ''}">
                    ${projectOptions}
                </select>
            </div>
            <div class="input-group" style="flex: 1; min-width: 150px;">
                <label>Supervisor <small>(Auto-filled)</small></label>
                <input type="text" class="taskSupervisor" placeholder="Supervisor Name" value="${data.taskSupervisor || ''}" readonly style="background: rgba(255,255,255,0.03); opacity: 0.7;">
            </div>
            <div class="input-group" style="flex: 1; min-width: 150px;">
                <label>Remarks</label>
                <input type="text" class="taskRemarks" placeholder="Remarks" value="${data.taskRemarks || ''}">
            </div>
        </div>
        <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.8rem;">
            <input type="checkbox" class="taskEnabled" ${data.taskEnabled !== false ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px;">
            <label style="margin: 0; font-size: 0.9rem; opacity: 0.9; cursor: pointer; color: var(--primary);">Include to Report</label>
        </div>
    `;
    
    container.appendChild(newEntry);
    
    const select = newEntry.querySelector('.taskProject');
    const supervisorInput = newEntry.querySelector('.taskSupervisor');

    select.addEventListener('change', () => {
        const option = select.options[select.selectedIndex];
        supervisorInput.value = option.getAttribute('data-supervisor') || '';
        select.setAttribute('data-value', select.value);
        saveState();
    });

    newEntry.querySelector('.remove-task').addEventListener('click', () => {
        newEntry.remove();
        saveState();
    });

    newEntry.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
            saveState();
        });
    });
}

const addDefaultTaskBtn = document.getElementById('add-default-task');
if (addDefaultTaskBtn) {
    addDefaultTaskBtn.addEventListener('click', () => {
        addDefaultTaskEntry();
        saveState();
    });
}

// Auto-save global inputs
['employeeName', 'employeeId', 'author', 'since', 'until', 'holidayDates'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', saveState);
});

// Load state on start
window.addEventListener('DOMContentLoaded', loadState);

// Smart Date Shortcuts — Week of current month (Mon–Fri)
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
    const projects = Array.from(document.querySelectorAll('.project-entry')).map(entry => {
        const platform = entry.querySelector('.repoPlatform').value;
        const workspace = entry.querySelector('.repoWorkspace').value;
        const repoName = entry.querySelector('.repoName').value;
        let baseUrl = '';
        if (workspace && repoName) {
            baseUrl = platform === 'bitbucket' ? `https://bitbucket.org/${workspace}/${repoName}/commits/` : `https://github.com/${workspace}/${repoName}/commit/`;
        }
        return {
            repoPath: entry.querySelector('.repoPath').value,
            projectName: entry.querySelector('.projectName').value,
            supervisorName: entry.querySelector('.supervisorName').value,
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
        defaultTasks: Array.from(document.querySelectorAll('.default-task-entry')).map(entry => ({
            taskName: entry.querySelector('.taskName').value,
            taskDay: entry.querySelector('.taskDay').value,
            taskProject: entry.querySelector('.taskProject').value,
            taskSupervisor: entry.querySelector('.taskSupervisor').value,
            taskRemarks: entry.querySelector('.taskRemarks').value,
            taskEnabled: entry.querySelector('.taskEnabled').checked,
            taskType: entry.querySelector('.taskType').value
        })).filter(t => t.taskName.trim() !== '' && t.taskEnabled)
    };

    document.getElementById('loading-modal').style.display = 'flex';
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
        document.getElementById('loading-modal').style.display = 'none';
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
                <td><input type="checkbox" disabled></td>
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

            tr.innerHTML = `
                <td><input type="checkbox" class="row-include" ${row.included ? 'checked' : ''}></td>
                <td>${row.dateFmt}</td>
                <td>${row.subject}</td>
                <td>${row.projectName}</td>
                <td>${row.supervisorName}</td>
                <td>
                    <select class="row-type" style="width:100%; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:inherit; border-radius:6px; padding:0.3rem 0.5rem; font-size:0.82rem; font-family:inherit; cursor:pointer;">
                        ${optionsHtml}
                    </select>
                </td>
                <td><input type="text" class="row-remarks" value="${row.remarks}" placeholder="Add remarks..."></td>
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
            tr.querySelector('.row-remarks').addEventListener('input', (e) => {
                currentPreviewData[index].remarks = e.target.value;
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
    document.getElementById('loading-modal').style.display = 'flex';

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
        document.getElementById('loading-modal').style.display = 'none';
    }
});

// Generate Report Form
document.getElementById('report-form').addEventListener('submit', handleFormSubmit);
