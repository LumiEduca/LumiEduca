let tokens = []; // ideal: banco de dados

export const saveToken = (req, res) => {
  const { userId, token } = req.body;

  tokens.push({ userId, token });

  res.sendStatus(200);
};