export enum ECSEventCategory {
  Api = 'api',
  Authentication = 'authentication',
  Configuration = 'configuration',
  Database = 'database',
  Driver = 'driver',
  Email = 'email',
  File = 'file',
  Host = 'host',
  IAM = 'iam',
  IntrusionDetection = 'intrusion_detection',
  Library = 'library',
  Malware = 'malware',
  Network = 'network',
  Package = 'package',
  Process = 'process',
  Registry = 'registry',
  Session = 'session',
  Threat = 'threat',
  Vulnerability = 'vulnerability',
  Web = 'web'
}

export enum ECSEventKind {
  Alert = 'alert',
  Asset = 'asset',
  Enrichment = 'enrichment',
  Event = 'event',
  Metric = 'metric',
  State = 'state',
  PipelineError = 'pipeline_error',
  Signal = 'signal'
}

export enum ECSEventOutcome {
  Success = 'success',
  Failure = 'failure',
  Unknown = 'unknown'
}

export enum ECSEventType {
  Access       = 'access',
  Admin        = 'admin',
  Allowed      = 'allowed',
  Change       = 'change',
  Connection   = 'connection',
  Creation     = 'creation',
  Deletion     = 'deletion',
  Denied       = 'denied',
  Device       = 'device',
  End          = 'end',
  Error        = 'error',
  Group        = 'group',
  Indicator    = 'indicator',
  Info         = 'info',
  Installation = 'installation',
  Protocol     = 'protocol',
  Start        = 'start',
  User         = 'user',
}

export interface IECSLog {
  event?: IECSEvent
  http?: IECSHttp
  url?: IECSUrl
  clinet?: IECSClient
}


/*      EVENT     */
export interface IECSEvent {
  module?: string
  agent_id_status?: 'verified' | 'mismatch' | 'missing' | 'auth_metadata_missing'

  created?: Date
  /**
   * @private
   */
  ingested?: Date
  dataset?: string
  hash?: string
  kind?: ECSEventKind
  original?: string



  id?: string
  code?: string
  category: ECSEventCategory | ECSEventCategory[]
  type: ECSEventType | ECSEventType[]
  action?: string
  outcome: ECSEventOutcome
  risk_score?: number
  risk_score_norm?: number
  sequence?: number
  severity?: number
  timezone?: string | 'Etc/UTC'


  reason?: string
  reference?: string
  url?: string

  start?: Date
  end?: Date
  duration?: number
}

/*      ERROR     */
export interface IECSError {
  id?: string
  code?: string
  type?: string
  message: string
  stack_trace?: string
}

/*     PROCESS    */
export interface IECSProcess {
  pid?: number
  vpid?: number

  type?: string
  name?: string
  text?: string
  title?: string
  exit_code?: number

  start?: Date
  end?: Date
  uptime?: number

  args?: string | string[]
  args_count?: number
  env_vars?: string | string[]

  command_line?: string
  executable?: string
  working_directory?: string
  entity_id?: string
  interactive?: boolean
}

export interface IECSProcessIO {
  bytes_skipped?: {
    length: number
    offset: number
  }
  max_bytes_per_process_exceeded?: boolean
  total_bytes_captured?: number
  total_bytes_skipped?: number
}

export interface IECSProcessThread {
  id?: number
  name?: string

  capabilities?: {
    permitted?: string[]
    effective?: string[]
  }
}

/*      URL       */
export interface IECSUrl {
  full?: string
  original?: string
  domain?: string
  extension?: string
  fragment?: string
  password?: string
  username?: string
  path?: string
  port?: number
  query?: string
  registered_domain?: string
  scheme?: string
  subdomain?: string
  top_level_domain?: string
}

/*     CLIENT     */
export interface IECSClient {
  ip?: string
}

/*      HTTP      */
export interface IECSHttpBody {
  bytes?: number
  content?: string
}
export interface IECSHttpRequest {
  id?: string
  method?: 'GET' | 'HEAD' |
    'POST' | 'PUT' | 'PATCH' | 'DELETE' |
    'CONNECT' | 'OPTIONS' | 'TRACE'
  mime_type?: string
  referrer?: string
  body?: IECSHttpBody
  bytes?: number
  headers?: any
}

export interface IECSHttpResponse {
  mime_type?: string
  body?: IECSHttpBody
  bytes?: number
  status_code?: number
}

export interface IECSHttp {
  version?: string
  request?: IECSHttpRequest
  response?: IECSHttpResponse
}