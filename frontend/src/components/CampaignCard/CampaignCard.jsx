import { useState, useEffect } from 'react'
import { useWeb3 } from '../../context/Web3Context'
import { useContract } from '../../hooks/useContract'
import { weiToEth, ethToWei, truncateAddress, formatDeadline, STATUS_LABELS, STATUS_CLASSES, loadFromIPFS } from '../../utils/helpers'
import './CampaignCard.css'

export default function CampaignCard({ campaign, onAction }) {
  const { account } = useWeb3()
  const { contribute, withdrawFunds, refund, loading } = useContract()
  const [ethAmount, setEthAmount] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [metaLoading, setMetaLoading] = useState(true)

  const { id, creator, goalWei, raisedWei, deadlineTimestamp, status: statusIdx, userContribution, ipfsCID } = campaign

  useEffect(() => {
    let cancelled = false
    async function fetchMetadata() {
      setMetaLoading(true)
      try {
        const data = await loadFromIPFS(ipfsCID)
        if (!cancelled && data) {
          setMetadata(data)
        }
      } catch (err) {
        console.error(`Failed to load metadata for campaign ${id}:`, err)
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    }
    fetchMetadata()
    return () => { cancelled = true }
  }, [ipfsCID, id])

  const goalEth = weiToEth(goalWei.toString())
  const raisedEth = weiToEth(raisedWei.toString())
  const goalNum = parseFloat(goalEth)
  const raisedNum = parseFloat(raisedEth)
  const percent = goalNum > 0 ? Math.min((raisedNum / goalNum) * 100, 100) : 0
  const statusLabel = STATUS_LABELS[statusIdx] || 'Unknown'
  const statusClass = STATUS_CLASSES[statusIdx] || ''
  const deadlineStr = formatDeadline(deadlineTimestamp)
  const isCreator = account && creator.toLowerCase() === account.toLowerCase()
  const now = Math.floor(Date.now() / 1000)
  const pastDeadline = now >= Number(deadlineTimestamp)
  const contributionEth = weiToEth(userContribution.toString())

  async function handleContribute() {
    if (!ethAmount || parseFloat(ethAmount) <= 0) return
    try {
      await contribute(id, ethToWei(ethAmount))
      setEthAmount('')
      if (onAction) onAction()
    } catch (err) {
      console.error('Contribute error:', err)
    }
  }

  async function handleWithdraw() {
    try {
      await withdrawFunds(id)
      if (onAction) onAction()
    } catch (err) {
      console.error('Withdraw error:', err)
    }
  }

  async function handleRefund() {
    try {
      await refund(id)
      if (onAction) onAction()
    } catch (err) {
      console.error('Refund error:', err)
    }
  }

  return (
    <div className="campaign-card" id={`campaign-${id}`}>
      {metadata && metadata.imageUrl && (
        <div className="campaign-image">
          <img src={metadata.imageUrl} alt={metadata.title || `Campaign ${id}`} />
        </div>
      )}
      <div className="campaign-header">
        <span className="campaign-id">CAMPAIGN #{id}</span>
        <span className={`campaign-status ${statusClass}`}>{statusLabel}</span>
      </div>

      {metaLoading ? (
        <div className="campaign-metadata campaign-meta-loading">
          <div className="meta-skeleton" />
          <div className="meta-skeleton meta-skeleton-sm" />
        </div>
      ) : metadata ? (
        <div className="campaign-metadata">
          <h3 className="campaign-title">{metadata.title}</h3>
          <p className="campaign-description">{metadata.description}</p>
        </div>
      ) : (
        <div className="campaign-metadata campaign-meta-fallback">
          <h3 className="campaign-title">Campaign #{id}</h3>
          <p className="campaign-description campaign-desc-muted">No description available</p>
        </div>
      )}

      <div className="campaign-creator">
        <strong>Creator:</strong> {truncateAddress(creator)}
        {isCreator ? ' (You)' : ''}
      </div>

      <div className="progress-section">
        <div className="progress-info">
          <span className="progress-raised">{raisedEth} ETH raised</span>
          <span className="progress-goal">of {goalEth} ETH</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="progress-percent">{percent.toFixed(1)}% funded</div>
      </div>

      <div className="campaign-deadline">
        <span className="icon">⏱</span>
        <span>{deadlineStr}</span>
      </div>

      {userContribution > 0n && (
        <div className="campaign-user-contribution">Your contribution: {contributionEth} ETH</div>
      )}

      <div className="campaign-actions">
        {statusIdx === 0 && !pastDeadline && (
          <div className="contribute-inline">
            <input
              type="number" placeholder="ETH amount" step="0.01" min="0.001"
              value={ethAmount} onChange={(e) => setEthAmount(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleContribute} disabled={loading}>
              Contribute
            </button>
          </div>
        )}

        {pastDeadline && (statusIdx === 0 || statusIdx === 1) && isCreator && (
          <button className="btn btn-success btn-sm" onClick={handleWithdraw} disabled={loading}>
            Withdraw Funds
          </button>
        )}

        {pastDeadline && (statusIdx === 0 || statusIdx === 2) && userContribution > 0n && (
          <button className="btn btn-danger btn-sm" onClick={handleRefund} disabled={loading}>
            Refund {contributionEth} ETH
          </button>
        )}
      </div>
    </div>
  )
}
