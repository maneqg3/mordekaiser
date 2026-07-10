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

export const body = localFont({
  src: [
    { path: '../fonts/inter-300.woff2', weight: '300' },
    { path: '../fonts/inter-400.woff2', weight: '400' },
  ],
  variable: '--font-body',
  display: 'swap',
});

export const mono = localFont({
  src: [
    { path: '../fonts/jetbrains-mono-400.woff2', weight: '400' },
    { path: '../fonts/jetbrains-mono-700.woff2', weight: '700' },
  ],
  variable: '--font-mono',
  display: 'swap',
});
