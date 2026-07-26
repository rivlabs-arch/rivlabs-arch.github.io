(() => {
  "use strict";

  const FALLBACK_POST = {
    id: "tech-tip-001",
    published: true,
    number: 1,
    series: "Tech Tips",
    seriesLabel: "TECH TIP #001",
    title: "¿Has perdido cambios en Git?",
    topic: "git reflog",
    pillar: "Git",
    publishedDate: "2026-07-26",
    tags: ["Git", "Terminal"],
    summary: "Git conserva un historial local de los movimientos de HEAD que puede ayudarte a localizar commits y estados que ya no aparecen en el historial normal.",
    slides: [
      ["tech_tip_001_slide_01.png", "Portada: ¿Has perdido cambios en Git? Puede que no."],
      ["tech_tip_001_slide_02.png", "El problema: después de ejecutar git reset --hard parece que se han perdido todos los cambios."],
      ["tech_tip_001_slide_03.png", "El descubrimiento: Git guarda más información de la que imaginas mediante git reflog."],
      ["tech_tip_001_slide_04.png", "Ejemplo: ejecuta git reflog, identifica el hash y recupéralo con git checkout o crea una rama nueva."],
      ["tech_tip_001_slide_05.png", "Git reflog permite recuperar commits borrados, ramas eliminadas, resets y posiciones anteriores de HEAD."],
      ["tech_tip_001_slide_06.png", "Idea final: antes de entrar en pánico, ejecuta git reflog."],
      ["tech_tip_001_slide_07.png", "Cierre: ¿Conocías git reflog? Invitación a comentar, guardar y compartir."]
    ].map(([file, alt]) => ({
      src: `./assets/posts/tech-tip-001/${file}`,
      width: 1254,
      height: 1254,
      alt
    }))
  };

  const state = {
    posts: [FALLBACK_POST],
    activePost: null,
    activeSlide: 0,
    activeFilter: "all",
    lastFocus: null,
    touchStartX: null,
    toastTimer: null
  };

  const elements = {
    header: document.querySelector("[data-header]"),
    menuToggle: document.querySelector("[data-menu-toggle]"),
    nav: document.querySelector("[data-nav]"),
    search: document.querySelector("[data-search]"),
    filters: [...document.querySelectorAll("[data-filter]")],
    cards: [...document.querySelectorAll("[data-post-card]")],
    resultCount: document.querySelector("[data-result-count]"),
    resultLabel: document.querySelector("[data-result-label]"),
    emptyState: document.querySelector("[data-empty-state]"),
    clearFilters: document.querySelector("[data-clear-filters]"),
    reader: document.querySelector("[data-reader]"),
    readerSeries: document.querySelector("[data-reader-series]"),
    readerTitle: document.querySelector("[data-reader-title]"),
    closeReader: document.querySelector("[data-close-reader]"),
    carouselViewport: document.querySelector("[data-carousel-viewport]"),
    carouselTrack: document.querySelector("[data-carousel-track]"),
    carouselDots: document.querySelector("[data-carousel-dots]"),
    prevSlide: document.querySelector("[data-prev-slide]"),
    nextSlide: document.querySelector("[data-next-slide]"),
    readerCounter: document.querySelector("[data-reader-counter]"),
    readerProgress: document.querySelector("[data-reader-progress]"),
    slideAnnouncement: document.querySelector("[data-slide-announcement]"),
    sharePost: document.querySelector("[data-share-post]"),
    shareLabel: document.querySelector("[data-share-label]"),
    toast: document.querySelector("[data-toast]")
  };

  async function loadContent() {
    try {
      const response = await fetch("./content/published-content.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.json();
      if (Array.isArray(content.posts)) {
        const publicPosts = content.posts.filter((post) => post?.published === true);
        if (publicPosts.length > 0) state.posts = publicPosts;
      }
    } catch (error) {
      console.info("RivLabs: usando el contenido integrado.", error);
    }
  }

  function normalize(value) {
    return value
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function formatPublishedDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date).replace(" de ", " ").replace(" de ", " ");
  }

  function renderCatalog() {
    const grid = document.querySelector("[data-content-grid]");
    if (!grid) return;
    const fragment = document.createDocumentFragment();

    state.posts.forEach((post) => {
      const cover = post.slides?.[0];
      if (!cover) return;

      const article = document.createElement("article");
      article.className = "post-card";
      article.dataset.postCard = "";
      article.dataset.series = post.series;
      article.dataset.searchText = [post.series, post.title, post.topic, post.pillar, ...(post.tags || [])].join(" ");

      const coverButton = document.createElement("button");
      coverButton.className = "post-cover";
      coverButton.type = "button";
      coverButton.dataset.openPost = post.id;
      coverButton.setAttribute("aria-label", `Leer ${post.seriesLabel}: ${post.title}`);

      const image = document.createElement("img");
      image.src = cover.src;
      image.alt = `Portada de ${post.seriesLabel}: ${post.title}`;
      image.width = cover.width || 1254;
      image.height = cover.height || 1254;
      image.loading = "lazy";
      image.decoding = "async";

      const overlay = document.createElement("span");
      overlay.className = "post-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.textContent = "Leer carrusel ";
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      arrow.setAttribute("viewBox", "0 0 24 24");
      const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arrowPath.setAttribute("d", "m9 18 6-6-6-6");
      arrow.append(arrowPath);
      overlay.append(arrow);
      coverButton.append(image, overlay);

      const body = document.createElement("div");
      body.className = "post-body";
      const meta = document.createElement("div");
      meta.className = "post-meta";
      const series = document.createElement("span");
      series.textContent = post.seriesLabel;
      const time = document.createElement("time");
      time.dateTime = post.publishedDate;
      time.textContent = formatPublishedDate(post.publishedDate);
      meta.append(series, time);

      const title = document.createElement("h3");
      title.textContent = post.title;
      const summary = document.createElement("p");
      summary.textContent = post.summary;
      const tags = document.createElement("div");
      tags.className = "post-tags";
      tags.setAttribute("aria-label", "Temas");
      (post.tags || []).forEach((tag) => {
        const chip = document.createElement("span");
        chip.textContent = tag;
        tags.append(chip);
      });

      body.append(meta, title, summary, tags);
      article.append(coverButton, body);
      fragment.append(article);
    });

    grid.replaceChildren(fragment);
    elements.cards = [...document.querySelectorAll("[data-post-card]")];
  }

  function applyFilters() {
    const query = normalize(elements.search?.value || "");
    let visibleCount = 0;

    elements.cards.forEach((card) => {
      const matchesSeries = state.activeFilter === "all" || card.dataset.series === state.activeFilter;
      const matchesSearch = !query || normalize(card.dataset.searchText || "").includes(query);
      const isVisible = matchesSeries && matchesSearch;

      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (elements.resultCount) elements.resultCount.textContent = String(visibleCount);
    if (elements.resultLabel) elements.resultLabel.textContent = visibleCount === 1 ? "publicación" : "publicaciones";
    if (elements.emptyState) elements.emptyState.hidden = visibleCount !== 0;
  }

  function setFilter(filter) {
    state.activeFilter = filter;
    elements.filters.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    applyFilters();
  }

  function clearFilters() {
    if (elements.search) elements.search.value = "";
    setFilter("all");
    elements.search?.focus();
  }

  function renderReader(post) {
    elements.readerSeries.textContent = post.seriesLabel;
    elements.readerTitle.textContent = post.title;
    elements.carouselTrack.replaceChildren();
    elements.carouselDots.replaceChildren();

    post.slides.forEach((slide, index) => {
      const figure = document.createElement("figure");
      figure.className = "carousel-slide";
      figure.setAttribute("aria-label", `Diapositiva ${index + 1} de ${post.slides.length}`);
      figure.setAttribute("aria-hidden", index === 0 ? "false" : "true");

      const image = document.createElement("img");
      image.src = slide.src;
      image.alt = slide.alt;
      image.width = slide.width || 1254;
      image.height = slide.height || 1254;
      image.decoding = "async";
      if (index > 1) image.loading = "lazy";
      figure.append(image);
      elements.carouselTrack.append(figure);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.dataset.slide = String(index);
      dot.setAttribute("aria-label", `Ir a la diapositiva ${index + 1}`);
      dot.setAttribute("aria-current", index === 0 ? "true" : "false");
      dot.classList.toggle("is-active", index === 0);
      elements.carouselDots.append(dot);
    });

    state.activeSlide = 0;
    updateCarousel();
  }

  function updateCarousel() {
    if (!state.activePost) return;
    const total = state.activePost.slides.length;
    const index = Math.max(0, Math.min(state.activeSlide, total - 1));
    state.activeSlide = index;
    elements.carouselTrack.style.transform = `translateX(-${index * 100}%)`;
    elements.readerCounter.textContent = `${index + 1} / ${total}`;
    elements.readerProgress.style.width = `${((index + 1) / total) * 100}%`;
    if (elements.slideAnnouncement) {
      elements.slideAnnouncement.textContent = `Diapositiva ${index + 1} de ${total}. ${state.activePost.slides[index].alt}`;
    }
    elements.prevSlide.disabled = index === 0;
    elements.nextSlide.disabled = index === total - 1;

    [...elements.carouselTrack.children].forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== index));
    });
    [...elements.carouselDots.children].forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", String(active));
    });
  }

  function goToSlide(index) {
    if (!state.activePost) return;
    state.activeSlide = Math.max(0, Math.min(index, state.activePost.slides.length - 1));
    updateCarousel();
  }

  function openPost(postId, { updateHash = true } = {}) {
    const post = state.posts.find((item) => item.id === postId);
    if (!post || !elements.reader) return;

    state.activePost = post;
    state.lastFocus = document.activeElement;
    renderReader(post);

    if (!elements.reader.open) elements.reader.showModal();
    document.body.classList.add("reader-open");
    elements.closeReader.focus();

    if (updateHash && window.location.hash !== `#${post.id}`) {
      history.replaceState({ post: post.id }, "", `#${post.id}`);
    }
  }

  function closeReader({ clearHash = true } = {}) {
    if (!elements.reader?.open) return;
    elements.reader.close();
    document.body.classList.remove("reader-open");

    if (clearHash && state.activePost && window.location.hash === `#${state.activePost.id}`) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    const focusTarget = state.lastFocus;
    state.activePost = null;
    if (focusTarget instanceof HTMLElement) focusTarget.focus();
  }

  function syncReaderWithHash() {
    let postId = "";
    try {
      postId = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      postId = "";
    }
    const postExists = state.posts.some((post) => post.id === postId);

    if (postExists && (!state.activePost || state.activePost.id !== postId)) {
      openPost(postId, { updateHash: false });
    } else if (!postExists && elements.reader?.open) {
      closeReader({ clearHash: false });
    }
  }

  function showToast(message) {
    if (!elements.toast) return;
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2600);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  async function shareActivePost() {
    if (!state.activePost) return;
    const url = `${window.location.origin}${window.location.pathname}#${state.activePost.id}`;
    const shareData = {
      title: `${state.activePost.seriesLabel} · RivLabs`,
      text: `${state.activePost.title} — ${state.activePost.summary}`,
      url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyText(url);
        showToast("Enlace copiado");
        elements.shareLabel.textContent = "Copiado";
        window.setTimeout(() => { elements.shareLabel.textContent = "Compartir"; }, 2000);
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("No se pudo compartir el enlace");
    }
  }

  function setMenu(open) {
    elements.menuToggle?.setAttribute("aria-expanded", String(open));
    elements.nav?.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    const label = elements.menuToggle?.querySelector(".sr-only");
    if (label) label.textContent = open ? "Cerrar menú" : "Abrir menú";
  }

  function bindEvents() {
    document.querySelectorAll("[data-open-post]").forEach((button) => {
      button.addEventListener("click", () => openPost(button.dataset.openPost));
    });

    elements.search?.addEventListener("input", applyFilters);
    elements.filters.forEach((button) => {
      button.addEventListener("click", () => setFilter(button.dataset.filter));
    });
    elements.clearFilters?.addEventListener("click", clearFilters);

    elements.closeReader?.addEventListener("click", () => closeReader());
    elements.reader?.addEventListener("click", (event) => {
      if (event.target === elements.reader) closeReader();
    });
    elements.reader?.addEventListener("close", () => {
      document.body.classList.remove("reader-open");
    });
    elements.reader?.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeReader();
    });

    elements.prevSlide?.addEventListener("click", () => goToSlide(state.activeSlide - 1));
    elements.nextSlide?.addEventListener("click", () => goToSlide(state.activeSlide + 1));
    elements.carouselDots?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slide]");
      if (button) goToSlide(Number(button.dataset.slide));
    });

    document.addEventListener("keydown", (event) => {
      if (!elements.reader?.open) return;
      if (event.key === "ArrowLeft") goToSlide(state.activeSlide - 1);
      if (event.key === "ArrowRight") goToSlide(state.activeSlide + 1);
    });

    elements.carouselViewport?.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      state.touchStartX = event.clientX;
    });
    elements.carouselViewport?.addEventListener("pointerup", (event) => {
      if (state.touchStartX === null) return;
      const distance = event.clientX - state.touchStartX;
      if (Math.abs(distance) > 45) goToSlide(state.activeSlide + (distance < 0 ? 1 : -1));
      state.touchStartX = null;
    });
    elements.carouselViewport?.addEventListener("pointercancel", () => {
      state.touchStartX = null;
    });

    elements.sharePost?.addEventListener("click", shareActivePost);

    elements.menuToggle?.addEventListener("click", () => {
      setMenu(elements.menuToggle.getAttribute("aria-expanded") !== "true");
    });
    elements.nav?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    window.addEventListener("scroll", () => {
      elements.header?.classList.toggle("is-scrolled", window.scrollY > 12);
    }, { passive: true });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 780) setMenu(false);
    });
    window.addEventListener("hashchange", syncReaderWithHash);
    window.addEventListener("popstate", syncReaderWithHash);
  }

  async function init() {
    await loadContent();
    renderCatalog();
    bindEvents();
    applyFilters();
    syncReaderWithHash();
    document.querySelector("[data-year]").textContent = String(new Date().getFullYear());
    elements.header?.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  init();
})();
