import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PageTransition } from '../components/layout/PageTransition'
import { motion } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ReadingMark } from '../components/ui/ReadingMark'
import { TextArea } from '../components/ui/TextArea'
import { Sparkles, Briefcase, Search, Plus, X, Image as ImageIcon, MessageSquare, ShieldCheck, Users } from 'lucide-react'
import { PostItem } from '../components/ui/PostItem'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'

interface Post {
  id: string
  content: string
  media_url?: string
  created_at: string
  user_id: string
  users: {
    role: string
    student_profiles?: { full_name: string; avatar_url: string } | { full_name: string; avatar_url: string }[]
    recruiter_profiles?: { full_name: string; avatar_url: string } | { full_name: string; avatar_url: string }[]
  }
}

export function DashboardPage() {
  const { appUser, profile } = useAuth()
  
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [newMediaUrls, setNewMediaUrls] = useState<string[]>([''])
  const [showMediaInput, setShowMediaInput] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false)
  const [isAIToolsModalOpen, setIsAIToolsModalOpen] = useState(false)
  const [profileStrength, setProfileStrength] = useState(0)

  const isStudent = appUser?.role === 'student'
  const isRecruiter = appUser?.role === 'recruiter' || appUser?.role === 'admin'

  const displayName = profile && 'full_name' in profile ? profile.full_name : 'User'

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data } = await supabase
          .from('posts')
          .select(`
            *,
            users ( 
              role,
              student_profiles ( full_name ),
              recruiter_profiles ( full_name )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20)
          
        if (data) setPosts(data as unknown as Post[])
      } catch (error) {
        console.error('Error fetching posts:', error)
      }
    }

    async function calculateProfileStrength() {
      if (!isStudent || !appUser) return
      
      let score = 10 // base

      if (profile) {
        if ('avatar_url' in profile && profile.avatar_url) score += 10
        if ('full_name' in profile && profile.full_name) score += 10
        if ('bio' in profile && profile.bio) score += 15
        if ('location' in profile && profile.location) score += 10
        if ('email' in profile && (profile as any).email) score += 5
        if ('website' in profile && (profile as any).website) score += 5
      }

      const { data: skills } = await supabase.from('user_skills').select('id').eq('user_id', appUser.id)
      if (skills && skills.length > 0) score += Math.min(20, skills.length * 5)

      const { data: projects } = await supabase.from('projects').select('id').eq('user_id', appUser.id)
      if (projects && projects.length > 0) score += Math.min(25, projects.length * 10)

      setProfileStrength(Math.min(100, score))
    }

    fetchPosts()
    calculateProfileStrength()
  }, [appUser, profile, isStudent])

  async function handlePost(e: FormEvent) {
    e.preventDefault()
    if (!appUser || !newPost.trim()) return

    setIsPosting(true)
    try {
      const validUrls = newMediaUrls.filter(url => url.trim() !== '')
      const mediaPayload = validUrls.length > 0 ? JSON.stringify(validUrls) : null
      
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: appUser.id,
          content: newPost,
          media_url: mediaPayload
        })
      
      if (!error) {
        setNewPost('')
        setNewMediaUrls([''])
        setIsCreateModalOpen(false)
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsPosting(false)
    }
  }

  // Post deletion/updates are handled by the PostItem internally, 
  // we just need to update the local state when they succeed.
  function handleLocalDelete(postId: string) {
    setPosts(posts.filter(p => p.id !== postId))
  }
  
  function handleLocalUpdate(postId: string, content: string) {
    setPosts(posts.map(p => p.id === postId ? { ...p, content } : p))
  }

  // --- Student View ---
  let dashboardContent = null

  if (isStudent) {
    dashboardContent = (
      <div className="max-w-5xl mx-auto flex flex-col gap-10 py-6 relative">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-signal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute top-10 right-20 w-72 h-72 bg-ai-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
        
        <header className="flex justify-between items-end mb-2 relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-graphite-950 mb-3 tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-graphite-600 font-body text-lg">
              Here's what's happening with your portfolio today.
            </p>
          </div>
          <Link to="/profile/edit">
            <Button variant="secondary" size="sm">
              Edit Profile
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <Card className="md:col-span-1 flex flex-col items-center justify-center text-center py-10 bg-gradient-to-b from-surface to-graphite-50/50">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-graphite-500 mb-6">
              Profile Strength
            </h3>
            <ReadingMark value={profileStrength} max={100} size="md" variant="signal" />
            <p className="text-sm text-graphite-500 mt-6 leading-relaxed">
              Add more projects and skills to boost your score.
            </p>
          </Card>
          
          <Card className="md:col-span-2 flex flex-col h-[500px]">
            <h3 className="text-lg font-display font-semibold mb-4 text-graphite-950 shrink-0">
              Network Feed
            </h3>

            <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 no-scrollbar">
              {posts.map(post => {
                const sp = post.users?.student_profiles
                const rp = post.users?.recruiter_profiles
                const spName = Array.isArray(sp) ? sp[0]?.full_name : sp?.full_name
                const rpName = Array.isArray(rp) ? rp[0]?.full_name : rp?.full_name
                const authorName = spName || rpName || `User ${post.user_id.substring(0,4)}`
                const spAvatar = Array.isArray(sp) ? sp[0]?.avatar_url : sp?.avatar_url
                const rpAvatar = Array.isArray(rp) ? rp[0]?.avatar_url : rp?.avatar_url
                const authorAvatar = spAvatar || rpAvatar || ''
                return (
                  <PostItem 
                    key={post.id}
                    post={post}
                    authorName={authorName}
                    authorRole={post.users?.role}
                    authorAvatar={authorAvatar}
                    onDelete={handleLocalDelete}
                    onUpdate={handleLocalUpdate}
                  />
                )
              })}
              {posts.length === 0 && <p className="text-sm text-graphite-500 text-center py-4 shrink-0">No posts yet. Start the conversation!</p>}
            </div>
          </Card>
        </div>

      </div>
    )
  } else if (isRecruiter) {
    dashboardContent = (
      <div className="max-w-5xl mx-auto flex flex-col gap-10 py-6 relative">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-signal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute top-10 right-20 w-72 h-72 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-graphite-950 mb-3 tracking-tight">
              Recruiter Dashboard
            </h1>
            <p className="text-graphite-600 font-body text-lg">
              Manage your hiring pipeline and discover verified talent.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/profile/edit">
              <Button variant="secondary">
                Edit Profile
              </Button>
            </Link>
            
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          <Link to="/search" className="no-underline md:col-span-2">
            <Card hover={true} className="flex flex-col gap-4 group h-full p-8 bg-gradient-to-br from-signal-50/50 to-surface">
              <div className="w-12 h-12 rounded-2xl bg-signal-100 flex items-center justify-center text-signal-600 mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                <Search size={22} />
              </div>
              <h3 className="text-xl font-display font-bold text-graphite-950">Candidate Search</h3>
              <p className="text-base text-graphite-600 leading-relaxed">Find talent by verified skills, Github contributions, and competition ranks.</p>
            </Card>
          </Link>

          <Link to="/jobs" className="no-underline md:col-span-2">
            <Card hover={true} className="flex flex-col gap-4 group h-full p-8 bg-gradient-to-br from-indigo-50/50 to-surface">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Briefcase size={22} />
              </div>
              <h3 className="text-xl font-display font-bold text-graphite-950">Active Postings</h3>
              <p className="text-base text-graphite-600 leading-relaxed">Manage your job board listings and applications.</p>
            </Card>
          </Link>

          <Card hover={true} onClick={() => setIsAIToolsModalOpen(true)} className="md:col-span-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-8 relative overflow-hidden group">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-ai-50/80 to-transparent pointer-events-none"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-ai-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transition-transform duration-700 group-hover:scale-150 pointer-events-none"></div>
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-ai-100 flex items-center justify-center text-ai-600 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-graphite-950 mb-1">AI Tools</h3>
                <p className="text-base text-graphite-600">Draft outreach, screen for bias, and summarize profiles instantly.</p>
              </div>
            </div>
            <div className="relative z-10 sm:self-center">
              <Button variant="secondary" className="group-hover:bg-graphite-950 group-hover:text-white transition-colors">
                Explore Tools
              </Button>
            </div>
          </Card>
        </div>

        <Card className="flex flex-col h-[600px]">
          <h3 className="text-lg font-display font-semibold mb-4 text-graphite-950 shrink-0">
            Recruiter Feed
          </h3>

          <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 no-scrollbar">
            {posts.map(post => {
              const sp = post.users?.student_profiles
              const rp = post.users?.recruiter_profiles
              const spName = Array.isArray(sp) ? sp[0]?.full_name : sp?.full_name
              const rpName = Array.isArray(rp) ? rp[0]?.full_name : rp?.full_name
              const authorName = spName || rpName || `User ${post.user_id.substring(0,4)}`
              const spAvatar = Array.isArray(sp) ? sp[0]?.avatar_url : sp?.avatar_url
              const rpAvatar = Array.isArray(rp) ? rp[0]?.avatar_url : rp?.avatar_url
              const authorAvatar = spAvatar || rpAvatar || ''
              return (
                <PostItem 
                  key={post.id}
                  post={post}
                  authorName={authorName}
                  authorRole={post.users?.role}
                  authorAvatar={authorAvatar}
                  onDelete={handleLocalDelete}
                  onUpdate={handleLocalUpdate}
                />
              )
            })}
            {posts.length === 0 && <p className="text-sm text-graphite-500 text-center py-4 shrink-0">No posts yet. Start the conversation!</p>}
          </div>
        </Card>
      </div>
    )
  }

  if (!dashboardContent) return null

  return (
    <PageTransition>
      {dashboardContent}
      
      {/* Create FAB & Menu */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        {isFabMenuOpen && isRecruiter && (
          <div className="flex flex-col items-end gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Link 
              to="/jobs/new" 
              className="flex items-center gap-3 bg-surface border border-graphite-200 pl-4 pr-1 py-1 rounded-full shadow-lg text-graphite-900 hover:bg-graphite-50 transition-colors no-underline group/item"
              onClick={() => setIsFabMenuOpen(false)}
            >
              <span className="font-medium text-sm">Post a Job</span>
              <div className="w-10 h-10 rounded-full bg-signal-50 flex items-center justify-center text-signal-600 group-hover/item:bg-signal-100 transition-colors">
                <Briefcase size={18} />
              </div>
            </Link>
            <button 
              onClick={() => {
                setIsFabMenuOpen(false)
                setIsCreateModalOpen(true)
              }}
              className="flex items-center gap-3 bg-surface border border-graphite-200 pl-4 pr-1 py-1 rounded-full shadow-lg text-graphite-900 hover:bg-graphite-50 transition-colors cursor-pointer border-none group/item"
            >
              <span className="font-medium text-sm">Create Post</span>
              <div className="w-10 h-10 rounded-full bg-signal-50 flex items-center justify-center text-signal-600 group-hover/item:bg-signal-100 transition-colors">
                <MessageSquare size={18} />
              </div>
            </button>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (isRecruiter) setIsFabMenuOpen(!isFabMenuOpen)
            else setIsCreateModalOpen(true)
          }}
          className="w-14 h-14 bg-signal-600 rounded-full shadow-xl flex items-center justify-center text-white hover:bg-signal-700 transition-colors border-none cursor-pointer group"
          title="Create"
        >
          <Plus size={24} className={`transition-transform duration-300 ${isFabMenuOpen && isRecruiter ? 'rotate-45' : ''}`} />
        </motion.button>
      </div>

      {/* Create Post Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-card w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-graphite-200 flex justify-between items-center bg-graphite-50">
                <h3 className="font-display font-semibold text-graphite-950">Create a Post</h3>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-full hover:bg-graphite-200 text-graphite-500 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                <form id="create-post-form" onSubmit={handlePost} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 pt-1">
                      <Avatar 
                        name={displayName} 
                        src={profile && 'avatar_url' in profile ? (profile.avatar_url as string) : undefined} 
                        size="md" 
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <h4 className="font-semibold font-display text-graphite-950 mb-1">{displayName || 'User'}</h4>
                      <textarea 
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        placeholder="What do you want to share with your network?" 
                        rows={4}
                        className="w-full text-lg font-body text-graphite-950 bg-transparent border-none placeholder:text-graphite-400 focus:outline-none focus:ring-0 resize-none px-0 py-1"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  {!showMediaInput ? (
                    <div className="flex items-center px-1 border-t border-graphite-200 pt-3">
                      <button 
                        type="button"
                        onClick={() => setShowMediaInput(true)}
                        className="flex items-center gap-2 text-graphite-500 hover:text-signal-600 hover:bg-signal-50 px-3 py-2 rounded-button transition-colors cursor-pointer border-none bg-transparent font-medium text-sm"
                        title="Add Media"
                      >
                        <ImageIcon size={18} />
                        Add Media
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 pt-3 border-t border-graphite-100">
                      <div className="flex justify-between items-center mb-3 px-1">
                        <label className="text-sm font-medium text-graphite-600 flex items-center gap-1.5">
                          <ImageIcon size={14} />
                          Add Media URL
                        </label>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowMediaInput(false)
                            setNewMediaUrls([''])
                          }}
                          className="text-graphite-400 hover:text-graphite-600 bg-transparent border-none cursor-pointer p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {newMediaUrls.map((url, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input 
                                type="url"
                                value={url}
                                onChange={e => {
                                  const updated = [...newMediaUrls]
                                  updated[idx] = e.target.value
                                  setNewMediaUrls(updated)
                                }}
                                placeholder="https://example.com/image.jpg or .mp4" 
                                className="flex-1 px-3 py-2.5 text-sm font-body text-graphite-950 bg-graphite-50/50 border border-graphite-100 rounded-button placeholder:text-graphite-400 transition-colors duration-150 hover:border-graphite-200 focus:border-graphite-300 focus:bg-surface focus:outline-none focus:ring-0 shadow-sm"
                              />
                              {newMediaUrls.length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="secondary" 
                                  className="px-3"
                                  onClick={() => {
                                    setNewMediaUrls(newMediaUrls.filter((_, i) => i !== idx))
                                  }}
                                >
                                  <X size={16} />
                                </Button>
                              )}
                            </div>
                            {url && (
                              <div className="rounded-card overflow-hidden border border-graphite-100 bg-graphite-50 flex items-center justify-center mt-1">
                                {url.match(/\.(mp4|webm|ogg)$/i) ? (
                                  <video src={url} controls className="w-full max-h-48 object-contain" />
                                ) : (
                                  <img src={url} alt="Preview" className="w-full max-h-48 object-contain" />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="mt-3 w-full"
                        onClick={() => setNewMediaUrls([...newMediaUrls, ''])}
                      >
                        <Plus size={14} className="mr-1" /> Add Another URL
                      </Button>
                    </div>
                  )}
                </form>
              </div>
              
              <div className="p-4 border-t border-graphite-200 flex justify-end gap-3 bg-graphite-50">
                <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="create-post-form" disabled={isPosting || !newPost.trim()}>
                  {isPosting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* AI Tools Modal */}
      {isAIToolsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-graphite-200 flex justify-between items-center bg-graphite-50">
              <h3 className="font-display font-semibold text-graphite-950 flex items-center gap-2">
                <Sparkles size={20} className="text-ai-600" />
                Available AI Tools
              </h3>
              <button 
                onClick={() => setIsAIToolsModalOpen(false)}
                className="p-1 rounded-full hover:bg-graphite-200 text-graphite-500 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-signal-100 flex items-center justify-center text-signal-600 shrink-0">
                  <Search size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-graphite-950 mb-1">AI Candidate Search</h4>
                  <p className="text-sm text-graphite-600 leading-relaxed">
                    Search for candidates using natural language. Our AI understands context and semantics to find candidates based on skills, projects, and competition ranks beyond simple keyword matching.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-ai-100 flex items-center justify-center text-ai-600 shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-graphite-950 mb-1">AI Profile Summarization</h4>
                  <p className="text-sm text-graphite-600 leading-relaxed">
                    View AI-generated confidence scores on student skills based on their actual projects, GitHub repos, and competition performances to gauge true proficiency.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-graphite-950 mb-1">GitHub Project Verification</h4>
                  <p className="text-sm text-graphite-600 leading-relaxed">
                    Instantly verify if a candidate's claimed skills and project descriptions actually match the public GitHub repositories they've linked.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-graphite-950 mb-1">Collaboration Signals</h4>
                  <p className="text-sm text-graphite-600 leading-relaxed">
                    Our AI analyzes a candidate's competition history and team sizes to surface hidden insights about their teamwork, leadership, and collaboration capabilities.
                  </p>
                </div>
              </div>

              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-graphite-500 italic">
                  ...and many more powerful AI features to streamline your hiring!
                </p>
              </div>

            </div>
            
            <div className="p-4 border-t border-graphite-200 bg-graphite-50 flex justify-end">
              <Button variant="secondary" onClick={() => setIsAIToolsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
