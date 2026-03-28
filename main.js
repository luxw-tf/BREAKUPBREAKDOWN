import './style.css'
import { initAgentDemo } from './demo-agent.js'

console.log('BreakupBreakdown UI Loaded')

// Initialize the interactive agent execution terminal
initAgentDemo();

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Optional: subtle parallax on the body background
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    // Shift the background position slightly
    document.body.style.backgroundPosition = `${x * 10}px ${y * 10}px`;
});
