const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/generate-report', async (req, res) => {
    const { 
        repoPath, 
        author, 
        employeeName,
        employeeId,
        since, 
        until, 
        projectName, 
        supervisorName, 
        baseUrl,
        outputFilename 
    } = req.body;

    if (!outputFilename) {
        return res.status(400).json({ success: false, message: "Output filename is required." });
    }

    const downloadsPath = path.join(os.homedir(), 'Downloads');
    const finalOutputPath = path.join(downloadsPath, outputFilename.endsWith('.csv') ? outputFilename : `${outputFilename}.csv`);

    if (!repoPath || !fs.existsSync(repoPath)) {
        return res.status(400).json({ success: false, message: "Invalid repository path." });
    }

    const authorFilter = author ? `--author="${author}"` : '';
    const sinceFilter = since ? `--since="${since}"` : '';
    const untilFilter = until ? `--until="${until}"` : '';

    const cmd = `git log ${authorFilter} --no-merges --pretty=format:"%ad|%s|%H" --date=short ${sinceFilter} ${untilFilter}`;

    exec(cmd, { cwd: repoPath }, (error, stdout, stderr) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Git log command failed.", error: stderr });
        }

        const lines = stdout.trim().split('\n');
        if (!lines || (lines.length === 1 && lines[0] === '')) {
            return res.status(404).json({ success: false, message: "No commits found for the specified period." });
        }

        const days = {};
        lines.forEach(line => {
            const parts = line.split('|');
            if (parts.length < 3) return;
            const [dateStr, subject, hashVal] = parts;
            if (!days[dateStr]) days[dateStr] = [];
            days[dateStr].push({ subject, link: `${baseUrl}${hashVal}` });
        });

        const sortedDates = Object.keys(days).sort();
        
        const formatDate = (dateStr) => {
            const [y, m, d] = dateStr.split('-');
            return `${parseInt(m)}/${parseInt(d)}/${y}`;
        };

        const projParts = projectName.split(' ');
        const p1 = projParts[0] || "";
        const p2 = projParts.slice(1).join(' ') || "";

        const supParts = supervisorName.split(' ');
        const s1 = supParts[0] || "";
        const s2 = supParts.slice(1).join(' ') || "";

        let csv = `,,,,E,TLC PROGRESS REPORT\n`;
        csv += `Employee,${employeeName}\n`;
        csv += `Employee,${employeeId}\n`;
        csv += `Coverage Date,"${formatDate(sortedDates[0])} - ${formatDate(sortedDates[sortedDates.length - 1])}"\n`;
        csv += `Date,Task,Deadline,Completion Date,Status,Remarks,Project,Supervisor,Github Link\n`;

        sortedDates.forEach(dStr => {
            const dFmt = formatDate(dStr);

            days[dStr].forEach((commit, index) => {
                // Determine if we should show the date (only on the first commit of the day)
                const dateToShow = index === 0 ? `"${dFmt}"` : "";
                
                // Row 1 of commit (Removed extra comma before Deadline)
                csv += `${dateToShow},"${commit.subject.replace(/"/g, '""')}","${dFmt}","${dFmt}","Done","","${p1}","${s1}","${commit.link}"\n`;
                // Row 2 of commit (Splits)
                csv += `,,,,,,,"${p2}","${s2}",""\n`;
            });
        });

        try {
            fs.writeFileSync(finalOutputPath, csv, 'utf-8');
            res.json({ success: true, message: `Report generated!`, filePath: finalOutputPath });
        } catch (e) {
            res.status(500).json({ success: false, message: "Failed to write CSV.", error: e.message });
        }
    });
});

app.post('/clone-repo', (req, res) => {
    const { repoUrl, targetDir } = req.body;
    if (!repoUrl) return res.status(400).json({ success: false, message: "Repo URL is required." });

    const parentDir = path.dirname(targetDir);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }

    const cmd = `git clone "${repoUrl}" "${targetDir}"`;
    exec(cmd, { cwd: parentDir }, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Clone failed.", error: stderr });
        }
        res.json({ success: true, message: "Repository cloned successfully!", output: stdout });
    });
});

// Global error handler to ensure JSON is always returned
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "An internal server error occurred.", error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
