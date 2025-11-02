// login.js

document.addEventListener('DOMContentLoaded', () => {
    // Note: The main Cyber Grid animation is handled purely by CSS. 
    // This JS is for enhancing the interactivity and form feedback.

    // --- Input Interaction Animation: Live Label Shift (Upgrade) ---
    document.querySelectorAll('.input-group input').forEach(input => {
        const label = input.previousElementSibling;
        
        // Function to check if input has content or is focused
        const updateLabel = () => {
            if (input.value || input === document.activeElement) {
                label.style.transform = 'translateY(-10px) scale(0.9)';
                label.style.color = 'var(--color-accent)';
            } else {
                label.style.transform = 'translateY(0) scale(1)';
                label.style.color = '#A0A0C0';
            }
        };

        input.addEventListener('focus', updateLabel);
        input.addEventListener('blur', updateLabel);
        
        // Initial check on load
        updateLabel();
    });

    // --- Form Submission Logic (Enhanced Feedback) ---
    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => {
        // e.preventDefault();
        
        const button = form.querySelector('.cta-button');
        const originalText = button.textContent;
        
        button.textContent = 'AUTHORIZING...';
        button.disabled = true;
        button.classList.add('loading-animation');

        setTimeout(() => {
            // Success State (Simulated)
            button.textContent = 'ACCESS GRANTED';
            button.classList.remove('loading-animation');
            button.style.backgroundColor = '#4CAF50'; // Green success color
            button.style.boxShadow = '0 0 10px #4CAF50';
            
            // Reset after a delay
            setTimeout(() => {
                 button.textContent = originalText;
                 button.disabled = false;
                 button.style.removeProperty('background-color');
                 button.style.removeProperty('box-shadow');
            }, 1000);

        }, 1500); 
    });
});