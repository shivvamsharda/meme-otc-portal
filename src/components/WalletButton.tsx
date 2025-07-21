
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, Unplug } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export const WalletButton = () => {
  const wallet = useWallet()
  const { user, signOut } = useAuth()

  const handleSolanaSignIn = async () => {
    if (!wallet.connected || !wallet.signMessage || !wallet.publicKey) {
      console.error('Wallet not connected or does not support message signing')
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      // Use the wallet directly with signInWithWeb3 - Supabase handles the compatibility
      await supabase.auth.signInWithWeb3({
        chain: 'solana',
        statement: 'I accept the Terms of Service for MemeOTC',
        wallet: {
          ...wallet,
          publicKey: wallet.publicKey.toBytes(),
        } as any, // Use type assertion to bypass the strict typing
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

  // If wallet is connected but user is not authenticated, show both sign in and disconnect buttons
  if (wallet.connected) {
    return (
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSolanaSignIn}
          className="relative px-8 py-3 bg-gradient-to-r from-primary to-purple-500 rounded-xl font-semibold text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
