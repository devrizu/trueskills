// Frontend API wrapper for our Python FastAPI backend
// VITE_API_URL may be given either as the server origin ("https://api.example.com")
// or with the AI prefix ("https://api.example.com/api/ai"); normalise to the origin.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000')
  .replace(/\/+$/, '')
  .replace(/\/api\/ai$/, '')
const API_BASE_URL = `${API_ORIGIN}/api/ai`

export async function notifyUser(receiverId: string, title: string, body: string) {
  // Fire-and-forget push notification; never block the UI on this.
  return fetch(`${API_ORIGIN}/api/notifications/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId, title, body }),
  }).catch(err => console.error('Error triggering push:', err))
}

export async function savePushSubscription(userId: string, endpoint: string, p256dh?: string, auth?: string) {
  const res = await fetch(`${API_ORIGIN}/api/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, endpoint, p256dh, auth }),
  })
  if (!res.ok) throw new Error('Failed to subscribe on server')
  return res.json()
}

export async function parseResume(userId: string, file: File) {
  const formData = new FormData()
  formData.append('user_id', userId)
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/parse-resume`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to parse resume.')
  }

  return response.json()
}

export async function generateProfileEmbedding(userId: string) {
  const response = await fetch(`${API_BASE_URL}/generate-profile-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to generate profile embedding.')
  }

  return response.json()
}

export async function searchCandidates(query: string, matchThreshold: number = 0.5, matchCount: number = 10) {
  const response = await fetch(`${API_BASE_URL}/search-candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, match_threshold: matchThreshold, match_count: matchCount }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Search failed.')
  }
  return response.json()
}

export async function getCandidateSummary(candidateData: any) {
  const response = await fetch(`${API_BASE_URL}/candidate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_data: candidateData }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to generate summary.')
  }
  return response.json()
}

export async function draftOutreach(candidateData: any, jobDescription: string, recruiterName: string, companyName: string) {
  const response = await fetch(`${API_BASE_URL}/draft-outreach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      candidate_data: candidateData,
      job_description: jobDescription,
      recruiter_name: recruiterName,
      company_name: companyName
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to draft outreach.')
  }
  return response.json()
}

export async function screenBias(jobDescription: string) {
  const response = await fetch(`${API_BASE_URL}/screen-bias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_description: jobDescription }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to screen bias.')
  }
  return response.json()
}

export async function matchApplicants(jobDescription: string, applicants: any[]) {
  const response = await fetch(`${API_BASE_URL}/match-applicants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_description: jobDescription, applicants }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to match applicants.')
  }
  return response.json()
}

export async function getSkillConfidence(skillName: string, selfRatedLevel: string, userProfile: any, projects: any[], competitions: any[]) {
  const response = await fetch(`${API_BASE_URL}/skill-confidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skill_name: skillName,
      self_rated_level: selfRatedLevel,
      user_profile: userProfile,
      projects,
      competitions
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to get skill confidence.')
  }
  return response.json()
}

export async function getCollaborationSignals(userProfile: any, teamCompetitions: any[]) {
  const response = await fetch(`${API_BASE_URL}/collaboration-signals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_profile: userProfile, team_competitions: teamCompetitions }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to get collaboration signals.')
  }
  return response.json()
}

export async function verifyProjectGithub(projectId: string) {
  const response = await fetch(`${API_BASE_URL}/verify-project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to verify project.')
  }
  return response.json()
}
