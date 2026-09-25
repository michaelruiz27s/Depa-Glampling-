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

    // --- Lightbox Modal (Flyer Viewer) con navegación de Carrusel, Zoom & Paneo ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxDl = document.getElementById('lightbox-dl');
    const lightboxViewport = document.getElementById('lightbox-viewport');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const zoomLevelText = document.getElementById('zoom-level-text');

    let currentZoom = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    function applyZoomTransform() {
        if (!lightboxImg) return;
        lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
        if (zoomLevelText) {
            zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
        }
        if (lightboxViewport) {
            if (currentZoom > 1) {
                lightboxViewport.style.cursor = isDragging ? 'grabbing' : 'grab';
            } else {
                lightboxViewport.style.cursor = 'zoom-in';
            }
        }
    }

    function resetZoom() {
        currentZoom = 1;
        panX = 0;
        panY = 0;
        applyZoomTransform();
    }

    function zoomIn() {
        if (currentZoom < 3.5) {
            currentZoom = Math.min(3.5, Math.round((currentZoom + 0.25) * 100) / 100);
            applyZoomTransform();
        }
    }

    function zoomOut() {
        if (currentZoom > 0.6) {
            currentZoom = Math.max(0.5, Math.round((currentZoom - 0.25) * 100) / 100);
            if (currentZoom <= 1) {
                panX = 0;
                panY = 0;
            }
            applyZoomTransform();
        }
    }

    if (zoomInBtn) zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); zoomIn(); });
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); zoomOut(); });
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', (e) => { e.stopPropagation(); resetZoom(); });

    // Zoom con rueda del ratón en la imagen
    if (lightboxViewport) {
        lightboxViewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        }, { passive: false });

        // Toggle zoom al hacer clic/doble clic
        lightboxViewport.addEventListener('click', (e) => {
            if (e.target === lightboxImg) {
                if (currentZoom === 1) {
                    currentZoom = 1.75;
                    applyZoomTransform();
                } else if (currentZoom > 1.75) {
                    resetZoom();
                } else {
                    zoomIn();
                }
            }
        });

        // Arrastrar imagen con mouse (Pan)
        lightboxViewport.addEventListener('mousedown', (e) => {
            if (currentZoom <= 1) return;
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            lightboxViewport.classList.add('is-dragging');
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            applyZoomTransform();
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (lightboxViewport) lightboxViewport.classList.remove('is-dragging');
                applyZoomTransform();
            }
        });

        // Gestos táctiles para móviles (Touch pinch & drag)
        let initialTouchDist = 0;
        let initialZoom = 1;
        lightboxViewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && currentZoom > 1) {
                isDragging = true;
                startX = e.touches[0].clientX - panX;
                startY = e.touches[0].clientY - panY;
            } else if (e.touches.length === 2) {
                isDragging = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialTouchDist = Math.hypot(dx, dy);
                initialZoom = currentZoom;
            }
        }, { passive: true });

        lightboxViewport.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isDragging && currentZoom > 1) {
                panX = e.touches[0].clientX - startX;
                panY = e.touches[0].clientY - startY;
                applyZoomTransform();
            } else if (e.touches.length === 2 && initialTouchDist > 0) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDist = Math.hypot(dx, dy);
                const factor = currentDist / initialTouchDist;
                currentZoom = Math.min(3.5, Math.max(0.8, initialZoom * factor));
                applyZoomTransform();
            }
        }, { passive: true });

        lightboxViewport.addEventListener('touchend', () => {
            isDragging = false;
            initialTouchDist = 0;
            if (currentZoom < 1) resetZoom();
        });
    }

    const galleryImages = [
        'assets/plan-relax-spa.webp',
        'assets/suite-orquideas.webp',
        'assets/suite-aves-del-paraiso.webp',
        'assets/suite-margaritas.webp',
        'assets/suite-eugenias.webp',
        'assets/pasadia.webp',
        'assets/decoracion-elios.webp',
        'assets/decoracion-estandar-casita.webp',
        'assets/decoracion-estandar-suites.webp',
        'assets/decoracion-pizarra.webp',
        'assets/spa-services.webp',
        'assets/included-menu.webp'
    ];
    let currentGalleryIndex = 0;

    window.openLightbox = (imageSrc) => {
        if (!imageSrc) return;
        resetZoom();

        // Normalizar filename (soporta guiones y guiones bajos indistintamente)
        const cleanBase = imageSrc.split('/').pop().replace(/[-_]/g, '').toLowerCase();
        const matchedIndex = galleryImages.findIndex(img => {
            const imgBase = img.split('/').pop().replace(/[-_]/g, '').toLowerCase();
            return imgBase === cleanBase;
        });

        if (matchedIndex !== -1) {
            currentGalleryIndex = matchedIndex;
            updateLightboxImage();
        } else {
            // Si es una ruta directa no indexada
            lightboxImg.src = imageSrc;
            if (lightboxDl) lightboxDl.href = imageSrc;
            lightboxCaption.textContent = "Visualización de Imagen";
        }

        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Deshabilitar scroll de página
    };

    window.closeLightbox = () => {
        resetZoom();
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto'; // Habilitar scroll de página
    };

    window.prevLightbox = (e) => {
        if (e) e.stopPropagation();
        resetZoom();
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightboxImage();
    };

    window.nextLightbox = (e) => {
        if (e) e.stopPropagation();
        resetZoom();
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
        updateLightboxImage();
    };

    function updateLightboxImage() {
        const src = galleryImages[currentGalleryIndex];
        lightboxImg.src = src;
        if (lightboxDl) lightboxDl.href = src;
        
        let caption = "Folleto Promocional";
        if (src.includes('plan-relax-spa')) caption = "Folleto: Casita Mágica (Planes Relax y Spa)";
        else if (src.includes('suite-orquideas')) caption = "Folleto: Tarifas Suite Orquídeas";
        else if (src.includes('suite-aves-del-paraiso')) caption = "Folleto: Tarifas Suite Aves del Paraíso";
        else if (src.includes('suite-margaritas')) caption = "Folleto: Tarifas Suite Margaritas";
        else if (src.includes('suite-eugenias')) caption = "Folleto: Tarifas Suite Eugenias";
        else if (src.includes('pasadia')) caption = "Folleto: Plan Pasadía";
        else if (src.includes('decoracion-elios')) caption = "Detalles: Decoración Elios";
        else if (src.includes('decoracion-estandar-casita')) caption = "Detalles: Decoración Estándar para Casita Mágica";
        else if (src.includes('decoracion-estandar-suites')) caption = "Detalles: Decoración Estándar para Margaritas y Aves del Paraíso";
        else if (src.includes('decoracion-pizarra')) caption = "Detalles: Decoración Pizarra para Suite Eugenias";
        else if (src.includes('spa-services')) caption = "Folleto: Servicios de Spa";
        else if (src.includes('included-menu')) caption = "Detalles: Alimentación Incluida (Desayunos y Almuerzos/Cenas)";
        
        lightboxCaption.textContent = caption;
    }

    // Navegación con teclado para Lightbox (+ y - para zoom)
    document.addEventListener('keydown', (e) => {
        if (lightbox && lightbox.style.display === 'flex') {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                prevLightbox();
            } else if (e.key === 'ArrowRight') {
                nextLightbox();
            } else if (e.key === '+' || e.key === '=') {
                zoomIn();
            } else if (e.key === '-') {
                zoomOut();
            } else if (e.key === '0') {
                resetZoom();
            }
        }
    });

    // --- Inline Validation Helpers ---
    function showError(inputEl, errorEl, message) {
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('active');
        }
        if (inputEl) {
            inputEl.classList.add('input-error-shake');
            // Remove shake animation class after 400ms
            setTimeout(() => {
                inputEl.classList.remove('input-error-shake');
            }, 400);
        }
    }

    function clearError(inputEl, errorEl) {
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('active');
        }
        if (inputEl) {
            inputEl.classList.remove('input-error-shake');
        }
    }

    // Clear errors on user input
    if (clientNameInput) clientNameInput.addEventListener('input', () => clearError(clientNameInput, clientNameError));
    if (suiteSelect) suiteSelect.addEventListener('change', () => clearError(suiteSelect, suiteSelectError));
    if (peopleCountSelect) peopleCountSelect.addEventListener('change', () => clearError(peopleCountSelect, peopleCountError));
    if (bookingDateInput) bookingDateInput.addEventListener('change', () => clearError(bookingDateInput, bookingDateError));

    // --- Dynamic Form Logic & Live Calculator ---

    // Room configurations
    const roomConfigs = {
        'Casita Mágica': {
            capacities: [2, 3, 4],
            decorations: [
                { name: 'Ninguna', price: 0 },
                { name: 'Decoración Estándar', price: 59000 },
                { name: 'Decoración Elios', price: 180000 }
            ]
        },
        'Suite Orquídeas': {
            capacities: [2, 3, 4],
            decorations: [
                { name: 'Ninguna', price: 0 },
                { name: 'Decoración Elios', price: 180000 }
            ]
        },
        'Suite Aves del Paraíso': {
            capacities: [2],
            decorations: [
                { name: 'Ninguna', price: 0 },
                { name: 'Decoración Estándar', price: 59000 },
                { name: 'Decoración Pétalos', price: 85000 },
                { name: 'Decoración Globos', price: 125000 },
                { name: 'Decoración Velas', price: 136000 },
                { name: 'Decoración Elios', price: 140000 }
            ]
        },
        'Suite Margaritas': {
            capacities: [2],
            decorations: [
                { name: 'Ninguna', price: 0 },
                { name: 'Decoración Estándar', price: 59000 },
                { name: 'Decoración Pétalos', price: 85000 },
                { name: 'Decoración Globos', price: 125000 },
                { name: 'Decoración Velas', price: 136000 },
                { name: 'Decoración Elios', price: 140000 }
            ]
        },
        'Suite Eugenias': {
            capacities: [2, 3, 4, 5, 6, 7, 8],
            decorations: [
                { name: 'Ninguna', price: 0 },
                { name: 'Decoración Pizarra', price: 70000 },
                { name: 'Decoración Elios', price: 180000 }
            ]
        },
        'Pasadía': {
            capacities: [2],
            decorations: [
                { name: 'Ninguna', price: 0 }
            ]
        }
    };

    // Spa Services pricing
    const spaConfig = {
        'Ninguno': 0,
        'Spa Relajante 1p': 95000,
        'Spa Relajante 2p': 165000,
        'Spa Piedras 1p': 140000,
        'Spa Piedras 2p': 240000
    };

    // Populate dropdowns and update layout based on room selection
    suiteSelect.addEventListener('change', () => {
        const suite = suiteSelect.value;
        if (!suite) return;

        const config = roomConfigs[suite];

        // 1. Show/Hide sub-plans for Casita Mágica
        if (suite === 'Casita Mágica') {
            subplanGroup.style.display = 'block';
            subplanSelect.setAttribute('required', 'required');
        } else {
            subplanGroup.style.display = 'none';
            subplanSelect.removeAttribute('required');
        }

        // 2. Populate capacities
        peopleCountSelect.innerHTML = '';
        config.capacities.forEach(cap => {
            const option = document.createElement('option');
            option.value = cap;
            option.textContent = `${cap} Personas`;
            peopleCountSelect.appendChild(option);
        });

        // 3. Populate decorations
        decorSelect.innerHTML = '';
        config.decorations.forEach(dec => {
            const option = document.createElement('option');
            option.value = dec.name;
            option.textContent = dec.price > 0 ? `${dec.name} (+$${dec.price.toLocaleString()} COP)` : dec.name;
            option.dataset.price = dec.price;
            decorSelect.appendChild(option);
        });

        // Auto-check weekday promo checkbox based on date (optional enhancement)
        checkWeekdayStatus();
        updatePriceCalculator();
    });

    // Auto-calculate weekday rates when dates change
    bookingDateInput.addEventListener('change', () => {
        checkWeekdayStatus();
        updatePriceCalculator();
    });

    subplanSelect.addEventListener('change', updatePriceCalculator);
    peopleCountSelect.addEventListener('change', updatePriceCalculator);
    decorSelect.addEventListener('change', updatePriceCalculator);
    spaSelect.addEventListener('change', updatePriceCalculator);
    weekdayPromoCheckbox.addEventListener('change', updatePriceCalculator);

    // Check if the selected date falls on a weekday (Sunday to Thursday)
});