const root = document.documentElement;
document.body.classList.add("js-enabled");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(pointer: fine)");
const cursorHalo = document.getElementById("cursor-halo");
const cursorDot = document.getElementById("cursor-dot");
const cursorInteractiveSelector = [
  "a",
  "button",
  "[role='button']",
  ".timeline-item",
  ".contact-link",
  ".btn"
].join(", ");

function initCustomCursor() {
  if (!cursorHalo || !cursorDot) return;
  if (prefersReducedMotion.matches || !finePointerQuery.matches) return;

  document.body.classList.add("cursor-enhanced");

  const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    tx: window.innerWidth / 2,
    ty: window.innerHeight / 2,
    raf: 0
  };

  const render = () => {
    state.x += (state.tx - state.x) * 0.18;
    state.y += (state.ty - state.y) * 0.18;

    cursorHalo.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%)`;
    cursorDot.style.transform = `translate3d(${state.tx}px, ${state.ty}px, 0) translate(-50%, -50%)`;
    state.raf = window.requestAnimationFrame(render);
  };

  document.addEventListener("pointermove", (event) => {
    state.tx = event.clientX;
    state.ty = event.clientY;
    document.body.classList.add("cursor-visible");
    if (!state.raf) {
      state.raf = window.requestAnimationFrame(render);
    }
  });

  document.addEventListener("pointerdown", () => {
    document.body.classList.add("cursor-pressing");
  });

  document.addEventListener("pointerup", () => {
    document.body.classList.remove("cursor-pressing");
  });

  document.addEventListener("pointerover", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const interactiveTarget = target.closest(cursorInteractiveSelector);
    document.body.classList.toggle("cursor-hovering", Boolean(interactiveTarget));
  });

  document.addEventListener("pointerout", (event) => {
    const related = event.relatedTarget;
    if (related instanceof HTMLElement && related.closest(cursorInteractiveSelector)) return;
    document.body.classList.remove("cursor-hovering");
  });

  document.addEventListener("mouseleave", () => {
    document.body.classList.remove("cursor-visible", "cursor-hovering", "cursor-pressing");
  });

  window.addEventListener("blur", () => {
    document.body.classList.remove("cursor-visible", "cursor-hovering", "cursor-pressing");
  });
}

const menuToggle = document.querySelector(".menu-toggle");
const menu = document.getElementById("primary-menu");
const menuLinks = document.querySelectorAll(".menu a");

function closeMenu() {
  if (!menu || !menuToggle) return;
  menu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Ouvrir le menu");
}

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    if (isOpen) {
      menu.querySelector("a")?.focus();
    }
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest(".top-nav")) return;
    closeMenu();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      closeMenu();
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) {
      closeMenu();
    }
  });
}

const sectionNavigationLinks = document.querySelectorAll(
  ".top-nav a[href^='#'], .hero-content a[href^='#']"
);
let sectionScrollFrame = 0;

function getSectionScrollTop(target) {
  if (target.id === "top") return 0;

  const scrollMarginTop = Number.parseFloat(
    window.getComputedStyle(target).scrollMarginTop
  ) || 0;

  return Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - scrollMarginTop
  );
}

function navigateToSection(target, hash) {
  window.cancelAnimationFrame(sectionScrollFrame);

  const startY = window.scrollY;
  const targetY = getSectionScrollTop(target);
  const distance = targetY - startY;
  const duration = Math.min(240, Math.max(140, Math.abs(distance) * 0.09));

  target.classList.add("visible", "navigation-target");
  window.setTimeout(() => {
    target.classList.remove("navigation-target");
  }, duration + 80);

  if (window.location.hash !== hash) {
    window.history.pushState(null, "", hash);
  } else {
    window.history.replaceState(null, "", hash);
  }

  if (prefersReducedMotion.matches || Math.abs(distance) < 2) {
    window.scrollTo(0, targetY);
    updateActiveMenu();
    updateProgress();
    return;
  }

  const startTime = window.performance.now();
  const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3);

  const animate = (currentTime) => {
    const progress = Math.min(1, (currentTime - startTime) / duration);
    window.scrollTo(0, startY + distance * easeOutCubic(progress));

    if (progress < 1) {
      sectionScrollFrame = window.requestAnimationFrame(animate);
      return;
    }

    sectionScrollFrame = 0;
    updateActiveMenu();
    updateProgress();
  };

  sectionScrollFrame = window.requestAnimationFrame(animate);
}

sectionNavigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    closeMenu();
    navigateToSection(target, hash);
  });
});

const experienceSection = document.getElementById("experience");
const experienceTimeline = document.getElementById("experience-timeline");
const timelineNav = document.getElementById("experience-nav");
const timelineItems = experienceTimeline ? [...experienceTimeline.querySelectorAll(".timeline-item")] : [];
const timelineToggles = experienceTimeline ? [...experienceTimeline.querySelectorAll(".item-toggle")] : [];
const timelineNavButtons = [];

function setTimelineExpandedState(card, expanded) {
  const button = card.querySelector(".item-toggle");
  card.classList.toggle("open", expanded);
  if (button) {
    button.setAttribute("aria-expanded", String(expanded));
  }
}

function updateTimelineNavState(activeCard) {
  timelineNavButtons.forEach((button) => {
    const active = button.dataset.targetId === activeCard.id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    if (active) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function updateExperienceTimelineProgress() {
  if (!experienceTimeline || !timelineItems.length) return;

  const scrollableHeight = experienceTimeline.scrollHeight - experienceTimeline.clientHeight;
  if (scrollableHeight <= 0) {
    experienceTimeline.style.setProperty("--timeline-progress", "100%");
    return;
  }

  const progress = Math.max(0, Math.min(100, (experienceTimeline.scrollTop / scrollableHeight) * 100));

  experienceTimeline.style.setProperty("--timeline-progress", `${progress}%`);
}

function setActiveTimelineItem(card, options = {}) {
  if (!card) return;

  /* `expand` sépare « quel poste est courant » de « quel poste est déplié ».
     Les deux étaient confondus : marquer un poste actif l'ouvrait forcément,
     donc l'initialisation au chargement dépliait le premier. Un CV s'ouvre
     désormais en état neutre, tous les postes fermés (demande Benji,
     2026-08-20). */
  const { scrollPanel = false, expand = true } = options;

  timelineItems.forEach((item) => {
    const active = item === card;
    item.classList.toggle("is-active", active);
    /* `expand: false` ne TOUCHE PAS au dépliage : il ne déplace que le
       repère de position. Refermer ici serait un piège — `focusin` passe par
       cette fonction, donc tabuler à l'intérieur d'un poste ouvert le
       refermerait sous les doigts. */
    if (expand) setTimelineExpandedState(item, active);
  });

  updateTimelineNavState(card);
  updateExperienceTimelineProgress();

  if (scrollPanel && experienceTimeline) {
    const top = Math.max(0, card.offsetTop - 36);
    experienceTimeline.scrollTo({
      top,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth"
    });
  }
}

function buildTimelineNav() {
  if (!timelineNav || !timelineItems.length) return;

  timelineNav.innerHTML = "";
  timelineNavButtons.length = 0;

  timelineItems.forEach((item, index) => {
    if (!item.id) {
      item.id = `experience-item-${index + 1}`;
    }

    const button = document.createElement("button");
    const year = item.dataset.timelineYear || String(index + 1);
    const label = item.dataset.timelineLabel || item.dataset.detailTitle || `Experience ${index + 1}`;
    const yearSlot = document.createElement("span");
    const labelSlot = document.createElement("span");

    button.type = "button";
    button.className = "timeline-nav__button";
    button.dataset.targetId = item.id;
    button.setAttribute("aria-controls", item.id);
    button.setAttribute("aria-pressed", "false");

    yearSlot.className = "timeline-nav__year";
    yearSlot.textContent = year;
    labelSlot.className = "timeline-nav__label";
    labelSlot.textContent = label;

    button.append(yearSlot, labelSlot);

    button.addEventListener("click", () => {
      setActiveTimelineItem(item, { scrollPanel: true });
    });

    timelineNav.append(button);
    timelineNavButtons.push(button);
  });
}

buildTimelineNav();

timelineToggles.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const card = button.closest(".timeline-item");
    if (!card) return;

    /* Bascule : recliquer sur un poste ouvert le referme (demande Benji,
       2026-09-02). Avant, le clic ne faisait qu'ouvrir — un poste déplié ne
       pouvait plus être replié, alors que son bouton portait déjà
       `aria-expanded`, ce qui promettait les deux sens.
       L'ouverture continue de passer par `setActiveTimelineItem`, donc
       l'accordéon reste exclusif ; la fermeture ne concerne que le poste visé
       et laisse le repère de position où il est. */
    if (card.classList.contains("open")) {
      setTimelineExpandedState(card, false);
    } else {
      setActiveTimelineItem(card);
    }
  });
});

timelineItems.forEach((item) => {
  item.addEventListener("focusin", () => {
    /* Le clavier déplace le repère sans déplier : sans `expand: false`, le
       `focusin` déclenché par le clic ouvrait le poste juste avant que le
       clic ne le referme, et la bascule ne marchait plus. */
    setActiveTimelineItem(item, { expand: false });
  });
});

if (timelineItems.length) {
  /* Le premier poste est marqué comme courant — pour la frise et sa barre de
     progression — mais reste FERMÉ. L'impression n'est pas concernée :
     `prepareForPrint` ouvre tous les postes avant d'imprimer et
     `restoreAfterPrint` remet l'état d'avant. */
  setActiveTimelineItem(timelineItems[0], { expand: false });
  if (experienceTimeline) {
    experienceTimeline.addEventListener("scroll", updateExperienceTimelineProgress, { passive: true });
  }
  window.addEventListener("resize", updateExperienceTimelineProgress);
  updateExperienceTimelineProgress();
}

const revealTargets = document.querySelectorAll(".reveal");

function setVisibleIfInViewport(el) {
  const rect = el.getBoundingClientRect();
  if (rect.top <= window.innerHeight * 0.92) {
    el.classList.add("visible");
  }
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealTargets.forEach((el, idx) => {
    el.style.transitionDelay = `${Math.min(idx * 40, 260)}ms`;
    setVisibleIfInViewport(el);
    observer.observe(el);
  });
} else {
  revealTargets.forEach((el) => el.classList.add("visible"));
}

const sections = document.querySelectorAll("main section, footer.section");
const topNav = document.querySelector(".top-nav");

const navOrder = ["profil", "experience", "formations"];

function updateActiveMenu() {
  const point = window.scrollY + 160;

  // Sections dans l'ordre de lecture, avec positions absolues (robuste vs offsetParent)
  const secs = navOrder
    .map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { id, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
    })
    .filter(Boolean);
  if (!secs.length) return;

  // Regroupe les sections côte à côte (même haut = même rangée)
  const groups = [];
  secs.forEach((s) => {
    const g = groups.find((grp) => Math.abs(grp.top - s.top) < 12);
    if (g) {
      g.items.push(s);
      g.bottom = Math.max(g.bottom, s.bottom);
    } else {
      groups.push({ top: s.top, bottom: s.bottom, items: [s] });
    }
  });

  // La rangée franchie la plus basse gagne ; sous-zone = item actif dans l'ordre
  let activeId = secs[0].id;
  groups.forEach((g) => {
    if (point < g.top) return;
    const n = g.items.length;
    const band = Math.max(1, (g.bottom - g.top) / n);
    let idx = Math.floor((point - g.top) / band);
    idx = Math.min(Math.max(idx, 0), n - 1);
    activeId = g.items[idx].id;
  });

  // Bas de page : le point de déclenchement ne peut pas atteindre la dernière
  // section, on la force donc quand on touche le bas.
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
    activeId = secs[secs.length - 1].id;
  }

  menuLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${activeId}`;
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateProgress() {
  const el = document.querySelector(".scroll-progress");

  const scrollTop = window.scrollY;
  const full = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = full > 0 ? Math.max(0, Math.min(100, (scrollTop / full) * 100)) : 0;

  if (el) {
    el.style.width = `${ratio}%`;
  }

  if (topNav) {
    topNav.classList.toggle("scrolled", scrollTop > 8);
  }
}

window.addEventListener(
  "scroll",
  () => {
    updateActiveMenu();
    updateProgress();
  },
  { passive: true }
);

let timelineOpenSnapshot = [];

function prepareForPrint() {
  if (!timelineOpenSnapshot.length) {
    timelineOpenSnapshot = Array.from(timelineToggles).map((button) => {
      const card = button.closest(".timeline-item");
      return card ? card.classList.contains("open") : false;
    });
  }

  closeMenu();

  timelineToggles.forEach((button) => {
    const card = button.closest(".timeline-item");
    if (!card) return;
    card.classList.add("open");
    button.setAttribute("aria-expanded", "true");
  });
}

function restoreAfterPrint() {
  if (!timelineOpenSnapshot.length) return;

  timelineToggles.forEach((button, index) => {
    const card = button.closest(".timeline-item");
    if (!card) return;

    const shouldOpen = Boolean(timelineOpenSnapshot[index]);
    card.classList.toggle("open", shouldOpen);
    button.setAttribute("aria-expanded", String(shouldOpen));
  });

  timelineOpenSnapshot = [];
}

const printBtn = document.getElementById("print-cv");
if (printBtn) {
  printBtn.addEventListener("click", () => {
    prepareForPrint();
    window.print();
  });
}

window.addEventListener("beforeprint", prepareForPrint);
window.addEventListener("afterprint", restoreAfterPrint);

updateActiveMenu();
updateProgress();
initCustomCursor();









