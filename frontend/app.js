// ═══════════════════════════════════════════════
//  CrowdFund DApp — Frontend Application Logic
// ═══════════════════════════════════════════════

// ─── Contract ABI (matches CrowdFunding.sol) ──
const CONTRACT_ABI = [
    // createCampaign
    {
        "inputs": [
            { "internalType": "uint256", "name": "_goalWei", "type": "uint256" },
            { "internalType": "uint256", "name": "_durationSeconds", "type": "uint256" },
            { "internalType": "bytes32", "name": "_ipfsCID", "type": "bytes32" }
        ],
        "name": "createCampaign",
        "outputs": [
            { "internalType": "uint256", "name": "campaignId", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // contribute
    {
        "inputs": [
            { "internalType": "uint256", "name": "_campaignId", "type": "uint256" }
        ],
        "name": "contribute",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    // withdrawFunds
    {
        "inputs": [
            { "internalType": "uint256", "name": "_campaignId", "type": "uint256" }
        ],
        "name": "withdrawFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // refund
    {
        "inputs": [
            { "internalType": "uint256", "name": "_campaignId", "type": "uint256" }
        ],
        "name": "refund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // campaignCount
    {
        "inputs": [],
        "name": "campaignCount",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // getCampaign
    {
        "inputs": [
            { "internalType": "uint256", "name": "_campaignId", "type": "uint256" }
        ],
        "name": "getCampaign",
        "outputs": [
            { "internalType": "address", "name": "creator", "type": "address" },
            { "internalType": "uint256", "name": "goalWei", "type": "uint256" },
            { "internalType": "uint256", "name": "deadlineTimestamp", "type": "uint256" },
            { "internalType": "uint256", "name": "raisedWei", "type": "uint256" },
            { "internalType": "bytes32", "name": "ipfsCID", "type": "bytes32" },
            { "internalType": "uint8", "name": "status", "type": "uint8" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // getContribution
    {
        "inputs": [
            { "internalType": "uint256", "name": "_campaignId", "type": "uint256" },
            { "internalType": "address", "name": "_contributor", "type": "address" }
        ],
        "name": "getContribution",
        "outputs": [
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Events
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "goalWei", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "deadlineTimestamp", "type": "uint256" }
        ],
        "name": "CampaignCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "contributor", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "Contributed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "FundsWithdrawnEvent",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "contributor", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "RefundIssued",
        "type": "event"
    }
];

// ─── Configuration ─────────────────────────────
// Update this after deploying to a local Anvil node or testnet
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Anvil deploy address
const CHAIN_ID_HEX = "0x7a69"; // 31337 for Anvil local

// ─── State ─────────────────────────────────────
let provider = null;
let signer = null;
let contract = null;
let userAddress = null;

// ─── DOM Elements ──────────────────────────────
const connectBtn = document.getElementById("connectWallet");
const btnText = connectBtn.querySelector(".btn-text");
const statCampaigns = document.getElementById("statCampaigns");
const statBalance = document.getElementById("statBalance");
const statNetwork = document.getElementById("statNetwork");
const statAddress = document.getElementById("statAddress");
const createCampaignBtn = document.getElementById("createCampaignBtn");
const goalInput = document.getElementById("goalInput");
const durationInput = document.getElementById("durationInput");
const ipfsCidInput = document.getElementById("ipfsCidInput");
const createStatus = document.getElementById("createStatus");
const campaignGrid = document.getElementById("campaignGrid");
const emptyState = document.getElementById("emptyState");
const refreshBtn = document.getElementById("refreshCampaigns");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

// ─── Utility Helpers ───────────────────────────

function showToast(message, type = "success") {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 4000);
}

function showStatus(el, message, type) {
    el.textContent = message;
    el.className = `status-message ${type}`;
    el.classList.remove("hidden");
}

function hideStatus(el) {
    el.classList.add("hidden");
}

function truncateAddress(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function weiToEth(weiStr) {
    // ethers v6: formatEther
    if (window.ethers && window.ethers.formatEther) {
        return window.ethers.formatEther(weiStr);
    }
    // Manual fallback (BigInt)
    const wei = BigInt(weiStr);
    const eth = Number(wei) / 1e18;
    return eth.toFixed(4);
}

function ethToWei(ethStr) {
    // ethers v6: parseEther
    if (window.ethers && window.ethers.parseEther) {
        return window.ethers.parseEther(ethStr);
    }
    // Manual fallback (BigInt)
    const [whole, dec = ""] = ethStr.split(".");
    const padded = (dec + "000000000000000000").slice(0, 18);
    return BigInt(whole || "0") * BigInt(10 ** 18) + BigInt(padded);
}

const STATUS_LABELS = ["Active", "Successful", "Failed", "FundsWithdrawn"];
const STATUS_CLASSES = ["status-active", "status-successful", "status-failed", "status-withdrawn"];

function formatDeadline(timestamp) {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    if (date <= now) return "Ended " + date.toLocaleDateString();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
}

// ─── Wallet Connection ─────────────────────────

async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        showToast("MetaMask not detected. Please install MetaMask.", "error");
        return;
    }

    try {
        // Request accounts
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });
        userAddress = accounts[0];

        // Create ethers provider + signer (ethers v6 via CDN or bundled)
        if (window.ethers) {
            provider = new window.ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            contract = new window.ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        } else {
            // Fallback: raw ethereum RPC calls
            provider = window.ethereum;
            contract = null;
        }

        // UI updates
        connectBtn.classList.add("connected");
        btnText.textContent = truncateAddress(userAddress);
        statAddress.textContent = truncateAddress(userAddress);

        await updateBalance();
        await updateNetworkInfo();
        await loadCampaigns();

        showToast("Wallet connected successfully!", "success");

        // Listen for account/network changes
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", () => window.location.reload());

    } catch (err) {
        console.error("Connection failed:", err);
        showToast("Failed to connect wallet: " + err.message, "error");
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // Disconnected
        userAddress = null;
        connectBtn.classList.remove("connected");
        btnText.textContent = "Connect Wallet";
        statAddress.textContent = "—";
        statBalance.textContent = "0 ETH";
        showToast("Wallet disconnected", "error");
    } else {
        userAddress = accounts[0];
        btnText.textContent = truncateAddress(userAddress);
        statAddress.textContent = truncateAddress(userAddress);
        updateBalance();
        loadCampaigns();
    }
}

async function updateBalance() {
    if (!userAddress) return;
    try {
        const balanceHex = await window.ethereum.request({
            method: "eth_getBalance",
            params: [userAddress, "latest"]
        });
        const balanceWei = BigInt(balanceHex);
        const balanceEth = (Number(balanceWei) / 1e18).toFixed(4);
        statBalance.textContent = balanceEth + " ETH";
    } catch (e) {
        console.error("Balance fetch error:", e);
    }
}

async function updateNetworkInfo() {
    try {
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);
        const networkNames = {
            1: "Ethereum Mainnet",
            5: "Goerli",
            11155111: "Sepolia",
            31337: "Anvil (Local)",
            1337: "Local Dev",
            137: "Polygon",
            80001: "Mumbai"
        };
        statNetwork.textContent = networkNames[chainId] || `Chain ${chainId}`;
    } catch (e) {
        statNetwork.textContent = "Unknown";
    }
}

// ─── Read Contract State ───────────────────────

async function getCampaignCount() {
    if (contract) {
        const count = await contract.campaignCount();
        return Number(count);
    }
    // Fallback: raw RPC call
    const data = "0x" + "96b5a755"; // campaignCount() selector
    const result = await window.ethereum.request({
        method: "eth_call",
        params: [{ to: CONTRACT_ADDRESS, data }, "latest"]
    });
    return parseInt(result, 16);
}

async function getCampaignData(id) {
    if (contract) {
        const c = await contract.getCampaign(id);
        return {
            creator: c[0],
            goalWei: c[1],
            deadlineTimestamp: c[2],
            raisedWei: c[3],
            ipfsCID: c[4],
            status: Number(c[5])
        };
    }
    return null;
}

async function getUserContribution(campaignId) {
    if (!contract || !userAddress) return BigInt(0);
    try {
        const amount = await contract.getContribution(campaignId, userAddress);
        return BigInt(amount);
    } catch {
        return BigInt(0);
    }
}

// ─── Load & Render Campaigns ───────────────────

async function loadCampaigns() {
    try {
        const count = await getCampaignCount();
        statCampaigns.textContent = count;

        if (count === 0) {
            campaignGrid.innerHTML = "";
            campaignGrid.appendChild(createEmptyState());
            return;
        }

        campaignGrid.innerHTML = "";

        for (let i = count; i >= 1; i--) {
            const data = await getCampaignData(i);
            if (data) {
                const contribution = await getUserContribution(i);
                const card = renderCampaignCard(i, data, contribution);
                campaignGrid.appendChild(card);
            }
        }
    } catch (err) {
        console.error("Failed to load campaigns:", err);
        showToast("Failed to load campaigns. Check contract address.", "error");
    }
}

function createEmptyState() {
    const div = document.createElement("div");
    div.className = "empty-state";
    div.innerHTML = `<div class="empty-icon">📭</div><p>No campaigns yet. Be the first to create one!</p>`;
    return div;
}

function renderCampaignCard(id, data, userContribution) {
    const card = document.createElement("div");
    card.className = "campaign-card";
    card.id = `campaign-${id}`;

    const goalEth = weiToEth(data.goalWei.toString());
    const raisedEth = weiToEth(data.raisedWei.toString());
    const goalNum = parseFloat(goalEth);
    const raisedNum = parseFloat(raisedEth);
    const percent = goalNum > 0 ? Math.min((raisedNum / goalNum) * 100, 100) : 0;
    const statusIdx = data.status;
    const statusLabel = STATUS_LABELS[statusIdx] || "Unknown";
    const statusClass = STATUS_CLASSES[statusIdx] || "";
    const deadlineStr = formatDeadline(data.deadlineTimestamp);
    const isCreator = userAddress && data.creator.toLowerCase() === userAddress.toLowerCase();
    const now = Math.floor(Date.now() / 1000);
    const pastDeadline = now >= Number(data.deadlineTimestamp);
    const contributionEth = weiToEth(userContribution.toString());

    let actionsHTML = "";

    // Active campaign — show contribute input
    if (statusIdx === 0 && !pastDeadline) {
        actionsHTML = `
            <div class="contribute-inline">
                <input type="number" placeholder="ETH amount" step="0.01" min="0.001" id="contribute-input-${id}">
                <button class="btn btn-primary btn-sm" onclick="contributeToId(${id})">Contribute</button>
            </div>
        `;
    }

    // Past deadline, successful — creator can withdraw
    if (pastDeadline && (statusIdx === 0 || statusIdx === 1) && isCreator) {
        actionsHTML += `<button class="btn btn-success btn-sm" onclick="withdrawFromId(${id})">Withdraw Funds</button>`;
    }

    // Past deadline, failed — contributor can refund
    if (pastDeadline && (statusIdx === 0 || statusIdx === 2) && userContribution > 0n) {
        actionsHTML += `<button class="btn btn-danger btn-sm" onclick="refundFromId(${id})">Refund ${contributionEth} ETH</button>`;
    }

    card.innerHTML = `
        <div class="campaign-header">
            <span class="campaign-id">CAMPAIGN #${id}</span>
            <span class="campaign-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="campaign-creator">
            <strong>Creator:</strong> ${truncateAddress(data.creator)}
            ${isCreator ? " (You)" : ""}
        </div>
        <div class="progress-section">
            <div class="progress-info">
                <span class="progress-raised">${raisedEth} ETH raised</span>
                <span class="progress-goal">of ${goalEth} ETH</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="progress-percent">${percent.toFixed(1)}% funded</div>
        </div>
        <div class="campaign-deadline">
            <span class="icon">⏱</span>
            <span>${deadlineStr}</span>
        </div>
        ${userContribution > 0n ? `<div style="font-size:0.8125rem; color:var(--accent-3); margin-bottom:var(--space-md);">Your contribution: ${contributionEth} ETH</div>` : ""}
        <div class="campaign-actions">${actionsHTML}</div>
    `;

    return card;
}

// ─── Create Campaign ───────────────────────────

async function createCampaign() {
    if (!contract) {
        showToast("Please connect your wallet first.", "error");
        return;
    }

    const goalEth = goalInput.value.trim();
    const durationDays = durationInput.value.trim();
    const cidStr = ipfsCidInput.value.trim();

    if (!goalEth || parseFloat(goalEth) <= 0) {
        showStatus(createStatus, "Please enter a valid goal amount.", "error");
        return;
    }
    if (!durationDays || parseInt(durationDays) <= 0) {
        showStatus(createStatus, "Please enter a valid duration.", "error");
        return;
    }

    // Convert CID string to bytes32
    let cidBytes32;
    if (cidStr.startsWith("0x") && cidStr.length === 66) {
        cidBytes32 = cidStr;
    } else if (cidStr) {
        // Hash the CID string to get bytes32
        cidBytes32 = window.ethers
            ? window.ethers.keccak256(window.ethers.toUtf8Bytes(cidStr))
            : "0x" + "00".repeat(32);
    } else {
        cidBytes32 = "0x" + "00".repeat(32);
    }

    const goalWei = ethToWei(goalEth);
    const durationSeconds = parseInt(durationDays) * 86400;

    try {
        showStatus(createStatus, "⏳ Sending transaction via MetaMask...", "pending");
        createCampaignBtn.disabled = true;

        const tx = await contract.createCampaign(goalWei, durationSeconds, cidBytes32);
        showStatus(createStatus, "⏳ Waiting for confirmation...", "pending");
        await tx.wait();

        showStatus(createStatus, "✅ Campaign created successfully!", "success");
        showToast("Campaign created!", "success");

        // Reset form
        goalInput.value = "";
        durationInput.value = "";
        ipfsCidInput.value = "";

        await updateBalance();
        await loadCampaigns();
    } catch (err) {
        console.error("Create campaign error:", err);
        const msg = err.reason || err.message || "Transaction failed";
        showStatus(createStatus, "❌ " + msg, "error");
        showToast("Failed to create campaign", "error");
    } finally {
        createCampaignBtn.disabled = false;
    }
}

// ─── Contribute ────────────────────────────────

async function contributeToId(id) {
    if (!contract) {
        showToast("Please connect your wallet first.", "error");
        return;
    }

    const input = document.getElementById(`contribute-input-${id}`);
    const ethAmount = input ? input.value.trim() : "";

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
        showToast("Please enter a valid ETH amount.", "error");
        return;
    }

    try {
        showToast("⏳ Sending contribution via MetaMask...", "pending");
        const valueWei = ethToWei(ethAmount);
        const tx = await contract.contribute(id, { value: valueWei });
        showToast("⏳ Waiting for confirmation...", "pending");
        await tx.wait();

        showToast(`✅ Successfully contributed ${ethAmount} ETH!`, "success");
        await updateBalance();
        await loadCampaigns();
    } catch (err) {
        console.error("Contribute error:", err);
        const msg = err.reason || err.message || "Transaction failed";
        showToast("❌ " + msg, "error");
    }
}

// ─── Withdraw ──────────────────────────────────

async function withdrawFromId(id) {
    if (!contract) {
        showToast("Please connect your wallet first.", "error");
        return;
    }

    try {
        showToast("⏳ Withdrawing funds via MetaMask...", "pending");
        const tx = await contract.withdrawFunds(id);
        showToast("⏳ Waiting for confirmation...", "pending");
        await tx.wait();

        showToast("✅ Funds withdrawn successfully!", "success");
        await updateBalance();
        await loadCampaigns();
    } catch (err) {
        console.error("Withdraw error:", err);
        const msg = err.reason || err.message || "Transaction failed";
        showToast("❌ " + msg, "error");
    }
}

// ─── Refund ────────────────────────────────────

async function refundFromId(id) {
    if (!contract) {
        showToast("Please connect your wallet first.", "error");
        return;
    }

    try {
        showToast("⏳ Requesting refund via MetaMask...", "pending");
        const tx = await contract.refund(id);
        showToast("⏳ Waiting for confirmation...", "pending");
        await tx.wait();

        showToast("✅ Refund received successfully!", "success");
        await updateBalance();
        await loadCampaigns();
    } catch (err) {
        console.error("Refund error:", err);
        const msg = err.reason || err.message || "Transaction failed";
        showToast("❌ " + msg, "error");
    }
}

// ─── Event Listeners ───────────────────────────

connectBtn.addEventListener("click", connectWallet);
createCampaignBtn.addEventListener("click", createCampaign);
refreshBtn.addEventListener("click", loadCampaigns);

// Smooth scroll navigation
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        link.classList.add("active");
    });
});

// ─── Load ethers.js from CDN ───────────────────
(function loadEthers() {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.umd.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
        console.log("ethers.js v6 loaded");
        // Auto-connect if already authorized
        if (window.ethereum) {
            window.ethereum.request({ method: "eth_accounts" }).then(accounts => {
                if (accounts.length > 0) {
                    connectWallet();
                }
            });
        }
    };
    script.onerror = () => {
        console.warn("Failed to load ethers.js CDN — raw RPC fallback will be used.");
    };
    document.head.appendChild(script);
})();

// Make functions available globally (called from onclick in rendered HTML)
window.contributeToId = contributeToId;
window.withdrawFromId = withdrawFromId;
window.refundFromId = refundFromId;
