import { useState, useEffect, useRef, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { Send, MessageSquare, Sparkles } from 'lucide-react'

// Basic types for the messaging UI
interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  ai_drafted: boolean
  sent_at: string
  read_at?: string | null
}

interface Conversation {
  other_user_id: string
  other_user_name: string
  last_message: string
  last_message_at: string
  unread_count: number
}

export function MessagesPage() {
  const { appUser, profile } = useAuth()
  
  const [searchParams] = useSearchParams()
  const urlUserId = searchParams.get('user_id')
  
  // Conversations list state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(urlUserId)
  
  // Active chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const draftMessage = searchParams.get('draft')
  
  useEffect(() => {
    if (draftMessage) {
      setNewMessage(draftMessage)
    }
  }, [draftMessage])

  useEffect(() => {
    if (!appUser) return

    // Simplified conversation fetch for MVP: 
    // We fetch all messages involving the current user and group them by the other user.
    async function fetchConversations() {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${appUser?.id},receiver_id.eq.${appUser?.id}`)
          .order('sent_at', { ascending: false })

        if (data) {
          // Group by other user
          const convosMap = new Map<string, Conversation>()
          
          for (const msg of data) {
            const isSender = msg.sender_id === appUser?.id
            const otherUserId = isSender ? msg.receiver_id : msg.sender_id
            
            if (!convosMap.has(otherUserId)) {
              convosMap.set(otherUserId, {
                other_user_id: otherUserId,
                other_user_name: 'User ' + otherUserId.substring(0, 4), // Fallback name
                last_message: msg.content,
                last_message_at: msg.sent_at,
                unread_count: 0
              })
            }

            if (msg.receiver_id === appUser?.id && msg.read_at === null) {
              convosMap.get(otherUserId)!.unread_count += 1
            }
          }
          
          if (urlUserId && !convosMap.has(urlUserId)) {
            convosMap.set(urlUserId, {
              other_user_id: urlUserId,
              other_user_name: 'New Message', 
              last_message: 'Start a conversation...',
              last_message_at: new Date().toISOString(),
              unread_count: 0
            })
          }

          const otherUserIds = Array.from(convosMap.keys())
          if (otherUserIds.length > 0) {
            const { data: sProfiles } = await supabase.from('student_profiles').select('user_id, full_name').in('user_id', otherUserIds)
            const { data: rProfiles } = await supabase.from('recruiter_profiles').select('user_id, full_name').in('user_id', otherUserIds)
            
            sProfiles?.forEach(p => {
              if (convosMap.has(p.user_id) && p.full_name) {
                convosMap.get(p.user_id)!.other_user_name = p.full_name
              }
            })
            rProfiles?.forEach(p => {
              if (convosMap.has(p.user_id) && p.full_name) {
                convosMap.get(p.user_id)!.other_user_name = p.full_name
              }
            })
          }
          
          // Sort by last message time
          const sortedConvos = Array.from(convosMap.values()).sort(
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          )
          
          setConversations(sortedConvos)
          if (urlUserId && !activeUserId) {
            setActiveUserId(urlUserId)
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser])

  useEffect(() => {
    if (!appUser || !activeUserId) return

    async function fetchMessages() {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${appUser?.id},receiver_id.eq.${activeUserId}),and(sender_id.eq.${activeUserId},receiver_id.eq.${appUser?.id})`)
          .order('sent_at', { ascending: true })

        if (data) {
          setMessages(data as Message[])

          // Mark unread messages as read
          const unreadIds = data.filter(m => m.receiver_id === appUser?.id && m.read_at === null).map(m => m.id)
          if (unreadIds.length > 0) {
            await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
            setConversations(prev => {
              const next = [...prev]
              const idx = next.findIndex(c => c.other_user_id === activeUserId)
              if (idx !== -1) {
                next[idx] = { ...next[idx], unread_count: 0 }
              }
              return next
            })
            window.dispatchEvent(new Event('messages_read'))
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()
  }, [appUser, activeUserId])

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!appUser || !activeUserId || !newMessage.trim()) return

    setIsSending(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: appUser.id,
          receiver_id: activeUserId,
          content: newMessage,
          ai_drafted: false
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setMessages([...messages, data as Message])
        setNewMessage('')
        
        // Update conversation list last message
        setConversations(prev => {
          const newConvos = [...prev]
          const idx = newConvos.findIndex(c => c.other_user_id === activeUserId)
          if (idx !== -1) {
            newConvos[idx].last_message = data.content
            newConvos[idx].last_message_at = data.sent_at
            // move to top
            const updated = newConvos.splice(idx, 1)[0]
            newConvos.unshift(updated)
          }
          return newConvos
        })

        // Trigger push notification
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
          fetch(`${API_URL}/api/notifications/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiver_id: activeUserId,
              title: `New message from ${profile?.full_name || 'someone'}`,
              body: data.content
            })
          }).catch(err => console.error('Error triggering push:', err))
        } catch {
          // Ignore
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-graphite-200 border-t-signal-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* Left Pane: Conversations List */}
      <Card className="w-full md:w-80 flex flex-col shrink-0 h-full overflow-hidden p-0">
        <div className="p-4 border-b border-graphite-200">
          <h2 className="text-lg font-display font-bold text-graphite-950">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map(convo => (
              <button
                key={convo.other_user_id}
                onClick={() => setActiveUserId(convo.other_user_id)}
                className={`w-full text-left p-4 border-b border-graphite-100 transition-colors flex gap-3 cursor-pointer ${
                  activeUserId === convo.other_user_id ? 'bg-signal-50' : 'hover:bg-canvas'
                }`}
              >
                <Avatar name={convo.other_user_name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className={`text-sm truncate ${convo.unread_count > 0 ? 'font-bold text-graphite-950' : 'font-semibold text-graphite-950'}`}>
                      {convo.other_user_name}
                    </h4>
                    <span className="text-[10px] text-graphite-500 whitespace-nowrap ml-2">
                      {new Date(convo.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <p className={`text-xs truncate flex-1 ${convo.unread_count > 0 ? 'font-semibold text-graphite-900' : 'text-graphite-600'}`}>
                      {convo.last_message}
                    </p>
                    {convo.unread_count > 0 && (
                      <div className="w-2 h-2 rounded-full bg-signal-600 shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-graphite-500 text-sm">
              No conversations yet.
            </div>
          )}
        </div>
      </Card>

      {/* Right Pane: Active Chat */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden p-0 relative">
        {activeUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-graphite-200 flex items-center gap-3 bg-white z-10">
              <Link to={`/profile/${activeUserId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar name={conversations.find(c => c.other_user_id === activeUserId)?.other_user_name || 'User'} size="sm" />
                <h3 className="font-semibold text-graphite-950 hover:underline">
                  {conversations.find(c => c.other_user_id === activeUserId)?.other_user_name || 'User'}
                </h3>
              </Link>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-canvas/30">
              {messages.map(msg => {
                const isMe = msg.sender_id === appUser?.id
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-signal-600 text-white rounded-br-sm' 
                        : 'bg-white border border-graphite-200 text-graphite-900 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.ai_drafted && isMe && (
                      <span className="text-[10px] text-graphite-400 mt-1 flex items-center gap-1">
                        <Sparkles size={10} /> AI Drafted
                      </span>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-graphite-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                </div>
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-graphite-500">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </Card>
      
    </div>
  )
}
