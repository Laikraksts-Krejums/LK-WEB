import { PageList } from "lk-web";

function scan(label: string, w: number, h: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <rect width='100%' height='100%' fill='#fbf7f0'/>
    <rect x='6%' y='8%' width='88%' height='6%' fill='#30302e' opacity='0.15'/>
    <text x='50%' y='50%' font-family='Georgia,serif' font-size='28' fill='#5a5a58'
      text-anchor='middle'>${label}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const noop = () => {};

const hotspots = [
  {
    pageNumber: 1,
    left: 10,
    right: 55,
    top: 20,
    height: 40,
    href: "/numuri/12/2",
    label: "raksts",
  },
];

/**
 * Single page view — the cover, or any odd page facing a spread. Each cell
 * passes only the visible page so every mounted <img> is on-screen: PageList
 * keeps all pages mounted and lazy-loads the hidden ones, which never paint
 * in a static capture.
 */
export function SinglePage() {
  const pages = [
    { src: scan("1. lpp.", 700, 990), width: 700, height: 990, isSpread: false },
  ];
  return (
    <PageList pages={pages} hotspots={[]} view={{ pages: [0] }} registerImg={noop} />
  );
}

/** A landscape spread scan shown whole — one image, one printed opening. */
export function Spread() {
  const pages = [
    { src: scan("2–3. lpp.", 1400, 990), width: 1400, height: 990, isSpread: true },
  ];
  return (
    <PageList
      pages={pages}
      hotspots={hotspots}
      view={{ pages: [0] }}
      registerImg={noop}
    />
  );
}
