import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import {
  requestPermission,
  getPushToken,
  listenForegroundMessages
} from "./features/notifications/notification.service";

function App() {
  const userName = localStorage.getItem('userName') || 'visitante';
  const userType = localStorage.getItem('userType');

  const [pontos, setPontos] = useState(() => {
    const salvo = localStorage.getItem(`lumi_pontos_${userName}`);
    return salvo ? parseInt(salvo, 10) : 0;
  });

  const [concluidas, setConcluidas] = useState(() => {
    const salvo = localStorage.getItem(`lumi_concluidas_${userName}`);
    return salvo ? JSON.parse(salvo) : [];
  });

  // LISTENER DE NOTIFICAÇÃO (AGORA NO LUGAR CERTO)
  useEffect(() => {
    listenForegroundMessages();
  }, []);

  useEffect(() => {
    if (userName !== 'visitante') {
      localStorage.setItem(`lumi_pontos_${userName}`, pontos.toString());
      localStorage.setItem(
        `lumi_concluidas_${userName}`,
        JSON.stringify(concluidas)
      );
    }
  }, [pontos, concluidas, userName]);

  // FUNÇÃO DO PUSH
  const handleEnablePush = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      toast.error("Permissão negada");
      return;
    }

    const token = await getPushToken();

    console.log("TOKEN:", token);
    toast.success("Notificações ativadas!");
  } catch (err) {
    console.error("ERRO REAL:", err); // IMPORTANTE
    toast.error(err.message || "Erro ao ativar notificações");
  }
};

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>

      {/* TOAST GLOBAL */}
      <Toaster />

      {userType && <Header pontos={pontos} />}

      {/* 🔔 BOTÃO TEMPORÁRIO DE TESTE */}
      <div style={{ padding: 10 }}>
        <button onClick={handleEnablePush}>
           🔔
        </button>
      </div>

      <AppRoutes
        userType={userType}
        setPontos={setPontos}
        concluidas={concluidas}
        setConcluidas={setConcluidas}
      />
    </div>
  );
}

export default App;