
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, Unplug } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { createSolanaWalletAdapter } from '@/utils/walletAdapter'
import '@/components/ui/wallet-button-styles.css'
export const WalletButton = () => {
  const wallet = useWallet()
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSolanaSignIn = async () => {
    const hasSignIn = typeof (wallet as any).signIn === 'function'
    const hasSignMessage = typeof wallet.signMessage === 'function'

    if (!wallet.connected || !wallet.publicKey || (!hasSignIn && !hasSignMessage)) {
      console.error('Wallet not connected or does not support required signing capabilities')
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const adaptedWallet = createSolanaWalletAdapter(wallet as any)
      await supabase.auth.signInWithWeb3({
        chain: 'solana',
        statement: 'I accept the Terms of Service for MemeOTC',
        wallet: adaptedWallet as any,
      })
    } catch (error) {
      console.error('Error signing in with Solana:', error)
      toast({
        title: "Sign-in Failed",
        description: "Failed to sign in with Solana wallet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleWalletDisconnect = async () => {
    try {
      await wallet.disconnect()
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      })
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  // If user is authenticated, show sign out button
  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="flex items-center gap-2"
        disabled={isSigningOut}
      >
        <LogOut className="w-4 h-4" />
        {isSigningOut ? "Signing Out..." : "Sign Out"}
      </Button>
    )
  }

  // If wallet is connected but user is not authenticated, show both sign in and disconnect buttons
  if (wallet.connected) {
    return (
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSolanaSignIn}
          className="relative px-8 py-3 bg-white rounded-2xl font-semibold text-sm text-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          Sign in with Solana
        </Button>
        <Button
          onClick={handleWalletDisconnect}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Unplug className="w-4 h-4" />
          Disconnect
        </Button>
      </div>
    )
  }

  // If wallet is not connected, show wallet connection button
  return <WalletMultiButton />
}
