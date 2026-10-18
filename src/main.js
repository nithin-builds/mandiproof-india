import './styles.css'
import { createPublicClient, createWalletClient, ExpirationTime, jsonToPayload } from '@arkiv-network/sdk'
import { tiramisu } from '@arkiv-network/sdk/chains'
import { str, dec, u64 } from '@arkiv-network/sdk/attr'
import { eq } from '@arkiv-network/sdk/query'
import { custom, http } from 'viem'

const PROJECT = 'mandiproof-india-v1'
const EXPLORER = 'https://tiramisu.explorer.arkiv.network'
const publicClient = createPublicClient({ chain: tiramisu, transport: http() })

const seedQuotes = [
  { crop: 'Tomato', variety: 'Local', mandi: 'Kolar APMC', state: 'Karnataka', price: 1850, unit: 'quintal', trend: 8.4, freshness: '22 min', source: 'Illustrative demo' },
  { crop: 'Onion', variety: 'Red', mandi: 'Lasalgaon APMC', state: 'Maharashtra', price: 2420, unit: 'quintal', trend: -2.1, freshness: '41 min', source: 'Illustrative demo' },
  { crop: 'Paddy', variety: 'Common', mandi: 'Nizamabad', state: 'Telangana', price: 2310, unit: 'quintal', trend: 1.7, freshness: '1 hr', source: 'Illustrative demo' },
  { crop: 'Cotton', variety: 'Medium Staple', mandi: 'Rajkot', state: 'Gujarat', price: 7240, unit: 'quintal', trend: 3.2, freshness: '2 hr', source: 'Illustrative demo' },
]

const state = { quotes: seedQuotes, mode: 'demo', wallet: null, loading: false }

function esc(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])) }
function short(v='') { return v ? `${v.slice(0,6)}…${v.slice(-4)}` : '' }
function money(v) { return new Intl.NumberFormat('en-IN').format(Number(v)) }

function quoteCard(q, live=false) {
  const trend = Number(q.trend || 0)
  return `<article class="quote-card ${live ? 'live' : ''}">
    <div class="quote-top"><span class="crop">${esc(q.crop)}</span><span class="verified">${live ? 'ARKIV LIVE' : 'DEMO DATA'}</span></div>
    <p class="variety">${esc(q.variety || 'Standard')} · ${esc(q.mandi)}</p>
    <div class="price-row"><strong>₹${money(q.price)}</strong><span>/ ${esc(q.unit || 'quintal')}</span></div>
    <div class="meta"><span>${esc(q.state)}</span><span class="${trend >= 0 ? 'up' : 'down'}">${trend >= 0 ? '↗' : '↘'} ${Math.abs(trend)}%</span></div>
    <div class="proof"><span>Fresh ${esc(q.freshness || 'on-chain')}</span>${q.arkivEntityKey ? `<a href="${EXPLORER}/entity/${q.arkivEntityKey}" target="_blank" rel="noreferrer">Proof ${short(q.arkivEntityKey)} ↗</a>` : `<span>${esc(q.source)}</span>`}</div>
  </article>`
}

function render() {
  document.querySelector('#app').innerHTML = `
    <header class="nav"><a class="brand" href="#top"><span class="mark">MP</span><span>MandiProof<small>India</small></span></a><nav><a href="#market">Live board</a><a href="#why">Why Arkiv</a><a href="#publish">Publish</a></nav><button class="wallet" id="connect">${state.wallet ? short(state.wallet) : 'Connect wallet'}</button></header>
    <main id="top">
      <section class="hero">
        <div class="eyebrow"><span></span> Built for India · Powered by Arkiv Tiramisu</div>
        <h1>Know the mandi price.<br><em>Verify who posted it.</em></h1>
        <p class="lede">A public crop-price bulletin where every quote carries cryptographic provenance and disappears when it becomes stale—so farmers negotiate with evidence, not forwarded rumours.</p>
        <div class="actions"><a class="primary" href="#market">Explore prices</a><a class="secondary" href="#publish">Publish a quote</a></div>
        <div class="trust"><span><b>₹</b> India-first units</span><span><b>✓</b> Wallet provenance</span><span><b>⌛</b> Automatic expiry</span></div>
        <div class="hero-art" aria-label="Fresh crop price proof illustration"><div class="sun"></div><div class="field f1"></div><div class="field f2"></div><div class="proof-card"><span>VERIFIED QUOTE</span><strong>₹1,850</strong><small>Kolar · Tomato · fresh 22m</small><i>Arkiv Tiramisu ✓</i></div></div>
      </section>

      <section class="board" id="market">
        <div class="section-head"><div><span class="kicker">PUBLIC PRICE BOARD</span><h2>Fresh quotes, with proof attached.</h2></div><button class="refresh" id="refresh">${state.loading ? 'Checking Arkiv…' : 'Refresh Arkiv'}</button></div>
        <div class="notice ${state.mode === 'live' ? 'success' : ''}" id="notice">${state.mode === 'live' ? 'Live entities loaded from Arkiv Tiramisu.' : 'Showing clearly labelled illustrative data until a MandiProof entity is published on Tiramisu.'}</div>
        <div class="filters"><select id="cropFilter"><option value="all">All crops</option>${[...new Set(state.quotes.map(q=>q.crop))].map(x=>`<option>${esc(x)}</option>`).join('')}</select><select id="stateFilter"><option value="all">All states</option>${[...new Set(state.quotes.map(q=>q.state))].map(x=>`<option>${esc(x)}</option>`).join('')}</select><div class="search-wrap"><span>⌕</span><input id="search" placeholder="Search mandi or crop" /></div></div>
        <div class="grid" id="grid">${state.quotes.map(q=>quoteCard(q,state.mode==='live')).join('')}</div>
      </section>

      <section class="story" id="why">
        <div class="story-copy"><span class="kicker">THE INDIA PROBLEM</span><h2>A price screenshot is easy to forward—and impossible to verify.</h2><p>Small farmers and local buyers often make time-sensitive decisions from fragmented WhatsApp messages, calls, and screenshots. Those records have no trustworthy author, no shared query layer, and no automatic end-of-life.</p><div class="impact"><div><strong>01</strong><span>Publisher identity stays tied to the wallet that created the quote.</span></div><div><strong>02</strong><span>Indexed crop, state and mandi attributes make public quotes searchable.</span></div><div><strong>03</strong><span>Expiry removes stale prices from live queries without a central moderator.</span></div></div></div>
        <div class="compare"><div class="before"><span>FORWARDED MESSAGE</span><p>“Tomato ₹2,400 today”</p><small>Who posted it? Which mandi? When?</small><b>Cannot verify</b></div><div class="arrow">→</div><div class="after"><span>MANDIPROOF ENTITY</span><p>Crop · mandi · price · timestamp</p><small>Creator + expiry + entity key</small><b>Verifiable on Tiramisu</b></div></div>
      </section>

      <section class="arkiv"><div><span class="kicker light">WHY ARKIV</span><h2>Freshness is part of the data model—not a cleanup job.</h2></div><div class="arkiv-grid"><article><b>01</b><h3>Query, don’t scrape</h3><p>Typed, indexed attributes let anyone query active quotes by crop, state, mandi, price and publisher.</p></article><article><b>02</b><h3>Provenance by default</h3><p>The immutable creator field proves which wallet published a quote; a copied project label cannot fake authorship.</p></article><article><b>03</b><h3>Stale data expires</h3><p>A quote’s lifetime is encoded at creation. When it expires, it naturally stops appearing in live results.</p></article></div></section>

      <section class="publish" id="publish">
        <div class="form-intro"><span class="kicker">PUBLISH TO TIRAMISU</span><h2>Add a price bulletin in under a minute.</h2><p>Only public market information belongs here. Never publish names, phone numbers, private keys, or personal farmer data.</p><div class="chain"><span></span><div><b>Tiramisu testnet</b><small>Chain 7738577 · test GLM required</small></div></div></div>
        <form id="quoteForm">
          <label>Crop<input name="crop" required placeholder="e.g. Tomato" /></label><label>Variety<input name="variety" required placeholder="e.g. Local" /></label><label class="wide">Mandi / market<input name="mandi" required placeholder="e.g. Kolar APMC" /></label><label>State<select name="state" required><option>Karnataka</option><option>Maharashtra</option><option>Telangana</option><option>Gujarat</option><option>Tamil Nadu</option><option>Andhra Pradesh</option><option>Other</option></select></label><label>Price per quintal<input name="price" required type="number" min="1" step="1" placeholder="1850" /></label><label>Expires in<select name="days"><option value="1">24 hours</option><option value="3">3 days</option><option value="7">7 days</option></select></label><label>Source type<select name="source"><option>APMC noticeboard</option><option>Buyer quote</option><option>Farmer collective</option><option>Public market bulletin</option></select></label><button class="submit wide" type="submit">${state.wallet ? 'Review & publish on Arkiv' : 'Connect wallet to publish'}</button><p class="form-status wide" id="formStatus"></p>
        </form>
      </section>
    </main>
    <footer><div class="brand"><span class="mark">MP</span><span>MandiProof<small>India</small></span></div><p>Open-source prototype for Arkiv Global Tour Stop 2026. No real farmer or personal data.</p><a href="https://docs.arkiv.network" target="_blank" rel="noreferrer">Arkiv docs ↗</a></footer>`
  bind()
}

async function loadArkiv() {
  state.loading = true; render()
  try {
    const result = await publicClient.select({ key:true, creator:true, expiresAt:true, payload:true, attributes:true }).where(eq('project', str(PROJECT)), eq('entity_type', str('price_quote'))).limit(50).fetch()
    const live = result.entities.map(e => ({ ...e.toJson(), arkivEntityKey:e.key, creator:e.creator, freshness:'on-chain' }))
    if (live.length) { state.quotes = live; state.mode = 'live' }
    else { state.quotes = seedQuotes; state.mode = 'demo' }
  } catch (e) { state.quotes = seedQuotes; state.mode = 'demo' }
  state.loading = false; render()
}

async function connectWallet() {
  if (!window.ethereum) { alert('A browser wallet such as MetaMask is required to publish. Browsing remains wallet-free.'); return }
  const [account] = await window.ethereum.request({ method:'eth_requestAccounts' })
  state.wallet = account; render()
}

async function publishQuote(form) {
  const status = document.querySelector('#formStatus')
  if (!state.wallet) { await connectWallet(); return }
  const data = Object.fromEntries(new FormData(form).entries())
  status.textContent = 'Requesting wallet confirmation…'
  try {
    const walletClient = createWalletClient({ chain:tiramisu, transport:custom(window.ethereum), account:state.wallet })
    const payload = { crop:data.crop.trim(), variety:data.variety.trim(), mandi:data.mandi.trim(), state:data.state, price:Number(data.price), unit:'quintal', trend:0, source:data.source, publishedAt:new Date().toISOString() }
    const result = await walletClient.createEntity({ payload:jsonToPayload(payload), contentType:'application/json', attributes:{ project:str(PROJECT), entity_type:str('price_quote'), crop:str(payload.crop.toLowerCase()), state:str(payload.state.toLowerCase()), mandi:str(payload.mandi.toLowerCase()), price_inr:dec(String(payload.price)), posted_at_ms:u64(Date.now()) }, expires:ExpirationTime.fromDays(Number(data.days)), flags:{ readonly:true, permissionlessExtension:false } })
    status.innerHTML = `Published. <a href="${EXPLORER}/entity/${result.entityKey}" target="_blank" rel="noreferrer">Verify entity ${short(result.entityKey)} ↗</a>`
    form.reset(); setTimeout(loadArkiv, 1800)
  } catch (e) { status.textContent = `Not published: ${e.shortMessage || e.message || 'Wallet rejected or network unavailable.'}` }
}

function bind() {
  document.querySelector('#connect').onclick = connectWallet
  document.querySelector('#refresh').onclick = loadArkiv
  document.querySelector('#quoteForm').onsubmit = e => { e.preventDefault(); publishQuote(e.currentTarget) }
  const filter = () => { const c=document.querySelector('#cropFilter').value, s=document.querySelector('#stateFilter').value, q=document.querySelector('#search').value.toLowerCase(); document.querySelector('#grid').innerHTML=state.quotes.filter(x=>(c==='all'||x.crop===c)&&(s==='all'||x.state===s)&&(`${x.crop} ${x.mandi}`.toLowerCase().includes(q))).map(x=>quoteCard(x,state.mode==='live')).join('') || '<p class="empty">No matching active quotes.</p>' }
  document.querySelector('#cropFilter').onchange=filter; document.querySelector('#stateFilter').onchange=filter; document.querySelector('#search').oninput=filter
}

render(); loadArkiv()
