var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
};

// node_modules/@capacitor/core/dist/index.js
var createCapacitorPlatforms, initPlatforms, CapacitorPlatforms, addPlatform, setPlatform, ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, Plugins, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp;
var init_dist = __esm({
  "node_modules/@capacitor/core/dist/index.js"() {
    createCapacitorPlatforms = (win) => {
      const defaultPlatformMap = /* @__PURE__ */ new Map();
      defaultPlatformMap.set("web", { name: "web" });
      const capPlatforms = win.CapacitorPlatforms || {
        currentPlatform: { name: "web" },
        platforms: defaultPlatformMap
      };
      const addPlatform2 = (name, platform) => {
        capPlatforms.platforms.set(name, platform);
      };
      const setPlatform2 = (name) => {
        if (capPlatforms.platforms.has(name)) {
          capPlatforms.currentPlatform = capPlatforms.platforms.get(name);
        }
      };
      capPlatforms.addPlatform = addPlatform2;
      capPlatforms.setPlatform = setPlatform2;
      return capPlatforms;
    };
    initPlatforms = (win) => win.CapacitorPlatforms = createCapacitorPlatforms(win);
    CapacitorPlatforms = /* @__PURE__ */ initPlatforms(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    addPlatform = CapacitorPlatforms.addPlatform;
    setPlatform = CapacitorPlatforms.setPlatform;
    (function(ExceptionCode2) {
      ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
      ExceptionCode2["Unavailable"] = "UNAVAILABLE";
    })(ExceptionCode || (ExceptionCode = {}));
    CapacitorException = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
      }
    };
    getPlatformId = (win) => {
      var _a, _b;
      if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return "android";
      } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return "ios";
      } else {
        return "web";
      }
    };
    createCapacitor = (win) => {
      var _a, _b, _c, _d, _e;
      const capCustomPlatform = win.CapacitorCustomPlatform || null;
      const cap = win.Capacitor || {};
      const Plugins2 = cap.Plugins = cap.Plugins || {};
      const capPlatforms = win.CapacitorPlatforms;
      const defaultGetPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
      };
      const getPlatform = ((_a = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _a === void 0 ? void 0 : _a.getPlatform) || defaultGetPlatform;
      const defaultIsNativePlatform = () => getPlatform() !== "web";
      const isNativePlatform = ((_b = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _b === void 0 ? void 0 : _b.isNativePlatform) || defaultIsNativePlatform;
      const defaultIsPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
          return true;
        }
        if (getPluginHeader(pluginName)) {
          return true;
        }
        return false;
      };
      const isPluginAvailable = ((_c = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _c === void 0 ? void 0 : _c.isPluginAvailable) || defaultIsPluginAvailable;
      const defaultGetPluginHeader = (pluginName) => {
        var _a2;
        return (_a2 = cap.PluginHeaders) === null || _a2 === void 0 ? void 0 : _a2.find((h) => h.name === pluginName);
      };
      const getPluginHeader = ((_d = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _d === void 0 ? void 0 : _d.getPluginHeader) || defaultGetPluginHeader;
      const handleError = (err) => win.console.error(err);
      const pluginMethodNoop = (_target, prop, pluginName) => {
        return Promise.reject(`${pluginName} does not have an implementation of "${prop}".`);
      };
      const registeredPlugins = /* @__PURE__ */ new Map();
      const defaultRegisterPlugin = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
          console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
          return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
          if (!jsImplementation && platform in jsImplementations) {
            jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
          } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
            jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
          }
          return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
          var _a2, _b2;
          if (pluginHeader) {
            const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
            if (methodHeader) {
              if (methodHeader.rtype === "promise") {
                return (options) => cap.nativePromise(pluginName, prop.toString(), options);
              } else {
                return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
              }
            } else if (impl) {
              return (_a2 = impl[prop]) === null || _a2 === void 0 ? void 0 : _a2.bind(impl);
            }
          } else if (impl) {
            return (_b2 = impl[prop]) === null || _b2 === void 0 ? void 0 : _b2.bind(impl);
          } else {
            throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        };
        const createPluginMethodWrapper = (prop) => {
          let remove;
          const wrapper = (...args) => {
            const p = loadPluginImplementation().then((impl) => {
              const fn = createPluginMethod(impl, prop);
              if (fn) {
                const p2 = fn(...args);
                remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                return p2;
              } else {
                throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
              }
            });
            if (prop === "addListener") {
              p.remove = async () => remove();
            }
            return p;
          };
          wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
          Object.defineProperty(wrapper, "name", {
            value: prop,
            writable: false,
            configurable: false
          });
          return wrapper;
        };
        const addListener = createPluginMethodWrapper("addListener");
        const removeListener = createPluginMethodWrapper("removeListener");
        const addListenerNative = (eventName, callback) => {
          const call = addListener({ eventName }, callback);
          const remove = async () => {
            const callbackId = await call;
            removeListener({
              eventName,
              callbackId
            }, callback);
          };
          const p = new Promise((resolve2) => call.then(() => resolve2({ remove })));
          p.remove = async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          };
          return p;
        };
        const proxy = new Proxy({}, {
          get(_, prop) {
            switch (prop) {
              // https://github.com/facebook/react/issues/20030
              case "$$typeof":
                return void 0;
              case "toJSON":
                return () => ({});
              case "addListener":
                return pluginHeader ? addListenerNative : addListener;
              case "removeListener":
                return removeListener;
              default:
                return createPluginMethodWrapper(prop);
            }
          }
        });
        Plugins2[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
          name: pluginName,
          proxy,
          platforms: /* @__PURE__ */ new Set([
            ...Object.keys(jsImplementations),
            ...pluginHeader ? [platform] : []
          ])
        });
        return proxy;
      };
      const registerPlugin2 = ((_e = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _e === void 0 ? void 0 : _e.registerPlugin) || defaultRegisterPlugin;
      if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
      }
      cap.getPlatform = getPlatform;
      cap.handleError = handleError;
      cap.isNativePlatform = isNativePlatform;
      cap.isPluginAvailable = isPluginAvailable;
      cap.pluginMethodNoop = pluginMethodNoop;
      cap.registerPlugin = registerPlugin2;
      cap.Exception = CapacitorException;
      cap.DEBUG = !!cap.DEBUG;
      cap.isLoggingEnabled = !!cap.isLoggingEnabled;
      cap.platform = cap.getPlatform();
      cap.isNative = cap.isNativePlatform();
      return cap;
    };
    initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
    Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    registerPlugin = Capacitor.registerPlugin;
    Plugins = Capacitor.Plugins;
    WebPlugin = class {
      constructor(config) {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
        if (config) {
          console.warn(`Capacitor WebPlugin "${config.name}" config object was deprecated in v3 and will be removed in v4.`);
          this.config = config;
        }
      }
      addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
          this.listeners[eventName] = [];
          firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
          this.addWindowListener(windowListener);
        }
        if (firstListener) {
          this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        return p;
      }
      async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
          this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
      }
      notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          if (retainUntilConsumed) {
            let args = this.retainedEventArguments[eventName];
            if (!args) {
              args = [];
            }
            args.push(data);
            this.retainedEventArguments[eventName] = args;
          }
          return;
        }
        listeners.forEach((listener) => listener(data));
      }
      hasListeners(eventName) {
        return !!this.listeners[eventName].length;
      }
      registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
          registered: false,
          windowEventName,
          pluginEventName,
          handler: (event) => {
            this.notifyListeners(pluginEventName, event);
          }
        };
      }
      unimplemented(msg = "not implemented") {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
      }
      unavailable(msg = "not available") {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
      }
      async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          return;
        }
        const index = listeners.indexOf(listenerFunc);
        this.listeners[eventName].splice(index, 1);
        if (!this.listeners[eventName].length) {
          this.removeWindowListener(this.windowListeners[eventName]);
        }
      }
      addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
      }
      removeWindowListener(handle) {
        if (!handle) {
          return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
      }
      sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
          return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg) => {
          this.notifyListeners(eventName, arg);
        });
      }
    };
    encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    CapacitorCookiesPluginWeb = class extends WebPlugin {
      async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          if (cookie.length <= 0)
            return;
          let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
          key = decode(key).trim();
          value = decode(value).trim();
          cookieMap[key] = value;
        });
        return cookieMap;
      }
      async setCookie(options) {
        try {
          const encodedKey = encode(options.key);
          const encodedValue = encode(options.value);
          const expires = `; expires=${(options.expires || "").replace("expires=", "")}`;
          const path = (options.path || "/").replace("path=", "");
          const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
          document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async deleteCookie(options) {
        try {
          document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearCookies() {
        try {
          const cookies = document.cookie.split(";") || [];
          for (const cookie of cookies) {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearAllCookies() {
        try {
          await this.clearCookies();
        } catch (error) {
          return Promise.reject(error);
        }
      }
    };
    CapacitorCookies = registerPlugin("CapacitorCookies", {
      web: () => new CapacitorCookiesPluginWeb()
    });
    readBlobAsBase64 = async (blob) => new Promise((resolve2, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve2(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    normalizeHttpHeaders = (headers = {}) => {
      const originalKeys = Object.keys(headers);
      const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
      const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
      }, {});
      return normalized;
    };
    buildUrlParams = (params, shouldEncode = true) => {
      if (!params)
        return null;
      const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
          item = "";
          value.forEach((str) => {
            encodedValue = shouldEncode ? encodeURIComponent(str) : str;
            item += `${key}=${encodedValue}&`;
          });
          item.slice(0, -1);
        } else {
          encodedValue = shouldEncode ? encodeURIComponent(value) : value;
          item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
      }, "");
      return output.substr(1);
    };
    buildRequestInit = (options, extra = {}) => {
      const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
      const headers = normalizeHttpHeaders(options.headers);
      const type = headers["content-type"] || "";
      if (typeof options.data === "string") {
        output.body = options.data;
      } else if (type.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
          params.set(key, value);
        }
        output.body = params.toString();
      } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
          options.data.forEach((value, key) => {
            form.append(key, value);
          });
        } else {
          for (const key of Object.keys(options.data)) {
            form.append(key, options.data[key]);
          }
        }
        output.body = form;
        const headers2 = new Headers(output.headers);
        headers2.delete("content-type");
        output.headers = headers2;
      } else if (type.includes("application/json") || typeof options.data === "object") {
        output.body = JSON.stringify(options.data);
      }
      return output;
    };
    CapacitorHttpPluginWeb = class extends WebPlugin {
      /**
       * Perform an Http request given a set of options
       * @param options Options to build the HTTP request
       */
      async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        let { responseType = "text" } = response.ok ? options : {};
        if (contentType.includes("application/json")) {
          responseType = "json";
        }
        let data;
        let blob;
        switch (responseType) {
          case "arraybuffer":
          case "blob":
            blob = await response.blob();
            data = await readBlobAsBase64(blob);
            break;
          case "json":
            data = await response.json();
            break;
          case "document":
          case "text":
          default:
            data = await response.text();
        }
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          data,
          headers,
          status: response.status,
          url: response.url
        };
      }
      /**
       * Perform an Http GET request given a set of options
       * @param options Options to build the HTTP request
       */
      async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
      }
      /**
       * Perform an Http POST request given a set of options
       * @param options Options to build the HTTP request
       */
      async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
      }
      /**
       * Perform an Http PUT request given a set of options
       * @param options Options to build the HTTP request
       */
      async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
      }
      /**
       * Perform an Http PATCH request given a set of options
       * @param options Options to build the HTTP request
       */
      async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
      }
      /**
       * Perform an Http DELETE request given a set of options
       * @param options Options to build the HTTP request
       */
      async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
      }
    };
    CapacitorHttp = registerPlugin("CapacitorHttp", {
      web: () => new CapacitorHttpPluginWeb()
    });
  }
});

// node_modules/@capacitor/filesystem/dist/esm/definitions.js
var Directory, Encoding;
var init_definitions = __esm({
  "node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
    (function(Directory2) {
      Directory2["Documents"] = "DOCUMENTS";
      Directory2["Data"] = "DATA";
      Directory2["Library"] = "LIBRARY";
      Directory2["Cache"] = "CACHE";
      Directory2["External"] = "EXTERNAL";
      Directory2["ExternalStorage"] = "EXTERNAL_STORAGE";
    })(Directory || (Directory = {}));
    (function(Encoding2) {
      Encoding2["UTF8"] = "utf8";
      Encoding2["ASCII"] = "ascii";
      Encoding2["UTF16"] = "utf16";
    })(Encoding || (Encoding = {}));
  }
});

// node_modules/@capacitor/filesystem/dist/esm/web.js
var web_exports = {};
__export(web_exports, {
  FilesystemWeb: () => FilesystemWeb
});
function resolve(path) {
  const posix = path.split("/").filter((item) => item !== ".");
  const newPosix = [];
  posix.forEach((item) => {
    if (item === ".." && newPosix.length > 0 && newPosix[newPosix.length - 1] !== "..") {
      newPosix.pop();
    } else {
      newPosix.push(item);
    }
  });
  return newPosix.join("/");
}
function isPathParent(parent, children) {
  parent = resolve(parent);
  children = resolve(children);
  const pathsA = parent.split("/");
  const pathsB = children.split("/");
  return parent !== children && pathsA.every((value, index) => value === pathsB[index]);
}
var FilesystemWeb;
var init_web = __esm({
  "node_modules/@capacitor/filesystem/dist/esm/web.js"() {
    init_dist();
    init_definitions();
    FilesystemWeb = class _FilesystemWeb extends WebPlugin {
      constructor() {
        super(...arguments);
        this.DB_VERSION = 1;
        this.DB_NAME = "Disc";
        this._writeCmds = ["add", "put", "delete"];
        this.downloadFile = async (options) => {
          var _a, _b;
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const response = await fetch(options.url, requestInit);
          let blob;
          if (!options.progress)
            blob = await response.blob();
          else if (!(response === null || response === void 0 ? void 0 : response.body))
            blob = new Blob();
          else {
            const reader = response.body.getReader();
            let bytes = 0;
            const chunks = [];
            const contentType = response.headers.get("content-type");
            const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
            while (true) {
              const { done, value } = await reader.read();
              if (done)
                break;
              chunks.push(value);
              bytes += (value === null || value === void 0 ? void 0 : value.length) || 0;
              const status = {
                url: options.url,
                bytes,
                contentLength
              };
              this.notifyListeners("progress", status);
            }
            const allChunks = new Uint8Array(bytes);
            let position = 0;
            for (const chunk of chunks) {
              if (typeof chunk === "undefined")
                continue;
              allChunks.set(chunk, position);
              position += chunk.length;
            }
            blob = new Blob([allChunks.buffer], { type: contentType || void 0 });
          }
          const result = await this.writeFile({
            path: options.path,
            directory: (_a = options.directory) !== null && _a !== void 0 ? _a : void 0,
            recursive: (_b = options.recursive) !== null && _b !== void 0 ? _b : false,
            data: blob
          });
          return { path: result.uri, blob };
        };
      }
      async initDb() {
        if (this._db !== void 0) {
          return this._db;
        }
        if (!("indexedDB" in window)) {
          throw this.unavailable("This browser doesn't support IndexedDB");
        }
        return new Promise((resolve2, reject) => {
          const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
          request.onupgradeneeded = _FilesystemWeb.doUpgrade;
          request.onsuccess = () => {
            this._db = request.result;
            resolve2(request.result);
          };
          request.onerror = () => reject(request.error);
          request.onblocked = () => {
            console.warn("db blocked");
          };
        });
      }
      static doUpgrade(event) {
        const eventTarget = event.target;
        const db2 = eventTarget.result;
        switch (event.oldVersion) {
          case 0:
          case 1:
          default: {
            if (db2.objectStoreNames.contains("FileStorage")) {
              db2.deleteObjectStore("FileStorage");
            }
            const store = db2.createObjectStore("FileStorage", { keyPath: "path" });
            store.createIndex("by_folder", "folder");
          }
        }
      }
      async dbRequest(cmd, args) {
        const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
        return this.initDb().then((conn) => {
          return new Promise((resolve2, reject) => {
            const tx = conn.transaction(["FileStorage"], readFlag);
            const store = tx.objectStore("FileStorage");
            const req = store[cmd](...args);
            req.onsuccess = () => resolve2(req.result);
            req.onerror = () => reject(req.error);
          });
        });
      }
      async dbIndexRequest(indexName, cmd, args) {
        const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
        return this.initDb().then((conn) => {
          return new Promise((resolve2, reject) => {
            const tx = conn.transaction(["FileStorage"], readFlag);
            const store = tx.objectStore("FileStorage");
            const index = store.index(indexName);
            const req = index[cmd](...args);
            req.onsuccess = () => resolve2(req.result);
            req.onerror = () => reject(req.error);
          });
        });
      }
      getPath(directory, uriPath) {
        const cleanedUriPath = uriPath !== void 0 ? uriPath.replace(/^[/]+|[/]+$/g, "") : "";
        let fsPath = "";
        if (directory !== void 0)
          fsPath += "/" + directory;
        if (uriPath !== "")
          fsPath += "/" + cleanedUriPath;
        return fsPath;
      }
      async clear() {
        const conn = await this.initDb();
        const tx = conn.transaction(["FileStorage"], "readwrite");
        const store = tx.objectStore("FileStorage");
        store.clear();
      }
      /**
       * Read a file from disk
       * @param options options for the file read
       * @return a promise that resolves with the read file data result
       */
      async readFile(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (entry === void 0)
          throw Error("File does not exist.");
        return { data: entry.content ? entry.content : "" };
      }
      /**
       * Write a file to disk in the specified location on device
       * @param options options for the file write
       * @return a promise that resolves with the file write result
       */
      async writeFile(options) {
        const path = this.getPath(options.directory, options.path);
        let data = options.data;
        const encoding = options.encoding;
        const doRecursive = options.recursive;
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (occupiedEntry && occupiedEntry.type === "directory")
          throw Error("The supplied path is a directory.");
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const parentEntry = await this.dbRequest("get", [parentPath]);
        if (parentEntry === void 0) {
          const subDirIndex = parentPath.indexOf("/", 1);
          if (subDirIndex !== -1) {
            const parentArgPath = parentPath.substr(subDirIndex);
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: doRecursive
            });
          }
        }
        if (!encoding && !(data instanceof Blob)) {
          data = data.indexOf(",") >= 0 ? data.split(",")[1] : data;
          if (!this.isBase64String(data))
            throw Error("The supplied data is not valid base64 content.");
        }
        const now = Date.now();
        const pathObj = {
          path,
          folder: parentPath,
          type: "file",
          size: data instanceof Blob ? data.size : data.length,
          ctime: now,
          mtime: now,
          content: data
        };
        await this.dbRequest("put", [pathObj]);
        return {
          uri: pathObj.path
        };
      }
      /**
       * Append to a file on disk in the specified location on device
       * @param options options for the file append
       * @return a promise that resolves with the file write result
       */
      async appendFile(options) {
        const path = this.getPath(options.directory, options.path);
        let data = options.data;
        const encoding = options.encoding;
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const now = Date.now();
        let ctime = now;
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (occupiedEntry && occupiedEntry.type === "directory")
          throw Error("The supplied path is a directory.");
        const parentEntry = await this.dbRequest("get", [parentPath]);
        if (parentEntry === void 0) {
          const subDirIndex = parentPath.indexOf("/", 1);
          if (subDirIndex !== -1) {
            const parentArgPath = parentPath.substr(subDirIndex);
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: true
            });
          }
        }
        if (!encoding && !this.isBase64String(data))
          throw Error("The supplied data is not valid base64 content.");
        if (occupiedEntry !== void 0) {
          if (occupiedEntry.content instanceof Blob) {
            throw Error("The occupied entry contains a Blob object which cannot be appended to.");
          }
          if (occupiedEntry.content !== void 0 && !encoding) {
            data = btoa(atob(occupiedEntry.content) + atob(data));
          } else {
            data = occupiedEntry.content + data;
          }
          ctime = occupiedEntry.ctime;
        }
        const pathObj = {
          path,
          folder: parentPath,
          type: "file",
          size: data.length,
          ctime,
          mtime: now,
          content: data
        };
        await this.dbRequest("put", [pathObj]);
      }
      /**
       * Delete a file from disk
       * @param options options for the file delete
       * @return a promise that resolves with the deleted file data result
       */
      async deleteFile(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (entry === void 0)
          throw Error("File does not exist.");
        const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [
          IDBKeyRange.only(path)
        ]);
        if (entries.length !== 0)
          throw Error("Folder is not empty.");
        await this.dbRequest("delete", [path]);
      }
      /**
       * Create a directory.
       * @param options options for the mkdir
       * @return a promise that resolves with the mkdir result
       */
      async mkdir(options) {
        const path = this.getPath(options.directory, options.path);
        const doRecursive = options.recursive;
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const depth = (path.match(/\//g) || []).length;
        const parentEntry = await this.dbRequest("get", [parentPath]);
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (depth === 1)
          throw Error("Cannot create Root directory");
        if (occupiedEntry !== void 0)
          throw Error("Current directory does already exist.");
        if (!doRecursive && depth !== 2 && parentEntry === void 0)
          throw Error("Parent directory must exist");
        if (doRecursive && depth !== 2 && parentEntry === void 0) {
          const parentArgPath = parentPath.substr(parentPath.indexOf("/", 1));
          await this.mkdir({
            path: parentArgPath,
            directory: options.directory,
            recursive: doRecursive
          });
        }
        const now = Date.now();
        const pathObj = {
          path,
          folder: parentPath,
          type: "directory",
          size: 0,
          ctime: now,
          mtime: now
        };
        await this.dbRequest("put", [pathObj]);
      }
      /**
       * Remove a directory
       * @param options the options for the directory remove
       */
      async rmdir(options) {
        const { path, directory, recursive } = options;
        const fullPath = this.getPath(directory, path);
        const entry = await this.dbRequest("get", [fullPath]);
        if (entry === void 0)
          throw Error("Folder does not exist.");
        if (entry.type !== "directory")
          throw Error("Requested path is not a directory");
        const readDirResult = await this.readdir({ path, directory });
        if (readDirResult.files.length !== 0 && !recursive)
          throw Error("Folder is not empty");
        for (const entry2 of readDirResult.files) {
          const entryPath = `${path}/${entry2.name}`;
          const entryObj = await this.stat({ path: entryPath, directory });
          if (entryObj.type === "file") {
            await this.deleteFile({ path: entryPath, directory });
          } else {
            await this.rmdir({ path: entryPath, directory, recursive });
          }
        }
        await this.dbRequest("delete", [fullPath]);
      }
      /**
       * Return a list of files from the directory (not recursive)
       * @param options the options for the readdir operation
       * @return a promise that resolves with the readdir directory listing result
       */
      async readdir(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (options.path !== "" && entry === void 0)
          throw Error("Folder does not exist.");
        const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
        const files = await Promise.all(entries.map(async (e) => {
          let subEntry = await this.dbRequest("get", [e]);
          if (subEntry === void 0) {
            subEntry = await this.dbRequest("get", [e + "/"]);
          }
          return {
            name: e.substring(path.length + 1),
            type: subEntry.type,
            size: subEntry.size,
            ctime: subEntry.ctime,
            mtime: subEntry.mtime,
            uri: subEntry.path
          };
        }));
        return { files };
      }
      /**
       * Return full File URI for a path and directory
       * @param options the options for the stat operation
       * @return a promise that resolves with the file stat result
       */
      async getUri(options) {
        const path = this.getPath(options.directory, options.path);
        let entry = await this.dbRequest("get", [path]);
        if (entry === void 0) {
          entry = await this.dbRequest("get", [path + "/"]);
        }
        return {
          uri: (entry === null || entry === void 0 ? void 0 : entry.path) || path
        };
      }
      /**
       * Return data about a file
       * @param options the options for the stat operation
       * @return a promise that resolves with the file stat result
       */
      async stat(options) {
        const path = this.getPath(options.directory, options.path);
        let entry = await this.dbRequest("get", [path]);
        if (entry === void 0) {
          entry = await this.dbRequest("get", [path + "/"]);
        }
        if (entry === void 0)
          throw Error("Entry does not exist.");
        return {
          type: entry.type,
          size: entry.size,
          ctime: entry.ctime,
          mtime: entry.mtime,
          uri: entry.path
        };
      }
      /**
       * Rename a file or directory
       * @param options the options for the rename operation
       * @return a promise that resolves with the rename result
       */
      async rename(options) {
        await this._copy(options, true);
        return;
      }
      /**
       * Copy a file or directory
       * @param options the options for the copy operation
       * @return a promise that resolves with the copy result
       */
      async copy(options) {
        return this._copy(options, false);
      }
      async requestPermissions() {
        return { publicStorage: "granted" };
      }
      async checkPermissions() {
        return { publicStorage: "granted" };
      }
      /**
       * Function that can perform a copy or a rename
       * @param options the options for the rename operation
       * @param doRename whether to perform a rename or copy operation
       * @return a promise that resolves with the result
       */
      async _copy(options, doRename = false) {
        let { toDirectory } = options;
        const { to, from, directory: fromDirectory } = options;
        if (!to || !from) {
          throw Error("Both to and from must be provided");
        }
        if (!toDirectory) {
          toDirectory = fromDirectory;
        }
        const fromPath = this.getPath(fromDirectory, from);
        const toPath = this.getPath(toDirectory, to);
        if (fromPath === toPath) {
          return {
            uri: toPath
          };
        }
        if (isPathParent(fromPath, toPath)) {
          throw Error("To path cannot contain the from path");
        }
        let toObj;
        try {
          toObj = await this.stat({
            path: to,
            directory: toDirectory
          });
        } catch (e) {
          const toPathComponents = to.split("/");
          toPathComponents.pop();
          const toPath2 = toPathComponents.join("/");
          if (toPathComponents.length > 0) {
            const toParentDirectory = await this.stat({
              path: toPath2,
              directory: toDirectory
            });
            if (toParentDirectory.type !== "directory") {
              throw new Error("Parent directory of the to path is a file");
            }
          }
        }
        if (toObj && toObj.type === "directory") {
          throw new Error("Cannot overwrite a directory with a file");
        }
        const fromObj = await this.stat({
          path: from,
          directory: fromDirectory
        });
        const updateTime = async (path, ctime2, mtime) => {
          const fullPath = this.getPath(toDirectory, path);
          const entry = await this.dbRequest("get", [fullPath]);
          entry.ctime = ctime2;
          entry.mtime = mtime;
          await this.dbRequest("put", [entry]);
        };
        const ctime = fromObj.ctime ? fromObj.ctime : Date.now();
        switch (fromObj.type) {
          // The "from" object is a file
          case "file": {
            const file = await this.readFile({
              path: from,
              directory: fromDirectory
            });
            if (doRename) {
              await this.deleteFile({
                path: from,
                directory: fromDirectory
              });
            }
            let encoding;
            if (!(file.data instanceof Blob) && !this.isBase64String(file.data)) {
              encoding = Encoding.UTF8;
            }
            const writeResult = await this.writeFile({
              path: to,
              directory: toDirectory,
              data: file.data,
              encoding
            });
            if (doRename) {
              await updateTime(to, ctime, fromObj.mtime);
            }
            return writeResult;
          }
          case "directory": {
            if (toObj) {
              throw Error("Cannot move a directory over an existing object");
            }
            try {
              await this.mkdir({
                path: to,
                directory: toDirectory,
                recursive: false
              });
              if (doRename) {
                await updateTime(to, ctime, fromObj.mtime);
              }
            } catch (e) {
            }
            const contents = (await this.readdir({
              path: from,
              directory: fromDirectory
            })).files;
            for (const filename of contents) {
              await this._copy({
                from: `${from}/${filename.name}`,
                to: `${to}/${filename.name}`,
                directory: fromDirectory,
                toDirectory
              }, doRename);
            }
            if (doRename) {
              await this.rmdir({
                path: from,
                directory: fromDirectory
              });
            }
          }
        }
        return {
          uri: toPath
        };
      }
      isBase64String(str) {
        try {
          return btoa(atob(str)) == str;
        } catch (err) {
          return false;
        }
      }
    };
    FilesystemWeb._debug = true;
  }
});

// node_modules/@capacitor/filesystem/dist/esm/index.js
var Filesystem;
var init_esm = __esm({
  "node_modules/@capacitor/filesystem/dist/esm/index.js"() {
    init_dist();
    init_definitions();
    Filesystem = registerPlugin("Filesystem", {
      web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.FilesystemWeb())
    });
  }
});

// src/store.js
function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function readDbBytes() {
  try {
    const res = await Filesystem.readFile({
      path: DB_FILENAME,
      directory: Directory.Data
    });
    return base64ToBytes(res.data);
  } catch (e) {
    return null;
  }
}
async function writeDbBytes(bytes) {
  await Filesystem.writeFile({
    path: DB_FILENAME,
    directory: Directory.Data,
    data: bytesToBase64(bytes),
    recursive: true
  });
}
var DB_FILENAME, isNative;
var init_store = __esm({
  "src/store.js"() {
    init_dist();
    init_esm();
    DB_FILENAME = "mis-finanzas.sqlite";
    isNative = Capacitor.isNativePlatform();
  }
});

// src/db.js
var db_exports = {};
__export(db_exports, {
  addDebt: () => addDebt,
  addDebtPlan: () => addDebtPlan,
  addExpense: () => addExpense,
  addGoal: () => addGoal,
  addIncome: () => addIncome,
  addIncomeCategory: () => addIncomeCategory,
  addNote: () => addNote,
  addPayment: () => addPayment,
  addRecurring: () => addRecurring,
  applyRecurring: () => applyRecurring,
  budgetStatus: () => budgetStatus,
  categoryTotals: () => categoryTotals,
  contributeGoal: () => contributeGoal,
  currentMonthKey: () => currentMonthKey,
  deleteBudget: () => deleteBudget,
  deleteDebt: () => deleteDebt,
  deleteExpense: () => deleteExpense,
  deleteGoal: () => deleteGoal,
  deleteIncome: () => deleteIncome,
  deleteIncomeCategory: () => deleteIncomeCategory,
  deleteNote: () => deleteNote,
  deletePayment: () => deletePayment,
  deleteRecurring: () => deleteRecurring,
  expenseCategoryTotals: () => expenseCategoryTotals,
  exportBytes: () => exportBytes,
  getPayment: () => getPayment,
  getSetting: () => getSetting,
  getSummary: () => getSummary,
  initDb: () => initDb,
  listBudgets: () => listBudgets,
  listDebts: () => listDebts,
  listExpenses: () => listExpenses,
  listGoals: () => listGoals,
  listIncomeCategories: () => listIncomeCategories,
  listIncomes: () => listIncomes,
  listNotes: () => listNotes,
  listPayments: () => listPayments,
  listRecurring: () => listRecurring,
  loadJsonData: () => loadJsonData,
  monthExpenseByCategory: () => monthExpenseByCategory,
  monthlyTotals: () => monthlyTotals,
  persist: () => persist,
  replaceWithBytes: () => replaceWithBytes,
  scheduledAfter: () => scheduledAfter,
  scheduledOnOrAfter: () => scheduledOnOrAfter,
  setBudget: () => setBudget,
  setSetting: () => setSetting,
  today: () => today,
  toggleRecurring: () => toggleRecurring,
  upcomingDebts: () => upcomingDebts,
  updateDebt: () => updateDebt,
  updateDebtPlan: () => updateDebtPlan,
  updateExpense: () => updateExpense,
  updateGoal: () => updateGoal,
  updateIncome: () => updateIncome,
  updateNote: () => updateNote,
  updateRecurring: () => updateRecurring
});
function nowISO() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function today() {
  const d = /* @__PURE__ */ new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function currentMonthKey() {
  return today().slice(0, 7);
}
function addDaysStr(dateStr, n) {
  const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function monthScheduleDates(y, m, day) {
  const last = new Date(y, m, 0).getDate();
  const d = Math.max(1, Math.min(parseInt(day, 10) || 15, 31));
  const set = /* @__PURE__ */ new Set();
  set.add(Math.min(d, last));
  set.add(last);
  const p = (x) => String(x).padStart(2, "0");
  return [...set].sort((a, b) => a - b).map((dd) => `${y}-${p(m)}-${p(dd)}`);
}
function scheduledOnOrAfter(fromStr, day) {
  let [y, m] = fromStr.split("-").map(Number);
  for (let i = 0; i < 120; i++) {
    for (const ds of monthScheduleDates(y, m, day)) if (ds >= fromStr) return ds;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return fromStr;
}
function scheduledAfter(fromStr, day) {
  let [y, m] = fromStr.split("-").map(Number);
  for (let i = 0; i < 120; i++) {
    for (const ds of monthScheduleDates(y, m, day)) if (ds > fromStr) return ds;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return fromStr;
}
function ensureColumn(table, col, def) {
  const info = all(`PRAGMA table_info(${table})`);
  if (!info.some((c) => c.name === col)) db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
async function initDb() {
  const initSqlJs = window.initSqlJs;
  if (!initSqlJs) throw new Error("sql.js no cargado");
  SQL = await initSqlJs({ locateFile: () => "vendor/sql-wasm.wasm" });
  const bytes = await readDbBytes();
  db = bytes && bytes.length ? new SQL.Database(bytes) : new SQL.Database();
  db.run("PRAGMA foreign_keys = ON;");
  db.run(SCHEMA);
  ensureColumn("recurring", "schedule", "TEXT NOT NULL DEFAULT 'interval'");
  ensureColumn("recurring", "day_of_month", "INTEGER");
  ensureColumn("debts", "plan_id", "TEXT");
  ensureColumn("debts", "installment_no", "INTEGER");
  ensureColumn("debts", "installments", "INTEGER");
  await persist();
  return db;
}
function exportBytes() {
  return safeExport();
}
function safeExport() {
  const bytes = db.export();
  db.run("PRAGMA foreign_keys = ON;");
  return bytes;
}
function replaceWithBytes(bytes) {
  if (db) db.close();
  db = new SQL.Database(bytes);
  db.run("PRAGMA foreign_keys = ON;");
  db.run(SCHEMA);
  markDirty();
}
function markDirty() {
  dirty = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persist(), 300);
}
async function persist() {
  if (!db) return;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  dirty = false;
  await writeDbBytes(safeExport());
}
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}
function one(sql, params = []) {
  return all(sql, params)[0] || null;
}
function run(sql, params = []) {
  db.run(sql, params);
  markDirty();
}
function getSetting(key, fallback = null) {
  const row = one("SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : fallback;
}
function setSetting(key, value) {
  run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, String(value)]
  );
}
function listGoals() {
  return all("SELECT * FROM goals ORDER BY (due_date IS NULL), due_date ASC, id DESC");
}
function addGoal({ name, target, saved, due_date }) {
  run(
    "INSERT INTO goals (name, target, saved, due_date, created_at) VALUES (?, ?, ?, ?, ?)",
    [name, Number(target) || 0, Number(saved) || 0, due_date || null, nowISO()]
  );
}
function updateGoal(id, { name, target, saved, due_date }) {
  run("UPDATE goals SET name = ?, target = ?, saved = ?, due_date = ? WHERE id = ?", [
    name,
    Number(target) || 0,
    Number(saved) || 0,
    due_date || null,
    id
  ]);
}
function contributeGoal(id, amount) {
  run("UPDATE goals SET saved = saved + ? WHERE id = ?", [Number(amount) || 0, id]);
}
function deleteGoal(id) {
  run("DELETE FROM goals WHERE id = ?", [id]);
}
function listIncomes() {
  return all("SELECT * FROM incomes ORDER BY date DESC, id DESC");
}
function addIncome({ amount, description, category, date }) {
  run(
    "INSERT INTO incomes (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)",
    [Number(amount), description || "", category || "", date || today(), nowISO()]
  );
}
function updateIncome(id, { amount, description, category, date }) {
  run(
    "UPDATE incomes SET amount = ?, description = ?, category = ?, date = ? WHERE id = ?",
    [Number(amount), description || "", category || "", date || today(), id]
  );
}
function deleteIncome(id) {
  run("DELETE FROM incomes WHERE id = ?", [id]);
}
function listExpenses() {
  return all("SELECT * FROM expenses ORDER BY date DESC, id DESC");
}
function addExpense({ amount, description, category, date }) {
  run(
    "INSERT INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)",
    [Number(amount), description || "", category || "", date || today(), nowISO()]
  );
}
function updateExpense(id, { amount, description, category, date }) {
  run(
    "UPDATE expenses SET amount = ?, description = ?, category = ?, date = ? WHERE id = ?",
    [Number(amount), description || "", category || "", date || today(), id]
  );
}
function deleteExpense(id) {
  run("DELETE FROM expenses WHERE id = ?", [id]);
}
function listDebts() {
  return all(`
    SELECT d.*, COALESCE(SUM(p.amount), 0) AS paid
    FROM debts d
    LEFT JOIN payments p ON p.debt_id = d.id
    GROUP BY d.id
    ORDER BY (d.due_date IS NULL), d.due_date ASC, d.id DESC
  `);
}
function addDebt({ name, amount, due_date, notes, plan_id = null, installment_no = null, installments = null }) {
  run(
    "INSERT INTO debts (name, amount, due_date, notes, plan_id, installment_no, installments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [name, Number(amount), due_date || null, notes || "", plan_id, installment_no, installments, nowISO()]
  );
}
function addDebtPlan({ name, amount, count, every_days, due_date, notes }) {
  const n = Math.max(1, parseInt(count, 10) || 1);
  const gap = Math.max(1, parseInt(every_days, 10) || 30);
  const start = due_date || today();
  const planId = "plan-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  for (let i = 0; i < n; i++) {
    addDebt({
      name,
      amount,
      due_date: addDaysStr(start, i * gap),
      notes,
      plan_id: planId,
      installment_no: i + 1,
      installments: n
    });
  }
  return planId;
}
function updateDebtPlan(planId, { name, amount, count, every_days, due_date, notes }) {
  const n = Math.max(1, parseInt(count, 10) || 1);
  const gap = Math.max(1, parseInt(every_days, 10) || 30);
  const start = due_date || today();
  const old = all("SELECT * FROM debts WHERE plan_id = ? ORDER BY installment_no ASC", [planId]);
  const paysByNo = /* @__PURE__ */ new Map();
  for (const o of old) paysByNo.set(o.installment_no, all("SELECT * FROM payments WHERE debt_id = ?", [o.id]));
  for (const o of old) run("DELETE FROM debts WHERE id = ?", [o.id]);
  for (let i = 0; i < n; i++) {
    const no = i + 1;
    run(
      "INSERT INTO debts (name, amount, due_date, notes, plan_id, installment_no, installments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, Number(amount), addDaysStr(start, i * gap), notes || "", planId, no, n, nowISO()]
    );
    const newId = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    for (const p of paysByNo.get(no) || []) {
      run("INSERT INTO payments (debt_id, amount, date, created_at) VALUES (?, ?, ?, ?)", [newId, p.amount, p.date, p.created_at || nowISO()]);
    }
  }
}
function updateDebt(id, { name, amount, due_date, notes }) {
  run("UPDATE debts SET name = ?, amount = ?, due_date = ?, notes = ? WHERE id = ?", [
    name,
    Number(amount),
    due_date || null,
    notes || "",
    id
  ]);
}
function deleteDebt(id) {
  run("DELETE FROM debts WHERE id = ?", [id]);
}
function listPayments(debtId) {
  return all("SELECT * FROM payments WHERE debt_id = ? ORDER BY date DESC, id DESC", [debtId]);
}
function addPayment(debtId, { amount, date }) {
  run("INSERT INTO payments (debt_id, amount, date, created_at) VALUES (?, ?, ?, ?)", [
    debtId,
    Number(amount),
    date || today(),
    nowISO()
  ]);
}
function deletePayment(id) {
  run("DELETE FROM payments WHERE id = ?", [id]);
}
function getPayment(id) {
  return one("SELECT * FROM payments WHERE id = ?", [id]);
}
function listNotes() {
  return all("SELECT * FROM notes ORDER BY updated_at DESC, id DESC");
}
function addNote({ title: title2, body, color }) {
  const t = nowISO();
  run("INSERT INTO notes (title, body, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [
    title2 || "",
    body || "",
    color || "default",
    t,
    t
  ]);
}
function updateNote(id, { title: title2, body, color }) {
  run("UPDATE notes SET title = ?, body = ?, color = ?, updated_at = ? WHERE id = ?", [
    title2 || "",
    body || "",
    color || "default",
    nowISO(),
    id
  ]);
}
function deleteNote(id) {
  run("DELETE FROM notes WHERE id = ?", [id]);
}
function getSummary() {
  const inc = one("SELECT COALESCE(SUM(amount),0) AS t FROM incomes");
  const exp = one("SELECT COALESCE(SUM(amount),0) AS t FROM expenses");
  const debt = one("SELECT COALESCE(SUM(amount),0) AS t FROM debts");
  const firstOnly = String(getSetting("debt_first_only", "0")) === "1";
  const debtForBalance = firstOnly ? one("SELECT COALESCE(SUM(amount),0) AS t FROM debts WHERE plan_id IS NULL OR installment_no = 1") : debt;
  const paid = one("SELECT COALESCE(SUM(amount),0) AS t FROM payments");
  const totalIncome = inc ? inc.t : 0;
  const totalExpenses = exp ? exp.t : 0;
  const totalDebt = debt ? debt.t : 0;
  const totalPaid = paid ? paid.t : 0;
  const pending = Math.max(totalDebt - totalPaid, 0);
  const outflow = totalExpenses + totalPaid;
  const debtInBalance = debtForBalance ? debtForBalance.t : 0;
  return {
    totalIncome,
    totalExpenses,
    totalDebt,
    totalPaid,
    debtInBalance,
    firstOnly,
    pending,
    outflow,
    balance: totalIncome - totalExpenses - debtInBalance,
    netWorth: totalIncome - totalExpenses - pending,
    countDebts: (one("SELECT COUNT(*) AS c FROM debts") || { c: 0 }).c,
    countIncome: (one("SELECT COUNT(*) AS c FROM incomes") || { c: 0 }).c,
    countExpenses: (one("SELECT COUNT(*) AS c FROM expenses") || { c: 0 }).c,
    countNotes: (one("SELECT COUNT(*) AS c FROM notes") || { c: 0 }).c
  };
}
function monthlyTotals(months = 6) {
  const out = [];
  const d = /* @__PURE__ */ new Date();
  d.setDate(1);
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
    const inc = one("SELECT COALESCE(SUM(amount),0) AS t FROM incomes WHERE substr(date,1,7) = ?", [key]);
    const exp = one("SELECT COALESCE(SUM(amount),0) AS t FROM expenses WHERE substr(date,1,7) = ?", [key]);
    const pay = one("SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE substr(date,1,7) = ?", [key]);
    out.push({
      key,
      label: ref.toLocaleDateString("es", { month: "short" }),
      income: inc ? inc.t : 0,
      expenses: exp ? exp.t : 0,
      paid: pay ? pay.t : 0
    });
  }
  return out;
}
function upcomingDebts(days = 7) {
  const rows = listDebts();
  const limit = /* @__PURE__ */ new Date();
  limit.setHours(23, 59, 59, 999);
  limit.setDate(limit.getDate() + days);
  const todayStr = today();
  return rows.filter((d) => {
    const remaining = d.amount - d.paid;
    if (remaining <= 1e-4) return false;
    if (!d.due_date) return false;
    return d.due_date <= limit.toISOString().slice(0, 10);
  }).map((d) => ({
    ...d,
    remaining: d.amount - d.paid,
    overdue: d.due_date < todayStr
  })).sort((a, b) => a.due_date < b.due_date ? -1 : 1);
}
function loadJsonData(data) {
  const t = nowISO();
  db.run("DELETE FROM payments; DELETE FROM debts; DELETE FROM incomes; DELETE FROM expenses; DELETE FROM notes; DELETE FROM budgets; DELETE FROM recurring; DELETE FROM income_categories; DELETE FROM goals;");
  const insIncome = db.prepare(
    "INSERT INTO incomes (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const i of data.incomes || []) {
    insIncome.run([Number(i.amount) || 0, i.description || "", i.category || "", i.date || today(), i.created_at || t]);
  }
  insIncome.free();
  const insExpense = db.prepare(
    "INSERT INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const x of data.expenses || []) {
    insExpense.run([Number(x.amount) || 0, x.description || "", x.category || "", x.date || today(), x.created_at || t]);
  }
  insExpense.free();
  const insDebt = db.prepare("INSERT INTO debts (name, amount, due_date, notes, plan_id, installment_no, installments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const insPay = db.prepare(
    "INSERT INTO payments (debt_id, amount, date, created_at) VALUES (?, ?, ?, ?)"
  );
  for (const d of data.debts || []) {
    insDebt.run([d.name || "", Number(d.amount) || 0, d.due_date || null, d.notes || "", d.plan_id || null, d.installment_no ?? null, d.installments ?? null, d.created_at || t]);
    const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    for (const p of d.payments || []) {
      insPay.run([id, Number(p.amount) || 0, p.date || today(), p.created_at || t]);
    }
  }
  insDebt.free();
  insPay.free();
  const insNote = db.prepare(
    "INSERT INTO notes (title, body, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const n of data.notes || []) {
    insNote.run([n.title || "", n.body || "", n.color || "default", n.created_at || t, n.updated_at || t]);
  }
  insNote.free();
  if (data.settings) {
    if (data.settings.currency != null) setSetting("currency", data.settings.currency);
    if (data.settings.reminderDays != null) setSetting("reminderDays", data.settings.reminderDays);
    if (data.settings.debtFirstOnly != null) setSetting("debt_first_only", data.settings.debtFirstOnly ? "1" : "0");
  }
  const insBudget = db.prepare("INSERT INTO budgets (category, amount) VALUES (?, ?)");
  for (const b of data.budgets || []) {
    if (b && b.category) insBudget.run([b.category, Number(b.amount) || 0]);
  }
  insBudget.free();
  const insIncCat = db.prepare("INSERT INTO income_categories (name) VALUES (?)");
  for (const c of data.incomeCategories || []) {
    const name = typeof c === "string" ? c : c && c.name;
    if (name) insIncCat.run([name]);
  }
  insIncCat.free();
  const insRec = db.prepare(
    "INSERT INTO recurring (type, amount, description, category, interval_days, next_date, active, schedule, day_of_month, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const r of data.recurring || []) {
    const sch = r.schedule === "day_last" ? "day_last" : "interval";
    insRec.run([
      r.type === "income" ? "income" : "expense",
      Number(r.amount) || 0,
      r.description || "",
      r.category || "",
      parseInt(r.interval_days, 10) || 30,
      r.next_date || today(),
      r.active === 0 ? 0 : 1,
      sch,
      sch === "day_last" ? parseInt(r.day_of_month, 10) || 15 : null,
      r.created_at || t
    ]);
  }
  insRec.free();
  const insGoal = db.prepare("INSERT INTO goals (name, target, saved, due_date, created_at) VALUES (?, ?, ?, ?, ?)");
  for (const g of data.goals || []) {
    if (!g) continue;
    insGoal.run([g.name || "", Number(g.target) || 0, Number(g.saved) || 0, g.due_date || null, g.created_at || t]);
  }
  insGoal.free();
  markDirty();
}
function categoryTotals() {
  return all(
    "SELECT COALESCE(NULLIF(category,''),'Sin categor\xEDa') AS category, SUM(amount) AS total FROM incomes GROUP BY category ORDER BY total DESC"
  );
}
function expenseCategoryTotals() {
  return all(
    "SELECT COALESCE(NULLIF(category,''),'Sin categor\xEDa') AS category, SUM(amount) AS total FROM expenses GROUP BY category ORDER BY total DESC"
  );
}
function listBudgets() {
  return all("SELECT * FROM budgets ORDER BY category ASC");
}
function setBudget(category, amount) {
  const cat = (category || "").trim();
  if (!cat) return;
  if (!(Number(amount) > 0)) {
    deleteBudget(cat);
    return;
  }
  run(
    "INSERT INTO budgets (category, amount) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET amount = excluded.amount",
    [cat, Number(amount)]
  );
}
function deleteBudget(category) {
  run("DELETE FROM budgets WHERE category = ?", [category]);
}
function listIncomeCategories() {
  return all("SELECT name FROM income_categories ORDER BY name ASC");
}
function addIncomeCategory(name) {
  const n = (name || "").trim();
  if (!n) return;
  run("INSERT INTO income_categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING", [n]);
}
function deleteIncomeCategory(name) {
  run("DELETE FROM income_categories WHERE name = ?", [name]);
}
function monthExpenseByCategory(monthKey = currentMonthKey()) {
  return all(
    "SELECT COALESCE(NULLIF(category,''),'Sin categor\xEDa') AS category, SUM(amount) AS total FROM expenses WHERE substr(date,1,7) = ? GROUP BY category",
    [monthKey]
  );
}
function budgetStatus(monthKey = currentMonthKey()) {
  const budgets = listBudgets();
  const spent = monthExpenseByCategory(monthKey);
  const spentMap = {};
  spent.forEach((s) => spentMap[s.category] = s.total);
  return budgets.map((b) => ({
    category: b.category,
    budget: b.amount,
    spent: spentMap[b.category] || 0,
    remaining: b.amount - (spentMap[b.category] || 0),
    pct: b.amount > 0 ? Math.min(100, (spentMap[b.category] || 0) / b.amount * 100) : 0
  }));
}
function listRecurring() {
  return all("SELECT * FROM recurring ORDER BY active DESC, next_date ASC, id DESC");
}
function addRecurring({ type, amount, description, category, interval_days, next_date, schedule, day_of_month }) {
  const sch = schedule === "day_last" ? "day_last" : "interval";
  run(
    "INSERT INTO recurring (type, amount, description, category, interval_days, next_date, active, schedule, day_of_month, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)",
    [
      type === "income" ? "income" : "expense",
      Number(amount),
      description || "",
      category || "",
      Math.max(1, parseInt(interval_days, 10) || 30),
      next_date || today(),
      sch,
      sch === "day_last" ? Math.max(1, Math.min(parseInt(day_of_month, 10) || 15, 31)) : null,
      nowISO()
    ]
  );
}
function updateRecurring(id, { type, amount, description, category, interval_days, next_date, active, schedule, day_of_month }) {
  const sch = schedule === "day_last" ? "day_last" : "interval";
  run(
    "UPDATE recurring SET type = ?, amount = ?, description = ?, category = ?, interval_days = ?, next_date = ?, active = ?, schedule = ?, day_of_month = ? WHERE id = ?",
    [
      type === "income" ? "income" : "expense",
      Number(amount),
      description || "",
      category || "",
      Math.max(1, parseInt(interval_days, 10) || 30),
      next_date || today(),
      active ? 1 : 0,
      sch,
      sch === "day_last" ? Math.max(1, Math.min(parseInt(day_of_month, 10) || 15, 31)) : null,
      id
    ]
  );
}
function deleteRecurring(id) {
  run("DELETE FROM recurring WHERE id = ?", [id]);
}
function toggleRecurring(id) {
  const row = one("SELECT active FROM recurring WHERE id = ?", [id]);
  if (row) run("UPDATE recurring SET active = ? WHERE id = ?", [row.active ? 0 : 1, id]);
}
function applyRecurring() {
  const t = today();
  const rows = all("SELECT * FROM recurring WHERE active = 1");
  let created = 0;
  for (const r of rows) {
    let next = r.next_date;
    let guard = 0;
    while (next <= t && guard < 1e3) {
      if (r.type === "income") {
        db.run(
          "INSERT INTO incomes (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)",
          [r.amount, r.description || "", r.category || "", next, nowISO()]
        );
      } else {
        db.run(
          "INSERT INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, ?)",
          [r.amount, r.description || "", r.category || "", next, nowISO()]
        );
      }
      created++;
      next = r.schedule === "day_last" ? scheduledAfter(next, r.day_of_month) : addDaysStr(next, r.interval_days);
      guard++;
    }
    if (next !== r.next_date) run("UPDATE recurring SET next_date = ? WHERE id = ?", [next, r.id]);
  }
  return created;
}
var SQL, db, dirty, saveTimer, SCHEMA;
var init_db = __esm({
  "src/db.js"() {
    init_store();
    SQL = null;
    db = null;
    dirty = false;
    saveTimer = null;
    SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  due_date TEXT,
  notes TEXT,
  plan_id TEXT,
  installment_no INTEGER,
  installments INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debt_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  body TEXT,
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  category TEXT PRIMARY KEY,
  amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS income_categories (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS recurring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  interval_days INTEGER NOT NULL,
  next_date TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  schedule TEXT NOT NULL DEFAULT 'interval',
  day_of_month INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target REAL NOT NULL,
  saved REAL NOT NULL DEFAULT 0,
  due_date TEXT,
  created_at TEXT NOT NULL
);
`;
  }
});

// node_modules/@capacitor/share/dist/esm/web.js
var web_exports2 = {};
__export(web_exports2, {
  ShareWeb: () => ShareWeb
});
var ShareWeb;
var init_web2 = __esm({
  "node_modules/@capacitor/share/dist/esm/web.js"() {
    init_dist();
    ShareWeb = class extends WebPlugin {
      async canShare() {
        if (typeof navigator === "undefined" || !navigator.share) {
          return { value: false };
        } else {
          return { value: true };
        }
      }
      async share(options) {
        if (typeof navigator === "undefined" || !navigator.share) {
          throw this.unavailable("Share API not available in this browser");
        }
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url
        });
        return {};
      }
    };
  }
});

// node_modules/@capacitor/local-notifications/dist/esm/web.js
var web_exports3 = {};
__export(web_exports3, {
  LocalNotificationsWeb: () => LocalNotificationsWeb
});
var LocalNotificationsWeb;
var init_web3 = __esm({
  "node_modules/@capacitor/local-notifications/dist/esm/web.js"() {
    init_dist();
    LocalNotificationsWeb = class extends WebPlugin {
      constructor() {
        super(...arguments);
        this.pending = [];
        this.deliveredNotifications = [];
        this.hasNotificationSupport = () => {
          if (!("Notification" in window) || !Notification.requestPermission) {
            return false;
          }
          if (Notification.permission !== "granted") {
            try {
              new Notification("");
            } catch (e) {
              if (e.name == "TypeError") {
                return false;
              }
            }
          }
          return true;
        };
      }
      async getDeliveredNotifications() {
        const deliveredSchemas = [];
        for (const notification of this.deliveredNotifications) {
          const deliveredSchema = {
            title: notification.title,
            id: parseInt(notification.tag),
            body: notification.body
          };
          deliveredSchemas.push(deliveredSchema);
        }
        return {
          notifications: deliveredSchemas
        };
      }
      async removeDeliveredNotifications(delivered) {
        for (const toRemove of delivered.notifications) {
          const found = this.deliveredNotifications.find((n) => n.tag === String(toRemove.id));
          found === null || found === void 0 ? void 0 : found.close();
          this.deliveredNotifications = this.deliveredNotifications.filter(() => !found);
        }
      }
      async removeAllDeliveredNotifications() {
        for (const notification of this.deliveredNotifications) {
          notification.close();
        }
        this.deliveredNotifications = [];
      }
      async createChannel() {
        throw this.unimplemented("Not implemented on web.");
      }
      async deleteChannel() {
        throw this.unimplemented("Not implemented on web.");
      }
      async listChannels() {
        throw this.unimplemented("Not implemented on web.");
      }
      async schedule(options) {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        for (const notification of options.notifications) {
          this.sendNotification(notification);
        }
        return {
          notifications: options.notifications.map((notification) => ({
            id: notification.id
          }))
        };
      }
      async getPending() {
        return {
          notifications: this.pending
        };
      }
      async registerActionTypes() {
        throw this.unimplemented("Not implemented on web.");
      }
      async cancel(pending) {
        this.pending = this.pending.filter((notification) => !pending.notifications.find((n) => n.id === notification.id));
      }
      async areEnabled() {
        const { display } = await this.checkPermissions();
        return {
          value: display === "granted"
        };
      }
      async changeExactNotificationSetting() {
        throw this.unimplemented("Not implemented on web.");
      }
      async checkExactNotificationSetting() {
        throw this.unimplemented("Not implemented on web.");
      }
      async requestPermissions() {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        const display = this.transformNotificationPermission(await Notification.requestPermission());
        return { display };
      }
      async checkPermissions() {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        const display = this.transformNotificationPermission(Notification.permission);
        return { display };
      }
      transformNotificationPermission(permission) {
        switch (permission) {
          case "granted":
            return "granted";
          case "denied":
            return "denied";
          default:
            return "prompt";
        }
      }
      sendPending() {
        var _a;
        const toRemove = [];
        const now = (/* @__PURE__ */ new Date()).getTime();
        for (const notification of this.pending) {
          if (((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) && notification.schedule.at.getTime() <= now) {
            this.buildNotification(notification);
            toRemove.push(notification);
          }
        }
        this.pending = this.pending.filter((notification) => !toRemove.find((n) => n === notification));
      }
      sendNotification(notification) {
        var _a;
        if ((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) {
          const diff = notification.schedule.at.getTime() - (/* @__PURE__ */ new Date()).getTime();
          this.pending.push(notification);
          setTimeout(() => {
            this.sendPending();
          }, diff);
          return;
        }
        this.buildNotification(notification);
      }
      buildNotification(notification) {
        const localNotification = new Notification(notification.title, {
          body: notification.body,
          tag: String(notification.id)
        });
        localNotification.addEventListener("click", this.onClick.bind(this, notification), false);
        localNotification.addEventListener("show", this.onShow.bind(this, notification), false);
        localNotification.addEventListener("close", () => {
          this.deliveredNotifications = this.deliveredNotifications.filter(() => !this);
        }, false);
        this.deliveredNotifications.push(localNotification);
        return localNotification;
      }
      onClick(notification) {
        const data = {
          actionId: "tap",
          notification
        };
        this.notifyListeners("localNotificationActionPerformed", data);
      }
      onShow(notification) {
        this.notifyListeners("localNotificationReceived", notification);
      }
    };
  }
});

// src/main.js
init_db();

// src/charts.js
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    const rad = Math.min(Array.isArray(r) ? r[0] : r, w / 2, h / 2);
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}
function palette() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    accent: v("--accent", "#5b8cff"),
    green: v("--green", "#34d399"),
    red: v("--red", "#fb7185"),
    orange: v("--orange", "#fbbf24"),
    muted: v("--muted", "#6f7b8d"),
    text: v("--text", "#eef2f8"),
    grid: v("--line-strong", "rgba(148,163,184,0.25)")
  };
}
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(rect.width, 10);
  const h = Math.max(rect.height, 10);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}
function fmtShort(n) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(Math.round(n));
}
function drawBarChart(canvas, data) {
  const P = palette();
  const { ctx, w, h } = setupCanvas(canvas);
  const pad = { top: 16, right: 8, bottom: 26, left: 40 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => Math.max(d.income || 0, d.expenses || 0, d.paid || 0)));
  ctx.strokeStyle = P.grid;
  ctx.fillStyle = P.muted;
  ctx.font = "10px system-ui, sans-serif";
  ctx.lineWidth = 1;
  const lines = 4;
  for (let i = 0; i <= lines; i++) {
    const y = pad.top + plotH * i / lines;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    const val = max - max * i / lines;
    ctx.fillText(fmtShort(val), 4, y + 3);
  }
  const groupW = plotW / data.length;
  const barW = Math.min(9, groupW / 4.2);
  const gap = 2;
  data.forEach((d, i) => {
    const cx = pad.left + groupW * i + groupW / 2;
    const bars = [
      { v: d.income || 0, color: P.green, off: -(barW + gap) },
      { v: d.expenses || 0, color: P.orange, off: 0 },
      { v: d.paid || 0, color: P.red, off: barW + gap }
    ];
    for (const b of bars) {
      const bh = b.v / max * plotH;
      if (bh <= 0) continue;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(cx + b.off - barW / 2, pad.top + plotH - bh, barW, bh, 2);
      ctx.fill();
    }
    ctx.fillStyle = P.muted;
    ctx.textAlign = "center";
    ctx.fillText(d.label, cx, h - 8);
    ctx.textAlign = "left";
  });
}
function drawDonut(canvas, { paid, pending }) {
  const P = palette();
  const { ctx, w, h } = setupCanvas(canvas);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 8;
  const total = paid + pending;
  const start = -Math.PI / 2;
  if (total <= 0) {
    ctx.strokeStyle = P.grid;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = P.muted;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sin deudas", cx, cy + 4);
    return;
  }
  const paidAngle = paid / total * Math.PI * 2;
  ctx.lineWidth = 14;
  ctx.lineCap = "butt";
  ctx.strokeStyle = P.green;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + paidAngle);
  ctx.stroke();
  ctx.strokeStyle = P.red;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start + paidAngle, start + Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = P.text;
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(Math.round(paid / total * 100) + "%", cx, cy - 6);
  ctx.fillStyle = P.muted;
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("pagado", cx, cy + 12);
  ctx.textBaseline = "alphabetic";
}

// src/backup.js
init_esm();

// node_modules/@capacitor/share/dist/esm/index.js
init_dist();
var Share = registerPlugin("Share", {
  web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.ShareWeb())
});

// src/backup.js
init_store();
init_db();
function stamp() {
  const d = /* @__PURE__ */ new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2e3);
}
async function saveBytes(filename, bytes, mime) {
  if (isNative) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      directory: Directory.Cache,
      data: bytesToBase64(bytes),
      recursive: true
    });
    try {
      await Share.share({
        title: filename,
        url: uri,
        dialogTitle: "Guardar o compartir respaldo"
      });
    } catch (e) {
      return `Cache/${filename}`;
    }
    return filename;
  }
  downloadBlob(filename, new Blob([bytes], { type: mime }));
  return filename;
}
async function exportSqlite() {
  const bytes = exportBytes();
  const name = `mis-finanzas-${stamp()}.sqlite`;
  return saveBytes(name, bytes, "application/x-sqlite3");
}
function exportJsonData() {
  const debts = listDebts().map((d) => ({ ...d, payments: listPayments(d.id) }));
  return {
    app: "mis-finanzas",
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    settings: { currency: getSetting("currency", "$"), reminderDays: getSetting("reminderDays", "7"), debtFirstOnly: getSetting("debt_first_only", "0") === "1" },
    incomes: listIncomes(),
    expenses: listExpenses(),
    debts,
    notes: listNotes(),
    budgets: listBudgets(),
    incomeCategories: listIncomeCategories().map((c) => c.name),
    recurring: listRecurring(),
    goals: listGoals()
  };
}
function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csvData() {
  const rows = [["tipo", "fecha", "descripcion", "categoria", "monto", "estado"]];
  listIncomes().forEach(
    (i) => rows.push(["Ingreso", i.date, i.description || "", i.category || "", Number(i.amount), ""])
  );
  listExpenses().forEach(
    (e) => rows.push(["Gasto", e.date, e.description || "", e.category || "", Number(e.amount), ""])
  );
  listDebts().forEach(
    (d) => rows.push([
      "Deuda",
      d.due_date || "",
      d.name || "",
      d.plan_id ? `Cuota ${d.installment_no}/${d.installments}` : "",
      Number(d.amount),
      Number(d.paid) > 0 ? "Pagado " + Number(d.paid) : "Pendiente"
    ])
  );
  listDebts().forEach(
    (d) => listPayments(d.id).forEach((p) => rows.push(["Pago", p.date, d.name || "", "", Number(p.amount), ""]))
  );
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
async function exportCsv() {
  const bytes = new TextEncoder().encode("\uFEFF" + csvData());
  const name = `mis-finanzas-${stamp()}.csv`;
  return saveBytes(name, bytes, "text/csv");
}
async function exportJson() {
  const data = exportJsonData();
  const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2));
  const name = `mis-finanzas-${stamp()}.json`;
  return saveBytes(name, bytes, "application/json");
}
function parseJson(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== "mis-finanzas") throw new Error("Archivo JSON no v\xE1lido");
  return data;
}
async function importFile(file) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".sqlite") || name.endsWith(".db")) {
    const buf = new Uint8Array(await file.arrayBuffer());
    replaceWithBytes(buf);
    return "sqlite";
  }
  const text = await file.text();
  const data = parseJson(text);
  await loadJsonData(data);
  return "json";
}

// src/reminders.js
init_dist();

// node_modules/@capacitor/local-notifications/dist/esm/index.js
init_dist();

// node_modules/@capacitor/local-notifications/dist/esm/definitions.js
var Weekday;
(function(Weekday2) {
  Weekday2[Weekday2["Sunday"] = 1] = "Sunday";
  Weekday2[Weekday2["Monday"] = 2] = "Monday";
  Weekday2[Weekday2["Tuesday"] = 3] = "Tuesday";
  Weekday2[Weekday2["Wednesday"] = 4] = "Wednesday";
  Weekday2[Weekday2["Thursday"] = 5] = "Thursday";
  Weekday2[Weekday2["Friday"] = 6] = "Friday";
  Weekday2[Weekday2["Saturday"] = 7] = "Saturday";
})(Weekday || (Weekday = {}));

// node_modules/@capacitor/local-notifications/dist/esm/index.js
var LocalNotifications = registerPlugin("LocalNotifications", {
  web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.LocalNotificationsWeb())
});

// src/reminders.js
init_store();
init_db();
async function ensureNotificationPermission() {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === "granted") return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch (e) {
    return false;
  }
}
async function refreshNotifications(settings = {}) {
  if (!isNative) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    const debts = upcomingDebts(settings.reminderDays || 7).filter((d) => !d.overdue);
    const notifications = debts.map((d) => ({
      id: 1e3 + d.id % 1e5,
      title: "Pago pr\xF3ximo: " + d.name,
      body: `Vence el ${d.due_date}. Restan ${d.remaining.toFixed(2)}`,
      schedule: { at: /* @__PURE__ */ new Date(d.due_date + "T09:00:00"), allowWhileIdle: true }
    }));
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.warn("No se pudieron programar notificaciones", e);
  }
}

// src/main.js
init_store();
var state = {
  tab: "summary",
  currency: "$",
  reminderDays: 7,
  debtFirstOnly: false,
  theme: "system",
  palette: "blue",
  installPrompt: null,
  savingsOpen: false,
  filters: {
    incomes: { q: "", month: "", cat: "" },
    expenses: { q: "", month: "", cat: "" },
    debts: { q: "", month: "" }
  },
  group: { incomes: true, expenses: true, debts: false }
};
var THEME_KEY = "mf-theme";
var PALETTE_KEY = "mf-palette";
var expandedPlans = /* @__PURE__ */ new Set();
var savingsCalc = { method: "", income: "" };
var PALETTES = [
  { key: "blue", label: "Azul", color: "#5b8cff" },
  { key: "green", label: "Verde", color: "#34d399" },
  { key: "purple", label: "Morado", color: "#a78bfa" },
  { key: "yellow", label: "Amarillo", color: "#f5c451" },
  { key: "red", label: "Rojo", color: "#fb7185" }
];
var SAVINGS_METHODS = [
  { key: "50-30-20", name: "50/30/20", desc: "50% necesidades \xB7 30% gustos \xB7 20% ahorro", parts: [
    { label: "Necesidades", pct: 50 },
    { label: "Gustos", pct: 30 },
    { label: "Ahorro / deuda", pct: 20, save: true }
  ] },
  { key: "70-20-10", name: "70/20/10", desc: "70% gastos \xB7 20% ahorro \xB7 10% deuda extra", parts: [
    { label: "Gastos", pct: 70 },
    { label: "Ahorro", pct: 20, save: true },
    { label: "Deuda extra", pct: 10 }
  ] },
  { key: "80-20", name: "80/20 (p\xE1gate primero)", desc: "80% gastos \xB7 20% ahorro, primero p\xE1gate a ti", parts: [
    { label: "Gastos", pct: 80 },
    { label: "Ahorro", pct: 20, save: true }
  ] },
  { key: "60-40", name: "60/40", desc: "60% gastos fijos \xB7 40% ahorro, deuda y ocio", parts: [
    { label: "Gastos fijos", pct: 60 },
    { label: "Ahorro", pct: 20, save: true },
    { label: "Deuda", pct: 10 },
    { label: "Ocio", pct: 10 }
  ] },
  { key: "3-cuentas", name: "3 cuentas", desc: "Gastos, ahorro y gustos en cuentas separadas", parts: [
    { label: "Gastos", pct: 60 },
    { label: "Ahorro", pct: 25, save: true },
    { label: "Gustos", pct: 15 }
  ] },
  { key: "6-frascos", name: "6 frascos (Harvey)", desc: "Seis frascos: paga, ahorra, invierte, aprende, disfruta y dona", parts: [
    { label: "Necesidades", pct: 55 },
    { label: "Ahorro", pct: 10, save: true },
    { label: "Inversi\xF3n", pct: 10, save: true },
    { label: "Educaci\xF3n", pct: 10, save: true },
    { label: "Ocio", pct: 10 },
    { label: "Donaciones", pct: 5 }
  ] },
  { key: "sobres", name: "M\xE9todo de sobres", desc: "Reparte tu ingreso en sobres por tipo de gasto", parts: [
    { label: "Vivienda", pct: 30 },
    { label: "Comida", pct: 15 },
    { label: "Transporte", pct: 10 },
    { label: "Servicios", pct: 10 },
    { label: "Deudas", pct: 15 },
    { label: "Ahorro", pct: 20, save: true }
  ] },
  { key: "kakeibo", name: "Kakeibo", desc: "Supervivencia, ocio, cultura, extras y ahorro (japon\xE9s)", parts: [
    { label: "Supervivencia", pct: 55 },
    { label: "Ocio", pct: 15 },
    { label: "Cultura", pct: 10 },
    { label: "Imprevistos", pct: 10 },
    { label: "Ahorro", pct: 10, save: true }
  ] }
];
function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function resolvedTheme(pref) {
  return pref === "system" ? prefersDark() ? "dark" : "light" : pref;
}
function applyPalette() {
  document.documentElement.dataset.palette = state.palette || "blue";
}
function applyTheme() {
  const t = resolvedTheme(state.theme);
  document.documentElement.dataset.theme = t;
  applyPalette();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    meta.setAttribute("content", bg || (t === "dark" ? "#0b0f16" : "#f3f5fa"));
  }
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = t === "dark" ? "\u{1F319}" : "\u2600\uFE0F";
    btn.title = state.theme === "system" ? "Tema: sistema" : `Tema: ${state.theme === "dark" ? "oscuro" : "claro"}`;
  }
  const sel = document.getElementById("set-theme");
  if (sel) sel.value = state.theme;
}
function setThemePref(pref) {
  state.theme = pref;
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch (e) {
  }
  try {
    setSetting("theme", pref);
  } catch (e) {
  }
  applyTheme();
}
function setPalette(key) {
  state.palette = key || "blue";
  try {
    localStorage.setItem(PALETTE_KEY, state.palette);
  } catch (e) {
  }
  try {
    setSetting("palette", state.palette);
  } catch (e) {
  }
  applyPalette();
}
function runRipple(apply, x, y) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !document.startViewTransition) {
    apply();
    return;
  }
  const root = document.documentElement;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const feather = Math.max(120, Math.min(W, H) * 0.32);
  const corner = Math.hypot(Math.max(x, W - x), Math.max(y, H - y));
  const endRadius = corner + feather + 48;
  root.style.setProperty("--mf-x", `${x}px`);
  root.style.setProperty("--mf-y", `${y}px`);
  root.style.setProperty("--mf-feather", `${feather}px`);
  const transition = document.startViewTransition(() => apply());
  transition.ready.then(() => {
    root.animate(
      { "--mf-r": ["0px", `${endRadius}px`] },
      {
        duration: 950,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  }).catch(() => {
  });
}
function themeRipple(pref, x, y) {
  runRipple(() => setThemePref(pref), x, y);
}
function toggleTheme(sourceEl, x, y) {
  const pref = resolvedTheme(state.theme) === "dark" ? "light" : "dark";
  let px = x;
  let py = y;
  if ((!px || !py) && sourceEl) {
    const r = sourceEl.getBoundingClientRect();
    px = r.left + r.width / 2;
    py = r.top + r.height / 2;
  }
  if (sourceEl) {
    sourceEl.classList.remove("pulse");
    void sourceEl.offsetWidth;
    sourceEl.classList.add("pulse");
    setTimeout(() => sourceEl.classList.remove("pulse"), 900);
  }
  themeRipple(pref, px || window.innerWidth / 2, py || 60);
}
var view = document.getElementById("view");
var headerBalance = document.getElementById("header-balance");
var title = document.getElementById("header-title");
function currency() {
  return state.currency || "$";
}
function fmt(n) {
  const num = Number(n) || 0;
  return currency() + num.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseAmount(v) {
  if (v == null) return NaN;
  return parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}
function fmtDate(d) {
  if (!d) return "Sin fecha";
  const dt = /* @__PURE__ */ new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}
function daysUntil(d) {
  const a = /* @__PURE__ */ new Date(d + "T00:00:00");
  const b = /* @__PURE__ */ new Date(today() + "T00:00:00");
  return Math.round((a - b) / 864e5);
}
function addDaysISO(dateStr, n) {
  const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
var sheet = document.getElementById("sheet");
var sheetTitle = document.getElementById("sheet-title");
var sheetBody = document.getElementById("sheet-body");
var sheetForm = document.getElementById("sheet-form");
function openSheet({ title: t, fields, submitLabel = "Guardar", onSubmit, extraHtml = "" }) {
  sheetTitle.textContent = t;
  sheetBody.innerHTML = fields.map(renderField).join("") + extraHtml;
  sheetForm.querySelector(".sheet-submit").textContent = submitLabel;
  sheet.classList.add("open");
  let busy = false;
  sheetForm.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const submitBtn = sheetForm.querySelector(".sheet-submit");
    if (submitBtn) submitBtn.disabled = true;
    try {
      const data = {};
      for (const f of fields) {
        const el = sheetForm.querySelector(`[name="${f.name}"]`);
        data[f.name] = el ? el.value : "";
      }
      await onSubmit(data);
      closeSheet();
      await rerender();
    } finally {
      busy = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  };
  const first = sheetForm.querySelector("input, textarea, select");
  if (first && !isNative) setTimeout(() => first.focus(), 200);
}
function renderField(f) {
  const val = f.value == null ? "" : f.value;
  if (f.type === "textarea") {
    return `<label class="field"><span>${esc(f.label)}</span><textarea name="${f.name}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || "")}">${esc(val)}</textarea></label>`;
  }
  if (f.type === "select") {
    return `<label class="field"><span>${esc(f.label)}</span><select name="${f.name}">${f.options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(val) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select></label>`;
  }
  return `<label class="field"><span>${esc(f.label)}</span><input type="${f.type}" name="${f.name}" value="${esc(val)}" ${f.required ? "required" : ""} ${f.step ? `step="${f.step}"` : ""} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""} inputmode="${f.type === "number" ? "decimal" : "text"}" /></label>`;
}
function closeSheet() {
  sheet.classList.remove("open");
}
sheet.addEventListener("click", (e) => {
  if (e.target === sheet || e.target.dataset.close !== void 0) closeSheet();
});
var toastTimer = null;
var recurringCtx = null;
function hideToast() {
  const t = document.getElementById("toast");
  if (t) t.classList.remove("show");
}
function showToast(message, actionLabel, onAction, duration = 5e3) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.innerHTML = "";
  const span = document.createElement("span");
  span.textContent = message;
  t.appendChild(span);
  if (actionLabel) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "toast-action";
    b.textContent = actionLabel;
    b.addEventListener("click", () => {
      hideToast();
      if (onAction) onAction();
    });
    t.appendChild(b);
  }
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, duration);
}
var notifTimer = null;
function scheduleNotifs() {
  if (!isNative) return;
  clearTimeout(notifTimer);
  notifTimer = setTimeout(
    () => refreshNotifications({ reminderDays: state.reminderDays }),
    400
  );
}
async function rerender() {
  headerBalance.textContent = fmt(getSummary().balance);
  if (state.tab === "summary") await renderSummary();
  else if (state.tab === "incomes") renderIncomes();
  else if (state.tab === "expenses") renderExpenses();
  else if (state.tab === "debts") renderDebts();
  else if (state.tab === "goals") renderGoals();
  else if (state.tab === "notes") renderNotes();
  else if (state.tab === "settings") renderSettings();
  document.querySelectorAll(".nav-btn").forEach(
    (b) => b.classList.toggle("active", b.dataset.tab === state.tab)
  );
  document.getElementById("tabbar").dataset.tab = state.tab;
  scheduleNotifs();
}
function setTab(tab) {
  state.tab = tab;
  rerender();
}
async function renderSummary() {
  const s = getSummary();
  const upcoming = upcomingDebts(state.reminderDays);
  const cats = expenseCategoryTotals();
  title.textContent = "Resumen";
  view.innerHTML = `
    <section class="hero ${s.balance < 0 ? "neg" : "pos"}">
      <span class="hero-label">Disponible</span>
      <strong class="hero-value">${fmt(s.balance)}</strong>
      <div class="hero-split">
        <div><span>Ingresos</span><b class="green">${fmt(s.totalIncome)}</b></div>
        <div><span>Gastos</span><b class="red">${fmt(s.totalExpenses)}</b></div>
        <div><span>Deuda total</span><b class="orange">${fmt(s.totalDebt)}</b></div>
      </div>
    </section>

    <section class="cards">
      <div class="stat"><span>Deuda pendiente</span><b class="red">${fmt(s.pending)}</b></div>
      <div class="stat"><span>Deuda total</span><b>${fmt(s.totalDebt)}</b></div>
      <div class="stat"><span>Gastos totales</span><b class="orange">${fmt(s.totalExpenses)}</b></div>
      <div class="stat"><span>Registros</span><b>${s.countIncome + s.countExpenses + s.countDebts}</b></div>
    </section>

    <section class="panel">
      <h3>Ingresos vs salidas (6 meses)</h3>
      <div class="legend"><i class="dot green"></i>Ingresos <i class="dot orange"></i>Gastos <i class="dot red"></i>Pagos</div>
      <canvas id="chart-months" class="chart" height="180"></canvas>
    </section>

    <section class="panel two">
      <div>
        <h3>Estado de deudas</h3>
        <canvas id="chart-donut" class="donut" height="170"></canvas>
      </div>
      <div>
        <h3>\xBFEn qu\xE9 gast\xE9?</h3>
        <ul class="cat-list">
          ${cats.length ? cats.slice(0, 6).map(
    (c) => `<li><span>${esc(c.category)}</span><b>${fmt(c.total)}</b></li>`
  ).join("") : '<li class="muted">Sin gastos a\xFAn</li>'}
        </ul>
      </div>
    </section>

    <section class="panel">
      <h3>Pr\xF3ximos vencimientos</h3>
      ${upcoming.length ? `<ul class="reminders">${upcoming.map((d) => {
    const du = daysUntil(d.due_date);
    const label = d.overdue ? "Vencida" : du === 0 ? "Hoy" : `En ${du} d`;
    return `<li class="${d.overdue ? "overdue" : ""}">
                  <div><b>${esc(d.name)}</b><span>${fmtDate(d.due_date)}</span></div>
                  <div class="right"><b>${fmt(d.remaining)}</b><span class="pill">${label}</span></div>
                </li>`;
  }).join("")}</ul>` : '<p class="muted">Sin pagos pr\xF3ximos. \u{1F389}</p>'}
    </section>
  `;
  requestAnimationFrame(() => {
    const mc = document.getElementById("chart-months");
    if (mc) drawBarChart(mc, monthlyTotals(6));
    const dc = document.getElementById("chart-donut");
    if (dc) drawDonut(dc, { paid: s.totalPaid, pending: s.pending });
  });
}
function renderExpenses() {
  title.textContent = "Gastos";
  const budgets = budgetStatus(currentMonthKey());
  const monthName = (/* @__PURE__ */ new Date()).toLocaleDateString("es", { month: "long" });
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Total gastado</span><b class="red" id="list-total">${fmt(0)}</b></div>
      <div class="toolbar-actions">
        <button class="btn ghost" data-action="budgets-open">Presupuestos</button>
        <button class="btn primary" data-action="expense-new">+ Gasto</button>
      </div>
    </div>

    ${budgets.length ? `<section class="panel">
            <h3>Presupuestos \xB7 ${monthName}</h3>
            <ul class="budget-list">
              ${budgets.map((b) => {
    const cls = b.pct >= 100 ? "danger" : b.pct >= 80 ? "warn" : "";
    const label = b.remaining >= 0 ? `Quedan ${fmt(b.remaining)}` : `Excedido ${fmt(-b.remaining)}`;
    return `<li>
                    <div class="budget-top">
                      <span>${esc(b.category)}</span>
                      <b class="${b.pct >= 100 ? "red" : ""}">${fmt(b.spent)} <i class="muted">/ ${fmt(b.budget)}</i></b>
                    </div>
                    <div class="progress small-progress"><i class="${cls}" style="width:${b.pct}%"></i></div>
                    <span class="budget-note ${b.pct >= 100 ? "red" : "muted"}">${label}</span>
                  </li>`;
  }).join("")}
            </ul>
          </section>` : ""}

    ${filterBar("expenses", true)}
    <div id="list-area"></div>
  `;
  wireFilters("expenses");
  renderExpenseList();
}
function expenseItem(r) {
  return `<li>
    <div class="li-main">
      <b>${esc(r.description || "Gasto")}</b>
      <span>${r.category ? esc(r.category) + " \xB7 " : ""}${fmtDate(r.date)}</span>
    </div>
    <div class="li-right">
      <b class="red">-${fmt(r.amount)}</b>
      <div class="row-actions">
        <button data-action="expense-clone" data-id="${r.id}">Clonar</button>
        <button data-action="expense-edit" data-id="${r.id}">Editar</button>
        <button data-action="expense-del" data-id="${r.id}" class="danger">Borrar</button>
      </div>
    </div>
  </li>`;
}
function renderExpenseList() {
  const rows = applyFilters("expenses", listExpenses());
  setListTotal(rows.reduce((a, r) => a + Number(r.amount), 0), "red");
  const area = document.getElementById("list-area");
  if (area) area.innerHTML = listHtml("expenses", rows, expenseItem, (r) => Number(r.amount), "A\xFAn no registras gastos.");
}
function openBudgetsSheet() {
  const existing = listBudgets();
  const spent = listExpenses().reduce((acc, e) => {
    const k = e.category || "Sin categor\xEDa";
    acc[k] = acc[k] || 0;
    return acc;
  }, {});
  const cats = Array.from(
    /* @__PURE__ */ new Set([...existing.map((b) => b.category), ...Object.keys(spent)])
  ).sort((a, b) => a.localeCompare(b));
  const budgetMap = {};
  existing.forEach((b) => budgetMap[b.category] = b.amount);
  const html = `
    <p class="muted small">L\xEDmite mensual por categor\xEDa. D\xE9jalo vac\xEDo o en 0 para quitarlo.</p>
    <div class="budget-form">
      ${cats.length ? cats.map(
    (c) => `<label class="budget-row"><span>${esc(c)}</span>
          <input type="number" step="0.01" data-cat="${esc(c)}" value="${budgetMap[c] || ""}" placeholder="0" /></label>`
  ).join("") : '<p class="muted small">A\xFAn no hay categor\xEDas de gasto.</p>'}
      <div class="budget-row new">
        <input type="text" id="new-budget-cat" placeholder="Nueva categor\xEDa" />
        <input type="number" step="0.01" id="new-budget-amt" placeholder="L\xEDmite" />
      </div>
    </div>
  `;
  openSheet({
    title: "Presupuestos",
    fields: [],
    extraHtml: html,
    submitLabel: "Guardar",
    onSubmit: () => {
      sheetForm.querySelectorAll("[data-cat]").forEach((input) => {
        setBudget(input.dataset.cat, parseAmount(input.value) || 0);
      });
      const nc = (document.getElementById("new-budget-cat").value || "").trim();
      const na = parseAmount(document.getElementById("new-budget-amt").value) || 0;
      if (nc && na > 0) setBudget(nc, na);
    }
  });
}
function expenseCategoryOptions() {
  const set = /* @__PURE__ */ new Set();
  listBudgets().forEach((b) => b.category && set.add(b.category));
  listExpenses().forEach((e) => e.category && set.add(e.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
function expenseFields(row = {}) {
  const cats = expenseCategoryOptions();
  const categoryField = cats.length ? {
    name: "category",
    label: "Categor\xEDa",
    type: "select",
    value: row.category || "",
    options: [{ value: "", label: "Sin categor\xEDa" }, ...cats.map((c) => ({ value: c, label: c }))]
  } : {
    name: "category",
    label: "Categor\xEDa (crea presupuestos para poder elegirla)",
    type: "text",
    value: row.category,
    placeholder: "Comida, transporte..."
  };
  return [
    { name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", value: row.amount, required: true },
    { name: "description", label: "Descripci\xF3n", type: "text", value: row.description, placeholder: "Supermercado, gasolina..." },
    categoryField,
    { name: "date", label: "Fecha", type: "date", value: row.date || today(), required: true }
  ];
}
function openRecurringList() {
  const rows = listRecurring();
  const html = `
    <button type="button" class="btn primary full" data-action="recurring-new">+ Recurrente</button>
    ${rows.length ? `<ul class="list compact recurring-list">${rows.map(
    (r) => `<li class="${r.active ? "" : "inactive"}">
          <div class="li-main">
            <b>${r.type === "income" ? "+" : "-"}${fmt(r.amount)} \xB7 ${esc(r.description || (r.type === "income" ? "Ingreso" : "Gasto"))}</b>
            <span>${r.type === "income" ? "Ingreso" : "Gasto"}${r.category ? " \xB7 " + esc(r.category) : ""} \xB7 ${recurringScheduleLabel(r)}</span>
            <span class="muted small">Pr\xF3ximo: ${fmtDate(r.next_date)}${r.active ? "" : " \xB7 pausado"}</span>
          </div>
          <div class="row-actions">
            <button data-action="recurring-toggle" data-id="${r.id}">${r.active ? "Pausar" : "Activar"}</button>
            <button data-action="recurring-edit" data-id="${r.id}">Editar</button>
            <button data-action="recurring-del" data-id="${r.id}" class="danger">Borrar</button>
          </div>
        </li>`
  ).join("")}</ul>` : '<p class="muted small">Sin movimientos recurrentes.</p>'}
  `;
  openSheet({ title: "Recurrentes", fields: [], extraHtml: html, submitLabel: "Cerrar", onSubmit: () => {
  } });
}
function recurringScheduleLabel(r) {
  if (r.schedule === "day_last") return `D\xEDa ${r.day_of_month} y \xFAltimo del mes`;
  const n = r.interval_days;
  if (n === 1) return "Diario";
  if (n === 7) return "Semanal";
  if (n === 15) return "Quincenal";
  if (n === 30) return "Mensual";
  return `Cada ${n} d\xEDas`;
}
function openRecurringForm(row = null) {
  const editing = !!row;
  const model = {
    type: editing ? row.type : "expense",
    amount: editing ? row.amount : "",
    description: editing ? row.description : "",
    category: editing ? row.category : "",
    schedule: editing ? row.schedule || "interval" : "interval",
    interval_days: editing ? row.interval_days : 30,
    day_of_month: editing && row.day_of_month ? row.day_of_month : 15,
    next_date: editing ? addDaysISO(row.next_date, -row.interval_days) : today()
  };
  const fieldsFor = () => {
    const f = [
      {
        name: "type",
        label: "Tipo",
        type: "select",
        value: model.type,
        options: [
          { value: "expense", label: "Gasto" },
          { value: "income", label: "Ingreso" }
        ]
      },
      { name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", value: model.amount, required: true },
      { name: "description", label: "Descripci\xF3n", type: "text", value: model.description, placeholder: "Renta, sueldo..." },
      { name: "category", label: "Categor\xEDa", type: "text", value: model.category }
    ];
    if (model.schedule === "day_last") {
      f.push({
        name: "day_of_month",
        label: "D\xEDa del mes (adem\xE1s del \xFAltimo d\xEDa)",
        type: "number",
        value: model.day_of_month,
        required: true
      });
    } else {
      f.push({ name: "interval_days", label: "Cada (d\xEDas)", type: "number", value: model.interval_days, required: true });
      f.push({ name: "next_date", label: "Inicio", type: "date", value: model.next_date, required: true });
    }
    return f;
  };
  const qbtn = (mode, days, label) => {
    const active = model.schedule === mode && (mode !== "interval" || String(model.interval_days) === String(days));
    return `<button type="button" class="btn ghost${active ? " active" : ""}" data-action="recurring-preset" data-mode="${mode}"${days ? ` data-days="${days}"` : ""}>${label}</button>`;
  };
  const extrasHtml = () => `
    <div class="quick-days">
      ${qbtn("interval", 7, "Semanal")}
      ${qbtn("interval", 15, "Quincenal")}
      ${qbtn("interval", 30, "Mensual")}
      ${qbtn("day_last", null, "15 y \xFAltimo")}
    </div>`;
  const capture = () => {
    const g = (n) => {
      const el = sheetForm.querySelector(`[name="${n}"]`);
      return el ? el.value : void 0;
    };
    const map = ["type", "amount", "description", "category", "interval_days", "day_of_month", "next_date"];
    for (const k of map) {
      const v = g(k);
      if (v !== void 0) model[k] = v;
    }
  };
  const render = () => {
    sheetBody.innerHTML = fieldsFor().map(renderField).join("") + extrasHtml();
  };
  recurringCtx = {
    setSchedule: (mode, days, day) => {
      capture();
      model.schedule = mode;
      if (mode === "interval") {
        if (days) model.interval_days = days;
        if (!model.next_date) model.next_date = today();
      } else {
        model.day_of_month = day || 15;
        model.next_date = scheduledOnOrAfter(today(), model.day_of_month);
      }
      render();
    }
  };
  sheetTitle.textContent = editing ? "Editar recurrente" : "Nuevo recurrente";
  sheetForm.querySelector(".sheet-submit").textContent = editing ? "Guardar" : "Crear";
  sheet.classList.add("open");
  render();
  sheetForm.onsubmit = async (e) => {
    e.preventDefault();
    capture();
    const day = Math.max(1, Math.min(parseInt(model.day_of_month, 10) || 15, 31));
    const interval = Math.max(1, parseInt(model.interval_days, 10) || 30);
    const payload = {
      type: model.type,
      amount: parseAmount(model.amount),
      description: model.description,
      category: model.category,
      schedule: model.schedule,
      interval_days: model.schedule === "day_last" ? 30 : interval,
      day_of_month: model.schedule === "day_last" ? day : null,
      next_date: model.schedule === "day_last" ? scheduledOnOrAfter(today(), day) : addDaysISO(model.next_date || today(), interval)
    };
    if (!(payload.amount > 0)) return;
    if (editing) updateRecurring(row.id, { ...payload, active: row.active });
    else addRecurring(payload);
    closeSheet();
    await rerender();
  };
}
function monthLabel(key) {
  if (!key || key === "0000-00") return "Sin fecha";
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  const s = d.toLocaleDateString("es", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function dateKeyOf(r) {
  return (r.date || r.due_date || "").slice(0, 7);
}
function applyFilters(kind, rows) {
  const f = state.filters[kind];
  const q = (f.q || "").trim().toLowerCase();
  return rows.filter((r) => {
    if (q) {
      const hay = `${r.description || ""} ${r.name || ""} ${r.category || ""} ${r.notes || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.month && dateKeyOf(r) !== f.month) return false;
    if (f.cat) {
      const rc = r.category || "Sin categor\xEDa";
      if (rc !== f.cat) return false;
    }
    return true;
  });
}
function filterBar(kind, withCategory) {
  const f = state.filters[kind];
  const rows = kind === "incomes" ? listIncomes() : kind === "expenses" ? listExpenses() : listDebts();
  const months = [...new Set(rows.map(dateKeyOf).filter(Boolean))].sort().reverse();
  const cats = withCategory ? [...new Set(rows.map((r) => r.category || "Sin categor\xEDa"))].sort((a, b) => a.localeCompare(b)) : [];
  return `<div class="filter-bar">
    <input type="search" id="f-q" placeholder="Buscar..." value="${esc(f.q)}" />
    <div class="filter-row">
      <select id="f-month">
        <option value="">Todos los meses</option>
        ${months.map((m) => `<option value="${m}" ${f.month === m ? "selected" : ""}>${monthLabel(m)}</option>`).join("")}
      </select>
      ${withCategory ? `<select id="f-cat">
               <option value="">Todas las categor\xEDas</option>
               ${cats.map((c) => `<option value="${esc(c)}" ${f.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
             </select>` : ""}
    </div>
    ${kind === "debts" ? "" : `<button type="button" class="btn ghost group-btn" data-action="list-group-toggle" data-kind="${kind}">
             ${state.group[kind] ? "Vista: por mes" : "Vista: lista"}
           </button>`}
  </div>`;
}
function wireFilters(kind) {
  const q = document.getElementById("f-q");
  if (q) q.addEventListener("input", () => {
    state.filters[kind].q = q.value;
    renderListFor(kind);
  });
  const m = document.getElementById("f-month");
  if (m) m.addEventListener("change", () => {
    state.filters[kind].month = m.value;
    renderListFor(kind);
  });
  const c = document.getElementById("f-cat");
  if (c) c.addEventListener("change", () => {
    state.filters[kind].cat = c.value;
    renderListFor(kind);
  });
}
function renderListFor(kind) {
  if (kind === "incomes") renderIncomeList();
  else if (kind === "expenses") renderExpenseList();
  else if (kind === "debts") renderDebtList();
}
function listHtml(kind, rows, renderItem, amountOf, emptyMsg) {
  if (!rows.length) return empty(emptyMsg);
  if (!state.group[kind]) return `<ul class="list">${rows.map(renderItem).join("")}</ul>`;
  const groups = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const k = dateKeyOf(r) || "0000-00";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  return [...groups.keys()].sort().reverse().map((k) => {
    const items = groups.get(k);
    const sub = items.reduce((a, r) => a + amountOf(r), 0);
    return `<section class="month-group">
        <div class="month-head"><span>${monthLabel(k)}</span><b>${fmt(sub)}</b></div>
        <ul class="list">${items.map(renderItem).join("")}</ul>
      </section>`;
  }).join("");
}
function setListTotal(v, cls) {
  const t = document.getElementById("list-total");
  if (t) {
    t.textContent = fmt(v);
    if (cls) t.className = cls;
  }
}
function renderIncomes() {
  title.textContent = "Ingresos";
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Total</span><b class="green" id="list-total">${fmt(0)}</b></div>
      <div class="toolbar-actions">
        <button class="btn ghost" data-action="income-categories-open">Categor\xEDas</button>
        <button class="btn primary" data-action="income-new">+ Ingreso</button>
      </div>
    </div>
    ${filterBar("incomes", true)}
    <div id="list-area"></div>
  `;
  wireFilters("incomes");
  renderIncomeList();
}
function incomeItem(r) {
  return `<li>
    <div class="li-main">
      <b>${esc(r.description || "Ingreso")}</b>
      <span>${r.category ? esc(r.category) + " \xB7 " : ""}${fmtDate(r.date)}</span>
    </div>
    <div class="li-right">
      <b class="green">+${fmt(r.amount)}</b>
      <div class="row-actions">
        <button data-action="income-edit" data-id="${r.id}">Editar</button>
        <button data-action="income-del" data-id="${r.id}" class="danger">Borrar</button>
      </div>
    </div>
  </li>`;
}
function renderIncomeList() {
  const rows = applyFilters("incomes", listIncomes());
  setListTotal(rows.reduce((a, r) => a + Number(r.amount), 0), "green");
  const area = document.getElementById("list-area");
  if (area) area.innerHTML = listHtml("incomes", rows, incomeItem, (r) => Number(r.amount), "A\xFAn no registras ingresos.");
}
function incomeCategoryOptions() {
  const set = /* @__PURE__ */ new Set();
  listIncomeCategories().forEach((c) => set.add(c.name));
  listIncomes().forEach((i) => i.category && set.add(i.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
function incomeFields(row = {}) {
  const cats = incomeCategoryOptions();
  const categoryField = cats.length ? {
    name: "category",
    label: "Categor\xEDa",
    type: "select",
    value: row.category || "",
    options: [{ value: "", label: "Sin categor\xEDa" }, ...cats.map((c) => ({ value: c, label: c }))]
  } : {
    name: "category",
    label: "Categor\xEDa (crea categor\xEDas para poder elegirla)",
    type: "text",
    value: row.category,
    placeholder: "Trabajo, extra..."
  };
  return [
    { name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", value: row.amount, required: true },
    { name: "description", label: "Descripci\xF3n", type: "text", value: row.description, placeholder: "Salario, venta..." },
    categoryField,
    { name: "date", label: "Fecha", type: "date", value: row.date || today(), required: true }
  ];
}
function openIncomeCategoriesSheet() {
  const cats = listIncomeCategories();
  const html = `
    <p class="muted small">Categor\xEDas disponibles al registrar un ingreso.</p>
    <div class="budget-form">
      ${cats.length ? cats.map(
    (c) => `<div class="budget-row"><span>${esc(c.name)}</span>
        <button type="button" class="btn ghost danger" data-action="income-cat-del" data-name="${esc(c.name)}">Quitar</button></div>`
  ).join("") : '<p class="muted small">A\xFAn no hay categor\xEDas.</p>'}
      <div class="budget-row new">
        <input type="text" id="new-income-cat" placeholder="Nueva categor\xEDa" />
      </div>
    </div>
  `;
  openSheet({
    title: "Categor\xEDas de ingresos",
    fields: [],
    extraHtml: html,
    submitLabel: "Agregar",
    onSubmit: () => {
      const name = (document.getElementById("new-income-cat").value || "").trim();
      if (name) addIncomeCategory(name);
    }
  });
}
function debtRemaining(d) {
  return Math.max(Number(d.amount) - Number(d.paid), 0);
}
function debtDone(d) {
  return debtRemaining(d) <= 1e-4;
}
function debtPill(d) {
  if (debtDone(d)) return `<span class="pill ok">Pagada</span>`;
  if (!d.due_date) return "";
  const du = daysUntil(d.due_date);
  if (du < 0) return `<span class="pill danger">Vencida ${fmtDate(d.due_date)}</span>`;
  if (du <= state.reminderDays) return `<span class="pill warn">En ${du} d</span>`;
  return `<span class="pill">${fmtDate(d.due_date)}</span>`;
}
function dueSortKey(d) {
  return !debtDone(d) && d.due_date ? d.due_date : "9999-99-99";
}
function debtSingleCard(d) {
  const paid = Number(d.paid);
  const pct = d.amount > 0 ? Math.min(100, paid / d.amount * 100) : 0;
  const remaining = debtRemaining(d);
  const done = debtDone(d);
  return `<article class="debt ${done ? "done" : ""}">
    <div class="debt-top">
      <div><b>${esc(d.name)}</b> ${debtPill(d)}</div>
      <b class="red">${fmt(remaining)}</b>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="debt-meta"><span>${fmt(paid)} de ${fmt(d.amount)}</span><span>${pct.toFixed(0)}%</span></div>
    <div class="debt-actions">
      <button class="btn ghost" data-action="debt-pay" data-id="${d.id}">+ Pago</button>
      ${!done ? `<button class="btn ghost" data-action="debt-settle" data-id="${d.id}">Liquidar</button>` : ""}
      <button class="btn ghost" data-action="debt-clone" data-id="${d.id}">Clonar</button>
      <button class="btn ghost" data-action="debt-history" data-id="${d.id}">Historial</button>
      <button class="btn ghost" data-action="debt-edit" data-id="${d.id}">Editar</button>
      <button class="btn ghost danger" data-action="debt-del" data-id="${d.id}">Borrar</button>
    </div>
  </article>`;
}
function debtCuotaRow(c) {
  const paid = Number(c.paid);
  const pct = c.amount > 0 ? Math.min(100, paid / c.amount * 100) : 0;
  const remaining = debtRemaining(c);
  const done = debtDone(c);
  return `<div class="plan-cuota ${done ? "done" : ""}">
    <div class="debt-top">
      <div><b>Cuota ${c.installment_no}/${c.installments}</b> ${debtPill(c)}</div>
      <b class="red">${fmt(remaining)}</b>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="debt-meta"><span>${fmt(paid)} de ${fmt(c.amount)}</span></div>
    <div class="debt-actions">
      <button class="btn ghost" data-action="debt-pay" data-id="${c.id}">+ Pago</button>
      ${!done ? `<button class="btn ghost" data-action="debt-settle" data-id="${c.id}">Liquidar</button>` : ""}
      <button class="btn ghost" data-action="debt-history" data-id="${c.id}">Historial</button>
      <button class="btn ghost" data-action="debt-edit" data-id="${c.id}">Editar</button>
      <button class="btn ghost danger" data-action="debt-del" data-id="${c.id}">Borrar</button>
    </div>
  </div>`;
}
function debtPlanCard(item) {
  const { planId, cuotas, next, filtered } = item;
  const totalAmount = cuotas.reduce((a, c) => a + Number(c.amount), 0);
  const totalPaid = cuotas.reduce((a, c) => a + Number(c.paid), 0);
  const pct = totalAmount > 0 ? Math.min(100, totalPaid / totalAmount * 100) : 0;
  const remaining = Math.max(totalAmount - totalPaid, 0);
  const doneCount = cuotas.filter(debtDone).length;
  const allDone = doneCount === cuotas.length;
  const overdue = cuotas.some((c) => !debtDone(c) && c.due_date && daysUntil(c.due_date) < 0);
  const expanded = expandedPlans.has(planId);
  return `<article class="debt plan ${allDone ? "done" : ""}">
    <div class="debt-top">
      <div><b>${esc(cuotas[0].name)}</b> <span class="pill">${cuotas.length} cuota${cuotas.length === 1 ? "" : "s"}${filtered ? " \xB7 mes" : ""}</span> ${overdue ? `<span class="pill danger">Vencida</span>` : next ? debtPill(next) : `<span class="pill ok">Pagada</span>`}</div>
      <b class="red">${fmt(remaining)}</b>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="debt-meta">
      <span>${next ? `Pr\xF3xima: cuota ${next.installment_no} \xB7 ${fmt(next.amount)}${next.due_date ? " \xB7 " + fmtDate(next.due_date) : ""}` : "Plan completado"}</span>
      <span>${doneCount}/${cuotas.length}</span>
    </div>
    <div class="debt-meta"><span>${fmt(totalPaid)} de ${fmt(totalAmount)}</span><span>${pct.toFixed(0)}%</span></div>
    <div class="debt-actions">
      ${next ? `<button class="btn ghost" data-action="debt-pay" data-id="${next.id}">+ Pago</button>` : ""}
      <button class="btn ghost" data-action="plan-toggle" data-plan="${esc(planId)}">${expanded ? "Ocultar cuotas" : `Ver cuotas (${cuotas.length})`}</button>
      <button class="btn ghost" data-action="plan-edit" data-plan="${esc(planId)}">Editar plan</button>
      <button class="btn ghost danger" data-action="plan-del" data-plan="${esc(planId)}">Borrar plan</button>
    </div>
    ${expanded ? `<div class="plan-cuotas">${cuotas.map(debtCuotaRow).join("")}</div>` : ""}
  </article>`;
}
function debtItems() {
  const rows = listDebts();
  const singles = [];
  const plansMap = /* @__PURE__ */ new Map();
  for (const d of rows) {
    if (d.plan_id) {
      if (!plansMap.has(d.plan_id)) plansMap.set(d.plan_id, []);
      plansMap.get(d.plan_id).push(d);
    } else {
      singles.push(d);
    }
  }
  const items = singles.map((d) => ({ kind: "single", d, key: dueSortKey(d) }));
  for (const [planId, cuotas] of plansMap) {
    cuotas.sort((a, b) => a.installment_no - b.installment_no);
    const next = cuotas.filter((c) => !debtDone(c)).sort((a, b) => a.due_date < b.due_date ? -1 : 1)[0] || null;
    items.push({ kind: "plan", planId, cuotas, next, key: next ? dueSortKey(next) : "9999-99-99" });
  }
  return items.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}
function itemRemaining(item) {
  if (item.kind === "single") return debtRemaining(item.d);
  return item.cuotas.reduce((a, c) => a + debtRemaining(c), 0);
}
function filterDebtItems(items) {
  const f = state.filters.debts;
  const q = (f.q || "").trim().toLowerCase();
  const out = [];
  for (const item of items) {
    if (item.kind === "single") {
      const d = item.d;
      if (q && !`${d.name || ""} ${d.notes || ""}`.toLowerCase().includes(q)) continue;
      if (f.month && (d.due_date || "").slice(0, 7) !== f.month) continue;
      out.push(item);
    } else {
      if (q && !item.cuotas.some((d) => `${d.name || ""} ${d.notes || ""}`.toLowerCase().includes(q))) continue;
      let cuotas = item.cuotas;
      if (f.month) {
        cuotas = cuotas.filter((c) => (c.due_date || "").slice(0, 7) === f.month);
        if (!cuotas.length) continue;
      }
      const next = cuotas.filter((c) => !debtDone(c)).sort((a, b) => a.due_date < b.due_date ? -1 : 1)[0] || null;
      out.push({ ...item, cuotas, next, filtered: !!f.month });
    }
  }
  return out;
}
function renderDebts() {
  title.textContent = "Deudas";
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Pendiente</span><b class="red" id="list-total">${fmt(0)}</b></div>
      <button class="btn primary" data-action="debt-new">+ Deuda</button>
    </div>
    ${filterBar("debts", false)}
    <div id="list-area"></div>
  `;
  wireFilters("debts");
  renderDebtList();
}
function renderDebtList() {
  const items = filterDebtItems(debtItems());
  setListTotal(items.reduce((a, it) => a + itemRemaining(it), 0), "red");
  const area = document.getElementById("list-area");
  if (!area) return;
  area.innerHTML = items.length ? `<div class="debt-list">${items.map((it) => it.kind === "plan" ? debtPlanCard(it) : debtSingleCard(it.d)).join("")}</div>` : empty("Sin deudas registradas. \xA1Bien ah\xED!");
}
function debtFields(row = {}) {
  return [
    { name: "name", label: "Nombre / Acreedor", type: "text", value: row.name, required: true, placeholder: "Tarjeta, pr\xE9stamo..." },
    { name: "amount", label: `Monto total (${currency()})`, type: "number", step: "0.01", value: row.amount, required: true },
    { name: "due_date", label: "Fecha de vencimiento", type: "date", value: row.due_date || "" },
    { name: "notes", label: "Notas", type: "textarea", value: row.notes, placeholder: "Inter\xE9s, condiciones..." }
  ];
}
function openDebtForm() {
  const model = {
    name: "",
    amount: "",
    due_date: "",
    notes: "",
    cuotas: false,
    count: 6,
    every_days: 14
  };
  const fieldsFor = () => [
    { name: "name", label: "Nombre / Acreedor", type: "text", value: model.name, required: true, placeholder: "Tarjeta, pr\xE9stamo..." },
    { name: "amount", label: model.cuotas ? `Monto por cuota (${currency()})` : `Monto total (${currency()})`, type: "number", step: "0.01", value: model.amount, required: true },
    { name: "due_date", label: model.cuotas ? "Fecha de la primera cuota" : "Fecha de vencimiento", type: "date", value: model.due_date, required: model.cuotas },
    { name: "notes", label: "Notas", type: "textarea", value: model.notes, placeholder: "Inter\xE9s, condiciones..." }
  ];
  const extrasHtml = () => `
    <label class="switch-row">
      <input type="checkbox" id="debt-cuotas" ${model.cuotas ? "checked" : ""} />
      <span>Deuda en cuotas</span>
    </label>
    ${model.cuotas ? `<div class="grid-2">
             <label class="field"><span>N\xFAmero de cuotas</span><input type="number" id="debt-count" min="1" value="${esc(model.count)}" inputmode="numeric" /></label>
             <label class="field"><span>Cada (d\xEDas)</span><input type="number" id="debt-every" min="1" value="${esc(model.every_days)}" inputmode="numeric" /></label>
           </div>
           <div class="quick-days">
             <button type="button" class="btn ghost" data-debt-every="7">Semanal</button>
             <button type="button" class="btn ghost" data-debt-every="14">Cada 14 d\xEDas</button>
             <button type="button" class="btn ghost" data-debt-every="15">Quincenal</button>
             <button type="button" class="btn ghost" data-debt-every="30">Mensual</button>
           </div>` : ""}`;
  const capture = () => {
    const gn = (n) => {
      const el = sheetForm.querySelector(`[name="${n}"]`);
      return el ? el.value : void 0;
    };
    for (const k of ["name", "amount", "due_date", "notes"]) {
      const v = gn(k);
      if (v !== void 0) model[k] = v;
    }
    const count = document.getElementById("debt-count");
    if (count) model.count = count.value;
    const every = document.getElementById("debt-every");
    if (every) model.every_days = every.value;
  };
  const render = () => {
    sheetBody.innerHTML = fieldsFor().map(renderField).join("") + extrasHtml();
    const chk = document.getElementById("debt-cuotas");
    if (chk)
      chk.addEventListener("change", (e) => {
        capture();
        model.cuotas = e.target.checked;
        render();
      });
    sheetBody.querySelectorAll("[data-debt-every]").forEach(
      (b) => b.addEventListener("click", () => {
        capture();
        model.every_days = b.dataset.debtEvery;
        render();
      })
    );
  };
  sheetTitle.textContent = "Nueva deuda";
  sheetForm.querySelector(".sheet-submit").textContent = "Crear";
  sheet.classList.add("open");
  render();
  sheetForm.onsubmit = async (e) => {
    e.preventDefault();
    capture();
    const amount = parseAmount(model.amount);
    if (!(amount > 0) || !String(model.name).trim()) return;
    if (model.cuotas) {
      if (!model.due_date) return;
      addDebtPlan({
        name: model.name.trim(),
        amount,
        count: parseInt(model.count, 10) || 1,
        every_days: parseInt(model.every_days, 10) || 30,
        due_date: model.due_date,
        notes: model.notes
      });
    } else {
      addDebt({ name: model.name.trim(), amount, due_date: model.due_date || null, notes: model.notes });
    }
    closeSheet();
    await rerender();
  };
}
function daysBetween(a, b) {
  const da = /* @__PURE__ */ new Date(a + "T00:00:00");
  const db2 = /* @__PURE__ */ new Date(b + "T00:00:00");
  return Math.round((db2 - da) / 864e5);
}
function openPlanForm(planId) {
  const cuotas = listDebts().filter((d) => d.plan_id === planId).sort((a, b) => a.installment_no - b.installment_no);
  if (!cuotas.length) return;
  const first = cuotas[0];
  let gap = 30;
  if (cuotas.length > 1 && cuotas[1].due_date && first.due_date) {
    const g = daysBetween(first.due_date, cuotas[1].due_date);
    if (g > 0) gap = g;
  }
  const model = {
    name: first.name || "",
    amount: first.amount || "",
    due_date: first.due_date || "",
    notes: first.notes || "",
    count: cuotas.length,
    every_days: gap
  };
  const fieldsFor = () => [
    { name: "name", label: "Nombre / Acreedor", type: "text", value: model.name, required: true },
    { name: "amount", label: `Monto por cuota (${currency()})`, type: "number", step: "0.01", value: model.amount, required: true },
    { name: "due_date", label: "Fecha de la primera cuota", type: "date", value: model.due_date, required: true },
    { name: "notes", label: "Notas", type: "textarea", value: model.notes }
  ];
  const extrasHtml = () => `
    <div class="grid-2">
      <label class="field"><span>N\xFAmero de cuotas</span><input type="number" id="debt-count" min="1" value="${esc(model.count)}" inputmode="numeric" /></label>
      <label class="field"><span>Cada (d\xEDas)</span><input type="number" id="debt-every" min="1" value="${esc(model.every_days)}" inputmode="numeric" /></label>
    </div>
    <div class="quick-days">
      <button type="button" class="btn ghost" data-debt-every="7">Semanal</button>
      <button type="button" class="btn ghost" data-debt-every="14">Cada 14 d\xEDas</button>
      <button type="button" class="btn ghost" data-debt-every="15">Quincenal</button>
      <button type="button" class="btn ghost" data-debt-every="30">Mensual</button>
    </div>
    <p class="muted small">Se recalcular\xE1n las cuotas (fechas). Los pagos se conservan por n\xFAmero de cuota.</p>`;
  const capture = () => {
    const gn = (n) => {
      const el = sheetForm.querySelector(`[name="${n}"]`);
      return el ? el.value : void 0;
    };
    for (const k of ["name", "amount", "due_date", "notes"]) {
      const v = gn(k);
      if (v !== void 0) model[k] = v;
    }
    const count = document.getElementById("debt-count");
    if (count) model.count = count.value;
    const every = document.getElementById("debt-every");
    if (every) model.every_days = every.value;
  };
  const render = () => {
    sheetBody.innerHTML = fieldsFor().map(renderField).join("") + extrasHtml();
    sheetBody.querySelectorAll("[data-debt-every]").forEach(
      (b) => b.addEventListener("click", () => {
        capture();
        model.every_days = b.dataset.debtEvery;
        render();
      })
    );
  };
  sheetTitle.textContent = "Editar plan de cuotas";
  sheetForm.querySelector(".sheet-submit").textContent = "Guardar";
  sheet.classList.add("open");
  render();
  sheetForm.onsubmit = async (e) => {
    e.preventDefault();
    capture();
    const amount = parseAmount(model.amount);
    if (!(amount > 0) || !String(model.name).trim() || !model.due_date) return;
    updateDebtPlan(planId, {
      name: model.name.trim(),
      amount,
      count: parseInt(model.count, 10) || 1,
      every_days: parseInt(model.every_days, 10) || 30,
      due_date: model.due_date,
      notes: model.notes
    });
    closeSheet();
    await rerender();
  };
}
function goalPill(g) {
  const target = Number(g.target);
  const saved = Number(g.saved);
  if (target > 0 && saved >= target) return `<span class="pill ok">Completada</span>`;
  if (!g.due_date) return "";
  const du = daysUntil(g.due_date);
  if (du < 0) return `<span class="pill danger">Vencida ${fmtDate(g.due_date)}</span>`;
  if (du <= state.reminderDays) return `<span class="pill warn">En ${du} d</span>`;
  return `<span class="pill">${fmtDate(g.due_date)}</span>`;
}
function goalCard(g) {
  const target = Number(g.target);
  const saved = Number(g.saved);
  const pct = target > 0 ? Math.min(100, saved / target * 100) : 0;
  const remaining = Math.max(target - saved, 0);
  const done = remaining <= 1e-4 && target > 0;
  return `<article class="debt goal ${done ? "done" : ""}">
    <div class="debt-top">
      <div><b>${esc(g.name)}</b> ${goalPill(g)}</div>
      <b class="green">${fmt(saved)}</b>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="debt-meta"><span>${fmt(saved)} de ${fmt(target)}</span><span>${pct.toFixed(0)}%</span></div>
    <div class="debt-meta"><span>${done ? "\xA1Meta alcanzada!" : "Faltan " + fmt(remaining)}</span></div>
    <div class="debt-actions">
      <button class="btn ghost" data-action="goal-add" data-id="${g.id}">+ Abonar</button>
      <button class="btn ghost" data-action="goal-edit" data-id="${g.id}">Editar</button>
      <button class="btn ghost danger" data-action="goal-del" data-id="${g.id}">Borrar</button>
    </div>
  </article>`;
}
function renderGoals() {
  title.textContent = "Metas";
  const rows = listGoals();
  const totalSaved = rows.reduce((a, g) => a + Number(g.saved), 0);
  const totalTarget = rows.reduce((a, g) => a + Number(g.target), 0);
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Ahorrado</span><b class="green">${fmt(totalSaved)}</b></div>
      <button class="btn primary" data-action="goal-new">+ Meta</button>
    </div>
    <details class="panel calc-panel" id="calc-panel" ${state.savingsOpen ? "open" : ""}>
      <summary>M\xE9todos de ahorro</summary>
      <div class="calc-body">
        <label class="field"><span>M\xE9todo</span>
          <select id="sc-method">
            <option value="">Elige un m\xE9todo...</option>
            ${SAVINGS_METHODS.map(
    (m) => `<option value="${m.key}" ${savingsCalc.method === m.key ? "selected" : ""}>${esc(m.name)}</option>`
  ).join("")}
          </select>
        </label>
        <label class="field"><span>Ingreso mensual (${currency()})</span>
          <input type="number" id="sc-income" step="0.01" inputmode="decimal" placeholder="0.00" value="${esc(savingsCalc.income)}" />
        </label>
        <div id="sc-result"></div>
      </div>
    </details>
    ${rows.length ? `<div class="goal-summary muted small">Meta total: ${fmt(totalTarget)}</div>
           <div class="debt-list">${rows.map(goalCard).join("")}</div>` : empty("Sin metas. Crea una para empezar a ahorrar.")}
  `;
  wireSavingsCalc();
  renderSavingsResult();
}
function renderSavingsResult() {
  const box = document.getElementById("sc-result");
  if (!box) return;
  const method = SAVINGS_METHODS.find((m) => m.key === savingsCalc.method);
  if (!method) {
    box.innerHTML = `<p class="muted small">Elige un m\xE9todo y escribe tu ingreso para ver el reparto.</p>`;
    return;
  }
  const income = parseAmount(savingsCalc.income);
  const valid = Number.isFinite(income) && income > 0;
  const rows = method.parts.map((p) => {
    const amount = valid ? income * p.pct / 100 : 0;
    return `<li class="sc-row">
        <span class="sc-label">${esc(p.label)} <i class="muted">${p.pct}%</i></span>
        <b class="${p.save ? "green" : ""}">${fmt(amount)}</b>
      </li>`;
  }).join("");
  const savCount = method.parts.filter((p) => p.save).length;
  box.innerHTML = `
    <p class="muted small">${esc(method.desc)}</p>
    <ul class="sc-list">${rows}</ul>
    ${valid && savCount ? `<button class="btn primary sc-create" data-action="savings-create">${savCount > 1 ? `Crear ${savCount} metas de ahorro` : "Crear meta de ahorro"}</button>` : ""}
  `;
}
function wireSavingsCalc() {
  const panel = document.getElementById("calc-panel");
  if (panel) panel.addEventListener("toggle", () => {
    state.savingsOpen = panel.open;
  });
  const m = document.getElementById("sc-method");
  if (m) m.addEventListener("change", () => {
    savingsCalc.method = m.value;
    renderSavingsResult();
  });
  const i = document.getElementById("sc-income");
  if (i) i.addEventListener("input", () => {
    savingsCalc.income = i.value;
    renderSavingsResult();
  });
}
function goalFields(row = {}) {
  return [
    { name: "name", label: "Nombre de la meta", type: "text", value: row.name, required: true, placeholder: "Vacaciones, fondo de emergencia..." },
    { name: "target", label: `Meta (${currency()})`, type: "number", step: "0.01", value: row.target, required: true },
    { name: "saved", label: `Ahorrado (${currency()})`, type: "number", step: "0.01", value: row.saved != null ? row.saved : 0 },
    { name: "due_date", label: "Fecha objetivo (opcional)", type: "date", value: row.due_date || "" }
  ];
}
function renderNotes() {
  title.textContent = "Notas";
  const rows = listNotes();
  view.innerHTML = `
    <div class="toolbar">
      <div class="total-box"><span>Notas</span><b>${rows.length}</b></div>
      <button class="btn primary" data-action="note-new">+ Nota</button>
    </div>
    ${rows.length ? `<div class="notes-grid">${rows.map(
    (n) => `<article class="note note-c-${esc(n.color || "default")}" data-action="note-edit" data-id="${n.id}">
          <b>${esc(n.title || "Sin t\xEDtulo")}</b>
          <p>${esc(n.body || "")}</p>
          <span class="note-date">${fmtDate((n.updated_at || "").slice(0, 10))}</span>
        </article>`
  ).join("")}</div>` : empty("Sin notas. Crea la primera.")}
  `;
}
function noteFields(row = {}) {
  return [
    { name: "title", label: "T\xEDtulo", type: "text", value: row.title },
    { name: "body", label: "Contenido", type: "textarea", value: row.body, rows: 6 },
    {
      name: "color",
      label: "Color",
      type: "select",
      value: row.color || "default",
      options: [
        { value: "default", label: "Gris" },
        { value: "yellow", label: "Amarillo" },
        { value: "green", label: "Verde" },
        { value: "red", label: "Rojo" },
        { value: "blue", label: "Azul" },
        { value: "purple", label: "Morado" }
      ]
    }
  ];
}
function renderSettings() {
  title.textContent = "Ajustes";
  view.innerHTML = `
    <section class="panel">
      <h3>Apariencia</h3>
      <label class="field"><span>Tema</span>
        <select id="set-theme">
          <option value="system" ${state.theme === "system" ? "selected" : ""}>Seg\xFAn el sistema</option>
          <option value="light" ${state.theme === "light" ? "selected" : ""}>Claro</option>
          <option value="dark" ${state.theme === "dark" ? "selected" : ""}>Oscuro</option>
        </select>
      </label>
      <div class="field">
        <span>Paleta de color</span>
        <div class="palette-grid">
          ${PALETTES.map(
    (p) => `<button type="button" class="palette-swatch ${state.palette === p.key ? "active" : ""}" data-action="palette-set" data-palette="${p.key}" title="Paleta ${esc(p.label)}"><i style="background:${p.color}"></i>${esc(p.label)}</button>`
  ).join("")}
        </div>
      </div>
      <p class="muted small">Tambi\xE9n puedes alternar claro/oscuro con el bot\xF3n de la cabecera.</p>
    </section>

    <section class="panel">
      <h3>Preferencias</h3>
      <label class="field"><span>S\xEDmbolo de moneda</span><input id="set-currency" value="${esc(state.currency)}" /></label>
      <label class="field"><span>D\xEDas de aviso antes de vencimiento</span><input id="set-days" type="number" min="1" max="60" value="${state.reminderDays}" /></label>
      <label class="field"><span>Deudas en cuotas en el balance</span>
        <select id="set-debt-first">
          <option value="0" ${state.debtFirstOnly ? "" : "selected"}>Contar todas las cuotas</option>
          <option value="1" ${state.debtFirstOnly ? "selected" : ""}>Contar solo la primera cuota</option>
        </select>
      </label>
      <button class="btn primary" data-action="save-settings">Guardar preferencias</button>
    </section>

    <section class="panel">
      <h3>Respaldo</h3>
      <p class="muted small">Tus datos viven en SQLite en este dispositivo. Exporta seguido.</p>
      <div class="grid-2">
        <button class="btn ghost" data-action="export-sqlite">Exportar SQLite</button>
        <button class="btn ghost" data-action="export-json">Exportar JSON</button>
        <button class="btn ghost" data-action="export-csv">Exportar CSV</button>
      </div>
      <label class="btn ghost file-btn">
        Importar respaldo
        <input type="file" id="import-input" accept=".sqlite,.db,.json" hidden />
      </label>
      <p class="muted small">Acepta archivos .sqlite o .json exportados por la app.</p>
    </section>

    <section class="panel">
      <h3>Movimientos recurrentes</h3>
      <p class="muted small">Se registran solos seg\xFAn su intervalo (sueldo, renta, suscripciones...).</p>
      <button class="btn ghost" data-action="recurring-open">Gestionar recurrentes</button>
    </section>

    <section class="panel">
      <h3>Recordatorios</h3>
      <p class="muted small">${isNative ? "Se programan notificaciones locales en el tel\xE9fono." : "En la versi\xF3n web se muestran dentro de la app. Instala como PWA o usa el APK para notificaciones."}</p>
      <button class="btn ghost" data-action="enable-notifs">Activar notificaciones</button>
    </section>

    ${state.installPrompt ? `<section class="panel"><h3>Instalar</h3><button class="btn primary" data-action="install">Instalar app</button></section>` : ""}

    <section class="panel danger-zone">
      <h3>Zona de riesgo</h3>
      <button class="btn danger" data-action="wipe">Borrar todos los datos</button>
    </section>

    <p class="muted small center">Mis Finanzas \xB7 v1.0 \xB7 datos 100% locales</p>
  `;
  document.getElementById("import-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const kind = await importFile(file);
      await loadSettings();
      applyTheme();
      alert("Respaldo importado (" + kind + ").");
      await rerender();
    } catch (err) {
      alert("No se pudo importar: " + err.message);
    }
    e.target.value = "";
  });
  const themeSel = document.getElementById("set-theme");
  if (themeSel) themeSel.addEventListener("change", (e) => {
    const r = e.target.getBoundingClientRect();
    themeRipple(e.target.value, r.left + r.width / 2, r.top + r.height / 2);
  });
}
function empty(msg) {
  return `<div class="empty"><p>${msg}</p></div>`;
}
document.getElementById("tabbar").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-btn");
  if (btn) setTab(btn.dataset.tab);
});
document.getElementById("theme-toggle").addEventListener("click", (e) => {
  toggleTheme(e.currentTarget, e.clientX, e.clientY);
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (state.theme === "system") applyTheme();
});
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const id = Number(el.dataset.id);
  const action = el.dataset.action;
  switch (action) {
    case "income-new":
      openSheet({ title: "Nuevo ingreso", fields: incomeFields(), onSubmit: (d) => addIncome(d) });
      break;
    case "income-edit": {
      const row = listIncomes().find((r) => r.id === id);
      openSheet({ title: "Editar ingreso", fields: incomeFields(row), onSubmit: (d) => updateIncome(id, d) });
      break;
    }
    case "income-del": {
      const row = listIncomes().find((r) => r.id === id);
      if (!row) break;
      deleteIncome(id);
      await rerender();
      showToast("Ingreso borrado", "Deshacer", async () => {
        addIncome({ amount: row.amount, description: row.description, category: row.category, date: row.date });
        await rerender();
      });
      break;
    }
    case "income-categories-open":
      openIncomeCategoriesSheet();
      break;
    case "list-group-toggle": {
      const kind = el.dataset.kind;
      state.group[kind] = !state.group[kind];
      renderListFor(kind);
      el.textContent = state.group[kind] ? "Vista: por mes" : "Vista: lista";
      break;
    }
    case "goal-new":
      openSheet({ title: "Nueva meta", fields: goalFields(), submitLabel: "Crear", onSubmit: (d) => addGoal(d) });
      break;
    case "goal-edit": {
      const row = listGoals().find((g) => g.id === id);
      if (!row) break;
      openSheet({ title: "Editar meta", fields: goalFields(row), onSubmit: (d) => updateGoal(id, d) });
      break;
    }
    case "goal-add": {
      const g = listGoals().find((x) => x.id === id);
      if (!g) break;
      openSheet({
        title: "Abonar a " + g.name,
        fields: [{ name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", required: true }],
        submitLabel: "Abonar",
        onSubmit: (d) => {
          if (parseAmount(d.amount) > 0) contributeGoal(g.id, parseAmount(d.amount));
        }
      });
      break;
    }
    case "goal-del": {
      const g = listGoals().find((x) => x.id === id);
      if (!g) break;
      deleteGoal(id);
      await rerender();
      showToast("Meta borrada", "Deshacer", async () => {
        addGoal({ name: g.name, target: g.target, saved: g.saved, due_date: g.due_date });
        await rerender();
      });
      break;
    }
    case "savings-create": {
      const method = SAVINGS_METHODS.find((m) => m.key === savingsCalc.method);
      const income = parseAmount(savingsCalc.income);
      if (!method || !Number.isFinite(income) || income <= 0) break;
      const parts = method.parts.filter((p) => p.save);
      for (const p of parts) {
        addGoal({ name: `${p.label} (${method.name})`, target: income * p.pct / 100, saved: 0, due_date: "" });
      }
      await rerender();
      showToast(parts.length > 1 ? `${parts.length} metas creadas` : "Meta creada");
      break;
    }
    case "income-cat-del":
      deleteIncomeCategory(el.dataset.name);
      openIncomeCategoriesSheet();
      await rerender();
      break;
    case "expense-new":
      openSheet({ title: "Nuevo gasto", fields: expenseFields(), onSubmit: (d) => addExpense(d) });
      break;
    case "expense-edit": {
      const row = listExpenses().find((r) => r.id === id);
      openSheet({ title: "Editar gasto", fields: expenseFields(row), onSubmit: (d) => updateExpense(id, d) });
      break;
    }
    case "expense-del": {
      const row = listExpenses().find((r) => r.id === id);
      if (!row) break;
      deleteExpense(id);
      await rerender();
      showToast("Gasto borrado", "Deshacer", async () => {
        addExpense({ amount: row.amount, description: row.description, category: row.category, date: row.date });
        await rerender();
      });
      break;
    }
    case "expense-clone": {
      const row = listExpenses().find((r) => r.id === id);
      if (row) {
        addExpense({
          amount: row.amount,
          description: row.description,
          category: row.category,
          date: row.date
        });
        await rerender();
      }
      break;
    }
    case "debt-clone": {
      const d = listDebts().find((r) => r.id === id);
      if (!d) break;
      const hasDate = !!d.due_date;
      openSheet({
        title: "Clonar deuda \xB7 " + d.name,
        fields: hasDate ? [{ name: "days", label: "D\xEDas a sumar a la fecha de vencimiento", type: "number", value: 14 }] : [],
        extraHtml: (hasDate ? `<div class="clone-info">Vencimiento original: <b>${fmtDate(d.due_date)}</b></div>
               <div class="quick-days">
                 <button type="button" class="btn ghost" data-action="preset" data-target="days" data-value="14">+14 d\xEDas</button>
                 <button type="button" class="btn ghost" data-action="preset" data-target="days" data-value="15">+15 d\xEDas</button>
                 <button type="button" class="btn ghost" data-action="preset" data-target="days" data-value="0">Misma fecha</button>
               </div>` : "") + `<div class="clone-info">Se crear\xE1 una deuda nueva (sin pagos) con el mismo nombre y monto.</div>`,
        submitLabel: "Clonar",
        onSubmit: (data) => {
          const days = parseInt(data.days, 10) || 0;
          const due = d.due_date ? addDaysISO(d.due_date, days) : null;
          addDebt({ name: d.name, amount: d.amount, due_date: due, notes: d.notes });
        }
      });
      break;
    }
    case "preset": {
      const input = sheetForm.querySelector(`[name="${el.dataset.target}"]`);
      if (input) input.value = el.dataset.value;
      break;
    }
    case "recurring-preset": {
      if (recurringCtx) {
        const days = parseInt(el.dataset.days, 10) || null;
        recurringCtx.setSchedule(el.dataset.mode, days, 15);
      }
      break;
    }
    case "debt-new":
      openDebtForm();
      break;
    case "debt-edit": {
      const row = listDebts().find((r) => r.id === id);
      openSheet({ title: "Editar deuda", fields: debtFields(row), onSubmit: (d) => updateDebt(id, d) });
      break;
    }
    case "debt-del": {
      const d = listDebts().find((r) => r.id === id);
      if (!d) break;
      const pays = listPayments(id);
      deleteDebt(id);
      if (d.plan_id) expandedPlans.delete(d.plan_id);
      await rerender();
      showToast("Deuda borrada", "Deshacer", async () => {
        addDebt({ name: d.name, amount: d.amount, due_date: d.due_date, notes: d.notes, plan_id: d.plan_id, installment_no: d.installment_no, installments: d.installments });
        const nd = d.plan_id ? listDebts().find((r) => r.plan_id === d.plan_id && r.installment_no === d.installment_no) : listDebts().find((r) => r.name === d.name && Number(r.amount) === Number(d.amount));
        if (nd) pays.forEach((p) => addPayment(nd.id, { amount: p.amount, date: p.date }));
        await rerender();
      });
      break;
    }
    case "plan-toggle": {
      const planId = el.dataset.plan;
      if (expandedPlans.has(planId)) expandedPlans.delete(planId);
      else expandedPlans.add(planId);
      renderDebts();
      break;
    }
    case "plan-edit":
      openPlanForm(el.dataset.plan);
      break;
    case "plan-del": {
      const planId = el.dataset.plan;
      const cuotas = listDebts().filter((r) => r.plan_id === planId);
      if (!cuotas.length) break;
      const snapshot = cuotas.map((c) => ({ ...c, pays: listPayments(c.id) }));
      cuotas.forEach((c) => deleteDebt(c.id));
      expandedPlans.delete(planId);
      await rerender();
      showToast("Plan borrado", "Deshacer", async () => {
        for (const c of snapshot) {
          addDebt({ name: c.name, amount: c.amount, due_date: c.due_date, notes: c.notes, plan_id: c.plan_id, installment_no: c.installment_no, installments: c.installments });
          const nd = listDebts().find((r) => r.plan_id === planId && r.installment_no === c.installment_no);
          if (nd) c.pays.forEach((p) => addPayment(nd.id, { amount: p.amount, date: p.date }));
        }
        await rerender();
      });
      break;
    }
    case "debt-settle": {
      const d = listDebts().find((r) => r.id === id);
      if (!d) break;
      const remaining = Math.max(d.amount - d.paid, 0);
      if (remaining <= 1e-4) break;
      openSheet({
        title: "Liquidar deuda \xB7 " + d.name,
        fields: [
          { name: "amount", label: `Monto a liquidar (${currency()})`, type: "number", step: "0.01", value: remaining.toFixed(2), required: true },
          { name: "date", label: "Fecha", type: "date", value: today(), required: true }
        ],
        submitLabel: "Liquidar",
        onSubmit: async (data) => {
          const amt = parseAmount(data.amount);
          if (!(amt > 0)) return;
          addPayment(id, { amount: amt, date: data.date });
        }
      });
      break;
    }
    case "debt-pay": {
      const d = listDebts().find((r) => r.id === id);
      if (!d) break;
      const remaining = Math.max(d.amount - d.paid, 0);
      openSheet({
        title: "Registrar pago \xB7 " + d.name,
        fields: [
          { name: "amount", label: `Monto (${currency()})`, type: "number", step: "0.01", value: remaining.toFixed(2), required: true },
          { name: "date", label: "Fecha", type: "date", value: today(), required: true }
        ],
        onSubmit: async (data) => {
          const amt = parseAmount(data.amount);
          if (!(amt > 0)) return;
          addPayment(id, { amount: amt, date: data.date });
        }
      });
      break;
    }
    case "debt-history": {
      const d = listDebts().find((r) => r.id === id);
      const pays = listPayments(id);
      const html = pays.length ? `<ul class="list compact">${pays.map(
        (p) => `<li><div class="li-main"><b>${fmt(p.amount)}</b><span>${fmtDate(p.date)}</span></div>
              <div class="li-right"><button class="btn ghost danger" data-action="pay-del" data-id="${p.id}" data-debt="${id}">Borrar</button></div></li>`
      ).join("")}</ul>` : '<p class="muted">Sin pagos registrados.</p>';
      openSheet({
        title: "Pagos \xB7 " + d.name,
        fields: [],
        extraHtml: html,
        submitLabel: "Cerrar",
        onSubmit: () => {
        }
      });
      break;
    }
    case "pay-del": {
      const pay = getPayment(id);
      if (!pay) break;
      deletePayment(id);
      closeSheet();
      await rerender();
      showToast("Pago borrado", "Deshacer", async () => {
        addPayment(pay.debt_id, { amount: pay.amount, date: pay.date });
        await rerender();
      });
      break;
    }
    case "budgets-open":
      openBudgetsSheet();
      break;
    case "recurring-open":
      openRecurringList();
      break;
    case "recurring-new":
      openRecurringForm();
      break;
    case "recurring-edit": {
      const row = listRecurring().find((r) => r.id === id);
      if (row) openRecurringForm(row);
      break;
    }
    case "recurring-toggle":
      toggleRecurring(id);
      await rerender();
      openRecurringList();
      break;
    case "recurring-del": {
      const row = listRecurring().find((r) => r.id === id);
      if (!row) break;
      deleteRecurring(id);
      openRecurringList();
      await rerender();
      showToast("Recurrente borrado", "Deshacer", async () => {
        addRecurring({
          type: row.type,
          amount: row.amount,
          description: row.description,
          category: row.category,
          interval_days: row.interval_days,
          schedule: row.schedule,
          day_of_month: row.day_of_month,
          next_date: row.next_date
        });
        await rerender();
      });
      break;
    }
    case "note-new":
      openSheet({ title: "Nueva nota", fields: noteFields(), onSubmit: (d) => addNote(d) });
      break;
    case "note-edit": {
      const row = listNotes().find((r) => r.id === id);
      openSheet({
        title: "Editar nota",
        fields: noteFields(row),
        submitLabel: "Guardar",
        extraHtml: `<button type="button" class="btn ghost danger full" data-action="note-del" data-id="${id}">Borrar nota</button>`,
        onSubmit: (d) => updateNote(id, d)
      });
      break;
    }
    case "note-del": {
      const row = listNotes().find((r) => r.id === id);
      if (!row) break;
      deleteNote(id);
      closeSheet();
      await rerender();
      showToast("Nota borrada", "Deshacer", async () => {
        addNote({ title: row.title, body: row.body, color: row.color });
        await rerender();
      });
      break;
    }
    case "palette-set": {
      const key = el.dataset.palette;
      runRipple(async () => {
        setPalette(key);
        await rerender();
      }, e.clientX, e.clientY);
      break;
    }
    case "save-settings": {
      const cur = document.getElementById("set-currency").value.trim() || "$";
      const days = Math.max(1, Math.min(60, parseInt(document.getElementById("set-days").value, 10) || 7));
      const debtFirst = document.getElementById("set-debt-first").value === "1";
      setSetting("currency", cur);
      setSetting("reminderDays", days);
      setSetting("debt_first_only", debtFirst ? "1" : "0");
      state.currency = cur;
      state.reminderDays = days;
      state.debtFirstOnly = debtFirst;
      await persist();
      alert("Preferencias guardadas.");
      await rerender();
      break;
    }
    case "export-sqlite":
      await exportSqlite();
      alert(isNative ? "Listo para compartir." : "Archivo descargado.");
      break;
    case "export-json":
      await exportJson();
      alert(isNative ? "Listo para compartir." : "Archivo descargado.");
      break;
    case "export-csv":
      await exportCsv();
      alert(isNative ? "Listo para compartir." : "Archivo descargado.");
      break;
    case "enable-notifs": {
      const ok = await ensureNotificationPermission();
      if (ok) {
        await refreshNotifications({ reminderDays: state.reminderDays });
        alert("Notificaciones activadas.");
      } else {
        alert("Permiso de notificaciones no concedido (o no disponible en web).");
      }
      break;
    }
    case "install":
      if (state.installPrompt) {
        state.installPrompt.prompt();
        state.installPrompt = null;
      }
      break;
    case "wipe":
      if (confirm("Esto borrar\xE1 TODO. \xBFContinuar?") && confirm("\xBFSeguro? No se puede deshacer.")) {
        localStorage.clear();
        const { replaceWithBytes: replaceWithBytes2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        replaceWithBytes2(new Uint8Array(0));
        await persist();
        location.reload();
      }
      break;
  }
});
async function loadSettings() {
  state.currency = getSetting("currency", "$");
  state.reminderDays = parseInt(getSetting("reminderDays", "7"), 10) || 7;
  state.debtFirstOnly = String(getSetting("debt_first_only", "0")) === "1";
  let theme = "system";
  try {
    theme = localStorage.getItem(THEME_KEY) || getSetting("theme", "system");
  } catch (e) {
    theme = getSetting("theme", "system");
  }
  state.theme = theme || "system";
  let palette2 = "blue";
  try {
    palette2 = localStorage.getItem(PALETTE_KEY) || getSetting("palette", "blue");
  } catch (e) {
    palette2 = getSetting("palette", "blue");
  }
  state.palette = PALETTES.some((p) => p.key === palette2) ? palette2 : "blue";
}
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  state.installPrompt = e;
  if (state.tab === "settings") rerender();
});
async function boot() {
  view.innerHTML = '<div class="empty"><p>Cargando\u2026</p></div>';
  try {
    await initDb();
    await loadSettings();
    applyTheme();
    const created = applyRecurring();
    await rerender();
    if (created > 0) {
      showToast(`Se registraron ${created} movimiento${created > 1 ? "s" : ""} recurrente${created > 1 ? "s" : ""}`, "Ver", () => setTab("expenses"));
    }
    if (isNative) refreshNotifications({ reminderDays: state.reminderDays });
  } catch (err) {
    view.innerHTML = `<div class="empty"><p>Error al iniciar: ${esc(err.message)}</p></div>`;
    console.error(err);
  }
}
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    if (navigator.serviceWorker.controller) location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((reg) => reg.update()).catch(() => {
    });
  });
}
boot();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
