import { useEffect, useState, type FormEvent, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getSkillConfidence, getCollaborationSignals, parseResume, generateProfileEmbedding, verifyProjectGithub } from '../api'
import { PageTransition } from '../components/layout/PageTransition'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { SkillPill } from '../components/ui/SkillPill'
import { ProjectCard } from '../components/ui/ProjectCard'
import { PostItem } from '../components/ui/PostItem'
import { ReadingMark } from '../components/ui/ReadingMark'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { TextArea } from '../components/ui/TextArea'
import { MapPin, Link as LinkIcon, Pencil, Sparkles, Users, MessageSquare, Plus, Trash2, X, Upload } from 'lucide-react'
import type { Project } from '../types'

interface Post {
  id: string
  content: string
  media_url?: string
  created_at: string
  user_id: string
}

interface UserSkillWithSkill {
  id: string
  user_id: string
  skill_id: string
  self_rated_level: string
  skill: {
    id: string
    name: string
    category: string
  }
}

function Modal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-graphite-950/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-canvas rounded-card shadow-lg p-6 max-w-md w-full relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-graphite-500 hover:text-graphite-950 cursor-pointer bg-transparent border-none">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { id } = useParams()
  const { appUser, profile: myProfile } = useAuth()
  
  const targetUserId = id || appUser?.id
  const isOwnProfile = targetUserId === appUser?.id

  const [profile, setProfile] = useState<any>(null)
  const [role, setRole] = useState<string>('')
  const [skills, setSkills] = useState<UserSkillWithSkill[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // AI states
  const [skillScores, setSkillScores] = useState<Record<string, {score: number, rationale: string}>>({})
  const [loadingSkills, setLoadingSkills] = useState<Record<string, boolean>>({})
  const [collabSignals, setCollabSignals] = useState<{signals: string[], rationale: string} | null>(null)
  const [loadingCollab, setLoadingCollab] = useState(false)

  // Editing states
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null)
  
  const [isEditingSkill, setIsEditingSkill] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Partial<UserSkillWithSkill> | null>(null)
  
  const [availableSkills, setAvailableSkills] = useState<any[]>([])

  // AI Setup states
  const [isAiSetupOpen, setIsAiSetupOpen] = useState(false)
  const [parseLoading, setParseLoading] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parseSuccess, setParseSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        let currentRole = ''
        
        if (isOwnProfile && myProfile) {
          setProfile(myProfile)
          currentRole = appUser?.role || ''
          setRole(currentRole)
        } else {
          // Fallback robust check for cross-role views
          const { data: sProfile } = await supabase.from('student_profiles').select('*').eq('user_id', targetUserId).single()
          if (sProfile) {
            setProfile(sProfile)
            currentRole = 'student'
            setRole(currentRole)
          } else {
            const { data: rProfile } = await supabase.from('recruiter_profiles').select('*').eq('user_id', targetUserId).single()
            if (rProfile) {
               setProfile(rProfile)
               currentRole = 'recruiter'
               setRole(currentRole)
            }
          }
        }

        if (currentRole === 'student') {
          const { data: skillsData } = await supabase
            .from('user_skills')
            .select('*, skill:skills(id, name, category)')
            .eq('user_id', targetUserId)
            
          if (skillsData) {
            setSkills(skillsData as unknown as UserSkillWithSkill[])
          }

          const { data: projectsData } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            
          if (projectsData) {
            setProjects(projectsData as unknown as Project[])
          }
        }

        // Fetch available skills if own profile
        if (isOwnProfile) {
          const { data: sData } = await supabase.from('skills').select('*').order('name')
          if (sData) setAvailableSkills(sData)
        }

        // Fetch posts for this user
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          
        if (postsData) {
          setPosts(postsData as unknown as Post[])
        }

      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (targetUserId) {
      fetchData()
    }
  }, [targetUserId, isOwnProfile, myProfile, appUser])

  // --- Handlers ---
  async function handleSaveProject(e: FormEvent) {
    e.preventDefault()
    if (!editingProject?.title || !appUser) return
    setIsLoading(true)
    try {
      let savedProject;
      if (editingProject.id) {
        const { data } = await supabase.from('projects').update({
          title: editingProject.title,
          description: editingProject.description,
          github_url: editingProject.github_url,
          demo_url: editingProject.demo_url,
          is_github_verified: false
        }).eq('id', editingProject.id).select().single()
        savedProject = data;
      } else {
        const { data } = await supabase.from('projects').insert({
          user_id: appUser.id,
          title: editingProject.title,
          description: editingProject.description,
          github_url: editingProject.github_url,
          demo_url: editingProject.demo_url
        }).select().single()
        savedProject = data;
      }
      
      if (savedProject && savedProject.github_url) {
        try {
          await verifyProjectGithub(savedProject.id);
        } catch (err) {
          console.error("Failed to verify project:", err)
        }
      }
      // Reload projects
      const { data } = await supabase.from('projects').select('*').eq('user_id', appUser.id).order('created_at', { ascending: false })
      if (data) setProjects(data as unknown as Project[])
      setIsEditingProject(false)
      generateProfileEmbedding(appUser.id).catch(console.error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteProject(p: Project) {
    if (!confirm('Delete this project?')) return
    await supabase.from('projects').delete().eq('id', p.id)
    setProjects(projects.filter(proj => proj.id !== p.id))
    if (appUser) generateProfileEmbedding(appUser.id).catch(console.error)
  }

  async function handleSaveSkill(e: FormEvent) {
    e.preventDefault()
    if (!editingSkill?.skill_id || !appUser) return
    setIsLoading(true)
    try {
      if (editingSkill.id) {
        await supabase.from('user_skills').update({
          self_rated_level: editingSkill.self_rated_level
        }).eq('id', editingSkill.id)
      } else {
        // Prevent dupes locally
        if (skills.some(s => s.skill_id === editingSkill.skill_id)) {
           setIsEditingSkill(false)
           return
        }
        await supabase.from('user_skills').insert({
          user_id: appUser.id,
          skill_id: editingSkill.skill_id,
          self_rated_level: editingSkill.self_rated_level || 'intermediate'
        })
      }
      const { data } = await supabase.from('user_skills').select('*, skill:skills(id, name, category)').eq('user_id', appUser.id)
      if (data) setSkills(data as unknown as UserSkillWithSkill[])
      setIsEditingSkill(false)
      generateProfileEmbedding(appUser.id).catch(console.error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteSkill(s: UserSkillWithSkill) {
    if (!confirm('Delete this skill?')) return
    await supabase.from('user_skills').delete().eq('id', s.id)
    setSkills(skills.filter(sk => sk.id !== s.id))
    if (appUser) generateProfileEmbedding(appUser.id).catch(console.error)
  }

  async function handleParseResume(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file || !appUser) return

    setParseLoading(true)
    setParseError('')
    setParseSuccess('')

    try {
      await parseResume(appUser.id, file)
      
      await generateProfileEmbedding(appUser.id)
      setParseSuccess('Resume parsed! Skills added and AI profile initialized.')
      
      // Reload skills
      const { data: skillsData } = await supabase.from('user_skills').select('*, skill:skills(id, name, category)').eq('user_id', appUser.id)
      if (skillsData) setSkills(skillsData as unknown as UserSkillWithSkill[])
        
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse resume')
    } finally {
      setParseLoading(false)
    }
  }

  const handleVerifySkill = async (userSkill: UserSkillWithSkill) => {
    setLoadingSkills(prev => ({...prev, [userSkill.id]: true}))
    try {
      const { data: submissions } = await supabase.from('submissions').select('competitions(*)').eq('user_id', targetUserId)
      const competitions = submissions?.map((s: any) => s.competitions) || []
      const res = await getSkillConfidence(
        userSkill.skill.name,
        userSkill.self_rated_level,
        profile,
        projects,
        competitions || []
      )
      setSkillScores(prev => ({
        ...prev,
        [userSkill.id]: { score: res.confidence_score, rationale: res.rationale }
      }))
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingSkills(prev => ({...prev, [userSkill.id]: false}))
    }
  }

  const handleAnalyzeCollab = async () => {
    setLoadingCollab(true)
    try {
      const { data: submissions } = await supabase.from('submissions').select('competitions(*)').eq('user_id', targetUserId)
      const competitions = submissions?.map((s: any) => s.competitions) || []
      const res = await getCollaborationSignals(profile, competitions || [])
      setCollabSignals({ signals: res.signals, rationale: res.rationale })
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingCollab(false)
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-graphite-500 font-body">{isLoading ? 'Loading profile...' : 'Profile not found'}</div>
      </div>
    )
  }

  const isStudent = role === 'student'
  const isRecruiter = role === 'recruiter'
  const showAIFeatures = isStudent && (appUser?.role === 'recruiter' || appUser?.role === 'admin' || isOwnProfile)

  return (
    <PageTransition className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      
      <Card className="overflow-hidden !p-0 border-none bg-canvas shadow-sm">
        <div 
          className="h-48 bg-graphite-950 w-full relative" 
          style={profile?.bg_image_url ? { backgroundImage: `url(${profile.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!profile?.bg_image_url && <div className="absolute top-0 right-0 w-64 h-64 bg-signal-600 rounded-full blur-[80px] opacity-30 -mr-20 -mt-20" />}
        </div>
        
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-6">
            <Avatar 
              name={profile.full_name as string} 
              src={profile.avatar_url as string} 
              size="2xl" 
              className="border-4 border-surface shadow-sm"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl font-display font-bold text-graphite-950">{profile.full_name as string}</h1>
              
              <div className="flex items-center gap-3">
                {!isOwnProfile && appUser?.role === 'recruiter' && isStudent && (
                  <Link to={`/messages?user_id=${targetUserId}`} className="no-underline">
                    <Button size="sm">
                      <MessageSquare size={14} />
                      Message Candidate
                    </Button>
                  </Link>
                )}
                {isOwnProfile && (
                  <Link to="/profile/edit">
                    <Button variant="secondary" size="sm">
                      <Pencil size={14} />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            {isRecruiter && 'job_title' in profile && profile.job_title && (
              <p className="text-lg text-graphite-600 font-body">
                {profile.job_title} 
                {profile.company_name && <span className="font-semibold text-graphite-950"> at {profile.company_name}</span>}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-graphite-600 mt-2 font-body">
              {isStudent && 'location' in profile && profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  <span>{profile.location as string}</span>
                </div>
              )}
              {isStudent && 'email' in profile && profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:text-signal-600 transition-colors">
                  <MessageSquare size={16} />
                  <span>{profile.email as string}</span>
                </a>
              )}
              {isStudent && 'website' in profile && profile.website && (
                <a href={profile.website as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-signal-600 transition-colors">
                  <LinkIcon size={16} />
                  <span>{profile.website as string}</span>
                </a>
              )}
              {isRecruiter && 'company_website' in profile && profile.company_website && (
                <a href={profile.company_website as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-signal-600 hover:underline">
                  <LinkIcon size={16} />
                  <span>{profile.company_website as string}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>

      {('bio' in profile && profile.bio) && (
        <Card>
          <h2 className="text-lg font-display font-semibold text-graphite-950 mb-3">About</h2>
          <p className="text-sm text-graphite-600 font-body leading-relaxed whitespace-pre-wrap">
            {profile.bio as string}
          </p>
        </Card>
      )}

      {isStudent && (
        <>
          {showAIFeatures && (
            <Card className={collabSignals ? "bg-ai-100/30 border-ai-200" : ""}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="text-graphite-900" size={20} />
                  <h2 className="text-lg font-display font-semibold text-graphite-950">Team Dynamics</h2>
                </div>
                {!collabSignals && (
                  <button
                    onClick={handleAnalyzeCollab}
                    disabled={loadingCollab}
                    className="text-[11px] font-semibold flex items-center gap-1 uppercase tracking-wider text-ai-600 bg-ai-100 hover:bg-ai-100/80 py-1 px-2.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 border-none"
                  >
                    <Sparkles size={12} />
                    {loadingCollab ? 'Analyzing...' : 'AI Analyze'}
                  </button>
                )}
              </div>
              
              {collabSignals ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {collabSignals.signals.map((sig, idx) => (
                      <span key={idx} className="bg-ai-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                        {sig}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-graphite-800 italic">"{collabSignals.rationale}"</p>
                </div>
              ) : (
                <p className="text-sm text-graphite-600">
                  Analyze this candidate's history across team competitions to reveal collaboration signals.
                </p>
              )}
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-display font-semibold text-graphite-950">Skills</h2>
                {isOwnProfile && (
                   <button 
                     onClick={() => setIsAiSetupOpen(true)}
                     className="text-xs flex items-center gap-1 bg-ai-100 text-ai-600 px-2 py-1 rounded hover:bg-ai-100/80 transition-colors border-none cursor-pointer font-medium"
                   >
                     <Sparkles size={12} /> Skill Setup
                   </button>
                )}
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => { setEditingSkill({}); setIsEditingSkill(true); }}
                  className="p-1.5 rounded-full hover:bg-graphite-100 text-graphite-600 transition-colors cursor-pointer border-none"
                  title="Add Skill"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
            
            {skills.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <div key={s.id} className="flex flex-col gap-2 p-3 border border-graphite-200 rounded-card bg-canvas min-w-[200px] relative group">
                      {isOwnProfile && (
                         <div className="absolute -top-2 -right-2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-canvas rounded-full shadow-sm border border-graphite-200 overflow-hidden">
                           <button onClick={() => { setEditingSkill(s); setIsEditingSkill(true); }} className="p-1.5 hover:bg-graphite-100 text-graphite-500 hover:text-signal-600 border-none bg-transparent cursor-pointer">
                             <Pencil size={12} />
                           </button>
                           <button onClick={() => handleDeleteSkill(s)} className="p-1.5 hover:bg-error/10 text-graphite-500 hover:text-error border-none bg-transparent cursor-pointer">
                             <Trash2 size={12} />
                           </button>
                         </div>
                      )}
                      <div className="flex justify-between items-center gap-4">
                        <SkillPill name={s.skill?.name || 'Unknown'} />
                        <span className="text-xs text-graphite-500 capitalize">{s.self_rated_level}</span>
                      </div>
                      
                      {showAIFeatures && (
                        <div className="mt-2">
                          {skillScores[s.id] ? (
                            <div className="flex flex-col gap-2 pt-2 border-t border-graphite-200">
                              <ReadingMark label="Confidence" value={skillScores[s.id].score} variant="ai" />
                              <p className="text-[11px] text-graphite-600 italic">{skillScores[s.id].rationale}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleVerifySkill(s)}
                              disabled={loadingSkills[s.id]}
                              className="text-[10px] w-full font-semibold flex items-center justify-center gap-1 uppercase tracking-wider text-ai-600 bg-ai-100 hover:bg-ai-100/80 py-1 px-2 rounded transition-colors cursor-pointer disabled:opacity-50 border-none"
                            >
                              <Sparkles size={10} />
                              {loadingSkills[s.id] ? 'Verifying...' : 'AI Verify'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-graphite-600">No skills added yet.</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-graphite-950">Projects</h2>
              {isOwnProfile && (
                <button 
                  onClick={() => { setEditingProject({}); setIsEditingProject(true); }}
                  className="p-1.5 rounded-full hover:bg-graphite-100 text-graphite-600 transition-colors cursor-pointer border-none"
                  title="Add Project"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
            
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onEdit={isOwnProfile ? (p) => { setEditingProject(p); setIsEditingProject(true); } : undefined}
                    onDelete={isOwnProfile ? handleDeleteProject : undefined}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-graphite-600">No projects added yet.</p>
            )}
          </Card>
        </>
      )}

      {posts.length > 0 && (
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-display font-semibold text-graphite-950">Activity Feed</h2>
          </div>
          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <PostItem 
                key={post.id}
                post={post}
                authorName={profile.full_name as string}
                authorAvatar={profile.avatar_url as string}
                authorRole={role}
                onDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
                onUpdate={(id, content) => setPosts(posts.map(p => p.id === id ? { ...p, content } : p))}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Modals */}
      {isEditingProject && editingProject && (
        <Modal onClose={() => setIsEditingProject(false)}>
           <h2 className="text-xl font-display font-bold text-graphite-950 mb-4">{editingProject.id ? 'Edit Project' : 'Add Project'}</h2>
           <form onSubmit={handleSaveProject} className="flex flex-col gap-4">
             <Input label="Title" value={editingProject.title || ''} onChange={e => setEditingProject({...editingProject, title: e.target.value})} required />
             <TextArea label="Description" value={editingProject.description || ''} onChange={e => setEditingProject({...editingProject, description: e.target.value})} rows={3} />
             <Input label="GitHub URL" type="url" value={editingProject.github_url || ''} onChange={e => setEditingProject({...editingProject, github_url: e.target.value})} placeholder="https://" />
             <Input label="Demo URL" type="url" value={editingProject.demo_url || ''} onChange={e => setEditingProject({...editingProject, demo_url: e.target.value})} placeholder="https://" />
             <div className="flex justify-end gap-3 mt-4">
               <Button variant="secondary" type="button" onClick={() => setIsEditingProject(false)}>Cancel</Button>
               <Button type="submit">Save</Button>
             </div>
           </form>
        </Modal>
      )}

      {isEditingSkill && editingSkill && (
        <Modal onClose={() => setIsEditingSkill(false)}>
           <h2 className="text-xl font-display font-bold text-graphite-950 mb-4">{editingSkill.id ? 'Edit Skill' : 'Add Skill'}</h2>
           <form onSubmit={handleSaveSkill} className="flex flex-col gap-4">
             {!editingSkill.id ? (
               <div className="flex flex-col gap-1.5">
                 <label className="text-sm font-semibold text-graphite-900 font-body">Skill</label>
                 <select 
                   value={editingSkill.skill_id || ''} 
                   onChange={e => setEditingSkill({...editingSkill, skill_id: e.target.value})}
                   className="w-full px-3 py-2 bg-canvas border border-graphite-200 rounded-button text-sm font-body text-graphite-950 focus:outline-none focus:border-signal-400 focus:ring-1 focus:ring-signal-400 appearance-none"
                   required
                 >
                   <option value="">Select a skill...</option>
                   {availableSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
               </div>
             ) : (
               <div className="text-sm font-semibold text-graphite-900 mb-2">Editing: {editingSkill.skill?.name}</div>
             )}
             
             <div className="flex flex-col gap-1.5">
               <label className="text-sm font-semibold text-graphite-900 font-body">Proficiency Level</label>
               <select 
                 value={editingSkill.self_rated_level || 'intermediate'}
                 onChange={e => setEditingSkill({...editingSkill, self_rated_level: e.target.value})}
                 className="w-full px-3 py-2 bg-canvas border border-graphite-200 rounded-button text-sm font-body text-graphite-950 focus:outline-none focus:border-signal-400 focus:ring-1 focus:ring-signal-400"
               >
                 <option value="beginner">Beginner</option>
                 <option value="intermediate">Intermediate</option>
                 <option value="advanced">Advanced</option>
                 <option value="expert">Expert</option>
               </select>
             </div>
             
             <div className="flex justify-end gap-3 mt-4">
               <Button variant="secondary" type="button" onClick={() => setIsEditingSkill(false)}>Cancel</Button>
               <Button type="submit">Save</Button>
             </div>
           </form>
        </Modal>
      )}

      {isAiSetupOpen && (
        <Modal onClose={() => setIsAiSetupOpen(false)}>
           <div className="flex items-center gap-2 mb-4">
             <Sparkles className="text-ai-600" size={20} />
             <h2 className="text-xl font-display font-bold text-graphite-950">Skill Setup</h2>
           </div>
           
           {parseError && <div className="bg-error/10 text-error px-4 py-3 rounded-button text-sm mb-4">{parseError}</div>}
           {parseSuccess && <div className="bg-success/10 text-success px-4 py-3 rounded-button text-sm mb-4">{parseSuccess}</div>}

           <form onSubmit={handleParseResume} className="flex flex-col gap-4">
             <p className="text-sm text-graphite-600 font-body">
               Upload your resume. Our AI will automatically parse your skills, set up your profile embedding, and match you with jobs.
             </p>
             <div className="border-2 border-dashed border-graphite-200 rounded-card p-6 flex flex-col items-center justify-center bg-graphite-100/50">
               <Upload className="text-graphite-400 mb-2" size={24} />
               <input 
                 type="file" 
                 ref={fileInputRef}
                 accept=".pdf,.doc,.docx" 
                 className="text-sm text-graphite-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-signal-50 file:text-signal-600 hover:file:bg-signal-100 cursor-pointer"
               />
             </div>
             <div className="flex justify-end gap-3 mt-2">
               <Button variant="secondary" type="button" onClick={() => setIsAiSetupOpen(false)}>Close</Button>
               <Button type="submit" disabled={parseLoading} className="bg-ai-600 hover:bg-ai-700 border-none">
                 {parseLoading ? 'Analyzing...' : 'Parse Resume'}
               </Button>
             </div>
           </form>
        </Modal>
      )}
    </PageTransition>
  )
}
