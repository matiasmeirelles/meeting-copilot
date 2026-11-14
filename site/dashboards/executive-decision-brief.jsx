import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line,
  AreaChart, Area
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const tabs = [
  "Market Opportunity",
  "Competitive Landscape",
  "Product Strategy",
  "Unit Economics",
  "GTM Roadmap",
  "Risk Analysis",
  "Investment Thesis"
];

// --- DATA ---

const marketSizingData = [
  { name: "Conversational AI", tam: 17.97, sam: 4.54, som: 0.15 },
  { name: "Meeting Intelligence", tam: 4.54, sam: 1.8, som: 0.08 },
  { name: "Sales Coaching", tam: 3.2, sam: 0.9, som: 0.05 },
  { name: "Productivity SaaS", tam: 82, sam: 5.5, som: 0.12 },
];

const marketGrowthData = [
  { year: "2024", market: 11.2 },
  { year: "2025", market: 14.8 },
  { year: "2026", market: 18.0 },
  { year: "2027", market: 23.1 },
  { year: "2028", market: 29.6 },
  { year: "2029", market: 37.9 },
  { year: "2030", market: 48.6 },
];

const competitorFundingData = [
  { name: "Granola", funding: 192, valuation: 1500, users: "Millions" },
  { name: "Gong", funding: 583, valuation: 7200, users: "4K+ orgs" },
  { name: "Otter.ai", funding: 63, valuation: 0, users: "15M+" },
  { name: "Balto", funding: 57, valuation: 0, users: "250M calls" },
  { name: "Fellow", funding: 30, valuation: 0, users: "300K+" },
  { name: "Fathom", funding: 17, valuation: 0, users: "1M+" },
  { name: "Hedy AI", funding: 2, valuation: 0, users: "25K+" },
];

const featureComparisonData = [
  { feature: "Invisible Capture", us: 10, granola: 10, hedy: 8, poised: 8, otter: 2, gong: 2 },
  { feature: "Real-Time Coaching", us: 10, granola: 0, hedy: 8, poised: 6, otter: 3, gong: 0 },
  { feature: "Plan-Aware", us: 10, granola: 0, hedy: 0, poised: 3, otter: 0, gong: 0 },
  { feature: "Adaptive Nudges", us: 10, granola: 0, hedy: 4, poised: 0, otter: 0, gong: 0 },
  { feature: "Post-Meeting Debrief", us: 10, granola: 8, hedy: 6, poised: 5, otter: 7, gong: 9 },
  { feature: "Any Meeting Type", us: 10, granola: 10, hedy: 10, poised: 10, otter: 6, gong: 2 },
];

const pricingLandscape = [
  { name: "Granola", free: 25, pro: 18, team: 14, enterprise: 35 },
  { name: "Otter.ai", free: 0, pro: 8, team: 20, enterprise: 30 },
  { name: "Fathom", free: 0, pro: 15, team: 14, enterprise: 22 },
  { name: "Poised", free: 0, pro: 13, team: 0, enterprise: 0 },
  { name: "Read.ai", free: 0, pro: 20, team: 0, enterprise: 0 },
  { name: "Meeting Copilot", free: 0, pro: 19, team: 29, enterprise: 49 },
];

const unitEconomicsData = [
  { component: "STT (Deepgram)", costPerMeeting: 0.26, percentage: 28 },
  { component: "LLM Nudges (Haiku)", costPerMeeting: 0.15, percentage: 16 },
  { component: "Plan Parsing (Sonnet)", costPerMeeting: 0.08, percentage: 9 },
  { component: "Post-Meeting Summary", costPerMeeting: 0.12, percentage: 13 },
  { component: "Compute/Infra", costPerMeeting: 0.18, percentage: 19 },
  { component: "Storage/CDN", costPerMeeting: 0.05, percentage: 5 },
  { component: "Overhead", costPerMeeting: 0.09, percentage: 10 },
];

const revenueProjection = [
  { quarter: "Q1 Y1", users: 500, mrr: 4750, cogs: 1900, gross: 2850 },
  { quarter: "Q2 Y1", users: 2000, mrr: 19000, cogs: 7600, gross: 11400 },
  { quarter: "Q3 Y1", users: 5000, mrr: 47500, cogs: 16625, gross: 30875 },
  { quarter: "Q4 Y1", users: 10000, mrr: 95000, cogs: 28500, gross: 66500 },
  { quarter: "Q1 Y2", users: 18000, mrr: 171000, cogs: 47880, gross: 123120 },
  { quarter: "Q2 Y2", users: 30000, mrr: 285000, cogs: 74100, gross: 210900 },
  { quarter: "Q3 Y2", users: 45000, mrr: 427500, cogs: 102600, gross: 324900 },
  { quarter: "Q4 Y2", users: 65000, mrr: 617500, cogs: 142450, gross: 475050 },
];

const gtmPhases = [
  { phase: "Phase 1: PLG", timeline: "M1-6", target: "Individual power users", channels: "Product Hunt, Twitter/X, founder communities", metric: "5K users, $50K MRR" },
  { phase: "Phase 2: Team", timeline: "M6-12", target: "Sales teams, exec teams", channels: "Sales training partnerships, CRM integrations", metric: "30K users, $285K MRR" },
  { phase: "Phase 3: Enterprise", timeline: "M12-24", target: "Enterprise buyers", channels: "Direct sales, channel partners, SOC2/HIPAA", metric: "65K users, $618K MRR" },
];

const riskMatrix = [
  { risk: "Granola adds coaching", probability: 35, impact: 9, timeline: "18-24mo", mitigation: "Move faster on plan-matching moat" },
  { risk: "Hedy adds plan input", probability: 45, impact: 7, timeline: "12-18mo", mitigation: "Superior plan parsing + nudge quality" },
  { risk: "Microsoft private coaching", probability: 15, impact: 10, timeline: "24-36mo", mitigation: "Build ON TOP of Teams, not against it" },
  { risk: "Privacy backlash", probability: 30, impact: 6, timeline: "Ongoing", mitigation: "On-device processing, transparent controls" },
  { risk: "User adoption friction", probability: 50, impact: 5, timeline: "M1-6", mitigation: "Zero-input mode, auto-parse calendar" },
  { risk: "Nudge fatigue", probability: 40, impact: 7, timeline: "M3-12", mitigation: "Max 1/min, priority system, learn preferences" },
];

const investmentThesis = [
  { metric: "TAM", value: "$18B", detail: "Conversational AI market 2026" },
  { metric: "SAM", value: "$4.5B", detail: "Conversation intelligence platforms" },
  { metric: "SOM (Y3)", value: "$7.4M ARR", detail: "65K users at blended $9.50 ARPU" },
  { metric: "Gross Margin", value: "72-78%", detail: "After STT + LLM + infra costs" },
  { metric: "COGS/Meeting", value: "$0.93", detail: "All-in per 45-min meeting" },
  { metric: "First-Mover Window", value: "12-18 months", detail: "Before credible competitor ships" },
  { metric: "Category", value: "NEW", detail: "Plan-aware meeting coaching (no incumbent)" },
];

// --- COMPONENTS ---

function MetricCard({ label, value, detail, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-900 border-blue-700 text-blue-300",
    green: "bg-green-900 border-green-700 text-green-300",
    amber: "bg-amber-900 border-amber-700 text-amber-300",
    red: "bg-red-900 border-red-700 text-red-300",
    purple: "bg-purple-900 border-purple-700 text-purple-300",
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {detail && <div className="text-xs mt-1 opacity-60">{detail}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// --- TAB PANELS ---

function MarketOpportunity() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Market Opportunity" subtitle="Conversational AI + meeting intelligence markets, 2026" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="TAM" value="$18B" detail="Conversational AI 2026" color="blue" />
        <MetricCard label="SAM" value="$4.5B" detail="Conv. intelligence platforms" color="green" />
        <MetricCard label="SOM (Y3)" value="$7.4M" detail="ARR target" color="amber" />
        <MetricCard label="CAGR" value="28%" detail="2026-2035 growth rate" color="purple" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">TAM / SAM / SOM by Segment ($B)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marketSizingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="tam" name="TAM" fill="#3b82f6" />
              <Bar dataKey="sam" name="SAM" fill="#10b981" />
              <Bar dataKey="som" name="SOM" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Conversational AI Market Growth ($B)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={marketGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="market" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Market Size ($B)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Key Market Drivers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-700 p-3 rounded">
            <div className="font-semibold text-blue-300">Remote/Hybrid Work</div>
            <div className="text-gray-400 mt-1">42% of companies deploying AI meeting assistants in 2026. Meeting fatigue drives demand for tools that make every meeting count.</div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="font-semibold text-green-300">AI Adoption Curve</div>
            <div className="text-gray-400 mt-1">Enterprise AI adoption accelerating. Granola's $1.5B valuation and $192M raised validates the meeting AI category.</div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="font-semibold text-amber-300">Unserved Pain Point</div>
            <div className="text-gray-400 mt-1">"I had a script but couldn't follow it" is universal. No product helps you execute your meeting plan in real-time.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompetitiveLandscape() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Competitive Landscape" subtitle="No product combines invisible capture + plan-aware coaching + adaptive nudges" />
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Competitor Funding ($M)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={competitorFundingData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
            <Bar dataKey="funding" name="Funding ($M)" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Feature Comparison (0-10 scale)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={featureComparisonData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="feature" tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fill: "#6b7280", fontSize: 9 }} domain={[0, 10]} />
            <Radar name="Meeting Copilot" dataKey="us" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            <Radar name="Granola" dataKey="granola" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            <Radar name="Hedy AI" dataKey="hedy" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
            <Radar name="Poised" dataKey="poised" stroke="#ec4899" fill="#ec4899" fillOpacity={0.1} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">The White Space</h3>
        <div className="text-sm text-gray-400">
          <p className="mb-2"><span className="text-blue-300 font-semibold">Granola</span> ($1.5B) — Best invisible capture. Zero coaching. Backward-looking only.</p>
          <p className="mb-2"><span className="text-green-300 font-semibold">Hedy AI</span> (25K users) — Real-time coaching. But no plan awareness. Generic suggestions from conversation context.</p>
          <p className="mb-2"><span className="text-pink-300 font-semibold">Poised</span> (100K users) — Speech analytics coaching (filler words, pace). Not content coaching.</p>
          <p className="mb-2"><span className="text-amber-300 font-semibold">Balto</span> ($57M) — Real-time guidance at scale. But call center only, rigid scripts.</p>
          <p className="mt-4 text-white font-semibold">Gap: No product coaches you from YOUR playbook during ANY meeting type, delivered as glanceable 6-8 word nudges.</p>
        </div>
      </div>
    </div>
  );
}

function ProductStrategy() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Product Strategy" subtitle="Plan-aware coaching delivered as whisper-weight nudges" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <div className="text-blue-300 font-semibold mb-2">Before Meeting</div>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>Load plan: paste text, PDF, deck, CRM data, voice memo</li>
            <li>AI parses into: goals, agenda items, talking points, objection handles</li>
            <li>Auto-pull context from calendar event and prior meetings</li>
          </ul>
        </div>
        <div className="bg-green-900 border border-green-700 rounded-lg p-4">
          <div className="text-green-300 font-semibold mb-2">During Meeting</div>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>Invisible capture (system audio, no bot)</li>
            <li>6-8 word nudges: "ask about budget", "pause, listen"</li>
            <li>Max 1 nudge per minute, priority-ranked</li>
            <li>Adaptive re-sequencing when conversation shifts</li>
          </ul>
        </div>
        <div className="bg-amber-900 border border-amber-700 rounded-lg p-4">
          <div className="text-amber-300 font-semibold mb-2">After Meeting</div>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>Transcript + AI summary (table stakes)</li>
            <li>Plan completion scorecard: 4/7 items covered</li>
            <li>Coaching debrief: "talked 72%, aim for 40%"</li>
            <li>Auto-generate next meeting prep from gaps</li>
          </ul>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Nudge UX — Non-Negotiable Design Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-green-400 font-semibold mb-2">Right (6-8 words)</div>
            <div className="space-y-1 text-gray-300 font-mono text-xs">
              <div className="bg-green-900 px-2 py-1 rounded">ask about budget</div>
              <div className="bg-green-900 px-2 py-1 rounded">pause, let them talk</div>
              <div className="bg-green-900 px-2 py-1 rounded">mention the 40% stat</div>
              <div className="bg-green-900 px-2 py-1 rounded">pivot to timeline</div>
              <div className="bg-green-900 px-2 py-1 rounded">they're interested, go deeper</div>
            </div>
          </div>
          <div>
            <div className="text-red-400 font-semibold mb-2">Wrong (paragraphs)</div>
            <div className="space-y-1 text-gray-300 font-mono text-xs">
              <div className="bg-red-900 px-2 py-1 rounded line-through opacity-60">You should consider transitioning the conversation to discuss their budget constraints and timeline...</div>
              <div className="bg-red-900 px-2 py-1 rounded line-through opacity-60">Based on what they just said about vendor evaluation, this would be a good time to present...</div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Use Cases</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {["Sales Discovery", "Investor Pitch", "Board Meeting", "Job Interview", "1:1 Manager", "Negotiation", "Difficult Conversation", "Workshop Facilitation"].map((uc, i) => (
            <div key={i} className="bg-gray-700 p-2 rounded text-center text-gray-300">{uc}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitEconomics() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Unit Economics" subtitle="All-in COGS: $0.93 per 45-minute meeting" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="COGS / Meeting" value="$0.93" detail="45-min avg meeting" color="blue" />
        <MetricCard label="Revenue / Meeting" value="$2.38" detail="At $19/mo, 8 meetings" color="green" />
        <MetricCard label="Gross Margin" value="61%" detail="Per-meeting basis" color="amber" />
        <MetricCard label="Target Margin" value="72-78%" detail="At scale (100K+ meetings/mo)" color="purple" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Cost Breakdown per Meeting</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={unitEconomicsData} dataKey="percentage" nameKey="component" cx="50%" cy="50%" outerRadius={100} label={({ component, percentage }) => `${component}: ${percentage}%`}>
                {unitEconomicsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Pricing Landscape ($/user/month)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pricingLandscape}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="pro" name="Pro" fill="#3b82f6" />
              <Bar dataKey="team" name="Team" fill="#10b981" />
              <Bar dataKey="enterprise" name="Enterprise" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Cost at Scale</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">Scale</th>
              <th className="text-right py-2">Meetings/Mo</th>
              <th className="text-right py-2">Monthly COGS</th>
              <th className="text-right py-2">Est. Revenue</th>
              <th className="text-right py-2">Gross Margin</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            <tr className="border-b border-gray-800"><td className="py-2">Seed</td><td className="text-right">1,000</td><td className="text-right">$930</td><td className="text-right">$2,380</td><td className="text-right text-green-400">61%</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2">Series A</td><td className="text-right">10,000</td><td className="text-right">$7,900</td><td className="text-right">$23,800</td><td className="text-right text-green-400">67%</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2">Growth</td><td className="text-right">100,000</td><td className="text-right">$65,000</td><td className="text-right">$238,000</td><td className="text-right text-green-400">73%</td></tr>
            <tr><td className="py-2">Scale</td><td className="text-right">1,000,000</td><td className="text-right">$520,000</td><td className="text-right">$2,380,000</td><td className="text-right text-green-400">78%</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GTMRoadmap() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Go-to-Market Roadmap" subtitle="PLG first, team expansion, then enterprise" />
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Revenue Projection (Moderate Scenario)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={revenueProjection}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quarter" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} formatter={(v) => `$${v.toLocaleString()}`} />
            <Legend />
            <Area type="monotone" dataKey="mrr" name="MRR" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            <Area type="monotone" dataKey="gross" name="Gross Profit" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
            <Area type="monotone" dataKey="cogs" name="COGS" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-4">
        {gtmPhases.map((phase, i) => (
          <div key={i} className={`border rounded-lg p-4 ${i === 0 ? "border-blue-700 bg-blue-900" : i === 1 ? "border-green-700 bg-green-900" : "border-amber-700 bg-amber-900"}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className={`font-semibold ${i === 0 ? "text-blue-300" : i === 1 ? "text-green-300" : "text-amber-300"}`}>{phase.phase}</div>
                <div className="text-gray-400 text-sm mt-1">Target: {phase.target}</div>
                <div className="text-gray-400 text-sm">Channels: {phase.channels}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">{phase.timeline}</div>
                <div className="text-white font-semibold text-sm mt-1">{phase.metric}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">User Growth Trajectory</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueProjection}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quarter" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
            <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} name="Active Users" dot={{ fill: "#8b5cf6" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskAnalysis() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Risk Analysis" subtitle="Competitive response scenarios and mitigation strategies" />
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Risk Matrix: Probability vs Impact</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2">Risk</th>
                <th className="text-center py-2">Probability</th>
                <th className="text-center py-2">Impact</th>
                <th className="text-center py-2">Timeline</th>
                <th className="text-left py-2">Mitigation</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {riskMatrix.map((r, i) => (
                <tr key={i} className="border-b border-gray-800">
                  <td className="py-2 font-medium">{r.risk}</td>
                  <td className="text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.probability >= 40 ? "bg-red-900 text-red-300" : r.probability >= 25 ? "bg-amber-900 text-amber-300" : "bg-green-900 text-green-300"}`}>
                      {r.probability}%
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.impact >= 8 ? "bg-red-900 text-red-300" : r.impact >= 5 ? "bg-amber-900 text-amber-300" : "bg-green-900 text-green-300"}`}>
                      {r.impact}/10
                    </span>
                  </td>
                  <td className="text-center text-xs">{r.timeline}</td>
                  <td className="py-2 text-xs text-gray-400">{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <div className="text-red-300 font-semibold mb-2">Worst Case: Microsoft Private Coaching</div>
          <div className="text-sm text-gray-400">If Microsoft adds private coaching to Teams Copilot, their 320M+ MAU distribution is catastrophic for the entire category. Defense: build ON TOP of Teams as a "private coaching layer," not as a replacement.</div>
        </div>
        <div className="bg-green-900 border border-green-800 rounded-lg p-4">
          <div className="text-green-300 font-semibold mb-2">Best Case: Category Creation</div>
          <div className="text-sm text-gray-400">We define "Meeting Copilot" as a new category before incumbents react. PLG viral loop ("I crushed that meeting") drives organic adoption. First to 50K users with plan-aware coaching owns the category.</div>
        </div>
      </div>
    </div>
  );
}

function InvestmentThesisFn() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Investment Thesis" subtitle="New category opportunity in a $18B+ market" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {investmentThesis.slice(0, 4).map((t, i) => (
          <MetricCard key={i} label={t.metric} value={t.value} detail={t.detail} color={["blue", "green", "amber", "purple"][i]} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {investmentThesis.slice(4).map((t, i) => (
          <MetricCard key={i} label={t.metric} value={t.value} detail={t.detail} color={["blue", "green", "amber"][i]} />
        ))}
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Why Now?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <div className="text-white font-semibold mb-1">1. The capture problem is solved</div>
            <p>Granola proved invisible audio capture works. We don't need to reinvent this — we build the coaching layer on top.</p>
          </div>
          <div>
            <div className="text-white font-semibold mb-1">2. LLMs are fast enough</div>
            <p>Claude Haiku generates nudges in &lt;500ms. Real-time semantic matching was not possible 18 months ago at acceptable cost.</p>
          </div>
          <div>
            <div className="text-white font-semibold mb-1">3. Category is greenfield</div>
            <p>Plan-aware meeting coaching has zero incumbents. Hedy is closest but lacks plan input. 12-18 month window.</p>
          </div>
          <div>
            <div className="text-white font-semibold mb-1">4. Universal pain point</div>
            <p>Every professional has walked out of a meeting thinking "I forgot to say that." This product solves a problem everyone has.</p>
          </div>
        </div>
      </div>
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">The One-Line Pitch</h3>
        <p className="text-white text-lg font-medium">Note-taking apps remember what you said. We help you say what you planned.</p>
      </div>
    </div>
  );
}

// --- MAIN ---

const tabComponents = [MarketOpportunity, CompetitiveLandscape, ProductStrategy, UnitEconomics, GTMRoadmap, RiskAnalysis, InvestmentThesisFn];

export default function ExecutiveDecisionBrief() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = tabComponents[activeTab];
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Meeting Copilot</h1>
          <p className="text-gray-400 mt-1">Executive Decision Brief — Real-Time Conversation Coach + Note-Taker</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700 pb-4">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === i ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"}`}>
              {tab}
            </button>
          ))}
        </div>
        <ActiveComponent />
      </div>
    </div>
  );
}
