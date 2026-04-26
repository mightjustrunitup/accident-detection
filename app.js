document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');

    // Page Titles corresponding to tab IDs
    const titles = {
        'home': 'Home',
        'report': 'Report Accident',
        'map': 'Map Area',
        'profile': 'My Profile'
    };

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // 1. Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // 2. Add active class to clicked item
            this.classList.add('active');

            // 3. Get target page id
            const targetId = this.getAttribute('data-target');

            // 4. Update the Header Title
            if (titles[targetId]) {
                pageTitle.textContent = titles[targetId];
            }

            // 5. Hide all pages
            pages.forEach(page => page.classList.remove('active'));

            // 6. Show target page
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Slight haptic feedback logic if available (supported on some mobile browsers)
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50); // Light tap
            }
        });
    });

    // =========================================
    // Onboarding Logic
    // =========================================
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.dot');
    const btnNext = document.getElementById('btn-next');
    const btnSkip = document.getElementById('btn-skip');
    let currentSlideIndex = 0;

    // Check if user has already onboarded
    let hasOnboarded = false;
    try {
        // Uncomment the next line to manually reset the onboarding flow during testing:
        // localStorage.removeItem('hasOnboarded');
        hasOnboarded = localStorage.getItem('hasOnboarded');
    } catch (error) {
        console.warn('localStorage is blocked (common on local file:/// URLs). Showing onboarding by default.', error);
    }

    if (!hasOnboarded) {
        onboardingOverlay.classList.add('show');
    }

    function updateSlides(newIndex) {
        // Remove active state from current items
        slides[currentSlideIndex].classList.remove('active');
        slides[currentSlideIndex].classList.add('previous'); // Slide out to left
        dots[currentSlideIndex].classList.remove('active');

        currentSlideIndex = newIndex;

        // Add active state to new items
        slides[currentSlideIndex].classList.remove('previous'); // In case stepping backward (if implemented later)
        slides[currentSlideIndex].classList.add('active');
        dots[currentSlideIndex].classList.add('active');

        // Update button text on last slide
        if (currentSlideIndex === slides.length - 1) {
            btnNext.textContent = 'Get Started';
        } else {
            btnNext.textContent = 'Next';
        }
    }

    function completeOnboarding() {
        try {
            localStorage.setItem('hasOnboarded', 'true');
        } catch (error) {
            console.warn('Could not set localStorage', error);
        }
        onboardingOverlay.classList.remove('show');
        setTimeout(() => {
            onboardingOverlay.style.display = 'none'; // Completely remove from layout
        }, 400); // Matches transition duration
    }

    if(btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentSlideIndex < slides.length - 1) {
                updateSlides(currentSlideIndex + 1);
            } else {
                completeOnboarding();
            }
        });
    }

    if(btnSkip) {
        btnSkip.addEventListener('click', completeOnboarding);
    }
});
