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
async function createNotification(env2, userId, type, title2, message, link) {
  if (!env2.proveloce_db) return;
  try {
    await env2.proveloce_db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(crypto.randomUUID(), userId, type, title2, message, link || null).run();
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
__name(createNotification, "createNotification");
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
async function storeRefreshToken(env2, userId, token, expiresAt) {
  if (!env2.proveloce_db) return;
  try {
    await env2.proveloce_db.prepare(`
            INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(crypto.randomUUID(), userId, token, expiresAt.toISOString()).run();
    await env2.proveloce_db.prepare(`
            INSERT INTO activity_logs (id, user_id, action, details, created_at)
            VALUES (?, ?, 'refresh_token_stored', ?, CURRENT_TIMESTAMP)
        `).bind(crypto.randomUUID(), userId, JSON.stringify({ expires_at: expiresAt.toISOString() })).run();
  } catch (error) {
    console.error("Failed to store refresh token:", error);
  }
}
__name(storeRefreshToken, "storeRefreshToken");
async function validateRefreshToken(env2, token) {
  if (!env2.proveloce_db) return { valid: false, error: "Database not configured" };
  try {
    const result = await env2.proveloce_db.prepare(`
            SELECT user_id, expires_at, revoked_at
            FROM refresh_tokens
            WHERE token = ?
        `).bind(token).first();
    if (!result) return { valid: false, error: "Token not found" };
    if (result.revoked_at) return { valid: false, error: "Token has been revoked" };
    if (new Date(result.expires_at) < /* @__PURE__ */ new Date()) return { valid: false, error: "Token has expired" };
    await env2.proveloce_db.prepare(`
            INSERT INTO activity_logs (id, user_id, action, details, created_at)
            VALUES (?, ?, 'refresh_token_fetched', ?, CURRENT_TIMESTAMP)
        `).bind(crypto.randomUUID(), result.user_id, JSON.stringify({ expires_at: result.expires_at })).run();
    return { valid: true, userId: result.user_id };
  } catch (error) {
    console.error("Failed to validate refresh token:", error);
    return { valid: false, error: "Validation failed" };
  }
}
__name(validateRefreshToken, "validateRefreshToken");
async function revokeRefreshToken(env2, token, userId) {
  if (!env2.proveloce_db) return false;
  try {
    await env2.proveloce_db.prepare(`
            UPDATE refresh_tokens
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE token = ?
        `).bind(token).run();
    if (userId) {
      await env2.proveloce_db.prepare(`
                INSERT INTO activity_logs (id, user_id, action, details, created_at)
                VALUES (?, ?, 'refresh_token_revoked', ?, CURRENT_TIMESTAMP)
            `).bind(crypto.randomUUID(), userId, JSON.stringify({ revoked_at: (/* @__PURE__ */ new Date()).toISOString() })).run();
    }
    return true;
  } catch (error) {
    console.error("Failed to revoke refresh token:", error);
    return false;
  }
}
__name(revokeRefreshToken, "revokeRefreshToken");
async function revokeAllUserTokens(env2, userId) {
  if (!env2.proveloce_db) return false;
  try {
    await env2.proveloce_db.prepare(`
            UPDATE refresh_tokens
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND revoked_at IS NULL
        `).bind(userId).run();
    return true;
  } catch (error) {
    console.error("Failed to revoke all user tokens:", error);
    return false;
  }
}
__name(revokeAllUserTokens, "revokeAllUserTokens");
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
            "SELECT id, name, email, role, org_id, suspended, password_hash, status FROM users WHERE email = ?"
          ).bind(body.email).first();
          if (!user) {
            return jsonResponse({ success: false, error: "Invalid email or password" }, 401);
          }
          const currentStatus = user.status;
          if (!currentStatus || currentStatus === "pending_verification") {
            await env2.proveloce_db.prepare(
              "UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            ).bind(user.id).run();
            await env2.proveloce_db.prepare(
              "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(crypto.randomUUID(), user.id, "USER_ACTIVATION", "user", user.id, JSON.stringify({ reason: "Login Trigger", oldStatus: currentStatus, newStatus: "active" })).run();
          }
          const token = await createJWT(
            { userId: user.id, email: user.email, name: user.name, role: user.role, org_id: user.org_id || "ORG-DEFAULT" },
            env2.JWT_ACCESS_SECRET || "default-secret"
          );
          return jsonResponse({
            success: true,
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, status: "active" }
          });
        } catch (e) {
          return jsonResponse({ success: false, error: e.message || "Login failed" }, 400);
        }
      }
      if (url.pathname === "/api/auth/signup" && request.method === "POST") {
        try {
          const body = await request.json();
          if (!body.email || !body.password || !body.name) {
            return jsonResponse({ success: false, error: "Email, password, and name are required" }, 400);
          }
          if (!env2.proveloce_db) {
            return jsonResponse({ success: false, error: "Database not configured" }, 500);
          }
          const existingUser = await env2.proveloce_db.prepare(
            "SELECT id FROM users WHERE email = ?"
          ).bind(body.email).first();
          if (existingUser) {
            return jsonResponse({ success: false, error: "User already exists with this email" }, 409);
          }
          const encoder = new TextEncoder();
          const data = encoder.encode(body.password);
          const hashBuffer = await crypto.subtle.digest("SHA-256", data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          const userId = crypto.randomUUID();
          const role = "customer";
          const status = "active";
          await env2.proveloce_db.prepare(
            "INSERT INTO users (id, name, email, password_hash, role, status, profile_photo_url, bio, dob, phone, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
          ).bind(
            userId,
            body.name,
            body.email,
            passwordHash,
            role,
            status,
            body.profile_photo_url || null,
            body.bio || null,
            body.dob || null,
            body.phone || null
          ).run();
          await env2.proveloce_db.prepare(
            "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(crypto.randomUUID(), userId, "USER_REGISTRATION", "user", userId, JSON.stringify({ method: "email", role, status })).run();
          const token = await createJWT(
            { userId, email: body.email, name: body.name, role, org_id: "ORG-DEFAULT" },
            env2.JWT_ACCESS_SECRET || "default-secret"
          );
          return jsonResponse({
            success: true,
            message: "Signup successful",
            token,
            user: { id: userId, name: body.name, email: body.email, role, status }
          }, 201);
        } catch (e) {
          console.error("Signup error:", e);
          return jsonResponse({ success: false, error: e.message || "Signup failed" }, 400);
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
      if (url.pathname === "/api/auth/refresh" && request.method === "POST") {
        try {
          const body = await request.json();
          if (!body.refreshToken) {
            return jsonResponse({ success: false, error: "Refresh token is required" }, 400);
          }
          if (!env2.proveloce_db) {
            return jsonResponse({ success: false, error: "Database not configured" }, 500);
          }
          const validation = await validateRefreshToken(env2, body.refreshToken);
          if (!validation.valid) {
            return jsonResponse({ success: false, error: validation.error || "Invalid refresh token" }, 401);
          }
          const user = await env2.proveloce_db.prepare(
            "SELECT id, name, email, role, org_id FROM users WHERE id = ?"
          ).bind(validation.userId).first();
          if (!user) {
            return jsonResponse({ success: false, error: "User not found" }, 404);
          }
          await revokeRefreshToken(env2, body.refreshToken, validation.userId);
          const newAccessToken = await createJWT(
            { userId: user.id, email: user.email, name: user.name, role: user.role, org_id: user.org_id || "ORG-DEFAULT" },
            env2.JWT_ACCESS_SECRET || "default-secret"
          );
          const newRefreshToken = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
          await storeRefreshToken(env2, user.id, newRefreshToken, expiresAt);
          return jsonResponse({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 604800
            // 7 days for access token
          });
        } catch (e) {
          console.error("Refresh token error:", e);
          return jsonResponse({ success: false, error: "Token refresh failed" }, 500);
        }
      }
      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          let userId;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
            if (payload) {
              userId = payload.userId;
            }
          }
          const body = await request.json();
          if (!env2.proveloce_db) {
            return jsonResponse({ success: false, error: "Database not configured" }, 500);
          }
          if (body.revokeAll && userId) {
            await revokeAllUserTokens(env2, userId);
            return jsonResponse({ success: true, message: "All tokens revoked" });
          }
          if (body.refreshToken) {
            await revokeRefreshToken(env2, body.refreshToken, userId);
            return jsonResponse({ success: true, message: "Token revoked" });
          }
          return jsonResponse({ success: true, message: "Logout successful" });
        } catch (e) {
          console.error("Logout error:", e);
          return jsonResponse({ success: false, error: "Logout failed" }, 500);
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
            "SELECT id, name, email, role, org_id, suspended FROM users WHERE email = ?"
          ).bind(googleUser.email).first();
          if (!user) {
            const userId = crypto.randomUUID();
            await env2.proveloce_db.prepare(
              "INSERT INTO users (id, name, email, role, status, email_verified, avatar_data) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(
              userId,
              googleUser.name,
              googleUser.email,
              "customer",
              "active",
              1,
              googleUser.picture || null
            ).run();
            await env2.proveloce_db.prepare(
              "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(crypto.randomUUID(), userId, "USER_REGISTRATION", "user", userId, JSON.stringify({ method: "google", role: "customer", status: "active" })).run();
            user = {
              id: userId,
              name: googleUser.name,
              email: googleUser.email,
              role: "customer",
              status: "active"
            };
          } else {
            if (!user.status || user.status === "pending_verification") {
              await env2.proveloce_db.prepare(
                "UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
              ).bind(user.id).run();
              await env2.proveloce_db.prepare(
                "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(crypto.randomUUID(), user.id, "USER_ACTIVATION", "user", user.id, JSON.stringify({ method: "google", oldStatus: user.status, newStatus: "active" })).run();
              user.status = "active";
            }
          }
          const jwtToken = await createJWT(
            {
              userId: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              org_id: user.org_id || "ORG-DEFAULT"
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
          "SELECT id, name, email, phone, role, profile_photo_url, profile_image, created_at FROM users WHERE id = ?"
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
              profile: {
                ...profile,
                avatarUrl: user?.profile_image || user?.profile_photo_url || null
              }
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
      if (url.pathname === "/api/profiles/me/avatar" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db || !env2.others) {
          return jsonResponse({ success: false, error: "Storage not configured" }, 500);
        }
        try {
          const contentType = request.headers.get("Content-Type") || "";
          if (!contentType.includes("multipart/form-data")) {
            return jsonResponse({ success: false, error: "Content-Type must be multipart/form-data" }, 400);
          }
          const formData = await request.formData();
          const file = formData.get("avatar");
          if (!file) {
            return jsonResponse({ success: false, error: "No avatar file provided" }, 400);
          }
          if (file.size > 5 * 1024 * 1024) {
            return jsonResponse({ success: false, error: "File size must be less than 5MB" }, 400);
          }
          const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            return jsonResponse({ success: false, error: "Only JPEG, PNG, GIF, and WebP images are allowed" }, 400);
          }
          const ext = file.name.split(".").pop() || "jpg";
          const timestamp = Date.now();
          const r2Key = `profile-photos/${payload.userId}-${timestamp}.${ext}`;
          const fileBuffer = await file.arrayBuffer();
          await env2.others.put(r2Key, fileBuffer, {
            httpMetadata: {
              contentType: file.type
            }
          });
          const avatarUrl = `https://pub-others.r2.dev/${r2Key}`;
          await env2.proveloce_db.prepare(
            "UPDATE users SET profile_image = ?, profile_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).bind(avatarUrl, avatarUrl, payload.userId).run();
          try {
            await env2.proveloce_db.prepare(
              "UPDATE user_profiles SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
            ).bind(avatarUrl, payload.userId).run();
          } catch (e) {
          }
          console.log(`\u2705 Avatar uploaded for user ${payload.userId}: ${r2Key}`);
          return jsonResponse({
            success: true,
            message: "Avatar uploaded successfully",
            data: { avatarUrl }
          });
        } catch (error) {
          console.error("Avatar upload error:", error);
          return jsonResponse({ success: false, error: "Failed to upload avatar" }, 500);
        }
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
        let query = "SELECT id, name, email, phone, role, status, profile_image, profile_photo_url, email_verified, last_login_at, created_at FROM users WHERE 1=1";
        const params = [];
        const requesterRole = (auth.payload.role || "").toLowerCase();
        if (requesterRole === "superadmin") {
          query += " AND role != 'superadmin'";
        } else if (requesterRole === "admin") {
          query += " AND role IN ('customer', 'expert', 'analyst', 'agent', 'viewer')";
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
        const countQuery = query.replace("SELECT id, name, email, phone, role, status, profile_image, profile_photo_url, email_verified, last_login_at, created_at", "SELECT COUNT(*) as total");
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
      if (url.pathname === "/api/users" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        const role = (payload.role || "").toUpperCase();
        const requesterOrgId = payload.org_id || "ORG-DEFAULT";
        let query = "SELECT id, name, email, phone, role, status, org_id FROM users WHERE status = 'active'";
        const params = [];
        const rolesParam = url.searchParams.get("roles");
        if (rolesParam) {
          const requestedRoles = rolesParam.split(",").map((r) => r.trim().toUpperCase()).filter((r) => r !== "");
          if (requestedRoles.length > 0) {
            const placeholders = requestedRoles.map(() => "?").join(",");
            query += ` AND UPPER(role) IN (${placeholders})`;
            params.push(...requestedRoles);
          }
        }
        if (role === "SUPERADMIN") {
        } else if (role === "ADMIN") {
          query += " AND org_id = ?";
          params.push(requesterOrgId);
        } else {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const result = await env2.proveloce_db.prepare(query).bind(...params).all();
        return jsonResponse({
          success: true,
          data: {
            data: result.results
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
        const finalRole = (role || "Customer").toLowerCase() === "expert" ? "Expert" : role === "Customer" || role === "viewer" ? "Customer" : role;
        const finalStatus = (status || "active").toLowerCase();
        if (!["superadmin", "admin", "Expert", "Customer"].includes(finalRole)) {
          return jsonResponse({ success: false, error: "Invalid role (must be Expert or Customer)" }, 400);
        }
        if (!["active", "inactive", "suspended"].includes(finalStatus)) {
          return jsonResponse({ success: false, error: "Invalid status" }, 400);
        }
        if ((finalRole === "superadmin" || finalRole === "admin") && requesterRole !== "superadmin") {
          return jsonResponse({ success: false, error: "Only superadmin can create privileged users" }, 403);
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
        ).bind(id, name, email, phone || null, finalRole, finalStatus, passwordHash).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), auth.payload.userId, "CREATE_USER", "user", id, JSON.stringify({ name, email, role: finalRole })).run();
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
        const { name, email, phone, role, status, save_cta_state, save_cta_action } = body;
        if (save_cta_state !== "enabled" || save_cta_action !== "commit_changes_to_db") {
          return jsonResponse({ success: false, error: "Workflow compliance error: Save CTA state must be enabled and action must be commit_changes_to_db" }, 400);
        }
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
          if (!["superadmin", "admin", "Expert", "Customer"].includes(role)) {
            return jsonResponse({ success: false, error: "Invalid role mapping: value must be Expert or Customer" }, 400);
          }
          if (requesterRole !== "superadmin") {
            return jsonResponse({ success: false, error: "Only superadmin can change roles" }, 403);
          }
          if (existing.id === auth.payload.userId) {
            return jsonResponse({ success: false, error: "Superadmin cannot demote self" }, 403);
          }
        }
        if (status !== void 0) {
          const nextStatus = status.toLowerCase();
          if (!["active", "inactive", "suspended"].includes(nextStatus)) {
            return jsonResponse({ success: false, error: "Invalid status" }, 400);
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
        ).bind(
          crypto.randomUUID(),
          auth.payload.userId,
          "UPDATE_USER",
          "user",
          id,
          JSON.stringify({
            ...body,
            save_cta_invoked: {
              state: save_cta_state,
              action: save_cta_action,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }
          })
        ).run();
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
          "UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(id).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), auth.payload.userId, "DEACTIVATE_USER", "user", id, JSON.stringify({ oldRole: existing.role, newStatus: "inactive" })).run();
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
          agents: 0,
          // Added agent count
          viewers: 0,
          // Added viewer count
          activeUsers: 0,
          pendingUsers: 0,
          recentUsers: []
        };
        const roleCounts = await env2.proveloce_db.prepare(
          "SELECT role, COUNT(*) as count FROM users WHERE status = 'active' GROUP BY role"
        ).all();
        const totalCount = await env2.proveloce_db.prepare(
          "SELECT COUNT(*) as count FROM users"
        ).first();
        stats.totalUsers = totalCount?.count || 0;
        for (const row of roleCounts.results) {
          const role = (row.role || "").toLowerCase();
          const count = row.count || 0;
          if (role === "admin") stats.admins = count;
          if (role === "superadmin") stats.admins += count;
          if (role === "expert") stats.experts = count;
          if (role === "customer") stats.customers = count;
          if (role === "analyst") stats.analysts = count;
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
        const validStatuses = ["PENDING", "APPROVED", "REJECTED", "DRAFT", "UNDER_REVIEW", "REQUIRES_CLARIFICATION", "REVOKED", ""];
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
          const requesterOrgId = payload.org_id || "ORG-DEFAULT";
          const isAdmin = role === "admin";
          let whereClauses = [];
          if (isAdmin) {
            whereClauses.push("ea.org_id = ?");
            params.push(requesterOrgId);
          }
          if (statusFilter && statusFilter !== "") {
            whereClauses.push("LOWER(ea.status) = LOWER(?)");
            params.push(statusFilter);
          }
          if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(" AND ")}`;
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
            let docMetadata = [];
            let imgMetadata = [];
            try {
              docMetadata = row.documents ? JSON.parse(row.documents) : [];
            } catch {
            }
            try {
              imgMetadata = row.images ? JSON.parse(row.images) : [];
            } catch {
            }
            return {
              id: row.id,
              userId: row.userId,
              orgId: row.org_id,
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
          const requesterOrgId = payload.org_id || "ORG-DEFAULT";
          if (role === "admin" && app.org_id !== requesterOrgId) {
            return jsonResponse({ success: false, error: "Access denied. Tenant mismatch." }, 403);
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
          "UPDATE expert_applications SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(payload.userId, applicationId).run();
        await env2.proveloce_db.prepare(
          "UPDATE users SET role = 'agent', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(app.user_id).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), payload.userId, "APPROVE_EXPERT_APPLICATION", "expert_application", applicationId, JSON.stringify({ approvedBy: payload.userId, userId: app.user_id, status: "approved", role: "agent" })).run();
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
          "UPDATE expert_applications SET status = 'Rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(reason, payload.userId, applicationId).run();
        await env2.proveloce_db.prepare(
          "INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), payload.userId, "REJECT_EXPERT_APPLICATION", "expert_application", applicationId, JSON.stringify({ rejectedBy: payload.userId, status: "Rejected", reason })).run();
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
            const userOrgId = payload.org_id || "ORG-DEFAULT";
            await env2.proveloce_db.prepare(`
                            INSERT INTO expert_applications (id, user_id, org_id, status, created_at, updated_at)
                            VALUES (?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `).bind(newId, payload.userId, userOrgId).run();
            application = {
              id: newId,
              user_id: payload.userId,
              org_id: userOrgId,
              status: "draft",
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            console.log(`\u2705 Auto-created DRAFT application for user ${payload.userId}`);
          }
          return jsonResponse({
            success: true,
            data: {
              application: {
                ...application,
                profile_phone: application.profile_phone || "",
                profile_dob: application.profile_dob || "",
                profile_address: application.profile_address || ""
              }
            }
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
              return jsonResponse({ success: false, error: "Cannot modify application while it's under review" }, 400);
            }
            if (currentStatus === "approved") {
              return jsonResponse({ success: false, error: "Your application has already been approved" }, 400);
            }
            await env2.proveloce_db.prepare(`
                            UPDATE expert_applications SET
                                profile_phone = ?, 
                                profile_dob = ?, 
                                profile_address = ?,
                                status = 'draft',
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = ?
                        `).bind(
              body.phone || "",
              body.dob || "",
              body.address || "",
              payload.userId
            ).run();
          } else {
            const id = crypto.randomUUID();
            const userOrgId = payload.org_id || "ORG-DEFAULT";
            await env2.proveloce_db.prepare(`
                            INSERT INTO expert_applications (
                                id, user_id, org_id, status,
                                profile_phone, profile_dob, profile_address,
                                created_at, updated_at
                            ) VALUES (?, ?, ?, 'draft', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        `).bind(
              id,
              payload.userId,
              userOrgId,
              body.phone || "",
              body.dob || "",
              body.address || ""
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
          await createNotification(
            env2,
            payload.userId,
            "INFO",
            "Application Submitted",
            "Your expert application has been submitted for review. We will notify you once a decision is made.",
            "/customer/expert-application"
          );
          console.log(`\u2705 Application submitted for user ${payload.userId}`);
          return jsonResponse({ success: true, message: "Application submitted successfully" });
        } catch (error) {
          console.error("Error submitting application:", error);
          return jsonResponse({ success: false, error: "Failed to submit application" }, 500);
        }
      }
      if (url.pathname === "/api/v1/expert_documents/upload" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db || !env2.EXPERT_APPLICATION) {
          return jsonResponse({ success: false, error: "Cloud resources not configured" }, 500);
        }
        try {
          const formData = await request.formData();
          const file = formData.get("file");
          const documentType = formData.get("type") || "other";
          if (!file) {
            return jsonResponse({ success: false, error: "No file provided" }, 400);
          }
          const r2Key = `docs/${payload.userId}/${crypto.randomUUID()}-${file.name.replace(/\s+/g, "_")}`;
          await env2.EXPERT_APPLICATION.put(r2Key, file.stream(), {
            httpMetadata: { contentType: file.type }
          });
          const r2Url = `https://backend.proveloce.com/api/attachments/${r2Key}`;
          const application = await env2.proveloce_db.prepare(
            "SELECT id FROM expert_applications WHERE user_id = ?"
          ).bind(payload.userId).first();
          if (!application) {
            return jsonResponse({ success: false, error: "Expert application not found" }, 404);
          }
          const docId = crypto.randomUUID();
          await env2.proveloce_db.prepare(`
                        INSERT INTO expert_documents (
                            id, user_id, application_id, document_type, 
                            file_name, file_type, file_size, r2_object_key, r2_url
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
            docId,
            payload.userId,
            application.id,
            documentType,
            file.name,
            file.type,
            file.size,
            r2Key,
            r2Url
          ).run();
          return jsonResponse({
            success: true,
            message: "Document uploaded successfully",
            data: {
              id: docId,
              url: r2Url,
              fileName: file.name
            }
          });
        } catch (error) {
          console.error("Error uploading document:", error);
          return jsonResponse({ success: false, error: "Failed to upload document" }, 500);
        }
      }
      if (url.pathname === "/api/applications" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        const role = (payload.role || "").toUpperCase();
        const requesterOrgId = payload.org_id || "ORG-DEFAULT";
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        let whereClause = "";
        let params = [];
        if (role === "SUPERADMIN") {
          whereClause = "1=1";
        } else if (role === "ADMIN") {
          whereClause = "org_id = ?";
          params = [requesterOrgId];
        } else if (role === "EXPERT") {
          whereClause = "org_id = ? AND status = 'submitted' AND validated = 1";
          params = [requesterOrgId];
        } else {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const statusFilter = url.searchParams.get("status");
        if (statusFilter && role !== "EXPERT") {
          whereClause += " AND status = ?";
          params.push(statusFilter);
        }
        try {
          const result = await env2.proveloce_db.prepare(`
                        SELECT ea.*, u.name as user_name, u.email as user_email
                        FROM expert_applications ea
                        LEFT JOIN users u ON ea.user_id = u.id
                        WHERE ${whereClause}
                        ORDER BY ea.created_at DESC
                    `).bind(...params).all();
          return jsonResponse({
            success: true,
            data: { applications: result.results || [] }
          });
        } catch (error) {
          console.error("Error fetching applications:", error);
          return jsonResponse({ success: false, error: "Failed to fetch applications" }, 500);
        }
      }
      if (url.pathname === "/api/v1/expert_applications/submit" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload || !payload.userId) {
          return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        }
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const body = await request.json();
          const { full_name, email, phone, address, expertise, experience, documents, images } = body;
          const id = crypto.randomUUID();
          const orgId = payload.org_id || "ORG-DEFAULT";
          await env2.proveloce_db.prepare(`
                        INSERT INTO expert_applications (
                            id, user_id, org_id, status, full_name, email, phone, summary_bio, 
                            skills, years_of_experience, documents, images, submitted_at, created_at, updated_at
                        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(
            id,
            payload.userId,
            orgId,
            full_name || "",
            email || "",
            phone || null,
            address || null,
            expertise || "",
            experience || 0,
            JSON.stringify(documents || []),
            JSON.stringify(images || [])
          ).run();
          await createNotification(
            env2,
            payload.userId,
            "INFO",
            "Application Submitted",
            "Your expert application has been submitted for review. We will notify you once a decision is made.",
            "/customer/expert-application"
          );
          return jsonResponse({ success: true, message: "Application submitted successfully", id });
        } catch (error) {
          console.error("Error in v1 submit:", error);
          return jsonResponse({ success: false, error: "Failed to submit" }, 500);
        }
      }
      const reviewMatch = url.pathname.match(/^\/api\/v1\/expert_applications\/([^\/]+)\/review$/);
      if (reviewMatch && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid or expired token" }, 401);
        const role = (payload.role || "").toLowerCase();
        const requesterOrgId = payload.org_id || "ORG-DEFAULT";
        if (role !== "admin" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const applicationId = reviewMatch[1];
        const body = await request.json();
        const decision = (body.decision || "").toLowerCase();
        const reason = body.reason || "";
        if (!["approved", "rejected"].includes(decision)) {
          return jsonResponse({ success: false, error: "Invalid decision. Must be 'approved' or 'rejected'." }, 400);
        }
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        const app = await env2.proveloce_db.prepare(`
                    SELECT ea.user_id, ea.org_id, ea.status, u.email as user_email 
                    FROM expert_applications ea 
                    JOIN users u ON ea.user_id = u.id 
                    WHERE ea.id = ?
                `).bind(applicationId).first();
        if (!app) return jsonResponse({ success: false, error: "Application not found" }, 404);
        if (role === "admin" && app.org_id !== requesterOrgId) {
          return jsonResponse({ success: false, error: "Tenant mismatch" }, 403);
        }
        if (app.status.toLowerCase() !== "pending" && role !== "superadmin") {
          return jsonResponse({ success: false, error: "Can only review pending applications" }, 400);
        }
        const reviewerId = payload.userId;
        const status = decision === "approved" ? "approved" : "rejected";
        const auditAction = decision === "approved" ? "APPROVE_EXPERT" : "REJECT_EXPERT";
        const statements = [
          // 1. Update application status
          env2.proveloce_db.prepare(`
                        UPDATE expert_applications 
                        SET status = ?, 
                            reviewed_by = ?, 
                            rejection_reason = ?,
                            reviewed_at = CURRENT_TIMESTAMP, 
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    `).bind(status, reviewerId, reason, applicationId),
          // 2. Audit Log (Spec: audit_logs table)
          env2.proveloce_db.prepare(`
                        INSERT INTO audit_logs (id, action, expert_id, expert_email, reason, performed_by, performed_at)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `).bind(crypto.randomUUID(), auditAction, applicationId, app.user_email, reason, reviewerId),
          // 3. Activity Log (Standard: activity_logs table for broad tracking)
          env2.proveloce_db.prepare(`
                        INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).bind(
            crypto.randomUUID(),
            reviewerId,
            "EXPERT_APPLICATION_REVIEWED",
            "expert_application",
            applicationId,
            JSON.stringify({ decision, reason, org_id: app.org_id, actor_id: reviewerId, actor_role: role, timestamp: (/* @__PURE__ */ new Date()).toISOString() })
          )
        ];
        if (decision === "approved") {
          statements.push(
            env2.proveloce_db.prepare(
              "UPDATE users SET role = 'Expert', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            ).bind(app.user_id)
          );
        }
        await env2.proveloce_db.batch(statements);
        if (decision === "approved") {
          await createNotification(
            env2,
            app.user_id,
            "SUCCESS",
            "Application Approved! \u{1F389}",
            "Congratulations! Your expert application has been approved. You now have access to expert features.",
            "/expert/dashboard"
          );
        } else {
          await createNotification(
            env2,
            app.user_id,
            "WARNING",
            "Application Status Update",
            `Your expert application was reviewed and unfortunately was not approved at this time. Reason: ${reason || "Please check with support for details."}`,
            "/customer/expert-application"
          );
        }
        return jsonResponse({ success: true, message: `Application ${decision} successfully` });
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
          let attachmentFiles = [];
          const contentType = request.headers.get("Content-Type") || "";
          if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            category = formData.get("category") || "";
            subject = formData.get("subject") || "";
            description = formData.get("description") || "";
            const files = formData.getAll("attachments");
            const singleFile = formData.get("attachment");
            if (files.length > 0) {
              attachmentFiles = files.filter((f) => f instanceof File && f.size > 0);
            } else if (singleFile && singleFile instanceof File && singleFile.size > 0) {
              attachmentFiles = [singleFile];
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
          const ticketNumber = `PV-TK-${yyyymmdd}-${hhmm}`;
          const initialMessage = {
            sender_id: payload.userId,
            sender_name: sender?.name || "User",
            sender_role: senderRole,
            text: description.trim(),
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          const result = await env2.proveloce_db.prepare(`
                        INSERT INTO tickets (
                            ticket_number, category, subject, description, 
                            raised_by_user_id, org_id, messages, status, created_at, updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(
            ticketNumber,
            category.trim(),
            subject.trim(),
            description.trim(),
            payload.userId,
            sender.org_id || "ORG-DEFAULT",
            JSON.stringify([initialMessage])
          ).run();
          const ticketDbId = result.meta.last_row_id;
          const fileAttachments = [];
          if (attachmentFiles.length > 0 && env2.others) {
            for (const file of attachmentFiles) {
              const fileId = crypto.randomUUID();
              const fileExt = file.name.split(".").pop() || "bin";
              const filePath = `helpdesk/${ticketNumber}/${fileId}.${fileExt}`;
              await env2.others.put(filePath, file.stream(), {
                httpMetadata: { contentType: file.type || "application/octet-stream" }
              });
              const attachmentUrl = `/api/helpdesk/attachments/${filePath}`;
              await env2.proveloce_db.prepare(`
                                INSERT INTO ticket_files (id, ticket_id, filename, filetype, bucket, uploaded_at)
                                VALUES (?, ?, ?, ?, 'others', CURRENT_TIMESTAMP)
                            `).bind(fileId, ticketDbId, file.name, file.type).run();
              fileAttachments.push({
                id: fileId,
                filename: file.name,
                url: attachmentUrl
              });
            }
          }
          return jsonResponse({
            success: true,
            message: `Your ticket ${ticketNumber} has been created successfully`,
            data: {
              ticketId: ticketNumber,
              attachments: fileAttachments
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
        const requester = await env2.proveloce_db.prepare(
          "SELECT role, org_id FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = requester?.role?.toUpperCase() || "CUSTOMER";
        const requesterOrgId = requester?.org_id || "ORG-DEFAULT";
        let whereClause = "";
        let params = [];
        if (role === "SUPERADMIN") {
          whereClause = "";
        } else if (role === "ADMIN") {
          whereClause = "t.org_id = ? AND t.assigned_user_id = ?";
          params = [requesterOrgId, payload.userId];
        } else if (role === "EXPERT") {
          whereClause = "t.org_id = ? AND t.assigned_user_id = ?";
          params = [requesterOrgId, payload.userId];
        } else {
          whereClause = "t.org_id = ? AND t.raised_by_user_id = ?";
          params = [requesterOrgId, payload.userId];
        }
        const query = `
                    SELECT 
                        t.*,
                        t.ticket_number as ticket_id,
                        u_raised.name as user_full_name,
                        u_raised.email as user_email,
                        u_assign.name as assigned_user_name,
                        u_assign.role as assigned_user_role
                    FROM tickets t
                    LEFT JOIN users u_raised ON t.raised_by_user_id = u_raised.id
                    LEFT JOIN users u_assign ON t.assigned_user_id = u_assign.id
                    ${whereClause ? "WHERE " + whereClause : ""}
                    ORDER BY t.created_at DESC
                `;
        const result = await env2.proveloce_db.prepare(query).bind(...params).all();
        const rawTickets = result.results || [];
        const ticketsWithFiles = await Promise.all(rawTickets.map(async (t) => {
          const files = await env2.proveloce_db.prepare(`
                        SELECT id, filename, filetype, bucket, uploaded_at
                        FROM ticket_files WHERE ticket_id = ?
                    `).bind(t.id).all();
          return {
            ...t,
            attachments: (files.results || []).map((f) => ({
              ...f,
              url: `/api/helpdesk/attachments/helpdesk/${t.ticket_number}/${f.id}.${f.filename.split(".").pop() || "bin"}`
            }))
          };
        }));
        return jsonResponse({
          success: true,
          data: { tickets: ticketsWithFiles }
        });
      }
      if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+$/) && !url.pathname.includes("/status") && !url.pathname.includes("/messages") && !url.pathname.includes("/assign") && request.method === "GET") {
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
                        t.ticket_number as ticket_id,
                        u_raised.name as user_full_name,
                        u_raised.email as user_email,
                        u_raised.phone as user_phone_number,
                        u_raised.org_id as user_org_id,
                        u_assign.name as assigned_user_name,
                        u_assign.role as assigned_user_role,
                        u_assign.org_id as assigned_user_org_id
                    FROM tickets t
                    LEFT JOIN users u_raised ON t.raised_by_user_id = u_raised.id
                    LEFT JOIN users u_assign ON t.assigned_user_id = u_assign.id
                    WHERE t.id = ? OR t.ticket_number = ?
                `).bind(ticketId, ticketId).first();
        if (!ticket) {
          return jsonResponse({ success: false, error: "Ticket not found" }, 404);
        }
        const requester = await env2.proveloce_db.prepare(
          "SELECT role, org_id FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const requesterOrgId = requester?.org_id || "ORG-DEFAULT";
        const requesterRole = requester?.role?.toUpperCase() || "";
        if (ticket.org_id !== requesterOrgId && requesterRole !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "TENANT_MISMATCH", message: "Unauthorized tenant access." }, 403);
        }
        const isRaisedByMe = ticket.raised_by_user_id === payload.userId;
        const isAssignedToMe = ticket.assigned_user_id === payload.userId;
        const isSuperAdmin = requesterRole === "SUPERADMIN";
        const isAdmin = requesterRole === "ADMIN";
        if (!isSuperAdmin && !isAdmin && !isRaisedByMe && !isAssignedToMe) {
          return jsonResponse({ success: false, error: "Not authorized to view this ticket" }, 403);
        }
        const files = await env2.proveloce_db.prepare(`
                    SELECT id, filename, filetype, bucket, uploaded_at
                    FROM ticket_files WHERE ticket_id = ?
                `).bind(ticket.id).all();
        const attachments = (files.results || []).map((f) => ({
          ...f,
          url: `/api/helpdesk/attachments/helpdesk/${ticket.ticket_number}/${f.id}.${f.filename.split(".").pop() || "bin"}`
        }));
        let messages = [];
        try {
          messages = typeof ticket.messages === "string" ? JSON.parse(ticket.messages) : ticket.messages || [];
        } catch (e) {
          console.error("Failed to parse ticket messages JSON", e);
        }
        return jsonResponse({
          success: true,
          data: {
            ticket: {
              ...ticket,
              attachments
            },
            messages
          }
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
        let finalStatus = status;
        if (status === "APPROVED" || status === "OPEN") finalStatus = "Open";
        else if (status === "IN_PROGRESS") finalStatus = "In Progress";
        else if (status === "RESOLVED") finalStatus = "Resolved";
        else if (status === "REJECTED" || status === "CLOSED") finalStatus = "Closed";
        const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
        if (!finalStatus || !validStatuses.includes(finalStatus)) {
          return jsonResponse({
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
          }, 400);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT name, role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toUpperCase() || "";
        const ticket = await env2.proveloce_db.prepare(
          "SELECT * FROM tickets WHERE id = ? OR ticket_number = ?"
        ).bind(ticketId, ticketId).first();
        if (!ticket) {
          return jsonResponse({ success: false, error: "Ticket not found" }, 404);
        }
        const isSuperAdmin = role === "SUPERADMIN";
        const isAssigned = ticket.assigned_user_id === payload.userId;
        if (!isSuperAdmin && !isAssigned) {
          return jsonResponse({ success: false, error: "Only SuperAdmin or the Assigned Responder can update the status of this ticket" }, 403);
        }
        let updateQuery = "UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP";
        let updateParams = [finalStatus];
        if (reply && reply.trim()) {
          if (ticket.responder_id && ticket.responder_id !== payload.userId) {
            return jsonResponse({ success: false, error: "TICKET_LOCKED", message: "This ticket already has a response from another responder." }, 403);
          }
          if (ticket.responder_id && ticket.edit_count >= 1) {
            return jsonResponse({ success: false, error: "EDIT_LIMIT_REACHED", message: "One-time edit limit already reached for this response." }, 400);
          }
          updateQuery += ", response_text = ?, responder_id = ?, updated_at = CURRENT_TIMESTAMP";
          if (ticket.responder_id) {
            updateQuery += ", is_edited = 1, edit_count = edit_count + 1";
          } else {
            updateQuery += ", is_edited = 0, edit_count = 0";
          }
          updateParams.push(reply.trim(), payload.userId);
        }
        updateQuery += " WHERE id = ? OR ticket_number = ?";
        updateParams.push(ticketId, ticketId);
        await env2.proveloce_db.prepare(updateQuery).bind(...updateParams).run();
        const logId = crypto.randomUUID();
        const logMessage = `Ticket ${ticketId} status updated to ${finalStatus} by ${role.toLowerCase()}.`;
        await env2.proveloce_db.prepare(`
                    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(logId, payload.userId, "RESPOND_TICKET", "TICKET", ticketId, JSON.stringify({ message: logMessage, status: finalStatus })).run();
        return jsonResponse({
          success: true,
          message: "Ticket status updated successfully",
          data: { ticketId, status: finalStatus }
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
          "SELECT role, org_id, suspended FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const requesterRole = requester?.role?.toUpperCase() || "";
        const requesterOrgId = requester?.org_id || "ORG-DEFAULT";
        if (requester.suspended === 1) {
          return jsonResponse({ success: false, error: "ACCOUNT_SUSPENDED", message: "Account is suspended." }, 403);
        }
        if (requesterRole !== "SUPERADMIN" && requesterRole !== "ADMIN") {
          return jsonResponse({ success: false, error: "Only Admins can assign tickets" }, 403);
        }
        const assignedUser = await env2.proveloce_db.prepare(
          "SELECT name, role, org_id, suspended FROM users WHERE id = ?"
        ).bind(assignedToId).first();
        if (!assignedUser) {
          return jsonResponse({ success: false, error: "Assigned user not found" }, 404);
        }
        if (assignedUser.role?.toUpperCase() !== "ADMIN" && assignedUser.role?.toUpperCase() !== "SUPERADMIN" && assignedUser.role?.toUpperCase() !== "EXPERT") {
          return jsonResponse({ success: false, error: "Tickets can only be assigned to ADMIN, SUPERADMIN, or EXPERT" }, 400);
        }
        if (assignedUser.org_id !== requesterOrgId && requesterRole !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "TENANT_MISMATCH", message: "Cannot assign across tenants." }, 403);
        }
        if (assignedUser.suspended === 1) {
          return jsonResponse({ success: false, error: "TARGET_SUSPENDED", message: "Cannot assign to a suspended user." }, 400);
        }
        const ticket = await env2.proveloce_db.prepare(
          "SELECT org_id, status, locked_by FROM tickets WHERE id = ? OR ticket_number = ?"
        ).bind(ticketId, ticketId).first();
        if (!ticket) {
          return jsonResponse({ success: false, error: "Ticket not found" }, 404);
        }
        if (ticket.org_id !== requesterOrgId && requesterRole !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "TENANT_MISMATCH", message: "Unauthorized tenant access." }, 403);
        }
        if (["CLOSED", "RESOLVED"].includes(ticket.status.toUpperCase())) {
          return jsonResponse({ success: false, error: "TICKET_CLOSED", message: "Cannot assign closed or resolved tickets." }, 400);
        }
        if (ticket.locked_by && ticket.locked_by !== payload.userId && requesterRole !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "TICKET_LOCKED", message: "Ticket is locked by another user." }, 403);
        }
        await env2.proveloce_db.prepare(`
                    UPDATE tickets SET 
                        assigned_user_id = ?,
                        assignee_role = ?,
                        assigned_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? OR ticket_number = ?
                `).bind(assignedToId, assignedUser.role, ticketId, ticketId).run();
        const logId = crypto.randomUUID();
        const logMessage = `Ticket ${ticketId} assigned to ${assignedUser.username || assignedUser.name} by superadmin`;
        await env2.proveloce_db.prepare(`
                    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(logId, payload.userId, "ASSIGN_TICKET", "TICKET", ticketId, JSON.stringify({ message: logMessage, assignedTo: assignedToId })).run();
        return jsonResponse({
          success: true,
          message: "Ticket assigned successfully"
        });
      }
      if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/reassign$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const ticketId = url.pathname.split("/")[4];
        const { assignedToId } = await request.json();
        const requester = await env2.proveloce_db.prepare("SELECT role, org_id FROM users WHERE id = ?").bind(payload.userId).first();
        const requesterOrgId = requester?.org_id || "ORG-DEFAULT";
        const requesterRole = requester?.role?.toUpperCase() || "";
        if (requesterRole !== "SUPERADMIN" && requesterRole !== "ADMIN") {
          return jsonResponse({ success: false, error: "FORBIDDEN", message: "Role not permitted to reassign." }, 403);
        }
        const assignedUser = await env2.proveloce_db.prepare("SELECT name, role, org_id FROM users WHERE id = ?").bind(assignedToId).first();
        if (!assignedUser || assignedUser.org_id !== requesterOrgId && requesterRole !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "INVALID_ASSIGNEE", message: "Assignee must be in same tenant." }, 403);
        }
        const ticket = await env2.proveloce_db.prepare("SELECT org_id, assigned_user_id FROM tickets WHERE id = ? OR ticket_number = ?").bind(ticketId, ticketId).first();
        if (!ticket || ticket.org_id !== requesterOrgId && requesterRole !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "TICKET_NOT_FOUND" }, 404);
        }
        const prevAssigneeId = ticket.assigned_user_id;
        await env2.proveloce_db.prepare(`
                    UPDATE tickets SET assigned_user_id = ?, assignee_role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR ticket_number = ?
                `).bind(assignedToId, assignedUser.role, ticketId, ticketId).run();
        await env2.proveloce_db.prepare(`
                    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(crypto.randomUUID(), payload.userId, "REASSIGN_TICKET", "TICKET", ticketId, JSON.stringify({ assignedTo: assignedToId, previousAssignee: prevAssigneeId })).run();
        return jsonResponse({ success: true, message: "Ticket reassigned" });
      }
      if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/unassign$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        const ticketId = url.pathname.split("/")[4];
        const requester = await env2.proveloce_db.prepare("SELECT role, org_id FROM users WHERE id = ?").bind(payload.userId).first();
        const requesterOrgId = requester?.org_id || "ORG-DEFAULT";
        const ticket = await env2.proveloce_db.prepare("SELECT org_id FROM tickets WHERE id = ? OR ticket_number = ?").bind(ticketId, ticketId).first();
        if (!ticket || ticket.org_id !== requesterOrgId && requester.role?.toUpperCase() !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "UNAUTHORIZED" }, 403);
        }
        await env2.proveloce_db.prepare(`
                    UPDATE tickets SET assigned_user_id = NULL, assignee_role = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR ticket_number = ?
                `).bind(ticketId, ticketId).run();
        return jsonResponse({ success: true, message: "Ticket unassigned" });
      }
      if (url.pathname.match(/^\/api\/helpdesk\/tickets\/[^\/]+\/messages$/) && request.method === "POST") {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const ticketId = url.pathname.split("/")[4];
        const { message, edit_requested } = await request.json();
        if (!message || !message.trim()) {
          return jsonResponse({ success: false, error: "Message is required" }, 400);
        }
        const user = await env2.proveloce_db.prepare(
          "SELECT name, role FROM users WHERE id = ?"
        ).bind(payload.userId).first();
        const role = user?.role?.toUpperCase() || "CUSTOMER";
        const ticket = await env2.proveloce_db.prepare(
          "SELECT * FROM tickets WHERE id = ? OR ticket_number = ?"
        ).bind(ticketId, ticketId).first();
        if (!ticket) {
          return jsonResponse({ success: false, error: "Ticket not found" }, 404);
        }
        const isSuperAdmin = role === "SUPERADMIN";
        const isAssigned = ticket.assigned_user_id === payload.userId;
        const isRaiser = ticket.raised_by_user_id === payload.userId;
        if (isRaiser && !isSuperAdmin && !isAssigned) {
          return jsonResponse({ success: false, error: "Customers cannot add further messages to this ticket. Please wait for a responder." }, 403);
        }
        if (!isSuperAdmin && !isAssigned) {
          return jsonResponse({ success: false, error: "Not authorized to respond to this ticket" }, 403);
        }
        if (ticket.responder_id && !edit_requested) {
          return jsonResponse({ success: false, error: "ALREADY_RESPONDED", message: "This ticket already has a response. Ongoing conversations are disabled." }, 400);
        }
        if (edit_requested) {
          const canEdit = isSuperAdmin || ticket.responder_id === payload.userId || ticket.assigned_user_id === payload.userId;
          if (!canEdit) {
            return jsonResponse({ success: false, error: "UNAUTHORIZED_EDIT", message: "Only the original responder or an assigned admin can edit this response." }, 403);
          }
          if (ticket.edit_count >= 1 && !isSuperAdmin) {
            return jsonResponse({ success: false, error: "EDIT_LIMIT_REACHED", message: "One-time edit limit already reached." }, 400);
          }
        }
        const updateQuery = `
                    UPDATE tickets SET 
                        response_text = ?, 
                        responder_id = ?, 
                        is_edited = ?, 
                        edit_count = edit_count + ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? OR ticket_number = ?
                `;
        const isEdit = ticket.responder_id ? 1 : 0;
        await env2.proveloce_db.prepare(updateQuery).bind(
          message.trim(),
          payload.userId,
          isEdit,
          isEdit,
          ticketId,
          ticketId
        ).run();
        const logId = crypto.randomUUID();
        const logAction = isEdit ? "EDIT_TICKET_RESPONSE" : "RESPOND_TICKET";
        const logMessage = `${isEdit ? "Response edited" : "New response added"} for ticket ${ticketId} by ${role.toLowerCase()}.`;
        await env2.proveloce_db.prepare(`
                    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(logId, payload.userId, logAction, "TICKET", ticketId, JSON.stringify({ message: logMessage, is_override: isEdit && ticket.responder_id !== payload.userId })).run();
        return jsonResponse({
          success: true,
          message: isEdit ? "Response updated successfully" : "Response added successfully"
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
      if (url.pathname === "/api/tasks" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const role = (payload.role || "").toUpperCase();
        const requesterOrgId = payload.org_id || "ORG-DEFAULT";
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        let whereClause = "";
        let params = [];
        if (role === "SUPERADMIN") {
          whereClause = "1=1";
        } else if (role === "ADMIN") {
          whereClause = "t.org_id = ?";
          params = [requesterOrgId];
        } else {
          whereClause = "t.assigned_to = ?";
          params = [payload.userId];
        }
        try {
          const result = await env2.proveloce_db.prepare(`
                        SELECT t.*, u.name as assigned_user_name
                        FROM tasks t
                        LEFT JOIN users u ON t.assigned_to = u.id
                        WHERE ${whereClause}
                        ORDER BY t.created_at DESC
                    `).bind(...params).all();
          return jsonResponse({
            success: true,
            data: { tasks: result.results || [] }
          });
        } catch (error) {
          console.error("Error fetching tasks:", error);
          return jsonResponse({ success: false, error: "Failed to fetch tasks" }, 500);
        }
      }
      if (url.pathname === "/api/tasks" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const role = (payload.role || "").toUpperCase();
        if (role !== "ADMIN" && role !== "SUPERADMIN") {
          return jsonResponse({ success: false, error: "Only admins can create tasks" }, 403);
        }
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const body = await request.json();
          if (!body.title || !body.description) {
            return jsonResponse({ success: false, error: "Title and description are required" }, 400);
          }
          const taskId = crypto.randomUUID();
          const orgId = payload.org_id || "ORG-DEFAULT";
          await env2.proveloce_db.prepare(`
                        INSERT INTO tasks (id, title, description, assigned_to, due_date, status, org_id, created_by, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(
            taskId,
            body.title,
            body.description,
            body.assignedTo || null,
            body.dueDate || null,
            orgId,
            payload.userId
          ).run();
          if (body.assignedTo) {
            await createNotification(
              env2,
              body.assignedTo,
              "INFO",
              "New Task Assigned",
              `You have been assigned a new task: ${body.title}`,
              "/expert/tasks"
            );
          }
          return jsonResponse({ success: true, message: "Task created", id: taskId });
        } catch (error) {
          console.error("Error creating task:", error);
          return jsonResponse({ success: false, error: "Failed to create task" }, 500);
        }
      }
      const taskIdMatch = url.pathname.match(/^\/api\/tasks\/([^\/]+)$/);
      if (taskIdMatch && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const taskId = taskIdMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const task = await env2.proveloce_db.prepare(`
                        SELECT t.*, u.name as assigned_user_name
                        FROM tasks t
                        LEFT JOIN users u ON t.assigned_to = u.id
                        WHERE t.id = ?
                    `).bind(taskId).first();
          if (!task) {
            return jsonResponse({ success: false, error: "Task not found" }, 404);
          }
          return jsonResponse({ success: true, data: { task } });
        } catch (error) {
          console.error("Error fetching task:", error);
          return jsonResponse({ success: false, error: "Failed to fetch task" }, 500);
        }
      }
      if (taskIdMatch && request.method === "PATCH") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const taskId = taskIdMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const body = await request.json();
          const updates = [];
          const params = [];
          if (body.status) {
            updates.push("status = ?");
            params.push(body.status);
          }
          if (body.assignedTo !== void 0) {
            updates.push("assigned_to = ?");
            params.push(body.assignedTo || null);
          }
          updates.push("updated_at = CURRENT_TIMESTAMP");
          params.push(taskId);
          await env2.proveloce_db.prepare(`
                        UPDATE tasks SET ${updates.join(", ")} WHERE id = ?
                    `).bind(...params).run();
          return jsonResponse({ success: true, message: "Task updated" });
        } catch (error) {
          console.error("Error updating task:", error);
          return jsonResponse({ success: false, error: "Failed to update task" }, 500);
        }
      }
      if (url.pathname === "/api/experts/search" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        const domain2 = url.searchParams.get("domain");
        const slotLabel = url.searchParams.get("slot_label");
        const dayType = url.searchParams.get("day_type");
        try {
          let query = `
                        SELECT DISTINCT u.id, u.name, u.email, u.role, u.status
                        FROM users u
                        LEFT JOIN expert_time_slots s ON s.expert_id = u.id
                        WHERE UPPER(u.role) = 'EXPERT' AND UPPER(u.status) = 'ACTIVE'
                    `;
          const params = [];
          if (slotLabel) {
            query += ` AND s.slot_label = ?`;
            params.push(slotLabel);
          }
          if (dayType) {
            query += ` AND (s.day_type = ? OR s.day_type = 'both')`;
            params.push(dayType);
          }
          query += ` ORDER BY u.name ASC`;
          const result = await env2.proveloce_db.prepare(query).bind(...params).all();
          return jsonResponse({
            success: true,
            data: { experts: result.results || [] }
          });
        } catch (error) {
          console.error("Error searching experts:", error);
          return jsonResponse({ success: false, error: "Failed to search experts" }, 500);
        }
      }
      const expertPublicMatch = url.pathname.match(/^\/api\/experts\/([^\/]+)\/public$/);
      if (expertPublicMatch && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const expertId = expertPublicMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const expert = await env2.proveloce_db.prepare(`
                        SELECT id, name, role, status, created_at
                        FROM users WHERE id = ? AND UPPER(role) = 'EXPERT'
                    `).bind(expertId).first();
          if (!expert) {
            return jsonResponse({ success: false, error: "Expert not found" }, 404);
          }
          const slots = await env2.proveloce_db.prepare(`
                        SELECT slot_label, day_type FROM expert_time_slots WHERE expert_id = ?
                    `).bind(expertId).all();
          return jsonResponse({
            success: true,
            data: {
              expert,
              slots: slots.results || []
            }
          });
        } catch (error) {
          console.error("Error fetching expert:", error);
          return jsonResponse({ success: false, error: "Failed to fetch expert" }, 500);
        }
      }
      if (url.pathname === "/api/connect-requests" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const body = await request.json();
          if (!body.expertId || !body.requestedDate || !body.requestedDayType || !body.requestedSlotLabel) {
            return jsonResponse({ success: false, error: "Missing required fields" }, 400);
          }
          const requestId = crypto.randomUUID();
          await env2.proveloce_db.prepare(`
                        INSERT INTO connect_requests (id, customer_id, expert_id, requested_date, requested_day_type, requested_slot_label, customer_note, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                    `).bind(
            requestId,
            payload.userId,
            body.expertId,
            body.requestedDate,
            body.requestedDayType,
            body.requestedSlotLabel,
            body.customerNote || null
          ).run();
          await createNotification(
            env2,
            body.expertId,
            "INFO",
            "New Connect Request",
            "You have received a new connect request.",
            "/expert/connect-requests"
          );
          return jsonResponse({ success: true, message: "Connect request sent", id: requestId });
        } catch (error) {
          console.error("Error creating connect request:", error);
          return jsonResponse({ success: false, error: "Failed to create connect request" }, 500);
        }
      }
      if (url.pathname === "/api/connect-requests" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        const role = (payload.role || "").toUpperCase();
        const viewType = url.searchParams.get("view") || "customer";
        try {
          let query;
          let params;
          if (viewType === "expert" && role === "EXPERT") {
            query = `
                            SELECT r.*, u.name as customer_name
                            FROM connect_requests r
                            JOIN users u ON u.id = r.customer_id
                            WHERE r.expert_id = ?
                            ORDER BY r.created_at DESC
                        `;
            params = [payload.userId];
          } else {
            query = `
                            SELECT r.*, u.name as expert_name
                            FROM connect_requests r
                            JOIN users u ON u.id = r.expert_id
                            WHERE r.customer_id = ?
                            ORDER BY r.created_at DESC
                        `;
            params = [payload.userId];
          }
          const result = await env2.proveloce_db.prepare(query).bind(...params).all();
          return jsonResponse({
            success: true,
            data: { requests: result.results || [] }
          });
        } catch (error) {
          console.error("Error fetching connect requests:", error);
          return jsonResponse({ success: false, error: "Failed to fetch connect requests" }, 500);
        }
      }
      const connectRequestMatch = url.pathname.match(/^\/api\/connect-requests\/([^\/]+)$/);
      if (connectRequestMatch && request.method === "PATCH") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const requestId = connectRequestMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const body = await request.json();
          if (!body.status || !["accepted", "rejected"].includes(body.status)) {
            return jsonResponse({ success: false, error: "Invalid status" }, 400);
          }
          const request_data = await env2.proveloce_db.prepare(`
                        SELECT * FROM connect_requests WHERE id = ? AND expert_id = ?
                    `).bind(requestId, payload.userId).first();
          if (!request_data) {
            return jsonResponse({ success: false, error: "Request not found or unauthorized" }, 404);
          }
          await env2.proveloce_db.prepare(`
                        UPDATE connect_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
                    `).bind(body.status, requestId).run();
          if (body.status === "accepted") {
            const sessionId = crypto.randomUUID();
            const roomId = `room-${sessionId.substring(0, 8)}`;
            await env2.proveloce_db.prepare(`
                            INSERT INTO sessions (id, request_id, expert_id, customer_id, scheduled_date, scheduled_slot_label, status, room_id)
                            VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)
                        `).bind(
              sessionId,
              requestId,
              request_data.expert_id,
              request_data.customer_id,
              request_data.requested_date,
              request_data.requested_slot_label,
              roomId
            ).run();
            await createNotification(
              env2,
              request_data.customer_id,
              "SUCCESS",
              "Connect Request Accepted",
              "Your connect request has been accepted. A session is scheduled.",
              "/customer/my-requests"
            );
          } else {
            await createNotification(
              env2,
              request_data.customer_id,
              "WARNING",
              "Connect Request Rejected",
              "Your connect request was not accepted.",
              "/customer/my-requests"
            );
          }
          return jsonResponse({ success: true, message: `Request ${body.status}` });
        } catch (error) {
          console.error("Error updating connect request:", error);
          return jsonResponse({ success: false, error: "Failed to update connect request" }, 500);
        }
      }
      if (url.pathname === "/api/sessions" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const result = await env2.proveloce_db.prepare(`
                        SELECT s.*, 
                               e.name as expert_name,
                               c.name as customer_name
                        FROM sessions s
                        JOIN users e ON e.id = s.expert_id
                        JOIN users c ON c.id = s.customer_id
                        WHERE s.expert_id = ? OR s.customer_id = ?
                        ORDER BY s.scheduled_date DESC
                    `).bind(payload.userId, payload.userId).all();
          return jsonResponse({
            success: true,
            data: { sessions: result.results || [] }
          });
        } catch (error) {
          console.error("Error fetching sessions:", error);
          return jsonResponse({ success: false, error: "Failed to fetch sessions" }, 500);
        }
      }
      const sessionStartMatch = url.pathname.match(/^\/api\/sessions\/([^\/]+)\/start$/);
      if (sessionStartMatch && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const sessionId = sessionStartMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          await env2.proveloce_db.prepare(`
                        UPDATE sessions SET status = 'live', started_at = CURRENT_TIMESTAMP WHERE id = ?
                    `).bind(sessionId).run();
          return jsonResponse({ success: true, message: "Session started" });
        } catch (error) {
          console.error("Error starting session:", error);
          return jsonResponse({ success: false, error: "Failed to start session" }, 500);
        }
      }
      const sessionEndMatch = url.pathname.match(/^\/api\/sessions\/([^\/]+)\/end$/);
      if (sessionEndMatch && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const sessionId = sessionEndMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          await env2.proveloce_db.prepare(`
                        UPDATE sessions 
                        SET status = 'ended', ended_at = CURRENT_TIMESTAMP,
                            duration_seconds = CAST((julianday(CURRENT_TIMESTAMP) - julianday(started_at)) * 86400 AS INTEGER)
                        WHERE id = ?
                    `).bind(sessionId).run();
          return jsonResponse({ success: true, message: "Session ended" });
        } catch (error) {
          console.error("Error ending session:", error);
          return jsonResponse({ success: false, error: "Failed to end session" }, 500);
        }
      }
      const sessionMessagesMatch = url.pathname.match(/^\/api\/sessions\/([^\/]+)\/messages$/);
      if (sessionMessagesMatch && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const sessionId = sessionMessagesMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const result = await env2.proveloce_db.prepare(`
                        SELECT m.*, u.name as sender_name
                        FROM session_messages m
                        JOIN users u ON u.id = m.sender_id
                        WHERE m.session_id = ?
                        ORDER BY m.created_at ASC
                    `).bind(sessionId).all();
          return jsonResponse({
            success: true,
            data: { messages: result.results || [] }
          });
        } catch (error) {
          console.error("Error fetching messages:", error);
          return jsonResponse({ success: false, error: "Failed to fetch messages" }, 500);
        }
      }
      if (sessionMessagesMatch && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const sessionId = sessionMessagesMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const body = await request.json();
          if (!body.content && !body.attachmentUrl) {
            return jsonResponse({ success: false, error: "Message content required" }, 400);
          }
          const messageId = crypto.randomUUID();
          await env2.proveloce_db.prepare(`
                        INSERT INTO session_messages (id, session_id, sender_id, content_text, attachment_url)
                        VALUES (?, ?, ?, ?, ?)
                    `).bind(
            messageId,
            sessionId,
            payload.userId,
            body.content || null,
            body.attachmentUrl || null
          ).run();
          return jsonResponse({ success: true, message: "Message sent", id: messageId });
        } catch (error) {
          console.error("Error sending message:", error);
          return jsonResponse({ success: false, error: "Failed to send message" }, 500);
        }
      }
      if (url.pathname === "/api/messages/conversations" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const conversations = await env2.proveloce_db.prepare(`
                        SELECT 
                            CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
                            u.name as other_user_name,
                            u.profile_photo_url as other_user_avatar,
                            m.content as last_message,
                            m.created_at as last_message_at,
                            (SELECT COUNT(*) FROM user_messages um WHERE um.sender_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AND um.receiver_id = ? AND um.read_at IS NULL) as unread_count
                        FROM user_messages m
                        JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
                        WHERE m.sender_id = ? OR m.receiver_id = ?
                        GROUP BY other_user_id
                        ORDER BY m.created_at DESC
                    `).bind(payload.userId, payload.userId, payload.userId, payload.userId, payload.userId, payload.userId).all();
          return jsonResponse({
            success: true,
            data: { conversations: conversations.results || [] }
          });
        } catch (error) {
          console.error("Error fetching conversations:", error);
          return jsonResponse({ success: false, error: "Failed to fetch conversations" }, 500);
        }
      }
      const messagesMatch = url.pathname.match(/^\/api\/messages\/([^\/]+)$/);
      if (messagesMatch && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const otherUserId = messagesMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const messages = await env2.proveloce_db.prepare(`
                        SELECT m.*, u.name as sender_name
                        FROM user_messages m
                        JOIN users u ON u.id = m.sender_id
                        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
                        ORDER BY m.created_at ASC
                    `).bind(payload.userId, otherUserId, otherUserId, payload.userId).all();
          await env2.proveloce_db.prepare(`
                        UPDATE user_messages SET read_at = CURRENT_TIMESTAMP
                        WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL
                    `).bind(otherUserId, payload.userId).run();
          const otherUser = await env2.proveloce_db.prepare(
            "SELECT id, name, profile_photo_url FROM users WHERE id = ?"
          ).bind(otherUserId).first();
          return jsonResponse({
            success: true,
            data: {
              messages: messages.results || [],
              otherUser: otherUser || null
            }
          });
        } catch (error) {
          console.error("Error fetching messages:", error);
          return jsonResponse({ success: false, error: "Failed to fetch messages" }, 500);
        }
      }
      if (messagesMatch && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const receiverId = messagesMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const body = await request.json();
          if (!body.content || body.content.trim() === "") {
            return jsonResponse({ success: false, error: "Message content is required" }, 400);
          }
          const messageId = crypto.randomUUID();
          await env2.proveloce_db.prepare(`
                        INSERT INTO user_messages (id, sender_id, receiver_id, content)
                        VALUES (?, ?, ?, ?)
                    `).bind(messageId, payload.userId, receiverId, body.content.trim()).run();
          await createNotification(
            env2,
            receiverId,
            "INFO",
            "New Message",
            "You have received a new message",
            "/messages"
          );
          return jsonResponse({
            success: true,
            message: "Message sent",
            data: { id: messageId }
          });
        } catch (error) {
          console.error("Error sending message:", error);
          return jsonResponse({ success: false, error: "Failed to send message" }, 500);
        }
      }
      if (url.pathname === "/api/messages/users/search" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        const query = url.searchParams.get("q") || "";
        try {
          const users = await env2.proveloce_db.prepare(`
                        SELECT id, name, email, role, profile_photo_url
                        FROM users
                        WHERE id != ? AND (name LIKE ? OR email LIKE ?)
                        LIMIT 20
                    `).bind(payload.userId, `%${query}%`, `%${query}%`).all();
          return jsonResponse({
            success: true,
            data: { users: users.results || [] }
          });
        } catch (error) {
          console.error("Error searching users:", error);
          return jsonResponse({ success: false, error: "Failed to search users" }, 500);
        }
      }
      const adminUserDetailMatch = url.pathname.match(/^\/api\/admin\/users\/([^\/]+)$/);
      if (adminUserDetailMatch && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env2.JWT_ACCESS_SECRET || "default-secret");
        if (!payload) return jsonResponse({ success: false, error: "Invalid token" }, 401);
        const role = (payload.role || "").toUpperCase();
        if (!["ADMIN", "SUPERADMIN"].includes(role)) {
          return jsonResponse({ success: false, error: "Access denied" }, 403);
        }
        const userId = adminUserDetailMatch[1];
        if (!env2.proveloce_db) return jsonResponse({ success: false, error: "Database not configured" }, 500);
        try {
          const user = await env2.proveloce_db.prepare(`
                        SELECT id, name, email, phone, role, status, profile_photo_url, created_at, updated_at
                        FROM users WHERE id = ?
                    `).bind(userId).first();
          if (!user) {
            return jsonResponse({ success: false, error: "User not found" }, 404);
          }
          const profile = await env2.proveloce_db.prepare(
            "SELECT * FROM user_profiles WHERE user_id = ?"
          ).bind(userId).first();
          const connectRequests = await env2.proveloce_db.prepare(`
                        SELECT cr.*, 
                               e.name as expert_name,
                               c.name as customer_name
                        FROM connect_requests cr
                        LEFT JOIN users e ON e.id = cr.expert_id
                        LEFT JOIN users c ON c.id = cr.customer_id
                        WHERE cr.customer_id = ? OR cr.expert_id = ?
                        ORDER BY cr.created_at DESC
                        LIMIT 50
                    `).bind(userId, userId).all();
          const sessions = await env2.proveloce_db.prepare(`
                        SELECT s.*,
                               e.name as expert_name,
                               c.name as customer_name
                        FROM sessions s
                        LEFT JOIN users e ON e.id = s.expert_id
                        LEFT JOIN users c ON c.id = s.customer_id
                        WHERE s.expert_id = ? OR s.customer_id = ?
                        ORDER BY s.scheduled_date DESC
                        LIMIT 50
                    `).bind(userId, userId).all();
          const expertApplication = await env2.proveloce_db.prepare(
            "SELECT * FROM expert_applications WHERE user_id = ?"
          ).bind(userId).first();
          return jsonResponse({
            success: true,
            data: {
              user,
              profile: profile || null,
              bookings: connectRequests.results || [],
              sessions: sessions.results || [],
              expertApplication: expertApplication || null
            }
          });
        } catch (error) {
          console.error("Error fetching user detail:", error);
          return jsonResponse({ success: false, error: "Failed to fetch user detail" }, 500);
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
