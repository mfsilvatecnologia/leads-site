const API_URL = "https://pushrapidoapi.publix.ia.br";

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Notificação", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/assets/icon.svg",
    badge: "/assets/badge-72.svg",
    data: {
      url: data.data?.url || "/",
      campaignId: data.data?.campaignId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title || "Notificação", options));
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
