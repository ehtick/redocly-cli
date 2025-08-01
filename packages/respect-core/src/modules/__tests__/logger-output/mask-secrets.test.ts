import {
  findPotentiallySecretObjectFields,
  containsSecret,
  maskSecrets,
} from '../../logger-output/mask-secrets.js';

describe('findPotentiallySecretObjectFields', () => {
  it('should find potentially secret object fields', () => {
    const obj = {
      token: 'token123456',
      accessToken: 'accessToken789',
      idToken: 'idToken012',
      password: 'password345',
      access_token: 'access_token678',
      id_token: 'id_token901',
      accessToken2: 'accessToken234',
      idToken2: 'idToken567',
      client_secret: 'some_client_secret',
      access_token2: 'access_token123',
      id_token2: 'id_token456',
      name: 'John Doe',
      age: 30,
      isAdmin: true,
      address: {
        street: '123 Main St',
        city: 'Anytown',
        zip: '12345',
        personal: {
          favoritePassword: 'favoritePassword123',
          password: 'password123',
          color: 'red',
        },
      },
    };

    const result = findPotentiallySecretObjectFields(obj);
    expect(result).toEqual([
      'token123456',
      'password345',
      'access_token678',
      'id_token901',
      'some_client_secret',
      'password123',
    ]);
  });
});

describe('containsSecret', () => {
  it('should return true if the value contains a secret', () => {
    const result = containsSecret('token123456', new Set(['token123456']));
    expect(result).toBe(true);
  });

  it('should return false if the value does not contain a secret', () => {
    const result = containsSecret('token123456', new Set(['token123456']));
    expect(result).toBe(true);
  });

  it('should return true if the value contains a secret in different casing', () => {
    const result = containsSecret('token123456', new Set(['token123456']));
    expect(result).toBe(true);
  });
});

describe('maskSecrets', () => {
  it('should mask secrets', () => {
    const result = maskSecrets('token123456', new Set(['token123456']));
    expect(result).toEqual('********');
  });

  it('should mask secrets in different casing', () => {
    const result = maskSecrets('token123456', new Set(['token123456']));
    expect(result).toEqual('********');
  });

  it('should mask secrets in nested object', () => {
    const result = maskSecrets(
      { token: 'token123456', nested: { password: 'password123456' } },
      new Set(['token123456'])
    );
    expect(result).toEqual({
      nested: {
        password: 'password123456',
      },
      token: '********',
    });
  });

  it('should mask secrets in array', () => {
    const result = maskSecrets(['token123456', 'password123456'], new Set(['token123456']));
    expect(result).toEqual(['********', 'password123456']);
  });

  it('should mask secrets in string', () => {
    const result = maskSecrets('Bearer token123456', new Set(['token123456']));
    expect(result).toEqual('Bearer ********');
  });
});
