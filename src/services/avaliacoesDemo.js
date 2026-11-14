import API_BASE_URL from './apiConfig';

const CHAVE = 'lumi_demo_avaliacoes';

const ler = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || '[]');
  } catch {
    return [];
  }
};

const gravar = (lista) => {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* sem armazenamento: ignora */
  }
};

// true = resolvido (enviado ou rejeitado de vez); false = tentar de novo depois
async function postar(item) {
  const res = await fetch(`${API_BASE_URL}/api/v1/demos/avaliacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jogo: item.jogo, nota: item.nota }),
  });
  if (res.ok) return true;
  return res.status >= 400 && res.status < 500 && res.status !== 429;
}

let enviando = false;

export async function enviarPendentes() {
  if (enviando) return;
  enviando = true;
  try {
    const resolvidos = new Set();
    for (const item of ler()) {
      if (item.enviada) continue;
      try {
        if (await postar(item)) resolvidos.add(item.id);
      } catch {
        break; // sem internet: tenta de novo depois
      }
    }
    if (resolvidos.size) {
      const atual = ler();
      atual.forEach((i) => {
        if (resolvidos.has(i.id)) i.enviada = true;
      });
      gravar(atual);
    }
  } finally {
    enviando = false;
  }
}

export function registrarAvaliacao(jogo, nota) {
  const lista = ler();
  lista.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    jogo,
    nota,
    data: new Date().toISOString(),
    enviada: false,
  });
  gravar(lista);
  enviarPendentes();
}