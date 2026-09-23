// Proyecto de Curso: Ingeniería de Software I - UNI RUSB
// Lógica de interacción, cotizador en vivo y asistente virtual - Dapa Glamping

document.addEventListener('DOMContentLoaded', () => {

    // --- Navigation & Theme Elements ---
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const navLinksContainer = document.getElementById('nav-links');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // --- Control de Modo Oscuro / Claro ---
    const savedTheme = localStorage.getItem('dapa-theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            themeToggleBtn.setAttribute('title', 'Cambiar a modo claro');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('dapa-theme', 'light');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
                themeToggleBtn.setAttribute('title', 'Cambiar a modo oscuro');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('dapa-theme', 'dark');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
                themeToggleBtn.setAttribute('title', 'Cambiar a modo claro');
            }
        });
    }

    // --- Form Elements ---
    const bookingForm = document.getElementById('booking-form');
    const clientNameInput = document.getElementById('client-name');
    const suiteSelect = document.getElementById('suite-select');
    const subplanGroup = document.getElementById('subplan-group');
    const subplanSelect = document.getElementById('subplan-select');
    const peopleCountSelect = document.getElementById('people-count');
    const bookingDateInput = document.getElementById('booking-date');
    const decorSelect = document.getElementById('decor-select');
    const spaSelect = document.getElementById('spa-select');
    const weekdayPromoCheckbox = document.getElementById('weekday-promo');
    const extraCommentsTextarea = document.getElementById('extra-comments');

    // --- Inline Error Spans ---
    const clientNameError = document.getElementById('client-name-error');
    const suiteSelectError = document.getElementById('suite-select-error');
    const peopleCountError = document.getElementById('people-count-error');
    const bookingDateError = document.getElementById('booking-date-error');

    // --- Live Calculator Box ---
    const calcAccommodation = document.getElementById('calc-accommodation');
    const calcDecorRow = document.getElementById('calc-decor-row');
    const calcDecor = document.getElementById('calc-decor');
    const calcSpaRow = document.getElementById('calc-spa-row');
    const calcSpa = document.getElementById('calc-spa');
    const calcTotal = document.getElementById('calc-total');

    // Restringir selector de fecha para no permitir días pasados
    if (bookingDateInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        bookingDateInput.setAttribute('min', todayStr);
    }

    // --- Sticky Navbar on Scroll ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active Link Highlighting (Scroll Spy)
        let currentSection = 'inicio';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

    // --- Mobile Menu Toggle ---
    mobileMenuBtn.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (navLinksContainer.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        });
    });

    // --- Room Selection Helper (from Suites cards) ---
    window.selectSuite = (suiteName) => {
        suiteSelect.value = suiteName;
        // Trigger change event to populate dropdowns
        const event = new Event('change');
        suiteSelect.dispatchEvent(event);

        // Clear existing errors since they chose a suite
        if (suiteSelectError) clearError(suiteSelect, suiteSelectError);

        // Smooth scroll to booking section
        const target = document.querySelector('#reservas');
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
            // Auto-focus the client name field after scroll finishes
            setTimeout(() => {
                clientNameInput.focus();
            }, 600);
        }
    };

});