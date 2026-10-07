// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { getDevConfig } from '../../src/config/devMode';

describe('devSlot (credenciales QA 3 por perfil)', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('default slot 1', () => {
    localStorage.setItem('devMode', 'true');
    expect(getDevConfig().slot).toBe(1);
  });

  it('lee devSlot del URL param', () => {
    window.history.replaceState({}, '', '/?devMode=true&devSlot=2');
    expect(getDevConfig().slot).toBe(2);
  });

  it('lee devSlot de localStorage', () => {
    localStorage.setItem('devMode', 'true');
    localStorage.setItem('devSlot', '3');
    expect(getDevConfig().slot).toBe(3);
  });

  it('slot inválido cae a 1', () => {
    localStorage.setItem('devMode', 'true');
    localStorage.setItem('devSlot', '9');
    expect(getDevConfig().slot).toBe(1);
  });
});
