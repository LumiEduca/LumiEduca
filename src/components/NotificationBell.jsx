import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/notification-bell.css';
import {
  listarNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
} from '../services/notificacoesApi';
import { ativarPush, ouvirMensagens } from '../services/firebase';

const INTERVALO_MS = 60 * 1000;

const lerPermissao = () =>
  'Notification' in window ? Notification.permission : 'unsupported';

const formatarData = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function NotificationBell() {
  const [aberto, setAberto] = useState(false);
  const [total, setTotal] = useState(0);
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [permissao, setPermissao] = useState(lerPermissao);
  const [avisoPush, setAvisoPush] = useState('');

  const raiz = useRef(null);
  const botao = useRef(null);
  const abertoRef = useRef(false);
  abertoRef.current = aberto;

  const atualizarContagem = useCallback(async () => {
    try {
      setTotal(await contarNaoLidas());
    } catch {
      // Silencioso: o contador só não atualiza
    }
  }, []);

  const carregarLista = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [lista, quantidade] = await Promise.all([listarNotificacoes(), contarNaoLidas()]);
      setItens(lista);
      setTotal(quantidade);
    } catch (e) {
      setErro(e.message || 'Não foi possível carregar as notificações.');
    } finally {
      setCarregando(false);
    }
  }, []);

  // Contador: ao montar, a cada 60s com a aba visível e ao voltar para a aba
  useEffect(() => {
    atualizarContagem();

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') atualizarContagem();
    }, INTERVALO_MS);

    const aoVoltar = () => {
      if (document.visibilityState === 'visible') atualizarContagem();
    };
    document.addEventListener('visibilitychange', aoVoltar);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [atualizarContagem]);

  // Mensagem push com o app em foco: atualiza contador (e lista, se estiver aberta)
  useEffect(() => {
    let cancelado = false;
    let parar = () => {};

    ouvirMensagens(() => {
      atualizarContagem();
      if (abertoRef.current) carregarLista();
    }).then((fn) => {
      if (cancelado) fn();
      else parar = fn;
    });

    return () => {
      cancelado = true;
      parar();
    };
  }, [atualizarContagem, carregarLista]);

  // Fecha ao clicar fora ou com Esc (devolvendo o foco ao botão)
  useEffect(() => {
    if (!aberto) return undefined;

    const aoClicarFora = (e) => {
      if (raiz.current && !raiz.current.contains(e.target)) setAberto(false);
    };
    const aoTeclar = (e) => {
      if (e.key === 'Escape') {
        setAberto(false);
        botao.current?.focus();
      }
    };

    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  const alternar = () => {
    const vaiAbrir = !aberto;
    setAberto(vaiAbrir);
    if (vaiAbrir) {
      setPermissao(lerPermissao());
      carregarLista();
    }
  };

  const abrirNotificacao = async (n) => {
    if (n.lida) return;

    setItens((prev) => prev.map((i) => (i.id === n.id ? { ...i, lida: true } : i)));
    setTotal((t) => Math.max(0, t - 1));

    try {
      await marcarComoLida(n.id);
    } catch {
      carregarLista(); // desfaz a marcação otimista
    }
  };

  const marcarTodas = async () => {
    try {
      await marcarTodasComoLidas();
      setItens((prev) => prev.map((i) => ({ ...i, lida: true })));
      setTotal(0);
    } catch (e) {
      setErro(e.message || 'Não foi possível marcar como lidas.');
    }
  };

  const ativar = async () => {
    setAvisoPush('');
    const r = await ativarPush(localStorage.getItem('token'), { pedirPermissao: true });
    setPermissao(lerPermissao());

    if (r.ok) setAvisoPush('Notificações ativadas neste dispositivo.');
    else if (r.motivo === 'permissao-negada') setAvisoPush('Permissão negada no navegador.');
    else if (r.motivo === 'nao-suportado') setAvisoPush('Este navegador não suporta notificações push.');
    else if (r.motivo === 'sem-config') setAvisoPush('Notificações push ainda não configuradas.');
    else setAvisoPush('Não foi possível ativar agora. Tente novamente.');
  };

  const rotulo = total > 0 ? `Notificações, ${total} não lidas` : 'Notificações';

  return (
    <div className="notification-bell" ref={raiz}>
      <button
        type="button"
        ref={botao}
        className="bell-btn"
        onClick={alternar}
        aria-label={rotulo}
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-controls="painel-notificacoes"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {total > 0 && (
          <span className="bell-badge" aria-hidden="true">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <div id="painel-notificacoes" className="bell-panel" role="region" aria-label="Lista de notificações">
          <div className="bell-panel-header">
            <strong>Notificações</strong>
            <button type="button" className="bell-link" onClick={marcarTodas} disabled={total === 0}>
              Marcar todas como lidas
            </button>
          </div>

          {permissao === 'default' && (
            <button type="button" className="bell-enable" onClick={ativar}>
              🔔 Ativar notificações neste dispositivo
            </button>
          )}
          {permissao === 'denied' && (
            <p className="bell-note">
              As notificações estão bloqueadas no navegador. Libere nas configurações do site.
            </p>
          )}
          {avisoPush && (
            <p className="bell-note" role="status">
              {avisoPush}
            </p>
          )}

          {erro && (
            <p className="bell-error" role="alert">
              {erro}
            </p>
          )}

          {carregando && itens.length === 0 ? (
            <p className="bell-note">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="bell-note">Você não tem notificações.</p>
          ) : (
            <ul className="bell-list">
              {itens.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`bell-item ${n.lida ? '' : 'unread'}`}
                    onClick={() => abrirNotificacao(n)}
                  >
                    <span className="bell-item-title">
                      {!n.lida && <span className="bell-dot" aria-hidden="true" />}
                      {n.titulo}
                      {!n.lida && <span className="bell-sr"> (não lida)</span>}
                    </span>
                    <span className="bell-item-body">{n.corpo}</span>
                    <span className="bell-item-date">{formatarData(n.criadaEm)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}