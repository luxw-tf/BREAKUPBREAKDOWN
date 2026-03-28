import { ethers } from 'ethers';

const MONAD_TESTNET = {
    chainId: '0x279F',
    chainName: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: ['https://testnet-rpc.monad.xyz/'],
    blockExplorerUrls: ['https://testnet.monadexplorer.com/']
};

export function initAgentDemo() {
    const runBtn = document.getElementById('run-agent-btn');
    const input = document.getElementById('contract-input');
    const connectBtn = document.getElementById('connect-wallet-btn');
    const charCount = document.getElementById('char-count');

    if (!runBtn || !input) return;

    let walletAddress = null;
    let provider = null;
    let signer = null;

    // --- Character counter ---
    if (input && charCount) {
        input.addEventListener('input', () => {
            charCount.textContent = `${input.value.length} characters`;
        });
    }

    // --- Step Navigation ---
    const showStep = (stepNum) => {
        [1, 2, 3].forEach(n => {
            const panel = document.getElementById(`step-${n}`);
            if (panel) panel.style.display = n === stepNum ? 'block' : 'none';
        });
        // Update progress bar
        document.querySelectorAll('.audit-step').forEach(el => {
            const s = parseInt(el.dataset.step);
            el.classList.toggle('active', s <= stepNum);
            el.classList.toggle('completed', s < stepNum);
        });
        document.querySelectorAll('.audit-step-line').forEach((line, i) => {
            line.classList.toggle('active', (i + 1) < stepNum);
        });
    };

    // --- Ensure Monad Testnet ---
    const ensureMonadTestnet = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: MONAD_TESTNET.chainId }]
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [MONAD_TESTNET]
                });
            } else {
                throw switchError;
            }
        }
    };

    // --- Connect Wallet ---
    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask to use this feature.");
            return;
        }
        try {
            await ensureMonadTestnet();
            provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                signer = await provider.getSigner();
                if (connectBtn) {
                    connectBtn.innerText = `${walletAddress.substring(0,6)}...${walletAddress.substring(walletAddress.length-4)}`;
                    connectBtn.classList.add("btn-outline");
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }

    // --- Update payment status message ---
    const setPaymentStatus = (html, isError = false) => {
        const el = document.getElementById('payment-status');
        if (el) {
            el.innerHTML = html;
            el.className = `payment-status ${isError ? 'error' : ''}`;
        }
    };

    // --- Render the Audit Report ---
    const renderReport = (report, txHash) => {
        const container = document.getElementById('report-container');
        if (!container) return;

        const severityColors = {
            'CRITICAL': '#DC2626',
            'HIGH': '#EA580C',
            'MEDIUM': '#D97706',
            'LOW': '#2563EB',
            'INFO': '#6B7280',
            'INFORMATIONAL': '#6B7280'
        };

        const riskColor = severityColors[report.riskLevel] || '#6B7280';

        let findingsHTML = '';
        if (report.findings && report.findings.length > 0) {
            findingsHTML = report.findings.map(f => {
                const color = severityColors[f.severity] || '#6B7280';
                return `
                <div class="finding-card">
                    <div class="finding-header">
                        <span class="finding-severity" style="background: ${color};">${f.severity}</span>
                        <span class="finding-id">${f.id}</span>
                        <span class="finding-category">${f.category}</span>
                    </div>
                    <h4 class="finding-title">${f.title}</h4>
                    <p class="finding-desc">${f.description}</p>
                    ${f.location ? `<div class="finding-meta"><strong>📍 Location:</strong> ${f.location}</div>` : ''}
                    ${f.impact ? `<div class="finding-meta"><strong>💥 Impact:</strong> ${f.impact}</div>` : ''}
                    ${f.recommendation ? `<div class="finding-recommendation"><strong>🛠 Fix:</strong> ${f.recommendation}</div>` : ''}
                </div>`;
            }).join('');
        } else {
            findingsHTML = '<p class="card-desc">No vulnerabilities found. This contract appears to be well-written.</p>';
        }

        let gasHTML = '';
        if (report.gasOptimizations && report.gasOptimizations.length > 0) {
            gasHTML = report.gasOptimizations.map(g => `
                <div class="gas-item">
                    <strong>⚡ ${g.title}</strong>
                    <p>${g.description}</p>
                    ${g.estimatedSavings ? `<span class="gas-savings">~${g.estimatedSavings}</span>` : ''}
                </div>
            `).join('');
        }

        let bestHTML = '';
        if (report.bestPractices && report.bestPractices.length > 0) {
            bestHTML = report.bestPractices.map(b => `<li>${b}</li>`).join('');
        }

        const meta = report.auditMetadata || {};

        container.innerHTML = `
            <div class="report">
                <!-- Report Header -->
                <div class="report-header">
                    <div>
                        <h2 style="margin-bottom: 0.25rem;">Vulnerability Report</h2>
                        <p class="card-desc">${report.contractName || 'Smart Contract'} — Audited by BreakupBreakdown AI</p>
                    </div>
                    <div class="report-risk" style="background: ${riskColor};">
                        ${report.riskLevel || 'UNKNOWN'}
                    </div>
                </div>

                <!-- Summary -->
                <div class="report-section">
                    <p style="font-size: 1.05rem; line-height: 1.6;">${report.summary || ''}</p>
                </div>

                <!-- Stats Bar -->
                <div class="report-stats">
                    <div class="stat-item">
                        <span class="stat-value">${meta.totalFindings || 0}</span>
                        <span class="stat-label">Total Findings</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" style="color: #DC2626;">${meta.criticalCount || 0}</span>
                        <span class="stat-label">Critical</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" style="color: #EA580C;">${meta.highCount || 0}</span>
                        <span class="stat-label">High</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" style="color: #D97706;">${meta.mediumCount || 0}</span>
                        <span class="stat-label">Medium</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" style="color: #2563EB;">${meta.lowCount || 0}</span>
                        <span class="stat-label">Low</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${meta.functionsAnalyzed || '-'}</span>
                        <span class="stat-label">Functions</span>
                    </div>
                </div>

                <!-- Findings -->
                <div class="report-section">
                    <h3>🔍 Findings</h3>
                    ${findingsHTML}
                </div>

                <!-- Gas Optimizations -->
                ${gasHTML ? `
                <div class="report-section">
                    <h3>⚡ Gas Optimizations</h3>
                    ${gasHTML}
                </div>` : ''}

                <!-- Best Practices -->
                ${bestHTML ? `
                <div class="report-section">
                    <h3>✅ Best Practices</h3>
                    <ul class="best-practices-list">${bestHTML}</ul>
                </div>` : ''}

                <!-- Payment Receipt -->
                <div class="report-section report-receipt">
                    <h3>🧾 Payment Receipt</h3>
                    <div class="receipt-row"><span>Network</span><span>Monad Testnet</span></div>
                    <div class="receipt-row"><span>Transaction</span><a href="https://testnet.monadexplorer.com/tx/${txHash}" target="_blank" style="color: var(--color-accent);">${txHash.substring(0,16)}...</a></div>
                    <div class="receipt-row"><span>Amount</span><span>0.01 MON</span></div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-md); flex-wrap: wrap;">
                    <button id="new-audit-btn" class="btn btn-outline">Run Another Audit</button>
                </div>
            </div>
        `;

        // Bind "Run Another Audit" button
        document.getElementById('new-audit-btn')?.addEventListener('click', () => {
            showStep(1);
            input.value = '';
            if (charCount) charCount.textContent = '0 characters';
        });
    };

    // --- Main Audit Flow ---
    const runAudit = async () => {
        const code = input.value.trim();
        if (!code) {
            alert('Please paste your Solidity contract code first.');
            return;
        }

        if (!walletAddress || !signer) {
            // Auto-connect
            await connectWallet();
            if (!walletAddress || !signer) return;
        }

        // Reset UI state
        document.getElementById('payment-card-content').style.display = 'block';
        const pipelineBuffer = document.getElementById('pipeline-buffer');
        if (pipelineBuffer) pipelineBuffer.style.display = 'none';

        // Move to step 2
        showStep(2);
        setPaymentStatus('<div class="spinner"></div><span>Connecting to BreakupBreakdown API...</span>');

        let paymentTxHash = null;

        try {
            // 1. Hit the API (expect 402)
            const initialRes = await fetch('http://localhost:3000/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (initialRes.status === 402) {
                setPaymentStatus('<div class="spinner"></div><span>Payment required — opening wallet...</span>');

                // Ensure correct chain
                await ensureMonadTestnet();
                provider = new ethers.BrowserProvider(window.ethereum);
                signer = await provider.getSigner();

                // Get contract info
                const infoRes = await fetch('http://localhost:3000/api/contract-info');
                const info = await infoRes.json();

                // Call payForScan()
                const contract = new ethers.Contract(info.contractAddress, info.abi, signer);
                const value = ethers.parseEther(info.scanPrice);

                setPaymentStatus('<div class="spinner"></div><span>Confirm the transaction in your wallet...</span>');
                const tx = await contract.payForScan({ value });

                setPaymentStatus('<div class="spinner"></div><span>Transaction sent. Waiting for confirmation...</span>');
                await tx.wait(1);

                paymentTxHash = tx.hash;
                setPaymentStatus('<div class="spinner"></div><span>Payment confirmed! Running AI audit...</span>');
            }

            // 2. Retry with payment
            if (paymentTxHash) {
                // Show Pipeline Buffer
                document.getElementById('payment-card-content').style.display = 'none';
                if (pipelineBuffer) pipelineBuffer.style.display = 'block';
                
                const pipelineStepsEl = document.getElementById('pipeline-steps');
                if (pipelineStepsEl) pipelineStepsEl.innerHTML = '';
                
                const mockSteps = [
                    "Initializing BreakupBreakdown AI Core...",
                    "Constructing Abstract Syntax Tree (AST)...",
                    "Running static analysis & symbolic execution...",
                    "Spinning up isolated fork for Combinatorial Fuzzing...",
                    "Executing 10,000+ state sequences...",
                    "Synthesizing Exploit Payload & generating report..."
                ];
                
                let currentStepDiv = null;
                const sleep = ms => new Promise(r => setTimeout(r, ms));

                const startPipeline = async () => {
                    if (!pipelineStepsEl) return;
                    for(let i=0; i<mockSteps.length; i++) {
                        if (currentStepDiv) {
                            currentStepDiv.className = 'pipeline-step done';
                            currentStepDiv.querySelector('.pipeline-icon').innerHTML = '✓';
                        }
                        
                        const stepDiv = document.createElement('div');
                        stepDiv.className = 'pipeline-step active';
                        stepDiv.innerHTML = `<span class="pipeline-icon"><div class="spinner spinner-small"></div></span> <span>${mockSteps[i]}</span>`;
                        pipelineStepsEl.appendChild(stepDiv);
                        currentStepDiv = stepDiv;
                        
                        await sleep(800 + Math.random() * 1200); // 0.8s - 2.0s
                    }
                };
                
                // Start visual mock pipeline in parallel to the fetch
                const pipelineComplete = startPipeline();

                const auditRes = await fetch('http://localhost:3000/api/scan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-payment-tx': paymentTxHash
                    },
                    body: JSON.stringify({ code })
                });

                if (!auditRes.ok) {
                    const err = await auditRes.json();
                    throw new Error(err.reason || err.error || 'Audit failed');
                }

                const result = await auditRes.json();

                // Wait for the visual pipeline sequence to finish before showing report
                await pipelineComplete;
                if (currentStepDiv) {
                    currentStepDiv.className = 'pipeline-step done';
                    currentStepDiv.querySelector('.pipeline-icon').innerHTML = '✓';
                }
                
                await sleep(600); // small pause before transitioning

                // 3. Show the report
                showStep(3);
                renderReport(result.report, paymentTxHash);
            }

        } catch (error) {
            console.error(error);
            setPaymentStatus(`<span style="color: #DC2626;">❌ ${error.message}</span>`, true);
        }
    };

    runBtn.addEventListener('click', runAudit);
}
