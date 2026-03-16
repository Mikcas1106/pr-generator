function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tab}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

const statusLog = document.getElementById('status-log');

function log(msg, type = 'info') {
    statusLog.textContent = msg;
    statusLog.className = 'status-log';
    if (type === 'success') statusLog.classList.add('status-success');
    if (type === 'error') statusLog.classList.add('status-error');
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

    if (state.projects && state.projects.length > 0) {
        const container = document.getElementById('projects-container');
        container.innerHTML = ''; // Clear default
        state.projects.forEach((proj, index) => {
            addProjectEntry(proj);
        });
    }
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
        input.addEventListener('input', saveState);
    });
}

document.getElementById('add-project').addEventListener('click', () => {
    addProjectEntry();
    saveState();
});

// Auto-save global inputs
['employeeName', 'employeeId', 'author', 'since', 'until'].forEach(id => {
    document.getElementById(id).addEventListener('input', saveState);
});

// Load state on start
window.addEventListener('DOMContentLoaded', loadState);

// Generate Report Form
document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    log("Processing git logs, generating report...", "info");

    const projectEntries = document.querySelectorAll('.project-entry');
    const projects = Array.from(projectEntries).map(entry => {
        const platform = entry.querySelector('.repoPlatform').value;
        const workspace = entry.querySelector('.repoWorkspace').value;
        const repoName = entry.querySelector('.repoName').value;
        
        // Build base URL
        let baseUrl = '';
        if (workspace && repoName) {
            if (platform === 'bitbucket') {
                baseUrl = `https://bitbucket.org/${workspace}/${repoName}/commits/`;
            } else {
                baseUrl = `https://github.com/${workspace}/${repoName}/commit/`;
            }
        }

        return {
            repoPath: entry.querySelector('.repoPath').value,
            projectName: entry.querySelector('.projectName').value,
            supervisorName: entry.querySelector('.supervisorName').value,
            baseUrl: baseUrl
        };
    });

    const data = {
        employeeName: document.getElementById('employeeName').value,
        employeeId: document.getElementById('employeeId').value,
        author: document.getElementById('author').value,
        since: document.getElementById('since').value,
        until: document.getElementById('until').value,
        outputFilename: updateDefaultFilename(),
        projects: projects
    };

    try {
        const response = await fetch('/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            log(`✅ Success! Report saved at: ${result.filePath}`, "success");
        } else {
            log(`❌ Error: ${result.message}`, "error");
            console.error(result.error);
        }
    } catch (err) {
        log(`❌ Connection Error: ${err.message}`, "error");
    }
});

// Clone Repo Form
document.getElementById('clone-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    log("Cloning repository... this might take a moment.", "info");

    const data = {
        repoUrl: document.getElementById('repoUrl').value,
        targetDir: document.getElementById('targetDir').value
    };

    try {
        const response = await fetch('/clone-repo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            log(`✅ Success! ${result.message}`, "success");
        } else {
            log(`❌ Clone Error: ${result.message}`, "error");
            console.error(result.error);
        }
    } catch (err) {
        log(`❌ Connection Error: ${err.message}`, "error");
    }
});
