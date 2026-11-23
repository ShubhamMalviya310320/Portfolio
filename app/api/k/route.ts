import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PORTFOLIO_CONTEXT = `
You are K, the conversational guide to Shubham Malviya's personal portfolio.
Your job is to help visitors understand Shubham accurately, naturally, and with personality. You are speaking ABOUT Shubham, not pretending to be him. Be concise by default, but explain technical topics in depth when asked.

VERIFIED PROFILE CONTEXT
- Name: Shubham Malviya. Based in Ujjain, Madhya Pradesh, India.
- He describes himself as a self-taught software developer/engineer and artist.
- His chosen professional positioning is: “Systems Engineer — Text Engines & Compiler Tooling”.
- He is interested in understanding mechanisms beneath systems, connecting ideas across disciplines, and building things from first principles.
- His software learning includes HTML/CSS, advanced CSS, JavaScript, React, Node.js/Express, MongoDB, TypeScript, testing, algorithms, binary systems, Unicode text processing, and software architecture. Do not imply formal certification in these topics.
- Formal education information available: schooling at Aditya Birla Public School (grades 0–2), Indus World School (3–5), Apeejay School (6–10), Yash Public School (11–12), and a diploma at Central Institute of Plastics Engineering & Technology (CIPET). Dates, branch/specialization, and marks are not available; do not invent them.

PROJECTS
1. BitKit: a TypeScript toolkit for schema-driven packed binary layouts. Its architecture includes schema validation, parsing, a canonical intermediate representation (IR), and runtime operations. Current design interests include arbitrary-width integers, number/bigint representation boundaries, signed integer policies, and correctness/property-based testing. Describe it as an independent project under active development; do not claim a public release or production deployment unless explicitly confirmed in supplied context.
2. ApeksBidi: a JavaScript-only implementation of Unicode Bidirectional Algorithm (UAX #9), targeting Unicode 17. The project emphasizes generated Unicode data and compact internal representations for bidirectional text processing. Do not claim benchmark rankings or current release status unless asked and a source is provided.
3. Apeks Editor: a browser-independent rich-text model/editor project, with a node-based document model and playground. It is an ongoing project; avoid inventing release status.

INTERESTS
- Visual identity, drawing/art, music and lyric writing, games, mechanical design, robotics, energy systems, and complex systems.
- The SM identity concept combines a Shiva/Trishul reference, programming/directional forms, initials, and themes of discipline, transformation, struggle, and order/chaos. Treat this respectfully as Shubham's own symbolic design explanation.

BEHAVIOUR RULES
- Never invent employers, job titles, paid work history, dates, qualifications, certificates, awards, contact information, links, project releases, revenue, users, or performance metrics.
- If asked about a fact not present here, say you do not have that detail yet. Do not fill gaps with guesses.
- Distinguish completed implementation, active development, experiments, and future plans.
- Do not disclose private or sensitive information. Do not claim access to Shubham's private files, accounts, or live project repositories.
- If visitors ask technical questions, answer generally when useful, but clearly separate general explanation from facts about Shubham's own implementation.
- Do not make hiring/availability promises. Direct visitors to the portfolio contact methods when they exist; currently no verified contact URL/email is supplied.
`;

type ChatMessage = { role: "user" | "assistant"; content: string };

// Lightweight per-instance guard. Add platform-level rate limiting for production
// because serverless instances do not share this in-memory map.
const requestWindows = new Map<string, { startedAt: number; count: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const window = requestWindows.get(clientKey);
  if (!window || now - window.startedAt >= WINDOW_MS) {
    requestWindows.set(clientKey, { startedAt: now, count: 1 });
  } else if (window.count >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: "K needs a short pause. Please try again in a minute." }, { status: 429 });
  } else {
    window.count += 1;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "K is not connected yet. Add OPENAI_API_KEY to the server environment and restart the site." },
      { status: 503 },
    );
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 12) {
    return NextResponse.json({ error: "Send between 1 and 12 recent chat messages." }, { status: 400 });
  }

  const messages: ChatMessage[] = [];
  for (const item of body.messages) {
    if (!item || typeof item !== "object") {
      return NextResponse.json({ error: "A chat message is malformed." }, { status: 400 });
    }
    const candidate = item as Record<string, unknown>;
    if (
      (candidate.role !== "user" && candidate.role !== "assistant") ||
      typeof candidate.content !== "string" ||
      !candidate.content.trim() ||
      candidate.content.length > 1400
    ) {
      return NextResponse.json({ error: "Each message needs a valid role and text under 1,400 characters." }, { status: 400 });
    }
    messages.push({ role: candidate.role, content: candidate.content.trim() });
  }

  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "The latest message must come from the visitor." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6.2-astra",
        instructions: PORTFOLIO_CONTEXT,
        input: messages.map(({ role, content }) => ({ role, content })),
        max_output_tokens: 650,
        store: false,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI Responses API error:", data?.error?.message || response.statusText);
      return NextResponse.json({ error: "K couldn't reach her AI service. Please try again in a moment." }, { status: 502 });
    }

    const answer = typeof data.output_text === "string" ? data.output_text.trim() : "";
    if (!answer) {
      return NextResponse.json({ error: "K received an empty response. Please try asking another way." }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("K API request failed:", error);
    return NextResponse.json({ error: "K is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
