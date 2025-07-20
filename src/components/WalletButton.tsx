
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export const WalletButton = () => {
  const wallet = useWallet()
  const { user, signOut } = useAuth()

  const handleSolanaSignIn = async () => {
    if (!wallet.connected || !wallet.signMessage) {
      console.error('Wallet not connected or does not support message signing')
      return
    }

    try {
      await supabase.auth.signInWithWeb3({
        chain: 'solana',
        statement: 'I accept the Terms of Service for MemeOTC',
        wallet,
      })
    } catch (error) {
      console.error('Error signing in with Solana:', error)
    }
  }

  // If user is authenticated, show sign out button
  if (user) {
    return (
      <Button
        onClick={signOut}
        variant="outline"
        className="flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    )
  }

  // If wallet is connected but user is not authenticated, show sign in button
  if (wallet.connected) {
    return (
      <Button
        onClick={handleSolanaSignIn}
        className="relative px-8 py-3 bg-gradient-to-r from-primary to-purple-500 rounded-xl font-semibold text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        Sign in with Solana
      </Button>
    )
  }

  // If wallet is not connected, show wallet connection button
  return <WalletMultiButton />
}
