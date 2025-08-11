
import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { CheckCircle } from 'lucide-react'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Show success toast when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          toast({
            title: "Successfully signed in!",
            description: `Welcome to MemeOTC`,
            className: "border-green-200 bg-green-50 text-green-900",
          })
        }
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        toast({
          title: "Sign out failed",
          description: "There was an issue signing you out. Clearing session locally.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of MemeOTC.",
        })
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error)
      toast({
        title: "Sign out failed",
        description: "There was an unexpected error. Clearing session locally.",
        variant: "destructive",
      })
    } finally {
      // Force local state cleanup regardless of API response
      setSession(null)
      setUser(null)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
