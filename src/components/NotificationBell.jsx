import { useState } from "react";
import { useNotifications } from "../features/notifications/useNotifications";

export default function NotificationBell() {
  const { notifications, unreadCount, markAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      
      <button onClick={() => setOpen(!open)}>
        🔔 {unreadCount > 0 && `(${unreadCount})`}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "40px",
            width: "300px",
            background: "#ffffff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "10px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            zIndex: 999,
          }}
        >
          <h4>Notificações</h4>

          <button onClick={markAll}>
            Marcar todas como lidas
          </button>

          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.length === 0 && <p>Nenhuma notificação</p>}

            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "8px",
                  marginTop: "5px",
                  background: n.read ? "#f1f5f9" : "#e0f2fe",
                  borderRadius: "6px",
                }}
              >
                <strong>{n.title}</strong>
                <p style={{ fontSize: "13px" }}>{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}