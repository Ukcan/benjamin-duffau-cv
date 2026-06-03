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
  ".interactive-item",
  ".project-card",
  ".timeline-item",
  ".filter-btn",
  ".skill-chip",
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
}

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
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
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) {
      closeMenu();
    }
  });
}

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

  const { scrollPanel = false } = options;

  timelineItems.forEach((item) => {
    const active = item === card;
    item.classList.toggle("is-active", active);
    setTimelineExpandedState(item, active);
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
    setActiveTimelineItem(card);
  });
});

timelineItems.forEach((item) => {
  item.addEventListener("focusin", () => {
    setActiveTimelineItem(item);
  });
});

if (timelineItems.length) {
  setActiveTimelineItem(timelineItems[0]);
  if (experienceTimeline) {
    experienceTimeline.addEventListener("scroll", updateExperienceTimelineProgress, { passive: true });
  }
  window.addEventListener("resize", updateExperienceTimelineProgress);
  updateExperienceTimelineProgress();
}

const projectSection = document.getElementById("projets");
const filterButtons = projectSection ? projectSection.querySelectorAll(".filter-btn") : [];
const skillChips = document.querySelectorAll(".skill-chip");
const projectCards = projectSection ? projectSection.querySelectorAll(".project-card") : [];
const filterStatus = document.getElementById("filter-status");
const projectPrevButton = document.getElementById("projects-prev");
const projectNextButton = document.getElementById("projects-next");
const projectPosition = document.getElementById("projects-position");
const projectPagination = document.getElementById("projects-pagination");
let activeSkillChip = null;
let currentProjectIndex = 0;
const filterLabels = {
  all: "Toutes",
  ux: "UX",
  ui: "UI",
  ecommerce: "E-commerce"
};

function getProjectTags(card) {
  return (card.dataset.tags || "")
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function updateProjectCounts() {
  const counts = {
    all: projectCards.length,
    ux: 0,
    ui: 0,
    ecommerce: 0
  };

  projectCards.forEach((card) => {
    getProjectTags(card).forEach((tag) => {
      if (!(tag in counts)) {
        counts[tag] = 0;
      }

      counts[tag] += 1;
    });
  });

  filterButtons.forEach((btn) => {
    const filter = btn.dataset.filter || "all";
    const countSlot = btn.querySelector(`[data-count-for="${filter}"]`);
    if (countSlot) {
      countSlot.textContent = String(counts[filter] || 0);
    }
  });
}

function getMatchedProjectCards() {
  return [...projectCards].filter((card) => card.dataset.filterMatch === "true");
}

function renderProjectViewer(matchedCards) {
  const cards = matchedCards || getMatchedProjectCards();
  const total = cards.length;

  if (total === 0) {
    projectCards.forEach((card) => {
      card.classList.remove("is-current");
      card.hidden = true;
      card.setAttribute("aria-hidden", "true");
      card.setAttribute("tabindex", "-1");
    });

    if (projectPosition) {
      projectPosition.textContent = "0 / 0";
    }

    if (projectPagination) {
      projectPagination.innerHTML = "";
    }

    if (projectPrevButton) projectPrevButton.disabled = true;
    if (projectNextButton) projectNextButton.disabled = true;
    return;
  }

  if (currentProjectIndex > total - 1) {
    currentProjectIndex = 0;
  }

  projectCards.forEach((card) => {
    const matchedIndex = cards.indexOf(card);
    const isCurrent = matchedIndex === currentProjectIndex;
    const isVisible = matchedIndex !== -1 && isCurrent;

    card.classList.toggle("is-current", isVisible);
    card.hidden = !isVisible;
    card.setAttribute("aria-hidden", String(!isVisible));
    card.setAttribute("tabindex", isVisible ? "0" : "-1");
  });

  if (projectPosition) {
    projectPosition.textContent = `${currentProjectIndex + 1} / ${total}`;
  }

  if (projectPagination) {
    projectPagination.innerHTML = "";

    cards.forEach((card, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "projects-viewer__dot";
      if (index === currentProjectIndex) {
        dot.classList.add("is-active");
      }

      dot.setAttribute("aria-label", `Afficher ${card.dataset.detailTitle || `la réalisation ${index + 1}`}`);
      dot.setAttribute("aria-pressed", String(index === currentProjectIndex));
      dot.addEventListener("click", () => {
        currentProjectIndex = index;
        renderProjectViewer(cards);
      });

      projectPagination.append(dot);
    });
  }

  if (projectPrevButton) {
    projectPrevButton.disabled = total <= 1;
  }

  if (projectNextButton) {
    projectNextButton.disabled = total <= 1;
  }
}

function setFilter(filter, sourceChip = null) {
  const safeFilter = filterLabels[filter] ? filter : "all";
  let visibleCount = 0;
  const matchedCards = [];

  projectCards.forEach((card) => {
    const tags = getProjectTags(card);
    const visible = safeFilter === "all" || tags.includes(safeFilter);

    card.classList.toggle("hidden", !visible);
    card.dataset.filterMatch = String(visible);

    if (visible) {
      visibleCount += 1;
      matchedCards.push(card);
    }
  });

  filterButtons.forEach((btn) => {
    const active = btn.dataset.filter === safeFilter;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  skillChips.forEach((chip) => {
    const active = chip === sourceChip;
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-pressed", String(active));
  });

  activeSkillChip = sourceChip;

  if (filterStatus) {
    const label = filterLabels[safeFilter] || filterLabels.all;
    const projectLabel = visibleCount > 1 ? "projets" : "projet";
    filterStatus.textContent = `${visibleCount} ${projectLabel} affich${visibleCount > 1 ? "es" : "e"} · ${label}`;
  }

  if (projectSection) {
    projectSection.dataset.activeFilter = safeFilter;
  }

  currentProjectIndex = 0;
  renderProjectViewer(matchedCards);
}

filterButtons.forEach((btn) => {
  btn.setAttribute("aria-pressed", String(btn.classList.contains("active")));
  btn.addEventListener("click", () => setFilter(btn.dataset.filter || "all", null));
});

skillChips.forEach((chip) => {
  chip.setAttribute("aria-pressed", "false");
  chip.addEventListener("click", () => {
    const shouldClear = activeSkillChip === chip;
    setFilter(chip.dataset.filter || "all", shouldClear ? null : chip);
  });
});

if (projectPrevButton) {
  projectPrevButton.addEventListener("click", () => {
    const cards = getMatchedProjectCards();
    if (cards.length <= 1) return;

    currentProjectIndex = (currentProjectIndex - 1 + cards.length) % cards.length;
    renderProjectViewer(cards);
  });
}

if (projectNextButton) {
  projectNextButton.addEventListener("click", () => {
    const cards = getMatchedProjectCards();
    if (cards.length <= 1) return;

    currentProjectIndex = (currentProjectIndex + 1) % cards.length;
    renderProjectViewer(cards);
  });
}

updateProjectCounts();
setFilter("all", null);

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

function updateActiveMenu() {
  const point = window.scrollY + 140;

  sections.forEach((section) => {
    const inRange = point >= section.offsetTop && point < section.offsetTop + section.offsetHeight;
    if (!inRange) return;

    const id = section.getAttribute("id");
    menuLinks.forEach((link) => {
      const target = link.getAttribute("href");
      const active = target === `#${id}`;
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  });
}

function updateProgress() {
  const el = document.querySelector(".scroll-progress");
  if (!el) return;

  const scrollTop = window.scrollY;
  const full = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = full > 0 ? (scrollTop / full) * 100 : 0;
  el.style.width = `${ratio}%`;

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

const detailPage = document.getElementById("detail-page");
const detailCard = document.querySelector(".detail-card");
const detailKicker = document.getElementById("detail-kicker");
const detailTitle = document.getElementById("detail-title");
const detailBody = document.getElementById("detail-body");
const detailCloseBtn = document.getElementById("detail-close");
const detailSlots = document.getElementById("detail-slots");
const detailSlotFields = {
  context: document.getElementById("detail-context"),
  role: document.getElementById("detail-role"),
  objectives: document.getElementById("detail-objectives"),
  deliverables: document.getElementById("detail-deliverables"),
  tools: document.getElementById("detail-tools"),
  impact: document.getElementById("detail-impact")
};
const detailCloseTriggers = document.querySelectorAll("[data-close-detail]");
const interactiveItems = document.querySelectorAll(".interactive-item[data-detail-title]");

let lastFocusedElement = null;
let timelineOpenSnapshot = [];

function setDetailGlowPosition(x, y, strength = 0.2) {
  if (!detailCard) return;
  detailCard.style.setProperty("--detail-glow-x", `${x}%`);
  detailCard.style.setProperty("--detail-glow-y", `${y}%`);
  detailCard.style.setProperty("--detail-glow-strength", String(strength));
}

function setDetailFieldContent(field, key, value) {
  if (!field) return;

  if (key === "tools") {
    field.textContent = "";
    field.classList.add("detail-tools-list");

    const tools = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!tools.length) return;

    tools.forEach((tool) => {
      const chip = document.createElement("span");
      chip.className = "detail-chip";
      chip.textContent = tool;
      field.appendChild(chip);
    });
    return;
  }

  field.classList.remove("detail-tools-list");
  field.textContent = value;
}

function isControlClick(target, item) {
  const control = target.closest("a, button, .filter-btn, .skill-chip, .item-toggle, [data-close-detail], .menu-toggle");
  if (!control) return false;

  const isDetailButton = control.classList.contains("interactive-item") && control.hasAttribute("data-detail-title");
  if (isDetailButton && control === item) return false;

  return true;
}

function openDetail(item) {
  if (!detailPage || !detailTitle || !detailBody || !detailCard) return;

  const opensAsSheet = Boolean(item.closest("#formations") || item.closest("#projets"));

  detailKicker.textContent = item.dataset.detailKicker || "Détail";
  detailTitle.textContent = item.dataset.detailTitle || "Élément";
  detailBody.textContent = item.dataset.detailBody || "Aucun détail disponible.";

  const detailEntries = [
    ["context", item.dataset.detailContext],
    ["role", item.dataset.detailRole],
    ["objectives", item.dataset.detailObjectives],
    ["deliverables", item.dataset.detailDeliverables],
    ["tools", item.dataset.detailTools],
    ["impact", item.dataset.detailImpact]
  ];

  let hasDetailSlot = false;
  detailEntries.forEach(([key, value]) => {
    const field = detailSlotFields[key];
    const wrapper = document.getElementById(`detail-slot-${key}-wrap`);
    if (!field || !wrapper) return;

    if (value) {
      setDetailFieldContent(field, key, value);
      wrapper.hidden = false;
      hasDetailSlot = true;
    } else {
      field.textContent = "";
      field.classList.remove("detail-tools-list");
      wrapper.hidden = true;
    }
  });

  if (detailSlots) {
    detailSlots.hidden = !hasDetailSlot;
  }

  detailPage.classList.toggle("mode-sheet", opensAsSheet);
  if (detailCloseBtn) {
    detailCloseBtn.setAttribute(
      "aria-label",
      opensAsSheet ? "Fermer le volet de détail" : "Fermer la fiche détail"
    );
  }

  lastFocusedElement = document.activeElement;
  detailPage.classList.add("open");
  detailPage.setAttribute("aria-hidden", "false");
  document.body.classList.add("detail-open");
  detailCard.scrollTop = 0;
  setDetailGlowPosition(74, 18, 0.2);

  if (detailCloseBtn) {
    detailCloseBtn.focus();
  } else {
    detailCard.focus();
  }
}

function closeDetail() {
  if (!detailPage) return;

  detailPage.classList.remove("open");
  detailPage.classList.remove("mode-sheet");
  detailPage.setAttribute("aria-hidden", "true");
  document.body.classList.remove("detail-open");
  setDetailGlowPosition(74, 18, 0.2);

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function prepareForPrint() {
  if (!timelineOpenSnapshot.length) {
    timelineOpenSnapshot = Array.from(timelineToggles).map((button) => {
      const card = button.closest(".timeline-item");
      return card ? card.classList.contains("open") : false;
    });
  }

  closeDetail();
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

const copyBtn = document.getElementById("copy-email");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const email = copyBtn.dataset.email || "";
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      copyBtn.textContent = "Email copié";
      setTimeout(() => {
        copyBtn.textContent = "Copier l'email";
      }, 1800);
    } catch {
      copyBtn.textContent = "Copie impossible";
    }
  });
}

interactiveItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    if (isControlClick(event.target, item)) return;
    if (item.classList.contains("hidden")) return;
    openDetail(item);
  });

  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("button, a")) return;

    event.preventDefault();
    if (item.classList.contains("hidden")) return;
    openDetail(item);
  });
});

detailCloseTriggers.forEach((trigger) => {
  trigger.addEventListener("click", closeDetail);
});

if (detailCard) {
  detailCard.addEventListener("pointermove", (event) => {
    if (!detailPage?.classList.contains("open")) return;
    if (!detailPage.classList.contains("mode-sheet")) return;

    const rect = detailCard.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setDetailGlowPosition(x, y, 0.28);
  });

  detailCard.addEventListener("pointerleave", () => {
    if (!detailPage?.classList.contains("mode-sheet")) return;
    setDetailGlowPosition(74, 18, 0.2);
  });
}

window.addEventListener("keydown", (event) => {
  if (!detailPage || !detailPage.classList.contains("open")) return;

  if (event.key === "Escape") {
    closeDetail();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = detailPage.querySelectorAll(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
  );

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

updateActiveMenu();
updateProgress();
setFilter("all", null);
initCustomCursor();












