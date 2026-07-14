import { Reader } from "lk-web";

function scan(label: string, w: number, h: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <rect width='100%' height='100%' fill='#fbf7f0'/>
    <rect x='8%' y='10%' width='84%' height='5%' fill='#30302e' opacity='0.15'/>
    <rect x='8%' y='22%' width='84%' height='60%' fill='#30302e' opacity='0.05'/>
    <text x='50%' y='92%' font-family='Georgia,serif' font-size='30' fill='#5a5a58'
      text-anchor='middle'>${label}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/**
 * Full reader shell: the paged stage plus its control bar. Uses a single-page
 * issue so every mounted <img> is on-screen — the reader keeps all pages
 * mounted and lazy-loads the off-view ones, which never paint in a static
 * capture. A live multi-page issue flips between openings via the controls.
 */
export function Issue() {
  const pages = [
    { src: scan("vāks", 700, 990), width: 700, height: 990, isSpread: false },
  ];
  return <Reader pages={pages} hotspots={[]} />;
}
