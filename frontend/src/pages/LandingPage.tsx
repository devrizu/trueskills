
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageTransition } from '../components/layout/PageTransition'
import { CheckCircle, ShieldCheck, Trophy, MagnifyingGlass as Search, PlayCircle as Play, CodeBlock } from '@phosphor-icons/react'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <PageTransition className="min-h-screen bg-canvas overflow-hidden font-body text-graphite-600">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-graphite-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Site branding */}
            <div className="shrink-0 mr-4">
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="TrueSkills Logo" className="h-8" />
                <span className="text-xl font-logo font-bold text-graphite-950">TrueSkills</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="flex grow">
              <ul className="flex grow justify-end flex-wrap items-center">
                <li>
                  <Link to="/login" className="font-medium text-graphite-600 hover:text-graphite-950 px-4 py-3 flex items-center transition duration-150 ease-in-out">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Button size="sm" onClick={() => navigate('/signup?role=recruiter')} className="ml-3">
                    Start Hiring
                  </Button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 md:pt-32 pb-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-signal-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-ai-50 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none"></div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-graphite-950 mb-6 leading-[1.1]">
                Hire the Top 1%, <br />
                <span className="text-signal-600">Verified by Code.</span>
              </h1>
              <p className="text-xl md:text-2xl text-graphite-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                Stop guessing. We analyze actual GitHub activity, project commits, and competitive ranks to find the talent you actually need.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={() => navigate('/signup?role=recruiter')} className="w-full sm:w-auto h-14 px-8 text-lg shadow-lg shadow-signal-600/20">
                  Start Hiring Now
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/signup?role=student')} className="w-full sm:w-auto h-14 px-8 text-lg">
                  Join as Candidate
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative mx-auto max-w-5xl">
              <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-graphite-900/5">
                <img className="w-full object-cover max-h-[600px]" src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Team collaborating" />
              </div>
              <button className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-graphite-950 text-white rounded-full pl-2 pr-6 py-2 shadow-xl hover:bg-graphite-900 hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-none">
                <Play weight="fill" className="w-10 h-10 text-signal-400 group-hover:text-signal-300" />
                <span className="font-medium">See how it works</span>
              </button>
            </div>
          </div>
        </section>

        {/* Features ZigZag Section */}
        <section className="py-24 md:py-32 bg-surface">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-20">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-graphite-950 tracking-tight max-w-2xl leading-[1.15]">
                Skip the resumes. <br/>Look at the real work.
              </h2>
            </div>

            <div className="grid gap-24">
              {/* Feature 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 md:pr-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-signal-100 flex items-center justify-center text-signal-600">
                      <CodeBlock size={24} weight="duotone" />
                    </div>
                    <span className="font-semibold tracking-wide text-signal-600 uppercase text-sm">Deep Integration</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-display font-bold text-graphite-950 mb-4 leading-tight">
                    Automatic GitHub Verification
                  </h3>
                  <p className="text-lg text-graphite-600 mb-8 leading-relaxed">
                    Our AI automatically analyzes commit histories, pull requests, and open-source contributions. Don't trust what they say they know—trust what they've built.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle size={24} weight="fill" className="text-graphite-900 shrink-0" />
                      <span className="text-graphite-700 text-lg">Code quality and pattern analysis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={24} weight="fill" className="text-graphite-900 shrink-0" />
                      <span className="text-graphite-700 text-lg">Real collaboration and teamwork signals</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 md:order-2 relative">
                  <div className="absolute inset-0 bg-signal-100/50 rounded-3xl -rotate-3 scale-105"></div>
                  <img className="relative z-10 w-full h-[400px] object-cover rounded-3xl shadow-xl ring-1 ring-graphite-900/5" src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Code verification" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-ai-100/50 rounded-3xl rotate-3 scale-105"></div>
                  <img className="relative z-10 w-full h-[400px] object-cover rounded-3xl shadow-xl ring-1 ring-graphite-900/5" src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Semantic Search" />
                </div>
                <div className="md:pl-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-ai-100 flex items-center justify-center text-ai-600">
                      <Search size={24} weight="duotone" />
                    </div>
                    <span className="font-semibold tracking-wide text-ai-600 uppercase text-sm">AI Powered</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-display font-bold text-graphite-950 mb-4 leading-tight">
                    Find Exact Matches Semantically
                  </h3>
                  <p className="text-lg text-graphite-600 mb-8 leading-relaxed">
                    Stop searching for exact keywords. Describe your perfect candidate naturally, and our AI will find developers whose actual projects match the core required skills.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle size={24} weight="fill" className="text-graphite-900 shrink-0" />
                      <span className="text-graphite-700 text-lg">Natural language requirement queries</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={24} weight="fill" className="text-graphite-900 shrink-0" />
                      <span className="text-graphite-700 text-lg">Instant matching scores based on real code</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-24 md:py-32 bg-canvas">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-graphite-950 tracking-tight">
                Built for serious teams.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Wide Card */}
              <div className="md:col-span-2 bg-surface rounded-3xl p-10 shadow-sm ring-1 ring-graphite-900/5 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute right-0 top-0 w-64 h-64 bg-signal-50 rounded-bl-[100px] -z-0 transition-transform duration-700 group-hover:scale-110"></div>
                <div className="w-16 h-16 rounded-2xl bg-signal-100 flex items-center justify-center mb-8 relative z-10 text-signal-600 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck size={32} weight="duotone" />
                </div>
                <h4 className="text-3xl font-display font-bold text-graphite-950 mb-4 relative z-10">Undeniable Proof</h4>
                <p className="text-lg text-graphite-600 max-w-md relative z-10 leading-relaxed">We integrate directly with GitHub to pull in real contributions, ensuring candidate skills are backed by actual code, not just claims on a PDF.</p>
              </div>

              {/* Tall/Square Card */}
              <div className="md:col-span-1 bg-surface rounded-3xl p-10 shadow-sm ring-1 ring-graphite-900/5 relative overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-8 text-orange-500 group-hover:scale-110 transition-transform duration-300">
                  <Trophy size={32} weight="duotone" />
                </div>
                <div>
                  <h4 className="text-3xl font-display font-bold text-graphite-950 mb-4">Competitive Edge</h4>
                  <p className="text-lg text-graphite-600 leading-relaxed">Candidates showcase problem-solving through live hackathons.</p>
                </div>
              </div>

              {/* Another Wide Card */}
              <div className="md:col-span-3 bg-graphite-950 rounded-3xl p-10 md:p-14 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 group">
                <div className="absolute inset-0 bg-gradient-to-r from-ai-900/50 to-transparent pointer-events-none"></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-ai-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 transition-transform duration-700 group-hover:scale-150 pointer-events-none"></div>
                <div className="relative z-10 max-w-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-ai-900/80 border border-ai-800 flex items-center justify-center mb-8 text-ai-400 group-hover:rotate-12 transition-transform duration-300">
                    <Search size={32} weight="duotone" />
                  </div>
                  <h4 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 leading-tight">Semantic Talent Discovery</h4>
                  <p className="text-xl text-graphite-400 leading-relaxed">Stop relying on keyword matching. Find candidates whose actual projects match the specific architectural patterns and tech stack you need.</p>
                </div>
                <div className="relative z-10 w-full md:w-auto shrink-0 mt-6 md:mt-0">
                  <Button size="lg" onClick={() => navigate('/signup?role=recruiter')} className="w-full bg-ai-600 hover:bg-ai-500 text-white border-none h-14 px-8 text-lg hover:-translate-y-1 transition-transform">
                    Try the Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-canvas">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="pb-24 md:pb-32">
              <div className="bg-gradient-to-br from-signal-600 to-signal-800 rounded-3xl py-16 px-8 md:py-20 md:px-16 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-full h-full pointer-events-none opacity-20" aria-hidden="true">
                  <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-white rounded-full mix-blend-overlay filter blur-[80px] translate-x-1/3 -translate-y-1/3"></div>
                </div>
                <div className="relative flex flex-col lg:flex-row justify-between items-center z-10 gap-10">
                  <div className="text-center lg:text-left lg:max-w-2xl">
                    <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight leading-tight">Ready to transform your hiring?</h3>
                    <p className="text-signal-100 text-xl md:text-2xl mb-0 font-body">Join thousands of candidates and companies already using TrueSkills to build better teams.</p>
                  </div>
                  <div className="shrink-0 w-full lg:w-auto">
                    <Button size="lg" onClick={() => navigate('/signup?role=recruiter')} className="w-full bg-white text-signal-700 hover:bg-signal-50 hover:text-signal-800 border-none shadow-xl h-14 px-10 text-lg">
                      Create Free Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-graphite-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="TrueSkills Logo" className="h-6 opacity-80" />
              <span className="text-lg font-logo font-bold text-graphite-950">TrueSkills</span>
            </div>
            <div className="flex gap-6 text-sm text-graphite-600">
              <Link to="/privacy" className="hover:text-graphite-950 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-graphite-950 transition-colors">Terms of Service</Link>
            </div>
            <p className="text-sm text-graphite-400">© {new Date().getFullYear()} TrueSkills. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </PageTransition>
  )
}
