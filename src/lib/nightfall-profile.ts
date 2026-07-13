// Gerado por scripts/derive-nightfall-profile.mjs — NÃO editar à mão.
// Perfil da Véu da Noite (spec 4.5 §3): silhueta medida offline do STL de
// referência (asset da Riot, fora do repo). Só números — runtime procedural.
// y normalizado 0→1 no eixo maior; halfWidth em fração da altura.
export type ProfileSample = { y: number; halfWidth: number };

export const NIGHTFALL_PROFILE: readonly ProfileSample[] = [
  { y: 0.0000, halfWidth: 0.0195 },
  { y: 0.0714, halfWidth: 0.0195 },
  { y: 0.1429, halfWidth: 0.0464 },
  { y: 0.2143, halfWidth: 0.0271 },
  { y: 0.2857, halfWidth: 0.0204 },
  { y: 0.3571, halfWidth: 0.0161 },
  { y: 0.4286, halfWidth: 0.0118 },
  { y: 0.5000, halfWidth: 0.0119 },
  { y: 0.5714, halfWidth: 0.0160 },
  { y: 0.6429, halfWidth: 0.0328 },
  { y: 0.7143, halfWidth: 0.0914 },
  { y: 0.7857, halfWidth: 0.1232 },
  { y: 0.8571, halfWidth: 0.1246 },
  { y: 0.9286, halfWidth: 0.1681 },
  { y: 1.0000, halfWidth: 0.1238 },
];
