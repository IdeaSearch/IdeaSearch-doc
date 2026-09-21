/**
 * The public Physics directory is served from its own hostname. Localhost is
 * also treated as the Physics preview so the client hydrates on a normal
 * local URL without a Host-header proxy.
 */
export function isPhysicsHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === "physics.ideasearch.cn" || hostname === "localhost" || hostname === "127.0.0.1";
}
