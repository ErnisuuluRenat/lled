(() => {
  "use strict";

  // Single place to edit real contact details once the client supplies them.
  const CONFIG = {
    phone: "+996 999 990 111",
    whatsapp: "996999990111",
    instagram: "lled.kg"
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Header: background/border once scrolled                            */
  /* ------------------------------------------------------------------ */
  const header = document.getElementById("header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------ */
  /* Mobile burger menu                                                  */
  /* ------------------------------------------------------------------ */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const setMenu = open => {
    mobileMenu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => {
    setMenu(!mobileMenu.classList.contains("is-open"));
  });
  mobileMenu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => setMenu(false));
  });

  /* ------------------------------------------------------------------ */
  /* Scroll reveal — IntersectionObserver with a safety-net fallback     */
  /* ------------------------------------------------------------------ */
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));

  if (reduced) {
    revealEls.forEach(el => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -14% 0px", threshold: 0.06 }
    );
    revealEls.forEach(el => io.observe(el));

    // Safety net: nothing should stay hidden if the observer misbehaves.
    setTimeout(() => {
      revealEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < (window.innerHeight || 800)) el.classList.add("is-visible");
      });
    }, 900);
  } else {
    revealEls.forEach(el => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------ */
  /* FAQ accordion — single-open                                        */
  /* ------------------------------------------------------------------ */
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  faqItems.forEach(item => {
    const trigger = item.querySelector(".faq-item__trigger");
    const icon = item.querySelector(".faq-item__icon");
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      faqItems.forEach(other => {
        other.classList.remove("is-open");
        other.querySelector(".faq-item__trigger").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-item__icon").textContent = "+";
      });
      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        icon.textContent = "✕";
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Hero dot-matrix canvas                                              */
  /* ------------------------------------------------------------------ */
  const canvas = document.getElementById("matrix");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const pointer = { x: -9999, y: -9999 };
    const gap = 17, dotR = 1.35;
    let dpr = 1, W = 0, H = 0, raf = null;

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    canvas.addEventListener("pointermove", e => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    });
    canvas.addEventListener("pointerleave", () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });

    const draw = t => {
      ctx.clearRect(0, 0, W, H);
      const wave = t / 1400;
      for (let y = gap / 2; y < H; y += gap) {
        for (let x = gap / 2; x < W; x += gap) {
          const band = Math.sin(x / 160 - wave) * Math.cos(y / 220 + wave * 0.7);
          let a = 0.045 + 0.055 * (band + 1) / 2;
          const dx = x - pointer.x, dy = y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 24000) a += 0.5 * (1 - d2 / 24000);
          const hueMix = x / Math.max(W, 1);
          ctx.fillStyle = hueMix > 0.62
            ? "rgba(74,144,245," + a.toFixed(3) + ")"
            : "rgba(247,148,29," + a.toFixed(3) + ")";
          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    if (reduced) {
      draw(0);
    } else {
      const loop = t => { draw(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Request form — client-side validation + WhatsApp prefill fallback   */
  /* ------------------------------------------------------------------ */
  const form = document.getElementById("requestForm");
  const formError = document.getElementById("requestFormError");
  const sentPanel = document.getElementById("requestSent");

  const phonePattern = /^\+?996\s?\d{9}$|^0\d{9}$|^\+?\d{9,15}$/;

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const tel = form.elements.tel.value.trim();
      const task = form.elements.task.value.trim();

      [form.elements.name, form.elements.tel].forEach(el => el.classList.add("touched"));

      if (!name) {
        showError("Укажите имя.");
        form.elements.name.focus();
        return;
      }
      if (!tel || !phonePattern.test(tel.replace(/[\s()-]/g, ""))) {
        showError("Укажите корректный номер телефона.");
        form.elements.tel.focus();
        return;
      }
      hideError();

      const text = encodeURIComponent(
        `Здравствуйте! Меня зовут ${name}.\nТелефон: ${tel}\n${task ? "Задача: " + task : ""}`
      );
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${text}`, "_blank", "noopener");

      form.hidden = true;
      sentPanel.hidden = false;
    });
  }

  function showError(msg) {
    formError.textContent = msg;
    formError.hidden = false;
  }
  function hideError() {
    formError.hidden = true;
    formError.textContent = "";
  }

  /* ------------------------------------------------------------------ */
  /* Map — Leaflet, address: ул. Анкара, 10Б, Бишкек                     */
  /* ------------------------------------------------------------------ */
  const mapOutlet = document.getElementById("map-outlet");
  if (mapOutlet && window.L) {
    const lat = parseFloat(mapOutlet.dataset.lat);
    const lng = parseFloat(mapOutlet.dataset.lng);

    const map = L.map(mapOutlet, {
      center: [lat, lng],
      zoom: 16,
      scrollWheelZoom: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "map-outlet__pin",
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    L.marker([lat, lng], { icon: pinIcon })
      .addTo(map)
      .bindPopup("LLED.KG — ул. Анкара, 10Б")
      .openPopup();

    mapOutlet.addEventListener("click", () => map.scrollWheelZoom.enable(), { once: true });
    mapOutlet.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
  }
})();
