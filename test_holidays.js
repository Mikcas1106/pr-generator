
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

fetchGooglePHHolidays('2026').then(h => {
    console.log(JSON.stringify(h, null, 2));
});
