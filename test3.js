const parseYYYYMMDD = (str) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
};
let dStr = "2026-02-27";
const dObj = parseYYYYMMDD(dStr);
const dayOfWeek = dObj.getDay().toString();
console.log("dayOfWeek:", dayOfWeek);

let defaultTasks = [
    { taskName: "test", taskDay: "all" }
];
if (defaultTasks && Array.isArray(defaultTasks)) {
    defaultTasks.forEach(task => {
        if (task.taskDay === dayOfWeek || task.taskDay === 'all') {
            console.log("MATCHED!");
        } else {
            console.log("NO MATCH");
        }
    });
}
