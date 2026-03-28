import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// --- Monad Testnet Config ---
const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz/';
const CHAIN_ID = 10143;
const SCAN_PRICE_ETH = '0.01';

// --- Gemini API Config ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Load deployment info & ABI
let CONTRACT_ADDRESS = null;
let CONTRACT_ABI = null;

try {
    const deploymentPath = path.resolve(__dirname, '..', 'artifacts', 'deployment.json');
    const artifactPath = path.resolve(__dirname, '..', 'artifacts', 'BreakupPaymentGateway.json');

    if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        CONTRACT_ADDRESS = deployment.contractAddress;
        console.log(`[x402] Loaded contract: ${CONTRACT_ADDRESS}`);
    }
    if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        CONTRACT_ABI = artifact.abi;
        console.log(`[x402] Loaded ABI (${CONTRACT_ABI.length} entries)`);
    }
} catch (err) {
    console.warn('[x402] Could not load deployment artifacts.');
}

const provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC);

// --- Gemini Audit Function ---
async function auditWithGemini(solidityCode) {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured in .env');
    }

    const systemPrompt = `You are BreakupBreakdown, an elite AI smart contract security auditor. You perform comprehensive vulnerability analysis on Solidity smart contracts.

Analyze the provided Solidity code and return a JSON object (and ONLY a JSON object, no markdown fences) with this exact structure:

{
  "summary": "A 2-3 sentence executive summary of the contract and its overall security posture.",
  "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL",
  "contractName": "The contract name found in the code",
  "findings": [
    {
      "id": "VULN-001",
      "title": "Short vulnerability title",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "Reentrancy" | "Access Control" | "Integer Overflow" | "Unchecked Return" | "Gas Optimization" | "Logic Error" | "Front-Running" | "Other",
      "description": "Detailed explanation of the vulnerability.",
      "location": "Function or line reference where the issue occurs",
      "impact": "What could happen if exploited",
      "recommendation": "How to fix it with a code suggestion if applicable"
    }
  ],
  "gasOptimizations": [
    {
      "title": "Optimization title",
      "description": "What can be optimized",
      "estimatedSavings": "Approximate gas saved"
    }
  ],
  "bestPractices": [
    "List of best practice recommendations that aren't vulnerabilities but improve code quality"
  ],
  "auditMetadata": {
    "linesAnalyzed": number,
    "functionsAnalyzed": number,
    "totalFindings": number,
    "criticalCount": number,
    "highCount": number,
    "mediumCount": number,
    "lowCount": number
  }
}

Be thorough. Check for: reentrancy, access control issues, integer overflow/underflow, unchecked external calls, front-running, denial of service, gas optimizations, logic errors, and Solidity best practices. If the contract is clean, still provide informational findings and gas optimizations.`;

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nHere is the Solidity smart contract to audit:\n\n\`\`\`solidity\n${solidityCode}\n\`\`\``
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192
            }
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Gemini] API error:', errorBody);
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Gemini');
    }

    // Parse the JSON from Gemini's response (strip markdown fences if present)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

// --- Verify Payment ---
async function verifyPayment(txHash) {
    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) return { valid: false, reason: 'Transaction not found.' };
        if (receipt.status !== 1) return { valid: false, reason: 'Transaction reverted.' };
        if (CONTRACT_ADDRESS && receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
            return { valid: false, reason: 'Wrong recipient.' };
        }
        const tx = await provider.getTransaction(txHash);
        const requiredWei = ethers.parseEther(SCAN_PRICE_ETH);
        if (tx.value < requiredWei) return { valid: false, reason: 'Insufficient payment.' };
        return { valid: true, payer: receipt.from, amount: ethers.formatEther(tx.value) };
    } catch (err) {
        return { valid: false, reason: err.message };
    }
}

// --- Routes ---

app.get('/api/contract-info', (req, res) => {
    if (!CONTRACT_ADDRESS || !CONTRACT_ABI) {
        return res.status(503).json({ error: 'Contract not deployed.' });
    }
    res.json({
        contractAddress: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        chainId: CHAIN_ID,
        rpc: MONAD_TESTNET_RPC,
        scanPrice: SCAN_PRICE_ETH,
        currency: 'MON'
    });
});

// x402-gated audit endpoint
app.post('/api/scan', async (req, res) => {
    const paymentTx = req.headers['x-payment-tx'];

    if (!paymentTx) {
        return res.status(402).json({
            error: 'Payment Required',
            message: 'x402: Payment required to access AI audit agent.',
            paymentDetails: {
                contractAddress: CONTRACT_ADDRESS,
                amount: SCAN_PRICE_ETH,
                currency: 'MON',
                chainId: CHAIN_ID,
                rpc: MONAD_TESTNET_RPC,
                method: 'payForScan()'
            }
        });
    }

    // Verify payment
    console.log(`[x402] Verifying: ${paymentTx}`);
    const verification = await verifyPayment(paymentTx);

    if (!verification.valid) {
        console.log(`[x402] Rejected: ${verification.reason}`);
        return res.status(402).json({ error: 'Payment failed', reason: verification.reason });
    }

    console.log(`[x402] ✅ Paid by ${verification.payer} (${verification.amount} MON)`);

    // Run the actual Gemini audit
    const { code } = req.body;
    if (!code || code.trim().length === 0) {
        return res.status(400).json({ error: 'No contract code provided.' });
    }

    try {
        console.log(`[Gemini] Starting audit (${code.length} chars)...`);
        const auditReport = await auditWithGemini(code);
        console.log(`[Gemini] ✅ Audit complete: ${auditReport.auditMetadata?.totalFindings || 0} findings`);

        res.json({
            success: true,
            x402: { txHash: paymentTx, payer: verification.payer, amount: verification.amount },
            report: auditReport
        });
    } catch (err) {
        console.error('[Gemini] Audit failed:', err.message);
        res.status(500).json({ error: 'AI audit failed', reason: err.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`\n[BreakupBreakdown] API on http://localhost:${port}`);
        console.log(`[x402] Monad Testnet (${CHAIN_ID}) | Contract: ${CONTRACT_ADDRESS || 'NOT DEPLOYED'}`);
        console.log(`[Gemini] API Key: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing (add GEMINI_API_KEY to .env)'}\n`);
    });
}

export default app;
