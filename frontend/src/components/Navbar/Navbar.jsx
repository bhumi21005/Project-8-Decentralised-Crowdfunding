import { useWeb3 } from '../../context/Web3Context'
import './Navbar.css'

export default function Navbar() {
  const { truncatedAddress } = useWeb3()

  return (
    <header className="navbar" id="navbar">
      <div className="nav-container">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">CrowdFund</span>
        </div>
        <nav>
          <a href="#dashboard" className="nav-link active" id="navDashboard">Dashboard</a>
          <a href="#create" className="nav-link" id="navCreate">Create</a>
          <a href="#campaigns" className="nav-link" id="navCampaigns">Campaigns</a>
        </nav>
        <div className="btn btn-connect connected" id="connectWallet">
          <span className="btn-icon">🦊</span>
          <span className="btn-text">{truncatedAddress}</span>
        </div>
      </div>
    </header>
  )
}
