import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { searchCandidates, getCandidateSummary, draftOutreach } from '../api'
import { useAuth } from '../contexts/AuthContext'
import type { RecruiterProfile } from '../types'


export function CandidateSearchPage() {
  const { profile, appUser } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // State for AI generation
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [outreachDrafts, setOutreachDrafts] = useState<Record<string, string>>({})
  const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>({})
  const [loadingOutreach, setLoadingOutreach] = useState<Record<string, boolean>>({})

  const [jobDescription, setJobDescription] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsSearching(true)
    try {
      const res = await searchCandidates(query)
      setResults(res.results || [])
    } catch (error) {
      console.error(error)
      alert('Failed to search candidates.')
    } finally {
      setIsSearching(false)
    }
  }

  async function handleGenerateSummary(candidate: any) {
    const uid = candidate.user_id
    setLoadingSummary(prev => ({ ...prev, [uid]: true }))
    try {
      const res = await getCandidateSummary(candidate)
      setSummaries(prev => ({ ...prev, [uid]: res.summary }))
    } catch (error) {
      console.error(error)
      alert('Failed to generate summary.')
    } finally {
      setLoadingSummary(prev => ({ ...prev, [uid]: false }))
    }
  }

  async function handleDraftOutreach(candidate: any) {
    if (!jobDescription) {
      alert('Please enter a job description above to draft an outreach message.')
      return
    }
    
    const uid = candidate.user_id
    setLoadingOutreach(prev => ({ ...prev, [uid]: true }))
    try {
      const recruiterName = (profile as RecruiterProfile)?.full_name || 'A Recruiter'
      const companyName = (profile as RecruiterProfile)?.company_name || 'Our Company'
      
      const res = await draftOutreach(candidate, jobDescription, recruiterName, companyName)
      setOutreachDrafts(prev => ({ ...prev, [uid]: res.message }))
    } catch (error) {
      console.error(error)
      alert('Failed to draft outreach.')
    } finally {
      setLoadingOutreach(prev => ({ ...prev, [uid]: false }))
    }
  }

  async function handleSendDM(candidate: any) {
    const uid = candidate.user_id
    const content = outreachDrafts[uid]
    if (!content || !appUser?.id) return

    navigate(`/messages?user_id=${uid}&draft=${encodeURIComponent(content)}`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-graphite-950 mb-2">
          AI Candidate Search
        </h1>
        <p className="text-graphite-600 font-body">
          Use semantic search to find candidates whose profiles and skills match your query.
        </p>
      </div>

      <div className="bg-surface border border-graphite-200 rounded-card p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., A frontend engineer who knows React and has a strong sense of design"
            className="flex-1 bg-canvas border border-graphite-300 text-graphite-900 text-sm rounded-input focus:ring-signal-500 focus:border-signal-500 block p-2.5 outline-none"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex items-center justify-center font-body font-semibold rounded-button bg-signal-600 text-white hover:bg-signal-600/90 active:bg-signal-600/80 text-sm px-6 py-2 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
        
        <div className="mb-2">
          <label className="block text-sm font-medium text-graphite-900 mb-1">
            Context for Outreach Drafts (Optional)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste a short job description here to generate highly personalized outreach messages."
            className="w-full bg-canvas border border-graphite-300 text-graphite-900 text-sm rounded-input focus:ring-signal-500 focus:border-signal-500 block p-2.5 outline-none resize-none"
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-6">
        {results.length === 0 && !isSearching && query && (
          <p className="text-graphite-600">No candidates found matching that criteria.</p>
        )}
        
        {results.map((candidate) => (
          <div key={candidate.user_id} className="bg-surface border border-graphite-200 rounded-card p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-graphite-100 flex items-center justify-center text-graphite-500 font-bold text-xl uppercase">
                  {candidate.full_name ? candidate.full_name.charAt(0) : '?'}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-graphite-950">
                    <Link to={`/profile/${candidate.user_id}`} className="hover:underline text-graphite-950">
                      {candidate.full_name || 'Anonymous User'}
                    </Link>
                  </h3>
                  <p className="text-sm text-graphite-600">{candidate.location || 'Location not specified'}</p>
                </div>
              </div>
              <div className="text-sm font-medium text-signal-600 bg-signal-50 px-3 py-1 rounded-full">
                {Math.round(candidate.similarity * 100)}% Match
              </div>
            </div>
            
            <p className="text-sm text-graphite-800 mb-4">{candidate.bio}</p>
            
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider mb-2">Top Skills</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.skills && candidate.skills.map((skill: any, idx: number) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-graphite-100 text-graphite-800">
                    {skill.name}
                    <span className="opacity-50 font-normal">({skill.level})</span>
                  </span>
                ))}
                {(!candidate.skills || candidate.skills.length === 0) && (
                  <span className="text-sm text-graphite-500">No skills listed.</span>
                )}
              </div>
            </div>

            <div className="flex gap-4 border-t border-graphite-100 pt-4">
              <div className="flex-1">
                <button 
                  onClick={() => handleGenerateSummary(candidate)}
                  disabled={loadingSummary[candidate.user_id]}
                  className="text-sm font-semibold text-accent-600 hover:text-accent-700 disabled:opacity-50"
                >
                  {loadingSummary[candidate.user_id] ? 'Analyzing...' : '✦ Generate AI Summary'}
                </button>
                {summaries[candidate.user_id] && (
                  <div className="mt-3 p-3 bg-accent-50 rounded-lg border border-accent-100 text-sm text-accent-900 italic">
                    {summaries[candidate.user_id]}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <button 
                  onClick={() => handleDraftOutreach(candidate)}
                  disabled={loadingOutreach[candidate.user_id]}
                  className="text-sm font-semibold text-signal-600 hover:text-signal-700 disabled:opacity-50"
                >
                  {loadingOutreach[candidate.user_id] ? 'Drafting...' : '✦ Draft Outreach DM'}
                </button>
                {outreachDrafts[candidate.user_id] && (
                  <div className="mt-3">
                    <div className="p-3 bg-signal-50 rounded-lg border border-signal-100 text-sm text-signal-900 mb-3">
                      {outreachDrafts[candidate.user_id]}
                    </div>
                    <button
                      onClick={() => handleSendDM(candidate)}
                      className="inline-flex items-center justify-center font-body font-semibold rounded-button bg-signal-600 text-white hover:bg-signal-600/90 active:bg-signal-600/80 text-xs px-4 py-1.5"
                    >
                      Review & Send DM
                    </button>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  )
}
