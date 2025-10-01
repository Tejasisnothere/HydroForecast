// script.js

// --- 1. Form Switching Logic (Dynamic Form Transition) ---

function switchForm(formType) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');

    // 1. Update Tabs (Immediate CSS Change)
    loginTab.classList.remove('active');
    signupTab.classList.remove('active');
    document.getElementById(formType + '-tab').classList.add('active');

    // 2. Animate and Switch Forms
    if (formType === 'login') {
        // Hide signup form with fade/slide out
        signupForm.style.opacity = '0';
        signupForm.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            // Show login form with fade/slide in
            setTimeout(() => {
                loginForm.style.opacity = '1';
                loginForm.style.transform = 'translateX(0)';
            }, 50); // Small delay for the 'display' change to register
        }, 400); // Wait for the fade-out duration (0.4s)
        
        loginForm.style.opacity = '0'; // Reset opacity for animation
        loginForm.style.transform = 'translateX(20px)'; // Start position for slide-in
        
    } else { /* formType === 'signup' */
        // Similar logic for switching from login to signup
        loginForm.style.opacity = '0';
        loginForm.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            setTimeout(() => {
                signupForm.style.opacity = '1';
                signupForm.style.transform = 'translateX(0)';
            }, 50);
        }, 400);
        
        signupForm.style.opacity = '0';
        signupForm.style.transform = 'translateX(-20px)';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial state for animations (already handled by CSS, but good practice)
    document.getElementById('signup-form').style.opacity = '0';
    document.getElementById('signup-form').style.transform = 'translateX(0)';
    
    // --- 2. Dynamic Background (Subtle 'Starfield' or 'Floating Particles') ---
    
    const bg = document.querySelector('.background-animation');
    const numParticles = 30; // Fewer particles for subtlety

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random position, size, and duration
        const size = Math.random() * 2 + 1; // 1px to 3px
        const duration = Math.random() * 10 + 10; // 10s to 20s
        const delay = Math.random() * 10; // 0s to 10s delay

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        bg.appendChild(particle);
    }
});

/* Additional CSS for particles (in style.css) */
/*
.particle {
    position: absolute;
    background-color: rgba(0, 173, 181, 0.5); // Semi-transparent accent color
    border-radius: 50%;
    animation: floatAndGlow linear infinite;
    opacity: 0.8;
}

@keyframes floatAndGlow {
    0% { transform: translate(0, 0) rotate(0); opacity: 0.8; }
    25% { transform: translate(10vw, 5vh) rotate(45deg); opacity: 0.9; }
    50% { transform: translate(0, 10vh) rotate(90deg); opacity: 0.7; }
    75% { transform: translate(-10vw, 5vh) rotate(135deg); opacity: 0.9; }
    100% { transform: translate(0, 0) rotate(180deg); opacity: 0.8; }
}
*/