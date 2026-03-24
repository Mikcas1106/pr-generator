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

app.post('/generate-report', async (req, res) => {
    console.log("DEBUG: Starting report generation", req.body);
    const { 
        employeeName,
        employeeId,
        since, 
        until, 
        author,
        outputFilename,
        projects,
        holidayDates,
        defaultTasks
    } = req.body;

    console.log("DEBUG: defaultTasks received:", defaultTasks);
    if (!outputFilename) {
        return res.status(400).json({ success: false, message: "Output filename is required." });
    }

    if (!projects || !Array.isArray(projects) || projects.length === 0) {
        return res.status(400).json({ success: false, message: "At least one project is required." });
    }

    const downloadsPath = path.join(os.homedir(), 'Downloads');
    let baseFilename = outputFilename.endsWith('.xlsx') ? outputFilename.slice(0, -5) : outputFilename;
    let finalOutputPath = path.join(downloadsPath, `${baseFilename}.xlsx`);
    let counter = 1;

    while (fs.existsSync(finalOutputPath)) {
        finalOutputPath = path.join(downloadsPath, `${baseFilename} (${counter}).xlsx`);
        counter++;
    }

    let authorFilterStr = '';
    if (author) {
        // Just use the first part of their name (e.g. 'Ivan' instead of 'Ivan R. Contrevida')
        // This catches naming variations where git sees 'Ivan Contrevida' or 'icontrevida'.
        authorFilterStr = author.split(' ')[0];
    }
    const authorFilter = authorFilterStr ? `--author="${authorFilterStr}"` : '';

    let sinceFilter = '';
    if (since) {
        // Pad the since date by subtracting 3 days to catch Friday/Weekend commits 
        // that were pushed and merged on Monday but are technically dated earlier by Git.
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

    try {
        for (const project of projects) {
            const { repoPath, projectName, supervisorName, baseUrl } = project;

            if (!repoPath || !fs.existsSync(repoPath)) {
                console.warn(`Skipping invalid path: ${repoPath}`);
                continue;
            }

            try {
                await execPromise('git fetch --all', { cwd: repoPath });
                console.log(`Fetched latest remote changes for ${repoPath}`);
            } catch (fetchErr) {
                console.warn(`Could not fetch remote for ${repoPath}. Proceeding with local data...`, fetchErr.message);
            }

            const { stdout } = await execPromise(cmd, { cwd: repoPath, maxBuffer: 1024 * 1024 * 10 });
            const lines = stdout.trim().split('\n');

            if (!lines || (lines.length === 1 && lines[0] === '')) continue;

            lines.forEach(line => {
                const parts = line.split('|');
                if (parts.length < 3) return;
                const dateStr = parts[0];
                const hashVal = parts[parts.length - 1];
                const subject = parts.slice(1, -1).join('|');
                
                if (!allCommitsByDate[dateStr]) allCommitsByDate[dateStr] = [];
                
                allCommitsByDate[dateStr].push({
                    subject,
                    link: `${baseUrl}${hashVal}`,
                    projectName,
                    supervisorName
                });
            });
        }

        const sortedDates = Object.keys(allCommitsByDate).sort();

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
        // Filter allCommitsByDate to only include strictly what is in allDaysInRange
        // This ensures that even if our Git command fetched "padded" dates (to catch weekend pushes), 
        // we only report on the user's exact requested window.
        sortedDates.forEach(d => {
            // Only add extra days from commits if they fall strictly within the user's range
            // and aren't already included (this handles cases where a commit might be on 
            // a weekend within the range, which the standard weekday loop skips).
            if (d >= startDateStr && d <= endDateStr && !allDaysInRange.includes(d)) {
                allDaysInRange.push(d);
            }
        });
        
        allDaysInRange.sort();

        if (allDaysInRange.length === 0) {
            return res.status(404).json({ success: false, message: "No valid dates found for the specified period." });
        }

        let holidays = [];
        if (holidayDates) {
            holidays = holidayDates.split(',').map(d => d.trim()).filter(d => d);
        }

        const formatDate = (dateStr) => {
            const [y, m, d] = dateStr.split('-');
            return `${parseInt(m)}/${parseInt(d)}/${y}`;
        };

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Progress Report');

        // Header Title: Merge A1:I1 and Center
        sheet.mergeCells('A1:I1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'TLC PROGRESS REPORT';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        sheet.addRow(['Employee', employeeName]);
        sheet.addRow(['Employee ID', employeeId]);
        sheet.addRow(['Coverage Date', `${formatDate(allDaysInRange[0])} - ${formatDate(allDaysInRange[allDaysInRange.length - 1])}`]);
        sheet.addRow([]);

        const headerRow = sheet.addRow([
            'Date', 'Task', 'Deadline', 'Completion Date', 'Status', 'Remarks', 'Project', 'Supervisor', 'Git Link'
        ]);
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        allDaysInRange.forEach(dStr => {
            const dFmt = formatDate(dStr);
            let entriesForDay = [];
            
            if (holidays.includes(dStr)) {
                entriesForDay.push({
                    subject: 'Holiday',
                    projectName: '',
                    supervisorName: '',
                    remarks: '',
                    link: '',
                    taskType: 'holiday'
                });
            } else {
                if (allCommitsByDate[dStr]) {
                    entriesForDay.push(...allCommitsByDate[dStr]);
                }
                
                const dObj = parseYYYYMMDD(dStr);
                const dayOfWeek = dObj.getDay().toString();

                if (defaultTasks && Array.isArray(defaultTasks)) {
                    defaultTasks.forEach(task => {
                        if (task.taskDay === dayOfWeek || task.taskDay === 'all') {
                            entriesForDay.push({
                                subject: task.taskName,
                                projectName: task.taskProject || '',
                                supervisorName: task.taskSupervisor || '',
                                remarks: task.taskRemarks || '',
                                link: '',
                                taskType: task.taskType || 'normal'
                            });
                        }
                    });
                }
            }

            if (entriesForDay.length > 0) {
                entriesForDay.forEach((entry, index) => {
                    const dateToShow = index === 0 ? dFmt : "";
                    const rowValue = [
                        dateToShow,
                        entry.subject,
                        dFmt,
                        dFmt,
                        'Done',
                        entry.remarks || '',
                        entry.projectName || '',
                        entry.supervisorName || '',
                        entry.link || ''
                    ];
                    const row = sheet.addRow(rowValue);
                    
                    // Apply background color based on taskType
                    let fillColor = null;
                    if (entry.taskType === 'meeting') fillColor = 'FFADD8E6'; // Light Blue
                    else if (entry.taskType === 'database') fillColor = 'FFD3D3D3'; // Light Gray
                    else if (entry.taskType === 'holiday') fillColor = 'FF90EE90'; // Light Green

                    row.eachCell((cell) => {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        if (fillColor) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: fillColor }
                            };
                        }
                    });
                });
            }
        });

        sheet.columns.forEach((column, i) => {
            const colIndex = i + 1;
            if (colIndex === 2) { 
                column.width = 40; 
                column.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            } else {
                let maxColumnLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxColumnLength) maxColumnLength = columnLength;
                });
                column.width = maxColumnLength < 12 ? 12 : maxColumnLength + 2;
                column.alignment = { vertical: 'top', horizontal: 'left' };
            }
        });

        await workbook.xlsx.writeFile(finalOutputPath);
        res.json({ success: true, message: `Excel report generated successfully!`, filePath: finalOutputPath });

    } catch (error) {
        console.error(error);
        if (error.code === 'EBUSY') {
            return res.status(500).json({ 
                success: false, 
                message: `The file "${outputFilename}" is currently open in another program (like Excel). Please close it and try again.` 
            });
        }
        res.status(500).json({ success: false, message: "Error generating report.", error: error.message });
    }
});



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "An internal server error occurred.", error: err.message });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
