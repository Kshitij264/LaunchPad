document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // This function syncs the body class with what the inline script set on <html>
    const syncThemeOnLoad = () => {
        if (document.documentElement.classList.contains('dark-mode-preload')) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    // This function handles the button click
    const setupToggleListener = () => {
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                document.documentElement.classList.toggle('dark-mode-preload');

                let theme = 'light';
                if (document.body.classList.contains('dark-mode')) {
                    theme = 'dark';
                }
                localStorage.setItem('theme', theme);
            });
        }
    };

    syncThemeOnLoad();
    setupToggleListener();
});