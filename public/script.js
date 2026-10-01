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
    function checkWeekdayStatus() {
        const dateVal = bookingDateInput.value;
        if (!dateVal) return;

        const dateObj = new Date(dateVal + 'T00:00:00'); // Prevent timezone shift
        const day = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday

        const suite = suiteSelect.value;

        if (suite === 'Pasadía') {
            // For Pasadía, "weekday" applies Monday to Friday and Sunday
            // Saturday is the only "Saturday" rate
            if (day === 6) { // Saturday
                weekdayPromoCheckbox.checked = false;
            } else {
                weekdayPromoCheckbox.checked = true;
            }
        } else {
            // For general suites, weekday rates apply Sunday to Thursday (0 to 4)
            if (day >= 0 && day <= 4) {
                weekdayPromoCheckbox.checked = true;
            } else {
                weekdayPromoCheckbox.checked = false;
            }
        }
    }

    // Main calculator logic
    function updatePriceCalculator() {
        const suite = suiteSelect.value;
        if (!suite) {
            calcTotal.textContent = "$0 COP";
            return;
        }

        const isWeek = weekdayPromoCheckbox.checked;
        const people = parseInt(peopleCountSelect.value) || 2;
        let accommodationPrice = 0;

        // 1. Calculate accommodation price
        if (suite === 'Casita Mágica') {
            const subplan = subplanSelect.value;
            if (subplan === 'Plan Relax') accommodationPrice = 200000;
            else if (subplan === 'Plan Spa') accommodationPrice = 359900;
            else if (subplan === 'Plan Full') accommodationPrice = 399900;
            
            // Add extra people charge: $30,000 COP per extra person above 2
            const extraPeople = Math.max(0, people - 2);
            accommodationPrice += extraPeople * 30000;
        } 
        else if (suite === 'Suite Orquídeas') {
            if (isWeek) {
                if (people === 2) accommodationPrice = 590000;
                else if (people === 3) accommodationPrice = 710000;
                else if (people >= 4) accommodationPrice = 810000;
            } else {
                if (people === 2) accommodationPrice = 650000;
                else if (people === 3) accommodationPrice = 770000;
                else if (people >= 4) accommodationPrice = 880000;
            }
        } 
        else if (suite === 'Suite Aves del Paraíso' || suite === 'Suite Margaritas') {
            accommodationPrice = isWeek ? 420000 : 490000;
        } 
        else if (suite === 'Suite Eugenias') {
            // Eugenias pricing: base is for 2, 3, or 4 people
            // For people from 5 to 8, add $160,000 COP per extra person
            let basePrice = 0;
            if (isWeek) {
                if (people === 2) basePrice = 590000;
                else if (people === 3) basePrice = 710000;
                else if (people >= 4) basePrice = 810000;
            } else {
                if (people === 2) basePrice = 650000;
                else if (people === 3) basePrice = 770000;
                else if (people >= 4) basePrice = 880000;
            }
            
            const extraPeople = Math.max(0, people - 4);
            accommodationPrice = basePrice + (extraPeople * 160000);
        } 
        else if (suite === 'Pasadía') {
            accommodationPrice = isWeek ? 320000 : 360000;
        }

        calcAccommodation.textContent = `$${accommodationPrice.toLocaleString()} COP`;

        // 2. Calculate decoration price
        let decorPrice = 0;
        const selectedDecorOption = decorSelect.options[decorSelect.selectedIndex];
        if (selectedDecorOption && decorSelect.value !== 'Ninguna') {
            decorPrice = parseInt(selectedDecorOption.dataset.price) || 0;
            calcDecorRow.style.display = 'flex';
            calcDecor.textContent = `+$${decorPrice.toLocaleString()} COP`;
        } else {
            calcDecorRow.style.display = 'none';
        }

        // 3. Calculate spa price
        let spaPrice = 0;
        const spaVal = spaSelect.value;
        if (spaVal && spaVal !== 'Ninguno') {
            spaPrice = spaConfig[spaVal] || 0;
            calcSpaRow.style.display = 'flex';
            calcSpa.textContent = `+$${spaPrice.toLocaleString()} COP`;
        } else {
            calcSpaRow.style.display = 'none';
        }

        // 4. Calculate total
        const total = accommodationPrice + decorPrice + spaPrice;
        calcTotal.textContent = `$${total.toLocaleString()} COP`;


    }



    // --- WhatsApp Message Generator & Form Submit ---
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = clientNameInput.value.trim();
        const suite = suiteSelect.value;
        const subplan = suite === 'Casita Mágica' ? subplanSelect.value : '';
        const people = peopleCountSelect.value;
        const date = bookingDateInput.value;
        const decor = decorSelect.value;
        const spa = spaSelect.value;
        const isWeek = weekdayPromoCheckbox.checked;
        const notes = extraCommentsTextarea.value.trim();

        const totalText = calcTotal.textContent;

        // Clear all previous errors
        clearError(clientNameInput, clientNameError);
        clearError(suiteSelect, suiteSelectError);
        clearError(peopleCountSelect, peopleCountError);
        clearError(bookingDateInput, bookingDateError);

        let hasError = false;

        if (!name) {
            showError(clientNameInput, clientNameError, 'Por favor, ingresa tu nombre completo.');
            hasError = true;
        }
        if (!suite) {
            showError(suiteSelect, suiteSelectError, 'Por favor, selecciona una suite.');
            hasError = true;
        }
        if (!date) {
            showError(bookingDateInput, bookingDateError, 'Por favor, selecciona una fecha.');
            hasError = true;
        }

        if (hasError) return;

        // --- VALIDACIONES DE CAPACIDAD Y DECORACIONES ---
        const config = roomConfigs[suite];
        if (config) {
            // 1. Validar que la capacidad no exceda lo configurado
            const maxCap = Math.max(...config.capacities);
            if (parseInt(people) > maxCap) {
                showError(peopleCountSelect, peopleCountError, `La suite '${suite}' solo permite un máximo de ${maxCap} persona(s).`);
                return;
            }

            // 2. Validar que la decoración sea permitida para esa suite
            const validDecors = config.decorations.map(d => d.name);
            if (decor && decor !== 'Ninguna' && !validDecors.includes(decor)) {
                showError(decorSelect, null, `La decoración no está disponible para esta suite.`);
                return;
            }
        }

        // Format date beautifully
        const dateObj = new Date(date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });

        // Construct message
        let msg = `🏕️ *SOLICITUD DE RESERVA - DAPA GLAMPING* 🏕️\n`;
        msg += `--------------------------------------------------\n`;
        msg += `👤 *Cliente:* ${name}\n`;
        msg += `🏨 *Hospedaje:* ${suite}${subplan ? ` (${subplan})` : ''}\n`;
        msg += `📅 *Fecha de estadía:* ${formattedDate}\n`;
        msg += `👥 *Huéspedes:* ${people} persona(s)\n`;
        
        if (decor && decor !== 'Ninguna') {
            msg += `✨ *Decoración:* ${decor}\n`;
        }
        
        if (spa && spa !== 'Ninguno') {
            // Extraer solo el nombre del servicio eliminando el precio de la etiqueta
            const spaLabel = spaSelect.options[spaSelect.selectedIndex].textContent.split(' - ')[0];
            msg += `💆 *Servicio de Spa:* ${spaLabel}\n`;
        }
        
        msg += `🔥 *Tarifa especial semana:* ${isWeek ? 'Sí (Solicito descuento de semana)' : 'No (Fin de semana/Festivos)'}\n`;
        

        if (notes) {
            msg += `💬 *Notas adicionales:* "${notes}"\n`;
        }
        
        msg += `--------------------------------------------------\n`;
        msg += `💰 *VALOR ESTIMADO:* ${totalText}\n`;
        msg += `--------------------------------------------------\n`;
        msg += `_Este mensaje es una cotización estimada de pre-reserva. Por favor, confirmen disponibilidad._`;

        const numericTotal = parseInt(totalText.replace(/[^0-9]/g, ''), 10) || 0;

        fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clienteNombre: name,
                suite: suite,
                subplan: subplan || null,
                numPersonas: parseInt(people, 10),
                fechaReserva: date,
                decoracion: decor,
                spa: spa,
                esTarifaSemana: Boolean(isWeek),
                comentarios: notes,
                precioTotal: numericTotal
            })
        }).catch(() => {});

        // Encode URI and redirect to WhatsApp Web / Mobile App
        const whatsappNumber = '573172309090';
        const encodedMsg = encodeURIComponent(msg);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;

        // Open in new tab
        window.open(whatsappUrl, '_blank');
    });

    // --- Scroll Reveal Animation with Intersection Observer ---
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target); // Stop observing once revealed
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => el.classList.add('revealed'));
    }

    // --- Floating Chatbot Usability & Response Logic ---
    const chatbotBubble = document.getElementById('chatbot-bubble-btn');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close-btn');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotForm = document.getElementById('chatbot-input-area');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotBadge = document.querySelector('.chatbot-badge');

    // Toggle window
    if (chatbotBubble && chatbotWindow) {
        chatbotBubble.addEventListener('click', () => {
            chatbotWindow.classList.toggle('active');
            if (chatbotBadge) chatbotBadge.style.display = 'none'; // Clear notification badge
        });
    }

    if (chatbotClose && chatbotWindow) {
        chatbotClose.addEventListener('click', () => {
            chatbotWindow.classList.remove('active');
        });
    }

    // Scroll chat to bottom helper
    function scrollChatToBottom() {
        if (chatbotMessages) {
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
    }

    // Add message to chat area helper (con escape para el usuario)
    function appendMessage(sender, text) {
        if (!chatbotMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        const p = document.createElement('p');
        if (sender === 'user') {
            p.textContent = text; // Previene inyección XSS de texto arbitrario
        } else {
            p.innerHTML = text; // Permite enlaces y formato seguro generado por el bot
        }
        msgDiv.appendChild(p);
        chatbotMessages.appendChild(msgDiv);
        scrollChatToBottom();
    }

    // Core conversational bot parsing logic
    function getBotResponse(rawText) {
        const text = rawText.toLowerCase().trim();

        // Detección automática de número de contacto (teléfono entre 7 y 12 dígitos)
        const phoneRegex = /\b\d{7,12}\b/;
        const matchPhone = rawText.match(phoneRegex);
        if (matchPhone) {
            const phone = matchPhone[0];
            let extractedName = "";
            const nameKeywords = ["mi nombre es", "me llamo", "nombre:", "soy"];
            
            // Buscar si especificó un nombre con palabra clave
            for (const keyword of nameKeywords) {
                if (text.includes(keyword)) {
                    const idx = text.indexOf(keyword) + keyword.length;
                    extractedName = rawText.substring(idx).replace(phone, "").replace(/[,.!\-]/g, "").trim();
                    break;
                }
            }
            
            // Limpieza secundaria de caracteres si no se halló keyword
            if (!extractedName) {
                extractedName = rawText.replace(phone, "").replace(/[,.!\-]/g, "").trim();
            }
            
            // Limitar longitud
            if (extractedName.length > 20) {
                extractedName = extractedName.substring(0, 20) + "...";
            }
            
            const clientName = extractedName ? extractedName : "Interesado";
            const whatsappNumber = '573172309090';
            const msg = `Hola! Me gustar\u00EDa recibir informaci\u00F3n. Mi nombre es *${clientName}* y mi celular es *${phone}*. \u00BFMe podr\u00EDan contactar porfa para cotizar habitaciones y planes? Gracias!`;
            const encodedMsg = encodeURIComponent(msg);
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;

            // Auto-redirección tras 1.5s
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
            }, 1500);

            return `Listo, ya anot\u00E9 tus datos (Nombre: ${clientName}, Tel\u00E9fono: ${phone}). Te estoy redirigiendo a nuestro WhatsApp de reservas. Si no abre autom\u00E1ticamente, haz clic aqu\u00ED porfa: <br>
                    👉 <a href="${whatsappUrl}" target="_blank" rel="noopener" class="chat-inline-link">Abrir WhatsApp de Reservas</a>`;
        }

        // 1. Pasadía option
        if (text.includes('pasadia') || text.includes('pasadía') || (text.includes('dia') && text.includes('plan'))) {
            if (text.includes('3') || text.includes('4') || text.includes('tres') || text.includes('cuatro') || text.includes('grupo') || text.includes('familia')) {
                return `El <strong>Plan Pasadía</strong> es máximo para <strong>2 personas</strong> por habitación. Si son 3 o más personas, les recomiendo reservar habitaciones separadas (ej. Paraíso y Margarita) o quedarse en la <strong>Suite Orquídeas</strong> o <strong>Suite Eugenias</strong> para pasar la noche. 😊`;
            }
            return `El <strong>Plan Pasadía</strong> es para pasar el día (10:00 a.m. a 5:00 p.m.) en las suites Paraíso o Margarita. Es para un máximo de 2 personas. ¿Te gustaría cotizar este plan?`;
        }

        // 2. Casita Mágica
        if (text.includes('casita') || text.includes('bloque') || text.includes('horas') || text.includes('por hora')) {
            let match = text.match(/\b(3|4|tres|cuatro)\b/);
            if (match) {
                const count = (match[0] === '3' || match[0] === 'tres') ? 3 : 4;
                const extraPeople = count - 2;
                const extraCost = extraPeople * 30000;
                return `Para la <strong>Casita Mágica</strong> con <strong>${count} personas</strong>: la base es para 2 personas, y por cada persona adicional se cobra <strong>$30.000 COP</strong> por el ingreso (el excedente total sería de $${extraCost.toLocaleString()} COP). Ten en cuenta que si quieres masajes para los demás, dependerá del paquete que elijas. ¿Te gustaría cotizarlo?`;
            }
            return `Te cuento, la <strong>Casita Mágica</strong> se alquila por bloques de horas para 2 personas:
- Plan de 4 horas: $200.000 COP.
- Persona extra: $30.000 COP adicional.
- Puedes agregar masajes relajantes si lo deseas.
¿Te gustaría reservar algún bloque de horas?`;
        }

        // 3. Capacidades y Habitaciones Tradicionales / Fotos e Imágenes
        if (text.includes('imagen') || text.includes('imágenes') || text.includes('foto') || text.includes('fotos') || text.includes('ver habitacion') || text.includes('ver habitación') || text.includes('ver habitaciones') || text.includes('ver suites') || text.includes('capacidad') || text.includes('personas') || text.includes('huespedes') || text.includes('huéspedes') || text.includes('habitacion') || text.includes('habitación') || text.includes('suite') || text.includes('habitaciones') || text.includes('alojamiento') || text.includes('alojamientos') || text.includes('tarifas') || text.includes('precios') || text.includes('precio') || text.includes('eugenia') || text.includes('orquidea') || text.includes('paraiso') || text.includes('margarita')) {
            // Si el usuario pregunta específicamente por imágenes/fotos o pide ver habitaciones
            const wantsImages = text.includes('imagen') || text.includes('imágenes') || text.includes('foto') || text.includes('fotos') || text.includes('ver');

            // Check for group count
            let matchGroup = text.match(/\b(5|6|7|8|cinco|seis|siete|ocho)\b/);
            if (matchGroup && !wantsImages) {
                const count = parseInt(matchGroup[0]) || (matchGroup[0] === 'cinco' ? 5 : matchGroup[0] === 'seis' ? 6 : matchGroup[0] === 'siete' ? 7 : 8);
                const extraPeople = count - 4;
                const extraCost = extraPeople * 160000;
                return `Para un grupo de <strong>${count} personas</strong>, la mejor opción es la <strong>Suite Eugenias</strong> (capacidad de 2 a 8 personas). La tarifa base cubre 4 personas, y a partir de la 5ª se cobra un adicional de $160.000 COP por persona (el excedente por las ${extraPeople} personas adicionales sería de $${extraCost.toLocaleString()} COP).<br><br>
                📸 <a href="#" onclick="openLightbox('assets/suite-eugenias.webp'); return false;" class="chat-inline-link">Ver fotos de Suite Eugenias</a><br><br>
                ¿Te gustaría cotizarla con su piscina privada y chimenea?`;
            }
            
            if ((text.includes('3') || text.includes('tres') || text.includes('4') || text.includes('cuatro')) && !wantsImages) {
                return `Para grupos de <strong>3 o 4 personas</strong>, las opciones ideales son:
<br><br>
• <strong>Suite Orquídeas:</strong> Dos niveles y mallas catamarán (máx 4 personas). <br>👉 <a href="#" onclick="openLightbox('assets/suite-orquideas.webp'); return false;" class="chat-inline-link">Ver foto de Suite Orquídeas</a><br><br>
• <strong>Suite Eugenias:</strong> Piscina privada y chimenea (base para 4 pers, hasta 8). <br>👉 <a href="#" onclick="openLightbox('assets/suite-eugenias.webp'); return false;" class="chat-inline-link">Ver foto de Suite Eugenias</a><br><br>
<em>Nota: Las suites Paraíso y Margaritas son exclusivamente para parejas (máx 2 personas).</em>`;
            }
            
            return `¡Aquí puedes ver las fotos y detalles de cada una de nuestras habitaciones y planes! Toca el enlace para abrir la imagen: <br><br>
📸 <a href="#" onclick="openLightbox('assets/suite-orquideas.webp'); return false;" class="chat-inline-link">Suite Orquídeas (2 a 4 pers - Dos niveles y mallas)</a> <br>
📸 <a href="#" onclick="openLightbox('assets/suite-aves-del-paraiso.webp'); return false;" class="chat-inline-link">Suite Aves del Paraíso (Parejas - Jacuzzi privado)</a> <br>
📸 <a href="#" onclick="openLightbox('assets/suite-margaritas.webp'); return false;" class="chat-inline-link">Suite Margaritas (Parejas - Jacuzzi privado)</a> <br>
📸 <a href="#" onclick="openLightbox('assets/suite-eugenias.webp'); return false;" class="chat-inline-link">Suite Eugenias (Familiar 2 a 8 pers - Piscina y chimenea)</a> <br>
📸 <a href="#" onclick="openLightbox('assets/plan-relax-spa.webp'); return false;" class="chat-inline-link">Casita Mágica (Planes por horas Relax / Spa)</a> <br>
📸 <a href="#" onclick="openLightbox('assets/pasadia.webp'); return false;" class="chat-inline-link">Plan Pasadía (10 am a 5 pm para 2 personas)</a> <br><br>
¿Cuál de ellas te gustaría cotizar o reservar?`;
        }

        // 4. Masajes y Spa
        if (text.includes('masaje') || text.includes('masajes') || text.includes('spa') || text.includes('terapia')) {
            return `Los masajes y servicios de spa los realizamos directamente en tu suite para mayor comodidad (como masajes relajantes o con piedras volcánicas). Las tarifas varían si son individuales o en pareja.<br><br>
            👉 <a href="#" onclick="openLightbox('assets/spa-services.webp'); return false;" class="chat-inline-link">Ver Folleto de Servicios de Spa</a><br><br>
            Si te hospedas en la Suite Eugenias con un grupo grande, podemos coordinar terapeutas para atenderlos a todos allí mismo. 😊`;
        }

        // 4.5 Decoraciones
        if (text.includes('decor') || text.includes('celebrar') || text.includes('cumple') || text.includes('aniversario') || text.includes('sorpresa') || text.includes('romantico') || text.includes('romántica')) {
            return `¡Tenemos hermosos sets de decoración para celebrar momentos especiales! 🌹🎈<br><br>
                    <strong>*Importante:*</strong> Las decoraciones se contratan de forma individual y se aplican en <strong>una (1) sola habitación</strong> de tu elección.<br><br>
                    • <a href="#" onclick="openLightbox('assets/decoracion-elios.webp'); return false;" class="chat-inline-link">Ver Decoración Elios ($180.000 COP)</a> (39 globos, helio, pétalos y 3 pizarras).<br>
                    • <a href="#" onclick="openLightbox('assets/decoracion-estandar-casita.webp'); return false;" class="chat-inline-link">Ver Estándar Casita Mágica ($59.000 COP)</a>.<br>
                    • <a href="#" onclick="openLightbox('assets/decoracion-estandar-suites.webp'); return false;" class="chat-inline-link">Ver Estándar Margaritas / Paraíso ($59.000 COP)</a>.<br>
                    • <a href="#" onclick="openLightbox('assets/decoracion-pizarra.webp'); return false;" class="chat-inline-link">Ver Decoración Pizarra Eugenias ($70.000 COP)</a>.<br><br>
                    Además, en Margaritas y Paraíso puedes adicionar: Pétalos ($85k), Globos ($125k) o Velas ($136k).`;
        }

        // 5. Catálogo
        if (text.includes('catalogo') || text.includes('catálogo') || text.includes('folleto') || text.includes('servicios') || text.includes('precios')) {
            return `¡Con gusto! Puedes ver toda nuestra información gráfica haciendo clic aquí: <br><br>
                    👉 <a href="#" onclick="openLightbox('assets/plan-relax-spa.webp'); return false;" class="chat-inline-link">Folleto de Suites y Tarifas</a> <br>
                    👉 <a href="#" onclick="openLightbox('assets/included-menu.webp'); return false;" class="chat-inline-link">Folleto de Alimentación Incluida</a> <br>
                    👉 <a href="#" onclick="openLightbox('assets/spa-services.webp'); return false;" class="chat-inline-link">Folleto de Servicios de Spa</a>`;
        }

        // 6. Default response for unhandled topics (menu a la carta, exact location, etc.)
        return `Para darte una información más detallada, puedes conversar directamente con uno de nuestros asesores por WhatsApp: <br>
                👉 <a href="https://wa.me/573172309090" target="_blank" rel="noopener" class="chat-inline-link">Escríbenos a WhatsApp aquí</a> <br><br>
                O si prefieres, escríbeme tu nombre o número de teléfono por aquí y nosotros te contactamos de inmediato.`;
    }

    // Form submission chat handler
    if (chatbotForm && chatbotInput) {
        chatbotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = chatbotInput.value.trim();
            if (!query) return;

            // Display user message
            appendMessage('user', query);
            chatbotInput.value = '';

            // Simulate typing delay
            setTimeout(() => {
                const response = getBotResponse(query);
                appendMessage('bot', response);
            }, 750);
        });
    }

    // Quick replies chips handler
    const quickReplyBtns = document.querySelectorAll('.quick-reply-btn');
    quickReplyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const queryKey = btn.dataset.query;
            let queryText = btn.textContent;
            
            // Send visual message
            appendMessage('user', queryText);

            // Simulate typing delay
            setTimeout(() => {
                if (queryKey === 'fotos') {
                    response = getBotResponse('fotos de las habitaciones');
                } else if (queryKey === 'pasadia') {
                    response = getBotResponse('pasadia');
                } else if (queryKey === 'casita') {
                    response = getBotResponse('casita');
                } else if (queryKey === 'suites') {
                    response = getBotResponse('suites');
                } else if (queryKey === 'decoraciones') {
                    response = getBotResponse('decoraciones');
                } else if (queryKey === 'catalogo') {
                    response = getBotResponse('catalogo');
                } else {
                    response = getBotResponse(queryKey || queryText);
                }
                appendMessage('bot', response);
            }, 600);
        });
    });


    // Deshabilitar clic derecho y arrastre en imágenes y videos para evitar descargas fáciles
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
            e.preventDefault();
        }
    });

    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
            e.preventDefault();
        }
    });
});
