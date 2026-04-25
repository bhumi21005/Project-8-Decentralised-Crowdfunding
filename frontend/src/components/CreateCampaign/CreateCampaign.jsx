import { useState } from 'react'
import { useContract } from '../../hooks/useContract'
import { ethToWei, uploadToPinata } from '../../utils/helpers'
import './CreateCampaign.css'

export default function CreateCampaign({ onCreated }) {
  const { createCampaign, loading } = useContract()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState('')
  const [status, setStatus] = useState(null) // { type, message }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!title || !description) {
      setStatus({ type: 'error', message: 'Please enter a title and description.' })
      return
    }
    if (!goal || parseFloat(goal) <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid goal amount.' })
      return
    }
    if (!duration || parseInt(duration) <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid duration.' })
      return
    }

    try {
      setStatus({ type: 'pending', message: '⏳ Uploading metadata to IPFS via Pinata...' })
      
      // 1. Save metadata off-chain (Real IPFS)
      const metadata = {
        title,
        description,
        imageUrl: imageUrl || 'https://via.placeholder.com/800x400?text=No+Media+Uploaded'
      }
      const cidBytes32 = await uploadToPinata(metadata)

      // 2. Send transaction
      setStatus({ type: 'pending', message: '⏳ Sending transaction via MetaMask...' })
      const goalWei = ethToWei(goal)
      const durationSeconds = parseInt(duration) * 86400

      await createCampaign(goalWei, durationSeconds, cidBytes32)
      
      setStatus({ type: 'success', message: '✅ Campaign created successfully!' })
      setTitle('')
      setDescription('')
      setImageUrl('')
      setGoal('')
      setDuration('')
      if (onCreated) onCreated()
    } catch (err) {
      console.error('Create campaign error:', err)
      setStatus({ type: 'error', message: '❌ ' + (err.reason || err.message || 'Transaction failed') })
    }
  }

  return (
    <section id="create" className="section">
      <h2 className="section-title">Create a <span className="gradient-text">Campaign</span></h2>
      <form className="form-card" onSubmit={handleSubmit} id="createForm">
        <div className="form-group">
          <label htmlFor="titleInput">Campaign Title</label>
          <input
            type="text" id="titleInput"
            placeholder="e.g. Save the Forest"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="descInput">Description</label>
          <textarea
            id="descInput"
            placeholder="Why do you need funding?"
            rows="3"
            value={description} onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="imageInput">Photo/Video URL (Optional)</label>
          <input
            type="url" id="imageInput"
            placeholder="https://example.com/image.png"
            value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="goalInput">Funding Goal (ETH)</label>
          <input
            type="number" id="goalInput"
            placeholder="e.g. 10" step="0.01" min="0.001"
            value={goal} onChange={(e) => setGoal(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="durationInput">Duration (days)</label>
          <input
            type="number" id="durationInput"
            placeholder="e.g. 30" min="1"
            value={duration} onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="createCampaignBtn">
          🚀 {loading ? 'Creating...' : 'Create Campaign'}
        </button>
        {status && (
          <div className={`status-message ${status.type}`} id="createStatus">{status.message}</div>
        )}
      </form>
    </section>
  )
}
