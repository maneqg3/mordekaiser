import { expect, test } from 'vitest';
import en from '@/i18n/messages/en.json';
import ptBr from '@/i18n/messages/pt-br.json';

function flatKeys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value) || typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flatKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

test('en e pt-br têm exatamente as mesmas chaves', () => {
  expect(flatKeys(ptBr).sort()).toEqual(flatKeys(en).sort());
});

test('todos os body de lore têm pelo menos 2 parágrafos', () => {
  for (const messages of [en, ptBr]) {
    for (const ns of ['wildlands', 'greyWaste', 'forge', 'realm'] as const) {
      expect(
        (messages as Record<string, { body?: string[] }>)[ns]?.body?.length ?? 0,
      ).toBeGreaterThanOrEqual(2);
    }
  }
});
