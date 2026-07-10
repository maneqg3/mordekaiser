// As placas convergindo em silhueta de torre — o motivo do sigilo
// (spec mãe §3). Abstratas e estilizadas, não réplica do jogo.
export function ForgePlates() {
  return (
    <svg aria-hidden viewBox="0 0 200 280" className="mx-auto w-40 sm:w-52">
      <g fill="#111314" stroke="#7effb6" strokeOpacity="0.35" strokeWidth="1">
        <polygon points="70,270 130,270 126,240 74,240" />
        <polygon points="74,234 126,234 122,200 78,200" />
        <polygon points="78,194 122,194 118,160 82,160" />
        <polygon points="82,154 118,154 114,118 86,118" />
        <polygon points="86,112 114,112 110,80 90,80" />
        <polygon points="90,74 110,74 106,46 94,46" />
        <polygon points="94,40 106,40 100,10" />
      </g>
    </svg>
  );
}
