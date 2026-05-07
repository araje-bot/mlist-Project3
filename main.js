

const LYRIA_MODEL = "lyria-3-pro-preview";
const GEMINI_LYRIA_GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${LYRIA_MODEL}:generateContent`;

async function expandMusicPromptViaApi(userInput, signal) {
  const brief = String(userInput || "").trim();
  if (!brief) return null;
  try {
    const res = await fetch("/api/expand-music-prompt", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userInput: brief }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) return null;
    return data.data || null;
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    return null;
  }
}

/** Rotation (deg) per stack slot — must match `styles.css` `.sticky--stack-*`. */
const STICKY_STACK_ROT = { 1: -6.81, 2: -0.76, 3: 9.22, 4: 0 };
/** Under-sheet + composer hues (cycle order). */
const STICKY_STACK_HUES = ["sticky--yellow", "sticky--purple", "sticky--pink", "sticky--mint"];

/** Right-side icon slot for schedule rows — same 4-type cycle as index.html (phone, bowl, projector, clipboard). */
function scheduleIconSlotHtml(iconIndex) {
  const i = ((iconIndex % 4) + 4) % 4;
  if (i === 0) {
    return `<span class="schedule__icon" aria-hidden="true"><img src="./assets/icons/phone.svg" alt="" /></span>`;
  }
  if (i === 1) {
    return `<span class="schedule__icon" aria-hidden="true"><img src="./assets/icons/bowl-food.svg" alt="" /></span>`;
  }
  if (i === 2) {
    return `<span class="schedule__icon schedule__icon--projector" aria-hidden="true"><div class="projector"><div class="projector__cell projector__cell--v1"><img src="./assets/icons/projector-vector-1.svg" alt="" /></div><div class="projector__cell projector__cell--v2"><img src="./assets/icons/projector-vector-2.svg" alt="" /></div><div class="projector__cell projector__cell--v3"><img src="./assets/icons/projector-vector-3.svg" alt="" /></div><div class="projector__cell projector__cell--v4"><img src="./assets/icons/projector-vector-4.svg" alt="" /></div><div class="projector__cell projector__cell--v5"><img src="./assets/icons/projector-vector-5.svg" alt="" /></div></div></span>`;
  }
  return `<span class="schedule__icon" aria-hidden="true"><img src="./assets/icons/clipboard.svg" alt="" /></span>`;
}

function scheduleRowInnerHtml(text) {
  return `
      <span class="schedule__name">${escapeHtml(text)}</span>
      <div class="schedule__meta-end">
        <button type="button" class="schedule__delete" draggable="false" aria-label="Remove from schedule">×</button>
      </div>
    `;
}

/** Composer: append a new schedule row (bind + persist). Optional `flightSource` runs a FLIP flight animation. */
function appendTextToScheduleAsCard(rawText, options = {}) {
  const { flightSource, onFlightComplete } = options;
  const list = document.getElementById("schedule-list");
  if (!list) return null;
  const text = String(rawText ?? "").trim();
  if (!text) return null;
  const iconIndex = list.children.length;
  const li = document.createElement("li");
  li.className = "schedule__item schedule__item--from-sticky";
  li.setAttribute("tabindex", "-1");
  li.dataset.id = `compose-${Math.random().toString(36).slice(2, 11)}`;
  li.innerHTML = scheduleRowInnerHtml(text, iconIndex);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const willFly = Boolean(flightSource) && !reduceMotion;
  if (willFly) {
    li.classList.add("schedule__item--flight-pending");
    li.style.opacity = "0";
  }
  list.appendChild(li);
  bindScheduleItemDrag(li);
  saveSchedule();

  if (flightSource && !reduceMotion) {
    flyScheduleRowFromSource(flightSource, text, li, onFlightComplete);
  } else {
    li.classList.add("is-arriving");
    li.addEventListener("animationend", () => li.classList.remove("is-arriving"), { once: true });
    if (onFlightComplete) queueMicrotask(onFlightComplete);
  }
  return li;
}

/**
 * Animate a floating card from the composer stack to the new list row (GSAP timeline).
 * Uses transform-only motion (x/y + scaleX/scaleY) so the browser does not reflow every
 * frame — animating width/height causes layout thrashing and looks like low FPS.
 */
function flyScheduleRowFromSource(sourceEl, text, li, onDone) {
  const from = sourceEl.getBoundingClientRect();
  li.classList.add("schedule__item--flight-pending");
  li.style.opacity = "0";

  const ghost = document.createElement("div");
  ghost.className = "schedule-fly-card";
  ghost.setAttribute("aria-hidden", "true");
  ghost.innerHTML = `<span class="schedule-fly-card__text">${escapeHtml(text)}</span>`;
  document.body.appendChild(ghost);

  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;

  li.scrollIntoView({ block: "nearest", behavior: "instant" });

  let flightCleanedUp = false;
  const finishFlight = () => {
    if (flightCleanedUp) return;
    flightCleanedUp = true;
    li.classList.remove("schedule__item--flight-pending");
    li.style.removeProperty("opacity");
    li.classList.add("schedule__item--flight-handoff");
    let doneCalled = false;
    const done = () => {
      if (doneCalled) return;
      doneCalled = true;
      li.classList.remove("schedule__item--flight-handoff");
      if (onDone) onDone();
    };
    li.addEventListener(
      "animationend",
      (e) => {
        if (e.target !== li) return;
        if (!String(e.animationName || "").includes("schedule-flight-handoff")) return;
        done();
      },
      { once: true },
    );
    requestAnimationFrame(() => {
      if (ghost.parentElement) ghost.remove();
    });
    window.setTimeout(done, 420);
  };

  const runCssFallback = () => {
    const to = li.getBoundingClientRect();
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = to.width / Math.max(from.width, 1);
    const sy = to.height / Math.max(from.height, 1);
    ghost.style.willChange = "transform, opacity";
    ghost.style.transform = "translate3d(0,0,0)";
    ghost.style.transition =
      "transform 0.52s cubic-bezier(0.45, 0, 0.55, 1), opacity 0.12s cubic-bezier(0.4, 0, 0.6, 1) 0.26s";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ghost.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
        ghost.style.opacity = "0";
      });
    });
    const finish = (ev) => {
      if (ev.propertyName !== "transform") return;
      ghost.removeEventListener("transitionend", finish);
      finishFlight();
    };
    ghost.addEventListener("transitionend", finish);
    setTimeout(() => {
      if (!ghost.parentElement) return;
      ghost.removeEventListener("transitionend", finish);
      finishFlight();
    }, 800);
  };

  const boot = () => {
    const to = li.getBoundingClientRect();
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const lift = Math.min(12, Math.max(5, Math.round(from.height * 0.08)));

    loadGsap()
      .then(({ gsap }) => {
        if (!ghost.parentElement) return;

        const sx = to.width / Math.max(from.width, 1);
        const sy = to.height / Math.max(from.height, 1);

        gsap.set(ghost, {
          left: from.left,
          top: from.top,
          width: from.width,
          height: from.height,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: -2,
          skewX: -1,
          opacity: 1,
          transformOrigin: "top left",
          force3D: true,
        });

        const tl = gsap.timeline({
          defaults: { overwrite: "auto", force3D: true },
          onComplete: () => {
            tl.kill();
            finishFlight();
          },
        });

        const textEl = ghost.querySelector(".schedule-fly-card__text");

        tl.to(ghost, {
          y: -lift,
          rotation: 0,
          skewX: 0,
          duration: 0.12,
          ease: "sine.out",
        })
          .to(
            ghost,
            {
              x: dx,
              y: dy,
              scaleX: sx,
              scaleY: sy,
              duration: 0.52,
              ease: "circ.inOut",
            },
            "-=0.03"
          )
          // Fade text out in the first quarter of the morph — gone before squeeze is visible
          .to(
            textEl || {},
            {
              autoAlpha: 0,
              duration: 0.14,
              ease: "power2.in",
            },
            "<"
          )
          .to(
            ghost,
            {
              autoAlpha: 0,
              duration: 0.2,
              ease: "power2.out",
            },
            "-=0.1"
          );

        setTimeout(() => {
          if (!ghost.parentElement) return;
          tl.kill();
          finishFlight();
        }, 1100);
      })
      .catch(() => {
        if (!ghost.parentElement) return;
        runCssFallback();
      });
  };

  requestAnimationFrame(boot);
}

function stickyStackSlotFromClass(el) {
  const m = el.className.match(/sticky--stack-(\d)/);
  return m ? Number(m[1]) : 4;
}

function stripStickyStackSlot(el) {
  for (let i = 1; i <= 4; i += 1) el.classList.remove(`sticky--stack-${i}`);
}

function stripStickyHues(el) {
  for (const c of STICKY_STACK_HUES) el.classList.remove(c);
}

/** Initial / idle layout: four `.sticky` children, last is composer (stack-4). */
function applyStickyStackLayout(stack) {
  const layers = [...stack.querySelectorAll(":scope > .sticky")];
  if (layers.length !== 4) return;
  layers.forEach((el, i) => {
    stripStickyStackSlot(el);
    el.classList.add(`sticky--stack-${i + 1}`);
    el.classList.remove("sticky-stack__composer");
    el.style.removeProperty("--sticky-pile-n");
    el.removeAttribute("inert");
    el.removeAttribute("aria-hidden");
    el.style.removeProperty("pointer-events");
  });
  const composer = layers[3];
  composer.classList.add("sticky-stack__composer");
  layers.slice(0, 3).forEach((el, i) => {
    el.setAttribute("inert", "");
    el.setAttribute("aria-hidden", "true");
    el.style.zIndex = String(i + 1);
  });
  composer.removeAttribute("inert");
  composer.removeAttribute("aria-hidden");
  composer.style.removeProperty("z-index");
}

/**
 * After a note flies to schedule: former top moves to back; next sheet becomes composer.
 * Hues rotate; FLIP + GSAP when motion is allowed (classic four-card stack).
 */
function cycleComposerStackAfterSubmit() {
  const stack = document.querySelector(".sticky-stack");
  if (!stack) return;

  let layers = [...stack.querySelectorAll(":scope > .sticky")];
  if (layers.length !== 4) return;

  const currentHue = layers.map(
    (el) => STICKY_STACK_HUES.find((c) => el.classList.contains(c)) || "sticky--mint",
  );
  const nextHue = [currentHue[3], currentHue[0], currentHue[1], currentHue[2]];

  const applyStackLayout = (ordered) => {
    ordered.forEach((el, i) => {
      stripStickyStackSlot(el);
      el.classList.add(`sticky--stack-${i + 1}`);
      el.classList.remove("sticky-stack__composer");
      el.style.removeProperty("--sticky-pile-n");
      el.removeAttribute("inert");
      el.removeAttribute("aria-hidden");
      el.style.removeProperty("pointer-events");
    });
    const composerHost = ordered[3];
    composerHost.classList.add("sticky-stack__composer");
    ordered.slice(0, 3).forEach((el, i) => {
      el.setAttribute("inert", "");
      el.setAttribute("aria-hidden", "true");
      el.style.zIndex = String(i + 1);
    });
    ordered.forEach((el, i) => {
      stripStickyHues(el);
      el.classList.add(nextHue[i]);
    });
    composerHost.removeAttribute("inert");
    composerHost.removeAttribute("aria-hidden");
    composerHost.style.removeProperty("z-index");
  };

  const formerTop = layers[3];
  const beforeOrder = layers.slice();
  const firstRect = new Map(beforeOrder.map((el) => [el, el.getBoundingClientRect()]));
  const rotBefore = new Map(
    beforeOrder.map((el) => [el, STICKY_STACK_ROT[stickyStackSlotFromClass(el)] ?? 0]),
  );

  const frag = document.createDocumentFragment();
  while (formerTop.firstChild) frag.appendChild(formerTop.firstChild);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    stack.insertBefore(formerTop, layers[0]);
    layers = [...stack.querySelectorAll(":scope > .sticky")];
    const host = layers[3];
    while (frag.firstChild) host.appendChild(frag.firstChild);
    applyStackLayout(layers);
    requestAnimationFrame(() => document.getElementById("sticky-composer")?.focus());
    return;
  }

  stack.insertBefore(formerTop, layers[0]);
  layers = [...stack.querySelectorAll(":scope > .sticky")];
  const newComposer = layers[3];
  while (frag.firstChild) newComposer.appendChild(frag.firstChild);

  applyStackLayout(layers);

  requestAnimationFrame(() => document.getElementById("sticky-composer")?.focus());

  loadGsap()
    .then(({ gsap }) => {
      requestAnimationFrame(() => {
        const step = 0.055;
        const baseDelay = 0.04;
        const tl = gsap.timeline({
          defaults: { transformOrigin: "50% 50%", force3D: true },
          onComplete: () => {
            layers.forEach((el) => gsap.set(el, { clearProps: "transform" }));
          },
        });

        layers.forEach((el, i) => {
          const fr = firstRect.get(el);
          const lr = el.getBoundingClientRect();
          if (!fr) return;
          const dx = fr.left - lr.left;
          const dy = fr.top - lr.top;
          const r0 = rotBefore.get(el) ?? 0;
          const r1 = STICKY_STACK_ROT[stickyStackSlotFromClass(el)] ?? 0;
          const isNewTop = i === 3;
          const startAt = baseDelay + (3 - i) * step;

          gsap.set(el, { x: dx, y: dy, rotation: r0 });

          tl.to(
            el,
            {
              x: 0,
              y: 0,
              rotation: r1,
              duration: isNewTop ? 0.88 : 0.58,
              ease: isNewTop ? "elastic.out(0.9, 0.65)" : "back.out(1.28)",
            },
            startAt,
          );
        });
      });
    })
    .catch(() => {});
}

function initStickyComposer() {
  const composer = document.getElementById("sticky-composer");
  if (!composer) return;

  let flightBusy = false;

  function doSubmit() {
    const text = composer.value.trim();
    if (!text || flightBusy) return;
    flightBusy = true;
    const sourceEl = composer.closest(".sticky-stack__composer") || composer;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const li = appendTextToScheduleAsCard(text, {
      flightSource: sourceEl,
      onFlightComplete: () => { flightBusy = false; },
    });
    if (!li) { flightBusy = false; return; }
    composer.value = "";
    cycleComposerStackAfterSubmit();
    playClickSound(520);
    if (reduceMotion) li.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  composer.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    doSubmit();
  });

  const tickBtn = document.getElementById("sticky-submit");
  tickBtn?.addEventListener("click", () => doSubmit());
}

/* =========================================================
   Schedule reordering + delete (HTML5 DnD reorder + row click)
   --------------------------------------------------------- */
function bindScheduleItemDrag(item) {
  item.draggable = true;
  item.addEventListener("dragstart", (e) => {
    if (e.target.closest(".schedule__delete")) {
      e.preventDefault();
      return;
    }
    item.classList.add("is-grabbing");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.id || "");
  });
  item.addEventListener("dragend", () => {
    item.classList.remove("is-grabbing");
    saveSchedule();
    const swallow = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    item.addEventListener("click", swallow, { capture: true, once: true });
  });
}

function initStickyDrag(stack) {
  const SLOT_ROT = { 1: -6.81, 2: -0.76, 3: 9.22, 4: 0 };

  // Board bounds for clamping
  const boardInner = stack.closest(".board__inner") || stack.parentElement;

  // Only the composer (top) sticky is draggable
  const composer = stack.querySelector(".sticky-stack__composer");
  if (!composer) return;

  let ox = 0, oy = 0, sx = 0, sy = 0, moved = false, active = false, pid = null;

  function getSlotRot() {
    const m = composer.className.match(/sticky--stack-(\d)/);
    return m ? (SLOT_ROT[+m[1]] ?? 0) : 0;
  }

  function lockPosition() {
    if (composer.style.left && composer.style.top) return;
    composer.dataset.rot = getSlotRot();
    composer.style.left = composer.offsetLeft + "px";
    composer.style.top  = composer.offsetTop  + "px";
    composer.style.transform = `rotate(${composer.dataset.rot}deg)`;
  }

  composer.addEventListener("pointerdown", (e) => {
    if (e.target.closest("textarea")) return; // let textarea handle its own clicks
    lockPosition();
    sx = e.clientX; sy = e.clientY;
    ox = parseFloat(composer.style.left);
    oy = parseFloat(composer.style.top);
    moved = false; active = true; pid = e.pointerId;
    composer.style.zIndex = "200";
  });

  function onDocMove(e) {
    if (!active || e.pointerId !== pid) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (!moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    if (!moved) {
      moved = true;
      try { composer.setPointerCapture(pid); } catch {}
      composer.style.boxShadow = "0 16px 40px -8px rgba(0,0,0,0.28)";
      stack._dissolveHint?.();
    }
    e.preventDefault();
    composer.style.cursor = "grabbing";

    const bW = boardInner ? boardInner.offsetWidth  : window.innerWidth;
    const bH = boardInner ? boardInner.offsetHeight : window.innerHeight;
    const newLeft = Math.max(0, Math.min(ox + dx, bW - composer.offsetWidth));
    const newTop  = Math.max(0, Math.min(oy + dy, bH - composer.offsetHeight));
    composer.style.left = newLeft + "px";
    composer.style.top  = newTop  + "px";
  }

  function onDocUp(e) {
    if (!active || e.pointerId !== pid) return;
    active = false; pid = null;
    composer.style.zIndex = moved ? "10" : "";
    composer.style.cursor = "";
    composer.style.boxShadow = "";
  }

  document.addEventListener("pointermove", onDocMove, { passive: false });
  document.addEventListener("pointerup",   onDocUp);
  document.addEventListener("pointercancel", onDocUp);
}

function initStickyHint(stack) {
  const bubble = document.querySelector(".hn-bubble--tasks");
  const arrow  = document.querySelector(".hn-arrow--tasks");
  if (!bubble || !arrow) return;

  let dismissed = false;
  let nudgeTweens = [];

  loadGsap().then(({ gsap }) => {
    const isMobile = window.matchMedia("(max-width: 600px)").matches;
    // Gentle looping nudge on the arrow (points toward the stack)
    const arrowNudge = gsap.to(arrow, {
      y: isMobile ? 5 : 7,
      x: isMobile ? 3 : 4,
      duration: isMobile ? 1.6 : 0.9,
      repeat: -1, yoyo: true,
      ease: "sine.inOut",
    });
    // Subtle bob on the bubble label
    const bubbleNudge = gsap.to(bubble, {
      y: isMobile ? -3 : -4,
      duration: isMobile ? 1.8 : 1.1,
      repeat: -1, yoyo: true,
      ease: "sine.inOut",
      delay: 0.25,
    });
    nudgeTweens = [arrowNudge, bubbleNudge];

    // Expose dissolve function for drag handler
    stack._dissolveHint = () => {
      if (dismissed) return;
      dismissed = true;
      nudgeTweens.forEach((t) => t.kill());
      gsap.to([bubble, arrow], {
        opacity: 0,
        y: "-=10",
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.08,
        onComplete: () => {
          bubble.style.display = "none";
          arrow.style.display  = "none";
        },
      });
    };
  }).catch(() => {});
}

function initBoardDots(board) {
  const dotsEl = board.querySelector(".board__dots");
  if (!dotsEl) return;

  // Replace CSS background with an interactive canvas
  dotsEl.style.backgroundImage = "none";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  dotsEl.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const SPACING = 9;       // matches SVG grid (9px between dot centres)
  const BASE_R  = 1.1;     // slightly smaller than SVG r="1.5"
  const MAX_R   = 3.0;     // radius at cursor centre
  const INFLUENCE = 72;    // px — distance over which effect falls off
  const DOT_COLOR = "#D8DBDF"; // a touch darker than the original #EEF0F1

  // Raw target position (from mouse events)
  let tx = -9999, ty = -9999;
  // Smoothed position used for rendering (lerps toward target each frame)
  let mx = -9999, my = -9999;
  let W = 0, H = 0, raf = 0;
  const LERP = 0.1; // smooth, fluid follow
  let pulsePhase = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = canvas.width  = Math.ceil(r.width);
    H = canvas.height = Math.ceil(r.height);
  }

  function draw() {
    // Smooth the cursor position — only lerp when the cursor is on-canvas
    if (tx < -999) {
      // Cursor off canvas: glide the influence zone away gradually
      mx += (-9999 - mx) * LERP;
      my += (-9999 - my) * LERP;
    } else {
      mx += (tx - mx) * LERP;
      my += (ty - my) * LERP;
    }

    pulsePhase += 0.045;
    const pulse = 0.5 + 0.5 * Math.sin(pulsePhase); // 0→1 smooth oscillation

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = DOT_COLOR;
    const cols = Math.ceil(W / SPACING) + 1;
    const rows = Math.ceil(H / SPACING) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * SPACING + 1.5;
        const y = r * SPACING + 1.5;
        const dist = Math.hypot(x - mx, y - my);
        const t = Math.max(0, 1 - dist / INFLUENCE);
        const pulsedMax = MAX_R * (0.72 + 0.28 * pulse); // breathes between 72%–100% of max
        const radius = BASE_R + (pulsedMax - BASE_R) * t * t;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 6.2832);
        ctx.fill();
      }
    }
    raf = requestAnimationFrame(draw);
  }

  const boardInner = board.querySelector(".board__inner") || board;
  boardInner.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
  });
  boardInner.addEventListener("mouseleave", () => { tx = -9999; ty = -9999; });

  new ResizeObserver(resize).observe(board);
  resize();
  draw();
}

function initScheduleReorder() {
  const list = document.getElementById("schedule-list");
  if (!list) return;

  const panel = list.closest(".schedule");
  panel?.style.removeProperty("opacity");
  panel?.style.removeProperty("transform");

  hydrateSchedule(list);

  Array.from(list.children).forEach((el) => {
    el.style.removeProperty("opacity");
    el.style.removeProperty("transform");
    el.setAttribute("tabindex", "-1");
    el.dataset.id = el.dataset.id || `built-${Math.random().toString(36).slice(2, 8)}`;
    bindScheduleItemDrag(el);
  });

  list.addEventListener("dragenter", (e) => {
    e.preventDefault();
  });
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const dragging = list.querySelector(".is-grabbing");
    if (!dragging) return;
    const after = getDragAfterElement(list, e.clientY);
    if (after == null) {
      list.appendChild(dragging);
    } else {
      list.insertBefore(dragging, after);
    }
  });
  list.addEventListener("drop", (e) => {
    e.preventDefault();
  });

  list.addEventListener("click", (e) => {
    const del = e.target.closest(".schedule__delete");
    if (del) {
      e.preventDefault();
      e.stopPropagation();
      const item = del.closest(".schedule__item");
      if (item) {
        item.remove();
        saveSchedule();
        playClickSound(300);
      }
      return;
    }
    const item = e.target.closest(".schedule__item");
    if (!item) return;
    item.classList.toggle("is-done");
    playClickSound(item.classList.contains("is-done") ? 480 : 720);
    saveSchedule();
  });
}

function getDragAfterElement(container, y) {
  const els = Array.from(container.querySelectorAll(".schedule__item:not(.is-grabbing)"));
  return els.reduce(
    (closest, child) => {
      const r = child.getBoundingClientRect();
      const offset = y - r.top - r.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, el: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, el: null },
  ).el;
}

function scheduleIconSrc(li) {
  const img = li.querySelector(".schedule__icon img");
  return img?.getAttribute("src") || "./assets/icons/clipboard.svg";
}

function saveSchedule() {
  const list = document.getElementById("schedule-list");
  if (!list) return;
  const items = Array.from(list.children).map((li) => ({
    id: li.dataset.id,
    name: li.querySelector(".schedule__name")?.textContent?.trim() || "",
    icon: scheduleIconSrc(li),
    done: li.classList.contains("is-done"),
    fromSticky: li.classList.contains("schedule__item--from-sticky"),
  }));
  localStorage.setItem("mlist:schedule", JSON.stringify(items));
}

function hydrateSchedule(list) {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem("mlist:schedule") || "null");
  } catch {
    saved = null;
  }
  if (!Array.isArray(saved) || saved.length === 0) return;

  const valid = saved.filter(
    (entry) => entry && typeof entry === "object" && String(entry.name ?? "").trim().length > 0,
  );
  if (valid.length === 0) {
    try {
      localStorage.removeItem("mlist:schedule");
    } catch {
      /* ignore */
    }
    return;
  }

  const existing = Array.from(list.children);
  list.innerHTML = "";

  for (const entry of valid) {
    let li;
    const reuse = existing.find((e) => e.querySelector(".schedule__name")?.textContent?.trim() === entry.name);
    if (reuse) {
      li = reuse;
    } else {
      li = document.createElement("li");
      li.className = "schedule__item" + (entry.fromSticky ? " schedule__item--from-sticky" : "");
      li.innerHTML = `
        <span class="schedule__name">${escapeHtml(entry.name)}</span>
        <div class="schedule__meta-end">
          <button type="button" class="schedule__delete" draggable="false" aria-label="Remove from schedule">×</button>
        </div>
      `;
    }
    li.dataset.id = entry.id || `built-${Math.random().toString(36).slice(2, 8)}`;
    li.setAttribute("tabindex", "-1");
    if (entry.done) li.classList.add("is-done");
    list.appendChild(li);
  }
}

/* =========================================================
   3. Music player — demo clock + Lyria <audio> (loop session ≤ 30 min)
   --------------------------------------------------------- */
const LIVE_SESSION_MAX_SEC = 30 * 60;

function parseClockToSeconds(clock) {
  if (!clock || typeof clock !== "string") return null;
  const p = clock.trim().split(":");
  if (p.length !== 2) return null;
  const m = parseInt(p[0], 10);
  const s = parseInt(p[1], 10);
  if (Number.isNaN(m) || Number.isNaN(s)) return null;
  return m * 60 + s;
}

function initMusicPlayer(options = {}) {
  const { onTrackChange } = options;
  const notifyTrackChange = () => {
    try {
      onTrackChange?.();
    } catch {
      /* ignore */
    }
  };

  const playBtn = document.getElementById("play-toggle");
  const vinyl = document.querySelector(".vinyl");
  const timeEl = document.getElementById("now-time");
  const durationEl = document.getElementById("now-duration");
  const audio = document.getElementById("mlist-audio");
  if (!playBtn || !vinyl || !timeEl || !durationEl || !audio) return null;

  let demoPlaying = false;
  let demoElapsed = 162;
  let demoTotal = 43 * 60 + 40;
  let demoTimer = null;

  let liveSession = false;
  let sessionTimer = null;
  let sessionSec = 0;

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function stopDemoTimer() {
    if (demoTimer) {
      clearInterval(demoTimer);
      demoTimer = null;
    }
  }

  function startDemoTimer() {
    stopDemoTimer();
    demoTimer = setInterval(() => {
      if (!demoPlaying) return;
      demoElapsed = (demoElapsed + 1) % demoTotal;
      timeEl.textContent = fmt(demoElapsed);
    }, 1000);
  }

  function isLiveAudio() {
    return Boolean(audio.src && audio.src !== window.location.href);
  }

  function clearLiveSession() {
    liveSession = false;
    if (sessionTimer) {
      clearInterval(sessionTimer);
      sessionTimer = null;
    }
    sessionSec = 0;
    audio.loop = false;
  }

  function startLiveSession() {
    clearLiveSession();
    liveSession = true;
    audio.loop = true;
    durationEl.textContent = fmt(LIVE_SESSION_MAX_SEC);
    timeEl.textContent = "00:00";
    sessionTimer = setInterval(() => {
      if (!liveSession || !isLiveAudio()) return;
      if (!audio.paused) {
        sessionSec += 1;
        timeEl.textContent = fmt(sessionSec);
        if (sessionSec >= LIVE_SESSION_MAX_SEC) {
          audio.pause();
          clearLiveSession();
          syncVinyl();
        }
      }
    }, 1000);
  }

  function syncVinyl() {
    const playing = isLiveAudio() ? !audio.paused : demoPlaying;
    vinyl.style.setProperty("--vinyl-state", playing ? "running" : "paused");
    playBtn.setAttribute("aria-pressed", String(playing));
  }

  function renderDemo() {
    timeEl.textContent = fmt(demoElapsed);
    durationEl.textContent = fmt(demoTotal);
    syncVinyl();
  }

  function enterDemo(trackTitle, durationLabel) {
    clearLiveSession();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    demoPlaying = true;
    const parsed = parseClockToSeconds(durationLabel);
    if (parsed != null && parsed > 0) demoTotal = parsed;
    const trackEl = document.querySelector(".music__track");
    if (trackEl && trackTitle) trackEl.textContent = trackTitle;
    demoElapsed = 0;
    stopDemoTimer();
    startDemoTimer();
    renderDemo();
    notifyTrackChange();
  }

  audio.addEventListener("timeupdate", () => {
    if (!isLiveAudio() || liveSession) return;
    timeEl.textContent = fmt(Math.floor(audio.currentTime || 0));
  });
  audio.addEventListener("loadedmetadata", () => {
    if (liveSession) {
      durationEl.textContent = fmt(LIVE_SESSION_MAX_SEC);
      audio.loop = true;
    } else {
      durationEl.textContent = fmt(Math.floor(audio.duration || 0));
    }
  });
  audio.addEventListener("play", syncVinyl);
  audio.addEventListener("pause", syncVinyl);
  audio.addEventListener("ended", syncVinyl);

  function togglePlayback() {
    if (isLiveAudio()) {
      const willPlay = audio.paused;
      if (willPlay) {
        audio.play().catch(() => {});
        getAudio()?.resume?.();
      } else {
        audio.pause();
      }
      playClickSound(willPlay ? 660 : 440);
    } else {
      demoPlaying = !demoPlaying;
      playClickSound(demoPlaying ? 660 : 440);
      if (demoPlaying) startDemoTimer();
      else stopDemoTimer();
    }
    syncVinyl();
  }

  /** True when this list row is the same source/title as the “now playing” header. */
  function isListItemNowPlaying(trackTitle, listBlobUrl) {
    const trackEl = document.querySelector(".music__track");
    const title = (trackEl?.textContent || "").trim();
    const pageHref = window.location.href;
    const curSrc = audio.src && audio.src !== pageHref ? audio.src : "";
    const listSrc = listBlobUrl || "";
    if (curSrc && listSrc) return listSrc === curSrc;
    if (curSrc) return false;
    return !listSrc && trackTitle === title;
  }

  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlayback();
  });

  renderDemo();

  return {
    /** Load generated MP3: loop until 30 min session cap, return blob URL for “Recently played”. */
    playLyriaBlob(mp3Blob, title) {
      clearLiveSession();
      stopDemoTimer();
      demoPlaying = false;
      const url = URL.createObjectURL(mp3Blob);
      audio.src = url;
      audio.loop = true;
      applyMarqueeToTrack(document.querySelector(".music__track"), title);
      startLiveSession();
      audio.play().catch(() => {});
      getAudio()?.resume?.();
      syncVinyl();
      notifyTrackChange();
      return url;
    },
    /** Pick a previously generated track from the list. */
    playFromBlobUrl(url, title) {
      if (!url) return;
      clearLiveSession();
      stopDemoTimer();
      demoPlaying = false;
      audio.src = url;
      audio.loop = true;
      applyMarqueeToTrack(document.querySelector(".music__track"), title);
      startLiveSession();
      audio.play().catch(() => {});
      getAudio()?.resume?.();
      syncVinyl();
      notifyTrackChange();
    },
    enterDemo,
    togglePlayPause: togglePlayback,
    isListItemNowPlaying,
  };
}

/* =========================================================
   4. Web Audio API — small UI tick
   --------------------------------------------------------- */
let audioCtx = null;
function getAudio() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  return audioCtx;
}
function playClickSound(freq = 660, duration = 0.06) {
  const ctx = getAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
}

/* =========================================================
   5. Lyria 3 Pro (Gemini API) + recently played
   --------------------------------------------------------- */


/** User-visible explanation when generateContent returns 200 but no audio parts (filters, etc.). */
function describeLyriaNoAudioResponse(data) {
  const c0 = data?.candidates?.[0];
  const finishMsg = c0?.finishMessage ?? c0?.finish_message;
  if (finishMsg) {
    let t = String(finishMsg).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    return t.length > 720 ? `${t.slice(0, 717)}…` : t;
  }
  const pf = data?.promptFeedback;
  if (pf?.blockReason) {
    const br = pf.blockReason;
    return `Request blocked (${br}).`.trim();
  }
  const fr = c0?.finishReason ?? c0?.finish_reason;
  if (fr && fr !== "STOP" && fr !== "MAX_TOKENS") {
    return "Um.. weird, click on generate again";
  }
  return null;
}

function formatGenerateError(err) {
  if (err?.name === "AbortError") return "Generation stopped.";
  let msg = err?.message != null ? String(err.message) : String(err);
  let jsonPayload = msg.replace(/^\s*\d{3}\s*/, "").trim();
  if (!jsonPayload.startsWith("[")) {
    const i = msg.indexOf("[{");
    if (i >= 0) jsonPayload = msg.slice(i).trim();
  }
  try {
    const parsed = JSON.parse(jsonPayload);
    const block = Array.isArray(parsed) ? parsed[0] : parsed;
    const inner = block?.error?.message || block?.message;
    if (inner) msg = String(inner);
  } catch {
    const quoted = msg.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (quoted) {
      msg = quoted[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }
  if (/API_KEY_INVALID|API key not valid|invalid api key/i.test(msg)) {
    return "That Gemini key isn’t valid—open API keys, replace it, and Save.";
  }
  return msg.length > 320 ? msg.slice(0, 317) + "…" : msg;
}

function buildLyriaPrompt(userPrompt) {
  return (
    "Create an original productivity / focus music piece based on this brief. " +
    "Prefer clear rhythm and pleasant mix; keep vocals minimal unless the brief asks otherwise.\n\n" +
    userPrompt
  );
}

/** MP3 (or other audio) base64 from models.generateContent Lyria response. */
function extractAudioFromGenerateContent(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  let fallback = null;
  for (const p of parts) {
    const inline = p?.inlineData || p?.inline_data;
    if (!inline?.data || String(inline.data).length < 64) continue;
    const mime = (inline.mimeType || inline.mime_type || "").toLowerCase();
    if (mime.includes("audio") || mime.includes("mpeg") || mime.includes("mp3")) {
      return inline.data;
    }
    if (!mime.startsWith("text/") && String(inline.data).length > 2000) {
      fallback = inline.data;
    }
  }
  return fallback;
}

function base64ToMp3Blob(b64) {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Blob([bin], { type: "audio/mpeg" });
}

function extractAudioFromInteraction(interaction) {
  const outs = interaction?.outputs;
  if (!Array.isArray(outs)) return null;
  let fallback = null;
  for (const output of outs) {
    const inlineTop = output?.inlineData || output?.inline_data;
    if (inlineTop?.data) {
      const mime = (inlineTop.mimeType || inlineTop.mime_type || "").toLowerCase();
      if (mime.includes("audio") || mime.includes("mpeg") || mime.includes("mp3")) {
        return inlineTop.data;
      }
      if (!mime.startsWith("text/") && String(inlineTop.data).length > 2000) {
        fallback = inlineTop.data;
      }
    }
    const parts = output?.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      const inline = p?.inlineData || p?.inline_data;
      if (!inline?.data || String(inline.data).length < 64) continue;
      const mime = (inline.mimeType || inline.mime_type || "").toLowerCase();
      if (mime.includes("audio") || mime.includes("mpeg") || mime.includes("mp3")) {
        return inline.data;
      }
      if (!mime.startsWith("text/") && String(inline.data).length > 2000) {
        fallback = inline.data;
      }
    }
  }
  return fallback;
}

async function requestLyriaPro(userPrompt, options = {}) {
  const { signal } = options;
  const MAX_ATTEMPTS = 3;
  let lastError = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw Object.assign(new Error("AbortError"), { name: "AbortError" });
    const res = await fetch("/api/generate-music", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrompt }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) return base64ToMp3Blob(data.audioBase64);
    const msg = data.error || `Server error ${res.status}`;
    // Retry on "no audio" responses; surface other errors immediately
    if (/no audio|didn't return audio|rephrasing/i.test(msg)) {
      lastError = msg;
      continue;
    }
    throw new Error(formatGenerateError({ message: msg }));
  }
  throw new Error("Um.. weird, click on generate again");
}

const GENERATE_SUBMIT_ICON = "./assets/icons/Generate.svg";
const GENERATE_SUBMIT_ICON_DISABLED = "./assets/icons/Generate-disabled.svg";

const PLAY_SVG = `<svg class="recent__play-icon recent__play-icon--play" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;
const STOP_SVG = `<svg class="recent__play-icon recent__play-icon--stop" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;

function recentItemHTML(title, duration) {
  return `
    <span class="recent__art" aria-hidden="true">
      <img src="./assets/icons/ai-spark-generate-music.svg" alt="" />
    </span>
    <span class="recent__meta">
      <span class="recent__name" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
      <span class="recent__duration">${duration}</span>
    </span>
    <button type="button" class="recent__play-btn" aria-label="Play or stop ${escapeHtml(title)}" draggable="false">
      ${PLAY_SVG}${STOP_SVG}
    </button>
  `;
}

function initGenerate(playback, syncRecentListWithNowPlaying) {
  const form = document.getElementById("generate-form");
  const wrap = document.querySelector(".music__generate");
  const input = document.getElementById("generate-input");
  const sendBtn = document.getElementById("generate-submit");
  const sendIcon = document.getElementById("generate-submit-icon");
  const list = document.getElementById("recent-list");
  const statusEl = document.getElementById("generate-status");
  const cancelBtn = document.getElementById("generate-cancel");
  const playToggle = document.getElementById("play-toggle-card");
  const trackLoadingEl = document.getElementById("now-playing-loading");
  if (!form || !input || !list) return;

  // Holds the track that is currently playing but not yet in the recent list
  let pendingRecentTrack = null;

  function hideEmptyState() {
    const empty = document.getElementById("recent-empty");
    if (empty) empty.hidden = true;
  }

  function flushPendingToRecent() {
    if (!pendingRecentTrack) return;
    const { title, audioUrl, duration } = pendingRecentTrack;
    pendingRecentTrack = null;
    hideEmptyState();
    const li = document.createElement("li");
    li.className = "recent__item";
    li.dataset.track = title;
    if (audioUrl) li.dataset.audioSrc = audioUrl;
    li.dataset.duration = duration;
    li.innerHTML = recentItemHTML(title, duration);
    list.prepend(li);
    applyMarqueeToItem(li);
    microFlashNewRecent(li);
  }

  function resetGenerateStatusPresentation() {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.classList.remove("is-error");
    statusEl.setAttribute("role", "status");
    statusEl.setAttribute("aria-live", "polite");
  }

  function showGenerateError(message) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.add("is-error");
    statusEl.setAttribute("role", "alert");
    statusEl.setAttribute("aria-live", "assertive");
  }

  let activeGenerateAbort = null;

  let iconSpinTween = null;
  let progressTween = null;
  const progressBar = document.getElementById("generate-progress-bar");
  const progressPct = document.getElementById("generate-progress-pct");

  function setProgress(pct) {
    if (progressBar) progressBar.style.width = pct + "%";
    if (progressPct) progressPct.textContent = Math.round(pct) + "%";
  }

  function setTrackGenerating(on) {
    playToggle?.classList.toggle("is-generating", on);
    playToggle?.setAttribute("aria-busy", String(on));
    if (trackLoadingEl) trackLoadingEl.hidden = !on;

    if (on) {
      // Reset progress
      setProgress(0);

      // Spin the send icon
      if (sendIcon && window.gsap) {
        iconSpinTween = gsap.to(sendIcon, {
          rotation: "+=360",
          duration: 1,
          ease: "none",
          repeat: -1,
        });
      }

      // Animate progress realistically: fast to ~30%, slow crawl to ~85%
      if (window.gsap) {
        const proxy = { val: 0 };
        progressTween = gsap.to(proxy, {
          val: 85,
          duration: 28,
          ease: "power1.inOut",
          onUpdate() { setProgress(proxy.val); },
        });
      }
    } else {
      // Stop spin
      if (iconSpinTween) {
        iconSpinTween.kill();
        iconSpinTween = null;
        gsap.set(sendIcon, { rotation: 0 });
      }

      // Complete progress to 100% then reset
      if (progressTween) { progressTween.kill(); progressTween = null; }
      if (window.gsap) {
        const proxy = { val: parseFloat(progressBar?.style.width || "85") };
        gsap.to(proxy, {
          val: 100,
          duration: 0.4,
          ease: "power2.out",
          onUpdate() { setProgress(proxy.val); },
          onComplete() {
            setTimeout(() => setProgress(0), 600);
          },
        });
      }
    }
  }

  let generateSendWasReady = false;

  function syncGenerateSubmit() {
    const has = input.value.trim().length > 0;
    form.classList.toggle("music__prompt--filled", has);
    if (sendBtn) {
      sendBtn.disabled = !has;
      sendBtn.setAttribute("aria-disabled", String(!has));
      if (sendIcon) {
        sendIcon.src = has ? GENERATE_SUBMIT_ICON : GENERATE_SUBMIT_ICON_DISABLED;
      }
      if (has && !generateSendWasReady) microGenerateSendReady(sendBtn);
      generateSendWasReady = has;
    }
  }
  input.addEventListener("input", syncGenerateSubmit);
  input.addEventListener("change", syncGenerateSubmit);
  syncGenerateSubmit();

  // --- Tab-to-accept suggestion ---
  const suggestionEl = document.getElementById("generate-suggestion");
  const SUGGESTION = "Soft ambient piano with gentle rain and warm pads";

  function updateSuggestion() {
    if (!suggestionEl) return;
    const val = input.value;
    if (val.length === 0) {
      suggestionEl.innerHTML =
        `<span style="color:rgba(60,68,89,0.28)">${SUGGESTION}</span>` +
        `<span class="music__suggestion-tab">Tab</span>`;
    } else if (SUGGESTION.startsWith(val) && val.length < SUGGESTION.length) {
      // Inline ghost: typed portion invisible + remaining ghost, no badge
      const ghost = SUGGESTION.slice(val.length);
      suggestionEl.innerHTML =
        `<span style="color:transparent">${escapeHtml(val)}</span>` +
        `<span style="color:rgba(60,68,89,0.28)">${escapeHtml(ghost)}</span>`;
    } else {
      suggestionEl.innerHTML = "";
    }
  }

  input.addEventListener("input", updateSuggestion);
  input.addEventListener("focus", updateSuggestion);
  input.addEventListener("blur", () => { if (suggestionEl) suggestionEl.innerHTML = ""; });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && suggestionEl?.innerHTML) {
      e.preventDefault();
      input.value = SUGGESTION;
      suggestionEl.innerHTML = "";
      updateSuggestion();
      syncGenerateSubmit();
      playClickSound(660);
    }
  });

  updateSuggestion();

  sendBtn?.addEventListener("pointerdown", () => {
    if (!sendBtn.disabled) microElasticPress(sendBtn);
  });

  cancelBtn?.addEventListener("click", () => {
    activeGenerateAbort?.abort();
    microElasticPress(cancelBtn);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (wrap?.classList.contains("is-loading")) return;
    const value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }
    // Immediately move the currently playing track to recently played
    flushPendingToRecent();

    resetGenerateStatusPresentation();
    wrap?.classList.add("is-loading");
    setTrackGenerating(true);
    if (cancelBtn) cancelBtn.hidden = false;
    activeGenerateAbort = new AbortController();
    const signal = activeGenerateAbort.signal;

    try {
      let promptForLyria = value;
      let titleSeed = value;

      try {
        const expanded = await expandMusicPromptViaApi(value, signal);
        if (expanded?.lyria_prompt) promptForLyria = expanded.lyria_prompt;
        if (expanded?.title?.trim()) titleSeed = expanded.title.trim();
      } catch (aerr) {
        if (aerr?.name === "AbortError") throw aerr;
      }

      const blob = await requestLyriaPro(promptForLyria, { signal });
      const title = toTitleCase(String(titleSeed).slice(0, 80));

      const audioUrl = playback?.playLyriaBlob(blob, title);
      const minutes = Math.floor((blob.size / (128 * 1024)) * 0.5) || 2;
      const duration = `${minutes}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;

      // Store as pending — it will appear in recently played when the next track is generated
      pendingRecentTrack = { title, audioUrl, duration };

      list.querySelectorAll(".recent__item.is-active").forEach((x) => x.classList.remove("is-active"));
      syncRecentListWithNowPlaying?.();

      input.value = "";
      syncGenerateSubmit();
      resetGenerateStatusPresentation();
      playClickSound(880);
    } catch (err) {
      if (statusEl) {
        if (err?.name === "AbortError") {
          resetGenerateStatusPresentation();
        } else {
          const msg = formatGenerateError(err);
          showGenerateError(msg);
        }
      }
      playClickSound(err?.name === "AbortError" ? 380 : 220);
    } finally {
      wrap?.classList.remove("is-loading");
      setTrackGenerating(false);
      if (cancelBtn) cancelBtn.hidden = true;
      activeGenerateAbort = null;
    }
  });

  // Keep recent item icons in sync with actual audio play/pause state
  const audioEl = document.getElementById("mlist-audio");
  function syncRecentPlayIcons() {
    // readyState 0 means src just changed but not loaded yet — treat as playing intent
    const paused = audioEl ? (audioEl.paused && audioEl.readyState > 0) : true;
    list.querySelectorAll(".recent__item.is-active").forEach((li) => {
      li.classList.toggle("is-paused", paused);
    });
  }
  audioEl?.addEventListener("play", syncRecentPlayIcons);
  audioEl?.addEventListener("playing", syncRecentPlayIcons);
  audioEl?.addEventListener("pause", syncRecentPlayIcons);
  audioEl?.addEventListener("ended", syncRecentPlayIcons);

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".recent__play-btn");
    const item = e.target.closest(".recent__item");
    if (!item || item.hidden) return;
    const src = item.dataset.audioSrc || "";
    const track = item.dataset.track || "";
    if (btn) {
      // Play button clicked — toggle if already playing this track
      if (playback?.isListItemNowPlaying?.(track, src)) {
        playback.togglePlayPause();
      } else {
        // Move the current now-playing track to recent before switching
        flushPendingToRecent();
        list.querySelectorAll(".recent__item.is-active").forEach((x) => { x.classList.remove("is-active"); x.classList.remove("is-paused"); });
        item.classList.add("is-active");
        item.classList.remove("is-paused");
        if (src && playback?.playFromBlobUrl) playback.playFromBlobUrl(src, track);
        else if (playback?.enterDemo) playback.enterDemo(track, item.dataset.duration || "");
        playClickSound(660);
      }
      return;
    }
    // Click anywhere on card
    microElasticPress(item);
    if (playback?.isListItemNowPlaying?.(track, src)) {
      playback.togglePlayPause();
      return;
    }
    // Move the current now-playing track to recent before switching
    flushPendingToRecent();
    list.querySelectorAll(".recent__item.is-active").forEach((x) => { x.classList.remove("is-active"); x.classList.remove("is-paused"); });
    item.classList.add("is-active");
    item.classList.remove("is-paused");
    if (src && playback?.playFromBlobUrl) {
      playback.playFromBlobUrl(src, track);
    } else if (playback?.enterDemo) {
      playback.enterDemo(track, item.dataset.duration || "");
    }
    playClickSound(660);
  });
}

function toTitleCase(str) {
  return str
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================================================
   6. GSAP microinteractions
   --------------------------------------------------------- */
let gsapMod = null;
/** GSAP from <script src="./GSAP/gsap-public/minified/gsap.min.js"> → `window.gsap`. */
function loadGsap() {
  if (gsapMod) return Promise.resolve(gsapMod);
  const g = typeof window !== "undefined" ? window.gsap : null;
  if (g) {
    gsapMod = { gsap: g };
    return Promise.resolve(gsapMod);
  }
  return Promise.reject(
    new Error("GSAP not loaded: check ./GSAP/gsap-public/minified/gsap.min.js and script order in index.html"),
  );
}

function motionOk() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Generate panel: send button springs in when it first becomes enabled. */
function microGenerateSendReady(btn) {
  if (!btn || !motionOk()) return;
  loadGsap()
    .then(({ gsap }) => {
      gsap.fromTo(
        btn,
        { scale: 0.82, opacity: 0.72 },
        { scale: 1, opacity: 1, duration: 0.48, ease: "back.out(1.65)" },
      );
    })
    .catch(() => {});
}

/** Short squish for tappable cards / keys. */
function microElasticPress(el) {
  if (!el || !motionOk()) return;
  loadGsap()
    .then(({ gsap }) => {
      gsap.fromTo(
        el,
        { scale: 1 },
        { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out" },
      );
    })
    .catch(() => {});
}

function applyMarqueeToTrack(trackEl, title) {
  if (!trackEl) return;
  // Reset first
  trackEl.classList.remove("is-scrolling");
  trackEl.textContent = title;
  requestAnimationFrame(() => {
    if (trackEl.scrollWidth > trackEl.clientWidth) {
      trackEl.classList.add("is-scrolling");
      // Double the text with two spaces gap so it doesn't stick when looping
      const safe = escapeHtml(title);
      const gap = `<span style="display:inline-block;width:2.5em"></span>`;
      trackEl.innerHTML = `<span class="music__track-inner">${safe}${gap}${safe}${gap}</span>`;
    }
  });
}

function applyMarqueeToItem(li) {
  const nameEl = li.querySelector(".recent__name");
  if (!nameEl) return;
  if (nameEl.classList.contains("is-scrolling")) return;
  requestAnimationFrame(() => {
    if (nameEl.scrollWidth > nameEl.clientWidth) {
      const text = nameEl.dataset.fullTitle || nameEl.textContent;
      nameEl.dataset.fullTitle = text;
      nameEl.classList.add("is-scrolling");
      nameEl.innerHTML =
        `<span class="recent__name-inner">${escapeHtml(text)}<span style="display:inline-block;width:2.5em"></span>${escapeHtml(text)}<span style="display:inline-block;width:2.5em"></span></span>`;
    }
  });
}

function resetMarqueeOnItem(li) {
  const nameEl = li.querySelector(".recent__name");
  if (!nameEl || !nameEl.classList.contains("is-scrolling")) return;
  const text = nameEl.dataset.fullTitle || li.dataset.track || "";
  nameEl.classList.remove("is-scrolling");
  nameEl.innerHTML = escapeHtml(text);
  nameEl.title = text;
}

function microFlashNewRecent(li) {
  loadGsap()
    .then(({ gsap }) => {
      gsap.from(li, {
        opacity: 0,
        y: 12,
        scale: 0.93,
        duration: 0.45,
        ease: "back.out(1.25)",
      });
    })
    .catch(() => {});
}

async function initMicroAnimations() {
  try {
    const { gsap } = await loadGsap();
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.4)" } });

    // --- Immediately hide all inner content so shells land bare ---
    const innerEls = [
      ".brand",
      ".music__generate-head",
      ".music__prompt",
      // now-playing shell stays visible; only its contents animate in
      ".music__art",
      ".music__meta",
      ".music__play-btn",
      ".recent__title",
      "#recent-list",
      ".board__headline",
      ".board__scene",
      ".schedule__head",
      ".schedule__list",
    ];
    gsap.set(innerEls, { opacity: 0, y: 18 });

    // Also hide the canvas ring/border and the schedule glass panel by starting them invisible
    gsap.set(".canvas", { opacity: 0, y: 20, scale: 0.97 });
    gsap.set(".sidebar", { opacity: 0, x: -32 });

    // --- Phase 1 (0–0.55s): shells land ---
    tl.to(".sidebar", { opacity: 1, x: 0, duration: 0.52, ease: "back.out(1.7)" }, 0.05)
      // Canvas (board + schedule border together) bounces in as one unit
      .to(".canvas",  { opacity: 1, y: 0, scale: 1, duration: 0.56, ease: "back.out(1.5)" }, 0.12);

    // --- Phase 2 (0.5–1.0s): sidebar content flows in ---
    tl.to(".brand",                { opacity: 1, y: 0, duration: 0.40, ease: "back.out(1.5)" }, 0.52)
      .to(".music__generate-head", { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, 0.64)
      .to(".music__prompt",        { opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }, 0.73)
      // now-playing inner content staggers in like recent track items
      .to([".music__art", ".music__meta", ".music__play-btn"], {
          opacity: 1, y: 0, duration: 0.32, stagger: 0.08, ease: "back.out(1.5)",
        }, 0.80)
      .to(".recent__title",        { opacity: 1, y: 0, duration: 0.30 }, 0.94)
      .to("#recent-list",          { opacity: 1, y: 0, duration: 0.30 }, 1.02);

    // --- Phase 3 (0.62–0.88s): board elements ---
    tl.to(".board__headline", { opacity: 1, y: 0, duration: 0.44, ease: "back.out(1.9)" }, 0.62)
      .to(".board__scene",    { opacity: 1, y: 0, duration: 0.46, ease: "back.out(1.5)" }, 0.80);

    // --- Phase 4 (0.70–1.1s): schedule content ---
    tl.to(".schedule__head", { opacity: 1, y: 0, duration: 0.34, ease: "back.out(1.4)" }, 0.70);
    const schedItems = document.querySelectorAll(".schedule__item");
    if (schedItems.length) {
      gsap.set(schedItems, { opacity: 0, y: 14 });
      tl.to(schedItems, {
        opacity: 1, y: 0, duration: 0.33, stagger: 0.09, ease: "back.out(1.5)",
      }, 0.84);
    }
    tl.to(".schedule__list", { opacity: 1, y: 0, duration: 0.01 }, 0.82);

  } catch {
    // GSAP unavailable — reveal everything instantly
    [".sidebar", ".canvas", ".brand", ".music__generate-head", ".music__prompt",
     ".music__art", ".music__meta", ".music__play-btn",
     ".recent__title", "#recent-list", ".board__headline",
     ".board__scene", ".schedule__head", ".schedule__list"].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.opacity = "";
        el.style.transform = "";
      });
    });
  }
}

/* =========================================================
   Boot
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const stickyStack = document.querySelector(".sticky-stack");
  if (stickyStack) applyStickyStackLayout(stickyStack);
  initStickyComposer();
  if (stickyStack) initStickyDrag(stickyStack);
  if (stickyStack) initStickyHint(stickyStack);
  const boardEl = document.querySelector(".board");
  if (boardEl) initBoardDots(boardEl);
  initScheduleReorder();

  function syncRecentListWithNowPlaying() {
    const recentList = document.getElementById("recent-list");
    if (!recentList) return;
    const audio = document.getElementById("mlist-audio");
    const trackEl = document.querySelector(".music__track");
    const pageHref = window.location.href;
    const src = audio?.src && audio.src !== pageHref ? audio.src : "";
    const title = (trackEl?.textContent || "").trim();
    const live = Boolean(src);
    for (const li of recentList.querySelectorAll(".recent__item")) {
      const itemSrc = li.dataset.audioSrc || "";
      const itemTrack = li.dataset.track || "";
      const isCurrent = live ? itemSrc === src : itemTrack === title && !itemSrc;
      li.hidden = isCurrent;
      if (isCurrent) {
        li.classList.remove("is-active");
        resetMarqueeOnItem(li);
      } else if (li.classList.contains("is-active")) {
        applyMarqueeToItem(li);
      } else {
        resetMarqueeOnItem(li);
      }
    }
  }

  const playback = initMusicPlayer({ onTrackChange: syncRecentListWithNowPlaying });
  initGenerate(playback, syncRecentListWithNowPlaying);
  syncRecentListWithNowPlaying();
  initMicroAnimations();

  // SH*T badge fidget spin on click
  const shitBadge = document.querySelector(".badge-shit");
  if (shitBadge && window.gsap) {
    let spinning = false;
    shitBadge.style.cursor = "pointer";
    shitBadge.style.willChange = "transform";
    gsap.set(shitBadge, { force3D: true });
    shitBadge.addEventListener("click", () => {
      if (spinning) return;
      spinning = true;
      gsap.to(shitBadge, {
        rotationZ: "+=720",
        duration: 0.7,
        ease: "power3.out",
        force3D: true,
        onComplete: () => { spinning = false; },
      });
    });
  }
  // Headline word cycler — split-text mask reveal with per-character stagger
  const headlineWord = document.getElementById("headline-word");
  if (headlineWord && window.gsap) {
    const synonyms = [
      "plain", "clean", "quick", "smart", "sleek",
      "clear", "light", "brisk", "swift", "crisp",
    ];
    let idx = 0;
    let animating = false;

    function buildChars(word) {
      return word.split("").map(ch => {
        const wrap = document.createElement("span");
        wrap.style.cssText = "display:inline-block;overflow:hidden;vertical-align:bottom;line-height:1.15em;";
        const inner = document.createElement("span");
        inner.style.cssText = "display:inline-block;";
        inner.textContent = ch;
        wrap.appendChild(inner);
        return { wrap, inner };
      });
    }

    function revealWord(word, container) {
      container.innerHTML = "";
      const chars = buildChars(word);
      chars.forEach(({ wrap }) => container.appendChild(wrap));
      const inners = chars.map(c => c.inner);
      gsap.fromTo(inners,
        { y: "110%" },
        {
          y: "0%",
          duration: 0.45,
          ease: "power3.out",
          stagger: { each: 0.04, from: "start" },
          onComplete: () => { animating = false; },
        }
      );
    }

    function exitWord(container, onDone) {
      const inners = [...container.querySelectorAll("span > span")];
      if (!inners.length) { onDone(); return; }
      gsap.to(inners, {
        y: "-110%",
        duration: 0.3,
        ease: "power2.in",
        stagger: { each: 0.03, from: "end" },
        onComplete: onDone,
      });
    }

    // Render initial word
    revealWord(synonyms[0], headlineWord);

    setInterval(() => {
      if (animating) return;
      animating = true;
      idx = (idx + 1) % synonyms.length;
      exitWord(headlineWord, () => revealWord(synonyms[idx], headlineWord));
    }, 2500);
  }

  const nowTrackEl = document.querySelector(".music__track");
  if (nowTrackEl) applyMarqueeToTrack(nowTrackEl, nowTrackEl.textContent.trim());
});

/* =========================================================
   Theme toggle — warm (default) ↔ blue
   ========================================================= */
(function () {
  const btn = document.getElementById("themeToggle");
  const logo = document.querySelector(".brand__logo img");
  const pageBg = document.querySelector(".page-bg");

  const WARM_LOGO = "./assets/icons/mList.png";
  const BLUE_LOGO = "./assets/icons/mList-logo.svg";

  // Build the blue overlay layer (clones blob structure, applies blue gradients via CSS)
  const blueLayer = document.createElement("div");
  blueLayer.className = "page-bg__blue-layer";
  blueLayer.innerHTML = `
    <div class="page-bg__blob-1" style="position:absolute;width:900px;height:900px;top:-200px;left:-150px;border-radius:50%;animation:blob-drift-1 18s ease-in-out infinite;opacity:0.85"></div>
    <div class="page-bg__blob-2" style="position:absolute;width:800px;height:800px;top:-100px;right:-200px;border-radius:50%;animation:blob-drift-2 22s ease-in-out infinite;opacity:0.75"></div>
    <div class="page-bg__blob-3" style="position:absolute;width:1000px;height:700px;bottom:-180px;left:50%;transform:translateX(-50%);border-radius:50%;animation:blob-drift-3 26s ease-in-out infinite;opacity:0.7"></div>
    <div class="page-bg__blob-4" style="position:absolute;width:700px;height:700px;bottom:-100px;left:-100px;border-radius:50%;animation:blob-drift-1 30s ease-in-out infinite reverse;opacity:0.65"></div>
  `;
  gsap.set(blueLayer, { opacity: 0 });
  pageBg?.appendChild(blueLayer);

  function applyTheme(isBlue, animate) {
    document.documentElement.classList.remove("theme-blue-pre");
    document.body.classList.toggle("theme-blue", isBlue);
    if (logo) logo.src = isBlue ? BLUE_LOGO : WARM_LOGO;
    localStorage.setItem("mlist-theme", isBlue ? "blue" : "warm");
    if (animate) {
      gsap.to(blueLayer, { opacity: isBlue ? 1 : 0, duration: 0.7, ease: "power2.inOut" });
    } else {
      gsap.set(blueLayer, { opacity: isBlue ? 1 : 0 });
    }
  }

  const saved = localStorage.getItem("mlist-theme");
  applyTheme(saved === "blue", false);

  btn.addEventListener("click", () => {
    applyTheme(!document.body.classList.contains("theme-blue"), true);
  });
})();
