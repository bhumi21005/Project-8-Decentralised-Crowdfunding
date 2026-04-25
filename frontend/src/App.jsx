import { useState, useEffect, useCallback } from 'react'
import { useWeb3 } from './context/Web3Context'
import { useContract } from './hooks/useContract'
import Landing from './components/Landing/Landing'
import Navbar from './components/Navbar/Navbar'
import StatsGrid from './components/StatsGrid/StatsGrid'
import CreateCampaign from './components/CreateCampaign/CreateCampaign'
import CampaignList from './components/CampaignList/CampaignList'
import Toast from './components/Toast/Toast'

export default function App() {
  const { isConnected } = useWeb3()
  const { loadAllCampaigns } = useContract()
  const [campaigns, setCampaigns] = useState([])
  const [campaignCount, setCampaignCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const { count, campaigns: data } = await loadAllCampaigns()
      setCampaignCount(count)
      setCampaigns(data)
    } catch (err) {
      console.error('Failed to load campaigns:', err)
    }
  }, [loadAllCampaigns])

  // Load campaigns when wallet connects
  useEffect(() => {
    if (isConnected) refresh()
  }, [isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show landing page if not connected
  if (!isConnected) {
    return (
      <>
        <Landing />
        <Toast />
      </>
    )
  }

  // Dashboard
  return (
    <div className="dashboard-app">
      <Navbar />
      <main>
        <section id="dashboard" className="section hero-section">
          <div className="hero-content">
            <h1>Decentralised <span className="gradient-text">Crowdfunding</span></h1>
            <p className="subtitle">
              Create campaigns, fund ideas, and manage your contributions — all on-chain, trustless, and transparent.
            </p>
          </div>
          <StatsGrid campaignCount={campaignCount} />
        </section>

        <CreateCampaign onCreated={refresh} />
        <CampaignList campaigns={campaigns} onRefresh={refresh} />
      </main>

      <footer>
        <p>CrowdFund DApp &copy; 2026 — Built on Ethereum | <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></p>
      </footer>
      <Toast />
    </div>
  )
}
