import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, ZAxis, Cell
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const tabs = [
  "Competitor Map",
  "Feature Matrix",
  "Funding & Scale",
  "Threat Analysis",
  "Positioning",
  "First-Mover Window",
  "Battle Cards"
];

// --- DATA ---

const competitorProfiles = [
  { name: "Hedy AI", category: "Real-Time Coach", invisible: true, realTime: true, planAware: false, adaptive: false, funding: "$~2M", users: "25K+", threat: "HIGH", price: "Freemium" },
  { name: "Poised", category: "Speech Analytics", invisible: true, realTime: true, planAware: false, adaptive: false, funding: "Unknown", users: "100K+", threat: "MEDIUM", price: "$13-19/mo" },
  { name: "Granola", category: "Note-Taking", invisible: true, realTime: false, planAware: false, adaptive: false, funding: "$192M", users: "Millions", threat: "HIGH", price: "$14-35/mo" },
  { name: "Otter.ai", category: "Transcription", invisible: false, realTime: false, planAware: false, adaptive: false, funding: "$63M", users: "15M+", threat: "MEDIUM", price: "$8-30/mo" },
  { name: "Fathom", category: "Note-Taking", invisible: true, realTime: false, planAware: false, adaptive: false, funding: "$17M", users: "1M+", threat: "LOW-MED", price: "Free-$22/mo" },
  { name: "Read.ai", category: "Meeting Analytics", invisible: false, realTime: true, planAware: false, adaptive: false, funding: "$21M", users: "1M+/mo", threat: "MEDIUM", price: "$20/mo" },
  { name: "Balto", category: "Call Center AI", invisible: false, realTime: true, planAware: false, adaptive: false, funding: "$57M", users: "250M calls", threat: "MEDIUM", price: "Enterprise" },
  { name: "Gong", category: "Revenue Intel", invisible: false, realTime: false, planAware: false, adaptive: false, funding: "$583M", users: "4K+ orgs", threat: "LOW", price: "$100-200/mo" },
  { name: "Colibri", category: "Meeting Assistant", invisible: false, realTime: true, planAware: true, adaptive: false, funding: "Unknown", users: "Unknown", threat: "LOW-MED", price: "Freemium" },
  { name: "Fellow", category: "Meeting Mgmt", invisible: false, realTime: false, planAware: false, adaptive: false, funding: "$30M", users: "300K+", threat: "LOW", price: "$9-15/mo" },
];

const featureMatrix = [
  { feature: "Invisible (no bot)", hedyAI: 1, poised: 1, granola: 1, otter: 0, fathom: 1, readAI: 0, balto: 0, gong: 0 },
  { feature: "Real-time coaching", hedyAI: 1, poised: 1, granola: 0, otter: 0, fathom: 0, readAI: 0, balto: 1, gong: 0 },
  { feature: "Content nudges", hedyAI: 1, poised: 0, granola: 0, otter: 0, fathom: 0, readAI: 0, balto: 1, gong: 0 },
  { feature: "Speech analytics", hedyAI: 0, poised: 1, granola: 0, otter: 0, fathom: 0, readAI: 1, balto: 0, gong: 1 },
  { feature: "Plan input", hedyAI: 0, poised: 0, granola: 0, otter: 0, fathom: 0, readAI: 0, balto: 0, gong: 0 },
  { feature: "Agenda tracking", hedyAI: 0, poised: 1, granola: 0, otter: 0, fathom: 0, readAI: 0, balto: 0, gong: 0 },
  { feature: "Adaptive re-sequencing", hedyAI: 0, poised: 0, granola: 0, otter: 0, fathom: 0, readAI: 0, balto: 0, gong: 0 },
  { feature: "Plan completion score", hedyAI: 0, poised: 0, granola: 0, otter: 0, fathom: 0, readAI: 0, balto: 0, gong: 0 },
  { feature: "Any meeting type", hedyAI: 1, poised: 1, granola: 1, otter: 1, fathom: 1, readAI: 1, balto: 0, gong: 0 },
  { feature: "Post-meeting summary", hedyAI: 1, poised: 1, granola: 1, otter: 1, fathom: 1, readAI: 1, balto: 1, gong: 1 },
  { feature: "CRM integration", hedyAI: 0, poised: 0, granola: 0, otter: 1, fathom: 1, readAI: 0, balto: 1, gong: 1 },
  { feature: "Wearable support", hedyAI: 1, poised: 0, granola: 0, otter: 0, fathom: 0, readAI: 0, balto: 0, gong: 0 },
];

const radarData = [
  { axis: "Invisible Capture", us: 10, hedyAI: 8, granola: 10, poised: 8 },
  { axis: "Real-Time Coaching", us: 10, hedyAI: 8, granola: 0, poised: 6 },
  { axis: "Plan Awareness", us: 10, hedyAI: 0, granola: 0, poised: 3 },
  { axis: "Adaptive Intelligence", us: 10, hedyAI: 4, granola: 0, poised: 0 },
  { axis: "Post-Meeting Insights", us: 9, hedyAI: 6, granola: 8, poised: 5 },
  { axis: "Multi-Platform", us: 7, hedyAI: 9, granola: 5, poised: 4 },
];

const fundingData = [
  { name: "Gong", funding: 583, threat: "LOW" },
  { name: "Granola", funding: 192, threat: "HIGH" },
  { name: "Otter.ai", funding: 63, threat: "MEDIUM" },
  { name: "Balto", funding: 57, threat: "MEDIUM" },
  { name: "Fellow", funding: 30, threat: "LOW" },
  { name: "Read.ai", funding: 21, threat: "MEDIUM" },
  { name: "Fireflies", funding: 19, threat: "LOW" },
  { name: "Fathom", funding: 17, threat: "LOW-MED" },
  { name: "tl;dv", funding: 8, threat: "LOW" },
  { name: "Hedy AI", funding: 2, threat: "HIGH" },
];

const threatTimeline = [
  { competitor: "Hedy AI", timeToShip: 12, likelihood: 45, impact: 7, color: "#f59e0b" },
  { competitor: "Granola", timeToShip: 20, likelihood: 35, impact: 9, color: "#ef4444" },
  { competitor: "Poised", timeToShip: 15, likelihood: 25, impact: 6, color: "#ec4899" },
  { competitor: "Otter.ai", timeToShip: 20, likelihood: 20, impact: 7, color: "#3b82f6" },
  { competitor: "Microsoft", timeToShip: 30, likelihood: 15, impact: 10, color: "#8b5cf6" },
  { competitor: "Balto", timeToShip: 15, likelihood: 15, impact: 5, color: "#10b981" },
];

const battleCards = [
  {
    competitor: "Granola",
    theirPitch: "Beautiful AI notes, no bot in meeting",
    ourResponse: "We do everything Granola does + coach you in real-time from your playbook",
    theirWeakness: "Only looks backward. You still forget to ask the key question.",
    ourStrength: "Plan-aware nudges ensure you cover every talking point"
  },
  {
    competitor: "Hedy AI",
    theirPitch: "Real-time coaching and suggestions during meetings",
    ourResponse: "Hedy coaches from context. We coach from YOUR plan. We know what you intended.",
    theirWeakness: "Generic suggestions. Doesn't know your agenda or strategy.",
    ourStrength: "Load your prep doc, get nudges tied to YOUR goals"
  },
  {
    competitor: "Gong",
    theirPitch: "Revenue intelligence with post-call analytics",
    ourResponse: "Real-time coaching for everyone, not post-call analytics for sales teams only",
    theirWeakness: "$100-200/user. Post-call only. Sales-only.",
    ourStrength: "$19/mo. Real-time. Any meeting type."
  },
  {
    competitor: "Poised",
    theirPitch: "Communication coach for speech quality",
    ourResponse: "We coach WHAT to say, not just HOW you say it",
    theirWeakness: "Tracks filler words and pace. Doesn't help with content.",
    ourStrength: "'ask about budget' > 'reduce filler words'"
  },
  {
    competitor: "Microsoft Copilot",
    theirPitch: "AI meeting notes and facilitation in Teams",
    ourResponse: "Private coaching just for you. Copilot helps the group; we help YOU win.",
    theirWeakness: "Collaborative, not private. Teams-only. No plan awareness.",
    ourStrength: "Your secret weapon. Works everywhere. Knows your strategy."
  },
];

// --- COMPONENTS ---

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// --- TAB PANELS ---

function CompetitorMap() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Competitor Map" subtitle="10 competitors across 6 categories" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">Competitor</th>
              <th className="text-left py-2">Category</th>
              <th className="text-center py-2">Invisible</th>
              <th className="text-center py-2">Real-Time</th>
              <th className="text-center py-2">Plan-Aware</th>
              <th className="text-right py-2">Funding</th>
              <th className="text-right py-2">Users</th>
              <th className="text-center py-2">Threat</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {competitorProfiles.map((c, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-2 font-medium text-white">{c.name}</td>
                <td className="py-2 text-gray-400">{c.category}</td>
                <td className="text-center">{c.invisible ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span>}</td>
                <td className="text-center">{c.realTime ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span>}</td>
                <td className="text-center">{c.planAware ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span>}</td>
                <td className="text-right">{c.funding}</td>
                <td className="text-right">{c.users}</td>
                <td className="text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${c.threat === "HIGH" ? "bg-red-900 text-red-300" : c.threat === "MEDIUM" ? "bg-amber-900 text-amber-300" : "bg-green-900 text-green-300"}`}>
                    {c.threat}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-200"><span className="font-semibold">Key finding:</span> Of 10 competitors analyzed, ZERO have all three: invisible capture + real-time coaching + plan awareness. Hedy AI is closest (invisible + real-time) but lacks plan awareness entirely.</p>
      </div>
    </div>
  );
}

function FeatureMatrixTab() {
  const competitors = ["hedyAI", "poised", "granola", "otter", "fathom", "readAI", "balto", "gong"];
  const labels = ["Hedy", "Poised", "Granola", "Otter", "Fathom", "Read", "Balto", "Gong"];
  return (
    <div className="space-y-6">
      <SectionHeader title="Feature Matrix" subtitle="Capabilities across 12 dimensions" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2 pr-4">Feature</th>
              <th className="text-center py-2 px-1 text-blue-300 font-bold">Us</th>
              {labels.map((l, i) => <th key={i} className="text-center py-2 px-1">{l}</th>)}
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {featureMatrix.map((row, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-2 pr-4 font-medium">{row.feature}</td>
                <td className="text-center bg-blue-900"><span className="text-blue-300 font-bold">Yes</span></td>
                {competitors.map((c, j) => (
                  <td key={j} className="text-center">
                    {row[c] ? <span className="text-green-400">Yes</span> : <span className="text-gray-600">-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Capability Radar</h3>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fill: "#6b7280", fontSize: 9 }} domain={[0, 10]} />
            <Radar name="Meeting Copilot" dataKey="us" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
            <Radar name="Hedy AI" dataKey="hedyAI" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
            <Radar name="Granola" dataKey="granola" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            <Radar name="Poised" dataKey="poised" stroke="#ec4899" fill="#ec4899" fillOpacity={0.1} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FundingScale() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Funding & Scale" subtitle="Competitor funding landscape — $1B+ invested in meeting AI" />
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Total Funding by Competitor ($M)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={fundingData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} formatter={(v) => `$${v}M`} />
            <Bar dataKey="funding" name="Funding ($M)">
              {fundingData.map((entry, i) => (
                <Cell key={i} fill={entry.threat === "HIGH" ? "#ef4444" : entry.threat === "MEDIUM" ? "#f59e0b" : "#10b981"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <div className="text-red-300 font-semibold text-sm">Granola: $1.5B Valuation</div>
          <div className="text-xs text-gray-400 mt-1">$192M raised. Best invisible capture. Could add coaching with massive engineering budget. 18-24 month threat window.</div>
        </div>
        <div className="bg-amber-900 border border-amber-800 rounded-lg p-4">
          <div className="text-amber-300 font-semibold text-sm">Hedy AI: Closest Competitor</div>
          <div className="text-xs text-gray-400 mt-1">Early-stage funding. Real-time coaching exists. Could add plan input in 12-18 months. But limited resources to execute fast.</div>
        </div>
        <div className="bg-blue-900 border border-blue-800 rounded-lg p-4">
          <div className="text-blue-300 font-semibold text-sm">$1B+ Total Market Investment</div>
          <div className="text-xs text-gray-400 mt-1">Combined funding across meeting AI competitors exceeds $1B. Category is validated. Investors are buying.</div>
        </div>
      </div>
    </div>
  );
}

function ThreatAnalysis() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Threat Analysis" subtitle="When could competitors build plan-aware coaching?" />
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Threat Timeline: Months to Ship vs Impact</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" dataKey="timeToShip" name="Months to Ship" tick={{ fill: "#9ca3af", fontSize: 11 }} label={{ value: "Months to Ship Plan-Aware Coaching", position: "bottom", fill: "#6b7280", fontSize: 11 }} />
            <YAxis type="number" dataKey="impact" name="Impact" tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[0, 10]} label={{ value: "Impact (1-10)", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }} />
            <ZAxis type="number" dataKey="likelihood" range={[100, 500]} name="Likelihood %" />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} formatter={(v, name) => name === "Likelihood %" ? `${v}%` : v} />
            <Scatter data={threatTimeline} name="Competitors">
              {threatTimeline.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3">
          {threatTimeline.map((t, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
              {t.competitor} ({t.likelihood}% likely)
            </div>
          ))}
        </div>
      </div>
      <div className="bg-amber-900 border border-amber-700 rounded-lg p-4">
        <div className="text-amber-300 font-semibold text-sm mb-2">First-Mover Window: 12-18 Months</div>
        <div className="text-xs text-gray-400">The fastest credible response (Hedy AI adding plan input) is 12 months away. Granola (the most dangerous) is 18-24 months. Microsoft is 24-36 months. This window is our runway to establish category leadership and build the plan-matching data moat.</div>
      </div>
    </div>
  );
}

function Positioning() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Strategic Positioning" subtitle="The only product in the 'real-time + plan-aware' quadrant" />
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Positioning Map</h3>
        <div className="font-mono text-xs text-gray-400 whitespace-pre leading-relaxed bg-gray-900 p-4 rounded overflow-x-auto">
{`REAL-TIME COACHING
    ^
    |
    |    [AI MEETING            [Balto]
    |     COPILOT] *           (call center only)
    |
    |  [Hedy AI]    [Poised]   [Outreach Kaia]
    |               (speech     (sales battlecards)
    |                only)
    |
    |  [Read.ai]               [Colibri]
    |  (metrics                (agenda
    |   only)                   tracker)
    |
    +-------------------------------------------------->
    GENERIC                                    PLAN-AWARE
    |
    |  [Granola]    [Otter.ai]   [Gong]
    |  [Fathom]     [Fireflies]  [Chorus]
    |  [tl;dv]
    |                            [Fellow]
    |                            (agendas, no AI)
    |
    POST-MEETING ONLY`}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Against Note-Takers</h3>
          <div className="text-sm text-gray-400 space-y-2">
            <p><span className="text-white font-medium">Positioning:</span> "Note-taking apps remember what you said. We help you say what you planned."</p>
            <p><span className="text-white font-medium">Key differentiator:</span> Forward-looking vs backward-looking. We don't just capture — we coach.</p>
            <p><span className="text-white font-medium">Target switcher:</span> Granola user who still walks out of meetings thinking "I forgot to ask that."</p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Against Sales Coaching</h3>
          <div className="text-sm text-gray-400 space-y-2">
            <p><span className="text-white font-medium">Positioning:</span> "Real-time coaching for everyone, not just sales teams."</p>
            <p><span className="text-white font-medium">Key differentiator:</span> Any meeting type. YOUR plan, not org scripts. $19/mo, not $200/mo.</p>
            <p><span className="text-white font-medium">Target buyer:</span> Founder prepping for investor pitch, exec running a board meeting, manager giving feedback.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FirstMoverWindow() {
  return (
    <div className="space-y-6">
      <SectionHeader title="First-Mover Window" subtitle="12-18 months to establish category leadership" />
      <div className="space-y-4">
        {[
          { name: "Hedy AI", months: 12, likelihood: "45%", detail: "Add plan input layer. Closest to pivoting but early-stage with limited resources.", color: "amber" },
          { name: "Poised", months: 15, likelihood: "25%", detail: "Add content coaching to speech analytics. Significant product pivot from speech coaching DNA.", color: "pink" },
          { name: "Granola", months: 20, likelihood: "35%", detail: "Add real-time coaching. Massive product pivot from backward-looking identity. Has $192M to invest.", color: "red" },
          { name: "Otter.ai", months: 20, likelihood: "20%", detail: "Add coaching + plan awareness. Capture-first DNA, bot-visible model is hard to change.", color: "blue" },
          { name: "Balto", months: 15, likelihood: "15%", detail: "Generalize beyond call center scripts. Entire architecture built for structured, repetitive calls.", color: "green" },
          { name: "Microsoft", months: 30, likelihood: "15%", detail: "Add private coaching to Teams Copilot. Collaborative DNA runs counter to private coaching.", color: "purple" },
        ].map((c, i) => (
          <div key={i} className={`border rounded-lg p-4 border-${c.color}-700 bg-${c.color}-900/10`} style={{ borderColor: `var(--color-${c.color}-700, #555)` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">{c.name}</span>
              <div className="flex gap-3 text-sm">
                <span className="text-gray-400">{c.months} months</span>
                <span className={`px-2 py-0.5 rounded text-xs ${parseInt(c.likelihood) >= 35 ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"}`}>{c.likelihood} likely</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(c.months / 36) * 100}%` }} />
            </div>
            <div className="text-xs text-gray-400">{c.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BattleCards() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Battle Cards" subtitle="How to position against each key competitor" />
      <div className="space-y-4">
        {battleCards.map((card, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-white font-semibold text-lg mb-3">vs. {card.competitor}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-red-400 text-xs uppercase tracking-wider mb-1">Their Pitch</div>
                <div className="text-gray-300">{card.theirPitch}</div>
                <div className="text-red-400 text-xs uppercase tracking-wider mt-3 mb-1">Their Weakness</div>
                <div className="text-gray-400">{card.theirWeakness}</div>
              </div>
              <div>
                <div className="text-green-400 text-xs uppercase tracking-wider mb-1">Our Response</div>
                <div className="text-gray-300 font-medium">{card.ourResponse}</div>
                <div className="text-green-400 text-xs uppercase tracking-wider mt-3 mb-1">Our Strength</div>
                <div className="text-gray-300">{card.ourStrength}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN ---

const tabComponents = [CompetitorMap, FeatureMatrixTab, FundingScale, ThreatAnalysis, Positioning, FirstMoverWindow, BattleCards];

export default function CompetitiveIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = tabComponents[activeTab];
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Competitive Intelligence</h1>
          <p className="text-gray-400 mt-1">AI Meeting Copilot — Competitive Landscape Analysis</p>
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
