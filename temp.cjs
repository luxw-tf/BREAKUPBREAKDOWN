const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

const replacement = `<!-- How It Works Section -->
  <section id="how-it-works" class="parallax-section">
    <div class="parallax-wrapper">
      <div class="parallax-sticky">
        <div class="container parallax-container">
          
          <div class="parallax-header">
            <span class="sticker">Methodology</span>
            <h2>How It Works</h2>
            <p class="card-desc">The complete lifecycle of an agentic attack simulation.</p>
          </div>

          <div class="parallax-content">
            <!-- Left side: Vertical Progress Track -->
            <div class="parallax-track">
              <div class="parallax-progress"></div>
            </div>
            
            <!-- Right side: Stacked Cards -->
            <div class="parallax-cards">
              
              <!-- Step 1 -->
              <div class="parallax-card" data-step="0">
                <div class="step-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <div class="step-num">01</div>
                <h3 class="step-title">Initial Recon</h3>
                <p class="step-desc">Our multi-agent system parses public source code, fetches decompiled bytecode, and extracts ABIs to construct a deterministic map of protocol entry points and dependencies.</p>
              </div>

              <!-- Step 2 -->
              <div class="parallax-card" data-step="1">
                <div class="step-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                <div class="step-num">02</div>
                <h3 class="step-title">Attack Simulation</h3>
                <p class="step-desc">Agents harness combinatorial fuzzing and symbolic execution inside a fully managed fork environment, attempting flash-loan attacks, reentrancy exploits, and logic bypasses.</p>
              </div>

              <!-- Step 3 -->
              <div class="parallax-card" data-step="2">
                <div class="step-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15l2 2 4-4"></path></svg>
                </div>
                <div class="step-num">03</div>
                <h3 class="step-title">Vulnerability Report</h3>
                <p class="step-desc">Generated zero-day findings are compiled into structured read-outs containing exact PoC reproduction steps, call stack traces, and actionable patch recommendations.</p>
              </div>

              <!-- Step 4 -->
              <div class="parallax-card" data-step="3">
                <div class="step-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                </div>
                <div class="step-num">04</div>
                <h3 class="step-title">Continuous Monitoring</h3>
                <p class="step-desc">Post-deployment sentinels connect directly to the mempool, simulating pending transactions against protocol invariants to preemptively alert on emergent attack vectors.</p>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  </section>`;

// Replace carefully using regex
const targetRegex = /<!-- How It Works Section -->[\s\S]*?<\/section>/;
const updatedHtml = html.replace(targetRegex, replacement);

fs.writeFileSync(filePath, updatedHtml, 'utf8');
console.log('HTML replace done.');
