const http = require('http');
const data = JSON.stringify({
    employeeName: "MikCas",
    employeeId: "123",
    since: "2026-02-27",
    until: "2026-03-06",
    author: "MikCas",
    outputFilename: "test.xlsx",
    projects: [
        {
            repoPath: "C:\\tmp\\repo",
            projectName: "Test Project",
            supervisorName: "Test Supervisor",
            baseUrl: ""
        }
    ],
    holidayDates: "",
    defaultTasks: [
        {
            taskName: "Database Review",
            taskDay: "all",
            taskProject: "TRANSCO",
            taskSupervisor: "JOYCE"
        }
    ]
});

const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/generate-report',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => console.log(raw));
});
req.write(data);
req.end();
