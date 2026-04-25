import { useWeb3 } from '../../context/Web3Context'
import './StatsGrid.css'

export default function StatsGrid({ campaignCount }) {
  const { balance, network, truncatedAddress } = useWeb3()

  return (
    <div className="stats-grid" id="statsGrid">
      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-value" id="statCampaigns">{campaignCount}</div>
        <div className="stat-label">Total Campaigns</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-value" id="statBalance">{balance} ETH</div>
        <div className="stat-label">Your Balance</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🌐</div>
        <div className="stat-value" id="statNetwork">{network}</div>
        <div className="stat-label">Network</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🔑</div>
        <div className="stat-value" id="statAddress">{truncatedAddress}</div>
        <div className="stat-label">Connected Address</div>
      </div>
    </div>
  )
}
