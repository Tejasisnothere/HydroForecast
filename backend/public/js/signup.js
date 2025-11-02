// signup.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Live Label Shift (Re-used for consistency) ---
    document.querySelectorAll('.input-group input').forEach(input => {
        // ... (Same label shift logic as in login.js) ...
        const label = input.previousElementSibling;
        
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
        
        updateLabel();
    });

    // --- Dynamic Password Validation and Match ---
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    function checkPasswordMatch() {
        const passValue = passwordInput.value;
        const confirmValue = confirmPasswordInput.value;
        const confirmGroup = confirmPasswordInput.closest('.input-group');
        
        if (confirmValue === '') {
            confirmGroup.classList.remove('error', 'success');
            return false;
        }

        if (passValue === confirmValue) {
            confirmGroup.classList.remove('error');
            confirmGroup.classList.add('success');
            return true;
        } else {
            confirmGroup.classList.remove('success');
            confirmGroup.classList.add('error');
            return false;
        }
    }

    passwordInput.addEventListener('input', checkPasswordMatch);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    // --- Form Submission ---
    const form = document.getElementById('signup-form');
    form.addEventListener('submit', (e) => {
        if (!checkPasswordMatch()) {
            e.preventDefault();
            // Provide a visual shake animation on the form for failed validation
            const card = document.querySelector('.auth-card');
            card.style.animation = 'shake 0.5s';
            setTimeout(() => card.style.animation = '', 500);
            return;
        }

        // ... (Submission/button animation logic as in login.js) ...
        const button = form.querySelector('.cta-button');
        button.textContent = 'INITIATING...';
        button.disabled = true;
        // ...
    });

    /* Add a shake animation keyframe (if not already in CSS) */
    /* @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
    }
    */
});