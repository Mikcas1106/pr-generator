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

// Multi-Project UI logic
document.getElementById('add-project').addEventListener('click', () => {
    const container = document.getElementById('projects-container');
    const newEntry = document.createElement('div');
    newEntry.className = 'project-entry glass';
    newEntry.innerHTML = `
        <button type="button" class="remove-project">×</button>
        <div class="input-group full-width">
            <label>Local Project Folder Directory</label>
            <input type="text" class="repoPath" placeholder="C:\\path\\to\\your\\repository">
        </div>
        <div class="input-group">
            <label>Project Name</label>
            <input type="text" class="projectName" placeholder="Project Name">
        </div>
        <div class="input-group">
            <label>Supervisor Name</label>
            <input type="text" class="supervisorName" placeholder="Supervisor Name">
        </div>
    `;
    container.appendChild(newEntry);

    newEntry.querySelector('.remove-project').addEventListener('click', () => {
        newEntry.remove();
    });
});

// Generate Report Form
document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    log("Processing git logs, generating report...", "info");

    const projectEntries = document.querySelectorAll('.project-entry');
    const projects = Array.from(projectEntries).map(entry => ({
        repoPath: entry.querySelector('.repoPath').value,
        projectName: entry.querySelector('.projectName').value,
        supervisorName: entry.querySelector('.supervisorName').value
    }));

    const data = {
        employeeName: document.getElementById('employeeName').value,
        employeeId: document.getElementById('employeeId').value,
        author: document.getElementById('author').value,
        since: document.getElementById('since').value,
        until: document.getElementById('until').value,
        baseUrl: document.getElementById('baseUrl').value,
        outputFilename: document.getElementById('outputFilename').value,
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
