// A chave da Gemini NÃO fica mais aqui. Toda a chamada à IA agora passa
// pelo backend (rota protegida /api/v1/lumi/dica), que é quem guarda a
// GEMINI_API_KEY como variável de ambiente do servidor.

// ATENÇÃO (ajuste conforme o projeto real):
// 1. API_BASE_URL — assumido como localhost:5000 em dev, ou REACT_APP_API_URL
//    se estiver definida. Ajuste se a URL do backend em produção for outra.
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// 2. Como o token JWT é recuperado — assumido localStorage.getItem("token").
//    Se o projeto guarda o token de outro jeito (Context/Redux/outra chave),
//    troque só esta função.
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

    return "Ops! O Lumi precisou dar uma corridinha na floresta e não conseguiu responder agora. 🦊 Tente clicar no botão novamente em alguns segundos!";
  }
};