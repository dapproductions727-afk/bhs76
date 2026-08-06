/* ============================================================
   BRIARCLIFF '76 — shared behaviour for every page.
   Each block checks for its own elements first, so this same
   file can load on all five pages without erroring.
   ============================================================ */
(function () {
  "use strict";

  function byId(id) { return document.getElementById(id); }

  /* ==========================================================
     PHOTO GALLERY — loads straight from a Google Drive folder.
     ==========================================================
     Your dad (or anyone with edit access to the folder) just
     drags photos in. They appear here on the next page load.

     The file NAME becomes the caption, so name them well:
     "Homecoming 1975.jpg" shows as "Homecoming 1975".

     SETUP NOTES (already done, kept for reference):
     1. Drive folder shared: Anyone with the link > Viewer.
     2. folderId is the last part of the folder's URL.
     3. apiKey from console.cloud.google.com with the Google
        Drive API enabled. Restrict it to the Drive API, and
        to your domain once the site is live.

     Blank either value and the placeholder tiles stay put.
     ========================================================== */
  var DRIVE = {
    folderId: "1Cj7T0t4oY_hshdQFxh9gOIrP-xIxFOW3",
    apiKey: "AIzaSyB_h1LuFwUWj6eBT0eGWnMrbtiVS55_T7o"
  };

  /* ---- Lightbox (photos page only) ---- */

  var lightbox = byId("lightbox");
  var lightboxImg = byId("lightbox-img");
  var lightboxCap = byId("lightbox-cap");
  var lightboxCount = byId("lightbox-count");
  var lightboxClose = byId("lightbox-close");
  var lightboxPrev = byId("lightbox-prev");
  var lightboxNext = byId("lightbox-next");
  var lastFocused = null;

  /* The full ordered list, so the arrows can walk through it. */
  var photos = [];
  var current = 0;

  function thumb(id, width) {
    return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w" + width;
  }

  function caption(name) {
    return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  }

  function showPhoto(i) {
    if (!photos.length) { return; }
    /* Wrap around, so you can keep clicking in one direction. */
    current = (i + photos.length) % photos.length;
    var file = photos[current];
    var label = caption(file.name);

    lightboxImg.src = thumb(file.id, 1600);
    lightboxImg.alt = label;
    lightboxCap.textContent = label;
    lightboxCount.textContent = (current + 1) + " of " + photos.length;

    /* Warm the neighbours so the next click feels instant. */
    [current + 1, current - 1].forEach(function (n) {
      var neighbour = photos[(n + photos.length) % photos.length];
      if (neighbour) { new Image().src = thumb(neighbour.id, 1600); }
    });
  }

  function openLightbox(index) {
    if (!lightbox) { return; }
    lastFocused = document.activeElement;
    showPhoto(index);
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    lightboxNext.focus();
  }

  function closeLightbox() {
    if (!lightbox) { return; }
    lightbox.classList.remove("is-open");
    lightboxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocused) { lastFocused.focus(); }
  }

  if (lightbox) {
    lightboxClose.addEventListener("click", closeLightbox);
    lightboxPrev.addEventListener("click", function () { showPhoto(current - 1); });
    lightboxNext.addEventListener("click", function () { showPhoto(current + 1); });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) { closeLightbox(); }
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) { return; }
      if (e.key === "Escape") { closeLightbox(); }
      if (e.key === "ArrowRight") { showPhoto(current + 1); }
      if (e.key === "ArrowLeft") { showPhoto(current - 1); }
    });
  }

  /* ---- Gallery (photos page only) ---- */

  var gallery = byId("gallery");
  var galleryStatus = byId("gallery-status");

  function say(msg) {
    if (!galleryStatus) { return; }
    if (!msg) { galleryStatus.hidden = true; return; }
    galleryStatus.textContent = msg;
    galleryStatus.hidden = false;
  }

  function renderPhotos(files) {
    photos = files;
    gallery.textContent = "";
    files.forEach(function (file, index) {
      var label = caption(file.name);

      var fig = document.createElement("figure");
      fig.className = "plate";

      var btn = document.createElement("button");
      btn.className = "plate-btn";
      btn.type = "button";
      btn.setAttribute("aria-label", "Enlarge photo: " + label);

      var frame = document.createElement("div");
      frame.className = "plate-frame";

      var img = document.createElement("img");
      img.src = thumb(file.id, 800);
      img.alt = label;
      img.loading = "lazy";

      frame.appendChild(img);
      btn.appendChild(frame);

      var cap = document.createElement("figcaption");
      cap.textContent = label;

      fig.appendChild(btn);
      fig.appendChild(cap);
      gallery.appendChild(fig);

      btn.addEventListener("click", function () {
        openLightbox(index);
      });
    });
  }

  /* One fetch, shared by the full gallery and the home page strip.
     Newest first, since orderBy is createdTime descending. */
  function fetchDrivePhotos(onOk, onFail) {
    if (!DRIVE.folderId || !DRIVE.apiKey) { return; }

    var query = "'" + DRIVE.folderId + "' in parents and mimeType contains 'image/' and trashed = false";
    var url = "https://www.googleapis.com/drive/v3/files"
      + "?q=" + encodeURIComponent(query)
      + "&key=" + encodeURIComponent(DRIVE.apiKey)
      + "&fields=" + encodeURIComponent("files(id,name)")
      + "&orderBy=" + encodeURIComponent("createdTime desc")
      + "&pageSize=100";

    fetch(url)
      .then(function (res) {
        if (!res.ok) { throw new Error("Drive returned " + res.status); }
        return res.json();
      })
      .then(function (data) { onOk((data && data.files) || []); })
      .catch(function () { if (onFail) { onFail(); } });
  }

  if (gallery) {
    say("Loading photos…");
    fetchDrivePhotos(
      function (files) {
        if (!files.length) { say("No photos in the shared folder yet."); return; }
        renderPhotos(files);
        say("");
      },
      function () {
        /* Leave the placeholder tiles in place rather than an empty grid. */
        say("Photos couldn't be loaded right now. Please try again later.");
      }
    );
  }

  /* ---- Home page strip: the six most recent photos ---- */

  var stripSection = byId("photo-strip-section");
  var strip = byId("photo-strip");

  if (strip && stripSection) {
    fetchDrivePhotos(function (files) {
      if (!files.length) { return; }          /* stay hidden rather than show an empty rail */
      files.slice(0, 6).forEach(function (file) {
        var a = document.createElement("a");
        a.className = "strip-tile";
        a.href = "photos.html";

        var frame = document.createElement("div");
        frame.className = "plate-frame";

        var img = document.createElement("img");
        img.src = thumb(file.id, 500);
        img.alt = "";                          /* decorative here; the link text carries meaning */
        img.loading = "lazy";

        frame.appendChild(img);
        a.appendChild(frame);
        strip.appendChild(a);
      });
      stripSection.hidden = false;
    });
  }

  /* ---- Countdown to Saturday, September 19, 2026, 6:30 PM Eastern ---- */

  var clock = byId("clock");
  if (clock) {
    var target = new Date("2026-09-19T18:30:00-04:00").getTime();
    var fields = {};
    Array.prototype.forEach.call(clock.querySelectorAll("[data-unit]"), function (el) {
      fields[el.getAttribute("data-unit")] = el;
    });

    var pad = function (n) { return n < 10 ? "0" + n : String(n); };

    var tick = function () {
      var left = target - Date.now();
      if (left <= 0) {
        var lede = clock.parentNode.querySelector(".countdown-lede");
        if (lede) { lede.textContent = "The weekend is here"; }
        fields.days.textContent = "0";
        fields.hours.textContent = "00";
        fields.minutes.textContent = "00";
        fields.seconds.textContent = "00";
        return;
      }
      var s = Math.floor(left / 1000);
      fields.days.textContent = String(Math.floor(s / 86400));
      fields.hours.textContent = pad(Math.floor(s % 86400 / 3600));
      fields.minutes.textContent = pad(Math.floor(s % 3600 / 60));
      fields.seconds.textContent = pad(s % 60);
    };

    tick();
    setInterval(tick, 1000);
  }

  /* ---- Scroll reveal (every page) ---- */

  var risers = document.querySelectorAll(".rise");
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Array.prototype.forEach.call(risers, function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
  Array.prototype.forEach.call(risers, function (el) { io.observe(el); });
})();
