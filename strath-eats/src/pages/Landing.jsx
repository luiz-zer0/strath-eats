import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill } from '../components/common/Pill'
import { Button } from '../components/common/Button'
import { subscribeToStalls } from '../services/stallService'
import ThemeToggle from '../components/ThemeToggle'

export default function Landing() {
  const navigate = useNavigate()
  const [showRoleChooser, setShowRoleChooser] = useState(false)
  const [liveStallCount, setLiveStallCount] = useState(0)

  useEffect(() => {
    const unsubscribe = subscribeToStalls((stalls) => {
      setLiveStallCount(stalls.filter((stall) => stall.online !== false).length)
    })

    return () => unsubscribe?.()
  }, [])

  return (
    <div className="min-h-screen bg-navy">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-b from-navy via-navy-2 to-navy-3">
        {/* Background SVG */}
        <div className="absolute inset-0 -z-10">
          <svg
            viewBox="0 0 680 400"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full opacity-60"
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
            <path d="M334 215Q338 202 332 190Q328 180 333 170" stroke="#fff" strokeWidth="2" fill="none" opacity=".07" strokeLinecap="round" />
            <path d="M345 212Q350 199 347 187Q344 177 349 167" stroke="#fff" strokeWidth="1.5" fill="none" opacity=".055" strokeLinecap="round" />
            <path d="M323 218Q327 207 322 197Q319 189 323 181" stroke="#fff" strokeWidth="1.5" fill="none" opacity=".05" strokeLinecap="round" />
            <ellipse cx="148" cy="280" rx="90" ry="54" fill="#140802" opacity=".9" />
            <ellipse cx="148" cy="275" rx="78" ry="46" fill="#b88430" />
            <ellipse cx="148" cy="272" rx="70" ry="40" fill="#c89240" />
            <path d="M102 270Q148 262 194 270Q148 278 102 270Z" fill="#a87828" opacity=".75" />
            <path d="M100 277Q148 268 196 277Q148 283 100 277Z" fill="#be8e3e" opacity=".65" />
            <ellipse cx="132" cy="271" rx="10" ry="3.5" fill="#7a5018" opacity=".55" />
            <ellipse cx="160" cy="275" rx="11" ry="3.5" fill="#7a5018" opacity=".5" />
            <ellipse cx="162" cy="264" rx="22" ry="13" fill="#1e4e1a" opacity=".9" />
            <ellipse cx="159" cy="262" rx="17" ry="10" fill="#266622" />
            <path d="M150 238Q154 228 149 218Q146 210 150 202" stroke="#fff" strokeWidth="1.5" fill="none" opacity=".06" strokeLinecap="round" />
            <ellipse cx="542" cy="275" rx="92" ry="56" fill="#140802" opacity=".9" />
            <rect x="500" y="258" width="88" height="22" rx="11" fill="#c8963c" />
            <rect x="498" y="271" width="92" height="9" rx="3.5" fill="#7a5824" opacity=".85" />
            <rect x="500" y="278" width="88" height="18" rx="9" fill="#c8963c" />
            <path d="M504 271Q521 265 538 271Q521 276 504 271Z" fill="#3e7a32" opacity=".9" />
            <path d="M526 271Q543 265 559 271Q543 276 526 271Z" fill="#347030" opacity=".9" />
            <ellipse cx="530" cy="271" rx="8" ry="4.5" fill="#b83020" opacity=".85" />
            <ellipse cx="546" cy="271" rx="7" ry="4.5" fill="#b83020" opacity=".75" />
            <path d="M545 240Q549 230 544 220Q541 212 545 204" stroke="#fff" strokeWidth="1.5" fill="none" opacity=".06" strokeLinecap="round" />
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

        {/* Dark Overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50 -z-10"></div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-bd">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl"></span>
            <div className="text-xl font-bold text-white tracking-tight">
              Strath<em className="text-gold not-italic">Eats</em>
            </div>
          </div>

          <ThemeToggle />
          <div className="flex items-center gap-6">
            <button onClick={() => document.getElementById('journey-sec')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-txt hover:text-gold transition duration-200">
              How it works
            </button>
            <button onClick={() => setShowRoleChooser(true)} className="text-sm text-txt hover:text-gold transition duration-200">
              Sign in
            </button>
            <Button variant="primary" size="sm" onClick={() => navigate('/vendor')}>
              Open a stall
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center py-20">
          <Pill>
            <span className="inline-block w-2 h-2 bg-gold rounded-full mr-1.5 animate-pulse"></span>
            {liveStallCount} stalls live now
          </Pill>

          <h1 className="mt-12 text-6xl font-bold text-white leading-tight max-w-4xl tracking-tight">
            Campus food,<br />
            <span className="text-gold">on your terms.</span>
          </h1>

          <p className="mt-8 text-lg text-txt/90 max-w-2xl leading-relaxed font-light">
            Browse live menus. Order from campus stalls. Pay via M-Pesa. Track your food in real-time.
          </p>

          <div className="mt-12 flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/order')} className="px-8">
              Start ordering
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/vendor')} className="px-8">
              I'm a vendor
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mt-16 flex gap-12">
            <div className="text-center">
              <p className="text-3xl font-bold text-gold">50+</p>
              <p className="text-sm text-txs mt-1">Menu items</p>
            </div>
            <div className="h-12 w-px bg-bd2"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gold">{liveStallCount}</p>
              <p className="text-sm text-txs mt-1">Stalls live</p>
            </div>
            <div className="h-12 w-px bg-bd2"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gold">500+</p>
              <p className="text-sm text-txs mt-1">Orders placed</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      {/* Role chooser modal (shown when clicking Sign in) */}
      {showRoleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRoleChooser(false)} />
          <div className="relative bg-navy-3 border border-bd2 rounded-lg p-8 w-full max-w-md text-center">
            <h3 className="text-xl font-bold text-white mb-4">Sign in as</h3>
            <p className="text-sm text-txt/80 mb-6">Choose the role that matches your account</p>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { setShowRoleChooser(false); navigate('/auth', { state: { role: 'student' } }) }} className="py-3 rounded-lg bg-gradient-to-br from-navy-4 to-navy-3 border border-bd2 text-white font-bold">Student</button>
              <button onClick={() => { setShowRoleChooser(false); navigate('/auth', { state: { role: 'staff' } }) }} className="py-3 rounded-lg bg-gradient-to-br from-navy-4 to-navy-3 border border-bd2 text-white font-bold">Staff / Lecturer</button>
              {/* Guest role removed from quick sign-in choices per request */}
              <button onClick={() => { setShowRoleChooser(false); navigate('/vendor') }} className="py-3 rounded-lg bg-transparent border border-bd2 text-gold font-bold">I'm a vendor</button>
            </div>
            <button onClick={() => setShowRoleChooser(false)} className="mt-6 text-sm text-txt/70">Cancel</button>
          </div>
        </div>
      )}
      <div id="journey-sec" className="py-24 px-8 bg-navy-2 border-t border-bd">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <Pill>How it works</Pill>
            <h2 className="mt-8 text-5xl font-bold text-white">
              Four simple steps to your meal
            </h2>
            <p className="mt-6 text-lg text-txt/80 max-w-2xl mx-auto">
              We've streamlined the whole process so you spend less time ordering and more time eating.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Choose role', desc: 'Student, staff, vendor, or admin?' },
              { num: '2', title: 'Sign in', desc: 'Quick registration or login' },
              { num: '3', title: 'Browse & order', desc: 'Pick stalls, add items, pay' },
              { num: '4', title: 'Pick up', desc: 'Order ready notification' },
            ].map((step) => (
              <div key={step.num} className="relative group">
                <div className="bg-gradient-to-br from-navy-3 to-navy-4 border border-bd2 rounded-lg p-8 hover:border-gold/50 transition duration-300 h-full">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-2 text-navy font-bold flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition duration-300">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-white text-lg mb-3">{step.title}</h3>
                  <p className="text-sm text-txs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-8 bg-navy">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <Pill>Powerful features</Pill>
            <h2 className="mt-8 text-5xl font-bold text-white">
              Everything for seamless ordering
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {[
              { title: 'Live Menus', desc: 'Real-time updates from every stall on campus' },
              { title: 'M-Pesa Payments', desc: 'Safe and secure mobile money checkout' },
              { title: 'Vendor Tools', desc: 'Orders, menu management, and analytics' },
              { title: 'Instant Tracking', desc: 'See your order status as it progresses' },
              { title: 'Admin Insights', desc: 'Platform analytics and stall management' },
              { title: 'Smart Notifications', desc: 'Get alerts when your order is ready' },
            ].map((feat, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-navy-3 via-navy-3 to-navy-4 border border-bd2 rounded-lg p-8 hover:border-gold/50 hover:from-navy-4 transition duration-300 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition duration-300 inline-block">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{feat.title}</h3>
                <p className="text-sm text-txt/70 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* For Everyone Section */}
      <div className="py-24 px-8 bg-navy-2 border-t border-bd">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <Pill>Built for everyone</Pill>
            <h2 className="mt-8 text-5xl font-bold text-white">
              A platform for the entire campus
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {

                role: 'Students & Staff',
                points: ['Browse live menus', 'Order in seconds', 'Track pickups'],
              },
              {

                role: 'Vendors',
                points: ['Manage menus', 'Accept orders', 'View analytics'],
              },
              {

                role: 'Admins',
                points: ['Platform oversight', 'Stall management', 'Revenue insights'],
              },
            ].map((user, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-navy-3 to-navy-4 border border-bd2 rounded-lg p-10 text-center hover:border-gold/50 transition duration-300 group"
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition duration-300 inline-block">
                </div>
                <h3 className="font-bold text-white text-xl mb-6">{user.role}</h3>
                <ul className="space-y-3 text-sm text-txt/80">
                  {user.points.map((point, j) => (
                    <li key={j} className="flex items-center gap-3">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-8 bg-navy border-t border-bd">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to order?</h2>
          <p className="text-lg text-txt/80 mb-10">
            Join 500+ students already enjoying campus food delivered fast and paid easy.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/order')} className="px-10">
              Start ordering now
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/vendor')} className="px-10">
              Open your stall
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-navy-2 border-t border-bd px-8 py-12 text-center text-sm text-txtd">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center justify-center gap-2">
            <span className="text-2xl"></span>
            <div className="font-bold text-white text-lg">
              Strath<em className="text-gold not-italic">Eats</em>
            </div>
          </div>
          <p className="mb-6"> 2026 StrathEats. Making campus food simple, fast, and delicious.</p>
          {/* Admin access intentionally hidden from footer to avoid public exposure. Use direct /admin route when needed. */}
        </div>
      </footer>
    </div>
  )
}
