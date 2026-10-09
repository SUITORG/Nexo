import { describe, it, expect } from 'vitest';
import { normalizePhoneMX, phoneToEmail, validPassword } from '../../src/lib/phone';

describe('normalizePhoneMX', () => {
  it('10 dígitos locales → E.164', () => {
    expect(normalizePhoneMX('8991234567')).toBe('+528991234567');
  });
  it('con formato +52 y espacios', () => {
    expect(normalizePhoneMX('+52 899 123 4567')).toBe('+528991234567');
  });
  it('móvil con 1 intermedio (521)', () => {
    expect(normalizePhoneMX('+521 55 1234 5678')).toBe('+525512345678');
  });
  it('formato (899) 123-4567', () => {
    expect(normalizePhoneMX('(899) 123-4567')).toBe('+528991234567');
  });
  it('muy corto → null', () => {
    expect(normalizePhoneMX('123')).toBeNull();
  });
  it('vacío → null', () => {
    expect(normalizePhoneMX('')).toBeNull();
  });
  it('null/undefined → null', () => {
    expect(normalizePhoneMX(null as unknown as string)).toBeNull();
    expect(normalizePhoneMX(undefined as unknown as string)).toBeNull();
  });
  it('no puede empezar con 0', () => {
    expect(normalizePhoneMX('0899123456')).toBeNull();
  });
});

describe('phoneToEmail', () => {
  it('email sintético estable', () => {
    expect(phoneToEmail('+528991234567')).toBe('p528991234567@phone.servicioshogar.mx');
  });
});

describe('validPassword', () => {
  it('10 chars letras+números → true', () => {
    expect(validPassword('abc1234567')).toBe(true);
  });
  it('corta → false', () => {
    expect(validPassword('abc123')).toBe(false);
  });
  it('sin número → false', () => {
    expect(validPassword('abcdefghijkl')).toBe(false);
  });
  it('sin letra → false', () => {
    expect(validPassword('1234567890')).toBe(false);
  });
  it('no string → false', () => {
    expect(validPassword(null as unknown as string)).toBe(false);
  });
});
