import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { GraduationCap, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function SignupPage() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'student'
  const [role, setRole] = useState<'student' | 'recruiter'>(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signInWithOAuth } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      await signUp(email, password, role, fullName)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src="/logo.png" alt="TrueSkills Logo" className="h-10" />
          <span className="text-2xl font-logo font-bold text-graphite-950">TrueSkills</span>
        </div>

        {/* Card */}
        <div className="bg-surface border border-graphite-200 rounded-card p-8">
          <h1 className="text-[22px] font-display font-semibold text-graphite-950 text-center mb-1">
            Create your account
          </h1>
          <p className="text-sm text-graphite-600 font-body text-center mb-6">
            Join TrueSkills — it's completely free
          </p>

          {error && (
            <div className="bg-error/10 text-error text-sm font-body px-4 py-3 rounded-button mb-4">
              {error}
            </div>
          )}

          {/* Role selector slider */}
          <div className="relative flex bg-canvas p-1 rounded-full mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 relative z-10 py-2.5 flex items-center justify-center gap-2 text-sm font-body font-medium transition-colors ${
                role === 'student' ? 'text-graphite-950' : 'text-graphite-500 hover:text-graphite-700'
              }`}
            >
              <GraduationCap size={18} className={role === 'student' ? 'text-signal-600' : 'text-graphite-400'} />
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`flex-1 relative z-10 py-2.5 flex items-center justify-center gap-2 text-sm font-body font-medium transition-colors ${
                role === 'recruiter' ? 'text-graphite-950' : 'text-graphite-500 hover:text-graphite-700'
              }`}
            >
              <Building2 size={18} className={role === 'recruiter' ? 'text-signal-600' : 'text-graphite-400'} />
              Recruiter
            </button>
            <motion.div
              layoutId="roleSlider"
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface shadow-sm rounded-full border border-graphite-200/50"
              initial={false}
              animate={{
                left: role === 'student' ? '4px' : '50%',
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-graphite-200" />
            <span className="text-xs text-graphite-400 font-body">or continue with</span>
            <div className="flex-1 h-px bg-graphite-200" />
          </div>

          {/* OAuth */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              type="button"
              onClick={() => signInWithOAuth('google')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              variant="secondary"
              fullWidth
              type="button"
              onClick={() => signInWithOAuth('github')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-graphite-600 font-body mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-signal-600 hover:text-signal-600/80 font-medium no-underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
