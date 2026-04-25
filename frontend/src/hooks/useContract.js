import { useState, useCallback } from 'react'
import { useWeb3 } from '../context/Web3Context'
import { weiToEth } from '../utils/helpers'

/**
 * Hook for reading/writing to the CrowdFunding contract.
 */
export function useContract() {
  const { contract, account, refreshBalance } = useWeb3()
  const [loading, setLoading] = useState(false)

  const getCampaignCount = useCallback(async () => {
    if (!contract) return 0
    const count = await contract.campaignCount()
    return Number(count)
  }, [contract])

  const getCampaign = useCallback(async (id) => {
    if (!contract) return null
    const c = await contract.getCampaign(id)
    return {
      creator: c[0],
      goalWei: c[1],
      deadlineTimestamp: c[2],
      raisedWei: c[3],
      ipfsCID: c[4],
      status: Number(c[5]),
    }
  }, [contract])

  const getContribution = useCallback(async (campaignId) => {
    if (!contract || !account) return BigInt(0)
    try {
      const amount = await contract.getContribution(campaignId, account)
      return BigInt(amount)
    } catch {
      return BigInt(0)
    }
  }, [contract, account])

  const loadAllCampaigns = useCallback(async () => {
    const count = await getCampaignCount()
    const campaigns = []
    for (let i = count; i >= 1; i--) {
      const data = await getCampaign(i)
      if (data) {
        const contribution = await getContribution(i)
        campaigns.push({ id: i, ...data, userContribution: contribution })
      }
    }
    return { count, campaigns }
  }, [getCampaignCount, getCampaign, getContribution])

  const createCampaign = useCallback(async (goalWei, durationSeconds, cidBytes32) => {
    if (!contract) throw new Error('Wallet not connected')
    setLoading(true)
    try {
      const tx = await contract.createCampaign(goalWei, durationSeconds, cidBytes32)
      await tx.wait()
      await refreshBalance()
    } finally {
      setLoading(false)
    }
  }, [contract, refreshBalance])

  const contribute = useCallback(async (id, valueWei) => {
    if (!contract) throw new Error('Wallet not connected')
    setLoading(true)
    try {
      const tx = await contract.contribute(id, { value: valueWei })
      await tx.wait()
      await refreshBalance()
    } finally {
      setLoading(false)
    }
  }, [contract, refreshBalance])

  const withdrawFunds = useCallback(async (id) => {
    if (!contract) throw new Error('Wallet not connected')
    setLoading(true)
    try {
      const tx = await contract.withdrawFunds(id)
      await tx.wait()
      await refreshBalance()
    } finally {
      setLoading(false)
    }
  }, [contract, refreshBalance])

  const refund = useCallback(async (id) => {
    if (!contract) throw new Error('Wallet not connected')
    setLoading(true)
    try {
      const tx = await contract.refund(id)
      await tx.wait()
      await refreshBalance()
    } finally {
      setLoading(false)
    }
  }, [contract, refreshBalance])

  return {
    loading,
    getCampaignCount,
    getCampaign,
    getContribution,
    loadAllCampaigns,
    createCampaign,
    contribute,
    withdrawFunds,
    refund,
  }
}
