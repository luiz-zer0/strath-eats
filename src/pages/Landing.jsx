import { useNavigate } from 'react-router-dom'
import { Pill } from '../components/common/Pill'
import { Button } from '../components/common/Button'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-navy">
      {/* Hero Section */}
      <div className="relative h-screen flex flex-col overflow-hidden bg-navy">
        {/* Background SVG (simplified background) */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy-3 to-navy-2"></div>
        </div>

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
