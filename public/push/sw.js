/* Push Rápido — Service Worker (fluxo semelhante ao OneSignal) */
const API_URL = "https://pushrapidoapi.publix.ia.br";
const DEFAULT_ICON =
  "https://pushrapidoapi.publix.ia.br/uploads/sites/1/icon.png";

function parsePushPayload(event) {
  if (!event.data) {
    return { title: "Notificação", body: "", data: {} };
  }

  try {
    const raw = event.data.json();
    if (raw?.notification && typeof raw.notification === "object") {
      return {
        title: raw.notification.title ?? raw.title,
        body: raw.notification.body ?? raw.body,
        ...raw.notification,
        data: raw.notification.data ?? raw.data ?? {},
      };
    }
    return raw;
  } catch {
    return { title: "Notificação", body: event.data.text(), data: {} };
  }
}

function buildNotificationOptions(data) {
  const nested = data.data && typeof data.data === "object" ? data.data : {};
  const payload = { ...nested, ...(data.custom?.data ?? {}) };

  const campaignId = payload.campaignId ?? data.campaignId ?? null;
  const siteId = payload.siteId ?? data.siteId ?? null;

  const options = {
    body: data.body ?? data.message ?? "",
    icon: data.icon ?? data.largeIcon ?? DEFAULT_ICON,
    badge: data.badge ?? DEFAULT_ICON,
    tag: data.tag ?? (campaignId ? `pr-campaign-${campaignId}` : undefined),
    renotify: Boolean(data.renotify ?? (data.tag || campaignId)),
    requireInteraction: Boolean(data.requireInteraction),
    silent: Boolean(data.silent),
    timestamp: data.timestamp ?? Date.now(),
    vibrate: data.vibrate ?? [200, 100, 200],
    data: {
      url: payload.url ?? data.url ?? data.launchURL ?? "/",
      campaignId,
      siteId,
      notificationId: payload.notificationId ?? data.notificationId ?? null,
    },
  };

  const image = data.image ?? data.bigPicture ?? data.picture;
  if (image) options.image = image;

  if (Array.isArray(data.actions) && data.actions.length > 0) {
    options.actions = data.actions.slice(0, 2).map((action) => ({
      action: action.action ?? action.id ?? "open",
      title: action.title ?? action.text ?? "Abrir",
      icon: action.icon,
    }));
  }

  return options;
}

function trackEvent(path, body) {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

function resolveClickUrl(notificationData, actionId) {
  const baseUrl = notificationData?.url || "/";

  if (!actionId || !Array.isArray(notificationData?.actionUrls)) {
    return baseUrl;
  }

  const match = notificationData.actionUrls.find(
    (item) => item.action === actionId || item.id === actionId,
  );
  return match?.url || baseUrl;
}

function focusOrOpen(urlDestino) {
  const target = new URL(urlDestino, self.location.origin).href;

  return clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === target || client.url.startsWith(target.split("?")[0])) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlDestino);
      }
    });
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = parsePushPayload(event);
  const title = data.title ?? data.heading ?? "Notificação";
  const options = buildNotificationOptions(data);
  const { campaignId, siteId } = options.data;

  event.waitUntil(
    (async () => {
      if (campaignId) {
        await trackEvent("/api/v1/events/delivery", { campaignId, siteId });
      }
      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const { campaignId, siteId } = notificationData;
  const urlDestino = resolveClickUrl(notificationData, event.action);

  const tasks = [focusOrOpen(urlDestino)];

  if (campaignId) {
    tasks.unshift(
      trackEvent("/api/v1/events/click", {
        campaignId,
        siteId,
        action: event.action || null,
      }),
    );
  }

  event.waitUntil(Promise.all(tasks));
});

self.addEventListener("notificationclose", (event) => {
  const { campaignId, siteId } = event.notification.data || {};
  if (!campaignId) return;

  event.waitUntil(
    trackEvent("/api/v1/events/dismiss", { campaignId, siteId }),
  );
});
