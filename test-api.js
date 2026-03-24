const http = require('http');

const data = JSON.stringify({
    employeeName: "MikCas",
    employeeId: "123",
    since: "2026-02-27",
    until: "2026-03-06",
    author: "",
    outputFilename: "test.xlsx",
    projects: [
        {
            repoPath: "C:\\Users\\Admin\\Desktop\\Side Proj\\git-report-generator",
            projectName: "Test Project",
            supervisorName: "Test Supervisor",
            baseUrl: "https://github.com/m/m/commit/"
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
    res.on('end', () => console.log('API Response:', raw));
});

req.on('error', e => console.error('API Error:', e));
req.write(data);
req.end();
