// Cáo phó (task 5b.5): draw the obituary card as an image to save or share. Display only:
// every text comes in ready-made from the death screen.
export interface ObituaryData {
  title: string;
  name: string;
  cause: string;
  realm: string;
  epitaph: string;
  badges: { name: string; text: string }[];
  footer: string;
}

const W = 1080;
const H = 1350;
const PAPER = '#f1e6cc';
const INK = '#2b2118';
const MUTED = '#6f5f4c';
const SEAL = '#a8322a';

/** Break text into lines that fit `width` at the current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawObituary(d: ObituaryData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const serif = '"Noto Serif", "Times New Roman", serif';
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(64, 64, W - 128, H - 128);

  // Seal.
  ctx.fillStyle = SEAL;
  ctx.fillRect(W - 220, 110, 110, 110);
  ctx.fillStyle = PAPER;
  ctx.font = `bold 72px ${serif}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('終', W - 165, 168);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MUTED;
  ctx.font = `36px ${serif}`;
  ctx.fillText(d.title, W / 2, 190);
  ctx.fillStyle = INK;
  ctx.font = `bold 92px ${serif}`;
  ctx.fillText(d.name, W / 2, 310);
  ctx.font = `40px ${serif}`;
  ctx.fillText(d.realm, W / 2, 380);
  ctx.fillStyle = MUTED;
  ctx.fillText(d.cause, W / 2, 440);

  let y = 540;
  ctx.fillStyle = INK;
  ctx.font = `italic 42px ${serif}`;
  for (const l of wrap(ctx, `“${d.epitaph}”`, W - 260)) { ctx.fillText(l, W / 2, y); y += 58; }

  y += 40;
  for (const b of d.badges) {
    ctx.fillStyle = SEAL;
    ctx.font = `bold 44px ${serif}`;
    ctx.fillText(`〔${b.name}〕`, W / 2, y);
    y += 50;
    ctx.fillStyle = MUTED;
    ctx.font = `32px ${serif}`;
    for (const l of wrap(ctx, b.text, W - 300)) { ctx.fillText(l, W / 2, y); y += 42; }
    y += 30;
  }

  ctx.fillStyle = MUTED;
  ctx.font = `30px ${serif}`;
  ctx.fillText(d.footer, W / 2, H - 110);
  return canvas;
}

/** Share the card as a PNG where the browser can, else download it. */
export async function shareObituary(d: ObituaryData, fileName: string): Promise<void> {
  const canvas = drawObituary(d);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'));
  if (!blob) return;
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: d.title, text: `${d.name} · ${d.cause}` }); return; } catch { /* cancelled: fall back to saving */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
