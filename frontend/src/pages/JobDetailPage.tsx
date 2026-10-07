import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ArrowLeft, MapPin, Briefcase, Clock, Building2, Sparkles } from 'lucide-react'
import type { JobPosting } from './JobsPage'
import { matchApplicants } from '../api'

interface Application {
  id: string
  student_id: string
  status: string
  applied_at: string
  student?: {
    student_profiles?: {
      full_name: string
      bio?: string
      location?: string
    }
  }
  user_skills?: {
    self_rated_level: string
    skills: { name: string }
  }[]
  aiScore?: number
  aiRationale?: string
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { appUser } = useAuth()

  const [job, setJob] = useState<JobPosting | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [message, setMessage] = useState('')

  const [isRanking, setIsRanking] = useState(false)

  const isRecruiter = appUser?.role === 'recruiter' || appUser?.role === 'admin'
  const isOwner = job?.recruiter_id === appUser?.id

  useEffect(() => {
    async function fetchData() {
      if (!id || !appUser) return
      
      try {
        // Fetch Job
        const { data: jobData } = await supabase
          .from('job_postings')
          .select(`
            *,
            recruiter:users ( recruiter_profiles ( company_name ) )
          `)
          .eq('id', id)
          .single()

        if (jobData) {
          setJob(jobData as unknown as JobPosting)
        }

        // Fetch Application Status for Student
        if (appUser.role === 'student') {
          const { data: appData } = await supabase
            .from('applications')
            .select('*')
            .eq('job_posting_id', id)
            .eq('student_id', appUser.id)
            .maybeSingle()
            
          if (appData) {
            setHasApplied(true)
          }
        }

        // Fetch all applications if owner
        if (jobData?.recruiter_id === appUser.id) {
          const { data: applicantsData } = await supabase
            .from('applications')
            .select(`
              id, status, applied_at, student_id,
              student:users ( student_profiles ( full_name, bio, location ) )
            `)
            .eq('job_posting_id', id)
            .order('applied_at', { ascending: false })
            
          if (applicantsData) {
            // Fetch skills for each applicant manually since we need to cross tables from user_id
            const studentIds = applicantsData.map(a => a.student_id)
            const { data: skillsData } = await supabase
              .from('user_skills')
              .select('user_id, self_rated_level, skills(name)')
              .in('user_id', studentIds)
              
            const appsWithSkills = applicantsData.map((app: any) => ({
              ...app,
              user_skills: skillsData?.filter(s => s.user_id === app.student_id) || []
            }))
            
            setApplications(appsWithSkills as unknown as Application[])
          }
        }

      } catch (error) {
        console.error('Error fetching job details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, appUser])

  async function handleApply() {
    if (!appUser || !job) return
    setIsApplying(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_posting_id: job.id,
          student_id: appUser.id,
          status: 'applied'
        })

      if (error) throw error
      
      setHasApplied(true)
      setMessage('Application submitted successfully!')
    } catch (error) {
      console.error(error)
      setMessage('Failed to apply. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }

  async function handleRankApplicants() {
    if (!job || applications.length === 0) return
    setIsRanking(true)
    try {
      const applicantsPayload = applications.map(app => ({
        user_id: app.student_id,
        bio: app.student?.student_profiles?.bio,
        location: app.student?.student_profiles?.location,
        skills: app.user_skills?.map(s => `${s.skills.name} (${s.self_rated_level})`)
      }))
      
      const res = await matchApplicants(job.description, applicantsPayload)
      
      if (res.rankings) {
        const rankedApps = [...applications].map(app => {
          const match = res.rankings.find((r: any) => r.user_id === app.student_id)
          if (match) {
            return { ...app, aiScore: match.score, aiRationale: match.rationale }
          }
          return app
        }).sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
        
        setApplications(rankedApps)
      }
    } catch (error) {
      console.error(error)
      alert("Failed to rank applicants.")
    } finally {
      setIsRanking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-graphite-200 border-t-signal-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!job) {
    return <div className="text-center py-12">Job not found.</div>
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/jobs')}
          className="p-2 rounded-full hover:bg-graphite-200/50 text-graphite-600 transition-colors border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <Badge variant={job.status === 'open' ? 'success' : 'default'}>
          {job.status}
        </Badge>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        {/* Left Column: Job Details */}
        <div className="flex-1 flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-graphite-950 mb-1">{job.title}</h1>
              <div className="text-lg font-semibold text-signal-600 flex items-center gap-2">
                <Building2 size={18} />
                {job.recruiter?.recruiter_profiles?.company_name || 'Company'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-graphite-600 font-body py-4 border-y border-graphite-200">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} />
                {job.location}
              </div>
              <div className="flex items-center gap-1.5 capitalize">
                <Briefcase size={16} />
                {job.employment_type.replace('-', ' ')}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                Posted {new Date(job.created_at).toLocaleDateString()}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-graphite-950 mb-3">About the Role</h3>
              <p className="whitespace-pre-wrap text-sm text-graphite-600 font-body leading-relaxed">
                {job.description}
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Actions & Applicants */}
        <div className="w-full md:w-80 flex flex-col gap-4 shrink-0">
          {!isRecruiter && (
            <Card className="text-center">
              {message && <div className="mb-4 text-sm text-success">{message}</div>}
              {hasApplied ? (
                <Button variant="secondary" fullWidth disabled>
                  Applied
                </Button>
              ) : (
                <Button fullWidth onClick={handleApply} disabled={isApplying || job.status !== 'open'}>
                  {job.status === 'open' ? (isApplying ? 'Applying...' : 'Apply Now') : 'Closed'}
                </Button>
              )}
            </Card>
          )}

          {isOwner && (
            <Card>
              <div className="flex items-center justify-between border-b border-graphite-200 pb-2 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-graphite-950">
                  Applicants ({applications.length})
                </h3>
                {applications.length > 0 && (
                  <button
                    onClick={handleRankApplicants}
                    disabled={isRanking}
                    className="text-[11px] font-semibold flex items-center gap-1 uppercase tracking-wider text-ai-600 bg-ai-100 hover:bg-ai-100/80 py-1 px-2 rounded-full transition-colors cursor-pointer disabled:opacity-50 border-none"
                  >
                    <Sparkles size={12} />
                    {isRanking ? 'Ranking...' : 'AI Rank'}
                  </button>
                )}
              </div>
              
              {applications.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {applications.map(app => (
                    <div key={app.id} className="flex flex-col gap-1 p-3 border border-graphite-200 rounded-card hover:bg-canvas transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-medium text-graphite-950">
                          <Link to={`/profile/${app.student_id}`} className="hover:underline text-graphite-950">
                            {app.student?.student_profiles?.full_name || 'Candidate'}
                          </Link>
                        </div>
                        {app.aiScore !== undefined && (
                          <div className="text-xs font-mono font-semibold text-ai-600 bg-ai-100 px-2 rounded">
                            {app.aiScore}%
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-graphite-600">
                        <span className="capitalize">{app.status}</span>
                        <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                      
                      {app.aiRationale && (
                        <div className="mt-2 text-xs text-ai-600 bg-ai-100/50 p-2 rounded italic">
                          "{app.aiRationale}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-graphite-600 text-center py-4">
                  No applicants yet.
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
