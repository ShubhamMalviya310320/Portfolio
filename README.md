# Shubham Malviya — Portfolio

Responsive asymmetric portfolio built with Next.js 15, React 19, and TypeScript. The implementation preserves the supplied layout direction while adding responsive layouts, a live AI guide (K), subtle mascot motion, and a dynamically generated résumé PDF.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## K — connect the AI

1. Copy `.env.example` to `.env.local`.
2. Add your OpenAI API key:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-6.2-astra
```

3. Restart the development server.

K uses the OpenAI Responses API through `app/api/k/route.ts`. Her portfolio knowledge and behaviour rules are kept server-side in `PORTFOLIO_CONTEXT`; the API key is never sent to the browser. The browser keeps the recent chat in React state only. The API request sets `store: false`, and this site does not persist chat messages in a database.

The endpoint includes input validation, request-size limits, a timeout, and a lightweight per-instance request guard. For a public production deployment, add shared/platform-level rate limiting and API budget alerts because in-memory limits are not shared across serverless instances. API usage is billed to the OpenAI API project associated with the key.

## Résumé PDF and sharing

- `/resume.pdf` generates a one-page PDF résumé dynamically.
- Its clickable portfolio URL is derived from the actual request origin. Once deployed on your domain, the PDF points back to that domain automatically; no temporary preview URL is hardcoded.
- The persistent bottom button opens the PDF in a new tab. The browser PDF viewer can download or print it.
- The footer's **Share Profile** controls create a Gmail draft, a WhatsApp share message, copy both URLs, or use the browser/OS share sheet to share the actual PDF file with the portfolio URL in the accompanying text (where file sharing is supported).
- If the browser does not support file sharing, the PDF opens for download; attach that downloaded file manually in Gmail or WhatsApp. The browser cannot silently attach files to another app.

The résumé contains only currently confirmed information: profile positioning, independent projects, technical foundation, diploma institution, and interests. It intentionally does not invent employers, employment dates, grades, contact information, certifications, awards, or project release claims. Add verified contact details and any missing education/project facts before using it as a final job-application résumé.

## Before deployment

1. Add `OPENAI_API_KEY` to the hosting provider's server-side environment variables. Do not use a `NEXT_PUBLIC_` prefix.
2. Add platform-level rate limiting and API budget alerts for the public K endpoint.
3. Verify the résumé content and add verified email, phone, GitHub, LinkedIn, and other public links.
4. Replace decorative social symbols with actual verified destinations.
5. Replace the screenshot-derived portrait and temporary SM mark with approved original assets when ready.
6. Deploy behind HTTPS and attach the final custom domain. The résumé PDF will use the live request origin as its portfolio link.
7. Run `npm run lint` and `npm run build` in the deployment environment before publishing.

## Project structure

```text
app/
  api/k/route.ts       # Server-side OpenAI Responses API endpoint
  resume.pdf/route.ts # Dynamic PDF generator with clickable portfolio URL
  page.tsx             # Portfolio UI and K chat client
  globals.css          # Layout, responsive breakpoints, motion, themes
  layout.tsx           # Metadata and root document
public/images/         # Portrait, SM mark, K mascot
```
