import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Briefcase, MapPin, Plus, Clock } from 'lucide-react'

// Basic Job Posting interface for the list view
export interface JobPosting {
  id: string
  title: string
  description: string
  location: string
  employment_type: string
  status: string
  created_at: string
  recruiter_id: string
  recruiter?: {
    recruiter_profiles?: {
      company_name: string
    }
  }
}

export function JobsPage() {
  const { appUser } = useAuth()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isRecruiter = appUser?.role === 'recruiter' || appUser?.role === 'admin'

  useEffect(() => {
    async function fetchJobs() {
      try {
        let query = supabase
          .from('job_postings')
          .select(`
            *,
            recruiter:users ( recruiter_profiles ( company_name ) )
          `)
          .order('created_at', { ascending: false })

        // If recruiter, only show their own jobs for now? Or show all?
        // Let's show all, but we could add a tab for "My Jobs" later.
        // Actually, PRD says "Recruiters post jobs (title, description, required skills, location)." 
        // For MVP, showing all jobs is fine for both.

        const { data } = await query

        if (data) {
          // Flatten the response slightly for ease of use
          setJobs(data as unknown as JobPosting[])
        }
      } catch (error) {
        console.error('Error fetching jobs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [appUser])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-graphite-200 border-t-signal-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-graphite-950">Job Board</h1>
          <p className="text-sm text-graphite-600 font-body">
            Find roles that match your verified skills, or post opportunities to hire top talent.
          </p>
        </div>
        {isRecruiter && (
          <Link to="/jobs/new">
            <Button>
              <Plus size={16} />
              Post a Job
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Card key={job.id} hover className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-display font-semibold text-graphite-950">
                    {job.title}
                  </h3>
                  {job.status === 'closed' && (
                    <Badge variant="default">Closed</Badge>
                  )}
                </div>
                
                <div className="text-sm font-semibold text-signal-600">
                  {job.recruiter?.recruiter_profiles?.company_name || 'Company Name'}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-graphite-600 mt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1.5 capitalize">
                    <Briefcase size={14} />
                    {job.employment_type.replace('-', ' ')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <Link to={`/jobs/${job.id}`} className="sm:w-auto w-full shrink-0">
                <Button variant="secondary" fullWidth>View Details</Button>
              </Link>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center text-graphite-600 bg-white rounded-button border border-graphite-200">
            No jobs have been posted yet.
          </div>
        )}
      </div>
    </div>
  )
}
