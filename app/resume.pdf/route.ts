import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

function pdfString(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/([\\()])/g, "\\$1");
}

function wrap(value: string, maxChars: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function buildPdf(portfolioUrl: string): Buffer {
  const commands: string[] = [];
  const ink = "0.09 0.09 0.09";
  const muted = "0.38 0.38 0.38";
  const blue = "0.09 0.55 0.88";
  const red = "0.63 0.04 0.07";
  let y = 790;

  const text = (value: string, x: number, top: number, size: number, color = ink, bold = false) => {
    commands.push(`${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x} ${top} Tm (${pdfString(value)}) Tj ET`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number, color = "0.84 0.84 0.84", thickness = 0.7) => {
    commands.push(`${color} RG ${thickness} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const section = (label: string) => {
    y -= 25;
    text(label.toUpperCase(), 48, y, 9.4, red, true);
    y -= 17;
  };
  const paragraph = (value: string, maxChars = 100, size = 8.8) => {
    for (const row of wrap(value, maxChars)) {
      text(row, 48, y, size, ink);
      y -= 13;
    }
    y -= 5;
  };
  const project = (name: string, tag: string, description: string) => {
    text(name, 48, y, 10, ink, true);
    text(tag, 210, y + 1, 7.2, muted);
    y -= 14;
    paragraph(description, 102, 9);
  };

  text("SHUBHAM MALVIYA", 48, y, 25, ink, true);
  y -= 22;
  text("SYSTEMS ENGINEER - TEXT ENGINES & COMPILER TOOLING", 48, y, 9.4, blue, true);
  y -= 16;
  text("Ujjain, Madhya Pradesh, India  |  Self-taught software developer & artist", 48, y, 8.5, muted);
  y -= 17;
  line(48, y, PAGE_WIDTH - 48, y, blue, 1.1);

  section("Profile");
  paragraph("Independent developer focused on understanding and building systems beneath the interface. Interested in text processing, binary representation, software architecture, developer tools, and connecting ideas across disciplines. Learns by implementing substantial projects and examining their foundations.", 100, 9.2);

  section("Selected engineering projects");
  project("BitKit", "TYPESCRIPT / BINARY SYSTEMS / IR", "A schema-driven TypeScript toolkit for defining packed binary layouts. Its architecture separates validation, parsing, canonical intermediate representation (IR), and runtime consumption. Focus areas include arbitrary-width integer handling, representation boundaries, and correctness-oriented testing.");
  project("ApeksBidi", "JAVASCRIPT / UNICODE / TEXT ENGINES", "A JavaScript-only implementation of Unicode's Bidirectional Algorithm (UAX #9), targeting Unicode 17. The project explores generated Unicode data and compact internal representations for bidirectional text processing.");
  project("Apeks Editor", "JAVASCRIPT / EDITOR ARCHITECTURE", "A browser-independent rich-text model and editor project, organized around a node-based document model with a dedicated playground.");

  section("Technical foundation");
  paragraph("Languages & platform: JavaScript, TypeScript, HTML, CSS, Node.js. Frontend & application: React, Next.js, responsive interface development. Engineering: schema design, binary data representation, Unicode text processing, software architecture, testing, debugging, and performance analysis. Tools & ecosystem: Git, npm/pnpm, Vitest, fast-check, MongoDB, Express.", 100, 8.9);

  section("Education & independent learning");
  paragraph("Diploma - Central Institute of Plastics Engineering & Technology (CIPET). Self-directed software development study covering web fundamentals, advanced CSS, JavaScript, React, Node.js, TypeScript, algorithms, binary systems, Unicode, and software architecture.", 100, 8.9);

  section("Additional interests");
  paragraph("Visual art and identity design; music and lyric writing; games and interactive experiments; mechanical design; robotics and energy systems.", 100, 8.9);

  const footerY = Math.max(y - 3, 55);
  line(48, footerY + 15, PAGE_WIDTH - 48, footerY + 15);
  text("PORTFOLIO", 48, footerY, 7.5, muted, true);
  text(portfolioUrl, 103, footerY, 8, blue, true);
  text("Click the portfolio address to open the live website.", 48, footerY - 15, 7.2, muted);
  text("Résumé limited to confirmed profile and project information.", 48, 28, 6.8, muted);

  const stream = commands.join("\n");
  const url = pdfString(portfolioUrl);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R /Annots [7 0 R] >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
    `<< /Type /Annot /Subtype /Link /Rect [103 ${Math.max(footerY - 3, 52)} 545 ${Math.max(footerY + 10, 65)}] /Border [0 0 0] /A << /S /URI /URI (${url}) >> >>`,
  ];

  let output = "%PDF-1.4\n% Portfolio Resume\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output, "latin1"));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(output, "latin1");
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(output, "latin1");
}

export async function GET(request: NextRequest) {
  const portfolioUrl = new URL(request.url).origin;
  const pdf = buildPdf(portfolioUrl);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Shubham-Malviya-Resume.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
