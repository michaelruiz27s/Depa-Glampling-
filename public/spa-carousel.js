/** Galería de Spa: fotos por 2 s; videos hasta terminar; sin filtros de contenido. */
(function () {
    'use strict';
    function initSpaCarousel() {
        const gallery = document.getElementById('spa-carousel-container');
        const stage = document.getElementById('spa-carousel-stage');
        const track = document.getElementById('spa-carousel-track');
        const strip = document.getElementById('spa-thumbnails-strip');
        if (!gallery || !stage || !track || !strip) return;

        const slides = Array.from(track.querySelectorAll('.spa-slide'));
        const thumbs = Array.from(strip.querySelectorAll('.spa-thumb-item'));
        if (!slides.length || slides.length !== thumbs.length) return;
        const prevBtn = document.getElementById('spa-prev-btn');
        const nextBtn = document.getElementById('spa-next-btn');
        const thumbPrev = document.getElementById('spa-thumb-prev');
        const thumbNext = document.getElementById('spa-thumb-next');
        const counter = document.getElementById('spa-counter');
        const captionTitle = document.getElementById('spa-current-title');
        const captionDesc = document.getElementById('spa-current-desc');
        const progress = document.getElementById('spa-progress-bar');
        const photoDuration = 2000;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let currentIndex = 0;
        let photoTimer = null;
        let photoRemaining = photoDuration;
        let photoStarted = 0;
        let inView = !('IntersectionObserver' in window);
        let hovering = false;
        let focused = false;
        let userPausedVideo = false;
        const systemPaused = new WeakSet();
        const activeSlide = () => slides[currentIndex];
        const activeVideo = () => activeSlide().querySelector('video.spa-slide-video');

        function lightboxOpen() {
            const lightbox = document.getElementById('lightbox');
            return !!lightbox && (lightbox.style.display === 'flex' || lightbox.classList.contains('active'));
        }
        const canPlay = () => inView && !document.hidden && !lightboxOpen() && !reduceMotion.matches;
        function clearPhotoTimer() {
            if (photoTimer !== null) {
                clearTimeout(photoTimer);
                photoTimer = null;
                photoRemaining = Math.max(0, photoRemaining - (performance.now() - photoStarted));
                if (progress && !activeVideo()) {
                    progress.style.transition = 'none';
                    setProgress((photoDuration - photoRemaining) / photoDuration);
                }
            }
        }
        function setProgress(fraction) {
            if (progress) progress.style.width = (Math.max(0, Math.min(1, fraction)) * 100).toFixed(2) + '%';
        }
        function pauseVideo(video) {
            if (!video || video.paused) return;
            systemPaused.add(video);
            video.pause();
        }
        function loadSlideMedia(slide) {
            const img = slide.querySelector('.spa-slide-img[data-src]');
            if (img) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            const video = slide.querySelector('video.spa-slide-video');
            const source = video && video.querySelector('source[data-src]');
            if (source) {
                source.src = source.dataset.src;
                source.removeAttribute('data-src');
                video.load();
            }
        }
        function loadUpcomingImage() {
            const next = slides[(currentIndex + 1) % slides.length];
            // Solo adelantar la descarga de la siguiente foto, nunca otro video.
            if (next && next.dataset.type === 'image') loadSlideMedia(next);
        }
        function stopAuto() {
            clearPhotoTimer();
            pauseVideo(activeVideo());
        }
        function startCurrent() {
            clearPhotoTimer();
            if (!canPlay()) return;
            const video = activeVideo();
            if (!video) {
                if (hovering || focused) return;
                photoStarted = performance.now();
                photoTimer = setTimeout(() => showSlide(currentIndex + 1), photoRemaining);
                if (progress) {
                    progress.style.transition = 'width ' + photoRemaining + 'ms linear';
                    requestAnimationFrame(() => setProgress(1));
                }
                return;
            }
            if (userPausedVideo || video.ended) return;
            loadSlideMedia(activeSlide());
            const promise = video.play();
            if (promise && typeof promise.catch === 'function') promise.catch(() => {
                const play = activeSlide().querySelector('.spa-video-play-btn');
                if (video === activeVideo() && play) play.classList.remove('hidden');
            });
        }
        function showSlide(index) {
            clearPhotoTimer();
            const oldVideo = activeVideo();
            if (oldVideo) {
                pauseVideo(oldVideo);
                try { oldVideo.currentTime = 0; } catch (_) { /* aún no disponible */ }
            }
            currentIndex = (index % slides.length + slides.length) % slides.length;
            photoRemaining = photoDuration;
            userPausedVideo = false;
            const slide = activeSlide();
            loadSlideMedia(slide);
            slides.forEach((item, i) => {
                const active = i === currentIndex;
                item.classList.toggle('active', active);
                item.setAttribute('aria-hidden', String(!active));
                const video = item.querySelector('video');
                if (video) video.tabIndex = active ? 0 : -1;
                const zoomable = item.querySelector('.spa-slide-media[role="button"]');
                if (zoomable) zoomable.tabIndex = active ? 0 : -1;
            });
            thumbs.forEach((thumb, i) => {
                const active = i === currentIndex;
                thumb.classList.toggle('active', active);
                thumb.setAttribute('aria-current', String(active));
            });
            if (counter) counter.textContent = (currentIndex + 1) + ' / ' + slides.length;
            const title = slide.querySelector('.spa-slide-title');
            const desc = slide.querySelector('.spa-slide-desc');
            if (captionTitle) captionTitle.textContent = title ? title.textContent : '';
            if (captionDesc) captionDesc.textContent = desc ? desc.textContent : '';
            if (progress) progress.style.transition = 'none';
            setProgress(0);
            const thumb = thumbs[currentIndex];
            if (thumb) {
                const desired = thumb.offsetLeft - strip.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2;
                strip.scrollTo({ left: Math.max(0, desired), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
            }
            if (prevBtn) prevBtn.disabled = slides.length === 1;
            if (nextBtn) nextBtn.disabled = slides.length === 1;
            loadUpcomingImage();
            startCurrent();
        }

        slides.forEach(slide => {
            const imageArea = slide.querySelector('.spa-slide-media[role="button"]');
            if (imageArea) {
                imageArea.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        imageArea.click();
                    }
                });
            }
            const video = slide.querySelector('video.spa-slide-video');
            if (!video) return;
            const playButton = slide.querySelector('.spa-video-play-btn');
            video.controls = true;
            video.muted = true; // requisito habitual del autoplay móvil
            video.defaultMuted = true;
            video.playsInline = true;
            video.loop = false;
            video.preload = 'none';
            if (playButton) playButton.classList.add('hidden');
            video.addEventListener('play', () => {
                if (slide !== activeSlide()) return;
                userPausedVideo = false;
                if (playButton) playButton.classList.add('hidden');
            });
            video.addEventListener('pause', () => {
                if (systemPaused.has(video)) { systemPaused.delete(video); return; }
                if (slide !== activeSlide() || video.ended) return;
                userPausedVideo = true;
                if (playButton) playButton.classList.remove('hidden');
            });
            video.addEventListener('timeupdate', () => {
                if (slide === activeSlide() && Number.isFinite(video.duration) && video.duration > 0) {
                    setProgress(video.currentTime / video.duration);
                }
            });
            video.addEventListener('ended', () => {
                if (slide === activeSlide()) showSlide(currentIndex + 1);
            });
            if (playButton) playButton.addEventListener('click', () => {
                if (!inView || document.hidden || lightboxOpen()) return;
                userPausedVideo = false;
                loadSlideMedia(slide);
                video.play().catch(() => playButton.classList.remove('hidden'));
            });
        });
        if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));
        thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => showSlide(i)));
        if (thumbPrev) thumbPrev.addEventListener('click', () => strip.scrollBy({ left: -180, behavior: 'smooth' }));
        if (thumbNext) thumbNext.addEventListener('click', () => strip.scrollBy({ left: 180, behavior: 'smooth' }));
        stage.addEventListener('keydown', event => {
            if (event.target && event.target.tagName === 'VIDEO') return;
            if (event.key === 'ArrowLeft') { event.preventDefault(); showSlide(currentIndex - 1); }
            if (event.key === 'ArrowRight') { event.preventDefault(); showSlide(currentIndex + 1); }
        });
        let touchX = 0, touchY = 0;
        stage.addEventListener('touchstart', e => {
            touchX = e.changedTouches[0].clientX;
            touchY = e.changedTouches[0].clientY;
        }, { passive: true });
        stage.addEventListener('touchend', e => {
            if (e.target.closest('video, button')) return;
            const dx = e.changedTouches[0].clientX - touchX;
            const dy = e.changedTouches[0].clientY - touchY;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) showSlide(currentIndex + (dx < 0 ? 1 : -1));
        }, { passive: true });
        gallery.addEventListener('pointerenter', e => {
            if (e.pointerType === 'touch') return;
            hovering = true;
            if (!activeVideo()) clearPhotoTimer();
        });
        gallery.addEventListener('pointerleave', e => {
            if (e.pointerType === 'touch') return;
            hovering = false;
            if (!activeVideo()) startCurrent();
        });
        gallery.addEventListener('focusin', () => {
            focused = true;
            if (!activeVideo()) clearPhotoTimer();
        });
        gallery.addEventListener('focusout', e => {
            if (!gallery.contains(e.relatedTarget)) {
                focused = false;
                if (!activeVideo()) startCurrent();
            }
        });
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                const visible = entries.some(e => e.isIntersecting);
                if (inView === visible) return;
                inView = visible;
                if (visible) startCurrent(); else stopAuto();
            }, { threshold: 0.1 });
            observer.observe(gallery);
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopAuto(); else startCurrent();
        });
        const lightbox = document.getElementById('lightbox');
        if (lightbox && 'MutationObserver' in window) {
            const observer = new MutationObserver(() => {
                if (lightboxOpen()) stopAuto(); else startCurrent();
            });
            observer.observe(lightbox, { attributes: true, attributeFilter: ['style', 'class'] });
        }
        reduceMotion.addEventListener('change', () => {
            if (reduceMotion.matches) stopAuto(); else startCurrent();
        });
        showSlide(0);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSpaCarousel);
    else initSpaCarousel();
})();
