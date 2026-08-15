/**
 * SitePrompter Web - In-Memory & Persistent Storage
 * Handles Auth, Workspaces, Projects, Billing & BYOK Keys
 */

// Default initial state
const defaultState = {
  user: {
    id: 'usr_pro_001',
    name: 'Alex Rivera',
    email: 'alex.rivera@antigravity.dev',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    plan: 'Pro Developer',
    credits: 480,
    creditsLimit: 1000,
    workspaceId: 'ws_default',
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  workspaces: [
    { id: 'ws_default', name: 'Default Workspace', icon: 'fa-layer-group', projectCount: 4, createdAt: new Date().toISOString() },
    { id: 'ws_saas', name: 'SaaS Clones & Portals', icon: 'fa-cloud', projectCount: 2, createdAt: new Date().toISOString() },
    { id: 'ws_landing', name: 'High-Converting Landing Pages', icon: 'fa-bolt', projectCount: 3, createdAt: new Date().toISOString() }
  ],
  projects: [
    {
      id: 'proj_kick_clone',
      title: 'Kick Live Stream Clone (DarthKubo)',
      url: 'https://kick.com/darthkubo',
      framework: 'react-tailwind',
      workspaceId: 'ws_default',
      favorite: true,
      tokensEstimate: 6240,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      pages: ['/', '/live', '/about'],
      previewUrl: 'http://localhost:3001',
      tags: ['Streaming', 'React 19', 'Tailwind', 'Dark Mode'],
      code: `import React, { useState } from 'react';
import { Play, Volume2, MessageSquare, Heart, Share2, Users, Shield } from 'lucide-react';

export default function KickStreamApp() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, user: 'ViperX', text: 'HYPER CLUTCH PogChamp!!', color: '#53FC18' },
    { id: 2, user: 'NovaGaming', text: 'Settings config looks insane!', color: '#38bdf8' },
    { id: 3, user: 'PixelKnight', text: 'Subbed with 3 months streak 🔥', color: '#a855f7' }
  ]);
  const [inputVal, setInputVal] = useState('');

  const sendMsg = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setMessages([...messages, { id: Date.now(), user: 'You', text: inputVal, color: '#53FC18' }]);
    setInputVal('');
  };

  return (
    <div className="min-h-screen bg-[#0b0e0f] text-[#eff2f5] font-sans antialiased flex flex-col">
      {/* Navbar */}
      <header className="h-14 bg-[#191b1f] border-b border-[#24272c] px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="bg-[#53FC18] text-black font-black text-xl px-2 py-0.5 rounded tracking-tighter">KICK</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#53FC18]/10 text-[#53FC18] border border-[#53FC18]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#53FC18] animate-pulse"></span> LIVE
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm font-semibold text-gray-300">
            <a href="#" className="hover:text-white transition-colors">Browse</a>
            <a href="#" className="hover:text-white transition-colors">Following</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsFollowing(!isFollowing)}
            className={\`px-4 py-1.5 rounded-lg text-sm font-bold transition-all \${isFollowing ? 'bg-[#24272c] text-white' : 'bg-[#53FC18] text-black hover:brightness-110'}\`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        {/* Video Player Main Stage */}
        <div className="lg:col-span-3 bg-black flex flex-col">
          <div className="relative aspect-video w-full bg-[#121417] flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>
            <div className="text-center z-10">
              <div className="w-20 h-20 rounded-full bg-[#53FC18]/20 border border-[#53FC18] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform cursor-pointer shadow-lg shadow-[#53FC18]/20">
                <Play className="w-8 h-8 text-[#53FC18] fill-[#53FC18] ml-1" />
              </div>
              <p className="text-lg font-bold text-white tracking-wide">DarthKubo 100 Days Hardcore Survival</p>
              <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-2">
                <Users className="w-4 h-4 text-[#53FC18]" /> 1,420 Viewers • 1080p60 Source
              </p>
            </div>
          </div>

          {/* Streamer Info Bar */}
          <div className="p-4 bg-[#14171a] border-b border-[#24272c] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full ring-2 ring-[#53FC18] overflow-hidden bg-gray-800 flex items-center justify-center font-bold text-lg">
                DK
              </div>
              <div>
                <h2 className="font-bold text-base text-white flex items-center gap-2">
                  DarthKubo <Shield className="w-4 h-4 text-[#53FC18]" />
                </h2>
                <p className="text-xs text-gray-400">Minecraft • Hardcore Speedrun World Record Attempt</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f2228] hover:bg-[#282c34] rounded-lg text-xs font-semibold">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> 8.4k
              </button>
            </div>
          </div>
        </div>

        {/* Live Chat Drawer */}
        <div className="lg:col-span-1 bg-[#14171a] border-l border-[#24272c] flex flex-col h-full">
          <div className="h-12 px-4 border-b border-[#24272c] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
            <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#53FC18]" /> Stream Chat</span>
            <span className="text-[#53FC18]">Active</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs font-medium">
            {messages.map(m => (
              <div key={m.id} className="p-2 rounded bg-[#191c20]/60 hover:bg-[#1f2328] transition-colors">
                <span className="font-bold mr-2" style={{ color: m.color }}>{m.user}:</span>
                <span className="text-gray-200">{m.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={sendMsg} className="p-3 border-t border-[#24272c] bg-[#101214]">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Send a message..." 
                className="flex-1 bg-[#1a1d21] border border-[#2d3138] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#53FC18]"
              />
              <button type="submit" className="px-3 py-2 bg-[#53FC18] text-black font-bold text-xs rounded-lg hover:brightness-110">
                Chat
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}`
    },
    {
      id: 'proj_linear_app',
      title: 'Linear Issue Tracking Interface',
      url: 'https://linear.app',
      framework: 'react-tailwind',
      workspaceId: 'ws_default',
      favorite: true,
      tokensEstimate: 4890,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      pages: ['/', '/pricing', '/features'],
      previewUrl: 'https://linear.app',
      tags: ['Productivity', 'Dark Mode', 'Keyboard Driven'],
      code: `// Linear App React Code`
    }
  ],
  byokKeys: {
    anthropic: '',
    openai: '',
    deepseek: '',
    gemini: ''
  }
};

let db = { ...defaultState };

module.exports = {
  getStore: () => db,
  getUser: () => db.user,
  updateUser: (fields) => {
    db.user = { ...db.user, ...fields };
    return db.user;
  },
  deductCredits: (amount = 10) => {
    if (db.user.credits >= amount) {
      db.user.credits -= amount;
      return { success: true, remaining: db.user.credits };
    }
    return { success: false, error: 'Insufficient credits', remaining: db.user.credits };
  },
  addCredits: (amount = 100) => {
    db.user.credits += amount;
    return db.user.credits;
  },
  getWorkspaces: () => db.workspaces,
  createWorkspace: (name) => {
    const ws = {
      id: `ws_${Date.now()}`,
      name: name || 'New Workspace',
      icon: 'fa-folder',
      projectCount: 0,
      createdAt: new Date().toISOString()
    };
    db.workspaces.push(ws);
    return ws;
  },
  getProjects: (workspaceId) => {
    if (workspaceId) {
      return db.projects.filter(p => p.workspaceId === workspaceId);
    }
    return db.projects;
  },
  getProjectById: (id) => db.projects.find(p => p.id === id),
  saveProject: (project) => {
    const existingIndex = db.projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      db.projects[existingIndex] = {
        ...db.projects[existingIndex],
        ...project,
        updatedAt: new Date().toISOString()
      };
      return db.projects[existingIndex];
    } else {
      const newProj = {
        id: project.id || `proj_${Date.now()}`,
        title: project.title || 'Untitled Project',
        url: project.url || 'https://example.com',
        framework: project.framework || 'react-tailwind',
        workspaceId: project.workspaceId || db.user.workspaceId || 'ws_default',
        favorite: !!project.favorite,
        tokensEstimate: project.tokensEstimate || 3500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: project.pages || ['/'],
        previewUrl: project.previewUrl || '',
        tags: project.tags || ['React', 'Tailwind'],
        code: project.code || ''
      };
      db.projects.unshift(newProj);
      return newProj;
    }
  },
  deleteProject: (id) => {
    const initialLen = db.projects.length;
    db.projects = db.projects.filter(p => p.id !== id);
    return db.projects.length < initialLen;
  },
  toggleFavorite: (id) => {
    const proj = db.projects.find(p => p.id === id);
    if (proj) {
      proj.favorite = !proj.favorite;
      proj.updatedAt = new Date().toISOString();
      return proj;
    }
    return null;
  },
  getByokKeys: () => {
    // Return masked keys for security
    const masked = {};
    for (const [provider, key] of Object.entries(db.byokKeys)) {
      if (key && key.length > 8) {
        masked[provider] = `${key.slice(0, 4)}...${key.slice(-4)}`;
      } else if (key) {
        masked[provider] = '••••••••';
      } else {
        masked[provider] = '';
      }
    }
    return { keys: masked, configured: Object.keys(db.byokKeys).filter(k => !!db.byokKeys[k]) };
  },
  saveByokKeys: (newKeys = {}) => {
    for (const [provider, key] of Object.entries(newKeys)) {
      if (key !== undefined) {
        db.byokKeys[provider] = key ? key.trim() : '';
      }
    }
    return true;
  },
  getRawByokKey: (provider) => db.byokKeys[provider] || ''
};
