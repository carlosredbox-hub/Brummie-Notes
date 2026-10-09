function serverUrl(value) {
  const u = new URL(value.trim());
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    u.pathname !== "/"
  )
    throw new Error(
      "Informe a raiz do servidor HTTPS, por exemplo https://app.suaempresa.com.",
    );
  return u.origin;
}
module.exports = { serverUrl };
