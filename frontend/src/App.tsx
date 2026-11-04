import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { LoginView } from "@/components/auth/LoginView";
import { MetricKpiCard } from "@/components/telemetry/MetricKpiCard";
import { CoreInfraStrip } from "@/components/telemetry/CoreInfraStrip";
import { ServerGeoCard } from "@/components/telemetry/ServerGeoCard";
import { ContainerTable } from "@/components/containers/ContainerTable";
import { LogStreamSheet } from "@/components/containers/LogStreamSheet";
import { EnvEditorSheet } from "@/components/containers/EnvEditorSheet";
import { NewAppDialog } from "@/components/containers/NewAppDialog";
import { DbTable } from "@/components/database/DbTable";
import { ProvisionDbDialog } from "@/components/database/ProvisionDbDialog";
import { RedisStatusCard } from "@/components/database/RedisStatusCard";
import { PhpMyAdminCard } from "@/components/database/PhpMyAdminCard";
import { ProxyTable } from "@/components/proxy/ProxyTable";
import { AddDomainDialog } from "@/components/proxy/AddDomainDialog";
import { BackupArchiveTable } from "@/components/ops/BackupArchiveTable";
import { DockerPruneCard } from "@/components/ops/DockerPruneCard";
import { Progress } from "@/components/ui/progress";
import { useTelemetrySSE } from "@/hooks/useTelemetrySSE";
import { api } from "@/lib/api";
import { Toaster, toast } from "sonner";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  PlusCircle,
  Database,
  Globe,
  Wrench,
  Layers,
  LayoutDashboard,
  Lock,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { ContainerInfo, DatabaseInfo, RedisStats, ProxyHost, BackupArchive } from "@/types";

export function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Sheets & Dialogs State
  const [logSheetTarget, setLogSheetTarget] = useState<{ id: string; name: string } | null>(null);
  const [envSheetSlug, setEnvSheetSlug] = useState<string | null>(null);
  const [newAppOpen, setNewAppOpen] = useState(false);
  const [provisionDbOpen, setProvisionDbOpen] = useState(false);
  const [addDomainOpen, setAddDomainOpen] = useState(false);

  // Telemetry Hook with live Latency
  const { data: telemetry, history, connected: telemetryConnected, latencyMs } = useTelemetrySSE();

  // App Data States
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loadingContainers, setLoadingContainers] = useState(false);

  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);

  const [redisStats, setRedisStats] = useState<RedisStats | null>(null);
  const [loadingRedis, setLoadingRedis] = useState(false);

  const [proxyHosts, setProxyHosts] = useState<ProxyHost[]>([]);
  const [loadingProxy, setLoadingProxy] = useState(false);

  const [backups, setBackups] = useState<BackupArchive[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Check auth session on load
  useEffect(() => {
    api.getMe()
      .then((res) => {
        if (res.authenticated) {
          setCurrentUser(res.username);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // Fetch data on tab change
  const fetchContainers = () => {
    setLoadingContainers(true);
    api.getContainers()
      .then(setContainers)
      .catch((e) => console.error(e))
      .finally(() => setLoadingContainers(false));
  };

  const fetchDatabases = () => {
    setLoadingDatabases(true);
    api.getDatabases()
      .then(setDatabases)
      .catch((e) => console.error(e))
      .finally(() => setLoadingDatabases(false));
  };

  const fetchRedis = () => {
    setLoadingRedis(true);
    api.getRedisStats()
      .then(setRedisStats)
      .catch((e) => console.error(e))
      .finally(() => setLoadingRedis(false));
  };

  const fetchProxyHosts = () => {
    setLoadingProxy(true);
    api.getProxyHosts()
      .then(setProxyHosts)
      .catch((e) => console.error(e))
      .finally(() => setLoadingProxy(false));
  };

  const fetchBackups = () => {
    setLoadingBackups(true);
    api.getBackups()
      .then(setBackups)
      .catch((e) => console.error(e))
      .finally(() => setLoadingBackups(false));
  };

  useEffect(() => {
    if (!currentUser) return;

    fetchContainers();

    if (currentTab === "database") {
      fetchDatabases();
      fetchRedis();
    } else if (currentTab === "proxy") {
      fetchProxyHosts();
    } else if (currentTab === "ops") {
      fetchBackups();
    }
  }, [currentUser, currentTab]);

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      toast.success("Signed out successfully");
    } catch (e: any) {
      toast.error("Logout failed", { description: e.message });
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-rose-500/70 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          Initializing VPS Nexus Control Portal...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" theme="dark" richColors />
        <LoginView onSuccess={(user) => setCurrentUser(user)} />
      </>
    );
  }

  // Pre-calculated metrics with fallbacks
  const cpuPercent = telemetry ? Math.round(telemetry.cpu.usage_percent * 10) / 10 : 0;
  const ramPercent = telemetry ? Math.round(telemetry.memory.used_percent * 10) / 10 : 0;
  const swapPercent = telemetry ? Math.round(telemetry.swap.used_percent * 10) / 10 : 0;
  const diskRootPercent = telemetry ? Math.round(telemetry.disk_root.used_percent * 10) / 10 : 6;
  const runningContainers = telemetry ? telemetry.network.running_containers : containers.filter((c) => c.state === "running").length;
  const totalContainers = telemetry ? telemetry.network.total_containers : containers.length;

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-rose-500/30 selection:text-rose-200">
      <Toaster position="top-right" theme="dark" richColors />

      {/* Symmetrical App Navigation Sidebar */}
      <AppSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={mobileMenuOpen}
        setIsOpenMobile={setMobileMenuOpen}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader
          onOpenCommand={() => setCommandOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          username={currentUser}
          onLogout={handleLogout}
          telemetryConnected={telemetryConnected}
          latencyMs={latencyMs}
          location={telemetry?.location}
          domain={telemetry?.domain || "vps.pixandco.lk"}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {currentTab === "overview" && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
                    <LayoutDashboard className="h-5 w-5 text-rose-500" />
                    System Overview &amp; Live Telemetry
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Real-time host metrics &bull; Host IP: <span className="font-mono text-rose-300">172.255.210.203</span> &bull; Domain: <span className="font-mono text-zinc-300">vps.pixandco.lk</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNewAppOpen(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-semibold text-white shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Deploy App
                  </button>
                </div>
              </div>

              {/* Server Geolocation & Latency Banner */}
              <ServerGeoCard
                location={telemetry?.location}
                latencyMs={latencyMs}
                serverIp={telemetry?.server_ip || "172.255.210.203"}
                domain={telemetry?.domain || "vps.pixandco.lk"}
              />

              {/* 4-Card Symmetrical KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. CPU Card */}
                <MetricKpiCard
                  title="CPU LOAD"
                  value={`${cpuPercent}%`}
                  subValue={telemetry ? `Load: ${telemetry.cpu.load_avg.map((l) => l.toFixed(2)).join(", ")}` : "6 Cores AMD EPYC"}
                  icon={<Cpu className="h-4 w-4 text-rose-500" />}
                  dataPoints={history.map((h) => ({ timestamp: h.timestamp, value: h.cpu }))}
                  color="#f43f5e"
                  footer={
                    <div className="text-[10px] text-zinc-500 font-mono">
                      6 Cores / 6 Threads @ 2.0 GHz
                    </div>
                  }
                />

                {/* 2. Memory & 4GB Swap Card */}
                <MetricKpiCard
                  title="RAM & 4GB SWAP"
                  value={`${ramPercent}%`}
                  subValue={telemetry ? `${formatBytes(telemetry.memory.used_bytes)} / ${formatBytes(telemetry.memory.total_bytes)}` : "16 GB Total"}
                  icon={<MemoryStick className="h-4 w-4 text-rose-400" />}
                  dataPoints={history.map((h) => ({ timestamp: h.timestamp, value: h.ram }))}
                  color="#e11d48"
                  footer={
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>Swap (4GB):</span>
                        <span>{swapPercent}% ({telemetry ? formatBytes(telemetry.swap.used_bytes) : "0 B"})</span>
                      </div>
                      <Progress value={swapPercent} indicatorColor="bg-rose-500" className="h-1.5" />
                    </div>
                  }
                />

                {/* 3. Disk Storage */}
                <MetricKpiCard
                  title="STORAGE (200GB SSD)"
                  value={`${diskRootPercent}%`}
                  subValue={telemetry ? `${formatBytes(telemetry.disk_root.used_bytes)} / ${formatBytes(telemetry.disk_root.total_bytes)}` : "179 GB Free"}
                  icon={<HardDrive className="h-4 w-4 text-emerald-400" />}
                  color="#10b981"
                  footer={
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>Root Partition:</span>
                        <span>{diskRootPercent}%</span>
                      </div>
                      <Progress value={diskRootPercent} indicatorColor="bg-emerald-500" className="h-1.5" />
                    </div>
                  }
                />

                {/* 4. Docker Network Card */}
                <MetricKpiCard
                  title="DOCKER NETWORK"
                  value={`${runningContainers} / ${totalContainers}`}
                  subValue="Containers Active"
                  icon={<Network className="h-4 w-4 text-sky-400" />}
                  color="#0ea5e9"
                  footer={
                    <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                      <span>Bridge:</span>
                      <span className="text-sky-400 font-semibold font-mono">shared-network</span>
                    </div>
                  }
                />
              </div>

              {/* Symmetrical 4-Stack Core Infrastructure Strip */}
              <CoreInfraStrip containers={containers} onRefetch={fetchContainers} />

              {/* Recent Containers Quick View */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Running Stacks Overview
                  </h3>
                  <button
                    onClick={() => setCurrentTab("apps")}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-medium"
                  >
                    View All Containers &rarr;
                  </button>
                </div>
                <ContainerTable
                  containers={containers}
                  loading={loadingContainers}
                  onRefresh={fetchContainers}
                  onOpenLogs={(id, name) => setLogSheetTarget({ id, name })}
                  onOpenEnv={(slug) => setEnvSheetSlug(slug)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS & DOCKER */}
          {currentTab === "apps" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
                    <Layers className="h-5 w-5 text-rose-500" />
                    Applications &amp; Docker Management
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage Docker containers, view real-time log streams, and edit <code>/opt/apps/&lt;slug&gt;/.env.production</code>
                  </p>
                </div>
                <button
                  onClick={() => setNewAppOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-semibold text-white shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Scaffold New App
                </button>
              </div>

              <ContainerTable
                containers={containers}
                loading={loadingContainers}
                onRefresh={fetchContainers}
                onOpenLogs={(id, name) => setLogSheetTarget({ id, name })}
                onOpenEnv={(slug) => setEnvSheetSlug(slug)}
              />
            </div>
          )}

          {/* TAB 3: DATABASES & CACHE */}
          {currentTab === "database" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
                  <Database className="h-5 w-5 text-rose-500" />
                  Shared Database, phpMyAdmin &amp; Redis Studio
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Multi-tenant MySQL 8.0 user database manager, phpMyAdmin graphical web console, and Redis cache inspector
                </p>
              </div>

              {/* phpMyAdmin Web Console Feature Card */}
              <PhpMyAdminCard />

              {/* Redis Inspector */}
              <RedisStatusCard
                stats={redisStats}
                loading={loadingRedis}
                onRefresh={fetchRedis}
              />

              {/* MySQL User Databases Table */}
              <DbTable
                databases={databases}
                loading={loadingDatabases}
                onRefresh={fetchDatabases}
                onOpenProvision={() => setProvisionDbOpen(true)}
              />
            </div>
          )}

          {/* TAB 4: DOMAINS & PROXY */}
          {currentTab === "proxy" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
                  <Globe className="h-5 w-5 text-rose-500" />
                  Domain &amp; Reverse Proxy Hub
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage Nginx Proxy Manager routes, custom domains, and automatic Let's Encrypt SSL certificates
                </p>
              </div>

              {/* Primary Domain Status Box */}
              <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-zinc-950 via-zinc-950 to-rose-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-600/15 border border-rose-500/30 text-rose-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-zinc-100">vps.pixandco.lk</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">
                        Primary Host
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Target: <code className="text-zinc-300 font-mono">172.255.210.203:80/443</code> &bull; Proxy to <code className="text-zinc-300 font-mono">app-vps-portal:8080</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="http://172.255.210.203:81"
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    Open NPM Console ↗
                  </a>
                </div>
              </div>

              <ProxyTable
                hosts={proxyHosts}
                loading={loadingProxy}
                onRefresh={fetchProxyHosts}
                onOpenAdd={() => setAddDomainOpen(true)}
              />
            </div>
          )}

          {/* TAB 5: BACKUPS & OPS */}
          {currentTab === "ops" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
                  <Wrench className="h-5 w-5 text-rose-500" />
                  Backups &amp; Maintenance Engine
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Daily automated MySQL dumps in <code>/opt/ops/backups</code> and weekly Docker cache pruning
                </p>
              </div>

              <BackupArchiveTable
                archives={backups}
                loading={loadingBackups}
                onRefresh={fetchBackups}
              />

              <DockerPruneCard />
            </div>
          )}
        </main>

        {/* Global Symmetrical Footer */}
        <Footer />
      </div>

      {/* Global Cmd+K Command Palette */}
      <CommandPalette
        open={commandOpen}
        setOpen={setCommandOpen}
        onNavigate={(tab) => setCurrentTab(tab)}
        onTriggerBackup={() => {
          setCurrentTab("ops");
          api.runBackup().then((r) => toast.success(`Backup created: ${r.file}`));
        }}
        onTriggerPrune={() => {
          setCurrentTab("ops");
          toast.info("Navigate to Ops to confirm Docker Prune");
        }}
        onOpenNewApp={() => setNewAppOpen(true)}
      />

      {/* Drawers & Dialogs */}
      <LogStreamSheet
        containerId={logSheetTarget?.id || null}
        containerName={logSheetTarget?.name || null}
        open={!!logSheetTarget}
        onOpenChange={(open) => !open && setLogSheetTarget(null)}
      />

      <EnvEditorSheet
        appSlug={envSheetSlug}
        open={!!envSheetSlug}
        onOpenChange={(open) => !open && setEnvSheetSlug(null)}
        onSaved={fetchContainers}
      />

      <NewAppDialog
        open={newAppOpen}
        onOpenChange={setNewAppOpen}
        onSuccess={fetchContainers}
      />

      <ProvisionDbDialog
        open={provisionDbOpen}
        onOpenChange={setProvisionDbOpen}
        onSuccess={fetchDatabases}
      />

      <AddDomainDialog
        open={addDomainOpen}
        onOpenChange={setAddDomainOpen}
        containers={containers}
        onSuccess={fetchProxyHosts}
      />
    </div>
  );
}
export default App;
