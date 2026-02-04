(function() {
    // Check if mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // Create toggle button
    function createToggleButton() {
        const header = document.querySelector('.site-header');
        const navLinks = document.querySelector('.nav-links');
        const headerContainer = document.querySelector('.header-container');
        
        if (!isMobile() || !header || !navLinks || !headerContainer) return;
        
        // Check if toggle already exists
        if (document.querySelector('.nav-toggle')) return;
        
        // Add mobile styles
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .nav-toggle {
                    display: block !important;
                    background: none;
                    border: none;
                    color: #ff0055;
                    font-size: 1.8em;
                    cursor: pointer;
                    padding: 10px;
                    position: absolute;
                    right: 10px;
                    top: 10px;
                }
                
                .site-header {
                    position: fixed !important;
                    top: 0;
                    left: 0;
                    right: 0;
                    transition: transform 0.3s ease;
                    z-index: 1000;
                }
                
                .site-header.hidden {
                    transform: translateY(-100%);
                }
                
                .nav-links {
                    position: absolute !important;
                    top: 100% !important;
                    left: 0 !important;
                    right: 0 !important;
                    background: #121212 !important;
                    flex-direction: column !important;
                    max-height: 0 !important;
                    overflow: hidden !important;
                    opacity: 0 !important;
                    transition: all 0.3s ease !important;
                    padding: 0 !important;
                    box-shadow: 0 10px 15px rgba(0,0,0,0.5) !important;
                    z-index: 999;
                }
                
                .nav-links.active {
                    max-height: 500px !important;
                    opacity: 1 !important;
                    padding: 20px 0 !important;
                }
                
                body {
                    padding-top: 80px !important;
                }
            }
            
            @media (min-width: 769px) {
                .nav-toggle {
                    display: none !important;
                }
                
                .site-header.hidden {
                    transform: none !important;
                }
                
                body {
                    padding-top: 0 !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'nav-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        toggleBtn.setAttribute('aria-label', 'Toggle navigation');
        
        // Add button to header
        headerContainer.appendChild(toggleBtn);
        
        // Toggle nav on click
        toggleBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            const icon = this.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.className = 'fas fa-chevron-up';
            } else {
                icon.className = 'fas fa-chevron-down';
            }
        });
        
        // Close nav when clicking links
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                if (isMobile()) {
                    navLinks.classList.remove('active');
                    const icon = toggleBtn.querySelector('i');
                    icon.className = 'fas fa-chevron-down';
                }
            });
        });
    }
    
    // Handle scroll behavior
    function handleScroll() {
        const header = document.querySelector('.site-header');
        if (!isMobile() || !header) return;
        
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        function updateScroll() {
            const currentScrollY = window.scrollY;
            
            // If scrolled down more than 50px and scrolling down
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                header.classList.add('hidden');
            } 
            // If scrolling up
            else if (currentScrollY < lastScrollY) {
                header.classList.remove('hidden');
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        }
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateScroll);
                ticking = true;
            }
        });
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        createToggleButton();
        handleScroll();
        
        // Update on resize
        window.addEventListener('resize', function() {
            if (isMobile()) {
                createToggleButton();
                handleScroll();
            } else {
                // Remove hidden class on desktop
                const header = document.querySelector('.site-header');
                if (header) header.classList.remove('hidden');
            }
        });
    }
})();