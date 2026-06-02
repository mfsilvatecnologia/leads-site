const API_URL = "https://pushrapidoapi.publix.ia.br";

/** Ícone pequeno — OneSignal web: PNG/JPG/WebP, quadrado ~256px */
const PUSH_ICON_RE = /\.(png|jpe?g|webp)(\?|#|$)/i;
/** Banner grande — OneSignal: PNG/JPG/GIF/WebP, proporção ~2:1 */
const PUSH_BANNER_RE = /\.(png|jpe?g|webp|gif)(\?|#|$)/i;
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

function isAllowedMediaProtocol(absolute) {
  if (absolute.startsWith("https://")) return true;
  try {
    const u = new URL(absolute);
    return (
      u.protocol === "http:" &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

function resolvePushMedia(url, pattern) {
  const absolute = resolveAbsoluteUrl(url);
  if (!absolute) return null;
  if (/\.svg(\?|#|$)/i.test(absolute)) return null;
  if (!pattern.test(absolute)) return null;
  return isAllowedMediaProtocol(absolute) ? absolute : null;
}

function isCompatiblePushIcon(url) {
  return resolvePushMedia(url, PUSH_ICON_RE);
}

function isCompatiblePushBanner(url) {
  return resolvePushMedia(url, PUSH_BANNER_RE);
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

/**
 * Parse seguro do payload Web Push.
 * Estrutura esperada: { title, body, icon?, image?, data: { url, campaignId?, siteId? } }
 */
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
      return {
        title: DEFAULT_TITLE,
        body: typeof text === "string" && text.trim() ? text.trim() : DEFAULT_BODY,
        data: { url: "/" },
      };
    } catch {
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

  if (typeof parsed.image === "string" && parsed.image.trim()) {
    normalized.image = parsed.image.trim();
  }

  console.log("[Push Rápido SW] payload normalizado:", normalized);
  return normalized;
}

function buildNotificationOptions(data) {
  const payloadData = normalizePayloadData(data.data);
  const body =
    typeof data.body === "string" && data.body.trim() ? data.body.trim() : DEFAULT_BODY;

  const options = {
    body,
    data: omitEmptyValues(payloadData),
  };

  const icon = isCompatiblePushIcon(data.icon);
  if (icon) {
    options.icon = icon;
  }

  const image = isCompatiblePushBanner(data.image);
  if (image) {
    options.image = image;
  }

  return options;
}

/**
 * Pré-carrega ícone e banner antes do showNotification.
 * Android/Windows baixam a imagem ao exibir a notificação; sem await aqui o SW pode
 * ser encerrado antes do download terminar.
 */
async function preloadNotificationMedia(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return;

  await Promise.all(
    unique.map(async (url) => {
      try {
        const response = await fetch(url, { mode: "cors", cache: "force-cache" });
        if (response.ok) {
          await response.blob();
          console.log("[Push Rápido SW] mídia pré-carregada:", url);
        }
      } catch (err) {
        console.warn("[Push Rápido SW] preload falhou (seguindo mesmo assim):", url, err);
      }
    })
  );
}

async function showPushNotification(title, data) {
  const notificationTitle =
    typeof title === "string" && title.trim() ? title.trim() : DEFAULT_TITLE;

  const fullOptions = buildNotificationOptions(data);

  console.log("[Push Rápido SW] preparando notificação:", {
    title: notificationTitle,
    hasIcon: Boolean(fullOptions.icon),
    hasImage: Boolean(fullOptions.image),
  });

  await preloadNotificationMedia([fullOptions.icon, fullOptions.image]);

  try {
    await self.registration.showNotification(notificationTitle, fullOptions);
    console.log("[Push Rápido SW] showNotification concluído");
    return;
  } catch (err) {
    console.error("[Push Rápido SW] showNotification com mídia falhou:", err);
  }

  if (fullOptions.image) {
    const iconOnly = buildNotificationOptions({ ...data, image: null });
    delete iconOnly.image;
    await preloadNotificationMedia([iconOnly.icon]);
    try {
      await self.registration.showNotification(notificationTitle, iconOnly);
      console.log("[Push Rápido SW] showNotification sem banner concluído");
      return;
    } catch (err) {
      console.error("[Push Rápido SW] showNotification sem banner falhou:", err);
    }
  }

  const textOnly = buildNotificationOptions({ ...data, icon: null, image: null });
  delete textOnly.icon;
  delete textOnly.image;

  await self.registration.showNotification(notificationTitle, textOnly);
  console.log("[Push Rápido SW] showNotification só texto concluído");
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const payload = parsePushPayload(event);
        await showPushNotification(payload.title, payload);
      } catch (err) {
        console.error("[Push Rápido SW] falha no pipeline push:", err);
        await self.registration.showNotification(DEFAULT_TITLE, {
          body: DEFAULT_BODY,
          data: { url: "/" },
        });
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || "/";
  const targetUrl = resolveAbsoluteUrl(rawUrl) || self.location.origin + "/";
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
    (async () => {
      const windowClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        const clientUrl = resolveAbsoluteUrl(client.url);
        if (clientUrl === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })()
  );
});
