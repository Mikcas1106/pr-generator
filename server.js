const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const fs = require('fs');
const os = require('os');
const bodyParser = require('body-parser');
const cors = require('cors');
const ExcelJS = require('exceljs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const CONFIG_FILE = path.join(__dirname, 'config.json');

const holidayCacheV2 = {};

async function fetchGooglePHHolidays(year) {
    try {
        const url = `https://calendar.google.com/calendar/ical/en.philippines%23holiday%40group.v.calendar.google.com/public/basic.ics`;
        const resp = await fetch(url);
        if (!resp.ok) return [];
        const text = await resp.text();
        
        const events = text.split('BEGIN:VEVENT').slice(1);
        const holidays = [];
        
        events.forEach(event => {
            const startMatch = event.match(/DTSTART;VALUE=DATE:(\d{8})/);
            const summaryMatch = event.match(/SUMMARY(?:;[^:]+)?:([^\r\n]+)/);
            
            if (startMatch && summaryMatch) {
                const d = startMatch[1];
                if (d.startsWith(year)) {
                    holidays.push({
                        date: `${d.substring(0,4)}-${d.substring(4,6)}-${d.substring(6,8)}`,
                        name: summaryMatch[1].trim().replace(/\r/g, '')
                    });
                }
            }
        });
        
        return holidays;
    } catch (e) {
        console.error("Google Holiday Fetch Error:", e.message);
        return [];
    }
}

async function getHolidaysForYear(year) {
    if (holidayCacheV2[year]) return holidayCacheV2[year];
    
    console.log(`Dynamic fetching PH holidays for ${year}...`);
    try {
        // Multi-source fetch
        const [nagerResp, googleHolidays] = await Promise.all([
            fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`).then(r => r.ok ? r.json() : []),
            fetchGooglePHHolidays(year)
        ]);

        const nagerHolidays = Array.isArray(nagerResp) ? nagerResp.map(h => ({ date: h.date, name: h.localName || h.name })) : [];
        
        // Merge both sources for maximum accuracy
        const combinedMap = {};
        [...nagerHolidays, ...googleHolidays].forEach(h => {
            combinedMap[h.date] = h.name;
        });
        
        const combined = Object.keys(combinedMap).sort().map(d => ({
            date: d,
            name: combinedMap[d]
        }));
        
        if (combined.length > 0) {
            holidayCacheV2[year] = combined;
            return combined;
        }
        return [];
    } catch (err) {
        console.error(`Dynamic holiday fetch error: ${err.message}`);
        return [];
    }
}

// Helper functions
const parseYYYYMMDD = (str) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const formatYYYYMMDD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(m)}/${parseInt(d)}/${y}`;
};

async function getLogData(params) {
    const { since, until, author, projects, defaultTasks } = params;
    
    let authorFilterStr = '';
    if (author) {
        authorFilterStr = author.split(' ')[0];
    }
    const authorFilter = authorFilterStr ? `--author="${authorFilterStr}"` : '';

    let sinceFilter = '';
    if (since) {
        const sinceDate = new Date(since);
        sinceDate.setDate(sinceDate.getDate() - 3);
        const paddedSince = sinceDate.toISOString().split('T')[0];
        sinceFilter = `--since="${paddedSince}"`;
    }
    let untilFilter = '';
    if (until) {
        const d = new Date(until);
        d.setDate(d.getDate() + 1);
        const nextDay = d.toISOString().split('T')[0];
        untilFilter = `--until="${nextDay}"`;
    }

    const cmd = `git log --all ${authorFilter} --no-merges --pretty=format:"%ad|%s|%H" --date=short ${sinceFilter} ${untilFilter}`;
    const allCommitsByDate = {}; 
    const activeProjectNames = new Set();

    for (const project of projects) {
        const { repoPath, projectName, supervisorName, baseUrl } = project;
        if (!repoPath || !fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, '.git'))) {
            console.warn(`Skipping invalid repo path: ${repoPath}`);
            continue;
        }

        try {
            await execPromise('git fetch --all', { cwd: repoPath });
        } catch (fetchErr) {}

        const { stdout } = await execPromise(cmd, { cwd: repoPath, maxBuffer: 1024 * 1024 * 10 });
        const lines = stdout.trim().split('\n');
        if (!lines || (lines.length === 1 && lines[0] === '')) continue;

        activeProjectNames.add(projectName);

        lines.forEach(line => {
            const parts = line.split('|');
            if (parts.length < 3) return;
            const dateStr = parts[0];
            const subject = parts[1];
            const hash = parts[2];
            
            if (!allCommitsByDate[dateStr]) allCommitsByDate[dateStr] = [];
            allCommitsByDate[dateStr].push({
                subject,
                hash,
                projectName,
                supervisorName,
                taskType: 'normal',
                repoPlatform: project.repoPlatform,
                repoWorkspace: project.repoWorkspace,
                repoName: project.repoName,
                link: baseUrl ? `${baseUrl}${hash}` : ''
            });
        });
    }

    const sortedDates = Object.keys(allCommitsByDate).sort();
    let startDateStr = since || (sortedDates.length > 0 ? sortedDates[0] : null);
    let endDateStr = until || (sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null);

    let allDaysInRange = [];
    if (startDateStr && endDateStr) {
        let curr = parseYYYYMMDD(startDateStr);
        let end = parseYYYYMMDD(endDateStr);
        while (curr <= end) {
            const dayOfWeek = curr.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                allDaysInRange.push(formatYYYYMMDD(curr));
            }
            curr.setDate(curr.getDate() + 1);
        }
    }
    sortedDates.forEach(d => {
        if (d >= startDateStr && d <= endDateStr && !allDaysInRange.includes(d)) {
            allDaysInRange.push(d);
        }
    });
    allDaysInRange.sort();

    // Determine relevant years from the range
    const startYear = startDateStr ? String(new Date(startDateStr).getFullYear()) : '2026';
    const endYear = endDateStr ? String(new Date(endDateStr).getFullYear()) : startYear;
    
    let holidays = [];
    for (let y = parseInt(startYear); y <= parseInt(endYear); y++) {
        const yHolidays = await getHolidaysForYear(String(y));
        holidays = [...holidays, ...yHolidays];
    }

    const reportRows = [];
    const leaveSet = new Set(params.leaveDates || []);

    allDaysInRange.forEach(dStr => {
        const dFmt = formatDate(dStr);
        let entriesForDay = [];
        
        const hMatch = Array.isArray(holidays) ? holidays.find(h => h.date === dStr) : null;
        const isLeave = leaveSet.has(dStr);

        if (hMatch) {
            entriesForDay.push({
                date: dStr,
                dateFmt: dFmt,
                subject: hMatch.name || 'Holiday',
                projectName: '',
                supervisorName: '',
                remarks: '',
                link: '',
                taskType: 'holiday',
                hash: '',
                repoPlatform: '',
                repoWorkspace: '',
                repoName: ''
            });
        } else if (isLeave) {
            entriesForDay.push({
                date: dStr,
                dateFmt: dFmt,
                subject: 'On Leave',
                projectName: '',
                supervisorName: '',
                remarks: 'Vacation/Sick Leave',
                link: '',
                taskType: 'leave',
                hash: '',
                repoPlatform: '',
                repoWorkspace: '',
                repoName: ''
            });
        }

        // Always include commits if they exist, even if it's a holiday
        if (allCommitsByDate[dStr]) {
            allCommitsByDate[dStr].forEach(c => entriesForDay.push({ ...c, date: dStr, dateFmt: dFmt, remarks: '' }));
        }
        
        // Only include default tasks if it's NOT a holiday and NOT on leave
        if (!hMatch && !isLeave) {
            const dObj = parseYYYYMMDD(dStr);
            const dayOfWeek = dObj.getDay().toString();
            if (defaultTasks && Array.isArray(defaultTasks)) {
                defaultTasks.forEach(task => {
                    // Check if project is active if the toggle is on
                    if (task.taskOnlyIfProjectActive && !activeProjectNames.has(task.taskProject)) {
                        return; // Skip this task because project is inactive
                    }

                    const isDayMatch = Array.isArray(task.taskDay) 
                        ? task.taskDay.includes(dayOfWeek) || task.taskDay.includes('all')
                        : task.taskDay === dayOfWeek || task.taskDay === 'all';

                    if (isDayMatch) {
                        entriesForDay.push({
                            date: dStr,
                            dateFmt: dFmt,
                            subject: task.taskName,
                            projectName: task.taskProject || '',
                            supervisorName: task.taskSupervisor || '',
                            remarks: task.taskRemarks || '',
                            taskType: task.taskType || 'normal',
                            hash: '',
                            repoPlatform: '',
                            repoWorkspace: '',
                            repoName: '',
                            link: ''
                        });
                    }
                });
            }
        }

        if (entriesForDay.length === 0) {
            reportRows.push({
                date: dStr,
                dateFmt: dFmt,
                subject: '⚠️ No entries for this day',
                projectName: '',
                supervisorName: '',
                remarks: '',
                taskType: 'empty',
                hash: '',
                repoPlatform: '',
                repoWorkspace: '',
                repoName: '',
                link: ''
            });
        } else {
            reportRows.push(...entriesForDay);
        }
    });

    return reportRows;
}

app.post('/preview-data', async (req, res) => {
    try {
        const data = await getLogData(req.body);
        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching preview data.", error: error.message });
    }
});

app.get('/get-config', (req, res) => {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return res.json({ success: true, data: JSON.parse(data) });
        } catch (e) {
            return res.json({ success: false, message: "Error reading config file." });
        }
    }
    res.json({ success: false, message: "Config file not found." });
});

app.post('/save-config', (req, res) => {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 4), 'utf8');
        res.json({ success: true, message: "Config saved successfully." });
    } catch (e) {
        console.error("Save Config Error:", e);
        res.status(500).json({ success: false, message: "Error saving config file." });
    }
});

app.post('/list-folders', async (req, res) => {
    let { currentPath, search, deepScan } = req.body;
    if (!currentPath) currentPath = os.homedir();
    try {
        if (!fs.existsSync(currentPath)) currentPath = os.homedir();
        const folders = [];
        const parentPath = path.dirname(currentPath);
        
        // Add parent directory link
        if (parentPath !== currentPath && !search && !deepScan) {
            folders.push({ name: '.. (Back)', path: parentPath, isParent: true });
        }

        if (deepScan) {
            const findGitRepos = (dir, depth = 0) => {
                if (depth > 2) return [];
                let repos = [];
                try {
                    const items = fs.readdirSync(dir);
                    if (items.includes('.git')) {
                        return [{ name: path.basename(dir) + ' (GIT)', path: dir, isGit: true }];
                    }
                    items.forEach(item => {
                        const fullPath = path.join(dir, item);
                        if (fs.statSync(fullPath).isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                            repos = repos.concat(findGitRepos(fullPath, depth + 1));
                        }
                    });
                } catch (e) {}
                return repos;
            };
            folders.push(...findGitRepos(currentPath));
        } else {
            const items = fs.readdirSync(currentPath);
            items.forEach(item => {
                try {
                    const fullPath = path.join(currentPath, item);
                    if (fs.statSync(fullPath).isDirectory()) {
                        if (search && !item.toLowerCase().includes(search.toLowerCase())) return;
                        const isGit = fs.existsSync(path.join(fullPath, '.git'));
                        folders.push({ name: item + (isGit ? ' 🔒' : ''), path: fullPath, isGit });
                    }
                } catch (e) {}
            });
        }

        const enrichedFolders = await Promise.all(folders.map(async f => {
            if (f.isGit) {
                const meta = await new Promise(resolve => {
                    exec('git config --get remote.origin.url', { cwd: f.path }, (err, stdout) => {
                        if (err || !stdout) return resolve(null);
                        const url = stdout.trim();
                        const parts = url.replace(/\.git$/, '').split(/[:/]/);
                        resolve({ 
                            url, 
                            workspace: parts[parts.length - 2] || '', 
                            repo: parts[parts.length - 1] || '', 
                            platform: url.includes('github.com') ? 'github' : 'bitbucket' 
                        });
                    });
                });
                return { ...f, gitMeta: meta };
            }
            return f;
        }));

        res.json({ success: true, currentPath, folders: enrichedFolders.slice(0, 100) });
    } catch (e) { 
        res.json({ success: false, message: e.message }); 
    }
});

app.post('/health-check', async (req, res) => {
    const { projects } = req.body;
    if (!projects || !Array.isArray(projects)) {
        return res.status(400).json({ success: false, message: "Projects array is required." });
    }

    const results = [];
    for (const project of projects) {
        const { repoPath, projectName } = project;
        const result = { projectName, repoPath, exists: false, isGit: false, hasChanges: false, error: null };

        if (!repoPath) {
            result.error = "Missing path";
        } else if (!fs.existsSync(repoPath)) {
            result.error = "Path does not exist";
        } else {
            result.exists = true;
            const gitPath = path.join(repoPath, '.git');
            if (!fs.existsSync(gitPath)) {
                result.error = "Not a git repository";
            } else {
                result.isGit = true;
                try {
                    // Check for uncommitted changes
                    const { stdout } = await execPromise('git status --porcelain', { cwd: repoPath });
                    result.hasChanges = stdout.trim().length > 0;
                    
                    // Optional: check if remote is ahead (would require fetch, maybe too slow for health check)
                    // For now, just path and basic git status
                } catch (err) {
                    result.error = `Git error: ${err.message}`;
                }
            }
        }
        results.push(result);
    }

    res.json({ success: true, data: results });
});

app.post('/generate-report', async (req, res) => {
    const { 
        employeeName,
        employeeId,
        outputFilename,
        reportData // The (possibly edited) rows from the frontend
    } = req.body;

    if (!reportData || !Array.isArray(reportData)) {
        return res.status(400).json({ success: false, message: "Report data is required." });
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Progress Report');

        sheet.mergeCells('A1:I1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'TLC PROGRESS REPORT';
        titleCell.font = { bold: true, size: 16 }; // Increased size slightly for premium feel
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 35; // Added height for better breathing room as seen in photos
        
        // Ensure all cells in row 1 have border for the merge to look correct
        for (let i = 1; i <= 9; i++) {
            sheet.getRow(1).getCell(i).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }

        sheet.addRow(['Employee', employeeName]);
        sheet.addRow(['Employee ID', employeeId]);
        
        const firstRow = reportData[0];
        const lastRow = reportData[reportData.length - 1];
        sheet.addRow(['Coverage Date', `${firstRow ? firstRow.dateFmt : ''} - ${lastRow ? lastRow.dateFmt : ''}`]);
        sheet.addRow([]);

        const headerRow = sheet.addRow([
            'Date', 'Task', 'Deadline', 'Completion Date', 'Status', 'Remarks', 'Project', 'Supervisor', 'Git Link'
        ]);
        // Style the headers
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        let lastDate = "";
        reportData.forEach((entry) => {
            const dateToShow = entry.dateFmt !== lastDate ? entry.dateFmt : "";
            lastDate = entry.dateFmt;

            const rowValue = [
                dateToShow,
                entry.subject,
                entry.dateFmt,
                entry.dateFmt,
                'Done',
                entry.remarks || '',
                entry.projectName || '',
                entry.supervisorName || '',
                entry.link || ''
            ];
            const row = sheet.addRow(rowValue);
            
            // Make Git Link clickable if URL exists
            if (entry.link) {
                const gitCell = row.getCell(9);
                gitCell.value = { text: 'View Commit', hyperlink: entry.link };
                gitCell.font = { color: { argb: 'FF0000FF' }, underline: true };

                // Also make the Subject cell a clickable hyperlink
                const subjectCell = row.getCell(2);
                subjectCell.value = { text: entry.subject, hyperlink: entry.link };
                subjectCell.font = { color: { argb: 'FF0000FF' }, underline: true };
            }

            let fillColor = null;
            if (entry.taskType === 'meeting') fillColor = 'FFADD8E6';      // Light Blue
            else if (entry.taskType === 'database') fillColor = 'FFD3D3D3'; // Light Gray
            else if (entry.taskType === 'holiday') fillColor = 'FF90EE90';  // Light Green
            else if (entry.taskType === 'leave') fillColor = 'FFFFD8B1';    // Light Orange

            // Apply fill, borders, and DEFAULT alignment to ALL cells in the row (1 to 9)
            for (let i = 1; i <= 9; i++) {
                const cell = row.getCell(i);
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (fillColor) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
                }
                
                // Default alignment for normal rows
                if (i === 2) { 
                    // Wrap text for task description for readability
                    cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
                } else {
                    cell.alignment = { vertical: 'top', horizontal: 'center' };
                }
            }

            // Special handling for holidays: merge B-I and center EVERYTHING
            if (entry.taskType === 'holiday') {
                const rowNum = row.number;
                sheet.mergeCells(rowNum, 2, rowNum, 9); // Column B to I
                
                // Center EVERYTHING horizontally and vertically, and enable wrapText
                for (let i = 1; i <= 9; i++) {
                    const cell = row.getCell(i);
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                }
                
                const holidayCell = row.getCell(2);
                holidayCell.font = { bold: true };
            }
        });

        // Set column widths but avoid overriding specific cell alignment
        sheet.columns.forEach((column, i) => {
            const colIndex = i + 1;
            if (colIndex === 2) { 
                column.width = 40; 
                // Don't set column.alignment here as it overrides row-specific settings
            } else {
                let maxColumnLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxColumnLength) maxColumnLength = columnLength;
                });
                column.width = maxColumnLength < 12 ? 12 : maxColumnLength + 2;
                // Don't set column.alignment here
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error generating report.", error: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "An internal server error occurred.", error: err.message });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
