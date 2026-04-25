import { useEffect, useRef } from 'react'
import { useWeb3 } from '../../context/Web3Context'
import MetaMaskLogo from '../MetaMaskLogo/MetaMaskLogo'
import './Landing.css'

export default function Landing() {
  const { connectWallet, isConnecting } = useWeb3()
  const canvasRef = useRef(null)

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const particles = []
    const COUNT = 40

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.3 + 0.1,
      })
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(
            particles[i].x - particles[j].x,
            particles[i].y - particles[j].y
          )
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(212, 175, 55, ${0.06 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className="landing-page" id="landingPage">
      <canvas ref={canvasRef} className="particle-canvas" />

      <div className="landing-content">
        {/* Logo */}
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#d4af37' }} />
                  <stop offset="50%" style={{ stopColor: '#f1df87' }} />
                  <stop offset="100%" style={{ stopColor: '#b8860b' }} />
                </linearGradient>
              </defs>
              <path d="M28 4L4 16v24l24 12 24-12V16L28 4z" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" />
              <path d="M28 12L12 20v16l16 8 16-8V20L28 12z" fill="url(#logoGrad)" opacity="0.15" />
              <path d="M28 20L20 24v8l8 4 8-4v-8L28 20z" fill="url(#logoGrad)" opacity="0.4" />
              <circle cx="28" cy="28" r="4" fill="url(#logoGrad)" />
            </svg>
          </div>
          <h1 className="landing-logo-text">CrowdFund</h1>
        </div>

        <p className="landing-tagline">
          Decentralised crowdfunding on the blockchain.<br />
          Create campaigns, fund ideas, withdraw — all trustless.
        </p>

        {/* MetaMask Connect Button */}
        <button
          id="landingConnectBtn"
          className={`landing-connect-btn ${isConnecting ? 'loading' : ''}`}
          onClick={connectWallet}
          disabled={isConnecting}
        >
          <span className="metamask-icon">
            <MetaMaskLogo />
          </span>
          <span className="landing-btn-text">
            {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
          </span>
          <span className="landing-btn-arrow">→</span>
        </button>

        {/* Info pills */}
        <div className="landing-info-pills">
          <div className="info-pill"><span className="pill-icon">🔒</span><span>Non-Custodial</span></div>
          <div className="info-pill"><span className="pill-icon">⛓</span><span>On-Chain</span></div>
          <div className="info-pill"><span className="pill-icon">🛡️</span><span>Reentrancy Safe</span></div>
        </div>

        <p className="landing-footnote">Powered by Ethereum &amp; Solidity</p>
      </div>
    </section>
  )
}
