var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// C:/Users/shrey/AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// worker.ts
var ALLOWED_ORIGIN = "https://app.proveloce.com";
var corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
};
function handleOptions(request) {
  const origin = request.headers.get("Origin");
  if (origin === ALLOWED_ORIGIN) {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return new Response(null, { status: 204 });
}
__name(handleOptions, "handleOptions");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(jsonResponse, "jsonResponse");
async function createJWT(payload, secret, expiresInSeconds = 604800) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1e3);
  const exp = now + expiresInSeconds;
  const fullPayload = { ...payload, iat: now, exp };
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
__name(createJWT, "createJWT");
async function verifyJWT(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signatureStr = atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/"));
    const signature = new Uint8Array([...signatureStr].map((c) => c.charCodeAt(0)));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      encoder.encode(`${headerB64}.${payloadB64}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  return response.json();
}
__name(exchangeCodeForTokens, "exchangeCodeForTokens");
async function getGoogleUserInfo(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error("Failed to get user info from Google");
  }
  return response.json();
}
__name(getGoogleUserInfo, "getGoogleUserInfo");
var worker_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }
    try {
      if (url.pathname === "/api") {
        return jsonResponse({ success: true, message: "ProVeloce API Active \u{1F680}" });
      }
      if (url.pathname === "/health") {
        return jsonResponse({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      }
      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        try {
          const body = await request.json();
          if (!body.email || !body.password) {
            return jsonResponse({ success: false, error: "Email and password are required" }, 400);
          }
          if (!env2.proveloce_db) {
            return jsonResponse({ success: false, error: "Database not configured" }, 500);
          }
          const user = await env2.proveloce_db.prepare(
            "SELECT id, name, email, role, password_hash FROM users WHERE email = ?"
          ).bind(body.email).first();
          if (!user) {
            return jsonResponse({ success: false, error: "Invalid email or password" }, 401);
          }
          const token = await createJWT(
            { userId: user.id, email: user.email, name: user.name, role: user.role },
            env2.JWT_SECRET || "default-secret"
          );
          return jsonResponse({
            success: true,
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
          });
        } catch (e) {
          return jsonResponse({ success: false, error: e.message || "Login failed" }, 400);
        }
      }
      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        try {
          const user = await env2.proveloce_db.prepare(
            "SELECT id, name, email, phone, role, status, email_verified, created_at FROM users WHERE id = ?"
          ).bind(payload.userId).first();
          if (!user) {
            return jsonResponse({ success: false, error: "User not found" }, 404);
          }
          const application = await env2.proveloce_db.prepare(
            "SELECT id, status, submitted_at, rejection_reason FROM expert_applications WHERE user_id = ?"
          ).bind(payload.userId).first();
          const applicationStatus = application ? (application.status || "DRAFT").toUpperCase() : "NONE";
          return jsonResponse({
            success: true,
            data: {
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: (user.role || "customer").toUpperCase(),
                status: user.status || "ACTIVE",
                emailVerified: !!user.email_verified,
                createdAt: user.created_at
              },
              // Application state for UI control
              expertApplication: {
                status: applicationStatus,
                applicationId: application?.id || null,
                submittedAt: application?.submitted_at || null,
                rejectionReason: application?.rejection_reason || null
              }
            }
          });
        } catch (error) {
          console.error("Error fetching user:", error);
          return jsonResponse({ success: false, error: "Failed to fetch user" }, 500);
        }
      }
      if (url.pathname === "/api/auth/google") {
        const redirectUri = env2.GOOGLE_CALLBACK_URL || "https://backend.proveloce.com/api/auth/google/callback";
        const clientId = env2.GOOGLE_CLIENT_ID;
        const scope = "openid email profile";
        if (!clientId) {
          return jsonResponse({ success: false, error: "GOOGLE_CLIENT_ID not configured" }, 500);
        }
        const googleURL = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleURL.searchParams.set("client_id", clientId);
        googleURL.searchParams.set("redirect_uri", redirectUri);
        googleURL.searchParams.set("response_type", "code");
        googleURL.searchParams.set("scope", scope);
        googleURL.searchParams.set("access_type", "offline");
        googleURL.searchParams.set("prompt", "consent");
        return Response.redirect(googleURL.toString(), 302);
      }
      if (url.pathname === "/api/auth/google/callback") {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const frontendUrl = env2.FRONTEND_URL || "https://app.proveloce.com";
        if (error) {
          return Response.redirect(
            `${frontendUrl}/auth/error?error=${encodeURIComponent(error)}`,
            302
          );
        }
        if (!code) {
          return Response.redirect(
            `${frontendUrl}/auth/error?error=no_code_provided`,
            302
          );
        }
        try {
          const tokens = await exchangeCodeForTokens(
            code,
            env2.GOOGLE_CLIENT_ID,
            env2.GOOGLE_CLIENT_SECRET,
            env2.GOOGLE_CALLBACK_URL || "https://backend.proveloce.com/api/auth/google/callback"
          );
          const googleUser = await getGoogleUserInfo(tokens.access_token);
          if (!env2.proveloce_db) {
            console.error("D1 Database not bound");
            return Response.redirect(
              `${frontendUrl}/auth/error?error=database_not_configured`,
              302
            );
          }
          let user = await env2.proveloce_db.prepare(
            "SELECT id, name, email, role FROM users WHERE email = ?"
          ).bind(googleUser.email).first();
          if (!user) {
            const userId = crypto.randomUUID();
            await env2.proveloce_db.prepare(
              "INSERT INTO users (id, name, email, role, email_verified, avatar_data) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(
              userId,
              googleUser.name,
              googleUser.email,
              "customer",
              1,
              googleUser.picture || null
            ).run();
            user = {
              id: userId,
              name: googleUser.name,
              email: googleUser.email,
              role: "customer"
            };
          }
          const jwtToken = await createJWT(
            {
              userId: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            },
            env2.JWT_ACCESS_SECRET || "default-secret",
            604800
            // 7 days
          );
          const redirectUrl = new URL(`${frontendUrl}/auth/success`);
          redirectUrl.searchParams.set("token", jwtToken);
          redirectUrl.searchParams.set("email", user.email);
          redirectUrl.searchParams.set("name", user.name);
          redirectUrl.searchParams.set("role", user.role);
          return Response.redirect(redirectUrl.toString(), 302);
        } catch (err) {
          console.error("OAuth callback error:", err);
          return Response.redirect(
            `${frontendUrl}/auth/error?error=${encodeURIComponent(err.message || "oauth_failed")}`,
            302
          );
        }
      }
      if (url.pathname === "/api/auth/verify" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "No token provided" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        return jsonResponse({ success: true, user: payload });
      }
      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (env2.proveloce_db) {
          const user = await env2.proveloce_db.prepare(
            "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?"
          ).bind(payload.userId).first();
          if (user) {
            return jsonResponse({ success: true, user });
          }
        }
        return jsonResponse({ success: true, user: payload });
      }
      if (url.pathname === "/api/profiles/me" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const profile = await env2.proveloce_db.prepare(
          "SELECT * FROM user_profiles WHERE user_id = ?"
        ).bind(payload.userId).first();
        return jsonResponse({
          success: true,
          data: {
            user: {
              id: user?.id,
              name: user?.name,
              email: user?.email,
              phone: user?.phone || null,
              role: user?.role,
              created_at: user?.created_at,
              profile: profile || null
            },
            profileCompletion: profile ? 80 : 20
          }
        });
      }
      if (url.pathname === "/api/profiles/me" && request.method === "PATCH") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const body = await request.json();
        const { name, phone, dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio } = body;
        if (name || phone) {
          const updates = [];
          const values = [];
          if (name) {
            updates.push("name = ?");
            values.push(name);
          }
          if (phone) {
            updates.push("phone = ?");
            values.push(phone);
          }
          if (updates.length > 0) {
            updates.push("updated_at = CURRENT_TIMESTAMP");
            values.push(payload.userId);
            await env2.proveloce_db.prepare(
              `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
            ).bind(...values).run();
          }
        }
        const existingProfile = await env2.proveloce_db.prepare(
          "SELECT id FROM user_profiles WHERE user_id = ?"
        ).bind(payload.userId).first();
        if (existingProfile) {
          await env2.proveloce_db.prepare(`
                        UPDATE user_profiles SET 
                            dob = COALESCE(?, dob),
                            gender = COALESCE(?, gender),
                            address_line1 = COALESCE(?, address_line1),
                            address_line2 = COALESCE(?, address_line2),
                            city = COALESCE(?, city),
                            state = COALESCE(?, state),
                            country = COALESCE(?, country),
                            pincode = COALESCE(?, pincode),
                            bio = COALESCE(?, bio),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                    `).bind(dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio, payload.userId).run();
        } else {
          const profileId = crypto.randomUUID();
          await env2.proveloce_db.prepare(`
                        INSERT INTO user_profiles (id, user_id, dob, gender, address_line1, address_line2, city, state, country, pincode, bio)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(profileId, payload.userId, dob, gender, addressLine1, addressLine2, city, state, country, pincode, bio).run();
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const profile = await env2.proveloce_db.prepare(
          "SELECT * FROM user_profiles WHERE user_id = ?"
        ).bind(payload.userId).first();
        return jsonResponse({
          success: true,
          message: "Profile updated successfully",
          data: {
            user: {
              id: user?.id,
              name: user?.name,
              email: user?.email,
              phone: user?.phone || null,
              role: user?.role,
              profile
            }
          }
        });
      }
      if (url.pathname === "/api/auth/change-password" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const body = await request.json();
        const { currentPassword, newPassword, confirmPassword } = body;
        if (!currentPassword || !newPassword || !confirmPassword) {
          return jsonResponse({ success: false, error: "All password fields are required" }, 400);
        }
        if (newPassword !== confirmPassword) {
          return jsonResponse({ success: false, error: "New password and confirmation do not match" }, 400);
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
          return jsonResponse({
            success: false,
            error: "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)"
          }, 400);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT id, password_hash FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        if (!user) {
          return jsonResponse({ success: false, error: "User not found" }, 404);
        }
        if (user.password_hash) {
          const encoder2 = new TextEncoder();
          const data2 = encoder2.encode(currentPassword);
          const hashBuffer2 = await crypto.subtle.digest("SHA-256", data2);
          const hashArray2 = Array.from(new Uint8Array(hashBuffer2));
          const currentHash = hashArray2.map((b) => b.toString(16).padStart(2, "0")).join("");
          if (currentHash !== user.password_hash) {
            return jsonResponse({ success: false, error: "Current password is incorrect" }, 400);
          }
        }
        const encoder = new TextEncoder();
        const data = encoder.encode(newPassword);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const newHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        await env2.proveloce_db.prepare(
          "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(newHash, payload.userId).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), payload.userId, "CHANGE_PASSWORD", "user", payload.userId, JSON.stringify({ timestamp: (/* @__PURE__ */ new Date()).toISOString() })).run();
        return jsonResponse({ success: true, message: "Password changed successfully" });
      }
      if (url.pathname === "/api/auth/login-history" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const history = await env2.proveloce_db.prepare(
          `SELECT id, action, ip_address, user_agent, metadata, created_at 
                     FROM activity_logs 
                     WHERE user_id = ? AND action IN ('LOGIN', 'LOGIN_OAUTH', 'LOGIN_FAILED')
                     ORDER BY created_at DESC 
                     LIMIT 20`
        ).bind(payload.userId).all();
        const loginHistory = history.results.map((entry) => ({
          id: entry.id,
          createdAt: entry.created_at,
          ipAddress: entry.ip_address || "Unknown",
          device: entry.user_agent ? entry.user_agent.substring(0, 50) + "..." : "Unknown device",
          success: entry.action !== "LOGIN_FAILED"
        }));
        return jsonResponse({ success: true, data: { loginHistory } });
      }
      if (url.pathname === "/api/db/test") {
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
        }
        const result = await env2.proveloce_db.prepare("SELECT 1 as test").all();
        return jsonResponse({ success: true, message: "D1 Database Connected \u2714", result: result.results });
      }
      if (url.pathname === "/api/db/users" && request.method === "GET") {
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
        }
        const result = await env2.proveloce_db.prepare(
          "SELECT id, name, email, role, created_at FROM users LIMIT 50"
        ).all();
        return jsonResponse({ success: true, users: result.results });
      }
      if (url.pathname === "/api/db/users" && request.method === "POST") {
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
        }
        const body = await request.json();
        const id = crypto.randomUUID();
        await env2.proveloce_db.prepare(
          "INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)"
        ).bind(id, body.name, body.email, body.role || "customer").run();
        return jsonResponse({ success: true, message: "User created", id }, 201);
      }
      if (url.pathname.startsWith("/api/db/users/") && request.method === "GET") {
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "D1 Database not bound" }, 500);
        }
        const id = url.pathname.split("/").pop();
        const result = await env2.proveloce_db.prepare(
          "SELECT id, name, email, role, created_at FROM users WHERE id = ?"
        ).bind(id).first();
        if (!result) {
          return jsonResponse({ success: false, error: "User not found" }, 404);
        }
        return jsonResponse({ success: true, user: result });
      }
      const checkAdminRole = /* @__PURE__ */ __name(async (req) => {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return { valid: false, error: "Unauthorized" };
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return { valid: false, error: "Invalid or expired token" };
        }
        const role = (payload.role || "").toLowerCase();
        if (role !== "admin" && role !== "superadmin") {
          return { valid: false, error: "Insufficient permissions" };
        }
        return { valid: true, payload };
      }, "checkAdminRole");
      if (url.pathname === "/api/admin/users" && request.method === "GET") {
        const auth = await checkAdminRole(request);
        if (!auth.valid) {
          return jsonResponse({ success: false, error: auth.error }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const filterRole = url.searchParams.get("role");
        const status = url.searchParams.get("status");
        const search = url.searchParams.get("search");
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;
        let query = "SELECT id, name, email, phone, role, status, email_verified, last_login_at, created_at FROM users WHERE 1=1";
        const params = [];
        const requesterRole = (auth.payload.role || "").toLowerCase();
        if (requesterRole === "superadmin") {
          query += " AND role != 'superadmin'";
        } else if (requesterRole === "admin") {
          query += " AND role IN ('customer', 'expert', 'analyst')";
        }
        if (filterRole) {
          query += " AND role = ?";
          params.push(filterRole);
        }
        if (status) {
          query += " AND status = ?";
          params.push(status);
        }
        if (search) {
          query += " AND (name LIKE ? OR email LIKE ?)";
          params.push(`%${search}%`, `%${search}%`);
        }
        const countQuery = query.replace("SELECT id, name, email, phone, role, status, email_verified, last_login_at, created_at", "SELECT COUNT(*) as total");
        const countResult = await env2.proveloce_db.prepare(countQuery).bind(...params).first();
        const total = countResult?.total || 0;
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);
        const result = await env2.proveloce_db.prepare(query).bind(...params).all();
        return jsonResponse({
          success: true,
          data: {
            users: result.results,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          }
        });
      }
      if (url.pathname.match(/^\/api\/admin\/users\/[^\/]+$/) && request.method === "GET") {
        const auth = await checkAdminRole(request);
        if (!auth.valid) {
          return jsonResponse({ success: false, error: auth.error }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const id = url.pathname.split("/").pop();
        const user = await env2.proveloce_db.prepare(
          "SELECT id, name, email, phone, role, status, email_verified, last_login_at, created_at FROM users WHERE id = ?"
        ).bind(id).first();
        if (!user) {
          return jsonResponse({ success: false, error: "User not found" }, 404);
        }
        const profile = await env2.proveloce_db.prepare(
          "SELECT * FROM user_profiles WHERE user_id = ?"
        ).bind(id).first();
        return jsonResponse({ success: true, data: { user: { ...user, profile } } });
      }
      if (url.pathname === "/api/admin/users" && request.method === "POST") {
        const auth = await checkAdminRole(request);
        if (!auth.valid) {
          return jsonResponse({ success: false, error: auth.error }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const body = await request.json();
        const { name, email, phone, role, status } = body;
        if (!name || !email || !phone || !body.password) {
          return jsonResponse({ success: false, error: "All fields are required (name, email, phone, password)" }, 400);
        }
        const existing = await env2.proveloce_db.prepare(
          "SELECT id FROM users WHERE email = ?"
        ).bind(email).first();
        if (existing) {
          return jsonResponse({ success: false, error: "Email already exists" }, 409);
        }
        const requesterRole = (auth.payload.role || "").toLowerCase();
        const newRole = (role || "customer").toLowerCase();
        if (requesterRole === "admin" && (newRole === "admin" || newRole === "superadmin")) {
          return jsonResponse({ success: false, error: "You don't have permission to create users with this role" }, 403);
        }
        if (newRole === "superadmin" && requesterRole !== "superadmin") {
          return jsonResponse({ success: false, error: "Only superadmin can create superadmin users" }, 403);
        }
        const password = body.password || "123user123";
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        const id = crypto.randomUUID();
        await env2.proveloce_db.prepare(
          "INSERT INTO users (id, name, email, phone, role, status, email_verified, password_hash) VALUES (?, ?, ?, ?, ?, ?, 1, ?)"
        ).bind(id, name, email, phone || null, newRole, status || "active", passwordHash).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), auth.payload.userId, "CREATE_USER", "user", id, JSON.stringify({ name, email, role })).run();
        const newUser = await env2.proveloce_db.prepare(
          "SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?"
        ).bind(id).first();
        return jsonResponse({ success: true, message: "User created successfully", data: { user: newUser } }, 201);
      }
      if (url.pathname.match(/^\/api\/admin\/users\/[^\/]+$/) && request.method === "PATCH") {
        const auth = await checkAdminRole(request);
        if (!auth.valid) {
          return jsonResponse({ success: false, error: auth.error }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const id = url.pathname.split("/").pop();
        const body = await request.json();
        const { name, email, phone, role, status } = body;
        const existing = await env2.proveloce_db.prepare(
          "SELECT id, role FROM users WHERE id = ?"
        ).bind(id).first();
        if (!existing) {
          return jsonResponse({ success: false, error: "User not found" }, 404);
        }
        const requesterRole = (auth.payload.role || "").toLowerCase();
        const targetRole = (existing.role || "").toLowerCase();
        if (targetRole === "superadmin") {
          return jsonResponse({ success: false, error: "Cannot modify superadmin accounts" }, 403);
        }
        if (requesterRole === "admin" && targetRole === "admin") {
          return jsonResponse({ success: false, error: "Admins cannot modify other admins" }, 403);
        }
        if (role !== void 0) {
          const newRole = role.toLowerCase();
          if (requesterRole === "admin" && (newRole === "admin" || newRole === "superadmin")) {
            return jsonResponse({ success: false, error: "You don't have permission to assign this role" }, 403);
          }
          if (newRole === "superadmin" && requesterRole !== "superadmin") {
            return jsonResponse({ success: false, error: "Only superadmin can assign superadmin role" }, 403);
          }
        }
        const updates = [];
        const values = [];
        if (name !== void 0) {
          updates.push("name = ?");
          values.push(name);
        }
        if (email !== void 0) {
          updates.push("email = ?");
          values.push(email);
        }
        if (phone !== void 0) {
          updates.push("phone = ?");
          values.push(phone);
        }
        if (role !== void 0) {
          updates.push("role = ?");
          values.push(role);
        }
        if (status !== void 0) {
          updates.push("status = ?");
          values.push(status);
        }
        if (updates.length === 0) {
          return jsonResponse({ success: false, error: "No fields to update" }, 400);
        }
        updates.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);
        await env2.proveloce_db.prepare(
          `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
        ).bind(...values).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), auth.payload.userId, "UPDATE_USER", "user", id, JSON.stringify(body)).run();
        const updatedUser = await env2.proveloce_db.prepare(
          "SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?"
        ).bind(id).first();
        return jsonResponse({ success: true, message: "User updated successfully", data: { user: updatedUser } });
      }
      if (url.pathname.match(/^\/api\/admin\/users\/[^\/]+$/) && request.method === "DELETE") {
        const auth = await checkAdminRole(request);
        if (!auth.valid) {
          return jsonResponse({ success: false, error: auth.error }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const id = url.pathname.split("/").pop();
        const existing = await env2.proveloce_db.prepare(
          "SELECT id, role FROM users WHERE id = ?"
        ).bind(id).first();
        if (!existing) {
          return jsonResponse({ success: false, error: "User not found" }, 404);
        }
        if (existing.role === "superadmin") {
          return jsonResponse({ success: false, error: "Cannot delete superadmin" }, 403);
        }
        await env2.proveloce_db.prepare(
          "UPDATE users SET status = 'deactivated', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(id).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), auth.payload.userId, "DELETE_USER", "user", id, JSON.stringify({ userId: id })).run();
        return jsonResponse({ success: true, message: "User deactivated successfully" });
      }
      if (url.pathname === "/api/admin/stats" && request.method === "GET") {
        const auth = await checkAdminRole(request);
        if (!auth.valid) {
          return jsonResponse({ success: false, error: auth.error }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const stats = {
          totalUsers: 0,
          admins: 0,
          analysts: 0,
          experts: 0,
          customers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          recentUsers: []
        };
        const roleCounts = await env2.proveloce_db.prepare(
          "SELECT role, COUNT(*) as count FROM users GROUP BY role"
        ).all();
        for (const row of roleCounts.results) {
          const role = (row.role || "").toLowerCase();
          const count = row.count || 0;
          stats.totalUsers += count;
          if (role === "admin") stats.admins = count;
          if (role === "analyst") stats.analysts = count;
          if (role === "expert") stats.experts = count;
          if (role === "customer") stats.customers = count;
        }
        const statusCounts = await env2.proveloce_db.prepare(
          "SELECT status, COUNT(*) as count FROM users GROUP BY status"
        ).all();
        for (const row of statusCounts.results) {
          const status = (row.status || "").toLowerCase();
          const count = row.count || 0;
          if (status === "active") stats.activeUsers = count;
          if (status === "pending_verification") stats.pendingUsers = count;
        }
        const recentUsers = await env2.proveloce_db.prepare(
          "SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5"
        ).all();
        stats.recentUsers = recentUsers.results;
        return jsonResponse({ success: true, data: stats });
      }
      if (url.pathname === "/api/admin/logs" && request.method === "GET") {
        const auth = await checkAdminRole(request);
        if (!auth.valid) {
          return jsonResponse({ success: false, error: auth.error }, 401);
        }
        if ((auth.payload.role || "").toLowerCase() !== "superadmin") {
          return jsonResponse({ success: false, error: "Superadmin access required" }, 403);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const action = url.searchParams.get("action");
        const userId = url.searchParams.get("userId");
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = (page - 1) * limit;
        let query = `
                    SELECT al.*, u.name as user_name, u.email as user_email 
                    FROM activity_logs al 
                    LEFT JOIN users u ON al.user_id = u.id 
                    WHERE 1=1
                `;
        const params = [];
        if (action) {
          query += " AND al.action = ?";
          params.push(action);
        }
        if (userId) {
          query += " AND al.user_id = ?";
          params.push(userId);
        }
        query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);
        const result = await env2.proveloce_db.prepare(query).bind(...params).all();
        return jsonResponse({ success: true, data: { logs: result.results } });
      }
      if (url.pathname === "/api/applications" && request.method === "GET") {
        console.log("\u{1F4CB} Admin: Fetching expert applications");
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const role = (payload.role || "").toLowerCase();
        if (role !== "admin" && role !== "superadmin") {
          console.log(`\u274C Access denied for role: ${role}`);
          return jsonResponse({ success: false, error: "Access denied. Admin role required." }, 403);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        let statusFilter = url.searchParams.get("status");
        if (statusFilter && statusFilter.includes(":")) {
          statusFilter = statusFilter.split(":")[0];
        }
        const validStatuses = ["PENDING", "APPROVED", "REJECTED", "DRAFT", "UNDER_REVIEW", "REQUIRES_CLARIFICATION", ""];
        if (statusFilter && !validStatuses.includes(statusFilter.toUpperCase())) {
          statusFilter = null;
        }
        console.log(`\u{1F4CA} Status filter: ${statusFilter || "none"}`);
        try {
          let query = `
                        SELECT 
                            ea.id,
                            ea.user_id as userId,
                            ea.status,
                            ea.dob,
                            ea.gender,
                            ea.address_line1 as addressLine1,
                            ea.address_line2 as addressLine2,
                            ea.city,
                            ea.state,
                            ea.country,
                            ea.pincode,
                            ea.government_id_type as governmentIdType,
                            ea.government_id_url as governmentIdUrl,
                            ea.profile_photo_url as profilePhotoUrl,
                            ea.domains,
                            ea.skills,
                            ea.years_of_experience as yearsOfExperience,
                            ea.summary_bio as summaryBio,
                            ea.resume_url as resumeUrl,
                            ea.portfolio_urls as portfolioUrls,
                            ea.certification_urls as certificationUrls,
                            ea.working_type as workingType,
                            ea.hourly_rate as hourlyRate,
                            ea.languages,
                            ea.available_days as availableDays,
                            ea.available_time_slots as availableTimeSlots,
                            ea.work_preference as workPreference,
                            ea.communication_mode as communicationMode,
                            ea.terms_accepted as termsAccepted,
                            ea.nda_accepted as ndaAccepted,
                            ea.signature_url as signatureUrl,
                            ea.rejection_reason as rejectionReason,
                            ea.reviewed_by as reviewedBy,
                            ea.reviewed_at as reviewedAt,
                            ea.created_at as createdAt,
                            ea.submitted_at as submittedAt,
                            ea.updated_at as updatedAt,
                            u.id as "user.id",
                            u.name as "user.name",
                            u.email as "user.email",
                            u.phone as "user.phone"
                        FROM expert_applications ea
                        JOIN users u ON u.id = ea.user_id
                    `;
          const params = [];
          if (statusFilter && statusFilter !== "") {
            query += ` WHERE LOWER(ea.status) = LOWER(?)`;
            params.push(statusFilter);
          }
          query += ` ORDER BY ea.created_at DESC LIMIT 100`;
          const result = await env2.proveloce_db.prepare(query).bind(...params).all();
          console.log(`\u2705 Found ${result.results.length} applications`);
          const applications = result.results.map((row) => {
            let domains = [];
            let skills = [];
            let availableDays = [];
            let availableTimeSlots = [];
            try {
              domains = row.domains ? JSON.parse(row.domains) : [];
            } catch {
            }
            try {
              skills = row.skills ? JSON.parse(row.skills) : [];
            } catch {
            }
            try {
              availableDays = row.availableDays ? JSON.parse(row.availableDays) : [];
            } catch {
            }
            try {
              availableTimeSlots = row.availableTimeSlots ? JSON.parse(row.availableTimeSlots) : [];
            } catch {
            }
            let portfolioUrls = [];
            let certificationUrls = [];
            let languages = [];
            try {
              portfolioUrls = row.portfolioUrls ? JSON.parse(row.portfolioUrls) : [];
            } catch {
            }
            try {
              certificationUrls = row.certificationUrls ? JSON.parse(row.certificationUrls) : [];
            } catch {
            }
            try {
              languages = row.languages ? JSON.parse(row.languages) : [];
            } catch {
            }
            return {
              id: row.id,
              userId: row.userId,
              status: (row.status || "DRAFT").toUpperCase(),
              dob: row.dob,
              gender: row.gender,
              addressLine1: row.addressLine1,
              addressLine2: row.addressLine2,
              city: row.city,
              state: row.state,
              country: row.country,
              pincode: row.pincode,
              governmentIdType: row.governmentIdType,
              governmentIdUrl: row.governmentIdUrl,
              profilePhotoUrl: row.profilePhotoUrl,
              domains,
              skills,
              yearsOfExperience: row.yearsOfExperience,
              summaryBio: row.summaryBio,
              resumeUrl: row.resumeUrl,
              portfolioUrls,
              certificationUrls,
              workingType: row.workingType,
              hourlyRate: row.hourlyRate,
              languages,
              availableDays,
              availableTimeSlots,
              workPreference: row.workPreference,
              communicationMode: row.communicationMode,
              termsAccepted: row.termsAccepted,
              ndaAccepted: row.ndaAccepted,
              signatureUrl: row.signatureUrl,
              rejectionReason: row.rejectionReason,
              reviewedBy: row.reviewedBy,
              reviewedAt: row.reviewedAt,
              createdAt: row.createdAt,
              submittedAt: row.submittedAt,
              updatedAt: row.updatedAt,
              user: {
                id: row["user.id"],
                name: row["user.name"],
                email: row["user.email"],
                phone: row["user.phone"]
              }
            };
          });
          return jsonResponse({
            success: true,
            data: {
              applications,
              count: applications.length
            }
          });
        } catch (error) {
          console.error("Error fetching applications:", error);
          return jsonResponse({
            success: true,
            data: {
              applications: [],
              count: 0
            }
          });
        }
      }
      if (url.pathname.match(/^\/api\/applications\/[^\/]+$/) && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const role = (payload.role || "").toLowerCase();
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const pathParts = url.pathname.split("/");
        const applicationId = pathParts[3];
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        try {
          const app = await env2.proveloce_db.prepare(`
                        SELECT 
                            ea.*,
                            u.name as user_name,
                            u.email as user_email,
                            u.phone as user_phone
                        FROM expert_applications ea
                        JOIN users u ON u.id = ea.user_id
                        WHERE ea.id = ?
                    `).bind(applicationId).first();
          if (!app) {
            return jsonResponse({ success: false, error: "Application not found" }, 404);
          }
          const docsResult = await env2.proveloce_db.prepare(`
                        SELECT * FROM expert_documents WHERE application_id = ? OR user_id = ?
                    `).bind(applicationId, app.user_id).all();
          const documents = [];
          for (const doc of docsResult.results) {
            let signedUrl = null;
            if (doc.r2_object_key && env2.EXPERT_APPLICATION) {
              try {
                const object = await env2.EXPERT_APPLICATION.head(doc.r2_object_key);
                if (object) {
                  signedUrl = `https://backend.proveloce.com/api/documents/${doc.id}/download`;
                }
              } catch (e) {
                console.log(`Could not find R2 object: ${doc.r2_object_key}`);
              }
            }
            documents.push({
              id: doc.id,
              type: doc.document_type,
              fileName: doc.file_name,
              r2Key: doc.r2_object_key,
              url: signedUrl,
              reviewStatus: doc.review_status,
              uploadedAt: doc.uploaded_at
            });
          }
          let domains = [], skills = [], languages = [], availableDays = [], availableTimeSlots = [];
          let portfolioUrls = [], certificationUrls = [];
          try {
            domains = app.domains ? JSON.parse(app.domains) : [];
          } catch {
          }
          try {
            skills = app.skills ? JSON.parse(app.skills) : [];
          } catch {
          }
          try {
            languages = app.languages ? JSON.parse(app.languages) : [];
          } catch {
          }
          try {
            availableDays = app.available_days ? JSON.parse(app.available_days) : [];
          } catch {
          }
          try {
            availableTimeSlots = app.available_time_slots ? JSON.parse(app.available_time_slots) : [];
          } catch {
          }
          try {
            portfolioUrls = app.portfolio_urls ? JSON.parse(app.portfolio_urls) : [];
          } catch {
          }
          try {
            certificationUrls = app.certification_urls ? JSON.parse(app.certification_urls) : [];
          } catch {
          }
          const application = {
            id: app.id,
            userId: app.user_id,
            status: (app.status || "DRAFT").toUpperCase(),
            // Personal Info
            user: {
              name: app.user_name,
              email: app.user_email,
              phone: app.user_phone
            },
            dob: app.dob,
            gender: app.gender,
            address: {
              line1: app.address_line1,
              line2: app.address_line2,
              city: app.city,
              state: app.state,
              country: app.country,
              pincode: app.pincode
            },
            // Professional Info
            governmentIdType: app.government_id_type,
            domains,
            skills,
            yearsOfExperience: app.years_of_experience,
            summaryBio: app.summary_bio,
            workingType: app.working_type,
            hourlyRate: app.hourly_rate,
            projectRate: app.project_rate,
            languages,
            portfolioUrls,
            // Availability
            availableDays,
            availableTimeSlots,
            workPreference: app.work_preference,
            communicationMode: app.communication_mode,
            // Legal
            termsAccepted: !!app.terms_accepted,
            ndaAccepted: !!app.nda_accepted,
            signatureUrl: app.signature_url,
            // Documents (from R2)
            documents,
            profilePhotoUrl: app.profile_photo_url,
            governmentIdUrl: app.government_id_url,
            resumeUrl: app.resume_url,
            certificationUrls,
            // Timestamps
            createdAt: app.created_at,
            updatedAt: app.updated_at,
            submittedAt: app.submitted_at,
            // Review Info
            reviewedBy: app.reviewed_by,
            reviewedAt: app.reviewed_at,
            rejectionReason: app.rejection_reason,
            internalNotes: app.internal_notes
          };
          return jsonResponse({
            success: true,
            data: { application }
          });
        } catch (error) {
          console.error("Error fetching application details:", error);
          return jsonResponse({ success: false, error: "Failed to fetch application" }, 500);
        }
      }
      if (url.pathname.match(/^\/api\/applications\/[^\/]+\/approve$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const role = (payload.role || "").toLowerCase();
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const pathParts = url.pathname.split("/");
        const applicationId = pathParts[3];
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const app = await env2.proveloce_db.prepare(
          "SELECT user_id FROM expert_applications WHERE id = ?"
        ).bind(applicationId).first();
        if (!app) {
          return jsonResponse({ success: false, error: "Application not found" }, 404);
        }
        await env2.proveloce_db.prepare(
          "UPDATE expert_applications SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(applicationId).run();
        await env2.proveloce_db.prepare(
          "UPDATE users SET role = 'expert', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(app.user_id).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), payload.userId, "APPROVE_EXPERT_APPLICATION", "expert_application", applicationId, JSON.stringify({ approvedBy: payload.userId })).run();
        return jsonResponse({ success: true, message: "Application approved" });
      }
      if (url.pathname.match(/^\/api\/applications\/[^\/]+\/reject$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const role = (payload.role || "").toLowerCase();
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const pathParts = url.pathname.split("/");
        const applicationId = pathParts[3];
        const body = await request.json();
        const reason = body.reason || "No reason provided";
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        await env2.proveloce_db.prepare(
          "UPDATE expert_applications SET status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(reason, applicationId).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), payload.userId, "REJECT_EXPERT_APPLICATION", "expert_application", applicationId, JSON.stringify({ rejectedBy: payload.userId, reason })).run();
        return jsonResponse({ success: true, message: "Application rejected" });
      }
      if (url.pathname.match(/^\/api\/applications\/[^\/]+\/remove$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const role = (payload.role || "").toLowerCase();
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const pathParts = url.pathname.split("/");
        const applicationId = pathParts[3];
        const body = await request.json();
        const reason = body.reason || "No reason provided";
        const permanentBan = body.permanentBan || false;
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        try {
          const app = await env2.proveloce_db.prepare(
            "SELECT user_id, status FROM expert_applications WHERE id = ?"
          ).bind(applicationId).first();
          if (!app) {
            return jsonResponse({ success: false, error: "Application not found" }, 404);
          }
          if ((app.status || "").toLowerCase() !== "approved") {
            return jsonResponse({
              success: false,
              error: "Can only remove approved experts. Current status: " + app.status
            }, 400);
          }
          await env2.proveloce_db.prepare(`
                        UPDATE expert_applications 
                        SET status = 'revoked', 
                            rejection_reason = ?, 
                            reviewed_by = ?,
                            reviewed_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    `).bind(reason, payload.userId, applicationId).run();
          const newRole = permanentBan ? "suspended" : "customer";
          await env2.proveloce_db.prepare(
            "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).bind(newRole, app.user_id).run();
          await env2.proveloce_db.prepare(
            "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            crypto.randomUUID(),
            payload.userId,
            "REMOVE_EXPERT",
            "expert_application",
            applicationId,
            JSON.stringify({ removedBy: payload.userId, reason, permanentBan })
          ).run();
          return jsonResponse({
            success: true,
            message: permanentBan ? "Expert removed and permanently banned" : "Expert removed"
          });
        } catch (error) {
          console.error("Error removing expert:", error);
          return jsonResponse({ success: false, error: "Failed to remove expert" }, 500);
        }
      }
      if (url.pathname === "/api/expert-application" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        try {
          let application = await env2.proveloce_db.prepare(
            "SELECT * FROM expert_applications WHERE user_id = ?"
          ).bind(payload.userId).first();
          if (!application) {
            const newId = crypto.randomUUID();
            await env2.proveloce_db.prepare(`
                            INSERT INTO expert_applications (id, user_id, status, created_at, updated_at)
                            VALUES (?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `).bind(newId, payload.userId).run();
            application = {
              id: newId,
              user_id: payload.userId,
              status: "draft",
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            console.log(`\u2705 Auto-created DRAFT application for user ${payload.userId}`);
          }
          return jsonResponse({
            success: true,
            data: { application }
          });
        } catch (error) {
          console.error("Error fetching/creating application:", error);
          return jsonResponse({ success: false, error: "Failed to fetch application" }, 500);
        }
      }
      if (url.pathname === "/api/expert-application" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        try {
          const body = await request.json();
          const existing = await env2.proveloce_db.prepare(
            "SELECT id, status FROM expert_applications WHERE user_id = ?"
          ).bind(payload.userId).first();
          if (existing) {
            const currentStatus = (existing.status || "").toLowerCase();
            if (currentStatus === "pending") {
              return jsonResponse({
                success: false,
                error: "Cannot modify application while it's under review"
              }, 400);
            }
            if (currentStatus === "approved") {
              return jsonResponse({
                success: false,
                error: "Your application has already been approved"
              }, 400);
            }
            await env2.proveloce_db.prepare(`
                            UPDATE expert_applications SET
                                status = 'draft',
                                dob = ?, gender = ?, address_line1 = ?, address_line2 = ?,
                                city = ?, state = ?, country = ?, pincode = ?,
                                government_id_type = ?, government_id_url = ?, profile_photo_url = ?,
                                domains = ?, years_of_experience = ?, summary_bio = ?, skills = ?,
                                resume_url = ?, portfolio_urls = ?, certification_urls = ?,
                                working_type = ?, hourly_rate = ?, languages = ?,
                                available_days = ?, available_time_slots = ?,
                                work_preference = ?, communication_mode = ?,
                                terms_accepted = ?, nda_accepted = ?, signature_url = ?,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = ?
                        `).bind(
              body.dob || null,
              body.gender || null,
              body.addressLine1 || null,
              body.addressLine2 || null,
              body.city || null,
              body.state || null,
              body.country || null,
              body.pincode || null,
              body.governmentIdType || null,
              body.governmentIdUrl || null,
              body.profilePhotoUrl || null,
              JSON.stringify(body.domains || []),
              body.yearsOfExperience || 0,
              body.summaryBio || null,
              JSON.stringify(body.skills || []),
              body.resumeUrl || null,
              JSON.stringify(body.portfolioLinks || []),
              JSON.stringify(body.certificationUrls || []),
              body.workingType || null,
              body.expectedRate || null,
              JSON.stringify(body.languages || []),
              JSON.stringify(body.availableDays || []),
              JSON.stringify(body.availableTimeSlots || []),
              body.workPreference || null,
              body.communicationMode || null,
              body.termsAccepted ? 1 : 0,
              body.ndaAccepted ? 1 : 0,
              body.signatureUrl || null,
              payload.userId
            ).run();
          } else {
            const id = crypto.randomUUID();
            await env2.proveloce_db.prepare(`
                            INSERT INTO expert_applications (
                                id, user_id, status,
                                dob, gender, address_line1, address_line2,
                                city, state, country, pincode,
                                government_id_type, government_id_url, profile_photo_url,
                                domains, years_of_experience, summary_bio, skills,
                                resume_url, portfolio_urls, certification_urls,
                                working_type, hourly_rate, languages,
                                available_days, available_time_slots,
                                work_preference, communication_mode,
                                terms_accepted, nda_accepted, signature_url
                            ) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
              id,
              payload.userId,
              body.dob || null,
              body.gender || null,
              body.addressLine1 || null,
              body.addressLine2 || null,
              body.city || null,
              body.state || null,
              body.country || null,
              body.pincode || null,
              body.governmentIdType || null,
              body.governmentIdUrl || null,
              body.profilePhotoUrl || null,
              JSON.stringify(body.domains || []),
              body.yearsOfExperience || 0,
              body.summaryBio || null,
              JSON.stringify(body.skills || []),
              body.resumeUrl || null,
              JSON.stringify(body.portfolioLinks || []),
              JSON.stringify(body.certificationUrls || []),
              body.workingType || null,
              body.expectedRate || null,
              JSON.stringify(body.languages || []),
              JSON.stringify(body.availableDays || []),
              JSON.stringify(body.availableTimeSlots || []),
              body.workPreference || null,
              body.communicationMode || null,
              body.termsAccepted ? 1 : 0,
              body.ndaAccepted ? 1 : 0,
              body.signatureUrl || null
            ).run();
          }
          console.log(`\u2705 Draft saved for user ${payload.userId}`);
          return jsonResponse({ success: true, message: "Application saved successfully" });
        } catch (error) {
          console.error("Error saving application draft:", error);
          return jsonResponse({ success: false, error: "Failed to save application" }, 500);
        }
      }
      if (url.pathname === "/api/expert-application/submit" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        try {
          const existing = await env2.proveloce_db.prepare(
            "SELECT id, status FROM expert_applications WHERE user_id = ?"
          ).bind(payload.userId).first();
          if (!existing) {
            return jsonResponse({
              success: false,
              error: "No application found. Please save a draft first."
            }, 404);
          }
          const currentStatus = (existing.status || "").toLowerCase();
          if (currentStatus === "pending") {
            return jsonResponse({
              success: false,
              error: "Application already submitted and under review"
            }, 400);
          }
          if (currentStatus === "approved") {
            return jsonResponse({
              success: false,
              error: "Your application has already been approved"
            }, 400);
          }
          await env2.proveloce_db.prepare(`
                        UPDATE expert_applications 
                        SET status = 'pending', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                    `).bind(payload.userId).run();
          await env2.proveloce_db.prepare(
            "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(crypto.randomUUID(), payload.userId, "SUBMIT_EXPERT_APPLICATION", "expert_application", existing.id, JSON.stringify({ timestamp: (/* @__PURE__ */ new Date()).toISOString() })).run();
          console.log(`\u2705 Application submitted for user ${payload.userId}`);
          return jsonResponse({ success: true, message: "Application submitted successfully" });
        } catch (error) {
          console.error("Error submitting application:", error);
          return jsonResponse({ success: false, error: "Failed to submit application" }, 500);
        }
      }
      if (url.pathname === "/api/documents/upload" && request.method === "POST") {
        console.log("\u{1F4C1} Document upload request received");
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.EXPERT_APPLICATION) {
          console.error("\u274C R2 bucket EXPERT_APPLICATION not bound");
          return jsonResponse({ success: false, error: "R2 storage not configured" }, 500);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        try {
          const formData = await request.formData();
          const file = formData.get("file");
          const documentType = formData.get("documentType") || "other";
          if (!file) {
            return jsonResponse({ success: false, error: "No file provided" }, 400);
          }
          console.log(`\u{1F4C4} Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`);
          const MAX_SIZE = 10 * 1024 * 1024;
          if (file.size > MAX_SIZE) {
            return jsonResponse({ success: false, error: "File size exceeds 10MB limit" }, 400);
          }
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ];
          if (!allowedTypes.includes(file.type)) {
            return jsonResponse({ success: false, error: `File type ${file.type} not allowed` }, 400);
          }
          const timestamp = Date.now();
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const objectKey = `experts/${payload.userId}/${documentType}/${timestamp}_${sanitizedName}`;
          console.log(`\u{1F511} R2 Object Key: ${objectKey}`);
          await env2.EXPERT_APPLICATION.put(objectKey, file.stream(), {
            httpMetadata: {
              contentType: file.type
            },
            customMetadata: {
              userId: payload.userId,
              documentType,
              originalName: file.name
            }
          });
          console.log(`\u2705 File uploaded to R2: ${objectKey}`);
          let applicationId = null;
          const existingApp = await env2.proveloce_db.prepare(
            "SELECT id FROM expert_applications WHERE user_id = ?"
          ).bind(payload.userId).first();
          if (existingApp) {
            applicationId = existingApp.id;
          }
          const docId = crypto.randomUUID();
          await env2.proveloce_db.prepare(`
                        INSERT INTO expert_documents (
                            id, user_id, application_id, document_type, file_name, 
                            file_type, file_size, r2_object_key, 
                            review_status, application_status, uploaded_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'draft', datetime('now'), datetime('now'))
                    `).bind(
            docId,
            payload.userId,
            applicationId,
            documentType,
            file.name,
            file.type,
            file.size,
            objectKey
          ).run();
          console.log(`\u2705 Document metadata saved to D1: ${docId}, linked to application: ${applicationId}`);
          return jsonResponse({
            success: true,
            message: "File uploaded successfully",
            data: {
              document: {
                id: docId,
                documentType,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                reviewStatus: "pending"
              }
            }
          });
        } catch (err) {
          console.error("\u274C Upload error:", err);
          return jsonResponse({ success: false, error: err.message || "Upload failed" }, 500);
        }
      }
      if (url.pathname === "/api/documents/my-documents" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const docs = await env2.proveloce_db.prepare(`
                    SELECT id, document_type, file_name, file_type, file_size, 
                           r2_object_key, review_status, application_status, uploaded_at
                    FROM expert_documents 
                    WHERE user_id = ? 
                    ORDER BY uploaded_at DESC
                `).bind(payload.userId).all();
        return jsonResponse({
          success: true,
          data: {
            documents: docs.results,
            count: docs.results.length
          }
        });
      }
      if (url.pathname.match(/^\/api\/documents\/[^\/]+\/url$/) && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const pathParts = url.pathname.split("/");
        const docId = pathParts[3];
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const doc = await env2.proveloce_db.prepare(`
                    SELECT id, user_id, document_type, file_name, file_type, r2_object_key
                    FROM expert_documents 
                    WHERE id = ?
                `).bind(docId).first();
        if (!doc) {
          return jsonResponse({ success: false, error: "Document not found" }, 404);
        }
        const role = (payload.role || "").toLowerCase();
        if (doc.user_id !== payload.userId && role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const expiresAt = Date.now() + 10 * 60 * 1e3;
        const signedPayload = {
          docId: doc.id,
          objectKey: doc.r2_object_key,
          expiresAt
        };
        const signedToken = btoa(JSON.stringify(signedPayload));
        return jsonResponse({
          success: true,
          data: {
            document: doc,
            url: `/api/documents/${doc.id}/stream?token=${signedToken}`,
            expiresIn: 600
          }
        });
      }
      if (url.pathname.match(/^\/api\/documents\/[^\/]+\/stream$/) && request.method === "GET") {
        const signedToken = url.searchParams.get("token");
        if (!signedToken) {
          return jsonResponse({ success: false, error: "Missing token" }, 401);
        }
        try {
          const tokenData = JSON.parse(atob(signedToken));
          if (Date.now() > tokenData.expiresAt) {
            return jsonResponse({ success: false, error: "Token expired" }, 401);
          }
          if (!env2.EXPERT_APPLICATION) {
            return jsonResponse({ success: false, error: "R2 not configured" }, 500);
          }
          const object = await env2.EXPERT_APPLICATION.get(tokenData.objectKey);
          if (!object) {
            return jsonResponse({ success: false, error: "File not found" }, 404);
          }
          return new Response(object.body, {
            headers: {
              "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
              "Content-Disposition": `inline; filename="${tokenData.objectKey.split("/").pop()}"`,
              ...corsHeaders
            }
          });
        } catch {
          return jsonResponse({ success: false, error: "Invalid token" }, 401);
        }
      }
      if (url.pathname === "/api/documents/submit" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const result = await env2.proveloce_db.prepare(`
                    UPDATE expert_documents 
                    SET application_status = 'submitted', updated_at = datetime('now')
                    WHERE user_id = ? AND application_status = 'draft'
                `).bind(payload.userId).run();
        return jsonResponse({
          success: true,
          message: `${result.changes} document(s) submitted for review`,
          data: { submittedCount: result.changes }
        });
      }
      if (url.pathname.match(/^\/api\/admin\/applications\/[^\/]+\/documents$/) && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const role = (payload.role || "").toLowerCase();
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Admin access required" }, 403);
        }
        const pathParts = url.pathname.split("/");
        const applicationId = pathParts[4];
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const docs = await env2.proveloce_db.prepare(`
                    SELECT ed.*, ea.status as application_status_main, u.name as user_name, u.email as user_email
                    FROM expert_documents ed
                    LEFT JOIN expert_applications ea ON ed.application_id = ea.id
                    LEFT JOIN users u ON ed.user_id = u.id
                    WHERE ed.application_id = ?
                    ORDER BY ed.uploaded_at DESC
                `).bind(applicationId).all();
        return jsonResponse({
          success: true,
          data: {
            documents: docs.results,
            count: docs.results.length
          }
        });
      }
      if (url.pathname === "/api/admin/documents" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const role = (payload.role || "").toLowerCase();
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Admin access required" }, 403);
        }
        if (!env2.proveloce_db) {
          return jsonResponse({ success: false, error: "Database not configured" }, 500);
        }
        const status = url.searchParams.get("status") || "";
        let query = `
                    SELECT ed.*, ea.status as app_status, u.name as user_name, u.email as user_email
                    FROM expert_documents ed
                    LEFT JOIN expert_applications ea ON ed.application_id = ea.id
                    LEFT JOIN users u ON ed.user_id = u.id
                `;
        if (status) {
          query += ` WHERE ea.status = '${status}'`;
        }
        query += ` ORDER BY ed.uploaded_at DESC LIMIT 100`;
        const docs = await env2.proveloce_db.prepare(query).all();
        return jsonResponse({
          success: true,
          data: {
            documents: docs.results,
            count: docs.results.length
          }
        });
      }
      if (url.pathname.match(/^\/api\/documents\/[^\/]+$/) && request.method === "DELETE") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const pathParts = url.pathname.split("/");
        const documentId = pathParts[3];
        if (!env2.proveloce_db || !env2.EXPERT_APPLICATION) {
          return jsonResponse({ success: false, error: "Storage not configured" }, 500);
        }
        try {
          const doc = await env2.proveloce_db.prepare(`
                        SELECT id, user_id, r2_object_key, file_name, document_type
                        FROM expert_documents
                        WHERE id = ?
                    `).bind(documentId).first();
          if (!doc) {
            return jsonResponse({ success: false, error: "Document not found" }, 404);
          }
          const role = (payload.role || "").toLowerCase();
          if (doc.user_id !== payload.userId && role !== "admin" && role !== "superadmin") {
            return jsonResponse({ success: false, error: "Access denied" }, 403);
          }
          const r2Key = doc.r2_object_key;
          console.log(`\u{1F5D1}\uFE0F Deleting from R2: ${r2Key}`);
          try {
            await env2.EXPERT_APPLICATION.delete(r2Key);
            console.log(`\u2705 R2 deletion successful: ${r2Key}`);
          } catch (r2Error) {
            console.error(`\u274C R2 deletion failed: ${r2Error.message}`);
            return jsonResponse({
              success: false,
              error: "Failed to delete file from storage"
            }, 500);
          }
          console.log(`\u{1F5D1}\uFE0F Deleting from D1: ${documentId}`);
          await env2.proveloce_db.prepare(`
                        DELETE FROM expert_documents WHERE id = ?
                    `).bind(documentId).run();
          console.log(`\u2705 D1 deletion successful: ${documentId}`);
          console.log(`\u{1F4CB} AUDIT: User ${payload.userId} (${role}) deleted document ${documentId} (${doc.file_name}) with R2 key ${r2Key}`);
          return jsonResponse({
            success: true,
            message: "Document deleted successfully",
            data: {
              deletedId: documentId,
              deletedFile: doc.file_name,
              deletedBy: payload.userId,
              deletedAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
        } catch (error) {
          console.error("\u274C Document deletion error:", error);
          return jsonResponse({
            success: false,
            error: error.message || "Failed to delete document"
          }, 500);
        }
      }
      if (url.pathname === "/api/tasks" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toLowerCase() || "";
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can create tasks" }, 403);
        }
        try {
          const body = await request.json();
          const { title: title2, description, domain: domain2, deadline, price_budget, priority, expert_ids } = body;
          if (!title2) {
            return jsonResponse({ success: false, error: "Title is required" }, 400);
          }
          const taskId = crypto.randomUUID();
          await env2.proveloce_db.prepare(`
                        INSERT INTO tasks (id, title, description, domain, deadline, price_budget, priority, status, admin_id, created_by_id, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(
            taskId,
            title2,
            description || null,
            domain2 || null,
            deadline || null,
            price_budget || null,
            priority || "MEDIUM",
            payload.userId,
            payload.userId
          ).run();
          let assignedCount = 0;
          if (expert_ids && Array.isArray(expert_ids) && expert_ids.length > 0) {
            for (const expertId of expert_ids) {
              try {
                await env2.proveloce_db.prepare(`
                                    INSERT INTO expert_tasks (id, task_id, expert_id, admin_id, status, created_at, updated_at)
                                    VALUES (?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                                `).bind(crypto.randomUUID(), taskId, expertId, payload.userId).run();
                assignedCount++;
              } catch (e) {
                console.error("Failed to assign expert:", expertId, e);
              }
            }
          }
          return jsonResponse({
            success: true,
            message: "Task created successfully",
            data: { taskId, assignedCount }
          });
        } catch (error) {
          console.error("Task creation error:", error);
          return jsonResponse({ success: false, error: error.message || "Failed to create task" }, 500);
        }
      }
      if (url.pathname === "/api/tasks" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toLowerCase() || "";
        let tasks = [];
        if (role === "superadmin") {
          const result = await env2.proveloce_db.prepare(`
                        SELECT t.*, u.name as admin_name,
                            (SELECT COUNT(*) FROM expert_tasks WHERE task_id = t.id) as assigned_count
                        FROM tasks t
                        LEFT JOIN users u ON t.admin_id = u.id
                        ORDER BY t.created_at DESC
                    `).all();
          tasks = result.results || [];
        } else if (role === "admin") {
          const result = await env2.proveloce_db.prepare(`
                        SELECT t.*, u.name as admin_name,
                            (SELECT COUNT(*) FROM expert_tasks WHERE task_id = t.id) as assigned_count
                        FROM tasks t
                        LEFT JOIN users u ON t.admin_id = u.id
                        WHERE t.admin_id = ?
                        ORDER BY t.created_at DESC
                    `).bind(payload.userId).all();
          tasks = result.results || [];
        } else if (role === "expert") {
          const result = await env2.proveloce_db.prepare(`
                        SELECT t.*, et.status as assignment_status, et.id as assignment_id
                        FROM tasks t
                        JOIN expert_tasks et ON et.task_id = t.id
                        WHERE et.expert_id = ?
                        ORDER BY t.created_at DESC
                    `).bind(payload.userId).all();
          tasks = result.results || [];
        }
        return jsonResponse({
          success: true,
          data: { tasks }
        });
      }
      if (url.pathname.match(/^\/api\/tasks\/[^\/]+\/assign$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toLowerCase() || "";
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can assign tasks" }, 403);
        }
        const taskId = url.pathname.split("/")[3];
        const body = await request.json();
        const { expert_ids } = body;
        if (!expert_ids || !Array.isArray(expert_ids) || expert_ids.length === 0) {
          return jsonResponse({ success: false, error: "expert_ids array is required" }, 400);
        }
        let assignedCount = 0;
        for (const expertId of expert_ids) {
          try {
            await env2.proveloce_db.prepare(`
                            INSERT OR IGNORE INTO expert_tasks (id, task_id, expert_id, admin_id, status, created_at, updated_at)
                            VALUES (?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `).bind(crypto.randomUUID(), taskId, expertId, payload.userId).run();
            assignedCount++;
          } catch (e) {
            console.error("Failed to assign expert:", expertId, e);
          }
        }
        return jsonResponse({
          success: true,
          message: `Task assigned to ${assignedCount} experts`,
          data: { taskId, assignedCount }
        });
      }
      if (url.pathname.match(/^\/api\/expert\/tasks\/[^\/]+\/accept$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const taskId = url.pathname.split("/")[4];
        await env2.proveloce_db.prepare(`
                    UPDATE expert_tasks SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP
                    WHERE task_id = ? AND expert_id = ? AND status = 'PENDING'
                `).bind(taskId, payload.userId).run();
        return jsonResponse({ success: true, message: "Task accepted" });
      }
      if (url.pathname.match(/^\/api\/expert\/tasks\/[^\/]+\/decline$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const taskId = url.pathname.split("/")[4];
        await env2.proveloce_db.prepare(`
                    UPDATE expert_tasks SET status = 'DECLINED', updated_at = CURRENT_TIMESTAMP
                    WHERE task_id = ? AND expert_id = ?
                `).bind(taskId, payload.userId).run();
        return jsonResponse({ success: true, message: "Task declined" });
      }
      if (url.pathname.match(/^\/api\/expert\/tasks\/[^\/]+\/complete$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const taskId = url.pathname.split("/")[4];
        await env2.proveloce_db.prepare(`
                    UPDATE expert_tasks SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
                    WHERE task_id = ? AND expert_id = ? AND status IN ('ACCEPTED', 'IN_PROGRESS')
                `).bind(taskId, payload.userId).run();
        return jsonResponse({ success: true, message: "Task marked as completed" });
      }
      if (url.pathname === "/api/experts" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toLowerCase() || "";
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can view experts list" }, 403);
        }
        const domain2 = url.searchParams.get("domain");
        const skill = url.searchParams.get("skill");
        const verified = url.searchParams.get("verified");
        let query = `
                    SELECT id, name, email, location, verified, rating, skills, domains, availability
                    FROM users WHERE role = 'expert'
                `;
        const params = [];
        if (verified === "true") {
          query += ` AND verified = 1`;
        }
        query += ` ORDER BY rating DESC NULLS LAST, name ASC`;
        const result = await env2.proveloce_db.prepare(query).all();
        let experts = result.results || [];
        if (domain2) {
          experts = experts.filter((e) => {
            try {
              const domains = JSON.parse(e.domains || "[]");
              return domains.includes(domain2);
            } catch {
              return false;
            }
          });
        }
        if (skill) {
          experts = experts.filter((e) => {
            try {
              const skills = JSON.parse(e.skills || "[]");
              return skills.includes(skill);
            } catch {
              return false;
            }
          });
        }
        return jsonResponse({
          success: true,
          data: { experts }
        });
      }
      if (url.pathname === "/api/expert/dashboard" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        if (!user || user.role?.toLowerCase() !== "expert") {
          return jsonResponse({ success: false, error: "Expert access required" }, 403);
        }
        const activeTasks = await env2.proveloce_db.prepare(
          "SELECT COUNT(*) as count FROM tasks WHERE assigned_to_id = ? AND status = 'active'"
        ).bind(payload.userId).first();
        const completedTasks = await env2.proveloce_db.prepare(
          "SELECT COUNT(*) as count FROM tasks WHERE assigned_to_id = ? AND status = 'completed'"
        ).bind(payload.userId).first();
        const pendingTasks = await env2.proveloce_db.prepare(
          "SELECT COUNT(*) as count FROM tasks WHERE assigned_to_id = ? AND status = 'pending'"
        ).bind(payload.userId).first();
        const earnings = await env2.proveloce_db.prepare(
          "SELECT COALESCE(SUM(net_amount), 0) as total FROM expert_earnings WHERE expert_id = ? AND payment_status = 'paid'"
        ).bind(payload.userId).first();
        return jsonResponse({
          success: true,
          data: {
            stats: {
              activeTasks: activeTasks?.count || 0,
              completedTasks: completedTasks?.count || 0,
              pendingTasks: pendingTasks?.count || 0,
              totalEarnings: earnings?.total || 0
            },
            recentActivity: []
          }
        });
      }
      if (url.pathname === "/api/expert/certifications" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const result = await env2.proveloce_db.prepare(`
                    SELECT id, title, issuer, credential_id, credential_url, 
                           issue_date, expiry_date, file_name, file_url, created_at
                    FROM expert_certifications 
                    WHERE expert_id = ?
                    ORDER BY created_at DESC
                `).bind(payload.userId).all();
        return jsonResponse({
          success: true,
          data: { certifications: result.results || [] }
        });
      }
      if (url.pathname === "/api/expert/portfolio" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const result = await env2.proveloce_db.prepare(`
                    SELECT id, title, description, skills, project_url, created_at
                    FROM expert_portfolio 
                    WHERE expert_id = ?
                    ORDER BY created_at DESC
                `).bind(payload.userId).all();
        const portfolioItems = [];
        for (const item of result.results || []) {
          const files = await env2.proveloce_db.prepare(`
                        SELECT id, file_name, file_type, file_url
                        FROM expert_portfolio_files 
                        WHERE portfolio_id = ?
                    `).bind(item.id).all();
          portfolioItems.push({
            ...item,
            skills: item.skills ? JSON.parse(item.skills) : [],
            files: files.results || []
          });
        }
        return jsonResponse({
          success: true,
          data: { portfolio: portfolioItems }
        });
      }
      if (url.pathname === "/api/expert/tasks" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const result = await env2.proveloce_db.prepare(`
                    SELECT t.id, t.title, t.description, t.deadline, t.status, t.priority, t.created_at,
                           u.name as customer_name
                    FROM tasks t
                    LEFT JOIN users u ON t.created_by_id = u.id
                    WHERE t.assigned_to_id = ?
                    ORDER BY t.created_at DESC
                `).bind(payload.userId).all();
        return jsonResponse({
          success: true,
          data: { tasks: result.results || [] }
        });
      }
      if (url.pathname === "/api/expert/earnings" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const result = await env2.proveloce_db.prepare(`
                    SELECT e.id, e.amount, e.platform_fee, e.net_amount, e.payment_status, 
                           e.payout_reference, e.payout_date, e.created_at,
                           t.title as task_title
                    FROM expert_earnings e
                    LEFT JOIN tasks t ON e.task_id = t.id
                    WHERE e.expert_id = ?
                    ORDER BY e.created_at DESC
                `).bind(payload.userId).all();
        const totals = await env2.proveloce_db.prepare(`
                    SELECT 
                        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN net_amount ELSE 0 END), 0) as total_paid,
                        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN net_amount ELSE 0 END), 0) as pending
                    FROM expert_earnings WHERE expert_id = ?
                `).bind(payload.userId).first();
        return jsonResponse({
          success: true,
          data: {
            earnings: result.results || [],
            summary: {
              totalPaid: totals?.total_paid || 0,
              pending: totals?.pending || 0
            }
          }
        });
      }
      if (url.pathname === "/api/expert/helpdesk" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const result = await env2.proveloce_db.prepare(`
                    SELECT id, subject, description, status, category, priority, created_at, resolved_at
                    FROM tickets 
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                `).bind(payload.userId).all();
        return jsonResponse({
          success: true,
          data: { tickets: result.results || [] }
        });
      }
      if (url.pathname === "/api/expert/notifications" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const result = await env2.proveloce_db.prepare(`
                    SELECT id, title, message, type, is_read, link, created_at
                    FROM notifications 
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT 50
                `).bind(payload.userId).all();
        return jsonResponse({
          success: true,
          data: { notifications: result.results || [] }
        });
      }
      if (url.pathname === "/api/helpdesk/tickets" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const sender = await env2.proveloce_db.prepare(
          "SELECT id, role, name, email, phone FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const senderRole = sender?.role?.toUpperCase() || "CUSTOMER";
        try {
          let category = "";
          let subject = "";
          let description = "";
          let attachmentFile = null;
          const contentType = request.headers.get("Content-Type") || "";
          if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            category = formData.get("category") || "";
            subject = formData.get("subject") || "";
            description = formData.get("description") || "";
            const file = formData.get("attachment");
            if (file && file instanceof File && file.size > 0) {
              attachmentFile = file;
            }
          } else {
            const body = await request.json();
            category = body.category || "";
            subject = body.subject || "";
            description = body.description || "";
          }
          const missingFields = [];
          if (!subject?.trim()) missingFields.push("subject");
          else if (subject.length > 150) {
            return jsonResponse({ success: false, error: "VALIDATION_ERROR", message: "Subject must be 150 characters or less" }, 400);
          }
          if (!category?.trim()) missingFields.push("category");
          else if (category.length > 100) {
            return jsonResponse({ success: false, error: "VALIDATION_ERROR", message: "Category must be 100 characters or less" }, 400);
          }
          if (!description?.trim()) missingFields.push("description");
          if (description?.length > 5e3) {
            return jsonResponse({ success: false, error: "VALIDATION_ERROR", message: "Description must be 5000 characters or less" }, 400);
          }
          if (missingFields.length > 0) {
            return jsonResponse({
              success: false,
              error: "VALIDATION_ERROR",
              message: `Missing required fields: ${missingFields.join(", ")}`,
              fields: missingFields
            }, 400);
          }
          const now = /* @__PURE__ */ new Date();
          const yyyymmdd = now.getUTCFullYear() + String(now.getUTCMonth() + 1).padStart(2, "0") + String(now.getUTCDate()).padStart(2, "0");
          const hhmm = String(now.getUTCHours()).padStart(2, "0") + String(now.getUTCMinutes()).padStart(2, "0");
          const ticketId = `PV-TK-${yyyymmdd}-${hhmm}`;
          let attachmentUrl = null;
          if (attachmentFile && env2.others) {
            const fileId = crypto.randomUUID();
            const fileExt = attachmentFile.name.split(".").pop() || "bin";
            const filePath = `helpdesk/${ticketId}/${fileId}.${fileExt}`;
            await env2.others.put(filePath, attachmentFile.stream(), {
              httpMetadata: { contentType: attachmentFile.type || "application/octet-stream" }
            });
            attachmentUrl = `/api/helpdesk/attachments/${filePath}`;
          }
          await env2.proveloce_db.prepare(`
                        INSERT INTO tickets (
                            ticket_id, user_id, user_role, user_full_name, user_email, user_phone_number,
                            subject, category, description, attachment_url, status
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
                    `).bind(
            ticketId,
            payload.userId,
            senderRole,
            sender?.name || "",
            sender?.email || "",
            sender?.phone || null,
            subject.trim(),
            category.trim(),
            description.trim(),
            attachmentUrl
          ).run();
          return jsonResponse({
            success: true,
            message: `Your ticket ${ticketId} has been created successfully`,
            data: {
              ticketId,
              attachmentUrl
            }
          });
        } catch (error) {
          console.error("Ticket creation error:", error);
          return jsonResponse({ success: false, error: error.message || "SERVER_ERROR" }, 500);
        }
      }
      if (url.pathname === "/api/helpdesk/tickets" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toUpperCase() || "CUSTOMER";
        let whereClause = "";
        let params = [];
        if (role === "CUSTOMER" || role === "EXPERT") {
          whereClause = "user_id = ?";
          params = [payload.userId];
        } else if (role === "ADMIN") {
          whereClause = "user_role IN (?, ?)";
          params = ["CUSTOMER", "EXPERT"];
        } else if (role === "SUPERADMIN") {
        }
        const query = `
                    SELECT 
                        t.*,
                        u_resp.name as responder_name,
                        u_resp.role as responder_role,
                        u_assign.name as assigned_user_name,
                        u_assign.role as assigned_user_role
                    FROM tickets t
                    LEFT JOIN users u_resp ON t.ticket_responder = u_resp.id
                    LEFT JOIN users u_assign ON t.ticket_assigned_user = u_assign.id
                    ${whereClause ? "WHERE " + whereClause : ""}
                    ORDER BY t.created_at DESC
                `;
        const result = await env2.proveloce_db.prepare(query).bind(...params).all();
        const tickets = result.results || [];
        return jsonResponse({
          success: true,
          data: { tickets }
        });
      }
      if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+$/) && !url.pathname.includes("/status") && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const ticketId = url.pathname.split("/")[4];
        const user = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toUpperCase() || "CUSTOMER";
        const ticket = await env2.proveloce_db.prepare(`
                    SELECT 
                        t.*,
                        u_resp.name as responder_name,
                        u_resp.role as responder_role,
                        u_assign.name as assigned_user_name,
                        u_assign.role as assigned_user_role
                    FROM tickets t
                    LEFT JOIN users u_resp ON t.ticket_responder = u_resp.id
                    LEFT JOIN users u_assign ON t.ticket_assigned_user = u_assign.id
                    WHERE t.ticket_id = ?
                `).bind(ticketId).first();
        if (!ticket) {
          return jsonResponse({ success: false, error: "Ticket not found" }, 404);
        }
        let canView = false;
        if (role === "CUSTOMER" || role === "EXPERT") {
          canView = ticket.user_id === payload.userId;
        } else if (role === "ADMIN") {
          canView = ticket.user_role === "CUSTOMER" || ticket.user_role === "EXPERT";
        } else if (role === "SUPERADMIN") {
          canView = true;
        }
        if (!canView) {
          return jsonResponse({ success: false, error: "Not authorized to view this ticket" }, 403);
        }
        return jsonResponse({
          success: true,
          data: { ticket }
        });
      }
      if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/status$/) && request.method === "PATCH") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const ticketId = url.pathname.split("/")[4];
        const body = await request.json();
        const { status, reply } = body;
        const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
        if (!status || !validStatuses.includes(status)) {
          return jsonResponse({
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
          }, 400);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toUpperCase() || "";
        if (role !== "ADMIN" && role !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can update ticket status" }, 403);
        }
        const ticket = await env2.proveloce_db.prepare(
          "SELECT * FROM tickets WHERE ticket_id = ?"
        ).bind(ticketId).first();
        if (!ticket) {
          return jsonResponse({ success: false, error: "Ticket not found" }, 404);
        }
        let canUpdate = false;
        if (role === "ADMIN") {
          canUpdate = ticket.user_role === "CUSTOMER" || ticket.user_role === "EXPERT";
        } else if (role === "SUPERADMIN") {
          canUpdate = true;
        }
        if (!canUpdate) {
          return jsonResponse({ success: false, error: "Not authorized to update this ticket" }, 403);
        }
        await env2.proveloce_db.prepare(`
                    UPDATE tickets SET 
                        status = ?, 
                        admin_reply = ?, 
                        ticket_responder = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE ticket_id = ?
                `).bind(status, reply || null, payload.userId, ticketId).run();
        return jsonResponse({
          success: true,
          message: "Ticket status updated successfully",
          data: { ticketId, status, adminReply: reply }
        });
      }
      if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/assign$/) && request.method === "PATCH") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const ticketId = url.pathname.split("/")[4];
        const { assignedToId } = await request.json();
        if (!assignedToId) {
          return jsonResponse({ success: false, error: "assignedToId is required" }, 400);
        }
        const requester = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const requesterRole = requester?.role?.toUpperCase() || "";
        if (requesterRole !== "ADMIN" && requesterRole !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "Only Admin or SuperAdmin can assign tickets" }, 403);
        }
        const assignedUser = await env2.proveloce_db.prepare(
          "SELECT role FROM users WHERE id = ?"
        ).bind(assignedToId).first();
        if (!assignedUser) {
          return jsonResponse({ success: false, error: "Assigned user not found" }, 404);
        }
        const assignedRole = assignedUser.role?.toUpperCase() || "";
        if (!["EXPERT", "ADMIN", "SUPERADMIN", "CUSTOMER"].includes(assignedRole)) {
          return jsonResponse({ success: false, error: "Tickets can only be assigned to EXPERT, ADMIN or CUSTOMER (if applicable)" }, 400);
        }
        await env2.proveloce_db.prepare(`
                    UPDATE tickets SET 
                        ticket_assigned_user = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE ticket_id = ?
                `).bind(assignedToId, ticketId).run();
        return jsonResponse({
          success: true,
          message: "Ticket assigned successfully"
        });
      }
      if (url.pathname.startsWith("/api/helpdesk/attachments/") && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const filePath = url.pathname.replace("/api/helpdesk/attachments/", "");
        if (!filePath || !env2.others) {
          return jsonResponse({ success: false, error: "Attachment not found" }, 404);
        }
        try {
          const object = await env2.others.get(filePath);
          if (!object) {
            return jsonResponse({ success: false, error: "Attachment not found in storage" }, 404);
          }
          const headers = new Headers();
          headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
          headers.set("Cache-Control", "private, max-age=3600");
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
          return new Response(object.body, { headers });
        } catch (err) {
          console.error("Attachment fetch error:", err);
          return jsonResponse({ success: false, error: "Failed to retrieve attachment" }, 500);
        }
      }
      return new Response("ProVeloce Cloudflare Backend Running \u2714", {
        headers: { "Content-Type": "text/plain", ...corsHeaders }
      });
    } catch (error) {
      console.error("Worker error:", error);
      return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
    }
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
