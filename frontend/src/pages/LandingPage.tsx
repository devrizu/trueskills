import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageTransition } from '../components/layout/PageTransition'
import { CheckCircle, ShieldCheck, Trophy, Search, Play } from 'lucide-react'

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
        <section className="relative">
          {/* Illustration behind hero content */}
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none -z-1" aria-hidden="true">
            <svg width="1360" height="578" viewBox="0 0 1360 578" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="illustration-01">
                  <stop stopColor="#DFF3F3" offset="0%" />
                  <stop stopColor="#F4F5F7" offset="100%" />
                </linearGradient>
              </defs>
              <g fill="url(#illustration-01)" fillRule="evenodd">
                <circle cx="1232" cy="128" r="128" />
                <circle cx="155" cy="443" r="64" />
              </g>
            </svg>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="pt-32 pb-12 md:pt-40 md:pb-20">
              {/* Section header */}
              <div className="text-center pb-12 md:pb-16">
                <h1 className="text-5xl md:text-6xl font-display font-extrabold leading-tighter tracking-tighter mb-4 text-graphite-950">
                  Hire the Top 1%, <br className="hidden lg:block" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-signal-600 to-ai-600">Verified by AI.</span>
                </h1>
                <div className="max-w-3xl mx-auto">
                  <p className="text-xl text-graphite-600 mb-8">
                    TrueSkills connects top tech talent with forward-thinking companies. 
                    We use AI to verify skills, analyze GitHub activity, and uncover true potential.
                  </p>
                  <div className="max-w-xs mx-auto sm:max-w-none sm:flex sm:justify-center gap-4">
                    <Button size="lg" onClick={() => navigate('/signup?role=recruiter')} className="w-full sm:w-auto shadow-lg shadow-signal-600/20">
                      Start Hiring
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => navigate('/signup?role=student')} className="w-full sm:w-auto mt-4 sm:mt-0">
                      Join as a Candidate
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hero image */}
              <div>
                <div className="relative flex justify-center mb-8">
                  <div className="flex flex-col justify-center">
                    <img className="mx-auto rounded-card shadow-2xl border border-graphite-200" src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" width="1024" height="504" alt="Hero" />
                  </div>
                  <button className="absolute top-full flex items-center transform -translate-y-1/2 bg-white rounded-full font-medium group p-4 shadow-lg border border-graphite-200">
                    <Play className="w-6 h-6 fill-current text-signal-600 group-hover:text-signal-400 shrink-0" />
                    <span className="ml-3 text-graphite-950">Watch the full video (2 min)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features ZigZag Section */}
        <section className="relative border-t border-graphite-200 bg-surface">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="py-12 md:py-20">
              <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-graphite-950 mb-4">Everything you need to find the perfect fit</h2>
                <p className="text-xl text-graphite-600">We go beyond traditional resumes, using verifiable data and AI to build a comprehensive picture of every candidate.</p>
              </div>

              {/* Items */}
              <div className="grid gap-20">
                {/* 1st item */}
                <div className="md:grid md:grid-cols-12 md:gap-6 items-center">
                  <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1">
                    <img className="max-w-full mx-auto md:max-w-none h-auto rounded-card shadow-xl border border-graphite-200" src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" width="540" height="405" alt="Feature 1" />
                  </div>
                  <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6">
                    <div className="md:pr-4 lg:pr-12 xl:pr-16">
                      <div className="font-logo text-xl text-signal-600 font-bold mb-2">Verified Experience</div>
                      <h3 className="text-2xl font-display font-bold text-graphite-950 mb-3">Automatic GitHub Verification</h3>
                      <p className="text-lg text-graphite-600 mb-4">Our system automatically verifies GitHub repositories and open-source contributions to ensure candidates have the experience they claim.</p>
                      <ul className="text-lg text-graphite-600 -mb-2">
                        <li className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-success mr-2 shrink-0" />
                          <span>Commit history analysis</span>
                        </li>
                        <li className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-success mr-2 shrink-0" />
                          <span>Code quality assessment</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-success mr-2 shrink-0" />
                          <span>Collaboration signals</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 2nd item */}
                <div className="md:grid md:grid-cols-12 md:gap-6 items-center">
                  <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:rtl">
                    <img className="max-w-full mx-auto md:max-w-none h-auto rounded-card shadow-xl border border-graphite-200" src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" width="540" height="405" alt="Feature 2" />
                  </div>
                  <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6">
                    <div className="md:pl-4 lg:pl-12 xl:pl-16">
                      <div className="font-logo text-xl text-ai-600 font-bold mb-2">Semantic Search</div>
                      <h3 className="text-2xl font-display font-bold text-graphite-950 mb-3">Find exact matches with AI</h3>
                      <p className="text-lg text-graphite-600 mb-4">Recruiters can find candidates using natural language. Just type what you're looking for, and our AI will find the best match based on real skills, not keyword stuffing.</p>
                      <ul className="text-lg text-graphite-600 -mb-2">
                        <li className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-success mr-2 shrink-0" />
                          <span>Natural language queries</span>
                        </li>
                        <li className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-success mr-2 shrink-0" />
                          <span>Skill gap analysis</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-success mr-2 shrink-0" />
                          <span>Instant matching scores</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials / Features Cards */}
        <section className="relative bg-canvas border-t border-graphite-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="py-12 md:py-20">
              <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-graphite-950 mb-4">Why choose TrueSkills</h2>
                <p className="text-xl text-graphite-600">Stop relying on outdated resumes and start hiring based on verified, undeniable proof of work.</p>
              </div>

              <div className="max-w-sm mx-auto grid gap-6 md:grid-cols-3 items-start md:max-w-2xl lg:max-w-none">
                {/* 1st card */}
                <div className="flex flex-col h-full bg-surface shadow-sm border border-graphite-200 p-6 rounded-card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-signal-100 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-signal-600" />
                  </div>
                  <h4 className="text-xl font-display font-bold text-graphite-950 mb-2">Verified Experience</h4>
                  <p className="text-graphite-600 grow">We integrate directly with GitHub to pull in real contributions, ensuring candidate skills are backed by actual code.</p>
                </div>
                {/* 2nd card */}
                <div className="flex flex-col h-full bg-surface shadow-sm border border-graphite-200 p-6 rounded-card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <Trophy className="w-6 h-6 text-orange-500" />
                  </div>
                  <h4 className="text-xl font-display font-bold text-graphite-950 mb-2">Competitive Edge</h4>
                  <p className="text-graphite-600 grow">Host hackathons and competitions. Candidates showcase their problem-solving skills in action, moving beyond technical interviews.</p>
                </div>
                {/* 3rd card */}
                <div className="flex flex-col h-full bg-surface shadow-sm border border-graphite-200 p-6 rounded-card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-ai-100 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-ai-600" />
                  </div>
                  <h4 className="text-xl font-display font-bold text-graphite-950 mb-2">Semantic Search</h4>
                  <p className="text-graphite-600 grow">Stop relying on keyword matching. Our AI-driven search understands context and finds candidates who truly fit your requirements.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="pb-12 md:pb-20">
              <div className="bg-graphite-950 rounded-card py-10 px-8 md:py-16 md:px-12 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 -mt-24 -mr-24 pointer-events-none opacity-20" aria-hidden="true">
                  <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="128" cy="128" r="128" fill="url(#illustration-02)" />
                    <defs>
                      <linearGradient x1="0%" y1="0%" x2="100%" y2="100%" id="illustration-02">
                        <stop stopColor="#3DBFC0" offset="0%" />
                        <stop stopColor="#0F8B8D" offset="100%" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="relative flex flex-col lg:flex-row justify-between items-center">
                  <div className="text-center lg:text-left lg:max-w-xl mb-6 lg:mb-0">
                    <h3 className="text-3xl font-display font-bold text-white mb-2">Ready to transform your hiring?</h3>
                    <p className="text-graphite-400 text-lg mb-0">Join thousands of candidates and companies already using TrueSkills to build better teams.</p>
                  </div>
                  <div>
                    <Button size="lg" onClick={() => navigate('/signup?role=recruiter')} className="bg-signal-600 hover:bg-signal-400 text-white border-none">
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
