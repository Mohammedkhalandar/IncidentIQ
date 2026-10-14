import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Command,
  CircleHelp,
  FileBarChart,
  Filter,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Timer,
  Users,
  X,
  Zap,
  LoaderCircle,
  UserRound,
} from "lucide-react";
import {
  addComment,
  apiErrorMessage,
  assignIncident,
  createIncident,
  getComments,
  getHistory,
  getIncidents,
  getSlaPolicies,
  getSummary,
  getTeams,
  getUsers,
  login,
  transitionIncident,
} from "./api";
import type {
  Comment,
  DashboardSummary,
  HistoryItem,
  Incident,
  Page,
  Priority,
  SlaPolicy,
  Status,
  Team,
  User,
} from "./types";
const zero: DashboardSummary = {
  total: 0,
  open: 0,
  inProgress: 0,
  pending: 0,
  resolved: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  responseBreaches: 0,
  resolutionBreaches: 0,
  slaCompliance: 100,
};
const pretty = (s: string) =>
  s
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
const date = (v?: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-IN", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(v))
    : "—";
const ago = (v: string) => {
  const m = Math.max(
    0,
    Math.round((Date.now() - new Date(v).getTime()) / 60000),
  );
  return m < 60
    ? `${m}m ago`
    : m < 1440
      ? `${Math.floor(m / 60)}h ago`
      : `${Math.floor(m / 1440)}d ago`;
};
function App() {
  const [token, setToken] = useState(localStorage.getItem("incidentiq_token"));
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("incidentiq_user") || "null");
    } catch {
      return null;
    }
  });
  const [loginError, setLoginError] = useState("");
  const [logging, setLogging] = useState(false);
  const [summary, setSummary] = useState(zero);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pageData, setPageData] = useState<Page<Incident> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const loc = useLocation(),
    nav = useNavigate();
  const refresh = () => setReload((n) => n + 1);
  const notify = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(""), 3000);
  };
  useEffect(() => {
    const handler = () => {
      setToken(null);
      setUser(null);
      nav("/login");
    };
    window.addEventListener("incidentiq:unauthorized", handler);
    return () => window.removeEventListener("incidentiq:unauthorized", handler);
  }, [nav]);
  useEffect(() => {
    if (!token) {
      if (loc.pathname !== "/login") nav("/login");
      return;
    }
    if (loc.pathname === "/login") nav("/");
    let live = true;
    setLoading(true);
    setError("");
    Promise.all([
      getSummary(),
      getIncidents({
        page,
        size: 8,
        search: search || undefined,
        status,
        priority,
      }),
      getUsers(),
      getTeams(),
    ])
      .then(([s, p, u, t]) => {
        if (!live) return;
        setSummary(s);
        setPageData(p);
        setIncidents(p.content);
        setUsers(u);
        setTeams(t);
      })
      .catch((e: unknown) => {
        if (live)
          setError(
            apiErrorMessage(
              e,
              "Cannot reach the API. Start MySQL and Spring Boot, then retry.",
            ),
          );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, loc.pathname, page, search, status, priority, reload, nav]);
  const logout = () => {
    localStorage.removeItem("incidentiq_token");
    localStorage.removeItem("incidentiq_user");
    setToken(null);
    setUser(null);
    nav("/login");
  };
  const submitLogin = async (email: string, password: string) => {
    setLogging(true);
    setLoginError("");
    try {
      const r = await login(email, password);
      localStorage.setItem("incidentiq_token", r.token);
      localStorage.setItem("incidentiq_user", JSON.stringify(r.user));
      setToken(r.token);
      setUser(r.user);
      nav("/");
    } catch (e: unknown) {
      setLoginError(
        apiErrorMessage(
          e,
          "Sign-in failed. Check your credentials and API connection.",
        ),
      );
    } finally {
      setLogging(false);
    }
  };
  if (!token || loc.pathname === "/login")
    return <Login onLogin={submitLogin} error={loginError} loading={logging} />;
  const pageTitle: Record<string, string> = {
    "/": "Overview",
    "/incidents": "Incidents",
    "/teams": "Teams & people",
    "/reports": "Reports",
    "/sla": "SLA policies",
    "/settings": "Settings",
  };
  return (
    <div className="shell">
      <aside className={`sidebar ${navOpen ? "opened" : ""}`}>
        <div className="brand">
          <div className="brandmark">
            <Activity size={21} />
          </div>
          <div>
            <strong>
              incident<span>iq</span>
            </strong>
            <small>RESPONSE PLATFORM</small>
          </div>
          <button
            className="icon mobile-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
        <div className="workspace">
          <div className="workspace-icon">
            <Command size={16} />
          </div>
          <div>
            <strong>IncidentIQ</strong>
            <small>Team workspace</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="navlabel">WORKSPACE</div>
        <nav>
          <NavLink
            to="/"
            end
            onClick={() => setNavOpen(false)}
            className={({ isActive }) =>
              isActive ? "navitem active" : "navitem"
            }
          >
            <LayoutDashboard size={18} />
            Overview
          </NavLink>
          <NavLink
            to="/incidents"
            onClick={() => setNavOpen(false)}
            className={({ isActive }) =>
              isActive ? "navitem active" : "navitem"
            }
          >
            <Siren size={18} />
            Incidents{" "}
            <span className="navcount">
              {summary.open + summary.inProgress}
            </span>
          </NavLink>
          <NavLink
            to="/teams"
            onClick={() => setNavOpen(false)}
            className={({ isActive }) =>
              isActive ? "navitem active" : "navitem"
            }
          >
            <Users size={18} />
            Teams & people
          </NavLink>
          <NavLink
            to="/reports"
            onClick={() => setNavOpen(false)}
            className={({ isActive }) =>
              isActive ? "navitem active" : "navitem"
            }
          >
            <FileBarChart size={18} />
            Reports
          </NavLink>
        </nav>
        <div className="navlabel manage">MANAGE</div>
        <nav>
          <NavLink
            to="/sla"
            onClick={() => setNavOpen(false)}
            className={({ isActive }) =>
              isActive ? "navitem active" : "navitem"
            }
          >
            <Clock3 size={18} />
            SLA policies
          </NavLink>
          <NavLink
            to="/settings"
            onClick={() => setNavOpen(false)}
            className={({ isActive }) =>
              isActive ? "navitem active" : "navitem"
            }
          >
            <Settings2 size={18} />
            Settings
          </NavLink>
        </nav>
        <div className="side-spacer" />
        <div className={`system-status ${error ? "offline" : ""}`}>
          <i />
          <div>
            <strong>{error ? "API unavailable" : loading ? "Checking API" : "API connected"}</strong>
            <small>{error ? "Retry after checking the service" : "Workspace data is accessible"}</small>
          </div>
          <Activity size={16} />
        </div>
        <div className="profile">
          <div className="avatar purple">{initials(user?.name || "User")}</div>
          <div>
            <strong>{user?.name}</strong>
            <small>{pretty(user?.role || "REPORTER")}</small>
          </div>
          <button className="icon" onClick={logout} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      {navOpen && (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <main>
        <header className="topbar">
          <div className="crumb">
            <button
              className="icon mobile-menu"
              type="button"
              aria-label="Open navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              <Menu size={18} />
            </button>
            <span>Workspace</span>
            <b>/</b>
            <strong>{pageTitle[loc.pathname] || "Overview"}</strong>
          </div>
          <div className="top-actions">
            <span className={`connection ${error ? "offline" : ""}`}>
              <i /> {error ? "API unavailable" : loading ? "Checking API" : "API connected"}
            </span>
          </div>
        </header>
        <div className="page">
          {error && (
            <div className="error">
              <AlertCircle size={17} />
              <span>{error}</span>
              <button className="btn secondary small" onClick={refresh}>
                Retry
              </button>
            </div>
          )}
          {loc.pathname === "/" && (
            <Dashboard
              user={user}
              s={summary}
              list={incidents}
              loading={loading}
              onCreate={() => setCreateOpen(true)}
              onSelect={setSelected}
              onAll={() => nav("/incidents")}
              onRefresh={refresh}
            />
          )}
          {loc.pathname === "/incidents" && (
            <IncidentList
              list={incidents}
              pageData={pageData}
              loading={loading}
              search={search}
              setSearch={(v) => {
                setPage(0);
                setSearch(v);
              }}
              status={status}
              setStatus={(v) => {
                setPage(0);
                setStatus(v);
              }}
              priority={priority}
              setPriority={(v) => {
                setPage(0);
                setPriority(v);
              }}
              page={page}
              setPage={setPage}
              onSelect={setSelected}
              onCreate={() => setCreateOpen(true)}
              onRefresh={refresh}
            />
          )}
          {loc.pathname === "/teams" && <Teams users={users} teams={teams} />}
          {loc.pathname === "/reports" && <Reports s={summary} />}
          {loc.pathname === "/sla" && <Sla />}
          {loc.pathname === "/settings" && (
            <Settings user={user} logout={logout} />
          )}
        </div>
        <footer>
          <span>© 2026 IncidentIQ</span>
          <span>
            <i className={error ? "offline" : ""} /> {error ? "API unavailable" : "API connected"}
          </span>
          <span>
            Built for calm in the chaos <b>✳</b>
          </span>
        </footer>
      </main>
      {createOpen && (
        <CreateModal
          teams={teams}
          close={() => setCreateOpen(false)}
          created={(i) => {
            setCreateOpen(false);
            setStatus("");
            setPriority("");
            setSearch("");
            setPage(0);
            refresh();
            notify(`${i.incidentKey} created successfully`);
            setSelected(i);
          }}
        />
      )}
      {selected && (
        <IncidentDrawer
          incident={selected}
          users={users}
          canAssign={user?.role === "ADMIN" || user?.role === "SUPPORT_LEAD"}
          canTransition={
            user?.role === "ADMIN" ||
            user?.role === "SUPPORT_LEAD" ||
            user?.role === "ENGINEER"
          }
          close={() => setSelected(null)}
          updated={(i) => {
            setSelected(i);
            refresh();
            notify("Incident updated successfully");
          }}
          notify={notify}
        />
      )}
      {toast && (
        <div className="toast">
          <span>
            <Check size={15} />
          </span>
          {toast}
          <button className="icon" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
function initials(s: string) {
  return s
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function Login({
  onLogin,
  error,
  loading,
}: {
  onLogin: (e: string, p: string) => void;
  error: string;
  loading: boolean;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  return (
    <div className="login">
      <section className="login-art">
        <div className="brand">
          <div className="brandmark">
            <Activity size={21} />
          </div>
          <div>
            <strong>
              incident<span>iq</span>
            </strong>
            <small>RESPONSE PLATFORM</small>
          </div>
        </div>
        <div className="hero">
          <div className="eyebrow">
            <i /> INCIDENT RESPONSE, REIMAGINED
          </div>
          <h1>
            When things
            <br />
            break,{" "}
            <em>
              move
              <br />
              forward.
            </em>
          </h1>
          <p>
            One calm command center for your team's most critical moments. See
            clearly, act decisively, recover faster.
          </p>
          <div className="proof">
            <div>
              <span>AM</span>
              <span>JL</span>
              <span>SP</span>
              <span>+8</span>
            </div>
            <section>
              <strong>Built for teams that keep things running.</strong>
              <small>From first alert to final resolution.</small>
            </section>
          </div>
        </div>
        <div className="art-footer">
          <span>© 2026 IncidentIQ</span>
          <span>Designed for resilience ✳</span>
        </div>
      </section>
      <section className="login-side">
        <div className="login-card">
          <div className="login-symbol">
            <ShieldCheck size={23} />
          </div>
          <h2>
            Welcome back<span>.</span>
          </h2>
          <p>Sign in to your incident command center.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onLogin(email, password);
            }}
          >
            <label htmlFor="login-email">Work email</label>
            <div className="field">
              <UserRound size={16} />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="labelrow">
              <label htmlFor="login-password">Password</label>
            </div>
            <div className="field">
              <ShieldCheck size={16} />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="btn primary sign-in" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle size={16} className="spin" /> Signing in
                </>
              ) : (
                <>
                  Sign in to workspace <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <div className="secure">
            <ShieldCheck size={14} /> Secure authentication · JWT protected APIs
          </div>
        </div>
      </section>
    </div>
  );
}
function Heading({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div className="heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action}
    </div>
  );
}
function Metric({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: typeof Activity;
  tone: "orange" | "blue" | "green" | "red";
}) {
  return (
    <article className="metric">
      <div className="metric-head">
        <span>{label}</span>
        <i className={tone}>
          <Icon size={18} />
        </i>
      </div>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}
function Dashboard({
  user,
  s,
  list,
  loading,
  onCreate,
  onSelect,
  onAll,
  onRefresh,
}: {
  user: User | null;
  s: DashboardSummary;
  list: Incident[];
  loading: boolean;
  onCreate: () => void;
  onSelect: (i: Incident) => void;
  onAll: () => void;
  onRefresh: () => void;
}) {
  const max = Math.max(s.critical, s.high, s.medium, s.low, 1);
  const bars = [
    ["Critical", s.critical, "critical"],
    ["High", s.high, "high"],
    ["Medium", s.medium, "medium"],
    ["Low", s.low, "low"],
  ] as const;
  return (
    <>
      <Heading
        eyebrow="INCIDENT RESPONSE / COMMAND CENTER"
        title={
          <>
            Good morning, <em>{(user?.name || "team").split(" ")[0]}.</em>
          </>
        }
        desc="Here's what's happening across your incident landscape."
        action={
          <div className="actions">
            <button className="btn secondary" onClick={onRefresh}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="btn primary" onClick={onCreate}>
              <Plus size={16} /> New incident
            </button>
          </div>
        }
      />
      <div className="banner">
        <div className="banner-icon">
          <Activity size={19} />
        </div>
        <div className="banner-copy">
          <strong>Incident response snapshot</strong>
          <small>
            Current workload from incidents recorded in this workspace.
          </small>
        </div>
        <div className="banner-stat">
          <i /> <strong>{s.total}</strong>
          <small>Recorded incidents</small>
        </div>
        <div className="banner-stat">
          <i className="blue-dot" /> <strong>{s.open + s.inProgress}</strong>
          <small>Open & in progress</small>
        </div>
      </div>
      <div className="section-title">
        <div>
          <h2>Operational overview</h2>
          <p>Key metrics for your workspace</p>
        </div>
        <span className="live-label">
          <i /> WORKSPACE SNAPSHOT
        </span>
      </div>
      <div className="metrics">
        <Metric
          label="Open incidents"
          value={s.open}
          caption="Awaiting investigation"
          icon={Siren}
          tone="orange"
        />
        <Metric
          label="In progress"
          value={s.inProgress}
          caption="Actively being worked"
          icon={Activity}
          tone="blue"
        />
        <Metric
          label="SLA compliance"
          value={`${s.slaCompliance}%`}
          caption={`${s.responseBreaches + s.resolutionBreaches} recorded breaches`}
          icon={ShieldCheck}
          tone="green"
        />
        <Metric
          label="Critical priority"
          value={s.critical}
          caption="Requires close attention"
          icon={AlertCircle}
          tone="red"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Recent incidents</h3>
              <small>Latest activity across your workspace</small>
            </div>
            <button className="link-button" onClick={onAll}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {loading && !list.length ? (
            <div className="empty">Loading incidents…</div>
          ) : !list.length ? (
            <div className="empty">
              No incidents yet. Create your first incident.
            </div>
          ) : (
            <div className="recent">
              {list.slice(0, 5).map((i) => (
                <button
                  key={i.id}
                  className="recent-row"
                  onClick={() => onSelect(i)}
                >
                  <div className={`incident-icon ${i.priority.toLowerCase()}`}>
                    <AlertCircle size={17} />
                  </div>
                  <div className="recent-copy">
                    <strong>{i.title}</strong>
                    <small>
                      {i.incidentKey} <i>·</i> {i.teamName || "Unassigned team"}{" "}
                      <i>·</i> {ago(i.createdAt)}
                    </small>
                  </div>
                  <Status status={i.status} />
                  <ArrowRight className="row-arrow" size={15} />
                </button>
              ))}
            </div>
          )}
          <div className="panel-foot">
            <span>
              Showing {Math.min(5, list.length)} of {list.length} loaded
              incidents
            </span>
            <button className="link-button" onClick={onAll}>
              Open incident queue
            </button>
          </div>
        </section>
        <div className="right-stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Priority distribution</h3>
                <small>Incidents by severity</small>
              </div>
              <button className="icon" onClick={onAll}>
                <SlidersHorizontal size={15} />
              </button>
            </div>
            <div className="bars">
              {bars.map(([label, n, color]) => (
                <div className="bar-row" key={label}>
                  <span>{label}</span>
                  <div className="track">
                    <i
                      className={color}
                      style={{ width: `${Math.min(100, (n / max) * 100)}%` }}
                    />
                  </div>
                  <b>{n}</b>
                </div>
              ))}
            </div>
            <div className="panel-foot">
              <span>
                <i className="green-dot" /> Across all recorded incidents
              </span>
              <button className="link-button" onClick={onAll}>
                Details
              </button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>SLA health</h3>
                <small>Response & resolution targets</small>
              </div>
              <div className="sla-icon">
                <Clock3 size={17} />
              </div>
            </div>
            <div className="sla-score">
              <div>
                <strong>
                  {s.slaCompliance}
                  <small>%</small>
                </strong>
                <span>Overall compliance</span>
              </div>
              <div
                className="ring"
                style={{
                  background: `conic-gradient(#50d6a3 ${s.slaCompliance}%,#29364b 0)`,
                }}
              >
                <i>
                  <ShieldCheck size={20} />
                </i>
              </div>
            </div>
            <div className="progress">
              <i style={{ width: `${s.slaCompliance}%` }} />
            </div>
            <div className="sla-foot">
              <span>
                <i className="green-dot" /> Within target
              </span>
              <b>
                {Math.max(
                  0,
                  s.total * 2 - s.responseBreaches - s.resolutionBreaches,
                )}{" "}
                checks
              </b>
            </div>
            <div className="sla-foot">
              <span>
                <i className="red-dot" /> Breached targets
              </span>
              <b
                className={
                  s.responseBreaches + s.resolutionBreaches ? "red-text" : ""
                }
              >
                {s.responseBreaches + s.resolutionBreaches}
              </b>
            </div>
          </section>
        </div>
      </div>
      <div className="insight">
        <div>
          <Zap size={18} />
        </div>
        <section>
          <strong>Small steps, faster recovery.</strong>
          <p>
            Keep incidents assigned, add investigation notes, and resolve with a
            clear root cause to build a healthier service history.
          </p>
        </section>
        <button className="btn secondary small" onClick={onAll}>
          Review queue <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}
function Status({ status }: { status: Status }) {
  return (
    <span className={`status s-${status.toLowerCase()}`}>
      <i />
      {pretty(status)}
    </span>
  );
}
function Priority({ priority }: { priority: Priority }) {
  return (
    <span className={`priority p-${priority.toLowerCase()}`}>
      <i />
      {pretty(priority)}
    </span>
  );
}
function IncidentList({
  list,
  pageData,
  loading,
  search,
  setSearch,
  status,
  setStatus,
  priority,
  setPriority,
  page,
  setPage,
  onSelect,
  onCreate,
  onRefresh,
}: {
  list: Incident[];
  pageData: Page<Incident> | null;
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  status: Status | "";
  setStatus: (s: Status | "") => void;
  priority: Priority | "";
  setPriority: (s: Priority | "") => void;
  page: number;
  setPage: (n: number) => void;
  onSelect: (i: Incident) => void;
  onCreate: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <Heading
        eyebrow="INCIDENT OPERATIONS"
        title="Incident queue"
        desc="Triage, assign, and move incidents toward resolution."
        action={
          <button className="btn primary" onClick={onCreate}>
            <Plus size={16} /> New incident
          </button>
        }
      />
      <div className="queue-stats">
        <div>
          <strong>{pageData?.totalElements || 0}</strong>
          <small>Total incidents</small>
        </div>
        <div>
          <strong className="orange-text">
            {list.filter((i) => i.status === "OPEN").length}
          </strong>
          <small>Open on this page</small>
        </div>
        <div>
          <strong className="red-text">
            {list.filter((i) => i.priority === "CRITICAL").length}
          </strong>
          <small>Critical on this page</small>
        </div>
      </div>
      <section className="panel queue">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input
              aria-label="Search incidents"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incidents, keys, descriptions…"
            />
            <kbd>/</kbd>
          </div>
          <div className="filters">
            <label>
              <Filter size={14} />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status | "")}
              >
                <option value="">All statuses</option>
                {(
                  [
                    "OPEN",
                    "IN_PROGRESS",
                    "PENDING",
                    "RESOLVED",
                    "CLOSED",
                  ] as Status[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {pretty(s)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority | "")}
              >
                <option value="">All priorities</option>
                {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map(
                  (p) => (
                    <option key={p} value={p}>
                      {pretty(p)}
                    </option>
                  ),
                )}
              </select>
            </label>
            <button className="icon" onClick={onRefresh}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>INCIDENT</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>ASSIGNEE / TEAM</th>
                <th>CREATED</th>
                <th>SLA</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && !list.length ? (
                <tr>
                  <td colSpan={7}>Loading…</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-results">
                    No matching incidents. Try changing the filters.
                  </td>
                </tr>
              ) : (
                list.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <button
                        type="button"
                        className="table-incident table-incident-link"
                        aria-label={`Open ${i.incidentKey}: ${i.title}`}
                        onClick={() => onSelect(i)}
                      >
                        <i
                          className={`priority-line ${i.priority.toLowerCase()}`}
                        />
                        <div>
                          <strong>{i.title}</strong>
                          <small>
                            {i.incidentKey} · {i.category}
                          </small>
                      </div>
                      </button>
                    </td>
                    <td>
                      <Priority priority={i.priority} />
                    </td>
                    <td>
                      <Status status={i.status} />
                    </td>
                    <td>
                      <div className="assignee">
                        <div className="avatar">
                          {initials(i.assigneeName || "Unassigned")}
                        </div>
                        <div>
                          <strong>{i.assigneeName || "Unassigned"}</strong>
                          <small>{i.teamName || "No team"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="date-text">{date(i.createdAt)}</strong>
                      <small className="date-relative">
                        {ago(i.createdAt)}
                      </small>
                    </td>
                    <td>
                      {i.responseBreached || i.resolutionBreached ? (
                        <span className="breached">⚠ Breached</span>
                      ) : (
                        <span className="ontrack">◉ On track</span>
                      )}
                    </td>
                    <td>
                      <ArrowRight size={15} className="row-arrow" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            Showing {pageData?.totalElements ? page * pageData.size + 1 : 0}–
            {Math.min(
              (page + 1) * (pageData?.size || 8),
              pageData?.totalElements || 0,
            )}{" "}
            of {pageData?.totalElements || 0} incidents
          </span>
          <div>
            <button
              className="btn secondary small"
              disabled={page === 0 || loading}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>
              {page + 1} / {Math.max(1, pageData?.totalPages || 1)}
            </span>
            <button
              className="btn secondary small"
              disabled={loading || !pageData || page + 1 >= pageData.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
function CreateModal({
  teams,
  close,
  created,
}: {
  teams: Team[];
  close: () => void;
  created: (i: Incident) => void;
}) {
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [priority, setPriority] = useState<Priority>("HIGH"),
    [category, setCategory] = useState("APPLICATION"),
    [teamId, setTeamId] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      created(
        await createIncident({
          title,
          description,
          priority,
          category,
          teamId: teamId ? Number(teamId) : null,
        }),
      );
    } catch (e: unknown) {
      setError(apiErrorMessage(e, "Could not create incident. Try again."));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-incident-title"
      >
        <header>
          <div>
            <div className="eyebrow">INCIDENT INTAKE</div>
            <h2 id="create-incident-title">
              Raise an incident<span>.</span>
            </h2>
            <p>Capture the signal. Your team will take it from here.</p>
          </div>
          <button
            className="icon"
            aria-label="Close new incident form"
            onClick={close}
          >
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <label>
            Incident title <em>*</em>
            <input
              autoFocus
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Payment API returning 502 errors"
              required
            />
          </label>
          <label>
            Description <em>*</em>
            <textarea
              rows={4}
              maxLength={65535}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Symptoms, impact, and steps to reproduce…"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </label>
            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[
                  "APPLICATION",
                  "API",
                  "DATABASE",
                  "AUTHENTICATION",
                  "INFRASTRUCTURE",
                  "NETWORK",
                  "DATA",
                  "INTEGRATION",
                  "REPORTING",
                  "OTHER",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Owning team
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Use my team's default</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <div className="sla-preview">
            <Clock3 size={17} />
            <div>
              <strong>SLA targets are assigned automatically</strong>
              <small>
                Response target:{" "}
                {
                  {
                    CRITICAL: "15 minutes",
                    HIGH: "1 hour",
                    MEDIUM: "4 hours",
                    LOW: "8 hours",
                  }[priority]
                }
              </small>
            </div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={close}>
              Cancel
            </button>
            <button className="btn primary" disabled={saving}>
              {saving ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <Plus size={15} />
              )}{" "}
              Create incident
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
function IncidentDrawer({
  incident,
  users,
  canAssign,
  canTransition,
  close,
  updated,
  notify,
}: {
  incident: Incident;
  users: User[];
  canAssign: boolean;
  canTransition: boolean;
  close: () => void;
  updated: (i: Incident) => void;
  notify: (s: string) => void;
}) {
  const [current, setCurrent] = useState(incident),
    [comments, setComments] = useState<Comment[]>([]),
    [history, setHistory] = useState<HistoryItem[]>([]),
    [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false),
    [timelineLoading, setTimelineLoading] = useState(true),
    [timelineError, setTimelineError] = useState(""),
    [tab, setTab] = useState<"activity" | "details">("activity"),
    [assignee, setAssignee] = useState(
      incident.assigneeId ? String(incident.assigneeId) : "",
    );
  useEffect(() => {
    let active = true;
    setCurrent(incident);
    setAssignee(incident.assigneeId ? String(incident.assigneeId) : "");
    setTimelineLoading(true);
    setTimelineError("");
    Promise.all([getComments(incident.id), getHistory(incident.id)])
      .then(([c, h]) => {
        if (!active) return;
        setComments(c);
        setHistory(h);
      })
      .catch((error: unknown) => {
        if (active)
          setTimelineError(
            apiErrorMessage(error, "Could not load incident activity."),
          );
      })
      .finally(() => {
        if (active) setTimelineLoading(false);
      });
    return () => {
      active = false;
    };
  }, [incident.id]);
  const run = async (fn: () => Promise<Incident>) => {
    setBusy(true);
    try {
      const i = await fn();
      setCurrent(i);
      updated(i);
    } catch (e: unknown) {
      notify(apiErrorMessage(e, "Update failed."));
    } finally {
      setBusy(false);
    }
  };
  const next: Status | undefined =
    current.status === "OPEN"
      ? "IN_PROGRESS"
      : current.status === "IN_PROGRESS" || current.status === "PENDING"
        ? "RESOLVED"
        : current.status === "RESOLVED"
          ? "CLOSED"
          : undefined;
  const postComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      const c = await addComment(current.id, comment.trim());
      setComments((a) => [...a, c]);
      setComment("");
      getHistory(current.id)
        .then(setHistory)
        .catch((error: unknown) =>
          setTimelineError(
            apiErrorMessage(error, "The note was saved, but activity did not refresh."),
          ),
        );
      notify("Investigation note added");
    } catch (e: unknown) {
      notify(apiErrorMessage(e, "Could not add note."));
    } finally {
      setBusy(false);
    }
  };
  const activity = [
    ...history.map((h) => ({ ...h, kind: "history" as const })),
    ...comments.map((c) => ({
      id: c.id,
      actorName: c.authorName,
      action: "COMMENT_ADDED",
      oldValue: null,
      newValue: c.message,
      createdAt: c.createdAt,
      kind: "comment" as const,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return (
    <div
      className="drawer-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="incident-drawer-title">
        <div className="drawer-top">
          <span>
            <b>{current.incidentKey}</b> / Incident details
          </span>
          <button className="icon" aria-label="Close incident details" onClick={close}>
            <X size={18} />
          </button>
        </div>
        <div className={`drawer-line ${current.priority.toLowerCase()}`} />
        <div className="drawer-title">
          <div>
            <Priority priority={current.priority} />
            <Status status={current.status} />
          </div>
          <h2 id="incident-drawer-title">{current.title}</h2>
          <p>{current.description}</p>
          <small>
            <UserRound size={13} /> Reported by {current.reporterName} ·{" "}
            {ago(current.createdAt)}
          </small>
        </div>
        {canTransition && (
          <div className="drawer-actions">
          <button
            className="btn primary"
            disabled={busy || !next}
            onClick={() =>
              next && run(() => transitionIncident(current.id, next))
            }
          >
            {busy ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              <ArrowRight size={14} />
            )}{" "}
            {next === "IN_PROGRESS"
              ? "Start work"
              : next === "RESOLVED"
                ? "Resolve incident"
                : next === "CLOSED"
                  ? "Close incident"
                  : "No next action"}
          </button>
          <button
            className="btn secondary"
            disabled={busy || current.status === "CLOSED"}
            onClick={() =>
              run(() => transitionIncident(current.id, "IN_PROGRESS"))
            }
          >
            <RefreshCw size={14} /> Resume
          </button>
          </div>
        )}
        <div className="tabs">
          <button
            className={tab === "activity" ? "chosen" : ""}
            onClick={() => setTab("activity")}
          >
            <History size={14} /> Activity <i>{activity.length}</i>
          </button>
          <button
            className={tab === "details" ? "chosen" : ""}
            onClick={() => setTab("details")}
          >
            <SlidersHorizontal size={14} /> Details
          </button>
        </div>
        <div className="drawer-body">
          {tab === "activity" ? (
            <>
              <div className="eyebrow">INCIDENT TIMELINE</div>
              {timelineLoading ? (
                <p className="muted-text" role="status">Loading incident activity…</p>
              ) : timelineError ? (
                <div className="error" role="alert">
                  <span>{timelineError}</span>
                  <button className="btn secondary small" onClick={() => {
                    setTimelineLoading(true);
                    setTimelineError("");
                    Promise.all([getComments(current.id), getHistory(current.id)])
                      .then(([c, h]) => {
                        setComments(c);
                        setHistory(h);
                      })
                      .catch((error: unknown) => setTimelineError(apiErrorMessage(error, "Could not load incident activity.")))
                      .finally(() => setTimelineLoading(false));
                  }}>Retry</button>
                </div>
              ) : activity.length === 0 ? (
                <p className="muted-text">
                  No activity yet. Add an investigation note to start the
                  timeline.
                </p>
              ) : (
                activity.map((a) => (
                  <div className="activity-item" key={`${a.kind}-${a.id}`}>
                    <div className="activity-icon">
                      {a.kind === "comment" ? (
                        <MessageSquare size={13} />
                      ) : (
                        <Activity size={13} />
                      )}
                    </div>
                    <div>
                      <strong>
                        {a.kind === "comment"
                          ? "Comment added"
                          : pretty(a.action)}
                      </strong>
                      <small>
                        {a.actorName} · {ago(a.createdAt)}
                      </small>
                      {a.newValue && (
                        <p>
                          {a.oldValue ? `${pretty(a.oldValue)} → ` : ""}
                          {a.newValue}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <form className="comment-form" onSubmit={postComment}>
                <textarea
                  aria-label="Add an investigation note"
                  rows={3}
                  maxLength={5000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add an investigation note…"
                />
                <button
                  className="btn primary small"
                  disabled={busy || !comment.trim()}
                >
                  <ArrowRight size={13} /> Add note
                </button>
              </form>
            </>
          ) : (
            <>
              {canAssign && (
                <div className="detail">
                  <label>ASSIGNEE</label>
                  <div className="assign-row">
                    <select
                      aria-label="Incident assignee"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users
                        .filter((u) =>
                          ["ENGINEER", "SUPPORT_LEAD", "ADMIN"].includes(u.role),
                        )
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} · {pretty(u.role)}
                          </option>
                        ))}
                    </select>
                    <button
                      className="btn secondary small"
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          assignIncident(
                            current.id,
                            assignee ? Number(assignee) : null,
                            current.teamId,
                          ),
                        )
                      }
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
              <div className="detail">
                <label>TEAM</label>
                <strong>{current.teamName || "Unassigned"}</strong>
              </div>
              <div className="detail">
                <label>CATEGORY</label>
                <strong>{pretty(current.category)}</strong>
              </div>
              <div className="detail">
                <label>RESPONSE DEADLINE</label>
                <strong>{date(current.responseDueAt)}</strong>
                <small
                  className={
                    current.responseBreached ? "red-text" : "green-text"
                  }
                >
                  {current.responseBreached
                    ? "Response SLA breached"
                    : current.firstResponseAt
                      ? "First response recorded"
                      : "Awaiting first response"}
                </small>
              </div>
              <div className="detail">
                <label>RESOLUTION DEADLINE</label>
                <strong>{date(current.resolutionDueAt)}</strong>
                <small
                  className={
                    current.resolutionBreached ? "red-text" : "green-text"
                  }
                >
                  {current.resolutionBreached
                    ? "Resolution SLA breached"
                    : current.resolvedAt
                      ? "Resolved"
                      : "Target active"}
                </small>
              </div>
            </>
          )}
        </div>
        <div className="drawer-footer">
          <span>
            <ShieldCheck size={14} /> Activity is audit logged
          </span>
          <button className="btn secondary small" onClick={close}>
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}
function Teams({ users, teams }: { users: User[]; teams: Team[] }) {
  return (
    <>
      <Heading
        eyebrow="PEOPLE & OWNERSHIP"
        title="Teams & people"
        desc="Know who owns what, and keep response work connected."
      />
      <div className="team-grid">
        {teams.map((t, i) => {
          const members = users.filter((u) => u.team === t.name);
          return (
            <section className="panel team-card" key={t.id}>
              <div className={`team-symbol team-${i % 3}`}>
                <Users size={19} />
              </div>
              <div className="team-title">
                <h3>{t.name}</h3>
                <span>{members.length} members</span>
              </div>
              <p>{t.description}</p>
              <div className="member-stack">
                {members.slice(0, 4).map((u, j) => (
                  <div
                    className={`avatar av-${j % 4}`}
                    title={u.name}
                    key={u.id}
                  >
                    {initials(u.name)}
                  </div>
                ))}
              </div>
              <div className="team-foot">
                Team members <ArrowRight size={15} />
              </div>
            </section>
          );
        })}
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Workspace directory</h3>
            <small>People with access to IncidentIQ</small>
          </div>
          <span className="tag">{users.length} people</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PERSON</th>
                <th>ROLE</th>
                <th>TEAM</th>
                <th>EMAIL</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td>
                    <div className="assignee">
                      <div className={`avatar av-${i % 4}`}>
                        {initials(u.name)}
                      </div>
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="role-tag">{pretty(u.role)}</span>
                  </td>
                  <td>{u.team || "—"}</td>
                  <td>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function Reports({ s }: { s: DashboardSummary }) {
  const vals = [
    ["Critical", s.critical, "critical"],
    ["High", s.high, "high"],
    ["Medium", s.medium, "medium"],
    ["Low", s.low, "low"],
  ] as const;
  const total = Math.max(
    vals.reduce((a, v) => a + v[1], 0),
    1,
  );
  return (
    <>
      <Heading
        eyebrow="OPERATIONAL INTELLIGENCE"
        title="Reports & insights"
        desc="Understand incident patterns and where response can improve."
      />
      <div className="metrics">
        <Metric
          label="Total incidents"
          value={s.total}
          caption="All recorded incidents"
          icon={Siren}
          tone="blue"
        />
        <Metric
          label="Resolved / closed"
          value={s.resolved}
          caption="Completed work"
          icon={Check}
          tone="green"
        />
        <Metric
          label="Critical incidents"
          value={s.critical}
          caption="Across all records"
          icon={AlertCircle}
          tone="red"
        />
        <Metric
          label="SLA compliance"
          value={`${s.slaCompliance}%`}
          caption="Calculated from breach flags"
          icon={ShieldCheck}
          tone="green"
        />
      </div>
      <div className="report-grid">
        <section className="panel report-card">
          <div className="panel-head">
            <div>
              <h3>Priority mix</h3>
              <small>Distribution across all recorded incidents</small>
            </div>
          </div>
          <div className="report-bars">
            {vals.map(([label, n, c]) => (
              <div key={label}>
                <div className="report-bar-label">
                  <span>{label}</span>
                  <b>{n}</b>
                </div>
                <div className="track">
                  <i className={c} style={{ width: `${(n / total) * 100}%` }} />
                </div>
                <small>
                  {Math.round((n / total) * 100)}% of recorded incidents
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel report-card">
          <div className="panel-head">
            <div>
              <h3>Response health</h3>
              <small>Deadline performance</small>
            </div>
          </div>
          <div className="health">
            <strong>{s.slaCompliance}%</strong>
            <small>estimated SLA compliance</small>
            <div className="progress">
              <i style={{ width: `${s.slaCompliance}%` }} />
            </div>
          </div>
          <div className="sla-foot">
            <span>Response breaches</span>
            <b className="red-text">{s.responseBreaches}</b>
          </div>
          <div className="sla-foot">
            <span>Resolution breaches</span>
            <b className="red-text">{s.resolutionBreaches}</b>
          </div>
          <p className="note">
            Compliance is a portfolio metric based on recorded breach flags, not
            a contractual SLA report.
          </p>
        </section>
      </div>
    </>
  );
}
function Sla() {
  const [policies, setPolicies] = useState<SlaPolicy[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    getSlaPolicies()
      .then(setPolicies)
      .catch((e: unknown) =>
        setError(apiErrorMessage(e, "Could not load SLA policies.")),
      )
      .finally(() => setLoading(false));
  }, []);
  const fmt = (n: number) =>
    n < 60
      ? `${n} min`
      : n % 60 === 0
        ? `${n / 60} hr`
        : `${Math.floor(n / 60)} hr ${n % 60} min`;
  return (
    <>
      <Heading
        eyebrow="SERVICE LEVEL OBJECTIVES"
        title="SLA policies"
        desc="Response and resolution targets by incident priority."
      />
      <div className="policy-grid">
        {loading ? (
          <div className="empty" role="status">
            Loading SLA policies…
          </div>
        ) : policies.length === 0 && !error ? (
          <div className="empty">No SLA policies are configured.</div>
        ) : (
          [...policies]
          .sort(
            (a, b) =>
              ["CRITICAL", "HIGH", "MEDIUM", "LOW"].indexOf(a.priority) -
              ["CRITICAL", "HIGH", "MEDIUM", "LOW"].indexOf(b.priority),
          )
          .map((p) => (
            <section className="panel policy" key={p.priority}>
              <Priority priority={p.priority} />
              <div className="policy-times">
                <div>
                  <Clock3 size={17} />
                  <small>First response</small>
                  <strong>{fmt(p.responseMinutes)}</strong>
                </div>
                <div>
                  <Timer size={17} />
                  <small>Resolution target</small>
                  <strong>{fmt(p.resolutionMinutes)}</strong>
                </div>
              </div>
              <small>Measured from incident creation · UTC</small>
            </section>
          ))
        )}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="note-box">
        <ShieldCheck size={18} />
        <div>
          <strong>How SLA tracking works</strong>
          <p>
            IncidentIQ calculates deadlines when an incident is created. A
            scheduled checker flags overdue targets and records each breach in
            the audit timeline. Business-hours calendars and policy editing are
            future enhancements.
          </p>
        </div>
      </div>
    </>
  );
}
function Settings({ user, logout }: { user: User | null; logout: () => void }) {
  return (
    <>
      <Heading
        eyebrow="WORKSPACE PREFERENCES"
        title="Settings"
        desc="Account information and environment details."
      />
      <section className="panel settings">
        <div className="panel-head">
          <div>
            <h3>Your account</h3>
            <small>Authenticated workspace identity</small>
          </div>
          <ShieldCheck size={22} />
        </div>
        <div className="settings-user">
          <div className="avatar purple large">
            {initials(user?.name || "User")}
          </div>
          <div>
            <h3>{user?.name}</h3>
            <small>{user?.email}</small>
            <p>
              <span className="role-tag">
                {pretty(user?.role || "REPORTER")}
              </span>
            </p>
          </div>
        </div>
        <div className="settings-grid">
          <div>
            <label>WORKSPACE</label>
            <strong>IncidentIQ instance</strong>
          </div>
          <div>
            <label>TEAM</label>
            <strong>{user?.team || "Not assigned"}</strong>
          </div>
          <div>
            <label>AUTHENTICATION</label>
            <strong>JWT Bearer token</strong>
          </div>
          <div>
            <label>API BASE</label>
            <strong>Spring Boot REST API</strong>
          </div>
        </div>
        <div className="settings-foot">
          <div>
            <strong>End your current session</strong>
            <small>You'll need to sign in again to access incident data.</small>
          </div>
          <button className="btn secondary" onClick={logout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </section>
      <div className="note-box">
        <CircleHelp size={18} />
        <div>
          <strong>Portfolio build</strong>
          <p>
            Modular monolith with React, Spring Boot, MySQL and Flyway
            migrations. Change secrets and demo credentials before public
            deployment.
          </p>
        </div>
      </div>
    </>
  );
}
export default App;
