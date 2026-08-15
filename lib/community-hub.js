/**
 * SitePrompter Web - Community Showcase & Template Hub
 * Pre-populated library of world-class website clones, design telemetry & prompt recipes.
 * 
 * Featured Clones:
 * 1. Kick.com (Live Stream Platform)
 * 2. Stripe.com (Payment Infrastructure)
 * 3. Linear.app (Issue Tracking SaaS)
 * 4. MephistoMail (Zero-Knowledge Encrypted Webmail)
 * 5. TailwindUI Marketing Studio (Bento Grid & Conversion Hub)
 * 6. Netflix Streaming Portal (Cinematic Billboard & Browse Trays)
 */

const crypto = require('crypto');

// Optional integration with projects-store
let projectsStore = null;
try {
  projectsStore = require('./projects-store');
} catch (_) {
  // Graceful fallback if projects-store is not available in isolated test environments
}

/**
 * Generate a unique ID with prefix and timestamp
 */
function generateId(prefix = 'tpl') {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Convert string to URL-friendly slug
 */
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Pre-populated Master Community Templates Library
 */
const DEFAULT_COMMUNITY_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. KICK.COM LIVE STREAM PLATFORM
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl_kick_livestream',
    slug: 'kick-live-stream-platform',
    title: 'Kick.com - Next-Gen Live Streaming Platform',
    category: 'Entertainment & Streaming',
    framework: 'react-tailwind',
    featured: true,
    rating: 4.96,
    reviewsCount: 148,
    likes: 642,
    forks: 318,
    tokensEstimate: 6850,
    author: {
      id: 'usr_kick_master',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      badge: 'Streaming Pro',
      verified: true
    },
    demoUrl: 'https://kick.com/darthkubo',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    description: 'High-fps interactive video stream with chat badges, follower counter, dark cyber green neon theme (#53FC18), and streamer control stage.',
    tags: ['Streaming', 'React 19', 'Tailwind', 'Dark Mode', 'Cyber Green', 'Live Chat', 'WebSocket Ready'],
    pages: ['/', '/browse', '/channel/darthkubo', '/following'],
    designTokens: {
      colors: {
        primary: '#53FC18',
        primaryHover: '#45e012',
        background: '#0B0E0F',
        cardBg: '#14171A',
        headerBg: '#191B1F',
        border: '#24272C',
        textPrimary: '#EFF2F5',
        textSecondary: '#94A3B8'
      },
      fonts: ['Inter', 'system-ui', 'sans-serif'],
      radius: '8px'
    },
    promptRecipe: {
      systemPersona: 'Principal React 19 & Tailwind engineer specializing in real-time gaming & video streaming platforms.',
      keyInstructions: [
        'Recreate Kick.com layout with 3:1 stage to live chat ratio.',
        'Implement glowing neon cyber-green accents (#53FC18) on dark obsidian background (#0B0E0F).',
        'Provide stateful chat drawer with VIP, Moderator, and Verified badges, auto-scroll, and chat message sender.',
        'Include stream controls: play/pause toggle, volume slider, viewer counter (14.2k Viewers), resolution source (1080p60), and follow toggle button.',
        'Ensure clean responsive layout with collapsible chat drawer on mobile viewports.'
      ],
      suggestedComponents: ['KickStreamNavbar', 'StreamStagePlayer', 'StreamerInfoBar', 'LiveChatDrawer', 'StreamCategoryTags']
    },
    code: [
      "import React, { useState, useEffect, useRef } from 'react';",
      "import { Play, Pause, Volume2, VolumeX, MessageSquare, Heart, Share2, Users, Shield, Award, Sparkles, Send, Settings, Maximize2, Radio } from 'lucide-react';",
      "",
      "export default function KickStreamApp() {",
      "  const [isPlaying, setIsPlaying] = useState(true);",
      "  const [isMuted, setIsMuted] = useState(false);",
      "  const [isFollowing, setIsFollowing] = useState(false);",
      "  const [followerCount, setFollowerCount] = useState(142850);",
      "  const [likesCount, setLikesCount] = useState(8420);",
      "  const [hasLiked, setHasLiked] = useState(false);",
      "  const [inputVal, setInputVal] = useState('');",
      "  const [messages, setMessages] = useState([",
      "    { id: 1, user: 'ViperX', role: 'mod', text: 'HYPER CLUTCH PogChamp!! What a play!', color: '#53FC18', time: '14:20' },",
      "    { id: 2, user: 'NovaGaming', role: 'vip', text: 'Config settings look absolutely insane today 🔥', color: '#38bdf8', time: '14:21' },",
      "    { id: 3, user: 'PixelKnight', role: 'sub', text: 'Subbed for 6 months streak! Let us get this world record!', color: '#a855f7', time: '14:21' },",
      "    { id: 4, user: 'CyberWolf', role: 'viewer', text: 'Does anyone know his mouse DPI settings?', color: '#f59e0b', time: '14:22' },",
      "    { id: 5, user: 'GhostRider', role: 'vip', text: '1080p60 stream is buttery smooth tonight 🚀', color: '#ec4899', time: '14:22' }",
      "  ]);",
      "",
      "  const chatEndRef = useRef(null);",
      "  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);",
      "",
      "  const sendMsg = (e) => {",
      "    e.preventDefault();",
      "    if (!inputVal.trim()) return;",
      "    const newMsg = {",
      "      id: Date.now(),",
      "      user: 'You',",
      "      role: 'sub',",
      "      text: inputVal.trim(),",
      "      color: '#53FC18',",
      "      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })",
      "    };",
      "    setMessages(prev => [...prev, newMsg]);",
      "    setInputVal('');",
      "  };",
      "",
      "  const toggleFollow = () => {",
      "    setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);",
      "    setIsFollowing(!isFollowing);",
      "  };",
      "",
      "  const toggleLike = () => {",
      "    setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);",
      "    setHasLiked(!hasLiked);",
      "  };",
      "",
      "  return (",
      "    <div className=\"min-h-screen bg-[#0B0E0F] text-[#EFF2F5] font-sans antialiased flex flex-col selection:bg-[#53FC18] selection:text-black\">",
      "      {/* Top Navigation */}",
      "      <header className=\"h-14 bg-[#191B1F] border-b border-[#24272C] px-4 flex items-center justify-between sticky top-0 z-50 shadow-md\">",
      "        <div className=\"flex items-center gap-6\">",
      "          <div className=\"flex items-center gap-3 cursor-pointer\">",
      "            <span className=\"bg-[#53FC18] text-black font-black text-xl px-2.5 py-0.5 rounded tracking-tighter shadow-sm hover:scale-105 transition-transform\">KICK</span>",
      "            <span className=\"text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#53FC18]/10 text-[#53FC18] border border-[#53FC18]/30 flex items-center gap-1.5 animate-pulse\">",
      "              <span className=\"w-2 h-2 rounded-full bg-[#53FC18]\"></span> LIVE",
      "            </span>",
      "          </div>",
      "          <nav className=\"hidden md:flex items-center gap-5 text-sm font-semibold text-gray-300\">",
      "            <a href=\"#browse\" className=\"hover:text-[#53FC18] transition-colors\">Browse</a>",
      "            <a href=\"#following\" className=\"hover:text-[#53FC18] transition-colors\">Following</a>",
      "            <a href=\"#categories\" className=\"hover:text-[#53FC18] transition-colors\">Categories</a>",
      "          </nav>",
      "        </div>",
      "        <div className=\"flex items-center gap-3\">",
      "          <div className=\"hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#121417] border border-[#282C34] rounded-lg text-xs text-gray-400\">",
      "            <Radio className=\"w-3.5 h-3.5 text-[#53FC18] animate-spin\" />",
      "            <span>14,280 Viewers</span>",
      "          </div>",
      "          <button",
      "            onClick={toggleFollow}",
      "            className={\"px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm \" + (isFollowing ? \"bg-[#24272C] text-white hover:bg-[#2e333b]\" : \"bg-[#53FC18] text-black hover:bg-[#45e012] hover:shadow-[#53FC18]/20 hover:shadow-lg\")}",
      "          >",
      "            {isFollowing ? '✓ Following' : '+ Follow'}",
      "          </button>",
      "        </div>",
      "      </header>",
      "",
      "      {/* Main Studio Grid */}",
      "      <div className=\"flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden\">",
      "        {/* Stream Stage Player */}",
      "        <div className=\"lg:col-span-3 bg-black flex flex-col\">",
      "          <div className=\"relative aspect-video w-full bg-[#121417] flex items-center justify-center overflow-hidden group\">",
      "            <div className=\"absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none\"></div>",
      "            <div className=\"text-center z-10 p-6\">",
      "              <div",
      "                onClick={() => setIsPlaying(!isPlaying)}",
      "                className=\"w-20 h-20 rounded-full bg-[#53FC18]/20 border-2 border-[#53FC18] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform cursor-pointer shadow-lg shadow-[#53FC18]/20\"",
      "              >",
      "                {isPlaying ? <Pause className=\"w-8 h-8 text-[#53FC18] fill-[#53FC18]\" /> : <Play className=\"w-8 h-8 text-[#53FC18] fill-[#53FC18] ml-1\" />}",
      "              </div>",
      "              <p className=\"text-xl font-bold text-white tracking-wide\">DarthKubo • 100 Days Hardcore Survival World Record</p>",
      "              <p className=\"text-xs text-gray-400 mt-1 flex items-center justify-center gap-3\">",
      "                <span className=\"flex items-center gap-1 text-[#53FC18]\"><Users className=\"w-3.5 h-3.5\" /> 14,280 Watching</span>",
      "                <span>•</span>",
      "                <span className=\"text-gray-300\">1080p60 HD Source</span>",
      "              </p>",
      "            </div>",
      "          </div>",
      "          {/* Streamer Info Bar */}",
      "          <div className=\"p-4 bg-[#14171A] border-b border-[#24272C] flex flex-wrap items-center justify-between gap-4\">",
      "            <div className=\"flex items-center gap-3.5\">",
      "              <div className=\"w-12 h-12 rounded-full ring-2 ring-[#53FC18] bg-gray-800 flex items-center justify-center font-black text-lg text-white\">DK</div>",
      "              <div>",
      "                <h2 className=\"font-bold text-base text-white flex items-center gap-1.5\">",
      "                  DarthKubo <Shield className=\"w-4 h-4 text-[#53FC18] fill-[#53FC18]/20\" />",
      "                </h2>",
      "                <p className=\"text-xs text-gray-400\">Minecraft • Hardcore Speedrun World Record Attempt #42</p>",
      "                <div className=\"flex items-center gap-2 mt-1\">",
      "                  <span className=\"text-[11px] px-2 py-0.5 rounded bg-[#24272C] text-gray-300 font-medium\">English</span>",
      "                  <span className=\"text-[11px] px-2 py-0.5 rounded bg-[#24272C] text-[#53FC18] font-medium\">Speedrun</span>",
      "                  <span className=\"text-[11px] text-gray-400\">{followerCount.toLocaleString()} followers</span>",
      "                </div>",
      "              </div>",
      "            </div>",
      "            <div className=\"flex items-center gap-2.5\">",
      "              <button",
      "                onClick={toggleLike}",
      "                className={\"flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all \" + (hasLiked ? \"bg-rose-500/20 text-rose-400 border-rose-500/40\" : \"bg-[#1F2228] text-gray-300 border-[#2E333C] hover:bg-[#282C34]\")}",
      "              >",
      "                <Heart className={\"w-3.5 h-3.5 \" + (hasLiked ? \"fill-rose-500 text-rose-500\" : \"text-rose-400\")} />",
      "                <span>{likesCount.toLocaleString()}</span>",
      "              </button>",
      "              <button className=\"flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F2228] hover:bg-[#282C34] text-gray-300 border border-[#2E333C] rounded-lg text-xs font-semibold\">",
      "                <Share2 className=\"w-3.5 h-3.5 text-sky-400\" /> Share",
      "              </button>",
      "            </div>",
      "          </div>",
      "        </div>",
      "        {/* Live Chat Drawer */}",
      "        <div className=\"lg:col-span-1 bg-[#14171A] border-l border-[#24272C] flex flex-col h-[calc(100vh-3.5rem)]\">",
      "          <div className=\"h-12 px-4 border-b border-[#24272C] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 bg-[#171A1E]\">",
      "            <span className=\"flex items-center gap-2 text-gray-200\"><MessageSquare className=\"w-4 h-4 text-[#53FC18]\" /> Stream Chat</span>",
      "            <span className=\"text-[#53FC18] text-[11px] font-bold\">Live Feed</span>",
      "          </div>",
      "          <div className=\"flex-1 p-3 overflow-y-auto space-y-2.5 text-xs font-medium\">",
      "            {messages.map(m => (",
      "              <div key={m.id} className=\"p-2 rounded-lg bg-[#191C20]/70 hover:bg-[#1F2328] transition-colors border border-transparent hover:border-[#282C34]\">",
      "                <div className=\"flex items-center gap-1.5 mb-1\">",
      "                  {m.role === 'mod' && <span className=\"px-1.5 py-0.5 rounded bg-[#53FC18]/20 text-[#53FC18] text-[10px] font-bold\">MOD</span>}",
      "                  {m.role === 'vip' && <span className=\"px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold\">VIP</span>}",
      "                  {m.role === 'sub' && <span className=\"px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold\">SUB</span>}",
      "                  <span className=\"font-bold cursor-pointer hover:underline\" style={{ color: m.color }}>{m.user}</span>",
      "                  <span className=\"text-[10px] text-gray-500 ml-auto\">{m.time}</span>",
      "                </div>",
      "                <p className=\"text-gray-200 leading-relaxed pl-1\">{m.text}</p>",
      "              </div>",
      "            ))}",
      "            <div ref={chatEndRef} />",
      "          </div>",
      "          <form onSubmit={sendMsg} className=\"p-3 border-t border-[#24272C] bg-[#101214]\">",
      "            <div className=\"flex items-center gap-2\">",
      "              <input",
      "                type=\"text\"",
      "                value={inputVal}",
      "                onChange={e => setInputVal(e.target.value)}",
      "                placeholder=\"Send a message in chat...\"",
      "                className=\"flex-1 bg-[#1A1D21] border border-[#2D3138] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#53FC18] transition-colors\"",
      "              />",
      "              <button type=\"submit\" className=\"px-3.5 py-2 bg-[#53FC18] text-black font-bold text-xs rounded-lg hover:bg-[#45e012] transition-colors\">",
      "                <Send className=\"w-3.5 h-3.5\" />",
      "              </button>",
      "            </div>",
      "          </form>",
      "        </div>",
      "      </div>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. STRIPE.COM PAYMENT INFRASTRUCTURE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl_stripe_payments',
    slug: 'stripe-financial-infrastructure',
    title: 'Stripe.com - Global Financial Infrastructure & Payments',
    category: 'Fintech & SaaS',
    framework: 'react-tailwind',
    featured: true,
    rating: 4.98,
    reviewsCount: 230,
    likes: 915,
    forks: 482,
    tokensEstimate: 7200,
    author: {
      id: 'usr_fintech_design',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      badge: 'Fintech Architect',
      verified: true
    },
    demoUrl: 'https://stripe.com',
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra-modern financial infrastructure landing page featuring glowing multi-color mesh gradients, interactive globe visual, tiered pricing cards with monthly/annual toggle, and enterprise compliance badges.',
    tags: ['Fintech', 'SaaS', 'Mesh Gradients', 'Pricing Cards', 'Enterprise', 'Interactive Globe', 'Tailwind'],
    pages: ['/', '/payments', '/pricing', '/enterprise', '/docs'],
    designTokens: {
      colors: {
        primary: '#6366F1',
        secondary: '#EC4899',
        accent: '#8B5CF6',
        background: '#0F172A',
        surface: '#1E293B',
        meshGradient: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
        border: 'rgba(255, 255, 255, 0.1)'
      },
      fonts: ['Inter', 'system-ui', 'sans-serif'],
      radius: '16px'
    },
    promptRecipe: {
      systemPersona: 'Lead Design Systems Engineer & Fintech Frontend Architect specializing in Stripe-grade landing experiences.',
      keyInstructions: [
        'Recreate Stripe-inspired glowing multi-color mesh gradient hero with animated radial lighting.',
        'Build interactive interactive globe/radar telemetry visual with global payment node metrics.',
        'Implement dynamic pricing calculator with annual/monthly switch and enterprise SLA cards.',
        'Provide multi-language code switcher (cURL, Node.js, Python, Go) for payment intent creation.',
        'Include enterprise compliance trust marks (PCI DSS Level 1, SOC2 Type II, 99.999% uptime).'
      ],
      suggestedComponents: ['MeshGradientHero', 'GlobalNetworkStats', 'PaymentCodeSnippet', 'TieredPricingCards', 'ComplianceTrustBar']
    },
    code: [
      "import React, { useState } from 'react';",
      "import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Code2, Copy, Check } from 'lucide-react';",
      "",
      "export default function StripeInfrastructure() {",
      "  const [billingAnnual, setBillingAnnual] = useState(true);",
      "  const [activeCodeTab, setActiveCodeTab] = useState('node');",
      "  const [copied, setCopied] = useState(false);",
      "",
      "  const codeSnippets = {",
      "    node: \"import Stripe from 'stripe';\\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY);\\nconst paymentIntent = await stripe.paymentIntents.create({\\n  amount: 2000,\\n  currency: 'usd',\\n  automatic_payment_methods: { enabled: true },\\n});\",",
      "    curl: \"curl https://api.stripe.com/v1/payment_intents \\\\\\n  -u $STRIPE_SECRET_KEY: \\\\\\n  -d amount=2000 \\\\\\n  -d currency=usd \\\\\\n  -d \\\"automatic_payment_methods[enabled]\\\"=true\",",
      "    python: \"import stripe\\nstripe.api_key = os.environ.get('STRIPE_SECRET_KEY')\\nintent = stripe.PaymentIntent.create(\\n  amount=2000,\\n  currency='usd',\\n  automatic_payment_methods={'enabled': True},\\n)\"",
      "  };",
      "",
      "  const copyCode = () => {",
      "    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);",
      "    setCopied(true);",
      "    setTimeout(() => setCopied(false), 2000);",
      "  };",
      "",
      "  return (",
      "    <div className=\"min-h-screen bg-[#0F172A] text-slate-100 font-sans antialiased overflow-x-hidden\">",
      "      <header className=\"border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 bg-[#0F172A]/80\">",
      "        <div className=\"max-w-7xl mx-auto px-6 h-16 flex items-center justify-between\">",
      "          <div className=\"flex items-center gap-8\">",
      "            <span className=\"text-2xl font-black tracking-tight text-white flex items-center gap-1.5\">",
      "              <span className=\"w-4 h-4 rounded bg-gradient-to-tr from-indigo-500 to-pink-500 inline-block\"></span> Stripe",
      "            </span>",
      "          </div>",
      "        </div>",
      "      </header>",
      "      <section className=\"max-w-7xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center\">",
      "        <div>",
      "          <div className=\"inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6\">",
      "            <Zap className=\"w-3.5 h-3.5\" /> Next-Gen Financial Infrastructure",
      "          </div>",
      "          <h1 className=\"text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]\">",
      "            Financial infrastructure <br />",
      "            <span className=\"bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent\">for the internet</span>",
      "          </h1>",
      "          <p className=\"mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl\">",
      "            Millions of companies use Stripe software and APIs to accept payments and manage businesses online.",
      "          </p>",
      "        </div>",
      "        <div className=\"bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl\">",
      "          <div className=\"flex items-center justify-between border-b border-slate-800 pb-3 mb-4\">",
      "            <div className=\"flex items-center gap-2\">",
      "              {['node', 'curl', 'python'].map(tab => (",
      "                <button",
      "                  key={tab}",
      "                  onClick={() => setActiveCodeTab(tab)}",
      "                  className={\"px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors \" + (activeCodeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white')}",
      "                >",
      "                  {tab.toUpperCase()}",
      "                </button>",
      "              ))}",
      "            </div>",
      "            <button onClick={copyCode} className=\"text-slate-400 hover:text-white text-xs flex items-center gap-1\">",
      "              {copied ? <Check className=\"w-3.5 h-3.5 text-emerald-400\" /> : <Copy className=\"w-3.5 h-3.5\" />}",
      "              {copied ? 'Copied' : 'Copy'}",
      "            </button>",
      "          </div>",
      "          <pre className=\"text-xs font-mono text-indigo-200 bg-slate-950/70 p-4 rounded-xl overflow-x-auto leading-relaxed border border-slate-800/50\">",
      "            <code>{codeSnippets[activeCodeTab]}</code>",
      "          </pre>",
      "        </div>",
      "      </section>",
      "      <section className=\"bg-slate-900/50 border-y border-slate-800/80 py-16\">",
      "        <div className=\"max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center\">",
      "          <div><div className=\"text-3xl sm:text-4xl font-black text-white font-mono\">99.999%</div><p className=\"text-xs text-slate-400 mt-1\">Uptime SLA</p></div>",
      "          <div><div className=\"text-3xl sm:text-4xl font-black text-indigo-400 font-mono\">250M+</div><p className=\"text-xs text-slate-400 mt-1\">Daily API Requests</p></div>",
      "          <div><div className=\"text-3xl sm:text-4xl font-black text-pink-400 font-mono\">135+</div><p className=\"text-xs text-slate-400 mt-1\">Currencies</p></div>",
      "          <div><div className=\"text-3xl sm:text-4xl font-black text-emerald-400 font-mono\">47+</div><p className=\"text-xs text-slate-400 mt-1\">Countries</p></div>",
      "        </div>",
      "      </section>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. LINEAR.APP ISSUE TRACKING SAAS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl_linear_tracker',
    slug: 'linear-issue-tracking-interface',
    title: 'Linear.app - Streamlined Issue & Project Tracker',
    category: 'Productivity & Developer Tools',
    framework: 'react-tailwind',
    featured: true,
    rating: 4.97,
    reviewsCount: 185,
    likes: 780,
    forks: 395,
    tokensEstimate: 5800,
    author: {
      id: 'usr_linear_craft',
      name: 'Julian Hayes',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      badge: 'Productivity Hacker',
      verified: true
    },
    demoUrl: 'https://linear.app',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    description: 'Hyperspeed dark glassmorphism project management workspace featuring instant keyboard shortcuts (Cmd+K command palette, C for create), cycle tracking progress gauges, and real-time kanban issue board.',
    tags: ['Productivity', 'Dark Mode', 'Glassmorphism', 'Keyboard Shortcuts', 'Command Palette', 'Kanban', 'React 19'],
    pages: ['/', '/inbox', '/cycles', '/roadmap', '/settings'],
    designTokens: {
      colors: {
        background: '#08090A',
        sidebar: '#0E1012',
        cardBg: '#131518',
        border: '#1F2228',
        accent: '#5E6AD2',
        accentLight: '#7A84E8',
        urgent: '#F87171',
        high: '#FB923C',
        medium: '#FBBF24',
        low: '#60A5FA'
      },
      fonts: ['Inter', 'system-ui'],
      radius: '8px'
    },
    promptRecipe: {
      systemPersona: 'Expert UI engineer with a passion for ultra-fast, keyboard-first desktop-class web applications like Linear and Raycast.',
      keyInstructions: [
        'Build dark glassmorphic UI (#08090A) with subtle borders (#1F2228) and indigo accents (#5E6AD2).',
        'Implement interactive Cmd+K Command Palette with fuzzy search and instant shortcut triggers.',
        'Provide sprint cycle progress gauge (Cycle 42: 84% Complete) with burndown indicators.',
        'Include issue board columns (Todo, In Progress, Review, Done) with priority tags, avatars, and inline status modification.',
        'Add keyboard shortcut tooltips and quick action hotkeys.'
      ],
      suggestedComponents: ['CommandPaletteModal', 'LinearSidebar', 'CycleProgressHeader', 'KanbanIssueBoard', 'IssueCardItem']
    },
    code: [
      "import React, { useState, useEffect } from 'react';",
      "import { Search, Plus, Filter, Layers } from 'lucide-react';",
      "",
      "export default function LinearApp() {",
      "  const [commandOpen, setCommandOpen] = useState(false);",
      "  const [activeTab, setActiveTab] = useState('all');",
      "  const [searchQuery, setSearchQuery] = useState('');",
      "  const [issues, setIssues] = useState([",
      "    { id: 'LIN-104', title: 'Implement zero-copy CSS token parser', status: 'in_progress', priority: 'urgent', assignee: 'Alex', cycle: 'Cycle 42' },",
      "    { id: 'LIN-105', title: 'Add Raycast-style command menu fuzzy search', status: 'in_progress', priority: 'high', assignee: 'Elena', cycle: 'Cycle 42' },",
      "    { id: 'LIN-106', title: 'Refactor WebSocket reconnection backoff curve', status: 'todo', priority: 'medium', assignee: 'Marcus', cycle: 'Cycle 42' },",
      "    { id: 'LIN-107', title: 'Optimize Next.js 15 App Router code packager', status: 'done', priority: 'high', assignee: 'Alex', cycle: 'Cycle 42' }",
      "  ]);",
      "",
      "  return (",
      "    <div className=\"min-h-screen bg-[#08090A] text-[#D0D6E0] font-sans antialiased flex flex-col\">",
      "      <header className=\"h-12 bg-[#0E1012] border-b border-[#1F2228] px-4 flex items-center justify-between sticky top-0 z-30\">",
      "        <div className=\"flex items-center gap-4\">",
      "          <div className=\"flex items-center gap-2 font-bold text-white text-sm\">",
      "            <span className=\"w-5 h-5 rounded bg-[#5E6AD2] flex items-center justify-center text-[10px] text-white font-black\">L</span>",
      "            Sprint 42 (84% Complete)",
      "          </div>",
      "        </div>",
      "        <div className=\"flex items-center gap-3\">",
      "          <button onClick={() => setCommandOpen(true)} className=\"flex items-center gap-2 px-3 py-1 bg-[#131518] border border-[#242830] rounded-md text-xs text-gray-400\">",
      "            <Search className=\"w-3 h-3\" /> <span>Search or jump to...</span> <kbd className=\"px-1 bg-[#1F2228] text-[10px]\">⌘K</kbd>",
      "          </button>",
      "        </div>",
      "      </header>",
      "      <div className=\"flex-1 flex overflow-hidden\">",
      "        <main className=\"flex-1 bg-[#08090A] p-6 overflow-y-auto max-w-4xl mx-auto space-y-3\">",
      "          {issues.map(issue => (",
      "            <div key={issue.id} className=\"p-3.5 rounded-lg bg-[#131518] border border-[#1F2228] flex items-center justify-between\">",
      "              <span className=\"text-xs font-mono text-gray-500\">{issue.id}</span>",
      "              <span className=\"text-sm font-semibold text-gray-200 flex-1 ml-4\">{issue.title}</span>",
      "              <span className=\"text-[10px] font-bold px-2 py-0.5 rounded uppercase text-indigo-400 bg-indigo-500/10\">{issue.priority}</span>",
      "            </div>",
      "          ))}",
      "        </main>",
      "      </div>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. MEPHISTOMAIL ZERO-KNOWLEDGE ENCRYPTED EMAIL
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl_mephisto_mail',
    slug: 'mephisto-encrypted-email',
    title: 'MephistoMail - Zero-Knowledge Encrypted Webmail',
    category: 'Security & Privacy',
    framework: 'react-tailwind',
    featured: true,
    rating: 4.95,
    reviewsCount: 112,
    likes: 540,
    forks: 215,
    tokensEstimate: 6100,
    author: {
      id: 'usr_cipher_sec',
      name: 'Dmitri Voronin',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      badge: 'Security Lead',
      verified: true
    },
    demoUrl: 'https://mephistomail.io',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    description: 'Military-grade zero-knowledge encrypted webmail interface featuring split-pane thread viewer, PGP signature verification badges, tag pills, ephemeral self-destruct timers, and modal compose client.',
    tags: ['Security', 'Encrypted Email', 'Zero-Knowledge', 'Webmail', 'PGP', 'Privacy', 'Compose Modal'],
    pages: ['/inbox', '/sent', '/vault', '/keys', '/settings'],
    designTokens: {
      colors: {
        background: '#0B0D13',
        sidebar: '#11141C',
        pane: '#161A24',
        accent: '#06B6D4',
        accentGlow: 'rgba(6, 182, 212, 0.25)',
        border: '#232938',
        textMuted: '#8492A6'
      },
      fonts: ['JetBrains Mono', 'Inter', 'monospace'],
      radius: '10px'
    },
    promptRecipe: {
      systemPersona: 'Senior Cryptographic Security & UI Engineer specializing in zero-knowledge client-side encrypted applications.',
      keyInstructions: [
        'Recreate zero-knowledge encrypted email client layout with dual-pane inbox and message viewer.',
        'Implement PGP cryptographic verification badge (RSA-4096 / Curve25519 Validated).',
        'Add interactive compose modal with self-destruct timer (1h, 24h, 7d) and password encapsulation.',
        'Provide folder switcher (Inbox, Sent, Encrypted Vault, Burned) and unread message indicators.',
        'Use high-tech dark theme with cyan security accents (#06B6D4) and JetBrains Mono monospace elements.'
      ],
      suggestedComponents: ['CryptoStatusBar', 'EncryptedThreadList', 'PGPMessageViewer', 'SecureComposeModal', 'KeyManagerDrawer']
    },
    code: [
      "import React, { useState } from 'react';",
      "import { ShieldCheck, Lock, Send, Clock } from 'lucide-react';",
      "",
      "export default function MephistoMailApp() {",
      "  const [activeFolder, setActiveFolder] = useState('inbox');",
      "  const [composeOpen, setComposeOpen] = useState(false);",
      "  const [emails, setEmails] = useState([",
      "    { id: 1, sender: 'satoshi@cipher.sec', subject: 'Curve25519 Keys', body: 'The zero-knowledge consensus nodes have been updated.' }",
      "  ]);",
      "",
      "  return (",
      "    <div className=\"min-h-screen bg-[#0B0D13] text-gray-200 font-sans flex flex-col\">",
      "      <header className=\"h-12 bg-[#11141C] border-b border-[#232938] px-4 flex items-center justify-between\">",
      "        <div className=\"flex items-center gap-2\">",
      "          <Lock className=\"w-4 h-4 text-cyan-400\" />",
      "          <span className=\"font-bold text-white text-sm font-mono\">MephistoMail</span>",
      "          <span className=\"text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1\">",
      "            <ShieldCheck className=\"w-3 h-3\" /> ZERO-KNOWLEDGE E2EE ACTIVE",
      "          </span>",
      "        </div>",
      "        <button onClick={() => setComposeOpen(true)} className=\"px-3 py-1 rounded bg-cyan-500 text-black text-xs font-bold\">",
      "          Encrypted Compose",
      "        </button>",
      "      </header>",
      "      <div className=\"p-6 max-w-2xl mx-auto\">",
      "        <div className=\"p-4 bg-[#161A24] rounded-xl border border-[#232938]\">",
      "          <h3 className=\"text-sm font-bold text-white\">{emails[0].subject}</h3>",
      "          <p className=\"text-xs text-gray-400 font-mono mt-2\">{emails[0].body}</p>",
      "        </div>",
      "      </div>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. TAILWINDUI MARKETING STUDIO
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl_tailwind_marketing',
    slug: 'tailwindui-marketing-studio',
    title: 'TailwindUI Marketing Studio - Conversion-Optimized Landing Page',
    category: 'Marketing & Landing Pages',
    framework: 'react-tailwind',
    featured: true,
    rating: 4.99,
    reviewsCount: 310,
    likes: 1240,
    forks: 670,
    tokensEstimate: 7400,
    author: {
      id: 'usr_marketing_craft',
      name: 'Sophia Bennett',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      badge: 'Growth Specialist',
      verified: true
    },
    demoUrl: 'https://tailwindui.com',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    description: 'High-conversion modern SaaS marketing page featuring an animated headline hero, multi-dimensional Bento grid showcase, auto-advancing testimonials carousel, and interactive accordion FAQ.',
    tags: ['Marketing', 'Bento Grid', 'Tailwind CSS', 'Hero Section', 'Testimonials Carousel', 'FAQ Accordion', 'Conversion'],
    pages: ['/', '/features', '/pricing', '/testimonials', '/faq'],
    designTokens: {
      colors: {
        primary: '#3B82F6',
        primaryDark: '#1D4ED8',
        background: '#0F172A',
        surface: '#1E293B',
        card: '#1E293B/70',
        border: 'rgba(255, 255, 255, 0.08)'
      },
      fonts: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      radius: '20px'
    },
    promptRecipe: {
      systemPersona: 'Principal Conversion Rate Optimization (CRO) & Marketing UI Engineer.',
      keyInstructions: [
        'Recreate high-impact marketing landing page with Bento Grid feature layout.',
        'Implement dynamic testimonials slider with auto-advance and rating indicators.',
        'Provide responsive FAQ accordion with animated height toggling and keyboard focus.',
        'Include social proof customer statistics and high-visibility dual CTA elements.',
        'Ensure full mobile responsiveness across all devices.'
      ],
      suggestedComponents: ['MarketingHeroSection', 'BentoFeaturesGrid', 'TestimonialsCarousel', 'FaqAccordionSection', 'CallToActionBanner']
    },
    code: [
      "import React, { useState } from 'react';",
      "import { ArrowRight, Star, ChevronDown, Sparkles } from 'lucide-react';",
      "",
      "export default function MarketingStudioApp() {",
      "  const [activeFaq, setActiveFaq] = useState(null);",
      "  return (",
      "    <div className=\"min-h-screen bg-[#0F172A] text-slate-100 font-sans\">",
      "      <section className=\"max-w-6xl mx-auto px-6 pt-20 text-center\">",
      "        <h1 className=\"text-5xl font-black text-white\">Marketing Bento Grid & FAQ</h1>",
      "      </section>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. NETFLIX STREAMING PORTAL
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl_netflix_portal',
    slug: 'netflix-streaming-portal',
    title: 'Netflix Streaming Portal - Cinema Experience & Browse Hub',
    category: 'Entertainment & Streaming',
    framework: 'react-tailwind',
    featured: true,
    rating: 4.97,
    reviewsCount: 264,
    likes: 1080,
    forks: 530,
    tokensEstimate: 7100,
    author: {
      id: 'usr_cinema_lead',
      name: 'Kaito Tanaka',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      badge: 'Streaming Architect',
      verified: true
    },
    demoUrl: 'https://netflix.com',
    thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
    description: 'Immersive cinematic streaming interface featuring full-bleed auto-playing billboard preview, multi-genre horizontal scrolling carousel trays, detail modal with trailer preview and episode selector, and top navigation.',
    tags: ['Netflix', 'Streaming', 'Video Billboard', 'Carousel Trays', 'Movie Modal', 'Dark Red Theme', 'React 19'],
    pages: ['/browse', '/tv-shows', '/movies', '/new-and-popular', '/my-list'],
    designTokens: {
      colors: {
        primary: '#E50914',
        primaryHover: '#f40612',
        background: '#141414',
        card: '#181818',
        border: 'rgba(255,255,255,0.1)'
      },
      fonts: ['Netflix Sans', 'Helvetica Neue', 'sans-serif'],
      radius: '6px'
    },
    promptRecipe: {
      systemPersona: 'Principal Netflix/VOD Architect specializing in cinema-grade media streaming interfaces.',
      keyInstructions: [
        'Recreate cinematic streaming portal with full-bleed video billboard hero overlay.',
        'Implement multiple category trays (Trending Now, Cyberpunk Sci-Fi, Top 10) with horizontal card scrolling.',
        'Provide movie details modal with match %, maturity rating (18+), duration, audio tags (Dolby Atmos, 4K HDR), and episode selector.',
        'Include sticky navigation bar that transitions from transparent to solid black on scroll.',
        'Add hover state previews and quick action buttons (Play, Add to List, Thumbs Up).'
      ],
      suggestedComponents: ['BillboardHeroPreview', 'MovieCarouselTray', 'MovieDetailsModal', 'EpisodeListSelector', 'CinemaNavbar']
    },
    code: [
      "import React, { useState } from 'react';",
      "import { Play, Info, Plus, Check } from 'lucide-react';",
      "",
      "export default function NetflixPortalApp() {",
      "  const [selectedMovie, setSelectedMovie] = useState(null);",
      "  return (",
      "    <div className=\"min-h-screen bg-[#141414] text-white font-sans\">",
      "      <header className=\"h-16 px-8 flex items-center justify-between\">",
      "        <span className=\"text-[#E50914] text-2xl font-black\">NETFLIX</span>",
      "      </header>",
      "      <div className=\"p-8\"><h2 className=\"text-xl font-bold\">Trending Now Billboard</h2></div>",
      "    </div>",
      "  );",
      "}"
    ].join('\n'),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

/**
 * Community Hub State & Persistence Handler
 */
let communityTemplates = JSON.parse(JSON.stringify(DEFAULT_COMMUNITY_TEMPLATES));

/**
 * Get list of community templates with filtering, search and sorting
 * 
 * @param {Object|string} filter - Filter options (category, framework, tag, author, featured) or category string
 * @param {string} search - Search query string
 * @returns {Array} List of matching template objects
 */
function getCommunityTemplates(filter = {}, search = '') {
  let filterObj = {};
  if (typeof filter === 'string') {
    filterObj = { category: filter };
  } else if (filter && typeof filter === 'object') {
    filterObj = { ...filter };
  }

  const searchQuery = String(search || filterObj.search || '').trim().toLowerCase();
  const categoryFilter = filterObj.category ? String(filterObj.category).toLowerCase() : null;
  const frameworkFilter = filterObj.framework ? String(filterObj.framework).toLowerCase() : null;
  const tagFilter = filterObj.tag ? String(filterObj.tag).toLowerCase() : null;
  const featuredOnly = filterObj.featured !== undefined ? Boolean(filterObj.featured) : null;
  const authorFilter = filterObj.authorId ? String(filterObj.authorId) : null;
  const minRating = typeof filterObj.minRating === 'number' ? filterObj.minRating : null;
  const sort = filterObj.sort || 'popular';

  let results = communityTemplates.filter(tpl => {
    // Search query match (title, description, tags, slug, author name)
    if (searchQuery) {
      const matchTitle = tpl.title.toLowerCase().includes(searchQuery);
      const matchDesc = (tpl.description || '').toLowerCase().includes(searchQuery);
      const matchTags = (tpl.tags || []).some(t => t.toLowerCase().includes(searchQuery));
      const matchSlug = (tpl.slug || '').toLowerCase().includes(searchQuery);
      const matchAuthor = (tpl.author?.name || '').toLowerCase().includes(searchQuery);
      const matchCat = (tpl.category || '').toLowerCase().includes(searchQuery);
      const matchFw = (tpl.framework || '').toLowerCase().includes(searchQuery);

      if (!matchTitle && !matchDesc && !matchTags && !matchSlug && !matchAuthor && !matchCat && !matchFw) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      if (!tpl.category.toLowerCase().includes(categoryFilter)) {
        return false;
      }
    }

    // Framework filter
    if (frameworkFilter && frameworkFilter !== 'all') {
      if (tpl.framework.toLowerCase() !== frameworkFilter) {
        return false;
      }
    }

    // Tag filter
    if (tagFilter) {
      const hasTag = (tpl.tags || []).some(t => t.toLowerCase() === tagFilter);
      if (!hasTag) return false;
    }

    // Featured only
    if (featuredOnly !== null && tpl.featured !== featuredOnly) {
      return false;
    }

    // Author filter
    if (authorFilter && tpl.author?.id !== authorFilter) {
      return false;
    }

    // Min rating
    if (minRating !== null && (tpl.rating || 0) < minRating) {
      return false;
    }

    return true;
  });

  // Sorting
  results.sort((a, b) => {
    if (sort === 'likes') {
      return (b.likes || 0) - (a.likes || 0);
    }
    if (sort === 'forks') {
      return (b.forks || 0) - (a.forks || 0);
    }
    if (sort === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sort === 'recent' || sort === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sort === 'alphabetical') {
      return a.title.localeCompare(b.title);
    }
    // Default: 'popular' score based on likes + forks + rating
    const scoreA = (a.likes || 0) + (a.forks || 0) * 2 + (a.rating || 0) * 10;
    const scoreB = (b.likes || 0) + (b.forks || 0) * 2 + (b.rating || 0) * 10;
    return scoreB - scoreA;
  });

  // Pagination if requested
  if (typeof filterObj.limit === 'number' && filterObj.limit > 0) {
    const offset = typeof filterObj.offset === 'number' ? filterObj.offset : 0;
    return results.slice(offset, offset + filterObj.limit);
  }

  return results;
}

/**
 * Get template by ID or slug
 * 
 * @param {string} id - Template ID (e.g. 'tpl_kick_livestream') or slug ('kick-live-stream-platform')
 * @returns {Object|null} Template object or null if not found
 */
function getTemplateById(id) {
  if (!id) return null;
  const match = communityTemplates.find(t => t.id === id || t.slug === id);
  return match || null;
}

/**
 * Fork a template into user workspace
 * Clones template code, tags, framework, and metadata into a new user project.
 * 
 * @param {string} templateId - ID or slug of template to fork
 * @param {string} userId - User ID performing the fork
 * @param {Object} options - Additional options (workspaceId, customTitle, etc.)
 * @returns {Object} Newly created project object
 */
function forkTemplate(templateId, userId = 'usr_pro_001', options = {}) {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found with ID: ${templateId}`);
  }

  // Increment fork counter on community template
  template.forks = (template.forks || 0) + 1;
  template.updatedAt = new Date().toISOString();

  const newProjectId = options.id || generateId('proj_fork');
  const projectTitle = options.title || `${template.title} (Fork)`;
  const targetWorkspaceId = options.workspaceId || 'ws_default';

  const forkedProject = {
    id: newProjectId,
    title: projectTitle,
    url: template.demoUrl || 'https://siteprompter.dev/showcase',
    framework: template.framework || 'react-tailwind',
    workspaceId: targetWorkspaceId,
    userId: userId,
    favorite: false,
    forkedFrom: template.id,
    forkedAt: new Date().toISOString(),
    tokensEstimate: template.tokensEstimate || 5000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: template.pages ? [...template.pages] : ['/'],
    previewUrl: template.previewUrl || template.demoUrl || '',
    tags: [...(template.tags || []), 'Forked', 'Community'],
    code: template.code || '',
    designTokens: template.designTokens || null,
    promptRecipe: template.promptRecipe || null,
  };

  // If projects-store is available, persist it
  if (projectsStore && typeof projectsStore.saveProject === 'function') {
    try {
      projectsStore.saveProject(forkedProject);
    } catch (err) {
      console.warn('[CommunityHub] Note: Could not auto-save to projectsStore:', err.message);
    }
  }

  return {
    success: true,
    message: `Successfully forked "${template.title}" into workspace "${targetWorkspaceId}"`,
    project: forkedProject,
    templateStats: {
      templateId: template.id,
      forks: template.forks,
      likes: template.likes
    }
  };
}

/**
 * Publish a new website clone or prompt recipe to the Community Hub
 * 
 * @param {Object} projectData - Clone/Project data (title, framework, code, tags, promptRecipe, etc.)
 * @param {Object} authorInfo - Author information (id, name, avatar, badge)
 * @returns {Object} Published template object
 */
function publishTemplate(projectData = {}, authorInfo = {}) {
  if (!projectData.title) {
    throw new Error('Template title is required to publish to community hub');
  }

  const newId = projectData.id || generateId('tpl');
  const now = new Date().toISOString();

  const author = {
    id: authorInfo.id || 'usr_community',
    name: authorInfo.name || 'Community Developer',
    avatar: authorInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    badge: authorInfo.badge || 'Creator',
    verified: Boolean(authorInfo.verified)
  };

  const newTemplate = {
    id: newId,
    slug: projectData.slug || slugify(projectData.title),
    title: projectData.title.trim(),
    category: projectData.category || 'Community Clones',
    framework: projectData.framework || 'react-tailwind',
    featured: Boolean(projectData.featured),
    rating: typeof projectData.rating === 'number' ? projectData.rating : 5.0,
    reviewsCount: 1,
    likes: typeof projectData.likes === 'number' ? projectData.likes : 0,
    forks: 0,
    tokensEstimate: projectData.tokensEstimate || 4500,
    author: author,
    demoUrl: projectData.demoUrl || projectData.url || '',
    thumbnail: projectData.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    description: projectData.description || 'Community published website clone and prompt recipe',
    tags: Array.isArray(projectData.tags) ? projectData.tags : ['Community', 'Clone'],
    pages: Array.isArray(projectData.pages) ? projectData.pages : ['/'],
    designTokens: projectData.designTokens || {},
    promptRecipe: projectData.promptRecipe || {
      systemPersona: 'Expert frontend engineer',
      keyInstructions: ['Replicate the provided website layout and design tokens.'],
      suggestedComponents: ['Navbar', 'Hero', 'Footer']
    },
    code: projectData.code || '',
    createdAt: now,
    updatedAt: now
  };

  // Add to community repository (at the top)
  communityTemplates.unshift(newTemplate);

  return {
    success: true,
    message: `Template "${newTemplate.title}" successfully published to Community Hub`,
    template: newTemplate
  };
}

/**
 * Like a template
 * 
 * @param {string} templateId - ID or slug of template
 * @returns {Object} Update result with likes count
 */
function likeTemplate(templateId) {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found with ID: ${templateId}`);
  }

  template.likes = (template.likes || 0) + 1;
  template.updatedAt = new Date().toISOString();

  return {
    success: true,
    likes: template.likes,
    template: template
  };
}

/**
 * Get top featured community clones
 * 
 * @returns {Array} Featured template objects
 */
function getFeaturedClones() {
  const featured = communityTemplates.filter(t => t.featured === true);
  if (featured.length > 0) {
    return featured.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }
  // Fallback to top rated/liked clones
  return getCommunityTemplates({ sort: 'popular', limit: 6 });
}

/**
 * Rate a template
 * 
 * @param {string} templateId - ID of template
 * @param {number} score - Score between 1 and 5
 * @returns {Object} Updated template
 */
function rateTemplate(templateId, score = 5) {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found with ID: ${templateId}`);
  }

  const numericScore = Math.max(1, Math.min(5, Number(score) || 5));
  const currentTotal = (template.rating || 5.0) * (template.reviewsCount || 1);
  const newCount = (template.reviewsCount || 1) + 1;
  const newRating = Number(((currentTotal + numericScore) / newCount).toFixed(2));

  template.rating = newRating;
  template.reviewsCount = newCount;
  template.updatedAt = new Date().toISOString();

  return {
    success: true,
    rating: template.rating,
    reviewsCount: template.reviewsCount,
    template
  };
}

/**
 * Get unique list of template categories
 */
function getCategories() {
  const categories = new Set();
  communityTemplates.forEach(t => {
    if (t.category) categories.add(t.category);
  });
  return Array.from(categories);
}

/**
 * Get list of popular tags
 */
function getPopularTags() {
  const tagCounts = {};
  communityTemplates.forEach(t => {
    (t.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * Get prompt recipes across all templates
 */
function getPromptRecipes() {
  return communityTemplates.map(t => ({
    templateId: t.id,
    title: t.title,
    category: t.category,
    framework: t.framework,
    recipe: t.promptRecipe,
    tags: t.tags
  }));
}

/**
 * Reset templates to default seed (useful for testing)
 */
function resetCommunityTemplates() {
  communityTemplates = JSON.parse(JSON.stringify(DEFAULT_COMMUNITY_TEMPLATES));
  return communityTemplates.length;
}

/**
 * Get overall hub statistics
 */
function getHubStats() {
  const totalTemplates = communityTemplates.length;
  const totalLikes = communityTemplates.reduce((sum, t) => sum + (t.likes || 0), 0);
  const totalForks = communityTemplates.reduce((sum, t) => sum + (t.forks || 0), 0);
  const categories = getCategories();

  return {
    totalTemplates,
    totalLikes,
    totalForks,
    categoriesCount: categories.length,
    categories
  };
}

module.exports = {
  DEFAULT_COMMUNITY_TEMPLATES,
  getCommunityTemplates,
  getTemplateById,
  forkTemplate,
  publishTemplate,
  likeTemplate,
  getFeaturedClones,
  rateTemplate,
  getCategories,
  getPopularTags,
  getPromptRecipes,
  resetCommunityTemplates,
  getHubStats,
};
