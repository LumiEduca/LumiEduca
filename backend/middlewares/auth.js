// ⚠️ TEMPORÁRIO, SÓ PARA DESENVOLVIMENTO.
// Confia nos headers x-usuario-id e x-usuario-papel enviados pelo cliente,
// então qualquer pessoa pode se passar por qualquer usuário.
// Antes de ir para produção, substitua por verificação real do token
// (ex.: admin.auth().verifyIdToken) preenchendo req.usuario = { id, papel }.
export const autenticar = (req, res, next) => {
  const id = req.header("x-usuario-id");
  const papel = req.header("x-usuario-papel");

  if (!id || !["professor", "aluno"].includes(papel)) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  req.usuario = { id, papel };
  next();
};

export const exigirPapel = (papel) => (req, res, next) => {
  if (req.usuario?.papel !== papel) {
    return res.status(403).json({ erro: `Apenas ${papel} pode acessar esta rota` });
  }
  next();
};