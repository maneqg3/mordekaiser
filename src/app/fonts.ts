import localFont from 'next/font/local';

export const display = localFont({
  src: '../fonts/big-shoulders-900.woff2',
  weight: '900',
  variable: '--font-display',
  display: 'swap',
});

export const blackletter = localFont({
  src: '../fonts/grenze-gotisch-900.woff2',
  weight: '900',
  variable: '--font-blackletter',
  display: 'swap',
});

// Inter 400 e JetBrains 700 saíram do carregamento: nenhum uso na Fase 2, e
// cada preload de fonte compete banda com a Big Shoulders que define o LCP
// (o h1 do hero é o LCP; Lighthouse caía para 0.94 no runner do CI).
// Recolocar o peso quando algum elemento realmente o usar.
export const body = localFont({
  src: '../fonts/inter-300.woff2',
  weight: '300',
  variable: '--font-body',
  display: 'swap',
});

export const mono = localFont({
  src: '../fonts/jetbrains-mono-400.woff2',
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
});
