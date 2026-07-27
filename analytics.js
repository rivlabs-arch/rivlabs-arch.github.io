(() => {
  "use strict";

  const endpoint = "https://rivlabs-analytics-collector.jrivasjmnz.chatgpt.site/api/collect";
  const params = new URLSearchParams(window.location.search);
  let engagedSent = false;

  function device() {
    if (window.innerWidth < 680) return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
  }

  function track(event, details = {}) {
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
    const payload = JSON.stringify({
      event,
      path: window.location.pathname,
      postId: details.postId || null,
      referrer: document.referrer || null,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      device: device()
    });
    const body = new Blob([payload], { type: "text/plain" });
    if (navigator.sendBeacon?.(endpoint, body)) return;
    fetch(endpoint, { method: "POST", body, keepalive: true, mode: "cors" }).catch(() => undefined);
  }

  window.RivLabsAnalytics = { track };
  track("page_view");
  if (document.body.dataset.postId) track("post_open", { postId: document.body.dataset.postId });

  window.setTimeout(() => {
    if (!document.hidden && !engagedSent) {
      engagedSent = true;
      track("engaged", { postId: document.body.dataset.postId || null });
    }
  }, 15000);

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (link?.hostname === "www.instagram.com" || link?.hostname === "instagram.com") {
      track("outbound", { postId: document.body.dataset.postId || null });
    }
  });
})();
