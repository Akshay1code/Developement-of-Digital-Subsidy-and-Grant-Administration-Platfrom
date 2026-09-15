import '../styles/Dashboard.css';
import { useEffect, useState, useRef } from "react";
import { useDashboardAnalytics } from "../hooks/useDashboardAnalytics";
import { getProfilesByRole } from "../services/adminService";
import { motion, AnimatePresence, useMotionValue, animate, useInView } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import AdminLayout from "../components/AdminLayout";

/* ── Tooltip style ── */
const TT = {
  background: '#ffffff',
  border: '1px solid #E4EAE7',
  borderRadius: 8,
  fontSize: 12,
  color: '#162238',
  padding: '8px 12px',
  boxShadow: '0 4px 16px rgba(20,70,45,0.08)',
};

/* ── Animated counter ── */
function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    const unsub = mv.on("change", (v) => {
      setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-IN"));
    });
    return () => { controls.stop(); unsub(); };
  }, [inView, value, decimals, mv]);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

/* ── White card ── */
function Card({ children, style }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-card)',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Chart label ── */
function ChartLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem',
    }}>
      {children}
    </div>
  );
}

/* ── Color legend ── */
function Legend({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginTop: '1rem' }}>
      {items.map((it) => (
        <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: it.color, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{it.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Animated progress bar ── */
function ProgressBar({ value, color = 'var(--brand-green)', max = 100 }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'var(--border-soft)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: '100%', background: color, borderRadius: 3 }}
      />
    </div>
  );
}

/* ── Tab button ── */
function TabBtn({ id, label, icon, active, onClick, badge }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.65rem 1.1rem',
        background: active ? 'var(--green-xlight)' : 'transparent',
        color: active ? 'var(--brand-green-deep)' : 'var(--text-muted)',
        fontSize: '0.875rem', fontWeight: active ? 700 : 500,
        cursor: 'pointer', border: 'none',
        borderBottom: active ? '2px solid var(--brand-green)' : '2px solid transparent',
        borderRadius: '8px 8px 0 0',
        transition: 'all 160ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{icon}</span>
      {label}
      {badge != null && badge > 0 && (
        <span style={{
          display: 'inline-grid', placeItems: 'center',
          minWidth: 18, height: 18, padding: '0 4px',
          borderRadius: 9, background: 'var(--brand-green)',
          color: '#fff', fontSize: '0.68rem', fontWeight: 800,
        }}>{badge}</span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function SchemeDashboard() {
  const { data, loading, error } = useDashboardAnalytics();
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    statusData, categoryApplications, schemeApplications, schemeFundUsage,
    categoryAmounts, monthly, sparkline, officerQueue, flagReasons,
    rejectionReasons, schemeTable, kpis, fundSummary,
    disbursedPct, approvalRate, pendingCount, awaitingDisbursement, flaggedCount,
    avgApprovalDays, avgDisbursementDays, missingDocsPct,
  } = data;

  useEffect(() => {
    let cancelled = false;
    getProfilesByRole('FIELD_OFFICER')
      .then(res => { if (!cancelled) setOfficers(Array.isArray(res) ? res : res?.data || []); })
      .catch(() => { if (!cancelled) setOfficers([]); })
      .finally(() => { if (!cancelled) setOfficersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const tabs = [
    { id: 'overview',  label: 'Overview',        icon: '📊' },
    { id: 'status',    label: 'Status & Funds',  icon: '💰' },
    { id: 'schemes',   label: 'Scheme Analytics', icon: '📋' },
    { id: 'trends',    label: 'Trends',           icon: '📈' },
    { id: 'queue',     label: 'Queue & Risk',     icon: '⚠️', badge: flaggedCount },
    { id: 'officers',  label: 'Officers',         icon: '👥', badge: officers.length },
  ];

  return (
    <AdminLayout activeTab={null} onTabChange={() => {}} userName="" userRole="Analytics">

      {/* ── Page title ── */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
            National Welfare Schemes Division · FY 2025–26
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Scheme Disbursement Register
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Live analytics across all active welfare schemes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {loading && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-pill)', background: 'var(--green-xlight)', border: '1px solid var(--border-green)', fontSize: '0.78rem', color: 'var(--brand-green)', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-green)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              Loading…
            </span>
          )}
          {error && (
            <span style={{ padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-pill)', background: '#FEF2F2', border: '1px solid rgba(185,28,28,0.2)', fontSize: '0.78rem', color: '#B91C1C' }}>
              {error}
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '2px solid var(--border-soft)', marginBottom: '1.75rem' }}>
        {tabs.map(t => (
          <TabBtn key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={setActiveTab} badge={t.badge} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB CONTENT
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div>
              {/* Pane header */}
              <div className="pane-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 700, margin: 0 }}>Key Performance Indicators</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>High-level metrics across all welfare schemes</p>
              </div>

              {/* KPI cards — 3 cols */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {kpis.map((k, i) => (
                  <Card key={k.no} style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--brand-green), var(--brand-green-2))', borderRadius: '20px 20px 0 0' }} />
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>KPI {k.no}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                      <AnimatedNumber value={k.value} prefix={k.prefix} suffix={k.suffix} decimals={k.value % 1 !== 0 ? 1 : 0} />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>{k.label}</div>
                  </Card>
                ))}
              </div>

              {/* Summary row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'Disbursed', value: disbursedPct, suffix: '%', color: 'var(--brand-green)' },
                  { label: 'Approval Rate', value: approvalRate, suffix: '%', color: 'var(--brand-green)' },
                  { label: 'Pending Review', value: pendingCount, color: '#F59E0B' },
                  { label: 'Flagged Cases', value: flaggedCount, color: '#EF4444' },
                ].map(m => (
                  <Card key={m.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>
                      <AnimatedNumber value={m.value} suffix={m.suffix || ''} />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── STATUS & FUNDS ── */}
          {activeTab === 'status' && (
            <div>
              <div className="pane-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 700, margin: 0 }}>Application Status & Fund Distribution</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status breakdown and fund utilisation across all schemes</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Donut */}
                <Card>
                  <ChartLabel>Application status breakdown</ChartLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ width: 200, height: 200, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={2}>
                            {statusData.map((d) => <Cell key={d.name} fill={d.color} stroke="#fff" strokeWidth={2} />)}
                          </Pie>
                          <Tooltip contentStyle={TT} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {statusData.map(d => (
                        <div key={d.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                              {d.name}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>{d.value}</span>
                          </div>
                          <ProgressBar value={d.value} max={Math.max(...statusData.map(x => x.value))} color={d.color} />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Fund utilisation */}
                <Card>
                  <ChartLabel>Fund utilisation</ChartLabel>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-soft)' }}>Disbursed vs Allocated</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--brand-green)', fontWeight: 800 }}>{disbursedPct.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={disbursedPct} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {fundSummary.map((f) => (
                      <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-soft)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{f.label}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: f.tone || 'var(--text)', fontWeight: 800 }}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Category bar */}
              <Card>
                <ChartLabel>Applications by category</ChartLabel>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryApplications} layout="vertical" margin={{ left: 16, right: 24 }}>
                    <XAxis type="number" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fill: 'var(--text-soft)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TT} cursor={{ fill: 'var(--bg-subtle)' }} />
                    <Bar dataKey="value" fill="var(--brand-green)" radius={[0, 6, 6, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* ── SCHEME ANALYTICS ── */}
          {activeTab === 'schemes' && (
            <div>
              <div className="pane-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 700, margin: 0 }}>Scheme-wise Analytics</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Applications and fund usage broken down by individual scheme</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Bar — schemes */}
                <Card>
                  <ChartLabel>Applications per scheme</ChartLabel>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={schemeApplications} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={200} tick={{ fill: 'var(--text-soft)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TT} cursor={{ fill: 'var(--bg-subtle)' }} />
                      <Bar dataKey="value" fill="var(--brand-green-2)" radius={[0, 6, 6, 0]} barSize={18} label={{ position: 'right', fontSize: 11, fill: 'var(--text-muted)' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Scheme register table */}
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scheme Register</div>
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: 350 }}>
                    {schemeTable.map((s, i) => (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.5rem', borderBottom: i < schemeTable.length - 1 ? '1px solid var(--border-soft)' : 'none', transition: 'background 150ms ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--green-xlight)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.active ? 'var(--brand-green)' : 'var(--text-faint)', flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 2 }}>{s.category}</div>
                          </div>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>{s.apps}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Fund usage donut */}
              <Card>
                <ChartLabel>Fund usage per scheme (₹ Cr)</ChartLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 260, height: 260, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={schemeFundUsage} dataKey="value" nameKey="name" innerRadius={70} outerRadius={118} paddingAngle={2}>
                          {schemeFundUsage.map((d) => <Cell key={d.name} fill={d.color} stroke="#fff" strokeWidth={2} />)}
                        </Pie>
                        <Tooltip contentStyle={TT} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 240 }}>
                    {schemeFundUsage.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)', flex: 1 }}>{d.name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>₹{d.value} Cr</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── TRENDS ── */}
          {activeTab === 'trends' && (
            <div>
              <div className="pane-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 700, margin: 0 }}>Processing Trends</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monthly application and disbursement patterns over 12 months</p>
              </div>

              <Card style={{ marginBottom: '1.25rem' }}>
                <ChartLabel>Applications vs disbursements (monthly)</ChartLabel>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthly} margin={{ left: 8, right: 24, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="var(--border-soft)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-soft)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TT} />
                    <Line type="monotone" dataKey="applications" stroke="#93C5FD" strokeWidth={2.5} dot={{ r: 3, fill: '#93C5FD' }} />
                    <Line type="monotone" dataKey="disbursements" stroke="var(--brand-green)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--brand-green)' }} />
                  </LineChart>
                </ResponsiveContainer>
                <Legend items={[{ name: 'Applications', color: '#93C5FD' }, { name: 'Disbursements', color: 'var(--brand-green)' }]} />
              </Card>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Sparkline area */}
                <Card>
                  <ChartLabel>Approvals vs rejections — last 7 days</ChartLabel>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={sparkline} margin={{ left: 8, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="apprGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--brand-green)" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="var(--brand-green)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rejGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" stroke="var(--border-soft)" vertical={false} />
                      <XAxis dataKey="d" tick={{ fill: 'var(--text-faint)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TT} />
                      <Area type="monotone" dataKey="approved" stroke="var(--brand-green)" fill="url(#apprGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="rejected" stroke="#EF4444" fill="url(#rejGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <Legend items={[{ name: 'Approved', color: 'var(--brand-green)' }, { name: 'Rejected', color: '#EF4444' }]} />
                </Card>

                {/* Category fund stacked bar */}
                <Card>
                  <ChartLabel>Category fund breakdown (₹ Cr)</ChartLabel>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryAmounts} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 6" stroke="var(--border-soft)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-faint)', fontSize: 10 }} axisLine={{ stroke: 'var(--border-soft)' }} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TT} cursor={{ fill: 'var(--bg-subtle)' }} />
                      <Bar dataKey="sanctioned" stackId="a" fill="#BFDBFE" barSize={28} />
                      <Bar dataKey="disbursed" stackId="a" fill="var(--brand-green)" barSize={28} />
                      <Bar dataKey="remaining" stackId="a" fill="#F4C542" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Legend items={[{ name: 'Sanctioned', color: '#BFDBFE' }, { name: 'Disbursed', color: 'var(--brand-green)' }, { name: 'Remaining', color: '#F4C542' }]} />
                </Card>
              </div>
            </div>
          )}

          {/* ── QUEUE & RISK ── */}
          {activeTab === 'queue' && (
            <div>
              <div className="pane-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 700, margin: 0 }}>Queue & Risk Flags</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monitor pending queues, flagged cases, and approval performance</p>
              </div>

              {/* Stat row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Pending applications', value: pendingCount, color: '#F59E0B' },
                  { label: 'Awaiting disbursement', value: awaitingDisbursement, color: 'var(--brand-green)' },
                  { label: 'Flagged cases', value: flaggedCount, color: '#EF4444' },
                  { label: 'Missing docs %', value: missingDocsPct, suffix: '%', color: '#EF4444' },
                ].map(m => (
                  <Card key={m.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>
                      <AnimatedNumber value={m.value} suffix={m.suffix || ''} />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>{m.label}</div>
                  </Card>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Officer queue bar */}
                <Card>
                  <ChartLabel>Queue size by officer</ChartLabel>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={officerQueue} layout="vertical" margin={{ left: 8, right: 32 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-soft)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TT} cursor={{ fill: 'var(--bg-subtle)' }} />
                      <Bar dataKey="value" fill="var(--brand-green)" radius={[0, 6, 6, 0]} barSize={18} label={{ position: 'right', fontSize: 11, fill: 'var(--text-muted)' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Flag reasons */}
                <Card>
                  <ChartLabel>Top flag reasons</ChartLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {flagReasons.map((f) => (
                      <div key={f.reason}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>{f.reason}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#EF4444', fontWeight: 700 }}>{f.count}</span>
                        </div>
                        <ProgressBar value={f.count} max={flagReasons[0]?.count || 1} color="#EF4444" />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Approval performance */}
              <Card>
                <ChartLabel>Approval performance</ChartLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={9} data={[{ value: approvalRate, fill: 'var(--brand-green)' }]} startAngle={90} endAngle={-270}>
                          <RadialBar dataKey="value" cornerRadius={5} background={{ fill: 'var(--border-soft)' }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: 'var(--brand-green)', lineHeight: 1 }}>
                        <AnimatedNumber value={approvalRate} suffix="%" />
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Approval rate</div>
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-soft)', paddingLeft: '2rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Avg. time to approval</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
                      <AnimatedNumber value={avgApprovalDays} /> <span style={{ fontSize: '0.875rem', color: 'var(--text-faint)', fontWeight: 400 }}>days</span>
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-soft)', paddingLeft: '2rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Avg. time to disbursement</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
                      <AnimatedNumber value={avgDisbursementDays} /> <span style={{ fontSize: '0.875rem', color: 'var(--text-faint)', fontWeight: 400 }}>days</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── OFFICERS ── */}
          {activeTab === 'officers' && (
            <div>
              <div className="pane-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 700, margin: 0 }}>Field Officer Directory</h2>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Profile details only — use the officer dashboard for approvals and rejections</p>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--brand-green)', fontWeight: 700, background: 'var(--green-xlight)', padding: '4px 12px', borderRadius: '99px', border: '1px solid var(--border-green)' }}>
                  {officers.length} records
                </span>
              </div>

              {/* Info banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', background: 'var(--green-xlight)', border: '1px solid var(--border-green)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--brand-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>i</div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
                  <strong>Need to approve or reject applications?</strong> Use the Application Management tab inside each officer's dashboard. This directory is read-only.
                </span>
              </div>

              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                        {['Full Name', 'Officer ID', 'Mobile No', 'Region / District', 'State', 'Email'].map(h => (
                          <th key={h} style={{ padding: '0.875rem 1.25rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {officersLoading ? (
                        <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading officer profiles…</td></tr>
                      ) : officers.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No officer profiles found.</td></tr>
                      ) : (
                        officers.map((officer, idx) => (
                          <tr
                            key={officer.officerId || officer.uniqueID || officer.uniqueId || officer.id || idx}
                            style={{ borderBottom: '1px solid var(--border-soft)', transition: 'background 150ms ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--green-xlight)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}
                          >
                            <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text)' }}>{officer.fullName || officer.name || 'Unnamed Officer'}</td>
                            <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{officer.officerId || officer.uniqueID || officer.uniqueId || officer.id || 'N/A'}</td>
                            <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{officer.mobileNo || officer.phone || officer.mobile || 'N/A'}</td>
                            <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-soft)' }}>{officer.department || officer.region || officer.district || 'District Office'}</td>
                            <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)' }}>{officer.state || 'N/A'}</td>
                            <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)' }}>{officer.email || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </AdminLayout>
  );
}
