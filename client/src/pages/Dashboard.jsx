import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  FileText, Database, Zap, TrendingUp, Plus,
  Clock, CheckCircle2, AlertCircle, BookOpen,
  Target, Award, ChevronRight, Download, Eye, MoreHorizontal
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { dashAPI, papersAPI } from '../utils/api';
import { useAuthStore } from '../store';
import './Dashboard.css';

const QTYPE_META = {
  mcq:       { name:'MCQ',        color:'#3b82f6' },
  short:     { name:'Short Ans',  color:'#10b981' },
  long:      { name:'Long Ans',   color:'#8b5cf6' },
  truefalse: { name:'True/False', color:'#f59e0b' },
  fillblank: { name:'Fill Blank', color:'#14b8a6' },
};
const BLOOM_COLORS = {
  Remember:'#10b981', Understand:'#3b82f6', Apply:'#8b5cf6',
  Analyze:'#f59e0b',  Evaluate:'#ef4444',   Create:'#14b8a6',
};
const STATUS_BADGE = {
  finalized:  { label:'Finalized',  cls:'badge-green' },
  draft:      { label:'Draft',      cls:'badge-amber' },
  generating: { label:'Generating', cls:'badge-blue'  },
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

function StatCard({ icon, label, value, color, subtext, loading }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-top">
        <div className={`stat-icon stat-icon-${color}`}>{icon}</div>
      </div>
      {loading
        ? <div className="skeleton" style={{ height:36, width:80, marginBottom:6 }}/>
        : <div className="stat-value">{value ?? '—'}</div>
      }
      <div className="stat-label">{label}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), dy = Math.floor(diff/86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${dy}d ago`;
};

export default function Dashboard() {
  const { user }   = useAuthStore();
  const [stats, setStats]         = useState(null);
  const [papers, setPapers]       = useState([]);
  const [activity, setActivity]   = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [qtypeDist, setQtypeDist] = useState([]);
  const [bloomDist, setBloomDist] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, aRes] = await Promise.all([
        dashAPI.stats(),
        papersAPI.getAll({ limit: 5 }),
        dashAPI.recentActivity(),
      ]);

      const s = sRes.data.stats;
      setStats(s);
      setPapers(pRes.data.papers || []);
      setActivity(aRes.data.activity || []);

      // Build weekly chart
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const today = new Date().getDay();
      const week = Array.from({ length: 7 }, (_, i) => {
        const idx = (today - 6 + i + 7) % 7;
        const match = s.weeklyPapers?.find(w => w._id === idx + 1);
        const count = match?.count || 0;
        return { day: days[idx], papers: count, questions: count * Math.round(s.avgQuestionsPerPaper || 0) };
      });
      setWeeklyData(week);

      // Question type dist
      if (s.questionTypeDist?.length) {
        setQtypeDist(s.questionTypeDist.map(d => ({
          name:  QTYPE_META[d._id]?.name  || d._id,
          value: d.count,
          color: QTYPE_META[d._id]?.color || '#888',
        })));
      }

      // Bloom's dist
      if (s.bloomsDist?.length) {
        setBloomDist(s.bloomsDist.map(d => ({
          level: d._id,
          count: d.count,
          color: BLOOM_COLORS[d._id] || '#888',
        })));
      }

    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <AppLayout>
      <div className="dashboard animate-fade-in">

        {/* Welcome */}
        <div className="welcome-banner">
          <div className="welcome-text">
            <h2 className="welcome-heading">
              Good {greeting}, <em>{user?.name?.split(' ')[0] || 'Professor'}</em> 👋
            </h2>
            <p>
              {loading ? 'Loading your activity…'
                : stats?.totalPapers === 0
                ? 'Welcome! Generate your first exam paper to get started.'
                : `You have ${stats?.totalPapers} papers and ${stats?.totalQuestions} questions in your bank.`
              }
            </p>
          </div>
          <Link to="/generate" className="btn btn-primary">
            <Plus size={15}/> Generate New Paper
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon={<FileText size={18}/>}  label="Total Papers"         value={stats?.totalPapers}       color="blue"   subtext={`${stats?.finalizedPapers ?? 0} finalized`}              loading={loading}/>
          <StatCard icon={<Database size={18}/>}  label="Questions in Bank"    value={stats?.totalQuestions}    color="purple" subtext={`Across ${stats?.totalSubjects ?? 0} subjects`}          loading={loading}/>
          <StatCard icon={<Zap size={18}/>}       label="Generated This Month" value={stats?.thisMonthQuestions} color="green" subtext="This month"                                               loading={loading}/>
          <StatCard icon={<Award size={18}/>}     label="Avg Questions/Paper"  value={stats?.avgQuestionsPerPaper ? Math.round(stats.avgQuestionsPerPaper) : 0} color="amber" subtext="Per paper" loading={loading}/>
        </div>

        {/* Charts row */}
        <div className="charts-row">
          <div className="chart-card chart-card-wide">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Generation Activity</h3>
                <p className="chart-subtitle">Papers &amp; questions this week</p>
              </div>
            </div>
            {loading ? <div className="skeleton" style={{ height:200 }}/> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyData} margin={{ top:8, right:8, bottom:0, left:-20 }}>
                  <defs>
                    <linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill:'#505a6b', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#505a6b', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="questions" name="Questions" stroke="#3b82f6" strokeWidth={2} fill="url(#gQ)"/>
                  <Area type="monotone" dataKey="papers"    name="Papers"    stroke="#10b981" strokeWidth={2} fill="url(#gP)"/>
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="chart-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background:'#3b82f6' }}/>Questions</div>
              <div className="legend-item"><span className="legend-dot" style={{ background:'#10b981' }}/>Papers</div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Question Types</h3>
                <p className="chart-subtitle">In your question bank</p>
              </div>
            </div>
            {loading ? <div className="skeleton" style={{ height:180 }}/> : qtypeDist.length > 0 ? (
              <div className="pie-wrapper">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={qtypeDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {qtypeDist.map((e,i) => <Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v) => [v,'Questions']} contentStyle={{ background:'#1a2234', border:'1px solid #1e2a3a', borderRadius:8, fontSize:12 }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {qtypeDist.map(d => (
                    <div key={d.name} className="pie-legend-row">
                      <span className="legend-dot" style={{ background:d.color }}/>
                      <span className="pie-legend-name">{d.name}</span>
                      <span className="pie-legend-val">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart">Save questions to bank to see distribution</div>
            )}
          </div>
        </div>

        {/* Bloom's + Quick stats */}
        <div className="lower-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Bloom's Taxonomy</h3>
                <p className="chart-subtitle">Cognitive level distribution</p>
              </div>
            </div>
            {loading ? <div className="skeleton" style={{ height:180 }}/> : bloomDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={bloomDist} margin={{ top:4, right:4, bottom:0, left:-24 }} barSize={18}>
                  <XAxis dataKey="level" tick={{ fill:'#505a6b', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#505a6b', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="count" name="Questions" radius={[4,4,0,0]}>
                    {bloomDist.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">Generate papers with Bloom's tagging enabled to see data</div>
            )}
          </div>

          <div className="quick-stats">
            {[
              { icon:<Target size={16}/>,       color:'blue',   val: stats?.approvalRate   ? `${stats.approvalRate}%`   : '0%', label:'Approval rate'    },
              { icon:<CheckCircle2 size={16}/>,  color:'green',  val: stats?.finalizedPapers ?? 0,                               label:'Finalized papers' },
              { icon:<BookOpen size={16}/>,      color:'purple', val: stats?.totalSubjects   ?? 0,                               label:'Active subjects'  },
              { icon:<Clock size={16}/>,         color:'amber',  val: stats?.avgGenTime      ? `${stats.avgGenTime}m`    : '—',  label:'Avg gen time'     },
              { icon:<Download size={16}/>,      color:'teal',   val: stats?.totalDownloads  ?? 0,                               label:'Total downloads'  },
              { icon:<AlertCircle size={16}/>,   color:'red',    val: stats?.pendingReview   ?? 0,                               label:'Pending review'   },
            ].map(s => (
              <div key={s.label} className="quick-stat-card">
                <div className={`qs-icon ${s.color}`}>{s.icon}</div>
                <div className="qs-body">
                  {loading
                    ? <div className="skeleton" style={{ height:20, width:40 }}/>
                    : <span className="qs-val">{s.val}</span>
                  }
                  <span className="qs-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent papers + Activity */}
        <div className="bottom-row">
          <div className="recent-papers-card">
            <div className="section-header">
              <h3 className="section-title">Recent Papers</h3>
              <Link to="/papers" className="section-link">View all <ChevronRight size={13}/></Link>
            </div>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:44, marginBottom:8 }}/>)
            ) : papers.length === 0 ? (
              <div className="empty-chart" style={{ padding:'32px 0' }}>
                No papers yet — <Link to="/generate">generate your first one!</Link>
              </div>
            ) : (
              <table className="papers-table">
                <thead>
                  <tr>
                    <th>Title</th><th>Subject</th><th>Questions</th>
                    <th>Marks</th><th>Status</th><th>Created</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map(p => (
                    <tr key={p._id} className="paper-row">
                      <td className="paper-title-cell">
                        <FileText size={14} className="paper-icon"/>
                        <span>{p.title}</span>
                      </td>
                      <td><span className="badge badge-gray">{p.subjectCode || p.subject}</span></td>
                      <td className="num-cell">{p.questions?.length ?? 0}</td>
                      <td className="num-cell">{p.totalMarks}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[p.status]?.cls || 'badge-gray'} badge-dot`}>
                          {STATUS_BADGE[p.status]?.label || p.status}
                        </span>
                      </td>
                      <td className="time-cell">{timeAgo(p.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          <Link to="/papers" className="btn btn-ghost btn-sm btn-icon"><Eye size={13}/></Link>
                          <button className="btn btn-ghost btn-sm btn-icon"><Download size={13}/></button>
                          <button className="btn btn-ghost btn-sm btn-icon"><MoreHorizontal size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="activity-card">
            <div className="section-header">
              <h3 className="section-title">Activity</h3>
              <span className="badge badge-green badge-dot">Live</span>
            </div>
            <div className="activity-feed">
              {loading ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="activity-item">
                    <div className="skeleton" style={{ width:28, height:28, borderRadius:8, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div className="skeleton" style={{ height:12, marginBottom:4 }}/>
                      <div className="skeleton" style={{ height:10, width:'60%' }}/>
                    </div>
                  </div>
                ))
              ) : activity.length === 0 ? (
                <div className="empty-chart" style={{ padding:'20px 0', fontSize:13 }}>No activity yet</div>
              ) : (
                activity.map((item, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-icon activity-icon-${item.type === 'finalized' ? 'green' : 'blue'}`}>
                      {item.type === 'finalized' ? <CheckCircle2 size={14}/> : <FileText size={14}/>}
                    </div>
                    <div className="activity-body">
                      <p className="activity-text">{item.message}</p>
                      <span className="activity-time">{timeAgo(item.time)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
