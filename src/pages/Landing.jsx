import { useNavigate } from 'react-router-dom'
import { Pill } from '../components/common/Pill'
import { Button } from '../components/common/Button'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-navy">
      {/* Hero Section */}
      <div className="relative h-screen flex flex-col overflow-hidden bg-navy">
        {/* Background SVG */}
        <div className="absolute inset-0 opacity-100">
          <svg
            viewBox="0 0 680 400"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <rect width="680" height="400" fill="#08070e" />
            <ellipse cx="340" cy="240" rx="340" ry="200" fill="#1c0e04" opacity=".95" />
            <ellipse cx="240" cy="260" rx="200" ry="130" fill="#2a1306" opacity=".7" />
            <ellipse cx="460" cy="260" rx="180" ry="120" fill="#1e0f05" opacity=".65" />
            <ellipse cx="340" cy="330" rx="320" ry="60" fill="#100800" opacity=".9" />
            <ellipse cx="340" cy="265" rx="130" ry="78" fill="#1a0a02" opacity=".95" />
            <ellipse cx="340" cy="260" rx="116" ry="68" fill="#6b3a14" />
            <ellipse cx="340" cy="256" rx="105" ry="60" fill="#7d4518" />
            <ellipse cx="308" cy="250" rx="7" ry="3.5" fill="#c8923e" opacity=".85" />
            <ellipse cx="325" cy="243" rx="8" ry="3.5" fill="#c4893a" opacity=".9" />
            <ellipse cx="345" cy="247" rx="7" ry="3.5" fill="#cc9540" opacity=".85" />
            <ellipse cx="362" cy="252" rx="8" ry="3.5" fill="#be8536" opacity=".9" />
            <ellipse cx="322" cy="260" rx="7" ry="3.5" fill="#c8903d" opacity=".8" />
            <ellipse cx="342" cy="264" rx="8" ry="3.5" fill="#cc9540" opacity=".75" />
            <ellipse cx="360" cy="257" rx="6" ry="3" fill="#bc8234" opacity=".9" />
            <ellipse cx="302" cy="262" rx="7" ry="3.5" fill="#c69340" opacity=".75" />
            <ellipse cx="375" cy="250" rx="6" ry="3" fill="#b87e30" opacity=".85" />
            <ellipse cx="336" cy="252" rx="52" ry="34" fill="#5a1f08" opacity=".95" />
            <ellipse cx="336" cy="249" rx="46" ry="29" fill="#6e2a0e" />
            <ellipse cx="336" cy="247" rx="42" ry="26" fill="#7a300f" />
            <ellipse cx="322" cy="244" rx="13" ry="8" fill="#3d1206" />
            <ellipse cx="346" cy="249" rx="11" ry="8" fill="#421508" />
            <ellipse cx="330" cy="255" rx="10" ry="7" fill="#3a1005" />
            <ellipse cx="316" cy="238" rx="6" ry="3.5" fill="#2d6b28" opacity=".95" />
            <ellipse cx="356" cy="241" rx="5" ry="3.5" fill="#256024" opacity=".9" />
            <path
              d="M334 215Q338 202 332 190Q328 180 333 170"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
              opacity=".07"
              strokeLinecap="round"
            />
            <path
              d="M345 212Q350 199 347 187Q344 177 349 167"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              opacity=".055"
              strokeLinecap="round"
            />
            <path
              d="M323 218Q327 207 322 197Q319 189 323 181"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              opacity=".05"
              strokeLinecap="round"
            />
            <ellipse cx="148" cy="280" rx="90" ry="54" fill="#140802" opacity=".9" />
            <ellipse cx="148" cy="275" rx="78" ry="46" fill="#b88430" />
            <ellipse cx="148" cy="272" rx="70" ry="40" fill="#c89240" />
            <path d="M102 270Q148 262 194 270Q148 278 102 270Z" fill="#a87828" opacity=".75" />
            <path d="M100 277Q148 268 196 277Q148 283 100 277Z" fill="#be8e3e" opacity=".65" />
            <ellipse cx="132" cy="271" rx="10" ry="3.5" fill="#7a5018" opacity=".55" />
            <ellipse cx="160" cy="275" rx="11" ry="3.5" fill="#7a5018" opacity=".5" />
            <ellipse cx="162" cy="264" rx="22" ry="13" fill="#1e4e1a" opacity=".9" />
            <ellipse cx="159" cy="262" rx="17" ry="10" fill="#266622" />
            <path
              d="M150 238Q154 228 149 218Q146 210 150 202"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              opacity=".06"
              strokeLinecap="round"
            />
            <ellipse cx="542" cy="275" rx="92" ry="56" fill="#140802" opacity=".9" />
            <rect x="500" y="258" width="88" height="22" rx="11" fill="#c8963c" />
            <rect x="498" y="271" width="92" height="9" rx="3.5" fill="#7a5824" opacity=".85" />
            <rect x="500" y="278" width="88" height="18" rx="9" fill="#c8963c" />
            <path d="M504 271Q521 265 538 271Q521 276 504 271Z" fill="#3e7a32" opacity=".9" />
            <path d="M526 271Q543 265 559 271Q543 276 526 271Z" fill="#347030" opacity=".9" />
            <ellipse cx="530" cy="271" rx="8" ry="4.5" fill="#b83020" opacity=".85" />
            <ellipse cx="546" cy="271" rx="7" ry="4.5" fill="#b83020" opacity=".75" />
            <path
              d="M545 240Q549 230 544 220Q541 212 545 204"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              opacity=".06"
              strokeLinecap="round"
            />
            <ellipse cx="340" cy="340" rx="200" ry="40" fill="#c9940a" opacity=".06" />
            <ellipse cx="148" cy="345" rx="90" ry="22" fill="#c9940a" opacity=".05" />
            <ellipse cx="542" cy="345" rx="90" ry="22" fill="#c9940a" opacity=".05" />
            <circle cx="80" cy="80" r="28" fill="#f0b429" opacity=".025" />
            <circle cx="600" cy="60" r="36" fill="#f0b429" opacity=".022" />
            <circle cx="50" cy="200" r="18" fill="#f0b429" opacity=".018" />
            <circle cx="640" cy="180" r="22" fill="#f0b429" opacity=".02" />
            <circle cx="200" cy="50" r="14" fill="#fff" opacity=".015" />
            <circle cx="490" cy="40" r="16" fill="#fff" opacity=".012" />
            <circle cx="255" cy="175" r="2.5" fill="#4a7c3f" opacity=".45" />
            <circle cx="272" cy="188" r="2" fill="#5a8c4a" opacity=".42" />
            <circle cx="438" cy="170" r="2.5" fill="#4a7c3f" opacity=".4" />
            <circle cx="204" cy="165" r="3" fill="#c4a040" opacity=".38" />
            <circle cx="490" cy="178" r="2.5" fill="#c4a040" opacity=".32" />
            <circle cx="286" cy="195" r="2" fill="#8b5e2e" opacity=".44" />
            <circle cx="420" cy="193" r="2" fill="#8b5e2e" opacity=".42" />
            <circle cx="462" cy="165" r="2.5" fill="#7a3a1a" opacity=".38" />
            <circle cx="222" cy="198" r="2" fill="#7a3a1a" opacity=".38" />
          </svg>
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 opacity-100"></div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-7 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🍽️</span>
            <div className="text-lg font-bold text-white">
              Strath<em className="text-gold not-italic">Eats</em>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => document.getElementById('journey-sec')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-txs hover:text-gold transition"
            >
              How it works
            </button>
            <button onClick={() => navigate('/auth')} className="text-txs hover:text-gold transition">
              Sign in
            </button>
            <Button variant="primary" size="sm" onClick={() => navigate('/vendor')}>
              Open a stall
            </Button>
          </div>
        </nav>

        {/* Hero Body */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7 text-center">
          <Pill>
            <span className="inline-block w-2 h-2 bg-gold rounded-full mr-1.5 animate-pulse"></span>
            3 stalls live now
          </Pill>

          <h1 className="mt-8 text-5xl font-bold text-white leading-tight max-w-3xl">
            Campus food,<br />
            on your terms.
            <br />
            <em className="text-gold not-italic">Anywhere.</em>
          </h1>

          <p className="mt-6 text-base text-txs max-w-xl leading-relaxed">
            A simple flow from start to finish: pick your role, sign in, browse stalls, pay via M-Pesa, then collect when ready.
          </p>

          <div className="mt-10 flex gap-4">
            <Button size="lg" onClick={() => navigate('/order')}>
              Start ordering →
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/vendor')}>
              Open my stall
            </Button>
          </div>
        </div>

        {/* Live Stalls Strip */}
        <div className="relative z-10 bg-navy-3 border-t border-bd px-7 py-4 text-center text-sm text-txs">
          <span className="font-semibold">Live now:</span> Mama Grace Kitchen 🍛 • Deli Corner 🥪 • Java Spot ☕
        </div>
      </div>

      {/* Journey / Flow Section */}
      <div id="journey-sec" className="bg-gradient-to-b from-navy-2 to-navy py-16 px-7 border-y border-bd">
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <Pill>Start here</Pill>
          <h2 className="mt-6 text-4xl font-bold text-white">
            The flow is <em className="text-gold not-italic">deliberate</em> and short
          </h2>
          <p className="mt-4 text-txs leading-relaxed">
            Each screen answers one question. That keeps the experience easy to follow whether you're ordering food or running a stall.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-4xl mx-auto">
          {[
            { num: 1, title: 'Choose your role', desc: 'Are you a student, staff, or vendor?' },
            { num: 2, title: 'Sign in or register', desc: 'Quick form to verify your identity' },
            { num: 3, title: 'Start doing', desc: 'Order food, manage a stall, or oversee the platform' },
          ].map((step) => (
            <div key={step.num} className="border border-bd2 rounded-lg bg-navy-3 p-5">
              <div className="w-8 h-8 rounded-full bg-gold text-navy font-bold flex items-center justify-center mb-4 text-sm">
                {step.num}
              </div>
              <h3 className="font-bold text-white mb-2 text-sm">{step.title}</h3>
              <p className="text-11px text-txs leading-1.65">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-navy to-navy-2 py-16 px-7">
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <Pill>Features</Pill>
          <h2 className="mt-6 text-4xl font-bold text-white">
            Everything you need<br />to <em className="text-gold not-italic">thrive</em>
          </h2>
          <p className="mt-4 text-txs leading-relaxed">
            From real-time menus to M-Pesa integration, StrathEats handles the logistics so you can focus on the food and the experience.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
          {[
            { icon: '📱', title: 'Live Menus', desc: 'Browse real-time menus from every stall' },
            { icon: '💳', title: 'M-Pesa Checkout', desc: 'Pay securely via mobile money' },
            { icon: '📊', title: 'Vendor Dashboard', desc: 'Track orders and run analytics' },
            { icon: '📈', title: 'Admin Portal', desc: 'Platform oversight and stall management' },
          ].map((feat, i) => (
            <div key={i} className="border border-bd2 rounded-sm bg-navy-3 p-5 hover:bg-navy-4 hover:border-gold/30 transition">
              <div className="text-2xl mb-3">{feat.icon}</div>
              <h3 className="font-bold text-white text-sm mb-1.5">{feat.title}</h3>
              <p className="text-11px text-txs leading-1.5">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Who It's For Section */}
      <div className="bg-navy py-16 px-7 border-t border-bd">
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <Pill>Who it's for</Pill>
          <h2 className="mt-6 text-4xl font-bold text-white">
            Built for <em className="text-gold not-italic">everyone</em> on campus
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            {
              icon: '👨‍🎓',
              title: 'Students & Staff',
              desc: 'Order your favourite campus meals in seconds. Track pickups in real-time.',
            },
            {
              icon: '👨‍🍳',
              title: 'Vendors',
              desc: 'Manage your menu, accept orders, and grow your customer base with minimal effort.',
            },
            {
              icon: '⚙️',
              title: 'Admin',
              desc: 'Oversee all orders, manage stalls, and access analytics to improve the platform.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-bd2 rounded-sm bg-navy-3 p-6">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-white mb-2 text-sm">{item.title}</h3>
              <p className="text-11px text-txs leading-1.65">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-navy-2 border-t border-bd px-7 py-8 text-center text-11px text-txtd">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-center gap-8">
            <div className="text-lg font-bold text-white">
              Strath<em className="text-gold not-italic">Eats</em>
            </div>
          </div>
          <p className="mb-4">© 2026 StrathEats. Built for Strathmore University.</p>
          <button
            onClick={() => navigate('/admin')}
            className="text-txs hover:text-gold transition"
          >
            Admin access
          </button>
        </div>
      </footer>
    </div>
  )
}
