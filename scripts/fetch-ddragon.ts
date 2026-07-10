import { access, mkdir, writeFile } from 'node:fs/promises';
import {
  parseChampion,
  pickChampionData,
  type ChampionData,
} from '../src/lib/ddragon';

const DDRAGON = 'https://ddragon.leagueoflegends.com';
const LOCALES = { en: 'en_US', 'pt-br': 'pt_BR' } as const;
const DATA_DIR = 'src/data';
const ASSET_DIR = 'public/champion';

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
  return response.json();
}

async function downloadTo(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
  await writeFile(dest, Buffer.from(await response.arrayBuffer()));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const outputs = Object.keys(LOCALES).map(
    (locale) => `${DATA_DIR}/mordekaiser.${locale}.json`,
  );
  if (
    !process.env.FORCE_DDRAGON &&
    (await Promise.all(outputs.map(fileExists))).every(Boolean)
  ) {
    console.log(
      'ddragon: dados presentes, pulando (FORCE_DDRAGON=1 força refetch)',
    );
    return;
  }

  const versions = (await fetchJson(`${DDRAGON}/api/versions.json`)) as string[];
  const version = versions[0];
  console.log(`ddragon: patch ${version}`);

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(ASSET_DIR, { recursive: true });

  const byLocale = new Map<string, ChampionData>();
  for (const [locale, riotLocale] of Object.entries(LOCALES)) {
    byLocale.set(
      locale,
      pickChampionData(
        parseChampion(
          await fetchJson(
            `${DDRAGON}/cdn/${version}/data/${riotLocale}/champion/Mordekaiser.json`,
          ),
        ),
      ),
    );
  }

  const champion = byLocale.get('en')!;
  const assets: Array<[string, string]> = [
    [
      `${DDRAGON}/cdn/${version}/img/passive/${champion.passive.icon}`,
      `${ASSET_DIR}/${champion.passive.icon}`,
    ],
    ...champion.spells.map((spell): [string, string] => [
      `${DDRAGON}/cdn/${version}/img/spell/${spell.icon}`,
      `${ASSET_DIR}/${spell.icon}`,
    ]),
    ...champion.skins.map((skin): [string, string] => [
      `${DDRAGON}/cdn/img/champion/splash/Mordekaiser_${skin.num}.jpg`,
      `${ASSET_DIR}/splash-${skin.num}.jpg`,
    ]),
  ];
  for (const [url, dest] of assets) {
    await downloadTo(url, dest);
    console.log(`ddragon: baixado ${dest}`);
  }

  // Os JSON são o marcador de "terminou": gravados só depois dos assets, para
  // que um crash no meio do download não faça a próxima execução pular tudo.
  for (const [locale, data] of byLocale) {
    await writeFile(
      `${DATA_DIR}/mordekaiser.${locale}.json`,
      `${JSON.stringify(data, null, 2)}\n`,
    );
    console.log(`ddragon: gravado ${DATA_DIR}/mordekaiser.${locale}.json`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
