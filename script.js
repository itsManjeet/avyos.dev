const menuBtn = document.getElementById("menuBtn");
const drawer = document.getElementById("drawer");
let bodyLockCount = 0;

function lockBody() {
  bodyLockCount += 1;
  if (bodyLockCount === 1) {
    document.body.style.overflow = "hidden";
  }
}

function unlockBody() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = "";
  }
}

function closeDrawer() {
  if (!drawer || !menuBtn) {
    return;
  }

  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
  unlockBody();
}

function openDrawer() {
  if (!drawer || !menuBtn) {
    return;
  }

  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  menuBtn.setAttribute("aria-expanded", "true");
  lockBody();
}

if (menuBtn && drawer) {
  menuBtn.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("open");
    if (isOpen) {
      closeDrawer();
      return;
    }

    openDrawer();
  });

  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) {
      closeDrawer();
    }
  });

  drawer.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 940) {
      closeDrawer();
    }
  });
}

const questions = Array.from(document.querySelectorAll(".qa"));

function setQuestionState(item, expanded) {
  const button = item.querySelector(".q");
  if (!button) {
    return;
  }

  item.classList.toggle("open", expanded);
  button.setAttribute("aria-expanded", expanded ? "true" : "false");
}

questions.forEach((item) => {
  const button = item.querySelector(".q");
  if (!button) {
    return;
  }

  button.addEventListener("click", () => {
    const willOpen = !item.classList.contains("open");

    questions.forEach((question) => {
      setQuestionState(question, false);
    });

    if (willOpen) {
      setQuestionState(item, true);
    }
  });
});

if (questions.length > 0) {
  setQuestionState(questions[0], true);
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let revealObserver = null;

function ensureRevealObserver() {
  if (prefersReducedMotion || !("IntersectionObserver" in window) || revealObserver) {
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    },
  );
}

function initializeMotionReveal(root = document) {
  const candidates = Array.from(
    root.querySelectorAll(
      ".hero-title, .hero-copy, .hero-actions, .hero-chips, .hero-note, .section-title, .section-sub, .card, .qa, .site-footer, .alpha-warning",
    ),
  );

  const scopedCounts = new Map();
  ensureRevealObserver();

  candidates.forEach((el) => {
    if (el.dataset.revealInit === "true") {
      return;
    }
    el.dataset.revealInit = "true";

    const scope = el.closest("section, footer") || document.body;
    const count = scopedCounts.get(scope) || 0;
    scopedCounts.set(scope, count + 1);
    el.style.setProperty("--reveal-delay", `${Math.min(count * 55, 300)}ms`);
    el.classList.add("motion-reveal");

    if (prefersReducedMotion || !revealObserver) {
      el.classList.add("is-visible");
      return;
    }

    revealObserver.observe(el);
  });
}

const statusSummaryEl = document.getElementById("statusSummary");
const milestoneHelpEl = document.getElementById("milestoneHelp");
const milestoneBoardEl = document.getElementById("milestoneBoard");

function normalizeGroupStatus(status) {
  if (status === "complete" || status === "basic" || status === "off") {
    return status;
  }
  return "off";
}

function normalizeItemStatus(status) {
  if (status === "done" || status === "basic" || status === "not") {
    return status;
  }
  return "not";
}

function createStatusMeter(value, label) {
  const meter = document.createElement("div");
  meter.className = "status-meter";

  const strong = document.createElement("strong");
  strong.textContent = String(value);

  const span = document.createElement("span");
  span.textContent = label;

  meter.append(strong, span);
  return meter;
}

function buildGroupCard(group) {
  const groupStatus = normalizeGroupStatus(group.status);
  const article = document.createElement("article");
  article.className = `card milestone-card ${groupStatus}`;
  article.tabIndex = 0;

  const head = document.createElement("div");
  head.className = "milestone-head";

  const dot = document.createElement("span");
  dot.className = "milestone-dot";
  dot.setAttribute("aria-hidden", "true");

  const title = document.createElement("h3");
  title.textContent = String(group.title || "Untitled");
  head.append(dot, title);

  const list = document.createElement("ul");
  list.className = "group-list";
  const items = Array.isArray(group.items) ? group.items : [];

  items.forEach((item) => {
    const itemStatus = normalizeItemStatus(item.status);
    const li = document.createElement("li");
    li.className = `group-item ${itemStatus}`;

    const itemContainer = document.createElement("div");
    itemContainer.className = "group-item-link";

    const row = document.createElement("div");
    row.className = "group-row";

    const title = document.createElement("span");
    title.className = "group-link";
    title.textContent = String(item.title || "Untitled item");

    const mark = document.createElement("span");
    mark.className = "group-mark";
    mark.setAttribute("aria-hidden", "true");

    row.append(title, mark);

    const desc = document.createElement("p");
    desc.className = "group-desc";
    desc.textContent = String(item.description || "");

    itemContainer.append(row, desc);
    li.appendChild(itemContainer);
    list.appendChild(li);
  });

  article.append(head, list);
  return article;
}

function setupMilestoneInteractions() {
  if (!milestoneBoardEl || milestoneBoardEl.dataset.expandInit === "true") {
    return;
  }
  milestoneBoardEl.dataset.expandInit = "true";

  const closeAllCards = () => {
    milestoneBoardEl.querySelectorAll(".milestone-card.is-open").forEach((card) => {
      card.classList.remove("is-open");
    });
  };

  milestoneBoardEl.addEventListener("click", (event) => {
    const card = event.target.closest(".milestone-card");
    if (!card || !milestoneBoardEl.contains(card)) {
      return;
    }
    card.classList.toggle("is-open");
  });

  milestoneBoardEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const card = event.target.closest(".milestone-card");
    if (!card || !milestoneBoardEl.contains(card)) {
      return;
    }
    event.preventDefault();
    card.classList.toggle("is-open");
  });

  document.addEventListener("click", (event) => {
    if (milestoneBoardEl.contains(event.target)) {
      return;
    }
    closeAllCards();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllCards();
    }
  });
}

function renderProjectStatus(config) {
  if (!statusSummaryEl || !milestoneHelpEl || !milestoneBoardEl) {
    return;
  }

  const groups = Array.isArray(config.groups) ? config.groups : [];
  const itemCounts = { done: 0, basic: 0, not: 0 };
  let totalTasks = 0;

  groups.forEach((group) => {
    const items = Array.isArray(group.items) ? group.items : [];
    totalTasks += items.length;
    items.forEach((item) => {
      itemCounts[normalizeItemStatus(item.status)] += 1;
    });
  });

  statusSummaryEl.replaceChildren(
    createStatusMeter(itemCounts.done, "Completed tasks"),
    createStatusMeter(itemCounts.basic, "Basic support"),
    createStatusMeter(itemCounts.not, "Not done"),
    createStatusMeter(totalTasks, "Total tasks"),
  );

  milestoneHelpEl.textContent =
    typeof config.helpText === "string" && config.helpText.trim() !== ""
      ? config.helpText
      : "Grouped by domain. Hover or tap a card to expand.";

  milestoneBoardEl.replaceChildren(...groups.map((group) => buildGroupCard(group)));
  setupMilestoneInteractions();
  initializeMotionReveal(milestoneBoardEl);
}

async function loadAndRenderProjectStatus() {
  if (!statusSummaryEl || !milestoneHelpEl || !milestoneBoardEl) {
    return;
  }

  try {
    const response = await fetch("data/project-status.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    const config = await response.json();
    renderProjectStatus(config);
  } catch (error) {
    console.error("Failed to load project status config:", error);
    renderProjectStatus({
      helpText: "Could not load project status JSON. Verify data/project-status.json.",
      groups: [],
    });
  }
}

void loadAndRenderProjectStatus();
initializeMotionReveal();

const PREVIEW_IMAGES = [
  { src: "assets/app-menu.png", label: "App menu" },
  { src: "assets/file-manager.png", label: "File Manager" },
  { src: "assets/interface.png", label: "System Interface" },
  { src: "assets/login-screen.png", label: "Login Screen" },
  { src: "assets/terminal-app.png", label: "Terminal App" },
  { src: "assets/user-setup.png", label: "User Setup" },
  { src: "assets/welcome-screen.png", label: "Welcome Screen" },
].map((item) => ({
  ...item,
  alt: `Avyos preview: ${item.label.toLowerCase()}`,
}));

const previewGallery = document.getElementById("previewGallery");
const previewOpen = document.getElementById("previewOpen");
const previewImage = document.getElementById("previewImage");
const previewPrev = document.getElementById("previewPrev");
const previewNext = document.getElementById("previewNext");

const previewLightbox = document.getElementById("previewLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const lightboxClose = document.getElementById("lightboxClose");

if (
  previewGallery &&
  previewOpen &&
  previewImage &&
  previewPrev &&
  previewNext &&
  previewLightbox &&
  lightboxImage &&
  lightboxPrev &&
  lightboxNext &&
  lightboxClose
) {
  let currentIndex = 0;
  let isLightboxOpen = false;
  let autoSlideTimer = null;
  let isSliding = false;
  let pendingSlideRequest = null;
  const autoSlideMs = 5000;
  const transitionMs = 180;
  const imagePreloadCache = new Map();

  const preloadImage = (src) => {
    if (imagePreloadCache.has(src)) {
      return imagePreloadCache.get(src);
    }

    const promise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = src;
    });

    imagePreloadCache.set(src, promise);
    return promise;
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const transitionElementToSlide = async (element, item, direction, instant = false) => {
    const inClass = direction >= 0 ? "slide-in-next" : "slide-in-prev";
    const outClass = direction >= 0 ? "slide-out-next" : "slide-out-prev";
    const allClasses = ["slide-in-next", "slide-in-prev", "slide-out-next", "slide-out-prev"];

    element.classList.remove(...allClasses);
    if (instant) {
      element.src = item.src;
      element.alt = item.alt;
      return;
    }

    element.classList.add(outClass);
    await sleep(transitionMs);
    element.classList.remove(outClass);

    element.src = item.src;
    element.alt = item.alt;
    if (typeof element.decode === "function") {
      try {
        await element.decode();
      } catch {
        // decode can fail for cross-origin or timing reasons; no-op fallback
      }
    }

    element.classList.add(inClass);
    await sleep(transitionMs + 70);
    element.classList.remove(inClass);
  };

  const applySlide = async (nextIndex, direction = 1, instant = false) => {
    const total = PREVIEW_IMAGES.length;
    const normalizedIndex = (nextIndex + total) % total;
    currentIndex = normalizedIndex;
    const item = PREVIEW_IMAGES[currentIndex];
    const nextItem = PREVIEW_IMAGES[(normalizedIndex + 1) % total];
    const prevItem = PREVIEW_IMAGES[(normalizedIndex - 1 + total) % total];
    await Promise.all([preloadImage(item.src), preloadImage(nextItem.src), preloadImage(prevItem.src)]);

    if (isLightboxOpen && !instant) {
      await Promise.all([
        transitionElementToSlide(previewImage, item, direction, false),
        transitionElementToSlide(lightboxImage, item, direction, false),
      ]);
      return;
    }

    await transitionElementToSlide(previewImage, item, direction, instant);
    await transitionElementToSlide(lightboxImage, item, direction, true);
  };

  const setSlide = (nextIndex, direction = 1, instant = false) => {
    if (isSliding && !instant) {
      pendingSlideRequest = { nextIndex, direction, instant };
      return;
    }

    isSliding = true;
    void applySlide(nextIndex, direction, instant).finally(() => {
      isSliding = false;
      if (pendingSlideRequest) {
        const queued = pendingSlideRequest;
        pendingSlideRequest = null;
        setSlide(queued.nextIndex, queued.direction, queued.instant);
      }
    });
  };

  const stopAutoSlide = () => {
    if (autoSlideTimer !== null) {
      window.clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    if (PREVIEW_IMAGES.length <= 1 || isLightboxOpen) {
      return;
    }

    autoSlideTimer = window.setInterval(() => {
      setSlide(currentIndex + 1, 1);
    }, autoSlideMs);
  };

  const restartAutoSlide = () => {
    startAutoSlide();
  };

  const openLightbox = () => {
    isLightboxOpen = true;
    previewLightbox.classList.add("open");
    previewLightbox.setAttribute("aria-hidden", "false");
    lockBody();
    stopAutoSlide();
  };

  const closeLightbox = () => {
    if (!isLightboxOpen) {
      return;
    }

    isLightboxOpen = false;
    previewLightbox.classList.remove("open");
    previewLightbox.setAttribute("aria-hidden", "true");
    unlockBody();
    startAutoSlide();
  };

  previewPrev.addEventListener("click", () => {
    setSlide(currentIndex - 1, -1);
    restartAutoSlide();
  });

  previewNext.addEventListener("click", () => {
    setSlide(currentIndex + 1, 1);
    restartAutoSlide();
  });

  previewOpen.addEventListener("click", openLightbox);

  lightboxPrev.addEventListener("click", () => {
    setSlide(currentIndex - 1, -1);
  });

  lightboxNext.addEventListener("click", () => {
    setSlide(currentIndex + 1, 1);
  });

  lightboxClose.addEventListener("click", closeLightbox);
  previewLightbox.addEventListener("click", (event) => {
    if (event.target === previewLightbox) {
      closeLightbox();
    }
  });

  previewGallery.addEventListener("mouseenter", stopAutoSlide);
  previewGallery.addEventListener("mouseleave", startAutoSlide);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoSlide();
      return;
    }
    startAutoSlide();
  });

  if (PREVIEW_IMAGES.length <= 1) {
    previewPrev.hidden = true;
    previewNext.hidden = true;
    lightboxPrev.hidden = true;
    lightboxNext.hidden = true;
  }

  setSlide(0, 1, true);
  startAutoSlide();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isLightboxOpen) {
        closeLightbox();
      }
      if (drawer && drawer.classList.contains("open")) {
        closeDrawer();
      }
      return;
    }

    if (!isLightboxOpen) {
      return;
    }

    if (event.key === "ArrowLeft") {
      setSlide(currentIndex - 1, -1);
    }

    if (event.key === "ArrowRight") {
      setSlide(currentIndex + 1, 1);
    }
  });
} else {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer && drawer.classList.contains("open")) {
      closeDrawer();
    }
  });
}
