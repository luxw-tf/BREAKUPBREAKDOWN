/**
 * Compile & Deploy BreakupPaymentGateway to Monad Testnet
 * 
 * Usage: 
 *   1. Copy .env.example to .env and add your DEPLOYER_PRIVATE_KEY
 *   2. Ensure account has testnet MON from https://testnet.monad.xyz/
 *   3. Run: node scripts/deploy.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import solc from 'solc';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Monad Testnet Config
const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz/';
const CHAIN_ID = 10143;
const SCAN_PRICE = ethers.parseEther('0.01'); // 0.01 MON per scan

async function main() {
    console.log('\n🔨 BreakupBreakdown — Contract Deployment Script');
    console.log('================================================');
    console.log(`  Network: Monad Testnet (Chain ${CHAIN_ID})`);
    console.log(`  RPC:     ${MONAD_TESTNET_RPC}`);
    console.log(`  Price:   0.01 MON per scan\n`);

    // 1. Read & Compile the Solidity contract
    const contractPath = path.resolve(__dirname, '..', 'contracts', 'BreakupPaymentGateway.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'BreakupPaymentGateway.sol': { content: source }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode']
                }
            },
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    };

    console.log('📄 Compiling BreakupPaymentGateway.sol...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for errors
    if (output.errors) {
        const errors = output.errors.filter(e => e.severity === 'error');
        if (errors.length > 0) {
            console.error('❌ Compilation Errors:');
            errors.forEach(e => console.error(e.formattedMessage));
            process.exit(1);
        }
        // Print warnings
        output.errors.filter(e => e.severity === 'warning').forEach(w => {
            console.warn(`⚠️  ${w.message}`);
        });
    }

    const contractData = output.contracts['BreakupPaymentGateway.sol']['BreakupPaymentGateway'];
    const abi = contractData.abi;
    const bytecode = contractData.evm.bytecode.object;

    // Save ABI for frontend/backend usage
    const artifactDir = path.resolve(__dirname, '..', 'artifacts');
    if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir);
    
    fs.writeFileSync(
        path.join(artifactDir, 'BreakupPaymentGateway.json'),
        JSON.stringify({ abi, bytecode }, null, 2)
    );
    console.log('✅ Compilation successful. ABI saved to artifacts/BreakupPaymentGateway.json\n');

    // 2. Connect to Monad Testnet
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey || privateKey === 'your_private_key_here') {
        console.error('❌ DEPLOYER_PRIVATE_KEY not set in .env file.');
        console.error('   Copy .env.example to .env and add your funded Monad Testnet private key.');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    const balance = await provider.getBalance(wallet.address);
    console.log(`🔑 Deployer: ${wallet.address}`);
    console.log(`💰 Balance:  ${ethers.formatEther(balance)} MON\n`);

    if (balance === 0n) {
        console.error('❌ Deployer has 0 MON. Get testnet tokens from https://testnet.monad.xyz/');
        process.exit(1);
    }

    // 3. Deploy
    console.log('🚀 Deploying BreakupPaymentGateway...');
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(SCAN_PRICE);
    
    console.log(`   Tx Hash: ${contract.deploymentTransaction().hash}`);
    console.log('   Waiting for confirmation...');
    
    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();

    console.log(`\n✅ Contract deployed at: ${deployedAddress}`);
    console.log(`   Explorer: https://testnet.monadexplorer.com/address/${deployedAddress}`);

    // 4. Save deployment info
    const deployInfo = {
        network: 'monad-testnet',
        chainId: CHAIN_ID,
        contractAddress: deployedAddress,
        deployer: wallet.address,
        scanPrice: '0.01',
        currency: 'MON',
        rpc: MONAD_TESTNET_RPC,
        explorer: `https://testnet.monadexplorer.com/address/${deployedAddress}`,
        deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(
        path.join(artifactDir, 'deployment.json'),
        JSON.stringify(deployInfo, null, 2)
    );
    console.log('   Deployment info saved to artifacts/deployment.json\n');
    console.log('🎯 Next steps:');
    console.log('   1. Update backend/server.js CONTRACT_ADDRESS to:', deployedAddress);
    console.log('   2. Start backend: npm run start:server');
    console.log('   3. Start frontend: npm run dev');
}

main().catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
});
