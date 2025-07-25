export const POTENTIALLY_SECRET_FIELDS = [
  'token',
  'access_token',
  'id_token',
  'password',
  'client_secret',
];

export function maskSecrets<T extends { [x: string]: any } | string>(
  target: T,
  secretValues: Set<string>
): T {
  const maskValue = (value: string, secret: string): string => {
    return value.replace(secret, '*'.repeat(8));
  };

  if (typeof target === 'string') {
    let maskedString = target as string;
    secretValues.forEach((secret) => {
      maskedString = maskedString.split(secret).join('*'.repeat(8));
    });
    return maskedString as T;
  }

  const masked = JSON.parse(JSON.stringify(target));
  const maskIfContainsSecret = (value: string): string => {
    let maskedValue = value;

    for (const secret of secretValues) {
      if (maskedValue.includes(secret)) {
        maskedValue = maskValue(maskedValue, secret);
      }
    }

    return maskedValue;
  };

  const maskRecursive = (current: any) => {
    for (const key in current) {
      if (typeof current[key] === 'string') {
        current[key] = maskIfContainsSecret(current[key]);
      } else if (typeof current[key] === 'object' && current[key] !== null) {
        maskRecursive(current[key]);
      }
    }
  };
  maskRecursive(masked);

  return masked;
}

export function containsSecret(value: string, secretValues: Set<string>): boolean {
  return Array.from(secretValues).some((secret) => value.includes(secret));
}

export function findPotentiallySecretObjectFields(
  obj: any,
  tokenKeys: string[] = POTENTIALLY_SECRET_FIELDS
): string[] {
  const foundTokens: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return foundTokens;
  }

  const searchInObject = (currentObj: any) => {
    if (!currentObj || typeof currentObj !== 'object') {
      return;
    }

    if (Array.isArray(currentObj)) {
      for (const item of currentObj) {
        searchInObject(item);
      }
      return;
    }

    for (const key in currentObj) {
      const value = currentObj[key];

      // Check if the key matches any of the token keys (case-insensitive)
      if (tokenKeys.some((tokenKey) => tokenKey.toLowerCase() === key.toLowerCase())) {
        if (typeof value === 'string' && value.trim()) {
          foundTokens.push(value);
        }
      }

      if (value && typeof value === 'object') {
        searchInObject(value);
      }
    }
  };

  searchInObject(obj);
  return foundTokens;
}
