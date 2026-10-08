const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        // Убираем состояние при уходе блока с экрана,
        // чтобы при обратной прокрутке анимация запускалась снова.
        entry.target.classList.remove("is-visible");
      }
    });
  }, {threshold:0.12, rootMargin:"0px 0px -8% 0px"});
  revealItems.forEach(el => observer.observe(el));
} else { revealItems.forEach(el => el.classList.add("is-visible")); }

document.querySelectorAll('a[href^="#"]').forEach(link=>{link.addEventListener('click',e=>{const el=document.querySelector(link.getAttribute('href'));if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'})}})});


// Формируем номер телефона в браузере, чтобы не хранить его в открытом виде в HTML.
(() => {
  const phoneLink = document.querySelector('[data-phone]');
  if (!phoneLink) return;
  const digits = phoneLink.dataset.phone;
  const formatted = `+7 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7,9)}-${digits.slice(9,11)}`;
  const phoneText = phoneLink.querySelector('[data-phone-text]');
  if (phoneText) phoneText.textContent = formatted;
  else phoneLink.textContent = formatted;
  phoneLink.href = `tel:+${digits}`;
})();

/* Russian phone mask: +7 (000) 000-00-00 */
(() => {
  const phone = document.getElementById('phoneInput');
  if (!phone) return;

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (digits.startsWith('7')) digits = digits.slice(1);
    digits = digits.slice(0, 10);

    let result = '+7';
    if (digits.length) result += ' (' + digits.slice(0, 3);
    if (digits.length >= 3) result += ')';
    if (digits.length > 3) result += ' ' + digits.slice(3, 6);
    if (digits.length > 6) result += '-' + digits.slice(6, 8);
    if (digits.length > 8) result += '-' + digits.slice(8, 10);
    return result;
  };

  phone.addEventListener('focus', () => {
    if (!phone.value) phone.value = '+7 (';
  });

  phone.addEventListener('input', () => {
    phone.value = formatPhone(phone.value);
  });

  phone.addEventListener('keydown', (event) => {
    if (event.key === 'Backspace' && phone.selectionStart <= 3) {
      event.preventDefault();
    }
  });

  phone.addEventListener('blur', () => {
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length < 11) phone.value = '';
  });
})();

const priceForm = document.getElementById('priceForm');
if (priceForm) {
  priceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('formMessage');
    const button = priceForm.querySelector('button[type=submit]');
    const formData = new FormData(priceForm);
    const data = Object.fromEntries(formData.entries());

    button.disabled = true;
    button.textContent = 'Отправляем…';
    msg.textContent = 'Отправляем заявку…';
    msg.style.color = '#171717';

    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Ошибка отправки');

      msg.textContent = 'Спасибо! Заявка отправлена. Я свяжусь с вами в ближайшее время.';
      priceForm.reset();
    } catch (error) {
      console.error(error);
      msg.textContent = 'Не удалось отправить заявку. Проверьте настройки Telegram и попробуйте ещё раз.';
    } finally {
      button.disabled = false;
      button.textContent = 'Отправить заявку';
    }
  });
}




/* Hero overlap controller */
(() => {
  const hero = document.querySelector('.hero');
  const about = document.querySelector('.about');
  if (!hero || !about) return;

  const updateHeroOverlap = () => {
    if (window.innerWidth < 901) {
      hero.classList.remove('hero--hidden-after');
      return;
    }

    // The About block slides up over the hero. Hide the hero only after
    // the About block has completely reached the top of the viewport.
    const aboutTop = about.getBoundingClientRect().top;
    hero.classList.toggle('hero--hidden-after', aboutTop <= 0);
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateHeroOverlap();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateHeroOverlap);
  updateHeroOverlap();
})();


/* Release the pinned "Почему я" block when the Formats block reaches the top. */
(() => {
  const benefits = document.querySelector('.benefits');
  const formats = document.querySelector('.formats');
  if (!benefits || !formats) return;

  const updateBenefitsPin = () => {
    if (window.innerWidth < 901) {
      benefits.classList.remove('benefits--released');
      return;
    }

    const formatsTop = formats.getBoundingClientRect().top;
    benefits.classList.toggle('benefits--released', formatsTop <= 0);
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateBenefitsPin();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateBenefitsPin);
  updateBenefitsPin();
})();


/* Gallery lightbox */
(() => {
  const items = Array.from(document.querySelectorAll('.gallery__item'));
  if (!items.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'gallery-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <button class="gallery-lightbox__close" type="button" aria-label="Закрыть">×</button>
    <button class="gallery-lightbox__prev" type="button" aria-label="Предыдущее фото">‹</button>
    <img class="gallery-lightbox__image" alt="">
    <button class="gallery-lightbox__next" type="button" aria-label="Следующее фото">›</button>
    <div class="gallery-lightbox__counter" aria-live="polite"></div>
  `;
  document.body.appendChild(lightbox);

  const image = lightbox.querySelector('.gallery-lightbox__image');
  const counter = lightbox.querySelector('.gallery-lightbox__counter');
  const close = lightbox.querySelector('.gallery-lightbox__close');
  const prev = lightbox.querySelector('.gallery-lightbox__prev');
  const next = lightbox.querySelector('.gallery-lightbox__next');
  let current = 0;

  const show = (index) => {
    current = (index + items.length) % items.length;
    const source = items[current].getAttribute('href');
    const thumb = items[current].querySelector('img');
    image.src = source;
    image.alt = thumb ? thumb.alt : '';
    counter.textContent = `${current + 1} / ${items.length}`;
  };

  const open = (index) => {
    show(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const hide = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  items.forEach((item, index) => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      open(index);
    });
  });

  close.addEventListener('click', hide);
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) hide();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') hide();
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
})();

/* Video carousel + fullscreen viewer */
(() => {
  const carousel = document.querySelector('.video-carousel');
  if (!carousel) return;
  const slides = Array.from(carousel.querySelectorAll('.video-carousel__slide'));
  const track = carousel.querySelector('.video-carousel__track');
  const prev = carousel.querySelector('.video-carousel__prev');
  const next = carousel.querySelector('.video-carousel__next');
  const dotsWrap = document.querySelector('.video-carousel__dots');
  const currentEl = document.querySelector('.video-carousel__counter strong');
  if (!slides.length) return;
  let current = 0;

  const lightbox = document.createElement('div');
  lightbox.className = 'video-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <div class="video-lightbox__frame">
      <button class="video-lightbox__close" type="button" aria-label="Закрыть">×</button>
      <div class="video-lightbox__counter"></div>
      <iframe title="Просмотр видео" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;" frameborder="0" allowfullscreen></iframe>
    </div>`;
  document.body.appendChild(lightbox);
  const modalFrame = lightbox.querySelector('iframe');
  const close = lightbox.querySelector('.video-lightbox__close');
  const modalCounter = lightbox.querySelector('.video-lightbox__counter');

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'video-carousel__dot';
    dot.setAttribute('aria-label', `Видео ${i + 1}`);
    dot.addEventListener('click', () => setCurrent(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function setCurrent(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
    currentEl.textContent = String(current + 1).padStart(2, '0');
    const active = slides[current];
    const offset = active.offsetLeft - (track.parentElement.clientWidth - active.offsetWidth) / 2;
    track.style.transform = `translateX(${-offset}px)`;
  }
  function open(index) {
    const src = slides[index].dataset.video;
    modalFrame.src = src;
    modalCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function hide() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    modalFrame.src = 'about:blank';
    document.body.style.overflow = '';
  }

  slides.forEach((slide, i) => slide.addEventListener('click', () => open(i)));
  prev.addEventListener('click', () => setCurrent(current - 1));
  next.addEventListener('click', () => setCurrent(current + 1));
  close.addEventListener('click', hide);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) hide(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') setCurrent(current - 1);
      if (e.key === 'ArrowRight') setCurrent(current + 1);
      return;
    }
    if (e.key === 'Escape') hide();
  });
  window.addEventListener('resize', () => setCurrent(current));
  setCurrent(0);
})();
