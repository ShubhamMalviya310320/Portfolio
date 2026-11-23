"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const nav = [
  ["INTRO", "intro"], ["KNOWLEDGEBASE", "knowledgebase"], ["PROJECTS", "projects"],
  ["ENGINEERING", "engineering"], ["GAMES", "games"], ["GALLERY", "gallery"], ["ABOUT", "about"],
] as const;

const overview = [
  { label: "Site Overview", icon: "◈", target: "intro", note: "A map of this little digital environment. Explore the work, the thinking behind it, and the person connecting the pieces." },
  { label: "Hardest Build", icon: "⬡", target: "bitkit", note: "BitKit: making packed binary layouts explicit through schemas, a canonical intermediate representation, and predictable runtime operations." },
  { label: "Learning Journey", icon: "✳", target: "knowledgebase", note: "A self-directed path through software, systems, text processing, visual design, and the habit of learning by building." },
  { label: "Self Portrait", icon: "◎", target: "about", note: "A self-portrait made of more than a photograph: engineering, art, curiosity, discipline, and unfinished questions." },
  { label: "Work Status", icon: "▢", target: "about", note: "Independent builder. Open to meaningful engineering opportunities and collaborations. Availability details should be confirmed before launch." },
  { label: "Beyond Code", icon: "♧", target: "gallery", note: "Music, visual identity, drawing, mechanical design, and curiosity about robotics, energy, and complex systems." },
  { label: "Symbolic Origin", icon: "♢", target: "gallery", note: "The SM mark brings together Shiva's Trishul, programming forms, direction, struggle, and transformation." },
];

const prompts = [
  "A Deliberately Tailored Portfolio",
  "Astutely Organized Knowledgebase",
  "5+ Major Projects / 20+ Minor Builds",
  "2 Production-Grade Systems",
  "Games Beyond Screenshots",
  "Crafts Beyond Gallery",
  "AI that Knows Me",
];

const quickQuestions = ["Tell me about BitKit", "What is ApeksBidi?", "How did I learn software?", "What do I enjoy beyond code?"];

export default function Home() {
  const [active, setActive] = useState("intro");
  const [dark, setDark] = useState(false);
  const [hoverNote, setHoverNote] = useState("Hover anything for labels/notes/overflows — it all shows up here");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sections = nav.map(([, id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    }), { rootMargin: "-25% 0px -65% 0px" });
    sections.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function goTo(id: string, note?: string) {
    if (note) setHoverNote(note);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function ask(q: string, history: ChatMessage[] = messages) {
    const cleanQuestion = q.trim();
    if (!cleanQuestion || isThinking) return;
    const nextMessages: ChatMessage[] = [...history, { role: "user", content: cleanQuestion }].slice(-12);
    setMessages(nextMessages);
    setQuestion("");
    setChatError("");
    setAnswerOpen(true);
    setIsThinking(true);
    setHoverNote("K is thinking through your question. Give her a moment.");
    document.getElementById("knowledgebase")?.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      const response = await fetch("/api/k", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "K couldn't answer that just now.");
      setMessages([...nextMessages, { role: "assistant", content: data.answer }].slice(-12));
      setHoverNote("K has answered. Continue the conversation or explore another part of the site.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "K is temporarily unavailable.";
      setChatError(message);
      setHoverNote("K couldn't connect just now. Your question is still here; you can try again.");
    } finally {
      setIsThinking(false);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void ask(question);
  }
  async function shareResumeFile() {
    try {
      const response = await fetch("/resume.pdf");
      if (!response.ok) throw new Error("The résumé PDF could not be prepared.");
      const blob = await response.blob();
      const file = new File([blob], "Shubham-Malviya-Resume.pdf", { type: "application/pdf" });
      const shareData = {
        files: [file],
        title: "Shubham Malviya — Resume",
        text: `Portfolio: ${window.location.origin}\nRésumé PDF: ${window.location.origin}/resume.pdf`,
      };
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        window.open("/resume.pdf", "_blank", "noopener,noreferrer");
        setHoverNote("This browser cannot share PDF attachments directly. Download the opened PDF, then attach it in Gmail or WhatsApp.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setHoverNote(error instanceof Error ? error.message : "Could not prepare the résumé for sharing.");
    }
  }

  return (
    <main className={dark ? "app-shell dark" : "app-shell"}>
      <header className="topbar">
        <a className="brand-mark" href="#intro" aria-label="Shubham Malviya home">
          <Image src="/images/sm-mark.png" alt="SM Trishul mark" width={34} height={48} priority />
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          {nav.map(([label, id]) => <a key={id} href={`#${id}`} className={active === id ? "active" : ""} onMouseEnter={() => setHoverNote(`Navigate to ${label.toLowerCase()} — explore this part of the portfolio.`)}>{label}</a>)}
        </nav>
        <button className="theme-button" onClick={() => setDark(!dark)} aria-label="Toggle colour theme" title="Change appearance"><span>{dark ? "☼" : "♧"}</span></button>
      </header>

      <div className="workspace">
        <aside className="left-rail">
          <div className="annotation-panel">
            <span className="annotation-marker" />
            <p>{hoverNote}</p>
          </div>
          <div className="overview-panel">
            {overview.map(item => (
              <button key={item.label} onClick={() => goTo(item.target, item.note)} onMouseEnter={() => setHoverNote(item.note)} onFocus={() => setHoverNote(item.note)}>
                <span>{item.label}</span><i>{item.icon}</i>
              </button>
            ))}
          </div>
          <div className="mascot-panel">
            <div className="mascot-image"><Image src="/images/k-mascot.png" alt="K, the cat-demon mascot" width={260} height={280} /></div>
            <div className="mascot-links">
              <button onMouseEnter={() => setHoverNote("The portfolio itself: an evolving record of work, ideas, experiments, and identity.")} onClick={() => goTo("intro")}>Portfolio <b>››</b></button>
              <button onMouseEnter={() => setHoverNote("ApeksBidi: JavaScript implementation of Unicode's Bidirectional Algorithm.")} onClick={() => goTo("apeksbidi")}>APEKS — BiDi <b>››</b></button>
              <button onMouseEnter={() => setHoverNote("BitKit: schema-driven packed binary layouts and runtime tooling.")} onClick={() => goTo("bitkit")}>APEKS — BitKit <b>››</b></button>
            </div>
            <span className="mascot-caption">K / YOUR GUIDE</span>
          </div>
        </aside>

        <div className="main-column">
          <section className="hero-card" id="intro">
            <div className="hero-photo"><Image src="/images/shubham-portrait.jpg" alt="Portrait of Shubham Malviya" width={260} height={260} priority /></div>
            <div className="hero-content">
              <div className="hero-tags"><span>MERN++</span><span>DOB — 31-03-1999</span></div>
              <p className="hero-kicker">INDEPENDENT ENGINEER · CREATIVE THINKER</p>
              <h1>Shubham Malviya</h1>
              <p className="hero-role">SYSTEMS ENGINEER — TEXT ENGINES &amp; COMPILER TOOLING</p>
              <p className="hero-description">I love understanding how things work, finding connections between ideas, and discovering better ways to solve problems. There's always something new to learn, something better to build, and another idea worth exploring.</p>
              <div className="social-grid" aria-label="Social and interest links">
                <span title="Music and sound">♫</span><span title="Creative work">⚒</span><span title="Play and experiments">⌘</span><span className="gmail">M</span>
                <span title="Systems thinking">◉</span><span title="Interfaces">▱</span><span title="Code">‹/›</span><span className="discord">◕</span>
                <span title="GitHub">◉</span><span className="linkedin">in</span>
              </div>
            </div>
          </section>

          <section className="highlights" aria-label="Portfolio highlights">
            <div className="pill-cloud">
              {prompts.map((p, i) => <button key={p} className={`highlight-pill pill-${i}`} onMouseEnter={() => setHoverNote(p)} onFocus={() => setHoverNote(p)} onClick={() => i === 1 || i === 6 ? goTo("knowledgebase") : i === 2 || i === 3 ? goTo("projects") : i === 4 ? goTo("games") : i === 5 ? goTo("gallery") : goTo("intro")}>{p}</button>)}
            </div>
          </section>

          <section className="meet-k" id="knowledgebase">
            <div className="meet-copy">
              <div className="k-heading-row"><h2>Meet <span>K</span>!</h2><span className={`k-status ${isThinking ? "thinking" : ""}`}><i />{isThinking ? "THINKING" : "AI GUIDE"}</span></div>
              <p className="meet-subtitle">She can help you get to know me beyond the headlines.</p>
              <p className="k-disclosure">OPENAI-POWERED · CURATED PORTFOLIO CONTEXT · CHAT NOT STORED BY THIS SITE</p>
              {!messages.length && <><div className="explore-label">TRY ASKING</div><div className="quick-questions">{quickQuestions.map(item => <button key={item} onClick={() => void ask(item)} disabled={isThinking}>{item}</button>)}</div></>}
              <div className={`answer-panel ${answerOpen ? "answer-visible" : ""}`} aria-live="polite" aria-busy={isThinking}>
                {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${index}-${message.role}`}><span>{message.role === "user" ? "YOU" : "K"}</span><p>{message.content}</p></div>)}
                {isThinking && <div className="chat-message assistant thinking-message"><span>K</span><p><i /><i /><i /></p></div>}
                {chatError && <div className="chat-error" role="alert">{chatError} <button onClick={() => { const lastQuestion = [...messages].reverse().find(item => item.role === "user")?.content; if (lastQuestion) void ask(lastQuestion, messages.slice(0, -1)); }}>TRY AGAIN</button></div>}
                {answerOpen && !isThinking && <button className="close-chat" onClick={() => setAnswerOpen(false)}>COLLAPSE CHAT ×</button>}
              </div>
            </div>
            <div className="meet-decoration" aria-hidden="true"><span>K</span><i>✳</i></div>
          </section>

          <section className="projects-section content-section" id="projects">
            <div className="section-heading"><span>SELECTED WORK</span><small>01 — 02 / SYSTEMS IN PROGRESS</small></div>
            <div className="project-list">
              <article className="project-row" id="bitkit" onMouseEnter={() => setHoverNote("BitKit is a schema-driven TypeScript toolkit for packed binary layouts, with validation, parsing, canonical IR, and runtime layers.")}>
                <div className="project-index">01</div><div className="project-info"><h3>BitKit <span>↗</span></h3><p>Schema-driven TypeScript tooling for packed binary layouts.</p><small>TYPESCRIPT · CANONICAL IR · BINARY SYSTEMS</small></div><div className="project-status">FOUNDATION / V1</div>
              </article>
              <article className="project-row" id="apeksbidi" onMouseEnter={() => setHoverNote("ApeksBidi implements Unicode UAX #9 in JavaScript, targeting Unicode 17 with generated Unicode data and compact internal representations.")}>
                <div className="project-index">02</div><div className="project-info"><h3>ApeksBidi <span>↗</span></h3><p>JavaScript implementation of Unicode's Bidirectional Algorithm.</p><small>JAVASCRIPT · UNICODE 17 · TEXT PROCESSING</small></div><div className="project-status">ENGINEERING BUILD</div>
              </article>
            </div>
          </section>

          <section className="content-section engineering-section" id="engineering">
            <div className="section-heading"><span>ENGINEERING NOTES</span><small>02 / HOW I THINK</small></div>
            <div className="engineering-grid">
              <h2>Understand the<br/><em>mechanism.</em></h2>
              <div><p>Architecture is the set of decisions that determines what a system can guarantee, what it can change, and what it must never silently break.</p><div className="principle-list"><span>01 — Start with the model</span><span>02 — Make contracts explicit</span><span>03 — Measure, don't assume</span><span>04 — Keep one source of truth</span></div></div>
            </div>
          </section>

          <section className="content-section games-section" id="games">
            <div className="section-heading"><span>GAMES & EXPERIMENTS</span><small>03 / PLAY IS RESEARCH</small></div>
            <div className="simple-feature"><h2>Beyond<br/><em>screenshots.</em></h2><p>Playable experiments, small interactive systems, and visual prototypes belong here. This space is ready for real builds rather than invented showcase pieces.</p></div>
          </section>

          <section className="content-section gallery-section" id="gallery">
            <div className="section-heading"><span>CRAFTS & CREATIVE WORK</span><small>04 / BEYOND CODE</small></div>
            <div className="craft-grid"><div><span>01 / IDENTITY</span><b>SM.</b><p>Symbols, identity, and visual language.</p></div><div><span>02 / SOUND</span><b>∿ ∿ ∿</b><p>Music, rhythm, lyrics, and structure.</p></div><div><span>03 / STUDIES</span><b>✳</b><p>Sketches, observations, and ideas in progress.</p></div></div>
          </section>

          <section className="content-section about-section" id="about">
            <div className="section-heading"><span>ABOUT</span><small>05 / STILL BECOMING</small></div>
            <div className="simple-feature"><h2>Curiosity with<br/><em>direction.</em></h2><p>I'm a self-taught developer and artist from Ujjain, India. My path has been unconventional, but the direction is deliberate: understand how things work, build things that hold up, and keep expanding the boundaries of what I can make.</p></div>
          </section>
          <footer className="footer"><span>© 2026 SHUBHAM MALVIYA</span><span>BUILT WITH INTENTION.</span><button className="share-trigger" onClick={() => setShareOpen(!shareOpen)}>SHARE PROFILE {shareOpen ? "−" : "+"}</button><a href="#intro">BACK TO TOP ↑</a></footer>
          {shareOpen && <div className="share-panel"><p>Share the portfolio and the résumé PDF together.</p><a href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("Shubham Malviya — Portfolio & Resume")}&body=${encodeURIComponent(`Portfolio: ${typeof window !== "undefined" ? window.location.origin : ""}\nResume PDF: ${typeof window !== "undefined" ? window.location.origin : ""}/resume.pdf`)}`} target="_blank" rel="noreferrer">GMAIL</a><a href={`mailto:?subject=${encodeURIComponent("Shubham Malviya — Portfolio & Resume")}&body=${encodeURIComponent(`Portfolio: ${typeof window !== "undefined" ? window.location.origin : ""}\nResume PDF: ${typeof window !== "undefined" ? window.location.origin : ""}/resume.pdf`)}`}>EMAIL APP</a><a href={`https://wa.me/?text=${encodeURIComponent(`Shubham Malviya — Portfolio: ${typeof window !== "undefined" ? window.location.origin : ""} | Resume PDF: ${typeof window !== "undefined" ? window.location.origin : ""}/resume.pdf`)}`} target="_blank" rel="noreferrer">WHATSAPP</a><button onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}\n${window.location.origin}/resume.pdf`); setHoverNote("Portfolio and résumé links copied."); }}>COPY LINKS</button><button onClick={() => void shareResumeFile()}>SHARE PDF FILE</button></div>}
        </div>
      </div>

      <div className="bottom-bar">
        <a className="resume-button" href="/resume.pdf" target="_blank" rel="noreferrer" onMouseEnter={() => setHoverNote("Open Shubham's résumé as a PDF. The PDF includes a clickable link back to this portfolio.")}>VIEW / DOWNLOAD CV <span>↓</span></a>
        <form className="ask-form" onSubmit={submit}>
          <input ref={inputRef} value={question} onChange={e => setQuestion(e.target.value)} onFocus={() => setHoverNote("Ask K about Shubham's work, decisions, learning journey, interests, or ambitions.")} placeholder={isThinking ? "K is thinking…" : "Ask K anything"} aria-label="Ask K a question" maxLength={1400} disabled={isThinking}/>
        </form>
        <button className={`send-button ${isThinking ? "sending" : ""}`} type="button" onClick={() => void ask(question)} aria-label="Send question" disabled={isThinking || !question.trim()}>{isThinking ? "…" : "↗"}</button>
      </div>
    </main>
  );
}
