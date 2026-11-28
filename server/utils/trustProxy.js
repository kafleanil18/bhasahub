// Render (and most hosts) put a proxy in front of the server, so every request arrives from the
// proxy's address. Without trusting it, req.ip is the proxy for everyone and the sign-in rate
// limits become one shared limit for all visitors.
//
// TRUST_PROXY is the number of proxies in front of the server (default 1). Only that many
// addresses are read from the right of X-Forwarded-For, the ones the proxies added, so a visitor
// cannot pick their own address by sending the header themselves. Set it to 0 when the server
// is reached directly, with no proxy.
function trustProxySetting(value = process.env.TRUST_PROXY) {
  if (value === undefined || value === '') return 1;
  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 0) throw new Error('TRUST_PROXY must be a whole number of proxies, such as 1, or 0 for none.');
  return hops;
}

module.exports = { trustProxySetting };
