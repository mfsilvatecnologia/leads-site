const API_URL = "https://pushrapidoapi.publix.ia.br";

const COMPATIBLE_ICON_RE = /\.(png|jpe?g|webp)(\?|#|$)/i;
const DEFAULT_TITLE = "Notificação";
const DEFAULT_BODY = "Você tem uma nova mensagem.";

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

function omitEmptyValues(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && !value.trim()) continue;
    out[key] = value;
  }
  return out;
}

function normalizePayloadData(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const data = {};
  const url = typeof raw.url === "string" && raw.url.trim() ? raw.url.trim() : "/";
  data.url = url;
  if (raw.campaignId != null && String(raw.campaignId).trim()) {
    data.campaignId = String(raw.campaignId).trim();
  }
  if (raw.siteId != null && raw.siteId !== "") {
    const siteId = Number(raw.siteId);
    if (!Number.isNaN(siteId)) {
      data.siteId = siteId;
    }
  }
  return data;
}

function parsePushPayload(event) {
  console.log("[Push Rápido SW] push recebido");

  if (!event.data) {
    console.warn("[Push Rápido SW] event.data ausente; usando payload fallback");
    return {
      title: DEFAULT_TITLE,
      body: DEFAULT_BODY,
      data: { url: "/" },
    };
  }

  let parsed = null;

  try {
    parsed = event.data.json();
    console.log("[Push Rápido SW] payload JSON parseado:", parsed);
  } catch (jsonErr) {
    console.error("[Push Rápido SW] falha ao parsear JSON:", jsonErr);
    try {
      const text = event.data.text();
      console.log("[Push Rápido SW] fallback text():", text);
      return {
        title: DEFAULT_TITLE,
        body: typeof text === "string" && text.trim() ? text.trim() : DEFAULT_BODY,
        data: { url: "/" },
      };
    } catch (textErr) {
      console.error("[Push Rápido SW] falha ao ler text():", textErr);
      return {
        title: DEFAULT_TITLE,
        body: DEFAULT_BODY,
        data: { url: "/" },
      };
    }
  }

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
      console.log("[Push Rápido SW] payload re-parseado de string:", parsed);
    } catch {
      return {
        title: DEFAULT_TITLE,
        body: parsed.trim() || DEFAULT_BODY,
        data: { url: "/" },
      };
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.error("[Push Rápido SW] payload inválido (não é objeto):", parsed);
    return {
      title: DEFAULT_TITLE,
      body: DEFAULT_BODY,
      data: { url: "/" },
    };
  }

  const title =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : DEFAULT_TITLE;
  const body =
    typeof parsed.body === "string" && parsed.body.trim()
      ? parsed.body.trim()
      : DEFAULT_BODY;

  const normalized = {
    title,
    body,
    data: normalizePayloadData(parsed.data),
  };

  if (typeof parsed.icon === "string" && parsed.icon.trim()) {
    normalized.icon = parsed.icon.trim();
  }

  console.log("[Push Rápido SW] payload normalizado:", normalized);
  return normalized;
}

function sanitizeNotificationOptions(data) {
  const payloadData = normalizePayloadData(data.data);
  const body =
    typeof data.body === "string" && data.body.trim() ? data.body.trim() : DEFAULT_BODY;

  const options = {
    body,
    data: omitEmptyValues(payloadData),
  };

  const icon = isSafariCompatibleIcon(data.icon);
  if (icon) {
    options.icon = icon;
  }

  return options;
}

async function showPushNotification(title, data) {
  const notificationTitle =
    typeof title === "string" && title.trim() ? title.trim() : DEFAULT_TITLE;
  const withIcon = sanitizeNotificationOptions(data);

  console.log("[Push Rápido SW] showNotification (com ícone?):", {
    title: notificationTitle,
    hasIcon: Boolean(withIcon.icon),
    options: withIcon,
  });

  try {
    await self.registration.showNotification(notificationTitle, withIcon);
    console.log("[Push Rápido SW] showNotification com ícone concluído");
    return;
  } catch (err) {
    console.error("[Push Rápido SW] showNotification com ícone falhou:", err);
  }

  const withoutIcon = sanitizeNotificationOptions({ ...data, icon: null });
  delete withoutIcon.icon;

  console.log("[Push Rápido SW] showNotification (sem ícone):", {
    title: notificationTitle,
    options: withoutIcon,
  });

  try {
    await self.registration.showNotification(notificationTitle, withoutIcon);
    console.log("[Push Rápido SW] showNotification sem ícone concluído");
  } catch (err) {
    console.error("[Push Rápido SW] showNotification sem ícone falhou:", err);
    throw err;
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const payload = parsePushPayload(event);
        await showPushNotification(payload.title, payload);
        console.log("[Push Rápido SW] pipeline push concluído");
      } catch (err) {
        console.error("[Push Rápido SW] falha no pipeline push:", err);
        await self.registration.showNotification(DEFAULT_TITLE, {
          body: DEFAULT_BODY,
          data: { url: "/" },
        });
        console.log("[Push Rápido SW] notificação fallback exibida");
      }
    })()
  );
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
