/**
 * Deterministic, original SVG demo artwork for Boop's seeded tests.
 *
 * These are drawn by hand in code — no image model, no reference to any real
 * brand or living artist's work. They are abstract editorial design mockups:
 * the kind of artefact a builder would actually A/B, rendered in the Boop
 * palette (paper white, black geometry, hairline rules).
 *
 * `scripts/generate-demo-assets.ts` writes them to `public/generated/`. They
 * are committed, so the app never depends on a generation step to look alive.
 */

const INK = "#111111";
const MUTED = "#8a8a87";
const LINE = "#e4e4e1";
const PAPER = "#ffffff";
const SAND = "#f7f7f5";

type Asset = { name: string; svg: string };

function doc(w: number, h: number, body: string, bg = PAPER): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.045"/></feComponentTransfer>
  </filter>
</defs>
<rect width="${w}" height="${h}" fill="${bg}"/>
${body}
<rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5" style="mix-blend-mode:multiply"/>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${LINE}"/>
</svg>`;
}

const FONT =
  "Geist, Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

function text(
  x: number,
  y: number,
  value: string,
  opts: {
    size?: number;
    weight?: number;
    fill?: string;
    anchor?: "start" | "middle" | "end";
    tracking?: number;
    upper?: boolean;
  } = {},
): string {
  const {
    size = 16,
    weight = 400,
    fill = INK,
    anchor = "start",
    tracking = 0,
    upper = false,
  } = opts;
  const content = (upper ? value.toUpperCase() : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${tracking}">${content}</text>`;
}

function bar(x: number, y: number, w: number, h: number, fill = LINE, r = 3) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
}

function pill(x: number, y: number, w: number, h: number, label: string, dark = true) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${dark ? INK : "none"}" stroke="${dark ? "none" : LINE}"/>
${text(x + w / 2, y + h / 2 + 4.5, label, { size: 13, weight: 500, fill: dark ? PAPER : INK, anchor: "middle" })}`;
}

function textLines(
  x: number,
  y: number,
  widths: number[],
  gap = 12,
  h = 7,
  fill = LINE,
) {
  return widths
    .map((w, i) => bar(x, y + i * (h + gap), w, h, fill, h / 2))
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/* Landing page heroes                                                         */
/* -------------------------------------------------------------------------- */

function browserChrome(w: number): string {
  return `<rect x="0" y="0" width="${w}" height="34" fill="${SAND}"/>
<line x1="0" y1="34" x2="${w}" y2="34" stroke="${LINE}"/>
<circle cx="20" cy="17" r="4" fill="${LINE}"/><circle cx="36" cy="17" r="4" fill="${LINE}"/><circle cx="52" cy="17" r="4" fill="${LINE}"/>
<rect x="74" y="9" width="200" height="16" rx="8" fill="${PAPER}" stroke="${LINE}"/>`;
}

function heroCentered(): string {
  const W = 1280;
  const H = 800;
  return doc(
    W,
    H,
    `${browserChrome(W)}
<line x1="0" y1="96" x2="${W}" y2="96" stroke="${LINE}"/>
${text(56, 70, "northwind", { size: 19, weight: 500, tracking: -0.6 })}
${bar(880, 62, 54, 8, LINE, 4)}${bar(954, 62, 44, 8, LINE, 4)}${bar(1018, 62, 60, 8, LINE, 4)}
${pill(1108, 52, 116, 28, "Get started")}

${text(W / 2, 238, "Move money", { size: 80, weight: 500, anchor: "middle", tracking: -3.4 })}
${text(W / 2, 318, "without the wait.", { size: 80, weight: 500, anchor: "middle", tracking: -3.4 })}
${text(W / 2, 366, "Settlement infrastructure for teams that ship on Fridays.", { size: 19, fill: MUTED, anchor: "middle" })}
${pill(W / 2 - 176, 404, 168, 44, "Start building")}
${pill(W / 2 + 8, 404, 168, 44, "Read the docs", false)}

<rect x="216" y="516" width="848" height="236" rx="10" fill="${PAPER}" stroke="${LINE}"/>
<line x1="216" y1="562" x2="1064" y2="562" stroke="${LINE}"/>
${bar(240, 537, 78, 9, LINE, 4)}${bar(330, 537, 54, 9, LINE, 4)}
${textLines(248, 592, [150, 108, 132], 14, 8)}
<line x1="440" y1="562" x2="440" y2="752" stroke="${LINE}"/>
${[0, 1, 2, 3].map((i) => `<rect x="${472 + i * 148}" y="${640 - i * 22}" width="94" height="${72 + i * 22}" rx="4" fill="${i === 3 ? INK : LINE}"/>`).join("")}
${text(248, 700, "$2.4m", { size: 30, weight: 500, tracking: -1.2 })}
${text(248, 722, "settled today", { size: 12, fill: MUTED, upper: true, tracking: 1.3 })}`,
  );
}

function heroSplit(): string {
  const W = 1280;
  const H = 800;
  return doc(
    W,
    H,
    `${browserChrome(W)}
<line x1="0" y1="96" x2="${W}" y2="96" stroke="${LINE}"/>
${text(56, 70, "northwind", { size: 19, weight: 500, tracking: -0.6 })}
${bar(900, 62, 54, 8, LINE, 4)}${bar(974, 62, 44, 8, LINE, 4)}
${pill(1108, 52, 116, 28, "Get started")}

${text(72, 218, "Settlement,", { size: 74, weight: 500, tracking: -3.2 })}
${text(72, 292, "same day.", { size: 74, weight: 500, tracking: -3.2 })}
<rect x="72" y="330" width="42" height="2" fill="${INK}"/>
${text(72, 380, "Northwind moves money between your accounts, your", { size: 18, fill: MUTED })}
${text(72, 406, "vendors and your ledger — in one API call.", { size: 18, fill: MUTED })}
${pill(72, 446, 156, 44, "Start building")}
${text(252, 474, "No card required", { size: 14, fill: MUTED })}

${text(72, 600, "Trusted by teams at", { size: 11, fill: MUTED, upper: true, tracking: 1.6 })}
${[0, 1, 2, 3].map((i) => bar(72 + i * 108, 624, 78, 12, LINE, 6)).join("")}

<rect x="704" y="150" width="504" height="560" rx="12" fill="${SAND}" stroke="${LINE}"/>
<rect x="736" y="186" width="440" height="180" rx="8" fill="${PAPER}" stroke="${LINE}"/>
${text(760, 226, "Payout", { size: 12, fill: MUTED, upper: true, tracking: 1.4 })}
${text(760, 272, "$18,420.00", { size: 38, weight: 500, tracking: -1.5 })}
${bar(760, 296, 168, 8, LINE, 4)}
<rect x="760" y="320" width="100" height="26" rx="13" fill="${INK}"/>
${text(810, 337, "Settled", { size: 12, weight: 500, fill: PAPER, anchor: "middle" })}
${[0, 1, 2].map((i) => `<rect x="736" y="${394 + i * 74}" width="440" height="58" rx="8" fill="${PAPER}" stroke="${LINE}"/>
<circle cx="770" cy="${423 + i * 74}" r="12" fill="${i === 0 ? INK : LINE}"/>
${bar(794, 412 + i * 74, 120, 8, LINE, 4)}${bar(794, 428 + i * 74, 72, 7, LINE, 4)}
${bar(1096, 419 + i * 74, 56, 9, LINE, 4)}`).join("\n")}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Logos                                                                       */
/* -------------------------------------------------------------------------- */

function logoGeometric(): string {
  const S = 900;
  return doc(
    S,
    S,
    `<rect x="60" y="60" width="${S - 120}" height="${S - 120}" fill="${SAND}"/>
<g transform="translate(450 396)">
  <path d="M -96 72 L 0 -96 L 96 72 Z" fill="none" stroke="${INK}" stroke-width="14" stroke-linejoin="round"/>
  <circle cx="0" cy="18" r="26" fill="${INK}"/>
</g>
${text(450, 574, "halcyon", { size: 54, weight: 500, anchor: "middle", tracking: -2.4 })}
${text(450, 616, "Field research tools", { size: 14, fill: MUTED, anchor: "middle", upper: true, tracking: 2.4 })}
<line x1="60" y1="700" x2="840" y2="700" stroke="${LINE}"/>
<g transform="translate(140 750)">
  <path d="M -16 12 L 0 -16 L 16 12 Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="0" cy="3" r="4.4" fill="${INK}"/>
</g>
${text(180, 757, "16px", { size: 13, fill: MUTED })}
<g transform="translate(300 750) scale(0.55)">
  <path d="M -16 12 L 0 -16 L 16 12 Z" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="0" cy="3" r="4.4" fill="${INK}"/>
</g>`,
  );
}

function logoMonogram(): string {
  const S = 900;
  return doc(
    S,
    S,
    `<rect x="60" y="60" width="${S - 120}" height="${S - 120}" fill="${SAND}"/>
<g transform="translate(450 390)">
  <rect x="-92" y="-92" width="184" height="184" rx="46" fill="${INK}"/>
  <path d="M -34 40 L -34 -40 L 12 -40 A 30 30 0 0 1 12 8 L -34 8" fill="none" stroke="${PAPER}" stroke-width="15" stroke-linecap="square"/>
  <path d="M -6 8 L 40 40" fill="none" stroke="${PAPER}" stroke-width="15" stroke-linecap="square"/>
</g>
${text(450, 574, "halcyon", { size: 54, weight: 500, anchor: "middle", tracking: -2.4 })}
${text(450, 616, "Field research tools", { size: 14, fill: MUTED, anchor: "middle", upper: true, tracking: 2.4 })}
<line x1="60" y1="700" x2="840" y2="700" stroke="${LINE}"/>
<g transform="translate(140 750)">
  <rect x="-15" y="-15" width="30" height="30" rx="8" fill="${INK}"/>
  <path d="M -5 7 L -5 -7 L 2 -7 A 5 5 0 0 1 2 1 L -5 1" fill="none" stroke="${PAPER}" stroke-width="2.6"/>
</g>
${text(180, 757, "16px", { size: 13, fill: MUTED })}
<g transform="translate(300 750) scale(0.55)">
  <rect x="-15" y="-15" width="30" height="30" rx="8" fill="${INK}"/>
  <path d="M -5 7 L -5 -7 L 2 -7 A 5 5 0 0 1 2 1 L -5 1" fill="none" stroke="${PAPER}" stroke-width="4"/>
</g>`,
  );
}

/* -------------------------------------------------------------------------- */
/* Pricing tables                                                              */
/* -------------------------------------------------------------------------- */

function pricingTable(featuredIndex: number, style: "cards" | "table"): string {
  const W = 1280;
  const H = 900;
  const plans = [
    { name: "Starter", price: "$0", note: "For one project" },
    { name: "Team", price: "$24", note: "Per seat, monthly" },
    { name: "Scale", price: "$79", note: "Per seat, monthly" },
  ];

  if (style === "cards") {
    return doc(
      W,
      H,
      `${text(W / 2, 148, "Simple pricing", { size: 60, weight: 500, anchor: "middle", tracking: -2.6 })}
${text(W / 2, 192, "Start free. Upgrade when the team grows.", { size: 18, fill: MUTED, anchor: "middle" })}
${plans
  .map((p, i) => {
    const x = 124 + i * 348;
    const feat = i === featuredIndex;
    return `<rect x="${x}" y="${feat ? 250 : 274}" width="316" height="${feat ? 420 : 372}" rx="12" fill="${feat ? INK : PAPER}" stroke="${feat ? INK : LINE}"/>
${text(x + 32, (feat ? 250 : 274) + 46, p.name, { size: 16, weight: 500, fill: feat ? PAPER : INK })}
${text(x + 32, (feat ? 250 : 274) + 116, p.price, { size: 56, weight: 500, fill: feat ? PAPER : INK, tracking: -2.4 })}
${text(x + 32, (feat ? 250 : 274) + 146, p.note, { size: 13, fill: feat ? "#b8b8b6" : MUTED })}
${[0, 1, 2, 3, 4]
  .map(
    (k) =>
      `<circle cx="${x + 38}" cy="${(feat ? 250 : 274) + 196 + k * 34}" r="3.4" fill="${feat ? PAPER : INK}"/>` +
      bar(x + 54, (feat ? 250 : 274) + 192 + k * 34, 150 - k * 14, 8, feat ? "#4a4a4a" : LINE, 4),
  )
  .join("")}
<rect x="${x + 32}" y="${(feat ? 250 : 274) + (feat ? 356 : 308)}" width="252" height="42" rx="21" fill="${feat ? PAPER : "none"}" stroke="${feat ? "none" : LINE}"/>
${text(x + 158, (feat ? 250 : 274) + (feat ? 383 : 335), feat ? "Start free trial" : "Choose plan", { size: 13, weight: 500, fill: feat ? INK : INK, anchor: "middle" })}`;
  })
  .join("\n")}
${text(W / 2, 760, "All plans include unlimited projects and the full API.", { size: 14, fill: MUTED, anchor: "middle" })}
<line x1="124" y1="800" x2="1156" y2="800" stroke="${LINE}"/>
${[0, 1, 2, 3].map((i) => bar(124 + i * 268, 834, 120, 10, LINE, 5)).join("")}`,
    );
  }

  return doc(
    W,
    H,
    `${text(124, 148, "Pricing", { size: 60, weight: 500, tracking: -2.6 })}
${text(124, 192, "One table. No sales call.", { size: 18, fill: MUTED })}
<rect x="124" y="250" width="1032" height="520" rx="12" fill="${PAPER}" stroke="${LINE}"/>
<line x1="124" y1="330" x2="1156" y2="330" stroke="${LINE}"/>
${plans
  .map((p, i) => {
    const x = 468 + i * 232;
    const feat = i === featuredIndex;
    return `${feat ? `<rect x="${x - 16}" y="250" width="232" height="520" fill="${SAND}"/><line x1="${x - 16}" y1="250" x2="${x - 16}" y2="770" stroke="${LINE}"/><line x1="${x + 216}" y1="250" x2="${x + 216}" y2="770" stroke="${LINE}"/>` : ""}
${text(x, 292, p.name, { size: 15, weight: 500 })}
${text(x, 310, p.note, { size: 11, fill: MUTED })}
${text(x, 384, p.price, { size: 40, weight: 500, tracking: -1.8 })}
<rect x="${x}" y="406" width="150" height="36" rx="18" fill="${feat ? INK : "none"}" stroke="${feat ? "none" : LINE}"/>
${text(x + 75, 429, feat ? "Start" : "Choose", { size: 12, weight: 500, fill: feat ? PAPER : INK, anchor: "middle" })}`;
  })
  .join("\n")}
${[0, 1, 2, 3, 4]
  .map(
    (r) => `<line x1="124" y1="${482 + r * 58}" x2="1156" y2="${482 + r * 58}" stroke="${LINE}"/>
${bar(156, 506 + r * 58, 190 - r * 18, 9, LINE, 4)}
${[0, 1, 2].map((c) => (c >= 2 - Math.floor(r / 2) ? `<circle cx="${476 + c * 232}" cy="${510 + r * 58}" r="5" fill="${INK}"/>` : `<line x1="${470 + c * 232}" y1="${510 + r * 58}" x2="${482 + c * 232}" y2="${510 + r * 58}" stroke="${LINE}" stroke-width="2"/>`)).join("")}`,
  )
  .join("\n")}
${text(124, 834, "Prices in USD. Cancel any time.", { size: 13, fill: MUTED })}`,
  );
}

/* -------------------------------------------------------------------------- */
/* App screenshots                                                             */
/* -------------------------------------------------------------------------- */

function appScreenshot(layout: "sidebar" | "toolbar"): string {
  const W = 1280;
  const H = 800;
  const rows = [0, 1, 2, 3, 4, 5, 6];

  if (layout === "sidebar") {
    return doc(
      W,
      H,
      `<rect x="0" y="0" width="248" height="${H}" fill="${SAND}"/>
<line x1="248" y1="0" x2="248" y2="${H}" stroke="${LINE}"/>
<circle cx="44" cy="46" r="11" fill="${INK}"/>
${text(66, 52, "Ledger", { size: 15, weight: 500 })}
${[0, 1, 2, 3, 4].map((i) => `${i === 1 ? `<rect x="16" y="${100 + i * 40}" width="216" height="32" rx="7" fill="${PAPER}" stroke="${LINE}"/>` : ""}
<circle cx="38" cy="${116 + i * 40}" r="4" fill="${i === 1 ? INK : LINE}"/>
${bar(54, 112 + i * 40, 92 - i * 8, 8, i === 1 ? "#9a9a97" : LINE, 4)}`).join("\n")}
<line x1="16" y1="330" x2="232" y2="330" stroke="${LINE}"/>
${[0, 1, 2].map((i) => `<rect x="30" y="${356 + i * 34}" width="10" height="10" rx="2" fill="${LINE}"/>${bar(54, 357 + i * 34, 76, 8, LINE, 4)}`).join("")}

<line x1="248" y1="76" x2="${W}" y2="76" stroke="${LINE}"/>
${text(288, 48, "Transactions", { size: 17, weight: 500, tracking: -0.5 })}
${pill(1140, 30, 104, 30, "Export", false)}
${pill(1024, 30, 104, 30, "New")}

${[0, 1, 2].map((i) => `<rect x="${288 + i * 312}" y="112" width="284" height="116" rx="10" fill="${PAPER}" stroke="${LINE}"/>
${text(312 + i * 312, 146, ["Balance", "Pending", "Settled"][i] ?? "", { size: 11, fill: MUTED, upper: true, tracking: 1.4 })}
${text(312 + i * 312, 192, ["$84,210", "$6,004", "$78,206"][i] ?? "", { size: 30, weight: 500, tracking: -1.2 })}`).join("\n")}

<rect x="288" y="260" width="908" height="490" rx="10" fill="${PAPER}" stroke="${LINE}"/>
<line x1="288" y1="306" x2="1196" y2="306" stroke="${LINE}"/>
${[0, 1, 2, 3].map((i) => bar(316 + i * 230, 281, 70, 8, LINE, 4)).join("")}
${rows.map((r) => `<line x1="288" y1="${306 + (r + 1) * 62}" x2="1196" y2="${306 + (r + 1) * 62}" stroke="${LINE}"/>
<circle cx="326" cy="${337 + r * 62}" r="11" fill="${r === 0 ? INK : LINE}"/>
${bar(348, 326 + r * 62, 118, 8, LINE, 4)}${bar(348, 342 + r * 62, 70, 7, LINE, 4)}
${bar(546, 333 + r * 62, 88 - r * 4, 8, LINE, 4)}
${bar(776, 333 + r * 62, 64, 8, LINE, 4)}
<rect x="1040" y="${326 + r * 62}" width="76" height="22" rx="11" fill="${r % 3 === 0 ? INK : "none"}" stroke="${r % 3 === 0 ? "none" : LINE}"/>`).join("\n")}`,
    );
  }

  return doc(
    W,
    H,
    `<line x1="0" y1="62" x2="${W}" y2="62" stroke="${LINE}"/>
<circle cx="44" cy="32" r="10" fill="${INK}"/>
${text(66, 38, "Ledger", { size: 15, weight: 500 })}
${[0, 1, 2, 3].map((i) => `${i === 0 ? `<line x1="${168 + i * 108}" y1="61" x2="${230 + i * 108}" y2="61" stroke="${INK}" stroke-width="2"/>` : ""}${bar(168 + i * 108, 28, 62, 8, i === 0 ? "#6e6e6b" : LINE, 4)}`).join("")}
${pill(1140, 18, 104, 28, "New")}

<rect x="0" y="62" width="${W}" height="188" fill="${SAND}"/>
<line x1="0" y1="250" x2="${W}" y2="250" stroke="${LINE}"/>
${text(64, 130, "Transactions", { size: 34, weight: 500, tracking: -1.4 })}
${text(64, 162, "7 accounts · updated 2 minutes ago", { size: 14, fill: MUTED })}
${[0, 1, 2].map((i) => `<rect x="${736 + i * 160}" y="96" width="148" height="112" rx="10" fill="${PAPER}" stroke="${LINE}"/>
${text(756 + i * 160, 126, ["Balance", "Pending", "Settled"][i] ?? "", { size: 10, fill: MUTED, upper: true, tracking: 1.3 })}
${text(756 + i * 160, 166, ["$84.2k", "$6.0k", "$78.2k"][i] ?? "", { size: 24, weight: 500, tracking: -1 })}`).join("\n")}

${[0, 1, 2, 3].map((i) => `<rect x="${64 + i * 96}" y="286" width="82" height="30" rx="15" fill="${i === 0 ? INK : "none"}" stroke="${i === 0 ? "none" : LINE}"/>`).join("")}
${rows.map((r) => `<line x1="64" y1="${414 + r * 52}" x2="1216" y2="${414 + r * 52}" stroke="${LINE}"/>
<circle cx="86" cy="${388 + r * 52}" r="10" fill="${r === 1 ? INK : LINE}"/>
${bar(110, 378 + r * 52, 132, 8, LINE, 4)}${bar(110, 394 + r * 52, 78, 7, LINE, 4)}
${bar(560, 384 + r * 52, 96 - r * 5, 8, LINE, 4)}
${bar(880, 384 + r * 52, 58, 8, LINE, 4)}
${bar(1140, 384 + r * 52, 76, 8, LINE, 4)}`).join("\n")}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Packaging                                                                   */
/* -------------------------------------------------------------------------- */

function coffeeBag(variant: "typographic" | "geometric"): string {
  const W = 900;
  const H = 900;
  const bagX = 260;
  const bagY = 150;
  const bagW = 380;
  const bagH = 600;

  const face =
    variant === "typographic"
      ? `${text(bagX + bagW / 2, bagY + 150, "SLOW", { size: 68, weight: 500, anchor: "middle", tracking: -2 })}
${text(bagX + bagW / 2, bagY + 212, "MORNING", { size: 68, weight: 500, anchor: "middle", tracking: -2 })}
<line x1="${bagX + 56}" y1="${bagY + 252}" x2="${bagX + bagW - 56}" y2="${bagY + 252}" stroke="${INK}"/>
${text(bagX + bagW / 2, bagY + 296, "Ethiopia · Guji", { size: 15, anchor: "middle", fill: MUTED, upper: true, tracking: 2.2 })}
${text(bagX + bagW / 2, bagY + 430, "Washed", { size: 20, anchor: "middle" })}
${text(bagX + bagW / 2, bagY + 462, "Jasmine, peach, black tea", { size: 13, anchor: "middle", fill: MUTED })}
${text(bagX + bagW / 2, bagY + 552, "250g", { size: 14, anchor: "middle", fill: MUTED, upper: true, tracking: 2 })}`
      : `<circle cx="${bagX + bagW / 2}" cy="${bagY + 214}" r="92" fill="none" stroke="${INK}" stroke-width="3"/>
<circle cx="${bagX + bagW / 2}" cy="${bagY + 214}" r="46" fill="${INK}"/>
<path d="M ${bagX + bagW / 2 - 92} ${bagY + 214} A 92 92 0 0 1 ${bagX + bagW / 2 + 92} ${bagY + 214}" fill="${INK}" opacity="0.1"/>
${text(bagX + bagW / 2, bagY + 372, "SLOW MORNING", { size: 26, weight: 500, anchor: "middle", tracking: 1.6 })}
<line x1="${bagX + 90}" y1="${bagY + 402}" x2="${bagX + bagW - 90}" y2="${bagY + 402}" stroke="${LINE}"/>
${text(bagX + bagW / 2, bagY + 438, "Ethiopia · Guji · Washed", { size: 13, anchor: "middle", fill: MUTED })}
${text(bagX + bagW / 2, bagY + 468, "Jasmine, peach, black tea", { size: 13, anchor: "middle", fill: MUTED })}
<rect x="${bagX + bagW / 2 - 42}" y="${bagY + 520}" width="84" height="30" rx="15" fill="${INK}"/>
${text(bagX + bagW / 2, bagY + 540, "250g", { size: 12, weight: 500, fill: PAPER, anchor: "middle" })}`;

  return doc(
    W,
    H,
    `<rect x="0" y="0" width="${W}" height="${H}" fill="${SAND}"/>
<ellipse cx="${W / 2}" cy="${bagY + bagH + 26}" rx="${bagW / 2 + 18}" ry="14" fill="${INK}" opacity="0.06"/>
<path d="M ${bagX} ${bagY + 30} L ${bagX + 40} ${bagY} L ${bagX + bagW - 40} ${bagY} L ${bagX + bagW} ${bagY + 30} L ${bagX + bagW} ${bagY + bagH} L ${bagX} ${bagY + bagH} Z" fill="${PAPER}" stroke="${LINE}"/>
<path d="M ${bagX} ${bagY + 30} L ${bagX + 40} ${bagY} L ${bagX + bagW - 40} ${bagY} L ${bagX + bagW} ${bagY + 30} Z" fill="${SAND}" stroke="${LINE}"/>
${face}
<line x1="${bagX + bagW - 1}" y1="${bagY + 30}" x2="${bagX + bagW - 1}" y2="${bagY + bagH}" stroke="${LINE}"/>`,
    PAPER,
  );
}

/* -------------------------------------------------------------------------- */
/* Launch / campaign graphics                                                  */
/* -------------------------------------------------------------------------- */

function launchGraphic(variant: "type" | "object"): string {
  const W = 1200;
  const H = 675;

  if (variant === "type") {
    return doc(
      W,
      H,
      `<rect width="${W}" height="${H}" fill="${INK}"/>
${text(80, 200, "We rebuilt", { size: 92, weight: 500, fill: PAPER, tracking: -4 })}
${text(80, 292, "the ledger.", { size: 92, weight: 500, fill: PAPER, tracking: -4 })}
<rect x="80" y="330" width="56" height="3" fill="${PAPER}"/>
${text(80, 396, "Same-day settlement is live for every account.", { size: 21, fill: "#9c9c9a" })}
<rect x="80" y="440" width="180" height="48" rx="24" fill="${PAPER}"/>
${text(170, 470, "See what changed", { size: 14, weight: 500, fill: INK, anchor: "middle" })}
${text(80, 608, "northwind", { size: 20, weight: 500, fill: PAPER, tracking: -0.6 })}
<circle cx="1108" cy="120" r="56" fill="none" stroke="#3a3a3a" stroke-width="1"/>
<circle cx="1108" cy="120" r="96" fill="none" stroke="#2a2a2a" stroke-width="1"/>
<circle cx="1108" cy="120" r="18" fill="${PAPER}"/>`,
      INK,
    );
  }

  return doc(
    W,
    H,
    `<rect x="620" y="0" width="580" height="${H}" fill="${SAND}"/>
<line x1="620" y1="0" x2="620" y2="${H}" stroke="${LINE}"/>
${text(72, 96, "Now shipping", { size: 12, fill: MUTED, upper: true, tracking: 2.4 })}
${text(72, 196, "Same-day", { size: 76, weight: 500, tracking: -3.4 })}
${text(72, 268, "settlement.", { size: 76, weight: 500, tracking: -3.4 })}
${text(72, 330, "Every account. No extra fee. Starting today.", { size: 19, fill: MUTED })}
<rect x="72" y="376" width="180" height="48" rx="24" fill="${INK}"/>
${text(162, 406, "See what changed", { size: 14, weight: 500, fill: PAPER, anchor: "middle" })}
${text(72, 592, "northwind", { size: 20, weight: 500, tracking: -0.6 })}

<rect x="700" y="132" width="424" height="140" rx="12" fill="${PAPER}" stroke="${LINE}"/>
${text(728, 176, "Payout · 2,481", { size: 12, fill: MUTED, upper: true, tracking: 1.4 })}
${text(728, 226, "$18,420.00", { size: 40, weight: 500, tracking: -1.7 })}
<rect x="728" y="244" width="96" height="26" rx="13" fill="${INK}"/>
${text(776, 261, "Settled", { size: 12, weight: 500, fill: PAPER, anchor: "middle" })}
<rect x="700" y="300" width="424" height="240" rx="12" fill="${PAPER}" stroke="${LINE}"/>
${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${728 + i * 62}" y="${500 - (40 + i * 26)}" width="40" height="${40 + i * 26}" rx="4" fill="${i === 5 ? INK : LINE}"/>`).join("")}
<line x1="700" y1="500" x2="1124" y2="500" stroke="${LINE}"/>
${text(728, 524, "Settlement time, days → hours", { size: 12, fill: MUTED })}`,
  );
}

/* -------------------------------------------------------------------------- */
/* App icons                                                                   */
/* -------------------------------------------------------------------------- */

function appIcon(variant: "ring" | "slab"): string {
  const S = 800;
  const cx = S / 2;
  const cy = 330;

  const icon =
    variant === "ring"
      ? `<rect x="${cx - 150}" y="${cy - 150}" width="300" height="300" rx="72" fill="${PAPER}" stroke="${LINE}"/>
<circle cx="${cx}" cy="${cy}" r="86" fill="none" stroke="${INK}" stroke-width="16"/>
<circle cx="${cx}" cy="${cy - 86}" r="22" fill="${INK}"/>`
      : `<rect x="${cx - 150}" y="${cy - 150}" width="300" height="300" rx="72" fill="${INK}"/>
<rect x="${cx - 70}" y="${cy - 78}" width="44" height="156" rx="22" fill="${PAPER}"/>
<rect x="${cx + 16}" y="${cy - 30}" width="44" height="108" rx="22" fill="${PAPER}" opacity="0.55"/>`;

  return doc(
    S,
    S,
    `<rect width="${S}" height="${S}" fill="${SAND}"/>
${icon}
${text(cx, 560, "Halcyon", { size: 22, weight: 500, anchor: "middle", tracking: -0.6 })}
<line x1="120" y1="620" x2="680" y2="620" stroke="${LINE}"/>
${[0, 1, 2].map((i) => {
  const s = [1, 0.62, 0.36][i] ?? 1;
  const x = 180 + i * 180;
  return variant === "ring"
    ? `<g transform="translate(${x} 700) scale(${s})"><rect x="-44" y="-44" width="88" height="88" rx="21" fill="${PAPER}" stroke="${LINE}"/><circle cx="0" cy="0" r="25" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="0" cy="-25" r="6.5" fill="${INK}"/></g>`
    : `<g transform="translate(${x} 700) scale(${s})"><rect x="-44" y="-44" width="88" height="88" rx="21" fill="${INK}"/><rect x="-21" y="-23" width="13" height="46" rx="6.5" fill="${PAPER}"/><rect x="5" y="-9" width="13" height="32" rx="6.5" fill="${PAPER}" opacity="0.55"/></g>`;
}).join("\n")}
${text(400, 780, "1024 · 180 · 60", { size: 11, fill: MUTED, anchor: "middle", upper: true, tracking: 2 })}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Product cards                                                               */
/* -------------------------------------------------------------------------- */

function productCard(variant: "stacked" | "inline"): string {
  const W = 900;
  const H = 900;

  if (variant === "stacked") {
    return doc(
      W,
      H,
      `<rect width="${W}" height="${H}" fill="${SAND}"/>
<rect x="150" y="130" width="600" height="640" rx="14" fill="${PAPER}" stroke="${LINE}"/>
<rect x="150" y="130" width="600" height="340" rx="14" fill="${SAND}"/>
<line x1="150" y1="470" x2="750" y2="470" stroke="${LINE}"/>
<g transform="translate(450 300)">
  <rect x="-78" y="-78" width="156" height="156" rx="28" fill="none" stroke="${INK}" stroke-width="2"/>
  <circle cx="0" cy="0" r="40" fill="${INK}"/>
</g>
${text(186, 524, "Field Notebook", { size: 30, weight: 500, tracking: -1.2 })}
${text(186, 556, "Hardcover · 192 pages · dot grid", { size: 15, fill: MUTED })}
${textLines(186, 592, [430, 372], 14, 8)}
${text(186, 692, "$38", { size: 34, weight: 500, tracking: -1.4 })}
<rect x="526" y="662" width="188" height="48" rx="24" fill="${INK}"/>
${text(620, 692, "Add to cart", { size: 14, weight: 500, fill: PAPER, anchor: "middle" })}
${text(186, 734, "Free shipping over $50", { size: 12, fill: MUTED })}`,
    );
  }

  return doc(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${SAND}"/>
<rect x="110" y="240" width="680" height="420" rx="14" fill="${PAPER}" stroke="${LINE}"/>
<rect x="110" y="240" width="300" height="420" rx="14" fill="${SAND}"/>
<line x1="410" y1="240" x2="410" y2="660" stroke="${LINE}"/>
<g transform="translate(260 450)">
  <rect x="-62" y="-62" width="124" height="124" rx="22" fill="none" stroke="${INK}" stroke-width="2"/>
  <circle cx="0" cy="0" r="32" fill="${INK}"/>
</g>
${text(448, 310, "In stock", { size: 11, fill: MUTED, upper: true, tracking: 2 })}
${text(448, 362, "Field Notebook", { size: 30, weight: 500, tracking: -1.2 })}
${text(448, 392, "Hardcover · 192 pages", { size: 15, fill: MUTED })}
${textLines(448, 424, [292, 240, 200], 13, 7)}
${text(448, 560, "$38", { size: 32, weight: 500, tracking: -1.3 })}
<rect x="448" y="588" width="300" height="46" rx="23" fill="${INK}"/>
${text(598, 617, "Add to cart", { size: 14, weight: 500, fill: PAPER, anchor: "middle" })}`,
  );
}

/* -------------------------------------------------------------------------- */

export function demoAssets(): Asset[] {
  return [
    { name: "hero-a", svg: heroCentered() },
    { name: "hero-b", svg: heroSplit() },
    { name: "logo-a", svg: logoGeometric() },
    { name: "logo-b", svg: logoMonogram() },
    { name: "pricing-a", svg: pricingTable(1, "cards") },
    { name: "pricing-b", svg: pricingTable(2, "table") },
    { name: "app-a", svg: appScreenshot("sidebar") },
    { name: "app-b", svg: appScreenshot("toolbar") },
    { name: "packaging-a", svg: coffeeBag("typographic") },
    { name: "packaging-b", svg: coffeeBag("geometric") },
    { name: "launch-a", svg: launchGraphic("type") },
    { name: "launch-b", svg: launchGraphic("object") },
    { name: "icon-a", svg: appIcon("ring") },
    { name: "icon-b", svg: appIcon("slab") },
    { name: "card-a", svg: productCard("stacked") },
    { name: "card-b", svg: productCard("inline") },
  ];
}

/** Prompts used when an image model is configured. Never references a person. */
export const IMAGE_PROMPTS: Record<string, string> = {
  "hero-a":
    "Minimal editorial graphic design poster of a fictional software landing page hero, centered typography layout, off-white paper background, pure black geometric shapes and hairline rules, subtle paper grain, modernist Swiss composition, no logos of real companies, no people, flat vector look",
  "hero-b":
    "Minimal editorial graphic design poster of a fictional software landing page hero, left-aligned split layout with an abstract interface panel on the right, off-white background, black geometry, hairline rules, subtle paper grain, modernist Swiss composition, no real brands, no people, flat vector look",
  "packaging-a":
    "Minimal product photography style illustration of a plain paper coffee bag with purely typographic label, off-white studio background, black type, soft single shadow, modernist packaging design, fictional brand, no people, no real logos",
  "packaging-b":
    "Minimal product photography style illustration of a plain paper coffee bag with a simple black circular geometric mark, off-white studio background, soft single shadow, modernist packaging design, fictional brand, no people, no real logos",
  "icon-a":
    "Minimal abstract app icon study on an off-white background, single rounded square containing a black ring and dot, flat vector, modernist, no text, no real brands",
  "icon-b":
    "Minimal abstract app icon study on an off-white background, single black rounded square containing two white rounded slabs, flat vector, modernist, no text, no real brands",
  "launch-a":
    "Minimal editorial launch announcement graphic, black background, large white grotesk type, one thin white rule, concentric hairline circles, abstract, fictional brand, no people, no real logos",
  "launch-b":
    "Minimal editorial launch announcement graphic, off-white background with abstract black interface cards on the right, large black grotesk type on the left, modernist, fictional brand, no people, no real logos",
};
