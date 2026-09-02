(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $  = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  /* ---------- Contact info (single source of truth: lib/manifest.js) ---------- */

  function mountContactMeta() {
    $$("[data-phone]").forEach(function (el) { el.href = "tel:" + data.contact.phoneIntl; });
    $$("[data-whatsapp]").forEach(function (el) { el.href = data.contact.whatsapp; });
    $$("[data-instagram-link]").forEach(function (el) { el.href = data.contact.instagram; });
    var year = $("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------- Contact click tracking (GA4, if present) ---------- */

  function initContactTracking() {
    if (typeof window.gtag !== "function") return;
    function track(selector, method) {
      $$(selector).forEach(function (el) {
        el.addEventListener("click", function () {
          window.gtag("event", "contact_click", { method: method });
        });
      });
    }
    track("[data-whatsapp]", "whatsapp");
    track("[data-phone]", "phone");
    track("[data-instagram-link]", "instagram");
  }

  /* ---------- Nav (scroll state + mobile menu) ---------- */

  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var onScroll = function () {
      if (scrollY > 40) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var burger = $("[data-burger]");
    var mobile = $("[data-mobile-nav]");
    var closeBtn = $("[data-mobile-close]");
    if (!burger || !mobile) return;
    var open = function () { mobile.dataset.open = "true"; document.body.style.overflow = "hidden"; };
    var close = function () { mobile.dataset.open = "false"; document.body.style.overflow = ""; };
    burger.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    $$("a", mobile).forEach(function (a) { a.addEventListener("click", close); });
  }

  /* ---------- Smooth anchors (native scroll, no Lenis) ---------- */

  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var top = el.getBoundingClientRect().top + scrollY - 76;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */

  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* ---------- Marquee auto-scroll ---------- */

  function initMarqueeScroll() {
    var track = $("[data-breed-marquee]");
    if (!track) return;
    var clone = track.cloneNode(true);
    clone.removeAttribute("data-breed-marquee");
    clone.setAttribute("aria-hidden", "true");
    track.parentNode.appendChild(clone);

    var pos = 0;
    var speed = 34; // px/sec
    var last = null;
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var effSpeed = reduced ? speed * 0.5 : speed;

    function frame(t) {
      if (last == null) last = t;
      var dt = (t - last) / 1000;
      last = t;
      var distance = track.scrollWidth + 48;
      pos -= effSpeed * dt;
      if (Math.abs(pos) >= distance) pos = 0;
      track.style.transform = "translateX(" + pos + "px)";
      clone.style.transform = "translateX(" + pos + "px)";
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Custom cursor ---------- */

  function initCursor() {
    var root = $("[data-cursor-root]");
    if (!root || !fineHover) return;
    document.documentElement.classList.add("has-cursor");
    var ring = $(".cursor-ring", root);
    var dot = $(".cursor-dot", root);
    var tx = 0, ty = 0, rx = 0, ry = 0, firstMove = false;

    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      if (!firstMove) {
        firstMove = true;
        rx = tx; ry = ty;
        if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        root.classList.add("is-ready");
      }
    }, { passive: true });

    function tick() {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    var HOVERABLES = "a, button, .card, [data-cursor]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(HOVERABLES)) root.classList.add("is-interactive");
    });
    document.addEventListener("mouseout", function (e) {
      var t = e.target.closest && e.target.closest(HOVERABLES);
      if (t && (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(HOVERABLES))) {
        root.classList.remove("is-interactive");
      }
    });
  }

  /* ---------- Tilt on cards ---------- */

  function initTilt() {
    if (!fineHover) return;
    $$(".card, .hero-figure").forEach(function (card) {
      var MAX = 6;
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.classList.add("has-tilt");
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------- Magnetic primary CTA ---------- */

  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(function (el) {
      var strength = 0.25;
      var inner = document.createElement("span");
      inner.className = "magnetic-inner";
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add("has-magnetic");
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) - r.width / 2) * strength;
        ty = ((e.clientY - r.top) - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
        inner.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------- Boot ---------- */

  function boot() {
    safe(mountContactMeta, "mountContactMeta");

    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initMarqueeScroll, "initMarqueeScroll");
    safe(initCursor, "initCursor");
    safe(initTilt, "initTilt");
    safe(initMagnetic, "initMagnetic");
    safe(initContactTracking, "initContactTracking");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
