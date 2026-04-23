import { sendLocalNotification } from "./notification.service";

// Nova atividade
export function notifyNewActivity(activity) {
  sendLocalNotification({
    title: "Nova atividade",
    body: activity.titulo,
  });
}

// Convite
export function notifyInvite(sala) {
  sendLocalNotification({
    title: "Convite recebido",
    body: `Você foi convidado para ${sala}`,
  });
}

// Aviso
export function notifyAnnouncement(msg) {
  sendLocalNotification({
    title: "Aviso importante",
    body: msg,
  });
}