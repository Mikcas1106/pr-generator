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
    const { 
        employeeName,
        employeeId,
        since, 
        until, 
        author,
        outputFilename,
        projects 
    } = req.body;

    if (!outputFilename) {
        return res.status(400).json({ success: false, message: "Output filename is required." });
    }

    if (!projects || !Array.isArray(projects) || projects.length === 0) {
        return res.status(400).json({ success: false, message: "At least one project is required." });
    }

    const downloadsPath = path.join(os.homedir(), 'Downloads');
    const finalOutputPath = path.join(downloadsPath, outputFilename.endsWith('.xlsx') ? outputFilename : `${outputFilename}.xlsx`);

    const authorFilter = author ? `--author="${author}"` : '';
    const sinceFilter = since ? `--since="${since}"` : '';
    let untilFilter = '';
    if (until) {
        const d = new Date(until);
        d.setDate(d.getDate() + 1);
        const nextDay = d.toISOString().split('T')[0];
        untilFilter = `--until="${nextDay}"`;
    }

    const cmd = `git log ${authorFilter} --no-merges --pretty=format:"%ad|%s|%H" --date=short ${sinceFilter} ${untilFilter}`;

    const allCommitsByDate = {}; 

    try {
        for (const project of projects) {
            const { repoPath, projectName, supervisorName, baseUrl } = project;

            if (!repoPath || !fs.existsSync(repoPath)) {
                console.warn(`Skipping invalid path: ${repoPath}`);
                continue;
            }

            const { stdout } = await execPromise(cmd, { cwd: repoPath });
            const lines = stdout.trim().split('\n');

            if (!lines || (lines.length === 1 && lines[0] === '')) continue;

            lines.forEach(line => {
                const parts = line.split('|');
                if (parts.length < 3) return;
                const [dateStr, subject, hashVal] = parts;
                
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
        
        if (sortedDates.length === 0) {
            return res.status(404).json({ success: false, message: "No commits found for the specified period across any projects." });
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
        sheet.addRow(['Coverage Date', `${formatDate(sortedDates[0])} - ${formatDate(sortedDates[sortedDates.length - 1])}`]);
        sheet.addRow([]);

        const headerRow = sheet.addRow([
            'Date', 'Task', 'Deadline', 'Completion Date', 'Status', 'Remarks', 'Project', 'Supervisor', 'Git Link'
        ]);
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        sortedDates.forEach(dStr => {
            const dFmt = formatDate(dStr);
            allCommitsByDate[dStr].forEach((commit, index) => {
                const dateToShow = index === 0 ? dFmt : "";
                const row = sheet.addRow([
                    dateToShow,
                    commit.subject,
                    dFmt,
                    dFmt,
                    'Done',
                    '',
                    commit.projectName,
                    commit.supervisorName,
                    commit.link
                ]);
                
                row.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });
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

app.post('/clone-repo', (req, res) => {
    const { repoUrl, targetDir } = req.body;
    if (!repoUrl) return res.status(400).json({ success: false, message: "Repo URL is required." });
    const parentDir = path.dirname(targetDir);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    const cmd = `git clone "${repoUrl}" "${targetDir}"`;
    exec(cmd, { cwd: parentDir }, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ success: false, message: "Clone failed.", error: stderr });
        res.json({ success: true, message: "Repository cloned successfully!", output: stdout });
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "An internal server error occurred.", error: err.message });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
