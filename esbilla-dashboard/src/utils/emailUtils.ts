/**
 * Ofusca un email mostrando solo algunos caracteres
 * Ejemplo: jorge@example.com -> j***e@ex*****.com
 */
export function obfuscateEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';

  const [username, domain] = email.split('@');

  // Ofuscar username: mostrar primer y último carácter
  let obfuscatedUsername = '***';
  if (username.length >= 2) {
    obfuscatedUsername = username[0] + '***' + username[username.length - 1];
  } else if (username.length === 1) {
    obfuscatedUsername = username[0] + '***';
  }

  // Ofuscar dominio: mostrar primeros 2 caracteres + asteriscos
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  const tld = domainParts[domainParts.length - 1];

  let obfuscatedDomain = '***';
  if (domainName.length >= 2) {
    obfuscatedDomain = domainName.substring(0, 2) + '*****';
  } else {
    obfuscatedDomain = domainName[0] + '***';
  }

  return `${obfuscatedUsername}@${obfuscatedDomain}.${tld}`;
}

/**
 * Obtiene el email del owner de una organización desde los usuarios
 */
export function getOrgOwnerEmail(
  organizationId: string,
  users: Array<{ email: string; orgAccess?: Record<string, { role: string }> }>
): string | null {
  const owner = users.find(
    u => u.orgAccess?.[organizationId]?.role === 'org_owner'
  );
  return owner?.email || null;
}
