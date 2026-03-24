const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// If we haven't added the debug log yet
if (!content.includes('DEBUG: Starting report generation')) {
    content = content.replace('    const { ', '    console.log("DEBUG: Starting report generation", req.body);\n    const { ');
    content = content.replace('entriesForDay.push({', 'console.log("DEBUG: Pushing default task", task.taskName, "to day", dStr);\n                            entriesForDay.push({');
    fs.writeFileSync('server.js', content, 'utf8');
}
