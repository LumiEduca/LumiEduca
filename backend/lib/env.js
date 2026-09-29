export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "JWT_SECRET não definido. Configure a variável de ambiente antes de iniciar o servidor."
  );
  process.exit(1);
}
