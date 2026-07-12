// Progresso do scrub da forja (0→1). Objeto mutável lido em useFrame — nunca
// estado React (spec mãe §6): o ScrollTrigger escreve a cada tick de scroll.
export const forgeProgress = { value: 0 };
