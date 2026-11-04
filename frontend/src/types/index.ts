export interface User {
  username: string;
  authenticated: boolean;
}

export interface TelemetryData {
  timestamp: string;
  cpu: {
    usage_percent: number;
    cores: number;
    load_avg: [number, number, number]; // 1m, 5m, 15m
  };
  memory: {
    total_bytes: number;
    used_bytes: number;
    available_bytes: number;
    used_percent: number;
  };
  swap: {
    total_bytes: number;
    used_bytes: number;
    free_bytes: number;
    used_percent: number;
  };
  disk_root: {
    path: string;
    total_bytes: number;
    used_bytes: number;
    free_bytes: number;
    used_percent: number;
  };
  disk_opt: {
    path: string;
    total_bytes: number;
    used_bytes: number;
    free_bytes: number;
    used_percent: number;
  };
  network: {
    total_containers: number;
    running_containers: number;
    shared_network_containers: number;
  };
  location?: ServerLocation;
  domain?: string;
  server_ip?: string;
}

export interface ServerLocation {
  city: string;
  country: string;
  flag: string;
  datacenter: string;
  isp: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: number;
  ports: string[];
  networks: string[];
  ip_address: string;
  cpu_percent: number;
  memory_usage_bytes: number;
  memory_limit_bytes: number;
}

export interface DatabaseInfo {
  name: string;
  table_count: number;
  size_mb: number;
}

export interface RedisStats {
  connected_clients: number;
  used_memory_human: string;
  used_memory_bytes: number;
  total_keys: number;
  uptime_in_days: number;
  role: string;
}

export interface ProxyHost {
  id: number;
  domain_names: string[];
  forward_host: string;
  forward_port: number;
  certificate_id: number;
  ssl_forced: boolean;
  enabled: boolean;
  created_on: string;
}

export interface BackupArchive {
  filename: string;
  size_bytes: number;
  size_human: string;
  created_at: string;
}

export interface AppScaffoldRequest {
  slug: string;
  framework: 'nextjs' | 'vue-nginx' | 'laravel' | 'go-api';
  internal_port: number;
  with_database: boolean;
}
