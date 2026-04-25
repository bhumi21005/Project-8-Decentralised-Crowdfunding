import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'
import { truncateAddress, NETWORK_NAMES } from '../utils/helpers'

const Web3Context = createContext(null)

export function useWeb3() {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used inside Web3Provider')
  return ctx
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState('—')
  const [isConnecting, setIsConnecting] = useState(false)

  const isConnected = !!account

  // Refresh balance
  const refreshBalance = useCallback(async (addr, prov) => {
    if (!addr || !prov) return
    try {
      const bal = await prov.getBalance(addr)
      setBalance((Number(bal) / 1e18).toFixed(4))
    } catch (e) {
      console.error('Balance error:', e)
    }
  }, [])

  // Refresh network
  const refreshNetwork = useCallback(async () => {
    if (!window.ethereum) return
    try {
      const chainHex = await window.ethereum.request({ method: 'eth_chainId' })
      const chainId = parseInt(chainHex, 16)
      setNetwork(NETWORK_NAMES[chainId] || `Chain ${chainId}`)
    } catch {
      setNetwork('Unknown')
    }
  }, [])

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not detected. Please install MetaMask.')
      return
    }
    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const addr = accounts[0]
      const prov = new BrowserProvider(window.ethereum)
      const sign = await prov.getSigner()
      const ctr = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, sign)

      setAccount(addr)
      setProvider(prov)
      setSigner(sign)
      setContract(ctr)

      await refreshBalance(addr, prov)
      await refreshNetwork()
    } catch (err) {
      console.error('Connection failed:', err)
      alert('Failed to connect: ' + err.message)
    } finally {
      setIsConnecting(false)
    }
  }, [refreshBalance, refreshNetwork])

  // Listen for account & chain changes
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccounts = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null)
        setProvider(null)
        setSigner(null)
        setContract(null)
        setBalance('0')
      } else {
        // Reconnect with new account
        connectWallet()
      }
    }

    const handleChain = () => window.location.reload()

    window.ethereum.on('accountsChanged', handleAccounts)
    window.ethereum.on('chainChanged', handleChain)

    // Auto-reconnect if already authorized
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) connectWallet()
    })

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts)
      window.ethereum.removeListener('chainChanged', handleChain)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    account,
    provider,
    signer,
    contract,
    balance,
    network,
    isConnected,
    isConnecting,
    connectWallet,
    refreshBalance: () => refreshBalance(account, provider),
    truncatedAddress: truncateAddress(account),
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}
