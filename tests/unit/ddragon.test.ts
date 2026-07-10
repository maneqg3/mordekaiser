import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parseChampion, pickChampionData } from '@/lib/ddragon';

const fixture: unknown = JSON.parse(
  readFileSync('tests/fixtures/mordekaiser.en.json', 'utf8'),
);

describe('parseChampion', () => {
  test('aceita a resposta real do Data Dragon', () => {
    const parsed = parseChampion(fixture);
    expect(parsed.version).toBe('26.13.1');
    expect(parsed.data.Mordekaiser.spells).toHaveLength(4);
  });

  test('rejeita payload sem as 4 spells, com erro legível', () => {
    const broken = structuredClone(fixture) as {
      data: { Mordekaiser: { spells: unknown[] } };
    };
    broken.data.Mordekaiser.spells.pop();
    expect(() => parseChampion(broken)).toThrowError(/spells/);
  });

  test('rejeita payload sem campo obrigatório, com caminho no erro', () => {
    const broken = structuredClone(fixture) as {
      data: { Mordekaiser: { passive?: unknown } };
    };
    delete broken.data.Mordekaiser.passive;
    expect(() => parseChampion(broken)).toThrowError(/passive/);
  });

  test('rejeita não-objeto', () => {
    expect(() => parseChampion('lixo')).toThrowError();
  });
});

describe('pickChampionData', () => {
  test('devolve só os campos que a página usa, achatados', () => {
    const data = pickChampionData(parseChampion(fixture));
    expect(data).toEqual({
      version: '26.13.1',
      name: 'Mordekaiser',
      title: 'the Iron Revenant',
      lore: 'Twice slain and thrice born, Mordekaiser is a brutal warlord from a foregone epoch.',
      passive: {
        name: 'Darkness Rise',
        description:
          'Mordekaiser gains a powerful damage aura and movement speed after landing 3 attacks or spells against champions.',
        icon: 'MordekaiserPassive.png',
      },
      spells: [
        {
          id: 'MordekaiserQ',
          name: 'Obliterate',
          description: 'Mordekaiser smashes the ground with his mace.',
          tooltip: 'Smash the ground dealing {{ totaldamage }} damage.',
          cooldownBurn: '9/8.25/7.5/6.75/6',
          costBurn: '0',
          rangeBurn: '625',
          icon: 'MordekaiserQ.png',
        },
        {
          id: 'MordekaiserW',
          name: 'Indestructible',
          description: 'Mordekaiser stores damage to form a shield.',
          tooltip: 'Gain a shield of {{ shieldamount }}.',
          cooldownBurn: '12/11/10/9/8',
          costBurn: '0',
          rangeBurn: 'self',
          icon: 'MordekaiserW.png',
        },
        {
          id: 'MordekaiserE',
          name: "Death's Grasp",
          description: 'Mordekaiser pulls enemies toward him.',
          tooltip: 'Pull enemies dealing {{ totaldamage }} damage.',
          cooldownBurn: '18/16.5/15/13.5/12',
          costBurn: '0',
          rangeBurn: '900',
          icon: 'MordekaiserE.png',
        },
        {
          id: 'MordekaiserR',
          name: 'Realm of Death',
          description: 'Mordekaiser drags his victim to the Death Realm.',
          tooltip: 'Banish a champion for {{ rduration }} seconds.',
          cooldownBurn: '140/120/100',
          costBurn: '0',
          rangeBurn: '650',
          icon: 'MordekaiserR.png',
        },
      ],
      skins: [
        { num: 0, name: 'default' },
        { num: 1, name: 'Dragon Knight Mordekaiser' },
      ],
    });
  });
});
