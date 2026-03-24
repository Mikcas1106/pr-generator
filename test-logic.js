const allCommitsByDate = { "2026-02-27": [ { subject: "commit 1", projectName: "test", supervisorName: "test", link: "link" } ] };
const sortedDates = ["2026-02-27"];
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

let since = "2026-02-27";
let until = "2026-03-02";
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
    if (!allDaysInRange.includes(d)) {
        allDaysInRange.push(d);
    }
});

allDaysInRange.sort();

let holidays = [];
let defaultTasks = [{ taskName: "Database Review", taskDay: "all", taskProject: "TRANSCO", taskSupervisor: "JOYCE" }];

allDaysInRange.forEach(dStr => {
    let entriesForDay = [];
    if (holidays.includes(dStr)) {
        entriesForDay.push({ subject: 'Holiday' });
    } else {
        if (allCommitsByDate[dStr]) entriesForDay.push(...allCommitsByDate[dStr]);
        const dObj = parseYYYYMMDD(dStr);
        const dayOfWeek = dObj.getDay().toString();
        if (defaultTasks && Array.isArray(defaultTasks)) {
            defaultTasks.forEach(task => {
                if (task.taskDay === dayOfWeek || task.taskDay === 'all') {
                    entriesForDay.push({
                        subject: task.taskName,
                        projectName: task.taskProject || '',
                        supervisorName: task.taskSupervisor || '',
                        link: ''
                    });
                }
            });
        }
    }
    console.log("Day:", dStr, "Entries:", entriesForDay);
});
