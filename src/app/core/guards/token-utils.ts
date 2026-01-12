// utilitaire pour décoder le payload JWT
export function parseTokenPayload(token: string | null): any {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let payload = parts[1];
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) payload += '=';
    const json = decodeURIComponent(atob(payload).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// utilitaire pour décoder le payload JWT et extraire des rôles
export function parseTokenRoles(token: string | null): string[] {
  const obj = parseTokenPayload(token);
  if (!obj) return [];
  try {
    const roles: string[] = [];
    if (obj.role && typeof obj.role === 'string') roles.push(obj.role);
    if (obj.roles && Array.isArray(obj.roles)) roles.push(...obj.roles);
    if (obj.authorities && Array.isArray(obj.authorities)) roles.push(...obj.authorities.map((a: any) => typeof a === 'string' ? a : (a.authority || a)));
    if (obj.realm_access && obj.realm_access.roles && Array.isArray(obj.realm_access.roles)) roles.push(...obj.realm_access.roles);
    if (obj.scope && typeof obj.scope === 'string') roles.push(...obj.scope.split(' '));
    if (obj.scp && Array.isArray(obj.scp)) roles.push(...obj.scp);
    return roles.map(r => ('' + r).toUpperCase());
  } catch (e) {
    return [];
  }
}
export function hasRole(token: string | null, predicate: (r: string) => boolean): boolean {
  const roles = parseTokenRoles(token);
  for (const r of roles) {
    if (predicate(r)) return true;
  }
  return false;
}

