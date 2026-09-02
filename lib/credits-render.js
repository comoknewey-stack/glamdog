(function () {
  "use strict";

  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    var list = document.querySelector("[data-credits]");
    var credits = window.__CREDITS__;
    if (!list || !credits) return;
    list.innerHTML = Object.keys(credits).map(function (id) {
      var c = credits[id];
      var creatorHTML = c.creator_url
        ? '<a href="' + escHTML(c.creator_url) + '" target="_blank" rel="noopener">' + escHTML(c.creator) + '</a>'
        : escHTML(c.creator);
      return (
        '<li><strong>' + escHTML(c.title) + '</strong> — ' + creatorHTML + ' (' + escHTML(c.source) + ') · ' +
        '<a href="' + escHTML(c.license_url) + '" target="_blank" rel="noopener">' + escHTML((c.license || "").toUpperCase()) + ' ' + escHTML(c.license_version || "") + '</a> · ' +
        '<a href="' + escHTML(c.foreign_landing_url) + '" target="_blank" rel="noopener">Ver original ↗</a></li>'
      );
    }).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
