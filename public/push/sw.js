const API_URL = "https://pushrapidoapi.publix.ia.br";

const COMPATIBLE_ICON_RE = /\.(png|jpe?g|webp)(\?|#|$)/i;

function resolveAbsoluteUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed, self.location.origin).href;
  } catch {
    return null;
  }
}

function isSafariCompatibleIcon(url) {
  const absolute = resolveAbsoluteUrl(url);
  if (!absolute) return null;
  if (!absolute.startsWith("https://")) return null;
  if (/\.svg(\?|#|$)/i.test(absolute)) return null;
  if (!COMPATIBLE_ICON_RE.test(absolute)) return null;
  return absolute;
}

function buildNotificationOptions(data) {
  const payloadData = data.data && typeof data.data === "object" ? data.data : {};
  const options = {
    body: data.body || "",
    data: {
      url: payloadData.url || "/",
      campaignId: payloadData.campaignId ?? null,
      siteId: payloadData.siteId ?? null,
    },
  };

  const icon = isSafariCompatibleIcon(data.icon);
  if (icon) {
    options.icon = icon;
  }

  return options;
}

async function showPushNotification(title, data) {
  const notificationTitle = title || "Notificação";
  const withIcon = buildNotificationOptions(data);

  try {
    await self.registration.showNotification(notificationTitle, withIcon);
    return;
  } catch (err) {
    console.error("[Push Rápido SW] showNotification com ícone falhou:", err);
  }

  const withoutIcon = buildNotificationOptions({ ...data, icon: null });
  delete withoutIcon.icon;

  try {
    await self.registration.showNotification(notificationTitle, withoutIcon);
  } catch (err) {
    console.error("[Push Rápido SW] showNotification sem ícone falhou:", err);
    throw err;
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Notificação", body: event.data.text() };
  }

  event.waitUntil(showPushNotification(data.title, data));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlDestino = event.notification.data?.url || "/";
  const campaignId = event.notification.data?.campaignId;
  const siteId = event.notification.data?.siteId;

  if (campaignId) {
    fetch(`${API_URL}/api/v1/events/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, siteId }),
      keepalive: true,
    }).catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlDestino && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlDestino);
      }
    })
  );
});
