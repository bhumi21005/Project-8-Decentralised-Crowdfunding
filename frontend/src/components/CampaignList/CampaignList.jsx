import CampaignCard from '../CampaignCard/CampaignCard'
import './CampaignList.css'

export default function CampaignList({ campaigns, onRefresh }) {
  return (
    <section id="campaigns" className="section">
      <div className="section-header-row">
        <h2 className="section-title">Active <span className="gradient-text">Campaigns</span></h2>
        <button className="btn btn-secondary" onClick={onRefresh} id="refreshCampaigns">⟳ Refresh</button>
      </div>
      <div className="campaign-grid" id="campaignGrid">
        {campaigns.length === 0 ? (
          <div className="empty-state" id="emptyState">
            <div className="empty-icon">📭</div>
            <p>No campaigns yet. Be the first to create one!</p>
          </div>
        ) : (
          campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} onAction={onRefresh} />
          ))
        )}
      </div>
    </section>
  )
}
