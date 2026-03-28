import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, Award, Target, BookOpen, BarChart3, Zap } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { dashAPI, papersAPI, bankAPI } from '../utils/api';
import './Analytics.css';

const BLOOM_COLORS = {
  Remember:'#10b981', Understand:'#3b82f6', Apply:'#8b5cf6',
  Analyze:'#f59e0b',  Evaluate:'#ef4444',  Create:'#14b8a6',
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="tooltip-row">
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats]         = useState(null);
  const [monthlyData, setMonthly] = useState([]);
  const [subjectPerf, setSubjectPerf] = useState([]);
  const [bloomData, setBloomData] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await dashAPI.stats();
      const s = data.stats;
      setStats(s);

      // Monthly data from weekly papers (group by month approx)
      if (s.weeklyPapers?.length) {
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const today = new Date().getDay();
        const week = Array.from({ length: 7 }, (_, i) => {
          const idx = (today - 6 + i + 7) % 7;
          const match = s.weeklyPapers.find(w => w._id === idx + 1);
          const count = match?.count || 0;
          return {
            month: days[idx],
            papers: count,
            questions: count * Math.round(s.avgQuestionsPerPaper || 0),
            approved: Math.round(count * Math.round(s.avgQuestionsPerPaper || 0) * (s.approvalRate / 100 || 0.9)),
          };
        });
        setMonthly(week);
      }

      // Subject distribution
      if (s.subjectDist?.length) {
        setSubjectPerf(s.subjectDist.map(d => ({
          subject: d._id || 'Unknown',
          papers: d.count,
          avgQuestions: Math.round(s.avgQuestionsPerPaper || 0),
          avgMarks: s.totalPapers > 0 ? Math.round((s.finalizedPapers / s.totalPapers) * 100) : 0,
        })));
      }

      // Bloom's distribution
      if (s.bloomsDist?.length) {
        setBloomData(s.bloomsDist.map(d => ({
          level: d._id,
          value: d.count,
          color: BLOOM_COLORS[d._id] || '#888',
        })));
      }

    } catch (e) {
      console.error('Analytics error:', e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    { icon:<BarChart3 size={18}/>, label:'Papers This Week', value: stats?.weeklyPapers?.reduce((s,w) => s+w.count,0) ?? 0,   color:'blue'   },
    { icon:<Zap size={18}/>,       label:'Questions in Bank', value: stats?.totalQuestions ?? 0,                               color:'purple' },
    { icon:<Target size={18}/>,    label:'Approval Rate',    value: `${stats?.approvalRate ?? 0}%`,                           color:'green'  },
    { icon:<Award size={18}/>,     label:"Bloom's Levels",   value: stats?.bloomsDist?.length ?? 0,                           color:'amber'  },
    { icon:<BookOpen size={18}/>,  label:'Active Subjects',  value: stats?.totalSubjects ?? 0,                                color:'teal'   },
    { icon:<TrendingUp size={18}/>,label:'Avg Qs/Paper',     value: Math.round(stats?.avgQuestionsPerPaper ?? 0),             color:'pink'   },
  ];

  return (
    <AppLayout>
      <div className="analytics-page animate-fade-in">

        {/* KPI row */}
        <div className="kpi-row">
          {kpis.map(k => (
            <div key={k.label} className={`kpi-card kpi-${k.color}`}>
              <div className="kpi-top">
                <div className={`kpi-icon kpi-icon-${k.color}`}>{k.icon}</div>
              </div>
              {loading
                ? <div className="skeleton" style={{ height:32, width:60, marginBottom:4 }}/>
                : <div className="kpi-value">{k.value}</div>
              }
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Main charts */}
        <div className="analytics-row-wide">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Weekly Generation Activity</h3>
                <p className="chart-subtitle">Papers and questions this week</p>
              </div>
            </div>
            {loading ? <div className="skeleton" style={{ height:220 }}/> : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top:8, right:8, bottom:0, left:-20 }}>
                  <defs>
                    <linearGradient id="gQ2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gA2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill:'#505a6b', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#505a6b', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="questions" name="Generated" stroke="#3b82f6" strokeWidth={2} fill="url(#gQ2)"/>
                  <Area type="monotone" dataKey="approved"  name="Approved"  stroke="#10b981" strokeWidth={2} fill="url(#gA2)"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart" style={{ height:220 }}>No activity yet — generate some papers!</div>
            )}
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Approval Rate</h3>
                <p className="chart-subtitle">Finalized vs total papers</p>
              </div>
            </div>
            {loading ? <div className="skeleton" style={{ height:220 }}/> : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:220, gap:12 }}>
                <div style={{ fontSize:'3.5rem', fontFamily:'var(--font-display)', color:'var(--green)', lineHeight:1 }}>
                  {stats?.approvalRate ?? 0}%
                </div>
                <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
                  {stats?.finalizedPapers ?? 0} finalized out of {stats?.totalPapers ?? 0} papers
                </div>
                <div className="progress-bar" style={{ width:'80%' }}>
                  <div className="progress-bar-fill green" style={{ width:`${stats?.approvalRate ?? 0}%` }}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2nd row */}
        <div className="analytics-row-3">
          {/* Bloom's radar */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Bloom's Taxonomy</h3>
                <p className="chart-subtitle">Cognitive level coverage</p>
              </div>
            </div>
            {loading ? <div className="skeleton" style={{ height:220 }}/> : bloomData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={bloomData.map(d => ({ level: d.level, value: d.value }))} cx="50%" cy="50%" outerRadius={75}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)"/>
                  <PolarAngleAxis dataKey="level" tick={{ fill:'#8b95a8', fontSize:10 }}/>
                  <Radar name="Questions" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2}/>
                  <Tooltip contentStyle={{ background:'#1a2234', border:'1px solid #1e2a3a', borderRadius:8, fontSize:12 }}/>
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart" style={{ height:220 }}>Enable Bloom's tagging when generating</div>
            )}
          </div>

          {/* Subject bar */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Papers by Subject</h3>
                <p className="chart-subtitle">Count per subject</p>
              </div>
            </div>
            {loading ? <div className="skeleton" style={{ height:220 }}/> : subjectPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjectPerf} layout="vertical" margin={{ top:4, right:12, bottom:0, left:8 }} barSize={12}>
                  <XAxis type="number" tick={{ fill:'#505a6b', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="subject" width={100} tick={{ fill:'#8b95a8', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="papers" name="Papers" radius={[0,4,4,0]}>
                    {subjectPerf.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#3b82f6' : '#8b5cf6'}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart" style={{ height:220 }}>No papers yet</div>
            )}
          </div>

          {/* Quick stats */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Quick Stats</h3>
                <p className="chart-subtitle">Overall summary</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'8px 0' }}>
              {[
                { label:'Total Papers',       value: stats?.totalPapers      ?? 0 },
                { label:'Finalized Papers',   value: stats?.finalizedPapers  ?? 0 },
                { label:'Questions in Bank',  value: stats?.totalQuestions   ?? 0 },
                { label:'Total Downloads',    value: stats?.totalDownloads   ?? 0 },
                { label:'This Month',         value: stats?.thisMonthQuestions ?? 0 },
                { label:'Draft Papers',       value: stats?.pendingReview    ?? 0 },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{s.label}</span>
                  {loading
                    ? <div className="skeleton" style={{ height:16, width:40 }}/>
                    : <span style={{ fontSize:14, fontFamily:'var(--font-mono)', color:'var(--text-primary)', fontWeight:500 }}>{s.value}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject table */}
        {subjectPerf.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Subject Breakdown</h3>
            </div>
            <table className="papers-table analytics-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Papers</th>
                  <th>Avg Questions</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {subjectPerf.map(s => (
                  <tr key={s.subject} className="paper-row">
                    <td style={{ color:'var(--text-primary)', fontWeight:500 }}>{s.subject}</td>
                    <td className="num-cell">{s.papers}</td>
                    <td className="num-cell">{s.avgQuestions}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-bar" style={{ flex:1 }}>
                          <div className="progress-bar-fill"
                            style={{ width:`${stats?.totalPapers ? Math.round((s.papers/stats.totalPapers)*100) : 0}%` }}/>
                        </div>
                        <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-secondary)', minWidth:30 }}>
                          {stats?.totalPapers ? Math.round((s.papers/stats.totalPapers)*100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
