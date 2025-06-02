const themes = [
    { name: 'Cyberpunk', path: 'css/styles.css' },
    { name: 'Emotional & Mood', path: 'css/emotional-theme.css' },
    { name: 'Virtual Travel', path: 'css/virtual-travel-theme.css' },
    { name: 'Entertainment & Pop Culture', path: 'css/entertainment-pop-culture-theme.css' },
    { name: 'Time-based & Historical', path: 'css/time-based-theme.css' },
    { name: 'Challenge & Experience', path: 'css/challenge-experience-theme.css' },
    { name: 'Health & Lifestyle', path: 'css/health-lifestyle-theme.css' },
    { name: 'Unique & Interesting', path: 'css/unique-interesting-theme.css' }
];

function loadTheme(themeName) {
    // Placeholder for loading theme
    console.log(`Loading theme: ${themeName}`);
    removePreviousTheme();

    const theme = themes.find(t => t.name === themeName);

    if (theme) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = theme.path;
        link.id = 'dynamic-theme-style';
        document.head.appendChild(link);
        console.log(`${theme.name} theme loaded.`);
    } else {
        console.error(`Theme "${themeName}" not found.`);
    }
}

function removePreviousTheme() {
    const existingThemeStyle = document.getElementById('dynamic-theme-style');
    if (existingThemeStyle) {
        existingThemeStyle.remove();
        console.log('Previous theme removed.');
    }
}

function getCurrentVietnamDate() {
    // Create a date object for the current time
    const now = new Date();

    // Options for toLocaleString to get parts of the date in 'Asia/Ho_Chi_Minh' timezone
    // en-CA is used for yyyy-mm-dd format, which is less ambiguous for Date parsing.
    const options = {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
    };

    // Get the date and time parts in Vietnam timezone
    // Using a specific locale like 'en-US' or 'en-GB' can help ensure the format.
    // Let's try to reconstruct a parseable string.
    // Example: "12/31/2023, 23:59:59" (using en-US)
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    const dateParts = {};
    for (const part of parts) {
        if (part.type !== 'literal') {
            dateParts[part.type] = part.value;
        }
    }

    // Construct a string in a format that Date.parse can reliably understand,
    // ideally "YYYY-MM-DDTHH:mm:ss"
    const vietnamDateString = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`;

    // console.log('Vietnam date string:', vietnamDateString); // For debugging

    // Parse the Vietnam date string into a Date object
    // The resulting Date object will be in the user's local timezone, but representing the time in Vietnam.
    // For theme selection, we primarily care about the *date* (day of year) in Vietnam.
    return new Date(vietnamDateString);
}

function getTodaysTheme() {
    const currentDateInVietnam = getCurrentVietnamDate();

    // Create a date object for the start of the year in Vietnam timezone.
    // We need to be careful here. The `currentDateInVietnam` object's time components
    // (hours, minutes, seconds) are for Vietnam, but its `getFullYear()` etc. are based
    // on how the Date object was created (which was by parsing a string representing VN time).
    // So, `currentDateInVietnam.getFullYear()` will give the correct year in Vietnam.
    const yearInVietnam = currentDateInVietnam.getFullYear();

    // To get the first day of the year in Vietnam, we construct a new Date object
    // representing January 1st of that year, specifically in Vietnam's timezone.
    // We can reuse getCurrentVietnamDate logic by setting a specific date.
    // This is a bit tricky. A simpler way for day of year:
    const startOfYearInVietnam = new Date(Date.UTC(yearInVietnam, 0, 1)); // Jan 1st UTC

    // Calculate the difference in time (milliseconds)
    // We need to ensure both dates are treated as "days" without time components,
    // or ensure they are both effectively in the same timezone for comparison.
    // Since `currentDateInVietnam` is already set to midnight in effect for date calculation purposes.
    // Let's adjust startOfYearInVietnam to be midnight UTC for that day.
    // And currentDateInVietnam is already effectively a "day" in VN.

    // A common way to calculate day of year:
    const firstDayOfYear = new Date(currentDateInVietnam.getFullYear(), 0, 1);
    const diff = currentDateInVietnam.getTime() - firstDayOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay) + 1; // +1 because it's 1-indexed

    // console.log(`Current date in Vietnam: ${currentDateInVietnam.toString()}`);
    // console.log(`Day of year in Vietnam: ${dayOfYear}`);

    if (themes.length === 0) {
        console.error("No themes available.");
        return { name: 'FallbackDefault', path: 'css/styles.css' }; // Fallback to default
    }

    const themeIndex = (dayOfYear - 1) % themes.length; // -1 because dayOfYear is 1-indexed
    // console.log(`Theme index: ${themeIndex}`);

    return themes[themeIndex];
}

function applyDailyTheme() {
    const todaysCalculatedTheme = getTodaysTheme();
    const nowInVietnam = getCurrentVietnamDate();

    // Format nowInVietnam to YYYY-MM-DD string
    // Ensure month and day are two digits
    const year = nowInVietnam.getFullYear();
    const month = (nowInVietnam.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = nowInVietnam.getDate().toString().padStart(2, '0');
    const currentVietnamDateString = `${year}-${month}-${day}`;

    let lastAppliedThemeName = null;
    let lastAppliedDateString = null;

    try {
        lastAppliedThemeName = localStorage.getItem('lastAppliedThemeName');
        lastAppliedDateString = localStorage.getItem('lastAppliedDateString');
    } catch (e) {
        console.warn('localStorage is not available. Theme persistence will not work.', e);
    }

    if (lastAppliedDateString === null) {
        // Very first run or localStorage was cleared
        console.log('Initial theme application.');
        loadTheme(todaysCalculatedTheme.name);
        if (localStorageAvailable()) {
            localStorage.setItem('lastAppliedThemeName', todaysCalculatedTheme.name);
            localStorage.setItem('lastAppliedDateString', currentVietnamDateString);
        }
    } else if (lastAppliedDateString !== currentVietnamDateString) {
        // It's a new day in Vietnam
        console.log(`New day detected in Vietnam. Applying new daily theme: ${todaysCalculatedTheme.name}`);
        loadTheme(todaysCalculatedTheme.name);
        if (localStorageAvailable()) {
            localStorage.setItem('lastAppliedThemeName', todaysCalculatedTheme.name);
            localStorage.setItem('lastAppliedDateString', currentVietnamDateString);
        }
    } else {
        // Still the same day in Vietnam
        if (lastAppliedThemeName && lastAppliedThemeName !== todaysCalculatedTheme.name) {
            // Theme logic might have changed (e.g., new themes added/removed)
            console.log(`Theme logic changed for today. Updating to: ${todaysCalculatedTheme.name}`);
            loadTheme(todaysCalculatedTheme.name);
            if (localStorageAvailable()) {
                localStorage.setItem('lastAppliedThemeName', todaysCalculatedTheme.name);
            }
        } else if (lastAppliedThemeName) {
            // Correct theme for today was already set, re-apply it (e.g., for page reload)
            console.log(`Re-applying theme for today: ${lastAppliedThemeName}`);
            loadTheme(lastAppliedThemeName);
        } else {
            // Fallback: lastAppliedThemeName is null but it's the same day (should be rare)
            console.log(`Applying calculated theme for today as fallback: ${todaysCalculatedTheme.name}`);
            loadTheme(todaysCalculatedTheme.name);
            if (localStorageAvailable()) {
                localStorage.setItem('lastAppliedThemeName', todaysCalculatedTheme.name);
            }
        }
    }
}

// Helper function to check localStorage availability
function localStorageAvailable() {
    try {
        const testKey = '__themeManagerTestLocalStorage__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}


function initializeThemeManager() {
    console.log('Initializing theme manager...');
    applyDailyTheme();
}

export {
    themes,
    // loadTheme, // Not exported directly
    // getCurrentVietnamDate, // Not exported
    // getTodaysTheme, // Not exported
    // applyDailyTheme, // Not exported
    initializeThemeManager
};
