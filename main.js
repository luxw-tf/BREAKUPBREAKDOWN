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
});

// Scroll Parallax Logic for "How It Works"
const parallaxWrapper = document.querySelector('.parallax-wrapper');
if (parallaxWrapper) {
    const cards = document.querySelectorAll('.parallax-card');
    const progressBar = document.querySelector('.parallax-progress');

    window.addEventListener('scroll', () => {
        const wrapperRect = parallaxWrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Ensure scrolling only activates when wrapper is active in viewport
        const endScroll = wrapperRect.height - viewportHeight;
        
        let progress = -wrapperRect.top / endScroll;
        progress = Math.max(0, Math.min(1, progress));
        
        // Update progress bar
        if (progressBar) {
            progressBar.style.height = `${progress * 100}%`;
        }

        const totalCards = cards.length;
        const cardProgress = progress * totalCards;

        cards.forEach((card, index) => {
            // Distance from current scroll position to this card's center (index + 0.5)
            const center = index + 0.5;
            const distance = cardProgress - center;
            
            // Clamp distance strictly between -1 and 1 to prevent overshoot physics
            const clampedDistance = Math.max(-1, Math.min(1, distance));

            // Easing: Cubic function to flatten the curve near 0 (card stays in center longer)
            const easedDistance = Math.pow(clampedDistance, 3);

            // Opacity: Bell curve that holds near peak and drops rapidly
            let opacity = 1 - Math.pow(Math.abs(clampedDistance), 2) * 1.5;
            opacity = Math.max(0, Math.min(1, opacity));

            // Scale: Slight pop-up to 1.05 when centered
            const scale = 1 + (0.05 * (1 - Math.abs(clampedDistance)));

            // Transform sliding: moves quickly out from center
            const yOffset = easedDistance * 100;
            
            card.style.opacity = opacity;
            card.style.transform = `translateY(-50%) translateY(${yOffset}px) scale(${scale})`;
            
            // Interaction logic
            card.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
            card.style.zIndex = Math.round(opacity * 100);
        });
    });
    
    // Trigger on load
    window.dispatchEvent(new Event('scroll'));
}
