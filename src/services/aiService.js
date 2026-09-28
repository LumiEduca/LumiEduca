// A chave da Gemini NÃO fica mais aqui. Toda a chamada à IA passa pelo backend
// (rota protegida /api/v1/lumi/dica), que guarda a GEMINI_API_KEY.

// IMPORTANTE (produção/Vercel): defina REACT_APP_API_URL com a URL pública do
// backend. Sem isso, o fallback abaixo (http://localhost:5000) só funciona em dev.
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const MENSAGEM_ERRO_PADRAO =
  "Ops! O Lumi precisou dar uma corridinha na floresta e não conseguiu responder agora. 🦊 Tente clicar no botão novamente em alguns segundos!";

const MENSAGEM_LIMITE =
  "Calma! O Lumi precisa de um respiro. Tente de novo em alguns instantes 🦊";

function obterToken() {
  return localStorage.getItem("token");
}

/**
 * Solicita uma dica pedagógica ao Lumi baseada na pergunta e opções da tarefa.
 * Mesma assinatura de antes — só a implementação interna mudou.
 */
export const pedirDicaAoLumi = async (pergunta, opcoes, nomeAtividade) => {
  try {
    if (!pergunta) {
      throw new Error("A pergunta da atividade não foi fornecida.");
    }

    const token = obterToken();

    if (!token) {
      throw new Error("Usuário não autenticado.");
    }

    const resposta = await fetch(`${API_BASE_URL}/api/v1/lumi/dica`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pergunta, opcoes, nomeAtividade }),
    });

    // Rate limit: mensagem amigável específica
    if (resposta.status === 429) {
      return MENSAGEM_LIMITE;
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao consultar o Lumi.");
    }

    if (!dados.dica) {
      throw new Error("O Lumi não conseguiu gerar uma resposta.");
    }

    return dados.dica;
  } catch (error) {
    console.error("Erro na integração com o Lumi (backend):", {
      mensagem: error.message,
      contexto: { nomeAtividade, pergunta },
    });

    return MENSAGEM_ERRO_PADRAO;
  }
};
