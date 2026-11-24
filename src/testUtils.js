// Helpers compartilhados pelos testes do front

// Substitui window.location por um objeto simples para podermos ler o href atribuído.
export function mockarLocation() {
  const original = window.location;
  delete window.location;
  window.location = { href: '', assign: jest.fn(), reload: jest.fn() };
  return () => {
    window.location = original;
  };
}

export function respostaJson(corpo, { ok = true, status = 200 } = {}) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(corpo),
  });
}