/* ===== Wedding config — edit these ===== */
const WEDDING = {
  date: new Date("2026-08-16T19:00:00"),
  dateLabel: "Sunday, 16 August 2026 · 7:00 PM",
};

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const heroDate = document.getElementById("hero-date");
  if (heroDate) heroDate.textContent = WEDDING.dateLabel;

  setupGuestName();
  setupCover();
  setupCountdown();
  setupNav();
  setupReveal();
  setupToTop();
});

function setupGuestName() {
  const params = new URLSearchParams(window.location.search);
  const inviteId = (params.get("g") || params.get("invite") || "").trim();
  const legacyTo = (params.get("to") || params.get("n") || "").trim();
  const guest = document.getElementById("guest-name");
  const coverTo = document.getElementById("cover-to");

  const showName = (name) => {
    const value = (name || "").trim();
    if (!value) {
      if (coverTo) coverTo.hidden = true;
      return;
    }
    if (guest) guest.textContent = value;
    if (coverTo) coverTo.hidden = false;
  };

  if (inviteId) {
    fetch(`api/guest.php?g=${encodeURIComponent(inviteId)}`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data?.ok && data.guest_name) {
          showName(data.guest_name);
        } else if (coverTo) {
          coverTo.hidden = true;
        }
      })
      .catch(() => {
        if (coverTo) coverTo.hidden = true;
      });
    return;
  }

  if (legacyTo) {
    showName(legacyTo);
  } else if (coverTo) {
    coverTo.hidden = true;
  }
}

function setupCover() {
  const cover = document.getElementById("cover");
  const openBtn = document.getElementById("open-invitation");
  const topnav = document.getElementById("topnav");

  document.body.classList.add("is-locked");

  openBtn?.addEventListener("click", () => {
    cover?.classList.add("is-hidden");
    cover?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    topnav?.classList.add("is-visible");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setupCountdown() {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");
  const box = document.getElementById("countdown");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const pad = (n) => String(n).padStart(2, "0");

  const tick = () => {
    const distance = WEDDING.date.getTime() - Date.now();

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      if (box) box.setAttribute("aria-label", "The wedding day has arrived");
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  };

  tick();
  setInterval(tick, 1000);
}

function setupNav() {
  const topnav = document.getElementById("topnav");
  const links = document.querySelectorAll(".bottomnav__link");
  const sections = ["home", "events"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    topnav?.classList.toggle("is-scrolled", y > 40);

    let current = "home";
    for (const section of sections) {
      const top = section.offsetTop - 120;
      if (y >= top) current = section.id;
    }

    links.forEach((link) => {
      const match = link.dataset.section === current;
      link.classList.toggle("is-active", match);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

function setupToTop() {
  const btn = document.getElementById("to-top");
  if (!btn) return;

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.hidden = y < 500;
  };

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
