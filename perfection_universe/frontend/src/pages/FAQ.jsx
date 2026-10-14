import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { sound } from '../utils/sound'

// ── Edit all your FAQ content here ────────────────────────
const FAQ_SECTIONS = [
  {
    section: 'THE BASICS',
    items: [
      {
        q: 'What is Perfection Universe?',
        a: 'Perfection Universe is an interactive music experience built around the songs of PERFECTION. Each part of the website — the rooms, the console, the map, the games — is an extension of the music and its story. Think of it less like a website and more like a place.',
      },
      {
        q: 'Who is PERFECTION?',
        a: 'PERFECTION is the artist. The website is her universe — the ship, the signal, the journey to Mars, and everything that happened along the way.',
      },
      {
        q: 'Do I need an account to use the website?',
        a: 'No. Most of the website is accessible without an account. Creating an account lets you save your progress, track your Mars stage, unlock hidden rooms, and build your personal signal constellation.',
      },
      {
        q: 'Is this website connected to the music?',
        a: 'Yes — everything here is tied to the songs. The signal logs reference lyrics, the rooms represent places in the story, and the games are simulations of events from the journey. The deeper you go, the more connections you will find.',
      },
    ],
  },
  {
    section: 'THE SIGNAL',
    items: [
      {
        q: 'What is the signal?',
        a: 'The signal is the AI system aboard the ship in the story of Cosmic Scars. On the website, it is an interactive presence you can speak to through the console. It responds to what you say — honestly at first, then less so as your Mars stage increases.',
      },
      {
        q: 'What is Mars stage?',
        a: 'Mars stage tracks how deep into the story you have gone. Stage 0 is the beginning of the journey. Stage 3 is the end — or what looks like the end. Each stage changes how the signal responds to you and unlocks new content across the website.',
      },
      {
        q: 'How do I advance my Mars stage?',
        a: 'Talk to the signal. Ask it questions that matter — who it is, where you are, whether it is being honest. Certain keywords advance the stage. The signal remembers everything you have said.',
      },
      {
        q: 'Why does the signal sometimes lie?',
        a: 'That is part of the story. Listen carefully to when its answers start to shift. The things it stops saying are as important as the things it keeps saying.',
      },
      {
        q: 'What happens at Mars stage 3?',
        a: 'You arrive. Or something that looks like arrival. Visit the console and keep talking to find out.',
      },
    ],
  },
  {
    section: 'THE ROOMS',
    items: [
      {
        q: 'What are the liminal rooms?',
        a: 'The liminal rooms are interactive spaces you can enter and explore. Each one represents a different fragment of the story — a memory, a location, a moment from the journey. They are meant to feel like places you have been before but cannot quite remember.',
      },
      {
        q: 'How do I unlock new rooms?',
        a: 'Some rooms are always open. Others require a passphrase typed into the signal chat, a certain Mars stage, or something else entirely. Explore, talk to the signal, and pay attention to what it does not tell you.',
      },
      {
        q: 'How do I navigate inside a room?',
        a: 'Use the arrow keys (↑ ↓ ← →) or WASD to move. You can also click the arrows on screen. Some rooms can also be navigated by clicking directly on the scene.',
      },
    ],
  },
  {
    section: 'THE GAMES',
    items: [
      {
        q: 'What games are available?',
        a: 'Three simulations are currently online: Asteroid Drift (navigate a debris field on approach to Mars), Echo Match (repeat signal patterns back before they fade), and Signal Alignment (tune a frequency dial to find a hidden signal in static). Each has an arcade mode and a story mode.',
      },
      {
        q: 'Do scores save?',
        a: 'Yes, if you are logged in. Your personal best and a global leaderboard are available from each game\'s menu.',
      },
      {
        q: 'What is story mode vs arcade mode?',
        a: 'Story mode connects the game to the narrative of the journey — signal transmissions appear between rounds and the difficulty is structured around the acts. Arcade mode is infinite survival with increasing difficulty.',
      },
    ],
  },
  {
    section: 'THE MAP',
    items: [
      {
        q: 'How do I use the map?',
        a: 'Scroll to zoom in and out. Drag to pan across the map. Click a node once to see its description, then click the button in the tooltip to navigate there.',
      },
      {
        q: 'Why is Mars on the map?',
        a: 'Mars is always visible. Its appearance changes as your Mars stage increases. At stage 0 it is a small distant dot. At stage 3 it is something else.',
      },
    ],
  },
  {
    section: 'HIDDEN THINGS',
    items: [
      {
        q: 'Are there easter eggs?',
        a: 'Yes. Many. They are inspired by the lyrics to Cosmic Scars. Some are visual, some are triggered by what you say to the signal, some are hidden in URLs that are not linked anywhere. The website rewards curiosity.',
      },
      {
        q: 'I found something strange. Is it intentional?',
        a: 'Probably. If something feels off — a message that does not make sense, a page you were not supposed to find, a moment where the signal says something it should not know — that is intentional. Keep going.',
      },
      {
        q: 'What is /mars?',
        a: 'Type it and find out.',
      },
    ],
  },
  {
    section: 'ACCOUNT & SETTINGS',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Click "SIGN IN" in the navigation bar, then "CREATE AN ACCOUNT" at the bottom of the sign in page. You will need a username, email, and password.',
      },
      {
        q: 'Can I change my display name or bio?',
        a: 'Yes. Go to your profile page by clicking your username in the nav bar, then click "EDIT PROFILE".',
      },
      {
        q: 'I forgot my password. What do I do?',
        // ── CUSTOMIZE: update this with your actual reset process ──
        a: 'Password reset is coming soon. In the meantime, reach out through the contact page and we will sort it out.',
      },
    ],
  },
  {
    section: 'TECHNICAL',
    items: [
      {
        q: 'The website is not loading correctly. What should I do?',
        a: 'Try a hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac). If that does not help, try clearing your browser cache. If the issue persists, please report it using the bug report page.',
      },
      {
        q: 'The sound is not working.',
        a: 'Most browsers block audio until the user interacts with the page first. Click anywhere on the page and then try again. Make sure your browser tab is not muted.',
      },
      {
        q: 'The map is not responding to my clicks.',
        a: 'Make sure you are clicking a node, not just the background. Click once to open the tooltip, then click the button inside the tooltip to navigate. If a node still does not respond, try zooming in first.',
      },
      {
        q: 'I found a bug. How do I report it?',
        // ── CUSTOMIZE: link goes to your bug report page ──
        a: 'Use the bug report page — there is a link in the footer and in the navigation. Include as much detail as you can about what happened and how to reproduce it.',
        link: { label: 'GO TO BUG REPORT →', href: '/bugs' },
      },
    ],
  },
]

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      style={{ marginBottom: '8px' }}
    >
      <div
        onClick={() => { setOpen(!open); sound.click() }}
        style={{
          padding: '16px 20px',
          borderRadius: '10px',
          border: `1px solid ${open ? 'rgba(200,160,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
          background: open ? 'rgba(200,160,255,0.05)' : 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <p style={{
            margin: 0,
            fontSize: '0.88rem',
            letterSpacing: '0.04em',
            color: open ? 'rgba(230,210,255,0.95)' : 'rgba(200,180,255,0.75)',
            lineHeight: 1.5,
            fontWeight: open ? 500 : 400,
            transition: 'color 0.2s ease',
          }}>
            {item.q}
          </p>
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(200,160,255,0.35)',
            flexShrink: 0,
            marginTop: '2px',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            ▼
          </span>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                paddingTop: '14px',
                marginTop: '12px',
                borderTop: '1px solid rgba(200,160,255,0.1)',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.84rem',
                  color: 'rgba(200,185,170,0.65)',
                  lineHeight: 1.85,
                  letterSpacing: '0.03em',
                }}>
                  {item.a}
                </p>
                {item.link && (
                  <Link
                    to={item.link.href}
                    style={{
                      display: 'inline-block',
                      marginTop: '12px',
                      fontSize: '0.68rem',
                      letterSpacing: '0.15em',
                      color: 'rgba(200,160,255,0.7)',
                      textDecoration: 'none',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {item.link.label}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function FAQ() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  // Filter items by search query
  const filtered = search.trim()
    ? FAQ_SECTIONS.map(sec => ({
        ...sec,
        items: sec.items.filter(item =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(sec => sec.items.length > 0)
    : FAQ_SECTIONS

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(160deg, #08050e, #0e0818, #120a1a)',
      paddingBottom: '80px',
    }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 40px',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.58rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.35)' }}>
            PERFECTION UNIVERSE
          </p>
          <h1 style={{ margin: '0 0 6px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.2em' }}>
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(200,160,255,0.35)', letterSpacing: '0.08em' }}>
            If you can't find your answer here, use the{' '}
            <Link to="/bugs" style={{ color: 'rgba(200,160,255,0.6)', textDecoration: 'none' }}>
              bug report page
            </Link>
            {' '}to get in touch.
          </p>
        </div>
        <button
          onClick={() => { sound.click(); navigate('/') }}
          style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 18px' }}
        >
          ← BACK
        </button>
      </div>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Search */}
        <div style={{ marginBottom: '48px' }}>
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(200,160,255,0.15)',
              background: 'rgba(255,255,255,0.04)',
              color: 'white', fontSize: '0.9rem',
              outline: 'none', fontFamily: 'inherit',
              letterSpacing: '0.04em',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(200,160,255,0.35)'}
            onBlur={e => e.target.style.borderColor = 'rgba(200,160,255,0.15)'}
          />
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 0' }}
          >
            <p style={{ color: 'rgba(200,160,255,0.4)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
              No questions found for "{search}".
            </p>
            <p style={{ color: 'rgba(200,160,255,0.25)', fontSize: '0.75rem', marginTop: '8px' }}>
              Try the{' '}
              <Link to="/bugs" style={{ color: 'rgba(200,160,255,0.5)', textDecoration: 'none' }}>
                bug report page
              </Link>
              {' '}if you need more help.
            </p>
          </motion.div>
        )}

        {/* Sections */}
        {filtered.map((section, si) => (
          <div key={section.section} style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '20px',
            }}>
              <span style={{
                fontSize: '0.55rem', letterSpacing: '0.25em',
                color: 'rgba(200,160,255,0.45)',
                borderBottom: '1px solid rgba(200,160,255,0.15)',
                paddingBottom: '8px', flex: 1,
              }}>
                {section.section}
              </span>
            </div>
            {section.items.map((item, ii) => (
              <FAQItem key={item.q} item={item} index={ii} />
            ))}
          </div>
        ))}

        {/* Bottom CTA */}
        <div style={{
          marginTop: '60px', padding: '32px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.03)',
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(200,160,255,0.5)' }}>
            STILL HAVE QUESTIONS?
          </p>
          <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'rgba(200,160,255,0.35)', lineHeight: 1.7 }}>
            Found a bug, something broken, or something that feels intentional but you're not sure?
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { sound.click(); navigate('/bugs') }}
            style={{ fontSize: '0.7rem', letterSpacing: '0.18em', padding: '12px 32px' }}
          >
            REPORT A BUG →
          </motion.button>
        </div>
      </div>
    </div>
  )
}