var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __name = (target, value2) => __defProp(target, "name", { value: value2, configurable: true });
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value2) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value2);
var __privateSet = (obj, member, value2, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value2) : member.set(obj, value2), value2);
var _a, _disposed, _disposed2, _disposed3, _disposed4, _disposed5, _disposed6;
const MODULE_METADATA = {
  ID: "fvtt_relationship_app_module",
  NAME: "Beziehungsnetzwerke für Foundry",
  AUTHOR: "Andreas Rothe",
  AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
  AUTHOR_DISCORD: "lewellyen"
};
const SETTING_KEYS = {
  LOG_LEVEL: "logLevel",
  CACHE_ENABLED: "cacheEnabled",
  CACHE_TTL_MS: "cacheTtlMs",
  CACHE_MAX_ENTRIES: "cacheMaxEntries",
  PERFORMANCE_TRACKING_ENABLED: "performanceTrackingEnabled",
  PERFORMANCE_SAMPLING_RATE: "performanceSamplingRate",
  METRICS_PERSISTENCE_ENABLED: "metricsPersistenceEnabled",
  METRICS_PERSISTENCE_KEY: "metricsPersistenceKey",
  NOTIFICATION_QUEUE_MAX_SIZE: "notificationQueueMaxSize"
};
const APP_DEFAULTS = {
  UNKNOWN_NAME: "Unknown",
  NO_VERSION_SELECTED: -1,
  CACHE_NOT_INITIALIZED: -1,
  CACHE_TTL_MS: 5e3
};
const PUBLIC_API_VERSION = "1.0.0";
const LOG_PREFIX = "Relationship App |";
Object.freeze(MODULE_METADATA);
Object.freeze(SETTING_KEYS);
Object.freeze(APP_DEFAULTS);
function ok(value2) {
  return { ok: true, value: value2 };
}
__name(ok, "ok");
function err(error) {
  return { ok: false, error };
}
__name(err, "err");
function isOk(result) {
  return result.ok;
}
__name(isOk, "isOk");
function isErr(result) {
  return !result.ok;
}
__name(isErr, "isErr");
function map$1(result, transform2) {
  return result.ok ? ok(transform2(result.value)) : result;
}
__name(map$1, "map$1");
function mapError(result, transform2) {
  return result.ok ? result : err(transform2(result.error));
}
__name(mapError, "mapError");
function andThen(result, next) {
  return result.ok ? next(result.value) : result;
}
__name(andThen, "andThen");
function unwrapOr(result, fallbackValue) {
  return result.ok ? result.value : fallbackValue;
}
__name(unwrapOr, "unwrapOr");
function unwrapOrElse(result, getFallback2) {
  return result.ok ? result.value : getFallback2(result.error);
}
__name(unwrapOrElse, "unwrapOrElse");
function getOrThrow(result, toError) {
  if (result.ok) return result.value;
  const e = toError ? toError(result.error) : new Error(String(result.error));
  throw e;
}
__name(getOrThrow, "getOrThrow");
function tryCatch(fn, mapUnknownError) {
  try {
    return ok(fn());
  } catch (unknownError) {
    return err(mapUnknownError(unknownError));
  }
}
__name(tryCatch, "tryCatch");
function all(results) {
  const out = [];
  for (const r of results) {
    if (!r.ok) return r;
    out.push(r.value);
  }
  return ok(out);
}
__name(all, "all");
function match(result, handlers) {
  return result.ok ? handlers.onOk(result.value) : handlers.onErr(result.error);
}
__name(match, "match");
function lift(fn, mapUnknownError) {
  return (param) => tryCatch(() => fn(param), mapUnknownError);
}
__name(lift, "lift");
async function asyncMap(asyncResult, transform2) {
  const result = await asyncResult;
  return result.ok ? ok(await transform2(result.value)) : result;
}
__name(asyncMap, "asyncMap");
async function asyncAndThen(asyncResult, next) {
  const result = await asyncResult;
  return result.ok ? next(result.value) : result;
}
__name(asyncAndThen, "asyncAndThen");
async function fromPromise(promise2, mapUnknownError) {
  try {
    return ok(await promise2);
  } catch (unknownError) {
    return err(mapUnknownError(unknownError));
  }
}
__name(fromPromise, "fromPromise");
async function asyncAll(asyncResults) {
  const results = await Promise.all(asyncResults);
  return all(results);
}
__name(asyncAll, "asyncAll");
function createInjectionToken(description2) {
  return Symbol(description2);
}
__name(createInjectionToken, "createInjectionToken");
const loggerToken = createInjectionToken("Logger");
const bootstrapInitHookServiceToken = createInjectionToken(
  "BootstrapInitHookService"
);
const bootstrapReadyHookServiceToken = createInjectionToken(
  "BootstrapReadyHookService"
);
let store$4;
function setGlobalConfig(config$1) {
  store$4 = {
    ...store$4,
    ...config$1
  };
}
__name(setGlobalConfig, "setGlobalConfig");
// @__NO_SIDE_EFFECTS__
function getGlobalConfig(config$1) {
  return {
    lang: config$1?.lang ?? store$4?.lang,
    message: config$1?.message,
    abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,
    abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly
  };
}
__name(getGlobalConfig, "getGlobalConfig");
function deleteGlobalConfig() {
  store$4 = void 0;
}
__name(deleteGlobalConfig, "deleteGlobalConfig");
let store$3;
function setGlobalMessage(message$1, lang) {
  if (!store$3) store$3 = /* @__PURE__ */ new Map();
  store$3.set(lang, message$1);
}
__name(setGlobalMessage, "setGlobalMessage");
// @__NO_SIDE_EFFECTS__
function getGlobalMessage(lang) {
  return store$3?.get(lang);
}
__name(getGlobalMessage, "getGlobalMessage");
function deleteGlobalMessage(lang) {
  store$3?.delete(lang);
}
__name(deleteGlobalMessage, "deleteGlobalMessage");
let store$2;
function setSchemaMessage(message$1, lang) {
  if (!store$2) store$2 = /* @__PURE__ */ new Map();
  store$2.set(lang, message$1);
}
__name(setSchemaMessage, "setSchemaMessage");
// @__NO_SIDE_EFFECTS__
function getSchemaMessage(lang) {
  return store$2?.get(lang);
}
__name(getSchemaMessage, "getSchemaMessage");
function deleteSchemaMessage(lang) {
  store$2?.delete(lang);
}
__name(deleteSchemaMessage, "deleteSchemaMessage");
let store$1;
function setSpecificMessage(reference, message$1, lang) {
  if (!store$1) store$1 = /* @__PURE__ */ new Map();
  if (!store$1.get(reference)) store$1.set(reference, /* @__PURE__ */ new Map());
  store$1.get(reference).set(lang, message$1);
}
__name(setSpecificMessage, "setSpecificMessage");
// @__NO_SIDE_EFFECTS__
function getSpecificMessage(reference, lang) {
  return store$1?.get(reference)?.get(lang);
}
__name(getSpecificMessage, "getSpecificMessage");
function deleteSpecificMessage(reference, lang) {
  store$1?.get(reference)?.delete(lang);
}
__name(deleteSpecificMessage, "deleteSpecificMessage");
// @__NO_SIDE_EFFECTS__
function _stringify(input) {
  const type = typeof input;
  if (type === "string") return `"${input}"`;
  if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
  if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
  return type;
}
__name(_stringify, "_stringify");
function _addIssue(context, label, dataset, config$1, other) {
  const input = other && "input" in other ? other.input : dataset.value;
  const expected = other?.expected ?? context.expects ?? null;
  const received = other?.received ?? /* @__PURE__ */ _stringify(input);
  const issue = {
    kind: context.kind,
    type: context.type,
    input,
    expected,
    received,
    message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
    requirement: context.requirement,
    path: other?.path,
    issues: other?.issues,
    lang: config$1.lang,
    abortEarly: config$1.abortEarly,
    abortPipeEarly: config$1.abortPipeEarly
  };
  const isSchema = context.kind === "schema";
  const message$1 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config$1.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
  if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
  if (isSchema) dataset.typed = false;
  if (dataset.issues) dataset.issues.push(issue);
  else dataset.issues = [issue];
}
__name(_addIssue, "_addIssue");
let textEncoder;
// @__NO_SIDE_EFFECTS__
function _getByteCount(input) {
  if (!textEncoder) textEncoder = new TextEncoder();
  return textEncoder.encode(input).length;
}
__name(_getByteCount, "_getByteCount");
let segmenter;
// @__NO_SIDE_EFFECTS__
function _getGraphemeCount(input) {
  if (!segmenter) segmenter = new Intl.Segmenter();
  const segments = segmenter.segment(input);
  let count = 0;
  for (const _ of segments) count++;
  return count;
}
__name(_getGraphemeCount, "_getGraphemeCount");
// @__NO_SIDE_EFFECTS__
function _getLastMetadata(schema, type) {
  if ("pipe" in schema) {
    const nestedSchemas = [];
    for (let index = schema.pipe.length - 1; index >= 0; index--) {
      const item = schema.pipe[index];
      if (item.kind === "schema" && "pipe" in item) nestedSchemas.push(item);
      else if (item.kind === "metadata" && item.type === type) return item[type];
    }
    for (const nestedSchema of nestedSchemas) {
      const result = /* @__PURE__ */ _getLastMetadata(nestedSchema, type);
      if (result !== void 0) return result;
    }
  }
}
__name(_getLastMetadata, "_getLastMetadata");
// @__NO_SIDE_EFFECTS__
function _getStandardProps(context) {
  return {
    version: 1,
    vendor: "valibot",
    validate(value$1) {
      return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
    }
  };
}
__name(_getStandardProps, "_getStandardProps");
let store;
// @__NO_SIDE_EFFECTS__
function _getWordCount(locales, input) {
  if (!store) store = /* @__PURE__ */ new Map();
  if (!store.get(locales)) store.set(locales, new Intl.Segmenter(locales, { granularity: "word" }));
  const segments = store.get(locales).segment(input);
  let count = 0;
  for (const segment of segments) if (segment.isWordLike) count++;
  return count;
}
__name(_getWordCount, "_getWordCount");
const NON_DIGIT_REGEX = /\D/gu;
// @__NO_SIDE_EFFECTS__
function _isLuhnAlgo(input) {
  const number$1 = input.replace(NON_DIGIT_REGEX, "");
  let length$1 = number$1.length;
  let bit = 1;
  let sum = 0;
  while (length$1) {
    const value$1 = +number$1[--length$1];
    bit ^= 1;
    sum += bit ? [
      0,
      2,
      4,
      6,
      8,
      1,
      3,
      5,
      7,
      9
    ][value$1] : value$1;
  }
  return sum % 10 === 0;
}
__name(_isLuhnAlgo, "_isLuhnAlgo");
// @__NO_SIDE_EFFECTS__
function _isValidObjectKey(object$1, key) {
  return Object.hasOwn(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
}
__name(_isValidObjectKey, "_isValidObjectKey");
// @__NO_SIDE_EFFECTS__
function _joinExpects(values$1, separator) {
  const list = [...new Set(values$1)];
  if (list.length > 1) return `(${list.join(` ${separator} `)})`;
  return list[0] ?? "never";
}
__name(_joinExpects, "_joinExpects");
// @__NO_SIDE_EFFECTS__
function entriesFromList(list, schema) {
  const entries$1 = {};
  for (const key of list) entries$1[key] = schema;
  return entries$1;
}
__name(entriesFromList, "entriesFromList");
// @__NO_SIDE_EFFECTS__
function entriesFromObjects(schemas) {
  const entries$1 = {};
  for (const schema of schemas) Object.assign(entries$1, schema.entries);
  return entries$1;
}
__name(entriesFromObjects, "entriesFromObjects");
// @__NO_SIDE_EFFECTS__
function getDotPath(issue) {
  if (issue.path) {
    let key = "";
    for (const item of issue.path) if (typeof item.key === "string" || typeof item.key === "number") if (key) key += `.${item.key}`;
    else key += item.key;
    else return null;
    return key;
  }
  return null;
}
__name(getDotPath, "getDotPath");
// @__NO_SIDE_EFFECTS__
function isOfKind(kind, object$1) {
  return object$1.kind === kind;
}
__name(isOfKind, "isOfKind");
// @__NO_SIDE_EFFECTS__
function isOfType(type, object$1) {
  return object$1.type === type;
}
__name(isOfType, "isOfType");
// @__NO_SIDE_EFFECTS__
function isValiError(error) {
  return error instanceof ValiError;
}
__name(isValiError, "isValiError");
var ValiError = (_a = class extends Error {
  /**
  * Creates a Valibot error with useful information.
  *
  * @param issues The error issues.
  */
  constructor(issues) {
    super(issues[0].message);
    this.name = "ValiError";
    this.issues = issues;
  }
}, __name(_a, "ValiError"), _a);
// @__NO_SIDE_EFFECTS__
function args(schema) {
  return {
    kind: "transformation",
    type: "args",
    reference: args,
    async: false,
    schema,
    "~run"(dataset, config$1) {
      const func = dataset.value;
      dataset.value = (...args_) => {
        const argsDataset = this.schema["~run"]({ value: args_ }, config$1);
        if (argsDataset.issues) throw new ValiError(argsDataset.issues);
        return func(...argsDataset.value);
      };
      return dataset;
    }
  };
}
__name(args, "args");
// @__NO_SIDE_EFFECTS__
function argsAsync(schema) {
  return {
    kind: "transformation",
    type: "args",
    reference: argsAsync,
    async: false,
    schema,
    "~run"(dataset, config$1) {
      const func = dataset.value;
      dataset.value = async (...args$1) => {
        const argsDataset = await schema["~run"]({ value: args$1 }, config$1);
        if (argsDataset.issues) throw new ValiError(argsDataset.issues);
        return func(...argsDataset.value);
      };
      return dataset;
    }
  };
}
__name(argsAsync, "argsAsync");
// @__NO_SIDE_EFFECTS__
function awaitAsync() {
  return {
    kind: "transformation",
    type: "await",
    reference: awaitAsync,
    async: true,
    async "~run"(dataset) {
      dataset.value = await dataset.value;
      return dataset;
    }
  };
}
__name(awaitAsync, "awaitAsync");
const BASE64_REGEX = /^(?:[\da-z+/]{4})*(?:[\da-z+/]{2}==|[\da-z+/]{3}=)?$/iu;
const BIC_REGEX = /^[A-Z]{6}(?!00)[\dA-Z]{2}(?:[\dA-Z]{3})?$/u;
const CUID2_REGEX = /^[a-z][\da-z]*$/u;
const DECIMAL_REGEX = /^[+-]?(?:\d*\.)?\d+$/u;
const DIGITS_REGEX = /^\d+$/u;
const EMAIL_REGEX = /^[\w+-]+(?:\.[\w+-]+)*@[\da-z]+(?:[.-][\da-z]+)*\.[a-z]{2,}$/iu;
const EMOJI_REGEX = /^(?:[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|(?![\p{Emoji_Modifier_Base}\u{1F1E6}-\u{1F1FF}])\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|(?![\p{Emoji_Modifier_Base}\u{1F1E6}-\u{1F1FF}])\p{Emoji_Presentation}))*)+$/u;
const HEXADECIMAL_REGEX = /^(?:0[hx])?[\da-fA-F]+$/u;
const HEX_COLOR_REGEX = /^#(?:[\da-fA-F]{3,4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/u;
const IMEI_REGEX = /^\d{15}$|^\d{2}-\d{6}-\d{6}-\d$/u;
const IPV4_REGEX = /^(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])(?:\.(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])){3}$/u;
const IPV6_REGEX = /^(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?::[\da-f]{1,4}){1,6}|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:f{4}(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))$/iu;
const IP_REGEX = /^(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])(?:\.(?:(?:[1-9]|1\d|2[0-4])?\d|25[0-5])){3}$|^(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?::[\da-f]{1,4}){1,6}|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:f{4}(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))$/iu;
const ISO_DATE_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\d|0[1-9]|3[01])$/u;
const ISO_DATE_TIME_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\d|0[1-9]|3[01])[T ](?:0\d|1\d|2[0-3]):[0-5]\d$/u;
const ISO_TIME_REGEX = /^(?:0\d|1\d|2[0-3]):[0-5]\d$/u;
const ISO_TIME_SECOND_REGEX = /^(?:0\d|1\d|2[0-3])(?::[0-5]\d){2}$/u;
const ISO_TIMESTAMP_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\d|0[1-9]|3[01])[T ](?:0\d|1\d|2[0-3])(?::[0-5]\d){2}(?:\.\d{1,9})?(?:Z|[+-](?:0\d|1\d|2[0-3])(?::?[0-5]\d)?)$/u;
const ISO_WEEK_REGEX = /^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/u;
const MAC48_REGEX = /^(?:[\da-f]{2}:){5}[\da-f]{2}$|^(?:[\da-f]{2}-){5}[\da-f]{2}$|^(?:[\da-f]{4}\.){2}[\da-f]{4}$/iu;
const MAC64_REGEX = /^(?:[\da-f]{2}:){7}[\da-f]{2}$|^(?:[\da-f]{2}-){7}[\da-f]{2}$|^(?:[\da-f]{4}\.){3}[\da-f]{4}$|^(?:[\da-f]{4}:){3}[\da-f]{4}$/iu;
const MAC_REGEX = /^(?:[\da-f]{2}:){5}[\da-f]{2}$|^(?:[\da-f]{2}-){5}[\da-f]{2}$|^(?:[\da-f]{4}\.){2}[\da-f]{4}$|^(?:[\da-f]{2}:){7}[\da-f]{2}$|^(?:[\da-f]{2}-){7}[\da-f]{2}$|^(?:[\da-f]{4}\.){3}[\da-f]{4}$|^(?:[\da-f]{4}:){3}[\da-f]{4}$/iu;
const NANO_ID_REGEX = /^[\w-]+$/u;
const OCTAL_REGEX = /^(?:0o)?[0-7]+$/u;
const RFC_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const SLUG_REGEX = /^[\da-z]+(?:[-_][\da-z]+)*$/u;
const ULID_REGEX = /^[\da-hjkmnp-tv-zA-HJKMNP-TV-Z]{26}$/u;
const UUID_REGEX = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu;
// @__NO_SIDE_EFFECTS__
function base64(message$1) {
  return {
    kind: "validation",
    type: "base64",
    reference: base64,
    async: false,
    expects: null,
    requirement: BASE64_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "Base64", dataset, config$1);
      return dataset;
    }
  };
}
__name(base64, "base64");
// @__NO_SIDE_EFFECTS__
function bic(message$1) {
  return {
    kind: "validation",
    type: "bic",
    reference: bic,
    async: false,
    expects: null,
    requirement: BIC_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "BIC", dataset, config$1);
      return dataset;
    }
  };
}
__name(bic, "bic");
// @__NO_SIDE_EFFECTS__
function brand(name) {
  return {
    kind: "transformation",
    type: "brand",
    reference: brand,
    async: false,
    name,
    "~run"(dataset) {
      return dataset;
    }
  };
}
__name(brand, "brand");
// @__NO_SIDE_EFFECTS__
function bytes(requirement, message$1) {
  return {
    kind: "validation",
    type: "bytes",
    reference: bytes,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const length$1 = /* @__PURE__ */ _getByteCount(dataset.value);
        if (length$1 !== this.requirement) _addIssue(this, "bytes", dataset, config$1, { received: `${length$1}` });
      }
      return dataset;
    }
  };
}
__name(bytes, "bytes");
// @__NO_SIDE_EFFECTS__
function check(requirement, message$1) {
  return {
    kind: "validation",
    type: "check",
    reference: check,
    async: false,
    expects: null,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
      return dataset;
    }
  };
}
__name(check, "check");
// @__NO_SIDE_EFFECTS__
function checkAsync(requirement, message$1) {
  return {
    kind: "validation",
    type: "check",
    reference: checkAsync,
    async: true,
    expects: null,
    requirement,
    message: message$1,
    async "~run"(dataset, config$1) {
      if (dataset.typed && !await this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
      return dataset;
    }
  };
}
__name(checkAsync, "checkAsync");
// @__NO_SIDE_EFFECTS__
function checkItems(requirement, message$1) {
  return {
    kind: "validation",
    type: "check_items",
    reference: checkItems,
    async: false,
    expects: null,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) for (let index = 0; index < dataset.value.length; index++) {
        const item = dataset.value[index];
        if (!this.requirement(item, index, dataset.value)) _addIssue(this, "item", dataset, config$1, {
          input: item,
          path: [{
            type: "array",
            origin: "value",
            input: dataset.value,
            key: index,
            value: item
          }]
        });
      }
      return dataset;
    }
  };
}
__name(checkItems, "checkItems");
// @__NO_SIDE_EFFECTS__
function checkItemsAsync(requirement, message$1) {
  return {
    kind: "validation",
    type: "check_items",
    reference: checkItemsAsync,
    async: true,
    expects: null,
    requirement,
    message: message$1,
    async "~run"(dataset, config$1) {
      if (dataset.typed) {
        const requirementResults = await Promise.all(dataset.value.map(this.requirement));
        for (let index = 0; index < dataset.value.length; index++) if (!requirementResults[index]) {
          const item = dataset.value[index];
          _addIssue(this, "item", dataset, config$1, {
            input: item,
            path: [{
              type: "array",
              origin: "value",
              input: dataset.value,
              key: index,
              value: item
            }]
          });
        }
      }
      return dataset;
    }
  };
}
__name(checkItemsAsync, "checkItemsAsync");
const CREDIT_CARD_REGEX = /^(?:\d{14,19}|\d{4}(?: \d{3,6}){2,4}|\d{4}(?:-\d{3,6}){2,4})$/u;
const SANITIZE_REGEX = /[- ]/gu;
const PROVIDER_REGEX_LIST = [
  /^3[47]\d{13}$/u,
  /^3(?:0[0-5]|[68]\d)\d{11,13}$/u,
  /^6(?:011|5\d{2})\d{12,15}$/u,
  /^(?:2131|1800|35\d{3})\d{11}$/u,
  /^5[1-5]\d{2}|(?:222\d|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)\d{12}$/u,
  /^(?:6[27]\d{14,17}|81\d{14,17})$/u,
  /^4\d{12}(?:\d{3,6})?$/u
];
// @__NO_SIDE_EFFECTS__
function creditCard(message$1) {
  return {
    kind: "validation",
    type: "credit_card",
    reference: creditCard,
    async: false,
    expects: null,
    requirement(input) {
      let sanitized;
      return CREDIT_CARD_REGEX.test(input) && (sanitized = input.replace(SANITIZE_REGEX, "")) && PROVIDER_REGEX_LIST.some((regex$1) => regex$1.test(sanitized)) && /* @__PURE__ */ _isLuhnAlgo(sanitized);
    },
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "credit card", dataset, config$1);
      return dataset;
    }
  };
}
__name(creditCard, "creditCard");
// @__NO_SIDE_EFFECTS__
function cuid2(message$1) {
  return {
    kind: "validation",
    type: "cuid2",
    reference: cuid2,
    async: false,
    expects: null,
    requirement: CUID2_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "Cuid2", dataset, config$1);
      return dataset;
    }
  };
}
__name(cuid2, "cuid2");
// @__NO_SIDE_EFFECTS__
function decimal(message$1) {
  return {
    kind: "validation",
    type: "decimal",
    reference: decimal,
    async: false,
    expects: null,
    requirement: DECIMAL_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "decimal", dataset, config$1);
      return dataset;
    }
  };
}
__name(decimal, "decimal");
// @__NO_SIDE_EFFECTS__
function description(description_) {
  return {
    kind: "metadata",
    type: "description",
    reference: description,
    description: description_
  };
}
__name(description, "description");
// @__NO_SIDE_EFFECTS__
function digits(message$1) {
  return {
    kind: "validation",
    type: "digits",
    reference: digits,
    async: false,
    expects: null,
    requirement: DIGITS_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "digits", dataset, config$1);
      return dataset;
    }
  };
}
__name(digits, "digits");
// @__NO_SIDE_EFFECTS__
function email(message$1) {
  return {
    kind: "validation",
    type: "email",
    reference: email,
    expects: null,
    async: false,
    requirement: EMAIL_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "email", dataset, config$1);
      return dataset;
    }
  };
}
__name(email, "email");
// @__NO_SIDE_EFFECTS__
function emoji(message$1) {
  return {
    kind: "validation",
    type: "emoji",
    reference: emoji,
    async: false,
    expects: null,
    requirement: EMOJI_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "emoji", dataset, config$1);
      return dataset;
    }
  };
}
__name(emoji, "emoji");
// @__NO_SIDE_EFFECTS__
function empty(message$1) {
  return {
    kind: "validation",
    type: "empty",
    reference: empty,
    async: false,
    expects: "0",
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length > 0) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
__name(empty, "empty");
// @__NO_SIDE_EFFECTS__
function endsWith(requirement, message$1) {
  return {
    kind: "validation",
    type: "ends_with",
    reference: endsWith,
    async: false,
    expects: `"${requirement}"`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !dataset.value.endsWith(this.requirement)) _addIssue(this, "end", dataset, config$1, { received: `"${dataset.value.slice(-this.requirement.length)}"` });
      return dataset;
    }
  };
}
__name(endsWith, "endsWith");
// @__NO_SIDE_EFFECTS__
function entries(requirement, message$1) {
  return {
    kind: "validation",
    type: "entries",
    reference: entries,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (!dataset.typed) return dataset;
      const count = Object.keys(dataset.value).length;
      if (dataset.typed && count !== this.requirement) _addIssue(this, "entries", dataset, config$1, { received: `${count}` });
      return dataset;
    }
  };
}
__name(entries, "entries");
// @__NO_SIDE_EFFECTS__
function everyItem(requirement, message$1) {
  return {
    kind: "validation",
    type: "every_item",
    reference: everyItem,
    async: false,
    expects: null,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !dataset.value.every(this.requirement)) _addIssue(this, "item", dataset, config$1);
      return dataset;
    }
  };
}
__name(everyItem, "everyItem");
// @__NO_SIDE_EFFECTS__
function examples(examples_) {
  return {
    kind: "metadata",
    type: "examples",
    reference: examples,
    examples: examples_
  };
}
__name(examples, "examples");
// @__NO_SIDE_EFFECTS__
function excludes(requirement, message$1) {
  const received = /* @__PURE__ */ _stringify(requirement);
  return {
    kind: "validation",
    type: "excludes",
    reference: excludes,
    async: false,
    expects: `!${received}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.includes(this.requirement)) _addIssue(this, "content", dataset, config$1, { received });
      return dataset;
    }
  };
}
__name(excludes, "excludes");
// @__NO_SIDE_EFFECTS__
function filterItems(operation) {
  return {
    kind: "transformation",
    type: "filter_items",
    reference: filterItems,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = dataset.value.filter(this.operation);
      return dataset;
    }
  };
}
__name(filterItems, "filterItems");
// @__NO_SIDE_EFFECTS__
function findItem(operation) {
  return {
    kind: "transformation",
    type: "find_item",
    reference: findItem,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = dataset.value.find(this.operation);
      return dataset;
    }
  };
}
__name(findItem, "findItem");
// @__NO_SIDE_EFFECTS__
function finite(message$1) {
  return {
    kind: "validation",
    type: "finite",
    reference: finite,
    async: false,
    expects: null,
    requirement: Number.isFinite,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "finite", dataset, config$1);
      return dataset;
    }
  };
}
__name(finite, "finite");
// @__NO_SIDE_EFFECTS__
function flavor(name) {
  return {
    kind: "transformation",
    type: "flavor",
    reference: flavor,
    async: false,
    name,
    "~run"(dataset) {
      return dataset;
    }
  };
}
__name(flavor, "flavor");
// @__NO_SIDE_EFFECTS__
function graphemes(requirement, message$1) {
  return {
    kind: "validation",
    type: "graphemes",
    reference: graphemes,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getGraphemeCount(dataset.value);
        if (count !== this.requirement) _addIssue(this, "graphemes", dataset, config$1, { received: `${count}` });
      }
      return dataset;
    }
  };
}
__name(graphemes, "graphemes");
// @__NO_SIDE_EFFECTS__
function gtValue(requirement, message$1) {
  return {
    kind: "validation",
    type: "gt_value",
    reference: gtValue,
    async: false,
    expects: `>${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !(dataset.value > this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
__name(gtValue, "gtValue");
const HASH_LENGTHS = {
  md4: 32,
  md5: 32,
  sha1: 40,
  sha256: 64,
  sha384: 96,
  sha512: 128,
  ripemd128: 32,
  ripemd160: 40,
  tiger128: 32,
  tiger160: 40,
  tiger192: 48,
  crc32: 8,
  crc32b: 8,
  adler32: 8
};
// @__NO_SIDE_EFFECTS__
function hash(types, message$1) {
  return {
    kind: "validation",
    type: "hash",
    reference: hash,
    expects: null,
    async: false,
    requirement: RegExp(types.map((type) => `^[a-f0-9]{${HASH_LENGTHS[type]}}$`).join("|"), "iu"),
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "hash", dataset, config$1);
      return dataset;
    }
  };
}
__name(hash, "hash");
// @__NO_SIDE_EFFECTS__
function hexadecimal(message$1) {
  return {
    kind: "validation",
    type: "hexadecimal",
    reference: hexadecimal,
    async: false,
    expects: null,
    requirement: HEXADECIMAL_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "hexadecimal", dataset, config$1);
      return dataset;
    }
  };
}
__name(hexadecimal, "hexadecimal");
// @__NO_SIDE_EFFECTS__
function hexColor(message$1) {
  return {
    kind: "validation",
    type: "hex_color",
    reference: hexColor,
    async: false,
    expects: null,
    requirement: HEX_COLOR_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "hex color", dataset, config$1);
      return dataset;
    }
  };
}
__name(hexColor, "hexColor");
// @__NO_SIDE_EFFECTS__
function imei(message$1) {
  return {
    kind: "validation",
    type: "imei",
    reference: imei,
    async: false,
    expects: null,
    requirement(input) {
      return IMEI_REGEX.test(input) && /* @__PURE__ */ _isLuhnAlgo(input);
    },
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "IMEI", dataset, config$1);
      return dataset;
    }
  };
}
__name(imei, "imei");
// @__NO_SIDE_EFFECTS__
function includes(requirement, message$1) {
  const expects = /* @__PURE__ */ _stringify(requirement);
  return {
    kind: "validation",
    type: "includes",
    reference: includes,
    async: false,
    expects,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !dataset.value.includes(this.requirement)) _addIssue(this, "content", dataset, config$1, { received: `!${expects}` });
      return dataset;
    }
  };
}
__name(includes, "includes");
// @__NO_SIDE_EFFECTS__
function integer(message$1) {
  return {
    kind: "validation",
    type: "integer",
    reference: integer,
    async: false,
    expects: null,
    requirement: Number.isInteger,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "integer", dataset, config$1);
      return dataset;
    }
  };
}
__name(integer, "integer");
// @__NO_SIDE_EFFECTS__
function ip(message$1) {
  return {
    kind: "validation",
    type: "ip",
    reference: ip,
    async: false,
    expects: null,
    requirement: IP_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "IP", dataset, config$1);
      return dataset;
    }
  };
}
__name(ip, "ip");
// @__NO_SIDE_EFFECTS__
function ipv4(message$1) {
  return {
    kind: "validation",
    type: "ipv4",
    reference: ipv4,
    async: false,
    expects: null,
    requirement: IPV4_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "IPv4", dataset, config$1);
      return dataset;
    }
  };
}
__name(ipv4, "ipv4");
// @__NO_SIDE_EFFECTS__
function ipv6(message$1) {
  return {
    kind: "validation",
    type: "ipv6",
    reference: ipv6,
    async: false,
    expects: null,
    requirement: IPV6_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "IPv6", dataset, config$1);
      return dataset;
    }
  };
}
__name(ipv6, "ipv6");
// @__NO_SIDE_EFFECTS__
function isoDate(message$1) {
  return {
    kind: "validation",
    type: "iso_date",
    reference: isoDate,
    async: false,
    expects: null,
    requirement: ISO_DATE_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "date", dataset, config$1);
      return dataset;
    }
  };
}
__name(isoDate, "isoDate");
// @__NO_SIDE_EFFECTS__
function isoDateTime(message$1) {
  return {
    kind: "validation",
    type: "iso_date_time",
    reference: isoDateTime,
    async: false,
    expects: null,
    requirement: ISO_DATE_TIME_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "date-time", dataset, config$1);
      return dataset;
    }
  };
}
__name(isoDateTime, "isoDateTime");
// @__NO_SIDE_EFFECTS__
function isoTime(message$1) {
  return {
    kind: "validation",
    type: "iso_time",
    reference: isoTime,
    async: false,
    expects: null,
    requirement: ISO_TIME_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "time", dataset, config$1);
      return dataset;
    }
  };
}
__name(isoTime, "isoTime");
// @__NO_SIDE_EFFECTS__
function isoTimeSecond(message$1) {
  return {
    kind: "validation",
    type: "iso_time_second",
    reference: isoTimeSecond,
    async: false,
    expects: null,
    requirement: ISO_TIME_SECOND_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "time-second", dataset, config$1);
      return dataset;
    }
  };
}
__name(isoTimeSecond, "isoTimeSecond");
// @__NO_SIDE_EFFECTS__
function isoTimestamp(message$1) {
  return {
    kind: "validation",
    type: "iso_timestamp",
    reference: isoTimestamp,
    async: false,
    expects: null,
    requirement: ISO_TIMESTAMP_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "timestamp", dataset, config$1);
      return dataset;
    }
  };
}
__name(isoTimestamp, "isoTimestamp");
// @__NO_SIDE_EFFECTS__
function isoWeek(message$1) {
  return {
    kind: "validation",
    type: "iso_week",
    reference: isoWeek,
    async: false,
    expects: null,
    requirement: ISO_WEEK_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "week", dataset, config$1);
      return dataset;
    }
  };
}
__name(isoWeek, "isoWeek");
// @__NO_SIDE_EFFECTS__
function length(requirement, message$1) {
  return {
    kind: "validation",
    type: "length",
    reference: length,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length !== this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
__name(length, "length");
// @__NO_SIDE_EFFECTS__
function ltValue(requirement, message$1) {
  return {
    kind: "validation",
    type: "lt_value",
    reference: ltValue,
    async: false,
    expects: `<${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !(dataset.value < this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
__name(ltValue, "ltValue");
// @__NO_SIDE_EFFECTS__
function mac(message$1) {
  return {
    kind: "validation",
    type: "mac",
    reference: mac,
    async: false,
    expects: null,
    requirement: MAC_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "MAC", dataset, config$1);
      return dataset;
    }
  };
}
__name(mac, "mac");
// @__NO_SIDE_EFFECTS__
function mac48(message$1) {
  return {
    kind: "validation",
    type: "mac48",
    reference: mac48,
    async: false,
    expects: null,
    requirement: MAC48_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "48-bit MAC", dataset, config$1);
      return dataset;
    }
  };
}
__name(mac48, "mac48");
// @__NO_SIDE_EFFECTS__
function mac64(message$1) {
  return {
    kind: "validation",
    type: "mac64",
    reference: mac64,
    async: false,
    expects: null,
    requirement: MAC64_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "64-bit MAC", dataset, config$1);
      return dataset;
    }
  };
}
__name(mac64, "mac64");
// @__NO_SIDE_EFFECTS__
function mapItems(operation) {
  return {
    kind: "transformation",
    type: "map_items",
    reference: mapItems,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = dataset.value.map(this.operation);
      return dataset;
    }
  };
}
__name(mapItems, "mapItems");
// @__NO_SIDE_EFFECTS__
function maxBytes(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_bytes",
    reference: maxBytes,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const length$1 = /* @__PURE__ */ _getByteCount(dataset.value);
        if (length$1 > this.requirement) _addIssue(this, "bytes", dataset, config$1, { received: `${length$1}` });
      }
      return dataset;
    }
  };
}
__name(maxBytes, "maxBytes");
// @__NO_SIDE_EFFECTS__
function maxEntries(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_entries",
    reference: maxEntries,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (!dataset.typed) return dataset;
      const count = Object.keys(dataset.value).length;
      if (dataset.typed && count > this.requirement) _addIssue(this, "entries", dataset, config$1, { received: `${count}` });
      return dataset;
    }
  };
}
__name(maxEntries, "maxEntries");
// @__NO_SIDE_EFFECTS__
function maxGraphemes(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_graphemes",
    reference: maxGraphemes,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getGraphemeCount(dataset.value);
        if (count > this.requirement) _addIssue(this, "graphemes", dataset, config$1, { received: `${count}` });
      }
      return dataset;
    }
  };
}
__name(maxGraphemes, "maxGraphemes");
// @__NO_SIDE_EFFECTS__
function maxLength(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_length",
    reference: maxLength,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length > this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
__name(maxLength, "maxLength");
// @__NO_SIDE_EFFECTS__
function maxSize(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_size",
    reference: maxSize,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.size > this.requirement) _addIssue(this, "size", dataset, config$1, { received: `${dataset.value.size}` });
      return dataset;
    }
  };
}
__name(maxSize, "maxSize");
// @__NO_SIDE_EFFECTS__
function maxValue(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_value",
    reference: maxValue,
    async: false,
    expects: `<=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !(dataset.value <= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
__name(maxValue, "maxValue");
// @__NO_SIDE_EFFECTS__
function maxWords(locales, requirement, message$1) {
  return {
    kind: "validation",
    type: "max_words",
    reference: maxWords,
    async: false,
    expects: `<=${requirement}`,
    locales,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getWordCount(this.locales, dataset.value);
        if (count > this.requirement) _addIssue(this, "words", dataset, config$1, { received: `${count}` });
      }
      return dataset;
    }
  };
}
__name(maxWords, "maxWords");
// @__NO_SIDE_EFFECTS__
function metadata(metadata_) {
  return {
    kind: "metadata",
    type: "metadata",
    reference: metadata,
    metadata: metadata_
  };
}
__name(metadata, "metadata");
// @__NO_SIDE_EFFECTS__
function mimeType(requirement, message$1) {
  return {
    kind: "validation",
    type: "mime_type",
    reference: mimeType,
    async: false,
    expects: /* @__PURE__ */ _joinExpects(requirement.map((option) => `"${option}"`), "|"),
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.includes(dataset.value.type)) _addIssue(this, "MIME type", dataset, config$1, { received: `"${dataset.value.type}"` });
      return dataset;
    }
  };
}
__name(mimeType, "mimeType");
// @__NO_SIDE_EFFECTS__
function minBytes(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_bytes",
    reference: minBytes,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const length$1 = /* @__PURE__ */ _getByteCount(dataset.value);
        if (length$1 < this.requirement) _addIssue(this, "bytes", dataset, config$1, { received: `${length$1}` });
      }
      return dataset;
    }
  };
}
__name(minBytes, "minBytes");
// @__NO_SIDE_EFFECTS__
function minEntries(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_entries",
    reference: minEntries,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (!dataset.typed) return dataset;
      const count = Object.keys(dataset.value).length;
      if (dataset.typed && count < this.requirement) _addIssue(this, "entries", dataset, config$1, { received: `${count}` });
      return dataset;
    }
  };
}
__name(minEntries, "minEntries");
// @__NO_SIDE_EFFECTS__
function minGraphemes(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_graphemes",
    reference: minGraphemes,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getGraphemeCount(dataset.value);
        if (count < this.requirement) _addIssue(this, "graphemes", dataset, config$1, { received: `${count}` });
      }
      return dataset;
    }
  };
}
__name(minGraphemes, "minGraphemes");
// @__NO_SIDE_EFFECTS__
function minLength(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_length",
    reference: minLength,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length < this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
__name(minLength, "minLength");
// @__NO_SIDE_EFFECTS__
function minSize(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_size",
    reference: minSize,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.size < this.requirement) _addIssue(this, "size", dataset, config$1, { received: `${dataset.value.size}` });
      return dataset;
    }
  };
}
__name(minSize, "minSize");
// @__NO_SIDE_EFFECTS__
function minValue(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_value",
    reference: minValue,
    async: false,
    expects: `>=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !(dataset.value >= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
__name(minValue, "minValue");
// @__NO_SIDE_EFFECTS__
function minWords(locales, requirement, message$1) {
  return {
    kind: "validation",
    type: "min_words",
    reference: minWords,
    async: false,
    expects: `>=${requirement}`,
    locales,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getWordCount(this.locales, dataset.value);
        if (count < this.requirement) _addIssue(this, "words", dataset, config$1, { received: `${count}` });
      }
      return dataset;
    }
  };
}
__name(minWords, "minWords");
// @__NO_SIDE_EFFECTS__
function multipleOf(requirement, message$1) {
  return {
    kind: "validation",
    type: "multiple_of",
    reference: multipleOf,
    async: false,
    expects: `%${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value % this.requirement != 0) _addIssue(this, "multiple", dataset, config$1);
      return dataset;
    }
  };
}
__name(multipleOf, "multipleOf");
// @__NO_SIDE_EFFECTS__
function nanoid(message$1) {
  return {
    kind: "validation",
    type: "nanoid",
    reference: nanoid,
    async: false,
    expects: null,
    requirement: NANO_ID_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "Nano ID", dataset, config$1);
      return dataset;
    }
  };
}
__name(nanoid, "nanoid");
// @__NO_SIDE_EFFECTS__
function nonEmpty(message$1) {
  return {
    kind: "validation",
    type: "non_empty",
    reference: nonEmpty,
    async: false,
    expects: "!0",
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length === 0) _addIssue(this, "length", dataset, config$1, { received: "0" });
      return dataset;
    }
  };
}
__name(nonEmpty, "nonEmpty");
// @__NO_SIDE_EFFECTS__
function normalize(form) {
  return {
    kind: "transformation",
    type: "normalize",
    reference: normalize,
    async: false,
    form,
    "~run"(dataset) {
      dataset.value = dataset.value.normalize(this.form);
      return dataset;
    }
  };
}
__name(normalize, "normalize");
// @__NO_SIDE_EFFECTS__
function notBytes(requirement, message$1) {
  return {
    kind: "validation",
    type: "not_bytes",
    reference: notBytes,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const length$1 = /* @__PURE__ */ _getByteCount(dataset.value);
        if (length$1 === this.requirement) _addIssue(this, "bytes", dataset, config$1, { received: `${length$1}` });
      }
      return dataset;
    }
  };
}
__name(notBytes, "notBytes");
// @__NO_SIDE_EFFECTS__
function notEntries(requirement, message$1) {
  return {
    kind: "validation",
    type: "not_entries",
    reference: notEntries,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (!dataset.typed) return dataset;
      const count = Object.keys(dataset.value).length;
      if (dataset.typed && count === this.requirement) _addIssue(this, "entries", dataset, config$1, { received: `${count}` });
      return dataset;
    }
  };
}
__name(notEntries, "notEntries");
// @__NO_SIDE_EFFECTS__
function notGraphemes(requirement, message$1) {
  return {
    kind: "validation",
    type: "not_graphemes",
    reference: notGraphemes,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getGraphemeCount(dataset.value);
        if (count === this.requirement) _addIssue(this, "graphemes", dataset, config$1, { received: `${count}` });
      }
      return dataset;
    }
  };
}
__name(notGraphemes, "notGraphemes");
// @__NO_SIDE_EFFECTS__
function notLength(requirement, message$1) {
  return {
    kind: "validation",
    type: "not_length",
    reference: notLength,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length === this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
__name(notLength, "notLength");
// @__NO_SIDE_EFFECTS__
function notSize(requirement, message$1) {
  return {
    kind: "validation",
    type: "not_size",
    reference: notSize,
    async: false,
    expects: `!${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.size === this.requirement) _addIssue(this, "size", dataset, config$1, { received: `${dataset.value.size}` });
      return dataset;
    }
  };
}
__name(notSize, "notSize");
// @__NO_SIDE_EFFECTS__
function notValue(requirement, message$1) {
  return {
    kind: "validation",
    type: "not_value",
    reference: notValue,
    async: false,
    expects: requirement instanceof Date ? `!${requirement.toJSON()}` : `!${/* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && this.requirement <= dataset.value && this.requirement >= dataset.value) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
__name(notValue, "notValue");
// @__NO_SIDE_EFFECTS__
function notValues(requirement, message$1) {
  return {
    kind: "validation",
    type: "not_values",
    reference: notValues,
    async: false,
    expects: `!${/* @__PURE__ */ _joinExpects(requirement.map((value$1) => value$1 instanceof Date ? value$1.toJSON() : /* @__PURE__ */ _stringify(value$1)), "|")}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && this.requirement.some((value$1) => value$1 <= dataset.value && value$1 >= dataset.value)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
__name(notValues, "notValues");
// @__NO_SIDE_EFFECTS__
function notWords(locales, requirement, message$1) {
  return {
    kind: "validation",
    type: "not_words",
    reference: notWords,
    async: false,
    expects: `!${requirement}`,
    locales,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getWordCount(this.locales, dataset.value);
        if (count === this.requirement) _addIssue(this, "words", dataset, config$1, { received: `${count}` });
      }
      return dataset;
    }
  };
}
__name(notWords, "notWords");
// @__NO_SIDE_EFFECTS__
function octal(message$1) {
  return {
    kind: "validation",
    type: "octal",
    reference: octal,
    async: false,
    expects: null,
    requirement: OCTAL_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "octal", dataset, config$1);
      return dataset;
    }
  };
}
__name(octal, "octal");
// @__NO_SIDE_EFFECTS__
function parseJson(config$1, message$1) {
  return {
    kind: "transformation",
    type: "parse_json",
    reference: parseJson,
    config: config$1,
    message: message$1,
    async: false,
    "~run"(dataset, config$2) {
      try {
        dataset.value = JSON.parse(dataset.value, this.config?.reviver);
      } catch (error) {
        if (error instanceof Error) {
          _addIssue(this, "JSON", dataset, config$2, { received: `"${error.message}"` });
          dataset.typed = false;
        } else throw error;
      }
      return dataset;
    }
  };
}
__name(parseJson, "parseJson");
// @__NO_SIDE_EFFECTS__
function _isPartiallyTyped(dataset, paths) {
  if (dataset.issues) for (const path of paths) for (const issue of dataset.issues) {
    let typed = false;
    const bound = Math.min(path.length, issue.path?.length ?? 0);
    for (let index = 0; index < bound; index++) if (path[index] !== issue.path[index].key && (path[index] !== "$" || issue.path[index].type !== "array")) {
      typed = true;
      break;
    }
    if (!typed) return false;
  }
  return true;
}
__name(_isPartiallyTyped, "_isPartiallyTyped");
// @__NO_SIDE_EFFECTS__
function partialCheck(paths, requirement, message$1) {
  return {
    kind: "validation",
    type: "partial_check",
    reference: partialCheck,
    async: false,
    expects: null,
    paths,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if ((dataset.typed || /* @__PURE__ */ _isPartiallyTyped(dataset, paths)) && !this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
      return dataset;
    }
  };
}
__name(partialCheck, "partialCheck");
// @__NO_SIDE_EFFECTS__
function partialCheckAsync(paths, requirement, message$1) {
  return {
    kind: "validation",
    type: "partial_check",
    reference: partialCheckAsync,
    async: true,
    expects: null,
    paths,
    requirement,
    message: message$1,
    async "~run"(dataset, config$1) {
      if ((dataset.typed || /* @__PURE__ */ _isPartiallyTyped(dataset, paths)) && !await this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
      return dataset;
    }
  };
}
__name(partialCheckAsync, "partialCheckAsync");
// @__NO_SIDE_EFFECTS__
function rawCheck(action) {
  return {
    kind: "validation",
    type: "raw_check",
    reference: rawCheck,
    async: false,
    expects: null,
    "~run"(dataset, config$1) {
      action({
        dataset,
        config: config$1,
        addIssue: /* @__PURE__ */ __name((info) => _addIssue(this, info?.label ?? "input", dataset, config$1, info), "addIssue")
      });
      return dataset;
    }
  };
}
__name(rawCheck, "rawCheck");
// @__NO_SIDE_EFFECTS__
function rawCheckAsync(action) {
  return {
    kind: "validation",
    type: "raw_check",
    reference: rawCheckAsync,
    async: true,
    expects: null,
    async "~run"(dataset, config$1) {
      await action({
        dataset,
        config: config$1,
        addIssue: /* @__PURE__ */ __name((info) => _addIssue(this, info?.label ?? "input", dataset, config$1, info), "addIssue")
      });
      return dataset;
    }
  };
}
__name(rawCheckAsync, "rawCheckAsync");
// @__NO_SIDE_EFFECTS__
function rawTransform(action) {
  return {
    kind: "transformation",
    type: "raw_transform",
    reference: rawTransform,
    async: false,
    "~run"(dataset, config$1) {
      const output = action({
        dataset,
        config: config$1,
        addIssue: /* @__PURE__ */ __name((info) => _addIssue(this, info?.label ?? "input", dataset, config$1, info), "addIssue"),
        NEVER: null
      });
      if (dataset.issues) dataset.typed = false;
      else dataset.value = output;
      return dataset;
    }
  };
}
__name(rawTransform, "rawTransform");
// @__NO_SIDE_EFFECTS__
function rawTransformAsync(action) {
  return {
    kind: "transformation",
    type: "raw_transform",
    reference: rawTransformAsync,
    async: true,
    async "~run"(dataset, config$1) {
      const output = await action({
        dataset,
        config: config$1,
        addIssue: /* @__PURE__ */ __name((info) => _addIssue(this, info?.label ?? "input", dataset, config$1, info), "addIssue"),
        NEVER: null
      });
      if (dataset.issues) dataset.typed = false;
      else dataset.value = output;
      return dataset;
    }
  };
}
__name(rawTransformAsync, "rawTransformAsync");
// @__NO_SIDE_EFFECTS__
function readonly() {
  return {
    kind: "transformation",
    type: "readonly",
    reference: readonly,
    async: false,
    "~run"(dataset) {
      return dataset;
    }
  };
}
__name(readonly, "readonly");
// @__NO_SIDE_EFFECTS__
function reduceItems(operation, initial) {
  return {
    kind: "transformation",
    type: "reduce_items",
    reference: reduceItems,
    async: false,
    operation,
    initial,
    "~run"(dataset) {
      dataset.value = dataset.value.reduce(this.operation, this.initial);
      return dataset;
    }
  };
}
__name(reduceItems, "reduceItems");
// @__NO_SIDE_EFFECTS__
function regex(requirement, message$1) {
  return {
    kind: "validation",
    type: "regex",
    reference: regex,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "format", dataset, config$1);
      return dataset;
    }
  };
}
__name(regex, "regex");
// @__NO_SIDE_EFFECTS__
function returns(schema) {
  return {
    kind: "transformation",
    type: "returns",
    reference: returns,
    async: false,
    schema,
    "~run"(dataset, config$1) {
      const func = dataset.value;
      dataset.value = (...args_) => {
        const returnsDataset = this.schema["~run"]({ value: func(...args_) }, config$1);
        if (returnsDataset.issues) throw new ValiError(returnsDataset.issues);
        return returnsDataset.value;
      };
      return dataset;
    }
  };
}
__name(returns, "returns");
// @__NO_SIDE_EFFECTS__
function returnsAsync(schema) {
  return {
    kind: "transformation",
    type: "returns",
    reference: returnsAsync,
    async: false,
    schema,
    "~run"(dataset, config$1) {
      const func = dataset.value;
      dataset.value = async (...args_) => {
        const returnsDataset = await this.schema["~run"]({ value: await func(...args_) }, config$1);
        if (returnsDataset.issues) throw new ValiError(returnsDataset.issues);
        return returnsDataset.value;
      };
      return dataset;
    }
  };
}
__name(returnsAsync, "returnsAsync");
// @__NO_SIDE_EFFECTS__
function rfcEmail(message$1) {
  return {
    kind: "validation",
    type: "rfc_email",
    reference: rfcEmail,
    expects: null,
    async: false,
    requirement: RFC_EMAIL_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "email", dataset, config$1);
      return dataset;
    }
  };
}
__name(rfcEmail, "rfcEmail");
// @__NO_SIDE_EFFECTS__
function safeInteger(message$1) {
  return {
    kind: "validation",
    type: "safe_integer",
    reference: safeInteger,
    async: false,
    expects: null,
    requirement: Number.isSafeInteger,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "safe integer", dataset, config$1);
      return dataset;
    }
  };
}
__name(safeInteger, "safeInteger");
// @__NO_SIDE_EFFECTS__
function size(requirement, message$1) {
  return {
    kind: "validation",
    type: "size",
    reference: size,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.size !== this.requirement) _addIssue(this, "size", dataset, config$1, { received: `${dataset.value.size}` });
      return dataset;
    }
  };
}
__name(size, "size");
// @__NO_SIDE_EFFECTS__
function slug(message$1) {
  return {
    kind: "validation",
    type: "slug",
    reference: slug,
    async: false,
    expects: null,
    requirement: SLUG_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "slug", dataset, config$1);
      return dataset;
    }
  };
}
__name(slug, "slug");
// @__NO_SIDE_EFFECTS__
function someItem(requirement, message$1) {
  return {
    kind: "validation",
    type: "some_item",
    reference: someItem,
    async: false,
    expects: null,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !dataset.value.some(this.requirement)) _addIssue(this, "item", dataset, config$1);
      return dataset;
    }
  };
}
__name(someItem, "someItem");
// @__NO_SIDE_EFFECTS__
function sortItems(operation) {
  return {
    kind: "transformation",
    type: "sort_items",
    reference: sortItems,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = dataset.value.sort(this.operation);
      return dataset;
    }
  };
}
__name(sortItems, "sortItems");
// @__NO_SIDE_EFFECTS__
function startsWith(requirement, message$1) {
  return {
    kind: "validation",
    type: "starts_with",
    reference: startsWith,
    async: false,
    expects: `"${requirement}"`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !dataset.value.startsWith(this.requirement)) _addIssue(this, "start", dataset, config$1, { received: `"${dataset.value.slice(0, this.requirement.length)}"` });
      return dataset;
    }
  };
}
__name(startsWith, "startsWith");
// @__NO_SIDE_EFFECTS__
function stringifyJson(config$1, message$1) {
  return {
    kind: "transformation",
    type: "stringify_json",
    reference: stringifyJson,
    message: message$1,
    config: config$1,
    async: false,
    "~run"(dataset, config$2) {
      try {
        const output = JSON.stringify(dataset.value, this.config?.replacer, this.config?.space);
        if (output === void 0) {
          _addIssue(this, "JSON", dataset, config$2);
          dataset.typed = false;
        }
        dataset.value = output;
      } catch (error) {
        if (error instanceof Error) {
          _addIssue(this, "JSON", dataset, config$2, { received: `"${error.message}"` });
          dataset.typed = false;
        } else throw error;
      }
      return dataset;
    }
  };
}
__name(stringifyJson, "stringifyJson");
// @__NO_SIDE_EFFECTS__
function title(title_) {
  return {
    kind: "metadata",
    type: "title",
    reference: title,
    title: title_
  };
}
__name(title, "title");
// @__NO_SIDE_EFFECTS__
function toBigint(message$1) {
  return {
    kind: "transformation",
    type: "to_bigint",
    reference: toBigint,
    async: false,
    message: message$1,
    "~run"(dataset, config$1) {
      try {
        dataset.value = BigInt(dataset.value);
      } catch {
        _addIssue(this, "bigint", dataset, config$1);
        dataset.typed = false;
      }
      return dataset;
    }
  };
}
__name(toBigint, "toBigint");
// @__NO_SIDE_EFFECTS__
function toBoolean() {
  return {
    kind: "transformation",
    type: "to_boolean",
    reference: toBoolean,
    async: false,
    "~run"(dataset) {
      dataset.value = Boolean(dataset.value);
      return dataset;
    }
  };
}
__name(toBoolean, "toBoolean");
// @__NO_SIDE_EFFECTS__
function toDate(message$1) {
  return {
    kind: "transformation",
    type: "to_date",
    reference: toDate,
    async: false,
    message: message$1,
    "~run"(dataset, config$1) {
      try {
        dataset.value = new Date(dataset.value);
        if (isNaN(dataset.value)) {
          _addIssue(this, "date", dataset, config$1, { received: '"Invalid Date"' });
          dataset.typed = false;
        }
      } catch {
        _addIssue(this, "date", dataset, config$1);
        dataset.typed = false;
      }
      return dataset;
    }
  };
}
__name(toDate, "toDate");
// @__NO_SIDE_EFFECTS__
function toLowerCase() {
  return {
    kind: "transformation",
    type: "to_lower_case",
    reference: toLowerCase,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.toLowerCase();
      return dataset;
    }
  };
}
__name(toLowerCase, "toLowerCase");
// @__NO_SIDE_EFFECTS__
function toMaxValue(requirement) {
  return {
    kind: "transformation",
    type: "to_max_value",
    reference: toMaxValue,
    async: false,
    requirement,
    "~run"(dataset) {
      dataset.value = dataset.value > this.requirement ? this.requirement : dataset.value;
      return dataset;
    }
  };
}
__name(toMaxValue, "toMaxValue");
// @__NO_SIDE_EFFECTS__
function toMinValue(requirement) {
  return {
    kind: "transformation",
    type: "to_min_value",
    reference: toMinValue,
    async: false,
    requirement,
    "~run"(dataset) {
      dataset.value = dataset.value < this.requirement ? this.requirement : dataset.value;
      return dataset;
    }
  };
}
__name(toMinValue, "toMinValue");
// @__NO_SIDE_EFFECTS__
function toNumber(message$1) {
  return {
    kind: "transformation",
    type: "to_number",
    reference: toNumber,
    async: false,
    message: message$1,
    "~run"(dataset, config$1) {
      try {
        dataset.value = Number(dataset.value);
        if (isNaN(dataset.value)) {
          _addIssue(this, "number", dataset, config$1);
          dataset.typed = false;
        }
      } catch {
        _addIssue(this, "number", dataset, config$1);
        dataset.typed = false;
      }
      return dataset;
    }
  };
}
__name(toNumber, "toNumber");
// @__NO_SIDE_EFFECTS__
function toString(message$1) {
  return {
    kind: "transformation",
    type: "to_string",
    reference: toString,
    async: false,
    message: message$1,
    "~run"(dataset, config$1) {
      try {
        dataset.value = String(dataset.value);
      } catch {
        _addIssue(this, "string", dataset, config$1);
        dataset.typed = false;
      }
      return dataset;
    }
  };
}
__name(toString, "toString");
// @__NO_SIDE_EFFECTS__
function toUpperCase() {
  return {
    kind: "transformation",
    type: "to_upper_case",
    reference: toUpperCase,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.toUpperCase();
      return dataset;
    }
  };
}
__name(toUpperCase, "toUpperCase");
// @__NO_SIDE_EFFECTS__
function transform(operation) {
  return {
    kind: "transformation",
    type: "transform",
    reference: transform,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = this.operation(dataset.value);
      return dataset;
    }
  };
}
__name(transform, "transform");
// @__NO_SIDE_EFFECTS__
function transformAsync(operation) {
  return {
    kind: "transformation",
    type: "transform",
    reference: transformAsync,
    async: true,
    operation,
    async "~run"(dataset) {
      dataset.value = await this.operation(dataset.value);
      return dataset;
    }
  };
}
__name(transformAsync, "transformAsync");
// @__NO_SIDE_EFFECTS__
function trim() {
  return {
    kind: "transformation",
    type: "trim",
    reference: trim,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.trim();
      return dataset;
    }
  };
}
__name(trim, "trim");
// @__NO_SIDE_EFFECTS__
function trimEnd() {
  return {
    kind: "transformation",
    type: "trim_end",
    reference: trimEnd,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.trimEnd();
      return dataset;
    }
  };
}
__name(trimEnd, "trimEnd");
// @__NO_SIDE_EFFECTS__
function trimStart() {
  return {
    kind: "transformation",
    type: "trim_start",
    reference: trimStart,
    async: false,
    "~run"(dataset) {
      dataset.value = dataset.value.trimStart();
      return dataset;
    }
  };
}
__name(trimStart, "trimStart");
// @__NO_SIDE_EFFECTS__
function ulid(message$1) {
  return {
    kind: "validation",
    type: "ulid",
    reference: ulid,
    async: false,
    expects: null,
    requirement: ULID_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "ULID", dataset, config$1);
      return dataset;
    }
  };
}
__name(ulid, "ulid");
// @__NO_SIDE_EFFECTS__
function url(message$1) {
  return {
    kind: "validation",
    type: "url",
    reference: url,
    async: false,
    expects: null,
    requirement(input) {
      try {
        new URL(input);
        return true;
      } catch {
        return false;
      }
    },
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "URL", dataset, config$1);
      return dataset;
    }
  };
}
__name(url, "url");
// @__NO_SIDE_EFFECTS__
function uuid(message$1) {
  return {
    kind: "validation",
    type: "uuid",
    reference: uuid,
    async: false,
    expects: null,
    requirement: UUID_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "UUID", dataset, config$1);
      return dataset;
    }
  };
}
__name(uuid, "uuid");
// @__NO_SIDE_EFFECTS__
function value(requirement, message$1) {
  return {
    kind: "validation",
    type: "value",
    reference: value,
    async: false,
    expects: requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement),
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !(this.requirement <= dataset.value && this.requirement >= dataset.value)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
__name(value, "value");
// @__NO_SIDE_EFFECTS__
function values(requirement, message$1) {
  return {
    kind: "validation",
    type: "values",
    reference: values,
    async: false,
    expects: `${/* @__PURE__ */ _joinExpects(requirement.map((value$1) => value$1 instanceof Date ? value$1.toJSON() : /* @__PURE__ */ _stringify(value$1)), "|")}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.some((value$1) => value$1 <= dataset.value && value$1 >= dataset.value)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
__name(values, "values");
// @__NO_SIDE_EFFECTS__
function words(locales, requirement, message$1) {
  return {
    kind: "validation",
    type: "words",
    reference: words,
    async: false,
    expects: `${requirement}`,
    locales,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed) {
        const count = /* @__PURE__ */ _getWordCount(this.locales, dataset.value);
        if (count !== this.requirement) _addIssue(this, "words", dataset, config$1, { received: `${count}` });
      }
      return dataset;
    }
  };
}
__name(words, "words");
function assert(schema, input) {
  const issues = schema["~run"]({ value: input }, { abortEarly: true }).issues;
  if (issues) throw new ValiError(issues);
}
__name(assert, "assert");
// @__NO_SIDE_EFFECTS__
function config(schema, config$1) {
  return {
    ...schema,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config_) {
      return schema["~run"](dataset, {
        ...config_,
        ...config$1
      });
    }
  };
}
__name(config, "config");
// @__NO_SIDE_EFFECTS__
function getFallback(schema, dataset, config$1) {
  return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
}
__name(getFallback, "getFallback");
// @__NO_SIDE_EFFECTS__
function fallback(schema, fallback$1) {
  return {
    ...schema,
    fallback: fallback$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const outputDataset = schema["~run"](dataset, config$1);
      return outputDataset.issues ? {
        typed: true,
        value: /* @__PURE__ */ getFallback(this, outputDataset, config$1)
      } : outputDataset;
    }
  };
}
__name(fallback, "fallback");
// @__NO_SIDE_EFFECTS__
function fallbackAsync(schema, fallback$1) {
  return {
    ...schema,
    fallback: fallback$1,
    async: true,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const outputDataset = await schema["~run"](dataset, config$1);
      return outputDataset.issues ? {
        typed: true,
        value: await /* @__PURE__ */ getFallback(this, outputDataset, config$1)
      } : outputDataset;
    }
  };
}
__name(fallbackAsync, "fallbackAsync");
// @__NO_SIDE_EFFECTS__
function flatten(issues) {
  const flatErrors = {};
  for (const issue of issues) if (issue.path) {
    const dotPath = /* @__PURE__ */ getDotPath(issue);
    if (dotPath) {
      if (!flatErrors.nested) flatErrors.nested = {};
      if (flatErrors.nested[dotPath]) flatErrors.nested[dotPath].push(issue.message);
      else flatErrors.nested[dotPath] = [issue.message];
    } else if (flatErrors.other) flatErrors.other.push(issue.message);
    else flatErrors.other = [issue.message];
  } else if (flatErrors.root) flatErrors.root.push(issue.message);
  else flatErrors.root = [issue.message];
  return flatErrors;
}
__name(flatten, "flatten");
// @__NO_SIDE_EFFECTS__
function forward(action, path) {
  return {
    ...action,
    "~run"(dataset, config$1) {
      const prevIssues = dataset.issues && [...dataset.issues];
      dataset = action["~run"](dataset, config$1);
      if (dataset.issues) {
        for (const issue of dataset.issues) if (!prevIssues?.includes(issue)) {
          let pathInput = dataset.value;
          for (const key of path) {
            const pathValue = pathInput[key];
            const pathItem = {
              type: "unknown",
              origin: "value",
              input: pathInput,
              key,
              value: pathValue
            };
            if (issue.path) issue.path.push(pathItem);
            else issue.path = [pathItem];
            if (!pathValue) break;
            pathInput = pathValue;
          }
        }
      }
      return dataset;
    }
  };
}
__name(forward, "forward");
// @__NO_SIDE_EFFECTS__
function forwardAsync(action, path) {
  return {
    ...action,
    async: true,
    async "~run"(dataset, config$1) {
      const prevIssues = dataset.issues && [...dataset.issues];
      dataset = await action["~run"](dataset, config$1);
      if (dataset.issues) {
        for (const issue of dataset.issues) if (!prevIssues?.includes(issue)) {
          let pathInput = dataset.value;
          for (const key of path) {
            const pathValue = pathInput[key];
            const pathItem = {
              type: "unknown",
              origin: "value",
              input: pathInput,
              key,
              value: pathValue
            };
            if (issue.path) issue.path.push(pathItem);
            else issue.path = [pathItem];
            if (!pathValue) break;
            pathInput = pathValue;
          }
        }
      }
      return dataset;
    }
  };
}
__name(forwardAsync, "forwardAsync");
// @__NO_SIDE_EFFECTS__
function getDefault(schema, dataset, config$1) {
  return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
}
__name(getDefault, "getDefault");
// @__NO_SIDE_EFFECTS__
function getDefaults(schema) {
  if ("entries" in schema) {
    const object$1 = {};
    for (const key in schema.entries) object$1[key] = /* @__PURE__ */ getDefaults(schema.entries[key]);
    return object$1;
  }
  if ("items" in schema) return schema.items.map(getDefaults);
  return /* @__PURE__ */ getDefault(schema);
}
__name(getDefaults, "getDefaults");
// @__NO_SIDE_EFFECTS__
async function getDefaultsAsync(schema) {
  if ("entries" in schema) return Object.fromEntries(await Promise.all(Object.entries(schema.entries).map(async ([key, value$1]) => [key, await /* @__PURE__ */ getDefaultsAsync(value$1)])));
  if ("items" in schema) return Promise.all(schema.items.map(getDefaultsAsync));
  return /* @__PURE__ */ getDefault(schema);
}
__name(getDefaultsAsync, "getDefaultsAsync");
// @__NO_SIDE_EFFECTS__
function getDescription(schema) {
  return /* @__PURE__ */ _getLastMetadata(schema, "description");
}
__name(getDescription, "getDescription");
// @__NO_SIDE_EFFECTS__
function getExamples(schema) {
  const examples$1 = [];
  function depthFirstCollect(schema$1) {
    if ("pipe" in schema$1) {
      for (const item of schema$1.pipe) if (item.kind === "schema" && "pipe" in item) depthFirstCollect(item);
      else if (item.kind === "metadata" && item.type === "examples") examples$1.push(...item.examples);
    }
  }
  __name(depthFirstCollect, "depthFirstCollect");
  depthFirstCollect(schema);
  return examples$1;
}
__name(getExamples, "getExamples");
// @__NO_SIDE_EFFECTS__
function getFallbacks(schema) {
  if ("entries" in schema) {
    const object$1 = {};
    for (const key in schema.entries) object$1[key] = /* @__PURE__ */ getFallbacks(schema.entries[key]);
    return object$1;
  }
  if ("items" in schema) return schema.items.map(getFallbacks);
  return /* @__PURE__ */ getFallback(schema);
}
__name(getFallbacks, "getFallbacks");
// @__NO_SIDE_EFFECTS__
async function getFallbacksAsync(schema) {
  if ("entries" in schema) return Object.fromEntries(await Promise.all(Object.entries(schema.entries).map(async ([key, value$1]) => [key, await /* @__PURE__ */ getFallbacksAsync(value$1)])));
  if ("items" in schema) return Promise.all(schema.items.map(getFallbacksAsync));
  return /* @__PURE__ */ getFallback(schema);
}
__name(getFallbacksAsync, "getFallbacksAsync");
// @__NO_SIDE_EFFECTS__
function getMetadata(schema) {
  const result = {};
  function depthFirstMerge(schema$1) {
    if ("pipe" in schema$1) {
      for (const item of schema$1.pipe) if (item.kind === "schema" && "pipe" in item) depthFirstMerge(item);
      else if (item.kind === "metadata" && item.type === "metadata") Object.assign(result, item.metadata);
    }
  }
  __name(depthFirstMerge, "depthFirstMerge");
  depthFirstMerge(schema);
  return result;
}
__name(getMetadata, "getMetadata");
// @__NO_SIDE_EFFECTS__
function getTitle(schema) {
  return /* @__PURE__ */ _getLastMetadata(schema, "title");
}
__name(getTitle, "getTitle");
// @__NO_SIDE_EFFECTS__
function is(schema, input) {
  return !schema["~run"]({ value: input }, { abortEarly: true }).issues;
}
__name(is, "is");
// @__NO_SIDE_EFFECTS__
function any() {
  return {
    kind: "schema",
    type: "any",
    reference: any,
    expects: "any",
    async: false,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset) {
      dataset.typed = true;
      return dataset;
    }
  };
}
__name(any, "any");
// @__NO_SIDE_EFFECTS__
function array(item, message$1) {
  return {
    kind: "schema",
    type: "array",
    reference: array,
    expects: "Array",
    async: false,
    item,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < input.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.item["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(array, "array");
// @__NO_SIDE_EFFECTS__
function arrayAsync(item, message$1) {
  return {
    kind: "schema",
    type: "array",
    reference: arrayAsync,
    expects: "Array",
    async: true,
    item,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const itemDatasets = await Promise.all(input.map((value$1) => this.item["~run"]({ value: value$1 }, config$1)));
        for (let key = 0; key < itemDatasets.length; key++) {
          const itemDataset = itemDatasets[key];
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: input[key]
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(arrayAsync, "arrayAsync");
// @__NO_SIDE_EFFECTS__
function bigint(message$1) {
  return {
    kind: "schema",
    type: "bigint",
    reference: bigint,
    expects: "bigint",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "bigint") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(bigint, "bigint");
// @__NO_SIDE_EFFECTS__
function blob(message$1) {
  return {
    kind: "schema",
    type: "blob",
    reference: blob,
    expects: "Blob",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value instanceof Blob) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(blob, "blob");
// @__NO_SIDE_EFFECTS__
function boolean(message$1) {
  return {
    kind: "schema",
    type: "boolean",
    reference: boolean,
    expects: "boolean",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "boolean") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(boolean, "boolean");
// @__NO_SIDE_EFFECTS__
function custom(check$1, message$1) {
  return {
    kind: "schema",
    type: "custom",
    reference: custom,
    expects: "unknown",
    async: false,
    check: check$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (this.check(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(custom, "custom");
// @__NO_SIDE_EFFECTS__
function customAsync(check$1, message$1) {
  return {
    kind: "schema",
    type: "custom",
    reference: customAsync,
    expects: "unknown",
    async: true,
    check: check$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (await this.check(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(customAsync, "customAsync");
// @__NO_SIDE_EFFECTS__
function date(message$1) {
  return {
    kind: "schema",
    type: "date",
    reference: date,
    expects: "Date",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value instanceof Date) if (!isNaN(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1, { received: '"Invalid Date"' });
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(date, "date");
// @__NO_SIDE_EFFECTS__
function enum_(enum__, message$1) {
  const options = [];
  for (const key in enum__) if (`${+key}` !== key || typeof enum__[key] !== "string" || !Object.is(enum__[enum__[key]], +key)) options.push(enum__[key]);
  return {
    kind: "schema",
    type: "enum",
    reference: enum_,
    expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
    async: false,
    enum: enum__,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (this.options.includes(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(enum_, "enum_");
// @__NO_SIDE_EFFECTS__
function exactOptional(wrapped, default_) {
  return {
    kind: "schema",
    type: "exact_optional",
    reference: exactOptional,
    expects: wrapped.expects,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(exactOptional, "exactOptional");
// @__NO_SIDE_EFFECTS__
function exactOptionalAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "exact_optional",
    reference: exactOptionalAsync,
    expects: wrapped.expects,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(exactOptionalAsync, "exactOptionalAsync");
// @__NO_SIDE_EFFECTS__
function file(message$1) {
  return {
    kind: "schema",
    type: "file",
    reference: file,
    expects: "File",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value instanceof File) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(file, "file");
// @__NO_SIDE_EFFECTS__
function function_(message$1) {
  return {
    kind: "schema",
    type: "function",
    reference: function_,
    expects: "Function",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "function") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(function_, "function_");
// @__NO_SIDE_EFFECTS__
function instance(class_, message$1) {
  return {
    kind: "schema",
    type: "instance",
    reference: instance,
    expects: class_.name,
    async: false,
    class: class_,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value instanceof this.class) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(instance, "instance");
// @__NO_SIDE_EFFECTS__
function _merge(value1, value2) {
  if (typeof value1 === typeof value2) {
    if (value1 === value2 || value1 instanceof Date && value2 instanceof Date && +value1 === +value2) return { value: value1 };
    if (value1 && value2 && value1.constructor === Object && value2.constructor === Object) {
      for (const key in value2) if (key in value1) {
        const dataset = /* @__PURE__ */ _merge(value1[key], value2[key]);
        if (dataset.issue) return dataset;
        value1[key] = dataset.value;
      } else value1[key] = value2[key];
      return { value: value1 };
    }
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length === value2.length) {
        for (let index = 0; index < value1.length; index++) {
          const dataset = /* @__PURE__ */ _merge(value1[index], value2[index]);
          if (dataset.issue) return dataset;
          value1[index] = dataset.value;
        }
        return { value: value1 };
      }
    }
  }
  return { issue: true };
}
__name(_merge, "_merge");
// @__NO_SIDE_EFFECTS__
function intersect(options, message$1) {
  return {
    kind: "schema",
    type: "intersect",
    reference: intersect,
    expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "&"),
    async: false,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (this.options.length) {
        const input = dataset.value;
        let outputs;
        dataset.typed = true;
        for (const schema of this.options) {
          const optionDataset = schema["~run"]({ value: input }, config$1);
          if (optionDataset.issues) {
            if (dataset.issues) dataset.issues.push(...optionDataset.issues);
            else dataset.issues = optionDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!optionDataset.typed) dataset.typed = false;
          if (dataset.typed) if (outputs) outputs.push(optionDataset.value);
          else outputs = [optionDataset.value];
        }
        if (dataset.typed) {
          dataset.value = outputs[0];
          for (let index = 1; index < outputs.length; index++) {
            const mergeDataset = /* @__PURE__ */ _merge(dataset.value, outputs[index]);
            if (mergeDataset.issue) {
              _addIssue(this, "type", dataset, config$1, { received: "unknown" });
              break;
            }
            dataset.value = mergeDataset.value;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(intersect, "intersect");
// @__NO_SIDE_EFFECTS__
function intersectAsync(options, message$1) {
  return {
    kind: "schema",
    type: "intersect",
    reference: intersectAsync,
    expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "&"),
    async: true,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (this.options.length) {
        const input = dataset.value;
        let outputs;
        dataset.typed = true;
        const optionDatasets = await Promise.all(this.options.map((schema) => schema["~run"]({ value: input }, config$1)));
        for (const optionDataset of optionDatasets) {
          if (optionDataset.issues) {
            if (dataset.issues) dataset.issues.push(...optionDataset.issues);
            else dataset.issues = optionDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!optionDataset.typed) dataset.typed = false;
          if (dataset.typed) if (outputs) outputs.push(optionDataset.value);
          else outputs = [optionDataset.value];
        }
        if (dataset.typed) {
          dataset.value = outputs[0];
          for (let index = 1; index < outputs.length; index++) {
            const mergeDataset = /* @__PURE__ */ _merge(dataset.value, outputs[index]);
            if (mergeDataset.issue) {
              _addIssue(this, "type", dataset, config$1, { received: "unknown" });
              break;
            }
            dataset.value = mergeDataset.value;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(intersectAsync, "intersectAsync");
// @__NO_SIDE_EFFECTS__
function lazy(getter) {
  return {
    kind: "schema",
    type: "lazy",
    reference: lazy,
    expects: "unknown",
    async: false,
    getter,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      return this.getter(dataset.value)["~run"](dataset, config$1);
    }
  };
}
__name(lazy, "lazy");
// @__NO_SIDE_EFFECTS__
function lazyAsync(getter) {
  return {
    kind: "schema",
    type: "lazy",
    reference: lazyAsync,
    expects: "unknown",
    async: true,
    getter,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      return (await this.getter(dataset.value))["~run"](dataset, config$1);
    }
  };
}
__name(lazyAsync, "lazyAsync");
// @__NO_SIDE_EFFECTS__
function literal(literal_, message$1) {
  return {
    kind: "schema",
    type: "literal",
    reference: literal,
    expects: /* @__PURE__ */ _stringify(literal_),
    async: false,
    literal: literal_,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === this.literal) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(literal, "literal");
// @__NO_SIDE_EFFECTS__
function looseObject(entries$1, message$1) {
  return {
    kind: "schema",
    type: "loose_object",
    reference: looseObject,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (/* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)) dataset.value[key] = input[key];
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(looseObject, "looseObject");
// @__NO_SIDE_EFFECTS__
function looseObjectAsync(entries$1, message$1) {
  return {
    kind: "schema",
    type: "loose_object",
    reference: looseObjectAsync,
    expects: "Object",
    async: true,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const valueDatasets = await Promise.all(Object.entries(this.entries).map(async ([key, valueSchema]) => {
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : await /* @__PURE__ */ getDefault(valueSchema);
            return [
              key,
              value$1,
              valueSchema,
              await valueSchema["~run"]({ value: value$1 }, config$1)
            ];
          }
          return [
            key,
            input[key],
            valueSchema,
            null
          ];
        }));
        for (const [key, value$1, valueSchema, valueDataset] of valueDatasets) if (valueDataset) {
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) dataset.typed = false;
          dataset.value[key] = valueDataset.value;
        } else if (valueSchema.fallback !== void 0) dataset.value[key] = await /* @__PURE__ */ getFallback(valueSchema);
        else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
          _addIssue(this, "key", dataset, config$1, {
            input: void 0,
            expected: `"${key}"`,
            path: [{
              type: "object",
              origin: "key",
              input,
              key,
              value: value$1
            }]
          });
          if (config$1.abortEarly) break;
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (/* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)) dataset.value[key] = input[key];
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(looseObjectAsync, "looseObjectAsync");
// @__NO_SIDE_EFFECTS__
function looseTuple(items, message$1) {
  return {
    kind: "schema",
    type: "loose_tuple",
    reference: looseTuple,
    expects: "Array",
    async: false,
    items,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < this.items.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
        if (!dataset.issues || !config$1.abortEarly) for (let key = this.items.length; key < input.length; key++) dataset.value.push(input[key]);
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(looseTuple, "looseTuple");
// @__NO_SIDE_EFFECTS__
function looseTupleAsync(items, message$1) {
  return {
    kind: "schema",
    type: "loose_tuple",
    reference: looseTupleAsync,
    expects: "Array",
    async: true,
    items,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const itemDatasets = await Promise.all(this.items.map(async (item, key) => {
          const value$1 = input[key];
          return [
            key,
            value$1,
            await item["~run"]({ value: value$1 }, config$1)
          ];
        }));
        for (const [key, value$1, itemDataset] of itemDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
        if (!dataset.issues || !config$1.abortEarly) for (let key = this.items.length; key < input.length; key++) dataset.value.push(input[key]);
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(looseTupleAsync, "looseTupleAsync");
// @__NO_SIDE_EFFECTS__
function map(key, value$1, message$1) {
  return {
    kind: "schema",
    type: "map",
    reference: map,
    expects: "Map",
    async: false,
    key,
    value: value$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input instanceof Map) {
        dataset.typed = true;
        dataset.value = /* @__PURE__ */ new Map();
        for (const [inputKey, inputValue] of input) {
          const keyDataset = this.key["~run"]({ value: inputKey }, config$1);
          if (keyDataset.issues) {
            const pathItem = {
              type: "map",
              origin: "key",
              input,
              key: inputKey,
              value: inputValue
            };
            for (const issue of keyDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = keyDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          const valueDataset = this.value["~run"]({ value: inputValue }, config$1);
          if (valueDataset.issues) {
            const pathItem = {
              type: "map",
              origin: "value",
              input,
              key: inputKey,
              value: inputValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
          dataset.value.set(keyDataset.value, valueDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(map, "map");
// @__NO_SIDE_EFFECTS__
function mapAsync(key, value$1, message$1) {
  return {
    kind: "schema",
    type: "map",
    reference: mapAsync,
    expects: "Map",
    async: true,
    key,
    value: value$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input instanceof Map) {
        dataset.typed = true;
        dataset.value = /* @__PURE__ */ new Map();
        const datasets = await Promise.all([...input].map(([inputKey, inputValue]) => Promise.all([
          inputKey,
          inputValue,
          this.key["~run"]({ value: inputKey }, config$1),
          this.value["~run"]({ value: inputValue }, config$1)
        ])));
        for (const [inputKey, inputValue, keyDataset, valueDataset] of datasets) {
          if (keyDataset.issues) {
            const pathItem = {
              type: "map",
              origin: "key",
              input,
              key: inputKey,
              value: inputValue
            };
            for (const issue of keyDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = keyDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (valueDataset.issues) {
            const pathItem = {
              type: "map",
              origin: "value",
              input,
              key: inputKey,
              value: inputValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
          dataset.value.set(keyDataset.value, valueDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(mapAsync, "mapAsync");
// @__NO_SIDE_EFFECTS__
function nan(message$1) {
  return {
    kind: "schema",
    type: "nan",
    reference: nan,
    expects: "NaN",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (Number.isNaN(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(nan, "nan");
// @__NO_SIDE_EFFECTS__
function never(message$1) {
  return {
    kind: "schema",
    type: "never",
    reference: never,
    expects: "never",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(never, "never");
// @__NO_SIDE_EFFECTS__
function nonNullable(wrapped, message$1) {
  return {
    kind: "schema",
    type: "non_nullable",
    reference: nonNullable,
    expects: "!null",
    async: false,
    wrapped,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value !== null) dataset = this.wrapped["~run"](dataset, config$1);
      if (dataset.value === null) _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(nonNullable, "nonNullable");
// @__NO_SIDE_EFFECTS__
function nonNullableAsync(wrapped, message$1) {
  return {
    kind: "schema",
    type: "non_nullable",
    reference: nonNullableAsync,
    expects: "!null",
    async: true,
    wrapped,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (dataset.value !== null) dataset = await this.wrapped["~run"](dataset, config$1);
      if (dataset.value === null) _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(nonNullableAsync, "nonNullableAsync");
// @__NO_SIDE_EFFECTS__
function nonNullish(wrapped, message$1) {
  return {
    kind: "schema",
    type: "non_nullish",
    reference: nonNullish,
    expects: "(!null & !undefined)",
    async: false,
    wrapped,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (!(dataset.value === null || dataset.value === void 0)) dataset = this.wrapped["~run"](dataset, config$1);
      if (dataset.value === null || dataset.value === void 0) _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(nonNullish, "nonNullish");
// @__NO_SIDE_EFFECTS__
function nonNullishAsync(wrapped, message$1) {
  return {
    kind: "schema",
    type: "non_nullish",
    reference: nonNullishAsync,
    expects: "(!null & !undefined)",
    async: true,
    wrapped,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (!(dataset.value === null || dataset.value === void 0)) dataset = await this.wrapped["~run"](dataset, config$1);
      if (dataset.value === null || dataset.value === void 0) _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(nonNullishAsync, "nonNullishAsync");
// @__NO_SIDE_EFFECTS__
function nonOptional(wrapped, message$1) {
  return {
    kind: "schema",
    type: "non_optional",
    reference: nonOptional,
    expects: "!undefined",
    async: false,
    wrapped,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value !== void 0) dataset = this.wrapped["~run"](dataset, config$1);
      if (dataset.value === void 0) _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(nonOptional, "nonOptional");
// @__NO_SIDE_EFFECTS__
function nonOptionalAsync(wrapped, message$1) {
  return {
    kind: "schema",
    type: "non_optional",
    reference: nonOptionalAsync,
    expects: "!undefined",
    async: true,
    wrapped,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (dataset.value !== void 0) dataset = await this.wrapped["~run"](dataset, config$1);
      if (dataset.value === void 0) _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(nonOptionalAsync, "nonOptionalAsync");
// @__NO_SIDE_EFFECTS__
function null_(message$1) {
  return {
    kind: "schema",
    type: "null",
    reference: null_,
    expects: "null",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === null) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(null_, "null_");
// @__NO_SIDE_EFFECTS__
function nullable(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullable",
    reference: nullable,
    expects: `(${wrapped.expects} | null)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === null) {
        if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === null) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(nullable, "nullable");
// @__NO_SIDE_EFFECTS__
function nullableAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullable",
    reference: nullableAsync,
    expects: `(${wrapped.expects} | null)`,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (dataset.value === null) {
        if (this.default !== void 0) dataset.value = await /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === null) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(nullableAsync, "nullableAsync");
// @__NO_SIDE_EFFECTS__
function nullish(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullish",
    reference: nullish,
    expects: `(${wrapped.expects} | null | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === null || dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === null || dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(nullish, "nullish");
// @__NO_SIDE_EFFECTS__
function nullishAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullish",
    reference: nullishAsync,
    expects: `(${wrapped.expects} | null | undefined)`,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (dataset.value === null || dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = await /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === null || dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(nullishAsync, "nullishAsync");
// @__NO_SIDE_EFFECTS__
function number(message$1) {
  return {
    kind: "schema",
    type: "number",
    reference: number,
    expects: "number",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "number" && !isNaN(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(number, "number");
// @__NO_SIDE_EFFECTS__
function object(entries$1, message$1) {
  return {
    kind: "schema",
    type: "object",
    reference: object,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(object, "object");
// @__NO_SIDE_EFFECTS__
function objectAsync(entries$1, message$1) {
  return {
    kind: "schema",
    type: "object",
    reference: objectAsync,
    expects: "Object",
    async: true,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const valueDatasets = await Promise.all(Object.entries(this.entries).map(async ([key, valueSchema]) => {
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : await /* @__PURE__ */ getDefault(valueSchema);
            return [
              key,
              value$1,
              valueSchema,
              await valueSchema["~run"]({ value: value$1 }, config$1)
            ];
          }
          return [
            key,
            input[key],
            valueSchema,
            null
          ];
        }));
        for (const [key, value$1, valueSchema, valueDataset] of valueDatasets) if (valueDataset) {
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) dataset.typed = false;
          dataset.value[key] = valueDataset.value;
        } else if (valueSchema.fallback !== void 0) dataset.value[key] = await /* @__PURE__ */ getFallback(valueSchema);
        else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
          _addIssue(this, "key", dataset, config$1, {
            input: void 0,
            expected: `"${key}"`,
            path: [{
              type: "object",
              origin: "key",
              input,
              key,
              value: value$1
            }]
          });
          if (config$1.abortEarly) break;
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(objectAsync, "objectAsync");
// @__NO_SIDE_EFFECTS__
function objectWithRest(entries$1, rest, message$1) {
  return {
    kind: "schema",
    type: "object_with_rest",
    reference: objectWithRest,
    expects: "Object",
    async: false,
    entries: entries$1,
    rest,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (/* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)) {
            const valueDataset = this.rest["~run"]({ value: input[key] }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: input[key]
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(objectWithRest, "objectWithRest");
// @__NO_SIDE_EFFECTS__
function objectWithRestAsync(entries$1, rest, message$1) {
  return {
    kind: "schema",
    type: "object_with_rest",
    reference: objectWithRestAsync,
    expects: "Object",
    async: true,
    entries: entries$1,
    rest,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const [normalDatasets, restDatasets] = await Promise.all([Promise.all(Object.entries(this.entries).map(async ([key, valueSchema]) => {
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : await /* @__PURE__ */ getDefault(valueSchema);
            return [
              key,
              value$1,
              valueSchema,
              await valueSchema["~run"]({ value: value$1 }, config$1)
            ];
          }
          return [
            key,
            input[key],
            valueSchema,
            null
          ];
        })), Promise.all(Object.entries(input).filter(([key]) => /* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)).map(async ([key, value$1]) => [
          key,
          value$1,
          await this.rest["~run"]({ value: value$1 }, config$1)
        ]))]);
        for (const [key, value$1, valueSchema, valueDataset] of normalDatasets) if (valueDataset) {
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) dataset.typed = false;
          dataset.value[key] = valueDataset.value;
        } else if (valueSchema.fallback !== void 0) dataset.value[key] = await /* @__PURE__ */ getFallback(valueSchema);
        else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
          _addIssue(this, "key", dataset, config$1, {
            input: void 0,
            expected: `"${key}"`,
            path: [{
              type: "object",
              origin: "key",
              input,
              key,
              value: value$1
            }]
          });
          if (config$1.abortEarly) break;
        }
        if (!dataset.issues || !config$1.abortEarly) for (const [key, value$1, valueDataset] of restDatasets) {
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) dataset.typed = false;
          dataset.value[key] = valueDataset.value;
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(objectWithRestAsync, "objectWithRestAsync");
// @__NO_SIDE_EFFECTS__
function optional(wrapped, default_) {
  return {
    kind: "schema",
    type: "optional",
    reference: optional,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(optional, "optional");
// @__NO_SIDE_EFFECTS__
function optionalAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "optional",
    reference: optionalAsync,
    expects: `(${wrapped.expects} | undefined)`,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = await /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(optionalAsync, "optionalAsync");
// @__NO_SIDE_EFFECTS__
function picklist(options, message$1) {
  return {
    kind: "schema",
    type: "picklist",
    reference: picklist,
    expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
    async: false,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (this.options.includes(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(picklist, "picklist");
// @__NO_SIDE_EFFECTS__
function promise(message$1) {
  return {
    kind: "schema",
    type: "promise",
    reference: promise,
    expects: "Promise",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value instanceof Promise) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(promise, "promise");
// @__NO_SIDE_EFFECTS__
function record(key, value$1, message$1) {
  return {
    kind: "schema",
    type: "record",
    reference: record,
    expects: "Object",
    async: false,
    key,
    value: value$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
          const entryValue = input[entryKey];
          const keyDataset = this.key["~run"]({ value: entryKey }, config$1);
          if (keyDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "key",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of keyDataset.issues) {
              issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = keyDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          const valueDataset = this.value["~run"]({ value: entryValue }, config$1);
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
          if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(record, "record");
// @__NO_SIDE_EFFECTS__
function recordAsync(key, value$1, message$1) {
  return {
    kind: "schema",
    type: "record",
    reference: recordAsync,
    expects: "Object",
    async: true,
    key,
    value: value$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const datasets = await Promise.all(Object.entries(input).filter(([key$1]) => /* @__PURE__ */ _isValidObjectKey(input, key$1)).map(([entryKey, entryValue]) => Promise.all([
          entryKey,
          entryValue,
          this.key["~run"]({ value: entryKey }, config$1),
          this.value["~run"]({ value: entryValue }, config$1)
        ])));
        for (const [entryKey, entryValue, keyDataset, valueDataset] of datasets) {
          if (keyDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "key",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of keyDataset.issues) {
              issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = keyDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
          if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(recordAsync, "recordAsync");
// @__NO_SIDE_EFFECTS__
function set(value$1, message$1) {
  return {
    kind: "schema",
    type: "set",
    reference: set,
    expects: "Set",
    async: false,
    value: value$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input instanceof Set) {
        dataset.typed = true;
        dataset.value = /* @__PURE__ */ new Set();
        for (const inputValue of input) {
          const valueDataset = this.value["~run"]({ value: inputValue }, config$1);
          if (valueDataset.issues) {
            const pathItem = {
              type: "set",
              origin: "value",
              input,
              key: null,
              value: inputValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) dataset.typed = false;
          dataset.value.add(valueDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(set, "set");
// @__NO_SIDE_EFFECTS__
function setAsync(value$1, message$1) {
  return {
    kind: "schema",
    type: "set",
    reference: setAsync,
    expects: "Set",
    async: true,
    value: value$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input instanceof Set) {
        dataset.typed = true;
        dataset.value = /* @__PURE__ */ new Set();
        const valueDatasets = await Promise.all([...input].map(async (inputValue) => [inputValue, await this.value["~run"]({ value: inputValue }, config$1)]));
        for (const [inputValue, valueDataset] of valueDatasets) {
          if (valueDataset.issues) {
            const pathItem = {
              type: "set",
              origin: "value",
              input,
              key: null,
              value: inputValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) dataset.typed = false;
          dataset.value.add(valueDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(setAsync, "setAsync");
// @__NO_SIDE_EFFECTS__
function strictObject(entries$1, message$1) {
  return {
    kind: "schema",
    type: "strict_object",
    reference: strictObject,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (!(key in this.entries)) {
            _addIssue(this, "key", dataset, config$1, {
              input: key,
              expected: "never",
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            break;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(strictObject, "strictObject");
// @__NO_SIDE_EFFECTS__
function strictObjectAsync(entries$1, message$1) {
  return {
    kind: "schema",
    type: "strict_object",
    reference: strictObjectAsync,
    expects: "Object",
    async: true,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        const valueDatasets = await Promise.all(Object.entries(this.entries).map(async ([key, valueSchema]) => {
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : await /* @__PURE__ */ getDefault(valueSchema);
            return [
              key,
              value$1,
              valueSchema,
              await valueSchema["~run"]({ value: value$1 }, config$1)
            ];
          }
          return [
            key,
            input[key],
            valueSchema,
            null
          ];
        }));
        for (const [key, value$1, valueSchema, valueDataset] of valueDatasets) if (valueDataset) {
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!valueDataset.typed) dataset.typed = false;
          dataset.value[key] = valueDataset.value;
        } else if (valueSchema.fallback !== void 0) dataset.value[key] = await /* @__PURE__ */ getFallback(valueSchema);
        else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
          _addIssue(this, "key", dataset, config$1, {
            input: void 0,
            expected: `"${key}"`,
            path: [{
              type: "object",
              origin: "key",
              input,
              key,
              value: value$1
            }]
          });
          if (config$1.abortEarly) break;
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (!(key in this.entries)) {
            _addIssue(this, "key", dataset, config$1, {
              input: key,
              expected: "never",
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            break;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(strictObjectAsync, "strictObjectAsync");
// @__NO_SIDE_EFFECTS__
function strictTuple(items, message$1) {
  return {
    kind: "schema",
    type: "strict_tuple",
    reference: strictTuple,
    expects: "Array",
    async: false,
    items,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < this.items.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
        if (!(dataset.issues && config$1.abortEarly) && this.items.length < input.length) _addIssue(this, "type", dataset, config$1, {
          input: input[this.items.length],
          expected: "never",
          path: [{
            type: "array",
            origin: "value",
            input,
            key: this.items.length,
            value: input[this.items.length]
          }]
        });
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(strictTuple, "strictTuple");
// @__NO_SIDE_EFFECTS__
function strictTupleAsync(items, message$1) {
  return {
    kind: "schema",
    type: "strict_tuple",
    reference: strictTupleAsync,
    expects: "Array",
    async: true,
    items,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const itemDatasets = await Promise.all(this.items.map(async (item, key) => {
          const value$1 = input[key];
          return [
            key,
            value$1,
            await item["~run"]({ value: value$1 }, config$1)
          ];
        }));
        for (const [key, value$1, itemDataset] of itemDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
        if (!(dataset.issues && config$1.abortEarly) && this.items.length < input.length) _addIssue(this, "type", dataset, config$1, {
          input: input[this.items.length],
          expected: "never",
          path: [{
            type: "array",
            origin: "value",
            input,
            key: this.items.length,
            value: input[this.items.length]
          }]
        });
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(strictTupleAsync, "strictTupleAsync");
// @__NO_SIDE_EFFECTS__
function string(message$1) {
  return {
    kind: "schema",
    type: "string",
    reference: string,
    expects: "string",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "string") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(string, "string");
// @__NO_SIDE_EFFECTS__
function symbol(message$1) {
  return {
    kind: "schema",
    type: "symbol",
    reference: symbol,
    expects: "symbol",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "symbol") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(symbol, "symbol");
// @__NO_SIDE_EFFECTS__
function tuple(items, message$1) {
  return {
    kind: "schema",
    type: "tuple",
    reference: tuple,
    expects: "Array",
    async: false,
    items,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < this.items.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(tuple, "tuple");
// @__NO_SIDE_EFFECTS__
function tupleAsync(items, message$1) {
  return {
    kind: "schema",
    type: "tuple",
    reference: tupleAsync,
    expects: "Array",
    async: true,
    items,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const itemDatasets = await Promise.all(this.items.map(async (item, key) => {
          const value$1 = input[key];
          return [
            key,
            value$1,
            await item["~run"]({ value: value$1 }, config$1)
          ];
        }));
        for (const [key, value$1, itemDataset] of itemDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(tupleAsync, "tupleAsync");
// @__NO_SIDE_EFFECTS__
function tupleWithRest(items, rest, message$1) {
  return {
    kind: "schema",
    type: "tuple_with_rest",
    reference: tupleWithRest,
    expects: "Array",
    async: false,
    items,
    rest,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < this.items.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
        if (!dataset.issues || !config$1.abortEarly) for (let key = this.items.length; key < input.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.rest["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(tupleWithRest, "tupleWithRest");
// @__NO_SIDE_EFFECTS__
function tupleWithRestAsync(items, rest, message$1) {
  return {
    kind: "schema",
    type: "tuple_with_rest",
    reference: tupleWithRestAsync,
    expects: "Array",
    async: true,
    items,
    rest,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        const [normalDatasets, restDatasets] = await Promise.all([Promise.all(this.items.map(async (item, key) => {
          const value$1 = input[key];
          return [
            key,
            value$1,
            await item["~run"]({ value: value$1 }, config$1)
          ];
        })), Promise.all(input.slice(this.items.length).map(async (value$1, key) => {
          return [
            key + this.items.length,
            value$1,
            await this.rest["~run"]({ value: value$1 }, config$1)
          ];
        }))]);
        for (const [key, value$1, itemDataset] of normalDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
        if (!dataset.issues || !config$1.abortEarly) for (const [key, value$1, itemDataset] of restDatasets) {
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(tupleWithRestAsync, "tupleWithRestAsync");
// @__NO_SIDE_EFFECTS__
function undefined_(message$1) {
  return {
    kind: "schema",
    type: "undefined",
    reference: undefined_,
    expects: "undefined",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === void 0) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(undefined_, "undefined_");
// @__NO_SIDE_EFFECTS__
function undefinedable(wrapped, default_) {
  return {
    kind: "schema",
    type: "undefinedable",
    reference: undefinedable,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(undefinedable, "undefinedable");
// @__NO_SIDE_EFFECTS__
function undefinedableAsync(wrapped, default_) {
  return {
    kind: "schema",
    type: "undefinedable",
    reference: undefinedableAsync,
    expects: `(${wrapped.expects} | undefined)`,
    async: true,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = await /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
__name(undefinedableAsync, "undefinedableAsync");
// @__NO_SIDE_EFFECTS__
function _subIssues(datasets) {
  let issues;
  if (datasets) for (const dataset of datasets) if (issues) issues.push(...dataset.issues);
  else issues = dataset.issues;
  return issues;
}
__name(_subIssues, "_subIssues");
// @__NO_SIDE_EFFECTS__
function union(options, message$1) {
  return {
    kind: "schema",
    type: "union",
    reference: union,
    expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "|"),
    async: false,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      let validDataset;
      let typedDatasets;
      let untypedDatasets;
      for (const schema of this.options) {
        const optionDataset = schema["~run"]({ value: dataset.value }, config$1);
        if (optionDataset.typed) if (optionDataset.issues) if (typedDatasets) typedDatasets.push(optionDataset);
        else typedDatasets = [optionDataset];
        else {
          validDataset = optionDataset;
          break;
        }
        else if (untypedDatasets) untypedDatasets.push(optionDataset);
        else untypedDatasets = [optionDataset];
      }
      if (validDataset) return validDataset;
      if (typedDatasets) {
        if (typedDatasets.length === 1) return typedDatasets[0];
        _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });
        dataset.typed = true;
      } else if (untypedDatasets?.length === 1) return untypedDatasets[0];
      else _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });
      return dataset;
    }
  };
}
__name(union, "union");
// @__NO_SIDE_EFFECTS__
function unionAsync(options, message$1) {
  return {
    kind: "schema",
    type: "union",
    reference: unionAsync,
    expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "|"),
    async: true,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      let validDataset;
      let typedDatasets;
      let untypedDatasets;
      for (const schema of this.options) {
        const optionDataset = await schema["~run"]({ value: dataset.value }, config$1);
        if (optionDataset.typed) if (optionDataset.issues) if (typedDatasets) typedDatasets.push(optionDataset);
        else typedDatasets = [optionDataset];
        else {
          validDataset = optionDataset;
          break;
        }
        else if (untypedDatasets) untypedDatasets.push(optionDataset);
        else untypedDatasets = [optionDataset];
      }
      if (validDataset) return validDataset;
      if (typedDatasets) {
        if (typedDatasets.length === 1) return typedDatasets[0];
        _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });
        dataset.typed = true;
      } else if (untypedDatasets?.length === 1) return untypedDatasets[0];
      else _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });
      return dataset;
    }
  };
}
__name(unionAsync, "unionAsync");
// @__NO_SIDE_EFFECTS__
function unknown() {
  return {
    kind: "schema",
    type: "unknown",
    reference: unknown,
    expects: "unknown",
    async: false,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset) {
      dataset.typed = true;
      return dataset;
    }
  };
}
__name(unknown, "unknown");
// @__NO_SIDE_EFFECTS__
function variant(key, options, message$1) {
  return {
    kind: "schema",
    type: "variant",
    reference: variant,
    expects: "Object",
    async: false,
    key,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        let outputDataset;
        let maxDiscriminatorPriority = 0;
        let invalidDiscriminatorKey = this.key;
        let expectedDiscriminators = [];
        const parseOptions = /* @__PURE__ */ __name((variant$1, allKeys) => {
          for (const schema of variant$1.options) {
            if (schema.type === "variant") parseOptions(schema, new Set(allKeys).add(schema.key));
            else {
              let keysAreValid = true;
              let currentPriority = 0;
              for (const currentKey of allKeys) {
                const discriminatorSchema = schema.entries[currentKey];
                if (currentKey in input ? discriminatorSchema["~run"]({
                  typed: false,
                  value: input[currentKey]
                }, { abortEarly: true }).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {
                  keysAreValid = false;
                  if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {
                    maxDiscriminatorPriority = currentPriority;
                    invalidDiscriminatorKey = currentKey;
                    expectedDiscriminators = [];
                  }
                  if (invalidDiscriminatorKey === currentKey) expectedDiscriminators.push(schema.entries[currentKey].expects);
                  break;
                }
                currentPriority++;
              }
              if (keysAreValid) {
                const optionDataset = schema["~run"]({ value: input }, config$1);
                if (!outputDataset || !outputDataset.typed && optionDataset.typed) outputDataset = optionDataset;
              }
            }
            if (outputDataset && !outputDataset.issues) break;
          }
        }, "parseOptions");
        parseOptions(this, /* @__PURE__ */ new Set([this.key]));
        if (outputDataset) return outputDataset;
        _addIssue(this, "type", dataset, config$1, {
          input: input[invalidDiscriminatorKey],
          expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),
          path: [{
            type: "object",
            origin: "value",
            input,
            key: invalidDiscriminatorKey,
            value: input[invalidDiscriminatorKey]
          }]
        });
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(variant, "variant");
// @__NO_SIDE_EFFECTS__
function variantAsync(key, options, message$1) {
  return {
    kind: "schema",
    type: "variant",
    reference: variantAsync,
    expects: "Object",
    async: true,
    key,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        let outputDataset;
        let maxDiscriminatorPriority = 0;
        let invalidDiscriminatorKey = this.key;
        let expectedDiscriminators = [];
        const parseOptions = /* @__PURE__ */ __name(async (variant$1, allKeys) => {
          for (const schema of variant$1.options) {
            if (schema.type === "variant") await parseOptions(schema, new Set(allKeys).add(schema.key));
            else {
              let keysAreValid = true;
              let currentPriority = 0;
              for (const currentKey of allKeys) {
                const discriminatorSchema = schema.entries[currentKey];
                if (currentKey in input ? (await discriminatorSchema["~run"]({
                  typed: false,
                  value: input[currentKey]
                }, { abortEarly: true })).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {
                  keysAreValid = false;
                  if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {
                    maxDiscriminatorPriority = currentPriority;
                    invalidDiscriminatorKey = currentKey;
                    expectedDiscriminators = [];
                  }
                  if (invalidDiscriminatorKey === currentKey) expectedDiscriminators.push(schema.entries[currentKey].expects);
                  break;
                }
                currentPriority++;
              }
              if (keysAreValid) {
                const optionDataset = await schema["~run"]({ value: input }, config$1);
                if (!outputDataset || !outputDataset.typed && optionDataset.typed) outputDataset = optionDataset;
              }
            }
            if (outputDataset && !outputDataset.issues) break;
          }
        }, "parseOptions");
        await parseOptions(this, /* @__PURE__ */ new Set([this.key]));
        if (outputDataset) return outputDataset;
        _addIssue(this, "type", dataset, config$1, {
          input: input[invalidDiscriminatorKey],
          expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),
          path: [{
            type: "object",
            origin: "value",
            input,
            key: invalidDiscriminatorKey,
            value: input[invalidDiscriminatorKey]
          }]
        });
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(variantAsync, "variantAsync");
// @__NO_SIDE_EFFECTS__
function void_(message$1) {
  return {
    kind: "schema",
    type: "void",
    reference: void_,
    expects: "void",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === void 0) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
__name(void_, "void_");
// @__NO_SIDE_EFFECTS__
function keyof(schema, message$1) {
  return /* @__PURE__ */ picklist(Object.keys(schema.entries), message$1);
}
__name(keyof, "keyof");
// @__NO_SIDE_EFFECTS__
function message(schema, message_) {
  return {
    ...schema,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      return schema["~run"](dataset, {
        ...config$1,
        message: message_
      });
    }
  };
}
__name(message, "message");
// @__NO_SIDE_EFFECTS__
function omit(schema, keys) {
  const entries$1 = { ...schema.entries };
  for (const key of keys) delete entries$1[key];
  return {
    ...schema,
    entries: entries$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(omit, "omit");
function parse(schema, input, config$1) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  if (dataset.issues) throw new ValiError(dataset.issues);
  return dataset.value;
}
__name(parse, "parse");
async function parseAsync(schema, input, config$1) {
  const dataset = await schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  if (dataset.issues) throw new ValiError(dataset.issues);
  return dataset.value;
}
__name(parseAsync, "parseAsync");
// @__NO_SIDE_EFFECTS__
function parser(schema, config$1) {
  const func = /* @__PURE__ */ __name((input) => parse(schema, input, config$1), "func");
  func.schema = schema;
  func.config = config$1;
  return func;
}
__name(parser, "parser");
// @__NO_SIDE_EFFECTS__
function parserAsync(schema, config$1) {
  const func = /* @__PURE__ */ __name((input) => parseAsync(schema, input, config$1), "func");
  func.schema = schema;
  func.config = config$1;
  return func;
}
__name(parserAsync, "parserAsync");
// @__NO_SIDE_EFFECTS__
function partial(schema, keys) {
  const entries$1 = {};
  for (const key in schema.entries) entries$1[key] = !keys || keys.includes(key) ? /* @__PURE__ */ optional(schema.entries[key]) : schema.entries[key];
  return {
    ...schema,
    entries: entries$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(partial, "partial");
// @__NO_SIDE_EFFECTS__
function partialAsync(schema, keys) {
  const entries$1 = {};
  for (const key in schema.entries) entries$1[key] = !keys || keys.includes(key) ? /* @__PURE__ */ optionalAsync(schema.entries[key]) : schema.entries[key];
  return {
    ...schema,
    entries: entries$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(partialAsync, "partialAsync");
// @__NO_SIDE_EFFECTS__
function pick(schema, keys) {
  const entries$1 = {};
  for (const key of keys) entries$1[key] = schema.entries[key];
  return {
    ...schema,
    entries: entries$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(pick, "pick");
// @__NO_SIDE_EFFECTS__
function pipe(...pipe$1) {
  return {
    ...pipe$1[0],
    pipe: pipe$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      for (const item of pipe$1) if (item.kind !== "metadata") {
        if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
          dataset.typed = false;
          break;
        }
        if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
      }
      return dataset;
    }
  };
}
__name(pipe, "pipe");
// @__NO_SIDE_EFFECTS__
function pipeAsync(...pipe$1) {
  return {
    ...pipe$1[0],
    pipe: pipe$1,
    async: true,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    async "~run"(dataset, config$1) {
      for (const item of pipe$1) if (item.kind !== "metadata") {
        if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
          dataset.typed = false;
          break;
        }
        if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = await item["~run"](dataset, config$1);
      }
      return dataset;
    }
  };
}
__name(pipeAsync, "pipeAsync");
// @__NO_SIDE_EFFECTS__
function required(schema, arg2, arg3) {
  const keys = Array.isArray(arg2) ? arg2 : void 0;
  const message$1 = Array.isArray(arg2) ? arg3 : arg2;
  const entries$1 = {};
  for (const key in schema.entries) entries$1[key] = !keys || keys.includes(key) ? /* @__PURE__ */ nonOptional(schema.entries[key], message$1) : schema.entries[key];
  return {
    ...schema,
    entries: entries$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(required, "required");
// @__NO_SIDE_EFFECTS__
function requiredAsync(schema, arg2, arg3) {
  const keys = Array.isArray(arg2) ? arg2 : void 0;
  const message$1 = Array.isArray(arg2) ? arg3 : arg2;
  const entries$1 = {};
  for (const key in schema.entries) entries$1[key] = !keys || keys.includes(key) ? /* @__PURE__ */ nonOptionalAsync(schema.entries[key], message$1) : schema.entries[key];
  return {
    ...schema,
    entries: entries$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
__name(requiredAsync, "requiredAsync");
// @__NO_SIDE_EFFECTS__
function safeParse(schema, input, config$1) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  return {
    typed: dataset.typed,
    success: !dataset.issues,
    output: dataset.value,
    issues: dataset.issues
  };
}
__name(safeParse, "safeParse");
// @__NO_SIDE_EFFECTS__
async function safeParseAsync(schema, input, config$1) {
  const dataset = await schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  return {
    typed: dataset.typed,
    success: !dataset.issues,
    output: dataset.value,
    issues: dataset.issues
  };
}
__name(safeParseAsync, "safeParseAsync");
// @__NO_SIDE_EFFECTS__
function safeParser(schema, config$1) {
  const func = /* @__PURE__ */ __name((input) => /* @__PURE__ */ safeParse(schema, input, config$1), "func");
  func.schema = schema;
  func.config = config$1;
  return func;
}
__name(safeParser, "safeParser");
// @__NO_SIDE_EFFECTS__
function safeParserAsync(schema, config$1) {
  const func = /* @__PURE__ */ __name((input) => /* @__PURE__ */ safeParseAsync(schema, input, config$1), "func");
  func.schema = schema;
  func.config = config$1;
  return func;
}
__name(safeParserAsync, "safeParserAsync");
// @__NO_SIDE_EFFECTS__
function summarize(issues) {
  let summary = "";
  for (const issue of issues) {
    if (summary) summary += "\n";
    summary += `× ${issue.message}`;
    const dotPath = /* @__PURE__ */ getDotPath(issue);
    if (dotPath) summary += `
  → at ${dotPath}`;
  }
  return summary;
}
__name(summarize, "summarize");
// @__NO_SIDE_EFFECTS__
function unwrap(schema) {
  return schema.wrapped;
}
__name(unwrap, "unwrap");
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
const LOG_LEVEL_SCHEMA = /* @__PURE__ */ picklist([
  0,
  1,
  2,
  3
  /* ERROR */
]);
const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "development", "PROD": true, "SSR": false, "VITE_ENABLE_PERF_TRACKING": "true" };
function parseSamplingRate(envValue, fallback2) {
  const raw = parseFloat(envValue ?? String(fallback2));
  return Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : fallback2;
}
__name(parseSamplingRate, "parseSamplingRate");
function parseNonNegativeNumber(envValue, fallback2) {
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed)) {
    return fallback2;
  }
  return parsed < 0 ? fallback2 : parsed;
}
__name(parseNonNegativeNumber, "parseNonNegativeNumber");
function parseOptionalPositiveInteger(envValue) {
  if (!envValue) {
    return void 0;
  }
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return void 0;
  }
  return Math.floor(parsed);
}
__name(parseOptionalPositiveInteger, "parseOptionalPositiveInteger");
function parsePositiveInteger(envValue, fallback2) {
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback2;
  }
  return Math.floor(parsed);
}
__name(parsePositiveInteger, "parsePositiveInteger");
function getEnvVar(key, parser2) {
  const value2 = __vite_import_meta_env__[key];
  return parser2(value2);
}
__name(getEnvVar, "getEnvVar");
const parsedCacheMaxEntries = getEnvVar("VITE_CACHE_MAX_ENTRIES", parseOptionalPositiveInteger);
const ENV = {
  isDevelopment: true,
  isProduction: false,
  logLevel: true ? LogLevel.DEBUG : LogLevel.INFO,
  enablePerformanceTracking: true,
  enableMetricsPersistence: getEnvVar("VITE_ENABLE_METRICS_PERSISTENCE", (val) => val === "true"),
  metricsPersistenceKey: getEnvVar(
    "VITE_METRICS_PERSISTENCE_KEY",
    (val) => val ?? "fvtt_relationship_app_module.metrics"
  ),
  // 1% sampling in production, 100% in development
  performanceSamplingRate: false ? parseSamplingRate(void 0, 0.01) : 1,
  enableCacheService: getEnvVar(
    "VITE_CACHE_ENABLED",
    (val) => val === void 0 ? true : val === "true"
  ),
  cacheDefaultTtlMs: getEnvVar(
    "VITE_CACHE_TTL_MS",
    (val) => parseNonNegativeNumber(val, APP_DEFAULTS.CACHE_TTL_MS)
  ),
  ...parsedCacheMaxEntries !== void 0 ? { cacheMaxEntries: parsedCacheMaxEntries } : {},
  notificationQueueMinSize: getEnvVar(
    "VITE_NOTIFICATION_QUEUE_MIN_SIZE",
    (val) => parsePositiveInteger(val, 10)
  ),
  notificationQueueMaxSize: getEnvVar(
    "VITE_NOTIFICATION_QUEUE_MAX_SIZE",
    (val) => parsePositiveInteger(val, 1e3)
  ),
  notificationQueueDefaultSize: getEnvVar(
    "VITE_NOTIFICATION_QUEUE_DEFAULT_SIZE",
    (val) => parsePositiveInteger(val, 50)
  )
};
const _PerformanceTrackerImpl = class _PerformanceTrackerImpl {
  /**
   * Creates a performance tracker implementation.
   *
   * @param env - Environment configuration for tracking settings
   * @param sampler - Optional metrics sampler for sampling decisions (null during early bootstrap)
   */
  constructor(config2, sampler) {
    this.config = config2;
    this.sampler = sampler;
  }
  /**
   * Tracks synchronous operation execution time.
   *
   * Only measures when:
   * 1. Performance tracking is enabled (env.enablePerformanceTracking)
   * 2. MetricsCollector is available
   * 3. Sampling check passes (metricsCollector.shouldSample())
   *
   * @template T - Return type of the operation
   * @param operation - Function to execute and measure
   * @param onComplete - Optional callback invoked with duration and result
   * @returns Result of the operation
   */
  track(operation, onComplete) {
    if (!this.config.get("enablePerformanceTracking") || !this.sampler?.shouldSample()) {
      return operation();
    }
    const startTime = performance.now();
    const result = operation();
    const duration = performance.now() - startTime;
    if (onComplete) {
      onComplete(duration, result);
    }
    return result;
  }
  /**
   * Tracks asynchronous operation execution time.
   *
   * Only measures when:
   * 1. Performance tracking is enabled (env.enablePerformanceTracking)
   * 2. MetricsCollector is available
   * 3. Sampling check passes (metricsCollector.shouldSample())
   *
   * @template T - Return type of the async operation
   * @param operation - Async function to execute and measure
   * @param onComplete - Optional callback invoked with duration and result
   * @returns Promise resolving to the operation result
   */
  async trackAsync(operation, onComplete) {
    if (!this.config.get("enablePerformanceTracking") || !this.sampler?.shouldSample()) {
      return operation();
    }
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;
    if (onComplete) {
      onComplete(duration, result);
    }
    return result;
  }
};
__name(_PerformanceTrackerImpl, "PerformanceTrackerImpl");
let PerformanceTrackerImpl = _PerformanceTrackerImpl;
const _BootstrapPerformanceTracker = class _BootstrapPerformanceTracker extends PerformanceTrackerImpl {
  /**
   * Creates a bootstrap performance tracker.
   *
   * @param env - Environment configuration for tracking settings
   * @param sampler - Optional metrics sampler for sampling decisions (null during early bootstrap)
   */
  constructor(config2, sampler) {
    super(config2, sampler);
  }
};
__name(_BootstrapPerformanceTracker, "BootstrapPerformanceTracker");
let BootstrapPerformanceTracker = _BootstrapPerformanceTracker;
const _BootstrapErrorHandler = class _BootstrapErrorHandler {
  /**
   * Logs an error with structured context in the browser console.
   *
   * Creates a collapsible group with timestamp, phase, component,
   * error details, and metadata for easy debugging and screenshotting.
   *
   * @param error - The error that occurred (Error object, string, or unknown)
   * @param context - Context information about the error
   */
  static logError(error, context) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.group(`[${timestamp}] ${LOG_PREFIX} Error in ${context.phase}`);
    if (context.component) {
      console.error("Component:", context.component);
    }
    console.error("Error:", error);
    if (context.metadata && Object.keys(context.metadata).length > 0) {
      console.error("Metadata:", context.metadata);
    }
    console.groupEnd();
  }
};
__name(_BootstrapErrorHandler, "BootstrapErrorHandler");
let BootstrapErrorHandler = _BootstrapErrorHandler;
const _RuntimeConfigService = class _RuntimeConfigService {
  constructor(env) {
    this.listeners = /* @__PURE__ */ new Map();
    this.values = {
      isDevelopment: env.isDevelopment,
      isProduction: env.isProduction,
      logLevel: env.logLevel,
      enablePerformanceTracking: env.enablePerformanceTracking,
      performanceSamplingRate: env.performanceSamplingRate,
      enableMetricsPersistence: env.enableMetricsPersistence,
      metricsPersistenceKey: env.metricsPersistenceKey,
      enableCacheService: env.enableCacheService,
      cacheDefaultTtlMs: env.cacheDefaultTtlMs,
      cacheMaxEntries: env.cacheMaxEntries,
      notificationQueueMaxSize: env.notificationQueueDefaultSize
    };
  }
  /**
   * Returns the current value for the given configuration key.
   */
  get(key) {
    return this.values[key];
  }
  /**
   * Updates the configuration value based on Foundry settings and notifies listeners
   * only if the value actually changed.
   */
  setFromFoundry(key, value2) {
    this.updateValue(key, value2);
  }
  /**
   * Registers a listener for the given key. Returns an unsubscribe function.
   */
  onChange(key, listener) {
    const existing = this.getListenersForKey(key);
    const listeners = existing ?? /* @__PURE__ */ new Set();
    listeners.add(listener);
    this.setListenersForKey(key, listeners);
    return () => {
      const activeListeners = this.getListenersForKey(key);
      activeListeners?.delete(listener);
      if (!activeListeners || activeListeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }
  /**
   * Type-safe helper to get listeners for a specific key.
   * @ts-expect-error - Type coverage exclusion for generic Set cast
   */
  getListenersForKey(key) {
    return this.listeners.get(key);
  }
  /**
   * Type-safe helper to set listeners for a specific key.
   * @ts-expect-error - Type coverage exclusion for generic Set cast
   */
  setListenersForKey(key, listeners) {
    this.listeners.set(key, listeners);
  }
  updateValue(key, value2) {
    const current = this.values[key];
    if (Object.is(current, value2)) {
      return;
    }
    this.values[key] = value2;
    const listeners = this.listeners.get(key);
    if (!listeners || listeners.size === 0) {
      return;
    }
    for (const listener of listeners) {
      listener(value2);
    }
  }
};
__name(_RuntimeConfigService, "RuntimeConfigService");
let RuntimeConfigService = _RuntimeConfigService;
function createRuntimeConfig(env) {
  return new RuntimeConfigService(env);
}
__name(createRuntimeConfig, "createRuntimeConfig");
function castCachedServiceInstance(instance2) {
  return instance2;
}
__name(castCachedServiceInstance, "castCachedServiceInstance");
function castCachedServiceInstanceForResult(instance2) {
  if (instance2 === void 0) {
    return err({
      code: "TokenNotRegistered",
      message: "castCachedServiceInstanceForResult: instance must not be undefined. Use castCachedServiceInstance() for optional instances.",
      details: {}
    });
  }
  return ok(instance2);
}
__name(castCachedServiceInstanceForResult, "castCachedServiceInstanceForResult");
function castServiceRegistrationEntry(token, registration) {
  return [token, registration];
}
__name(castServiceRegistrationEntry, "castServiceRegistrationEntry");
function* iterateServiceRegistrationEntries(entries2) {
  for (const [token, registration] of entries2) {
    yield castServiceRegistrationEntry(token, registration);
  }
}
__name(iterateServiceRegistrationEntries, "iterateServiceRegistrationEntries");
function getRegistrationStatus(result) {
  return result.ok ? result.value : false;
}
__name(getRegistrationStatus, "getRegistrationStatus");
function castToFoundryHookCallback(callback) {
  return callback;
}
__name(castToFoundryHookCallback, "castToFoundryHookCallback");
function castResolvedService(value2) {
  return value2;
}
__name(castResolvedService, "castResolvedService");
function castContainerErrorCode(code) {
  return code;
}
__name(castContainerErrorCode, "castContainerErrorCode");
function castContainerTokenToPlatformContainerPortToken(token) {
  return token;
}
__name(castContainerTokenToPlatformContainerPortToken, "castContainerTokenToPlatformContainerPortToken");
const apiSafeTokens = /* @__PURE__ */ new Set();
function markAsApiSafe(token) {
  apiSafeTokens.add(token);
  return token;
}
__name(markAsApiSafe, "markAsApiSafe");
function isApiSafeTokenRuntime(token) {
  return apiSafeTokens.has(token);
}
__name(isApiSafeTokenRuntime, "isApiSafeTokenRuntime");
var ServiceLifecycle = /* @__PURE__ */ ((ServiceLifecycle2) => {
  ServiceLifecycle2["SINGLETON"] = "singleton";
  ServiceLifecycle2["TRANSIENT"] = "transient";
  ServiceLifecycle2["SCOPED"] = "scoped";
  return ServiceLifecycle2;
})(ServiceLifecycle || {});
const _ServiceRegistration = class _ServiceRegistration {
  /**
   * Private constructor - use static factory methods instead.
   * This prevents direct construction with invalid parameters
   * and ensures Result-based error handling.
   */
  constructor(lifecycle, dependencies, providerType, serviceClass, factory, value2, aliasTarget) {
    this.lifecycle = lifecycle;
    this.dependencies = dependencies;
    this.providerType = providerType;
    this.serviceClass = serviceClass;
    this.factory = factory;
    this.value = value2;
    this.aliasTarget = aliasTarget;
  }
  /**
   * Creates a class-based registration.
   * @template Tunknown - The concrete service type
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param serviceClass - The class to instantiate
   * @returns Result with registration or validation error
   */
  static createClass(lifecycle, dependencies, serviceClass) {
    return ok(
      new _ServiceRegistration(
        lifecycle,
        dependencies,
        "class",
        serviceClass,
        void 0,
        void 0,
        void 0
      )
    );
  }
  /**
   * Creates a factory-based registration.
   * @template Tunknown - The concrete service type
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param factory - Factory function that creates instances
   * @returns Result with registration or validation error
   */
  static createFactory(lifecycle, dependencies, factory) {
    if (!factory) {
      return err({
        code: "InvalidOperation",
        message: "factory is required for factory registration"
      });
    }
    return ok(
      new _ServiceRegistration(
        lifecycle,
        dependencies,
        "factory",
        void 0,
        factory,
        void 0,
        void 0
      )
    );
  }
  /**
   * Creates a value-based registration (always SINGLETON).
   * @template Tunknown - The concrete service type
   * @param value - The value to register
   * @returns Result with registration or validation error
   */
  static createValue(value2) {
    if (value2 === void 0) {
      return err({
        code: "InvalidOperation",
        message: "value cannot be undefined for value registration"
      });
    }
    if (typeof value2 === "function") {
      return err({
        code: "InvalidOperation",
        message: "registerValue() only accepts plain values, not functions or classes. Use registerClass() or registerFactory() instead."
      });
    }
    return ok(
      new _ServiceRegistration(ServiceLifecycle.SINGLETON, [], "value", void 0, void 0, value2, void 0)
    );
  }
  /**
   * Creates an alias registration (always SINGLETON).
   * @template Tunknown - The concrete service type
   * @param targetToken - The token to resolve instead
   * @returns Result with registration or validation error
   */
  static createAlias(targetToken) {
    if (!targetToken) {
      return err({
        code: "InvalidOperation",
        message: "targetToken is required for alias registration"
      });
    }
    return ok(
      new _ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [targetToken],
        "alias",
        void 0,
        void 0,
        void 0,
        targetToken
      )
    );
  }
  /**
   * Creates a clone of this registration.
   * Used when child containers inherit registrations from parent.
   *
   * @returns A new ServiceRegistration instance with cloned dependencies array
   */
  clone() {
    return new _ServiceRegistration(
      this.lifecycle,
      [...this.dependencies],
      // Clone array to prevent shared mutations
      this.providerType,
      this.serviceClass,
      this.factory,
      this.value,
      this.aliasTarget
    );
  }
};
__name(_ServiceRegistration, "ServiceRegistration");
let ServiceRegistration = _ServiceRegistration;
const _TypeSafeRegistrationMap = class _TypeSafeRegistrationMap {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  /**
   * Stores a service registration.
   *
   * @template T - The concrete service type
   * @param token - The injection token identifying the service
   * @param registration - The service registration metadata
   */
  set(token, registration) {
    this.map.set(token, registration);
  }
  /**
   * Retrieves a service registration.
   *
   * Type-safe by design: The token's generic parameter guarantees that the
   * returned registration matches the expected service type.
   *
   * @template T - The concrete service type
   * @param token - The injection token identifying the service
   * @returns The service registration or undefined if not found
   */
  get(token) {
    return this.map.get(token);
  }
  /**
   * Checks if a service is registered.
   *
   * @param token - The injection token to check
   * @returns True if the service is registered
   */
  has(token) {
    return this.map.has(token);
  }
  /**
   * Removes a service registration.
   *
   * @param token - The injection token identifying the service
   * @returns True if the service was found and removed
   */
  delete(token) {
    return this.map.delete(token);
  }
  /**
   * Gets the number of registered services.
   *
   * @returns The count of registrations
   */
  get size() {
    return this.map.size;
  }
  /**
   * Removes all service registrations.
   */
  clear() {
    this.map.clear();
  }
  /**
   * Returns an iterator of all registration entries.
   *
   * @returns Iterator of [token, registration] pairs
   */
  entries() {
    return this.map.entries();
  }
  /**
   * Creates a shallow clone of this map.
   * Used when child containers inherit registrations from parent.
   *
   * @returns A new TypeSafeRegistrationMap with cloned entries
   */
  clone() {
    const cloned = new _TypeSafeRegistrationMap();
    this.map.forEach((value2, key) => {
      cloned.map.set(key, value2);
    });
    return cloned;
  }
};
__name(_TypeSafeRegistrationMap, "TypeSafeRegistrationMap");
let TypeSafeRegistrationMap = _TypeSafeRegistrationMap;
function hasDependencies(cls) {
  return "dependencies" in cls;
}
__name(hasDependencies, "hasDependencies");
const _ServiceRegistry = class _ServiceRegistry {
  constructor() {
    this.MAX_REGISTRATIONS = 1e4;
    this.registrations = new TypeSafeRegistrationMap();
    this.lifecycleIndex = /* @__PURE__ */ new Map();
  }
  /**
   * Updates the lifecycle index when a service is registered.
   *
   * @param token - The injection token
   * @param lifecycle - The service lifecycle
   */
  updateLifecycleIndex(token, lifecycle) {
    let tokenSet = this.lifecycleIndex.get(lifecycle);
    if (!tokenSet) {
      tokenSet = /* @__PURE__ */ new Set();
      this.lifecycleIndex.set(lifecycle, tokenSet);
    }
    tokenSet.add(token);
  }
  /**
   * Registers a service class with automatic dependency injection.
   *
   * @template Tunknown - The type of service to register
   * @param token - The injection token identifying this service
   * @param serviceClass - The class to instantiate
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @returns Result indicating success or error
   */
  registerClass(token, serviceClass, lifecycle) {
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token)
      });
    }
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    if (!serviceClass) {
      return err({
        code: "InvalidOperation",
        message: "serviceClass is required for class registration"
      });
    }
    const dependencies = hasDependencies(serviceClass) ? serviceClass.dependencies ?? [] : [];
    const registrationResult = ServiceRegistration.createClass(
      lifecycle,
      dependencies,
      serviceClass
    );
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(token, registrationResult.value);
    this.updateLifecycleIndex(token, lifecycle);
    return ok(void 0);
  }
  /**
   * Registers a factory function for creating service instances.
   *
   * @template Tunknown - The type of service this factory creates
   * @param token - The injection token identifying this service
   * @param factory - Factory function that creates instances
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of tokens this factory depends on
   * @returns Result indicating success or error
   */
  registerFactory(token, factory, lifecycle, dependencies) {
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token)
      });
    }
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    const registrationResult = ServiceRegistration.createFactory(
      lifecycle,
      dependencies,
      factory
    );
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(token, registrationResult.value);
    this.updateLifecycleIndex(token, lifecycle);
    return ok(void 0);
  }
  /**
   * Registers a constant value (always SINGLETON lifecycle).
   *
   * @template Tunknown - The type of value to register
   * @param token - The injection token identifying this value
   * @param value - The value to register
   * @returns Result indicating success or error
   */
  registerValue(token, value2) {
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token)
      });
    }
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token)
      });
    }
    const registrationResult = ServiceRegistration.createValue(value2);
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(token, registrationResult.value);
    this.updateLifecycleIndex(token, ServiceLifecycle.SINGLETON);
    return ok(void 0);
  }
  /**
   * Registers an alias that points to another token.
   *
   * @template Tunknown - The type of service
   * @param aliasToken - The alias token
   * @param targetToken - The token to resolve instead
   * @returns Result indicating success or error
   */
  registerAlias(aliasToken, targetToken) {
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(aliasToken)
      });
    }
    if (this.registrations.has(aliasToken)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(aliasToken)} already registered`,
        tokenDescription: String(aliasToken)
      });
    }
    const registrationResult = ServiceRegistration.createAlias(targetToken);
    if (isErr(registrationResult)) {
      return registrationResult;
    }
    this.registrations.set(aliasToken, registrationResult.value);
    return ok(void 0);
  }
  /**
   * Retrieves a service registration.
   *
   * @template Tunknown - The type of service
   * @param token - The injection token identifying the service
   * @returns The registration or undefined if not found
   */
  getRegistration(token) {
    return this.registrations.get(token);
  }
  /**
   * Returns all registrations.
   * Used by ContainerValidator for dependency validation.
   *
   * @returns Map of all registrations
   */
  getAllRegistrations() {
    return new Map(iterateServiceRegistrationEntries(this.registrations.entries()));
  }
  /**
   * Returns all registrations for a specific lifecycle.
   * More efficient than filtering getAllRegistrations() when only one lifecycle is needed.
   *
   * @param lifecycle - The lifecycle to query
   * @returns Array of registrations with the specified lifecycle
   */
  getRegistrationsByLifecycle(lifecycle) {
    const tokens = this.lifecycleIndex.get(lifecycle) ?? /* @__PURE__ */ new Set();
    return Array.from(tokens).map((token) => this.registrations.get(token)).filter((reg) => reg !== void 0);
  }
  /**
   * Checks if a service is registered.
   *
   * @template Tunknown - The type of service
   * @param token - The injection token to check
   * @returns True if registered, false otherwise
   */
  has(token) {
    return this.registrations.has(token);
  }
  /**
   * Clears all registrations.
   * Warning: This removes all configured services.
   */
  clear() {
    this.registrations.clear();
    this.lifecycleIndex.clear();
  }
  /**
   * Creates a deep clone of this registry for child containers.
   *
   * Important: Creates a new Map instance with cloned ServiceRegistration objects
   * to prevent child containers from mutating parent registrations.
   *
   * @returns A new ServiceRegistry with cloned registrations
   */
  clone() {
    const clonedRegistry = new _ServiceRegistry();
    for (const [token, registration] of iterateServiceRegistrationEntries(
      this.registrations.entries()
    )) {
      clonedRegistry.registrations.set(token, registration.clone());
    }
    for (const [lifecycle, tokens] of this.lifecycleIndex.entries()) {
      clonedRegistry.lifecycleIndex.set(lifecycle, new Set(tokens));
    }
    return clonedRegistry;
  }
};
__name(_ServiceRegistry, "ServiceRegistry");
let ServiceRegistry = _ServiceRegistry;
const _ContainerValidator = class _ContainerValidator {
  constructor() {
    this.validatedSubgraphs = /* @__PURE__ */ new Set();
  }
  /**
   * Validates all registrations in the registry.
   *
   * Performs three checks:
   * 1. All dependencies are registered
   * 2. All alias targets exist
   * 3. No circular dependencies
   *
   * @param registry - The service registry to validate
   * @returns Result with void on success, or array of errors
   */
  validate(registry) {
    this.validatedSubgraphs = /* @__PURE__ */ new Set();
    const errors = [
      ...this.validateDependencies(registry),
      ...this.validateAliasTargets(registry),
      ...this.detectCircularDependencies(registry)
    ];
    return errors.length > 0 ? err(errors) : ok(void 0);
  }
  /**
   * Checks that all declared dependencies are registered.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for missing dependencies
   */
  validateDependencies(registry) {
    const errors = [];
    const registrations = registry.getAllRegistrations();
    for (const [token, registration] of registrations.entries()) {
      for (const dep of registration.dependencies) {
        if (!registry.has(dep)) {
          errors.push({
            code: "TokenNotRegistered",
            message: `${String(token)} depends on ${String(dep)} which is not registered`,
            tokenDescription: String(dep)
          });
        }
      }
    }
    return errors;
  }
  /**
   * Checks that all alias targets are registered.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for missing alias targets
   */
  validateAliasTargets(registry) {
    const errors = [];
    const registrations = registry.getAllRegistrations();
    for (const [token, registration] of registrations.entries()) {
      if (registration.providerType === "alias" && registration.aliasTarget) {
        if (!registry.has(registration.aliasTarget)) {
          errors.push({
            code: "AliasTargetNotFound",
            message: `Alias ${String(token)} points to ${String(registration.aliasTarget)} which is not registered`,
            tokenDescription: String(registration.aliasTarget)
          });
        }
      }
    }
    return errors;
  }
  /**
   * Detects circular dependencies using depth-first search.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for detected cycles
   */
  detectCircularDependencies(registry) {
    const errors = [];
    const visited = /* @__PURE__ */ new Set();
    const registrations = registry.getAllRegistrations();
    for (const token of registrations.keys()) {
      const visiting = /* @__PURE__ */ new Set();
      const path = [];
      const error = this.checkCycleForToken(registry, token, visiting, visited, path);
      if (error) {
        errors.push(error);
      }
    }
    return errors;
  }
  /**
   * Recursively checks for cycles starting from a specific token.
   *
   * **Algorithm: Depth-First Search (DFS) with Three-Color Marking**
   *
   * Three states for each node (token):
   * - WHITE (unvisited): Not in `visiting` or `visited` sets
   * - GRAY (visiting): In `visiting` set (currently in DFS recursion stack)
   * - BLACK (visited): In `visited` set (fully processed, all descendants checked)
   *
   * Cycle Detection:
   * - If we encounter a GRAY node during traversal, we've found a back edge → cycle
   * - GRAY nodes represent the current path from root to current node
   * - Encountering a GRAY node means we're trying to visit an ancestor → circular dependency
   *
   * Performance Optimization:
   * - `validatedSubgraphs` cache prevents redundant traversals of already-validated subtrees
   * - Crucial for large dependency graphs (>500 services)
   * - BLACK nodes can be safely skipped (all their descendants are cycle-free)
   *
   * Time Complexity: O(V + E) where V = number of services, E = number of dependencies
   * Space Complexity: O(V) for visiting/visited sets + O(D) for recursion depth D
   *
   * @param registry - The service registry
   * @param token - Current token being checked (current node in DFS)
   * @param visiting - GRAY nodes: tokens currently in the DFS recursion stack
   * @param visited - BLACK nodes: tokens fully processed in this validation run
   * @param path - Current dependency path for error reporting (stack trace)
   * @returns ContainerError if cycle detected, null otherwise
   *
   * @example
   * Cycle A → B → C → A will be detected when:
   * 1. Start at A (mark GRAY)
   * 2. Visit B (mark GRAY)
   * 3. Visit C (mark GRAY)
   * 4. Try to visit A → A is GRAY → Back edge detected → Cycle!
   */
  checkCycleForToken(registry, token, visiting, visited, path) {
    if (visiting.has(token)) {
      const cyclePath = [...path, token].map(String).join(" → ");
      return {
        code: "CircularDependency",
        message: `Circular dependency: ${cyclePath}`,
        tokenDescription: String(token)
      };
    }
    if (this.validatedSubgraphs.has(token)) {
      return null;
    }
    if (visited.has(token)) {
      return null;
    }
    visiting.add(token);
    path.push(token);
    const registration = registry.getRegistration(token);
    if (registration) {
      for (const dep of registration.dependencies) {
        const error = this.checkCycleForToken(registry, dep, visiting, visited, path);
        if (error) return error;
      }
    }
    visiting.delete(token);
    path.pop();
    visited.add(token);
    this.validatedSubgraphs.add(token);
    return null;
  }
};
__name(_ContainerValidator, "ContainerValidator");
let ContainerValidator = _ContainerValidator;
const _InstanceCache = class _InstanceCache {
  constructor() {
    this.instances = /* @__PURE__ */ new Map();
    this.metricsCollector = null;
  }
  /**
   * Injects the MetricsCollector for cache hit/miss tracking.
   * Called after container validation to enable observability.
   *
   * @param collector - The metrics collector instance
   */
  setMetricsCollector(collector) {
    this.metricsCollector = collector;
  }
  /**
   * Retrieves a cached service instance.
   *
   * @template Tunknown - The type of service to retrieve
   * @param token - The injection token identifying the service
   * @returns The cached instance or undefined if not found
   */
  get(token) {
    const hasInstance = this.instances.has(token);
    this.metricsCollector?.recordCacheAccess(hasInstance);
    return castCachedServiceInstance(this.instances.get(token));
  }
  /**
   * Stores a service instance in the cache.
   *
   * @template Tunknown - The type of service to store
   * @param token - The injection token identifying the service
   * @param instance - The service instance to cache
   */
  set(token, instance2) {
    this.instances.set(token, instance2);
  }
  /**
   * Checks if a service instance is cached.
   *
   * @template Tunknown - The type of service to check
   * @param token - The injection token identifying the service
   * @returns True if the instance is cached, false otherwise
   */
  has(token) {
    const hasInstance = this.instances.has(token);
    this.metricsCollector?.recordCacheAccess(hasInstance);
    return hasInstance;
  }
  /**
   * Clears all cached instances.
   * Note: Does not dispose instances - call getAllInstances() first if disposal is needed.
   */
  clear() {
    this.instances.clear();
  }
  /**
   * Returns all cached instances for disposal purposes.
   * Used by ScopeManager to dispose Disposable services.
   *
   * @returns A map of all cached instances
   */
  getAllInstances() {
    return new Map(this.instances);
  }
};
__name(_InstanceCache, "InstanceCache");
let InstanceCache = _InstanceCache;
const _SingletonResolutionStrategy = class _SingletonResolutionStrategy {
  resolve(token, registration, dependencyResolver, instantiator, cache, parentResolver, _scopeName) {
    if (parentResolver !== null) {
      const parentResult = parentResolver.resolve(token);
      if (parentResult.ok) {
        return parentResult;
      }
      if (parentResult.error.code === "CircularDependency") {
        return parentResult;
      }
    }
    if (!cache.has(token)) {
      const instanceResult2 = instantiator.instantiate(token, registration);
      if (!instanceResult2.ok) {
        return instanceResult2;
      }
      cache.set(token, instanceResult2.value);
    }
    const instanceResult = castCachedServiceInstanceForResult(cache.get(token));
    if (!instanceResult.ok) {
      return instanceResult;
    }
    return ok(instanceResult.value);
  }
};
__name(_SingletonResolutionStrategy, "SingletonResolutionStrategy");
let SingletonResolutionStrategy = _SingletonResolutionStrategy;
const _TransientResolutionStrategy = class _TransientResolutionStrategy {
  resolve(token, registration, _dependencyResolver, instantiator, _cache, _parentResolver, _scopeName) {
    return instantiator.instantiate(token, registration);
  }
};
__name(_TransientResolutionStrategy, "TransientResolutionStrategy");
let TransientResolutionStrategy = _TransientResolutionStrategy;
const _ScopedResolutionStrategy = class _ScopedResolutionStrategy {
  resolve(token, registration, _dependencyResolver, instantiator, cache, parentResolver, _scopeName) {
    if (parentResolver === null) {
      return err({
        code: "ScopeRequired",
        message: `Scoped service ${String(token)} requires a scope container. Use createScope() to create a child container first.`,
        tokenDescription: String(token)
      });
    }
    if (!cache.has(token)) {
      const instanceResult2 = instantiator.instantiate(token, registration);
      if (!instanceResult2.ok) {
        return instanceResult2;
      }
      cache.set(token, instanceResult2.value);
    }
    const instanceResult = castCachedServiceInstanceForResult(cache.get(token));
    if (!instanceResult.ok) {
      return instanceResult;
    }
    return ok(instanceResult.value);
  }
};
__name(_ScopedResolutionStrategy, "ScopedResolutionStrategy");
let ScopedResolutionStrategy = _ScopedResolutionStrategy;
const _LifecycleResolver = class _LifecycleResolver {
  constructor(cache, parentResolver, scopeName) {
    this.cache = cache;
    this.parentResolver = parentResolver;
    this.scopeName = scopeName;
    this.strategies = /* @__PURE__ */ new Map();
    this.strategies.set(ServiceLifecycle.SINGLETON, new SingletonResolutionStrategy());
    this.strategies.set(ServiceLifecycle.TRANSIENT, new TransientResolutionStrategy());
    this.strategies.set(ServiceLifecycle.SCOPED, new ScopedResolutionStrategy());
  }
  /**
   * Resolves a service based on its lifecycle.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token identifying the service
   * @param registration - The service registration metadata
   * @param dependencyResolver - The DependencyResolver for dependency resolution
   * @param instantiator - The ServiceInstantiator for service instantiation
   * @returns Result with service instance or error
   */
  resolve(token, registration, dependencyResolver, instantiator) {
    const strategy = this.strategies.get(registration.lifecycle);
    if (!strategy) {
      return err({
        code: "InvalidLifecycle",
        message: `Invalid service lifecycle: ${String(registration.lifecycle)}`,
        tokenDescription: String(token)
      });
    }
    return strategy.resolve(
      token,
      registration,
      dependencyResolver,
      instantiator,
      this.cache,
      this.parentResolver,
      this.scopeName
    );
  }
};
__name(_LifecycleResolver, "LifecycleResolver");
let LifecycleResolver = _LifecycleResolver;
const _ServiceInstantiatorImpl = class _ServiceInstantiatorImpl {
  constructor(dependencyResolver) {
    this.dependencyResolver = dependencyResolver;
  }
  /**
   * Instantiates a service based on registration type.
   *
   * CRITICAL: Returns Result to preserve error context and avoid breaking Result-Contract.
   * Handles dependency resolution for classes, direct factory calls, and value returns.
   *
   * @template T - The type of service to instantiate
   * @param token - The injection token (used for error messages)
   * @param registration - The service registration metadata
   * @returns Result with instance or detailed error (DependencyResolveFailed, FactoryFailed, etc.)
   */
  instantiate(token, registration) {
    if (registration.serviceClass) {
      const resolvedDeps = [];
      for (const dep of registration.dependencies) {
        const depResult = this.dependencyResolver.resolve(dep);
        if (!depResult.ok) {
          return err({
            code: "DependencyResolveFailed",
            message: `Cannot resolve dependency ${String(dep)} for ${String(token)}`,
            tokenDescription: String(dep),
            cause: depResult.error
          });
        }
        resolvedDeps.push(depResult.value);
      }
      try {
        return ok(new registration.serviceClass(...resolvedDeps));
      } catch (constructorError) {
        return err({
          code: "FactoryFailed",
          message: `Constructor failed for ${String(token)}: ${String(constructorError)}`,
          tokenDescription: String(token),
          cause: constructorError
        });
      }
    } else if (registration.factory) {
      try {
        return ok(registration.factory());
      } catch (factoryError) {
        return err({
          code: "FactoryFailed",
          message: `Factory failed for ${String(token)}: ${String(factoryError)}`,
          tokenDescription: String(token),
          cause: factoryError
        });
      }
    } else if (registration.value !== void 0) {
      return ok(registration.value);
    } else {
      return err({
        code: "InvalidOperation",
        message: `Invalid registration for ${String(token)} - no class, factory, or value`,
        tokenDescription: String(token)
      });
    }
  }
};
__name(_ServiceInstantiatorImpl, "ServiceInstantiatorImpl");
let ServiceInstantiatorImpl = _ServiceInstantiatorImpl;
const _ServiceResolver = class _ServiceResolver {
  constructor(registry, cache, parentResolver, scopeName, performanceTracker) {
    this.registry = registry;
    this.cache = cache;
    this.parentResolver = parentResolver;
    this.scopeName = scopeName;
    this.performanceTracker = performanceTracker;
    this.metricsCollector = null;
    this.lifecycleResolver = new LifecycleResolver(cache, parentResolver, scopeName);
    this.instantiator = new ServiceInstantiatorImpl(this);
  }
  /**
   * Sets the MetricsCollector for metrics recording.
   * Called by ServiceContainer after validation.
   *
   * @param collector - The metrics collector instance
   */
  setMetricsCollector(collector) {
    this.metricsCollector = collector;
  }
  /**
   * Resolves a service by token.
   *
   * Handles:
   * - Alias resolution (recursive)
   * - Lifecycle-specific resolution (delegated to LifecycleResolver)
   * - Performance tracking
   * - Metrics recording
   *
   * Performance tracking is handled by the injected PerformanceTracker.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns Result with service instance or error
   */
  resolve(token) {
    return this.performanceTracker.track(
      () => {
        const registration = this.registry.getRegistration(token);
        if (!registration) {
          const stack = new Error().stack;
          const error = {
            code: "TokenNotRegistered",
            message: `Service ${String(token)} not registered`,
            tokenDescription: String(token),
            ...stack !== void 0 && { stack },
            // Only include stack if defined
            timestamp: Date.now(),
            containerScope: this.scopeName
          };
          return err(error);
        }
        if (registration.providerType === "alias" && registration.aliasTarget) {
          return this.resolve(registration.aliasTarget);
        }
        return this.lifecycleResolver.resolve(token, registration, this, this);
      },
      (duration, result) => {
        this.metricsCollector?.recordResolution(token, duration, result.ok);
      }
    );
  }
  /**
   * Instantiates a service based on registration type.
   *
   * CRITICAL: Returns Result to preserve error context and avoid breaking Result-Contract.
   * Delegates to ServiceInstantiatorImpl for actual instantiation logic.
   *
   * This method implements the ServiceInstantiator interface, allowing lifecycle
   * strategies to instantiate services without depending on ServiceResolver directly.
   *
   * @template T - The type of service to instantiate
   * @param token - The injection token (used for error messages)
   * @param registration - The service registration metadata
   * @returns Result with instance or detailed error (DependencyResolveFailed, FactoryFailed, etc.)
   */
  instantiate(token, registration) {
    return this.instantiator.instantiate(token, registration);
  }
};
__name(_ServiceResolver, "ServiceResolver");
let ServiceResolver = _ServiceResolver;
function generateScopeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now() + "-" + Math.random();
  }
}
__name(generateScopeId, "generateScopeId");
const _ScopeManager = class _ScopeManager {
  // Unique correlation ID for tracing
  constructor(scopeName, parent, cache, depth = 0) {
    this.scopeName = scopeName;
    this.parent = parent;
    this.cache = cache;
    this.MAX_SCOPE_DEPTH = 10;
    this.children = /* @__PURE__ */ new Set();
    this.disposed = false;
    this.depth = depth;
    this.scopeId = `${scopeName}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  /**
   * Creates a child scope manager.
   *
   * Note: Returns data (scopeName, cache, childManager) instead of full container
   * to avoid circular dependency with ServiceResolver.
   *
   * @param name - Optional custom name for the scope
   * @returns Result with child scope data or error if disposed or max depth exceeded
   */
  createChild(name) {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Cannot create child scope from disposed scope: ${this.scopeName}`
      });
    }
    if (this.depth >= this.MAX_SCOPE_DEPTH) {
      return err({
        code: "MaxScopeDepthExceeded",
        message: `Maximum scope depth of ${this.MAX_SCOPE_DEPTH} exceeded. Current depth: ${this.depth}`
      });
    }
    const uniqueId = name ?? `scope-${generateScopeId()}`;
    const childScopeName = `${this.scopeName}.${uniqueId}`;
    const childCache = new InstanceCache();
    const childManager = new _ScopeManager(childScopeName, this, childCache, this.depth + 1);
    this.children.add(childManager);
    return ok({
      scopeName: childScopeName,
      cache: childCache,
      manager: childManager
    });
  }
  /**
   * Disposes this scope and all child scopes.
   *
   * Disposal order (critical):
   * 1. Recursively dispose all children
   * 2. Dispose instances in this scope (if Disposable)
   * 3. Clear instance cache
   * 4. Remove from parent's children set
   *
   * @returns Result indicating success or disposal error
   */
  dispose() {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Scope already disposed: ${this.scopeName}`
      });
    }
    this.disposed = true;
    const childDisposalErrors = [];
    for (const child of this.children) {
      const childResult = child.dispose();
      if (isErr(childResult)) {
        childDisposalErrors.push({
          scopeName: child.scopeName,
          error: childResult.error
        });
      }
    }
    const disposeResult = this.disposeInstances();
    if (!disposeResult.ok) {
      return disposeResult;
    }
    this.cache.clear();
    if (this.parent !== null) {
      this.parent.children.delete(this);
    }
    if (childDisposalErrors.length > 0) {
      return err({
        code: "PartialDisposal",
        message: `Failed to dispose ${childDisposalErrors.length} child scope(s)`,
        details: childDisposalErrors
      });
    }
    return ok(void 0);
  }
  /**
   * Asynchronously disposes this scope and all child scopes.
   *
   * Preferred method for cleanup as it properly handles async dispose operations.
   * Falls back to sync dispose() for services that only implement Disposable.
   *
   * Disposal order (critical):
   * 1. Recursively dispose all children (async)
   * 2. Dispose instances in this scope (async or sync)
   * 3. Clear instance cache
   * 4. Remove from parent's children set
   *
   * @returns Promise with Result indicating success or disposal error
   */
  async disposeAsync() {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Scope already disposed: ${this.scopeName}`
      });
    }
    this.disposed = true;
    const childDisposalErrors = [];
    for (const child of this.children) {
      const childResult = await child.disposeAsync();
      if (isErr(childResult)) {
        childDisposalErrors.push({
          scopeName: child.scopeName,
          error: childResult.error
        });
      }
    }
    const disposeResult = await this.disposeInstancesAsync();
    if (!disposeResult.ok) {
      return disposeResult;
    }
    this.cache.clear();
    if (this.parent !== null) {
      this.parent.children.delete(this);
    }
    if (childDisposalErrors.length > 0) {
      return err({
        code: "PartialDisposal",
        message: `Failed to dispose ${childDisposalErrors.length} child scope(s)`,
        details: childDisposalErrors
      });
    }
    return ok(void 0);
  }
  /**
   * Disposes all instances in the cache that implement Disposable (sync).
   *
   * @returns Result indicating success or disposal error
   */
  disposeInstances() {
    const instances = this.cache.getAllInstances();
    for (const [token, instance2] of instances.entries()) {
      if (this.isDisposable(instance2)) {
        const result = tryCatch(
          () => instance2.dispose(),
          (error) => ({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error
          })
        );
        if (isErr(result)) {
          return result;
        }
      }
    }
    return ok(void 0);
  }
  /**
   * Disposes all instances in the cache that implement Disposable or AsyncDisposable (async).
   * Prefers async disposal when available, falls back to sync.
   *
   * @returns Promise with Result indicating success or disposal error
   */
  async disposeInstancesAsync() {
    const instances = this.cache.getAllInstances();
    for (const [token, instance2] of instances.entries()) {
      if (this.isAsyncDisposable(instance2)) {
        try {
          await instance2.disposeAsync();
        } catch (error) {
          return err({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error
          });
        }
      } else if (this.isDisposable(instance2)) {
        const disposableInstance = instance2;
        const result = tryCatch(
          () => disposableInstance.dispose(),
          (error) => ({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error
          })
        );
        if (isErr(result)) {
          return result;
        }
      }
    }
    return ok(void 0);
  }
  /**
   * Type guard to check if an instance implements the Disposable pattern.
   *
   * @param instance - The service instance to check
   * @returns True if instance has dispose() method
   */
  isDisposable(instance2) {
    return instance2 !== null && typeof instance2 === "object" && "dispose" in instance2 && // Type-safe check: instance has 'dispose' property (checked above)
    typeof instance2.dispose === "function";
  }
  /**
   * Type guard to check if an instance implements the AsyncDisposable pattern.
   *
   * @param instance - The service instance to check
   * @returns True if instance has disposeAsync() method
   */
  isAsyncDisposable(instance2) {
    return instance2 !== null && typeof instance2 === "object" && "disposeAsync" in instance2 && // Type-safe check: instance has 'disposeAsync' property (checked above)
    typeof instance2.disposeAsync === "function";
  }
  /**
   * Checks if this scope is disposed.
   *
   * @returns True if disposed, false otherwise
   */
  isDisposed() {
    return this.disposed;
  }
  /**
   * Gets the hierarchical scope name.
   *
   * @returns The scope name (e.g., "root.child1.grandchild")
   */
  getScopeName() {
    return this.scopeName;
  }
  /**
   * Gets the unique correlation ID for this scope.
   *
   * Useful for tracing and logging in distributed/concurrent scenarios.
   * Each scope gets a unique ID combining name, timestamp, and random string.
   *
   * @returns The unique scope ID (e.g., "root-1730761234567-abc123")
   *
   * @example
   * ```typescript
   * const scope = container.createScope("request").value!;
   * logger.info(`[${scope.getScopeId()}] Processing request`);
   * ```
   */
  getScopeId() {
    return this.scopeId;
  }
};
__name(_ScopeManager, "ScopeManager");
let ScopeManager = _ScopeManager;
const _TimeoutError = class _TimeoutError extends Error {
  constructor(timeoutMs) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
};
__name(_TimeoutError, "TimeoutError");
let TimeoutError = _TimeoutError;
function withTimeout(promise2, timeoutMs) {
  let timeoutHandle = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
  });
  return Promise.race([
    promise2.finally(() => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    }),
    timeoutPromise
  ]);
}
__name(withTimeout, "withTimeout");
const metricsCollectorToken = createInjectionToken("MetricsCollector");
const _ServiceRegistrationManager = class _ServiceRegistrationManager {
  constructor(registry, isDisposed, getValidationState) {
    this.registry = registry;
    this.isDisposed = isDisposed;
    this.getValidationState = getValidationState;
  }
  /**
   * Register a service class with automatic dependency injection.
   */
  registerClass(token, serviceClass, lifecycle) {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token)
      });
    }
    if (this.getValidationState() === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    return this.registry.registerClass(token, serviceClass, lifecycle);
  }
  /**
   * Register a factory function.
   */
  registerFactory(token, factory, lifecycle, dependencies) {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token)
      });
    }
    if (this.getValidationState() === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    if (!factory || typeof factory !== "function") {
      return err({
        code: "InvalidFactory",
        message: "Factory must be a function",
        tokenDescription: String(token)
      });
    }
    return this.registry.registerFactory(token, factory, lifecycle, dependencies);
  }
  /**
   * Register a constant value.
   */
  registerValue(token, value2) {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token)
      });
    }
    if (this.getValidationState() === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    return this.registry.registerValue(token, value2);
  }
  /**
   * Register an alias.
   */
  registerAlias(aliasToken, targetToken) {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(aliasToken)
      });
    }
    if (this.getValidationState() === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation"
      });
    }
    return this.registry.registerAlias(aliasToken, targetToken);
  }
  /**
   * Get a registered value without requiring validation.
   * Useful for bootstrap/static values.
   */
  getRegisteredValue(token) {
    const registration = this.registry.getRegistration(token);
    if (!registration) {
      return null;
    }
    if (registration.providerType !== "value") {
      return null;
    }
    const value2 = registration.value;
    if (value2 === void 0) {
      return null;
    }
    return value2;
  }
  /**
   * Check if a service is registered.
   */
  isRegistered(token) {
    return this.registry.has(token);
  }
};
__name(_ServiceRegistrationManager, "ServiceRegistrationManager");
let ServiceRegistrationManager = _ServiceRegistrationManager;
const _ContainerValidationManager = class _ContainerValidationManager {
  constructor(validator, registry, initialState = "registering") {
    this.validator = validator;
    this.registry = registry;
    this.validationPromise = null;
    this.validationState = initialState;
  }
  /**
   * Validate all registrations.
   */
  validate() {
    if (this.validationState === "validated") {
      return ok(void 0);
    }
    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress"
        }
      ]);
    }
    this.validationState = "validating";
    const result = this.validator.validate(this.registry);
    if (result.ok) {
      this.validationState = "validated";
    } else {
      this.validationState = "registering";
    }
    return result;
  }
  /**
   * Async-safe validation for concurrent environments with timeout.
   */
  async validateAsync(timeoutMs, withTimeout2, TimeoutErrorClass) {
    if (this.validationState === "validated") {
      return ok(void 0);
    }
    if (this.validationPromise !== null) {
      return this.validationPromise;
    }
    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress"
        }
      ]);
    }
    this.validationState = "validating";
    let timedOut = false;
    const validationTask = Promise.resolve().then(() => {
      const result = this.validator.validate(this.registry);
      if (!timedOut) {
        if (result.ok) {
          this.validationState = "validated";
        } else {
          this.validationState = "registering";
        }
      }
      return result;
    });
    try {
      this.validationPromise = withTimeout2(validationTask, timeoutMs);
      const result = await this.validationPromise;
      return result;
    } catch (error) {
      if (error instanceof TimeoutErrorClass) {
        timedOut = true;
        this.validationState = "registering";
        return err([
          {
            code: "InvalidOperation",
            message: `Validation timed out after ${timeoutMs}ms`
          }
        ]);
      }
      throw error;
    } finally {
      this.validationPromise = null;
    }
  }
  /**
   * Get validation state.
   */
  getValidationState() {
    return this.validationState;
  }
  /**
   * Reset validation state (used after disposal or clear).
   */
  resetValidationState() {
    this.validationState = "registering";
  }
};
__name(_ContainerValidationManager, "ContainerValidationManager");
let ContainerValidationManager = _ContainerValidationManager;
const _ServiceResolutionManager = class _ServiceResolutionManager {
  constructor(resolver, isDisposed, getValidationState) {
    this.resolver = resolver;
    this.isDisposed = isDisposed;
    this.getValidationState = getValidationState;
  }
  resolveWithError(token) {
    if (this.isDisposed()) {
      const error = {
        code: "Disposed",
        message: `Cannot resolve from disposed container`,
        tokenDescription: String(token)
      };
      const domainError = {
        code: error.code,
        message: error.message,
        cause: error.cause
      };
      return err(domainError);
    }
    if (this.getValidationState() !== "validated") {
      const error = {
        code: "NotValidated",
        message: "Container must be validated before resolving. Call validate() first.",
        tokenDescription: String(token)
      };
      const domainError = {
        code: error.code,
        message: error.message,
        cause: error.cause
      };
      return err(domainError);
    }
    const result = this.resolver.resolve(token);
    if (!result.ok) {
      const domainError = {
        code: result.error.code,
        message: result.error.message,
        cause: result.error.cause
      };
      return err(domainError);
    }
    return result;
  }
  /**
   * Resolves a service instance (throws on failure).
   * FOR EXTERNAL API USE ONLY - uses ApiSafeToken validation.
   */
  resolve(token) {
    const result = this.resolveWithError(token);
    if (isOk(result)) {
      return castResolvedService(result.value);
    }
    throw new Error(`Cannot resolve ${String(token)}: ${result.error.message}`);
  }
};
__name(_ServiceResolutionManager, "ServiceResolutionManager");
let ServiceResolutionManager = _ServiceResolutionManager;
const _ScopeManagementFacade = class _ScopeManagementFacade {
  constructor(scopeManager, isDisposed, getValidationState) {
    this.scopeManager = scopeManager;
    this.isDisposed = isDisposed;
    this.getValidationState = getValidationState;
  }
  /**
   * Validates that a scope can be created.
   * Returns the scope creation result if valid, or an error if not.
   */
  validateScopeCreation(name) {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot create scope from disposed container`
      });
    }
    if (this.getValidationState() !== "validated") {
      return err({
        code: "NotValidated",
        message: "Parent must be validated before creating scopes. Call validate() first."
      });
    }
    return this.scopeManager.createChild(name);
  }
};
__name(_ScopeManagementFacade, "ScopeManagementFacade");
let ScopeManagementFacade = _ScopeManagementFacade;
const _MetricsInjectionManager = class _MetricsInjectionManager {
  constructor(resolver, cache, resolveMetricsCollector) {
    this.resolver = resolver;
    this.cache = cache;
    this.resolveMetricsCollector = resolveMetricsCollector;
  }
  /**
   * Injects MetricsCollector into resolver and cache after validation.
   * This enables metrics recording without circular dependencies during bootstrap.
   *
   * Note: EnvironmentConfig is already injected via BootstrapPerformanceTracker
   * during container creation, so only MetricsCollector needs to be injected here.
   */
  injectMetricsCollector() {
    return ok(void 0);
  }
  /**
   * Internal method to perform the actual injection.
   * Called by ServiceContainer after resolving the metrics collector.
   */
  performInjection(collector) {
    this.resolver.setMetricsCollector(collector);
    this.cache.setMetricsCollector(collector);
  }
};
__name(_MetricsInjectionManager, "MetricsInjectionManager");
let MetricsInjectionManager = _MetricsInjectionManager;
const _ApiSecurityManager = class _ApiSecurityManager {
  /**
   * Validates that a token is API-safe.
   * Used by container.resolve() to enforce API boundary.
   *
   * @param token - The token to validate
   * @returns Result indicating if token is API-safe
   */
  validateApiSafeToken(token) {
    if (!isApiSafeTokenRuntime(token)) {
      return err({
        code: "InvalidOperation",
        message: `API Boundary Violation: resolve() called with non-API-safe token: ${String(token)}.
This token was not marked via markAsApiSafe().

Internal code MUST use resolveWithError() instead:
  const result = container.resolveWithError(${String(token)});
  if (result.ok) { /* use result.value */ }

Only the public ModuleApi should expose resolve() for external modules.`,
        tokenDescription: String(token)
      });
    }
    return { ok: true, value: void 0 };
  }
};
__name(_ApiSecurityManager, "ApiSecurityManager");
let ApiSecurityManager = _ApiSecurityManager;
const _ServiceContainer = class _ServiceContainer {
  /**
   * Private constructor - use ServiceContainer.createRoot() instead.
   *
   * This constructor is private to:
   * - Enforce factory pattern usage
   * - Prevent constructor throws (Result-Contract-breaking)
   * - Make child creation explicit through createScope()
   *
   * @param registry - Service registry
   * @param validator - Container validator (shared for parent/child)
   * @param cache - Instance cache
   * @param resolver - Service resolver
   * @param scopeManager - Scope manager
   * @param validationState - Initial validation state
   * @param env - Environment configuration
   */
  constructor(registry, validator, cache, resolver, scopeManager, validationState, env) {
    this.registry = registry;
    this.validator = validator;
    this.cache = cache;
    this.resolver = resolver;
    this.scopeManager = scopeManager;
    this.env = env;
    this.validationManager = new ContainerValidationManager(validator, registry, validationState);
    this.registrationManager = new ServiceRegistrationManager(
      registry,
      () => this.scopeManager.isDisposed(),
      () => this.validationManager.getValidationState()
    );
    this.resolutionManager = new ServiceResolutionManager(
      resolver,
      () => this.scopeManager.isDisposed(),
      () => this.validationManager.getValidationState()
    );
    this.metricsInjectionManager = new MetricsInjectionManager(resolver, cache, (token) => {
      const result = this.resolutionManager.resolveWithError(token);
      if (!result.ok) {
        const containerError = {
          code: castContainerErrorCode(result.error.code),
          message: result.error.message,
          cause: result.error.cause,
          tokenDescription: String(token)
        };
        return err(containerError);
      }
      const metricsCollector = castResolvedService(result.value);
      return ok(metricsCollector);
    });
    this.apiSecurityManager = new ApiSecurityManager();
    this.scopeFacade = new ScopeManagementFacade(
      scopeManager,
      () => this.scopeManager.isDisposed(),
      () => this.validationManager.getValidationState()
    );
  }
  /**
   * Creates a new root container.
   *
   * This is the preferred way to create containers.
   * All components are created fresh for the root container.
   *
   * **Bootstrap Performance Tracking:**
   * Uses BootstrapPerformanceTracker with RuntimeConfigService(env) und null MetricsCollector.
   * MetricsCollector is injected later via setMetricsCollector() after validation.
   *
   * @param env - Environment configuration (required for bootstrap performance tracking)
   * @returns A new root ServiceContainer
   *
   * @example
   * ```typescript
   * const container = ServiceContainer.createRoot(ENV);
   * container.registerClass(LoggerToken, Logger, SINGLETON);
   * container.validate();
   * ```
   */
  static createRoot(env) {
    const registry = new ServiceRegistry();
    const validator = new ContainerValidator();
    const cache = new InstanceCache();
    const scopeManager = new ScopeManager("root", null, cache);
    const performanceTracker = new BootstrapPerformanceTracker(createRuntimeConfig(env), null);
    const resolver = new ServiceResolver(registry, cache, null, "root", performanceTracker);
    return new _ServiceContainer(
      registry,
      validator,
      cache,
      resolver,
      scopeManager,
      "registering",
      env
    );
  }
  /**
   * Register a service class with automatic dependency injection.
   */
  registerClass(token, serviceClass, lifecycle) {
    return this.registrationManager.registerClass(token, serviceClass, lifecycle);
  }
  /**
   * Register a factory function.
   */
  registerFactory(token, factory, lifecycle, dependencies) {
    return this.registrationManager.registerFactory(token, factory, lifecycle, dependencies);
  }
  /**
   * Register a constant value.
   */
  registerValue(token, value2) {
    return this.registrationManager.registerValue(token, value2);
  }
  /**
   * Register an already created instance.
   * Internally treated the same as a value registration.
   */
  registerInstance(token, instance2) {
    return this.registerValue(token, instance2);
  }
  /**
   * Returns a previously registered constant value without requiring validation.
   * Useful for bootstrap/static values that are needed while the container is still registering services.
   */
  getRegisteredValue(token) {
    return this.registrationManager.getRegisteredValue(token);
  }
  /**
   * Register an alias.
   */
  registerAlias(aliasToken, targetToken) {
    return this.registrationManager.registerAlias(aliasToken, targetToken);
  }
  /**
   * Validate all registrations.
   */
  validate() {
    const result = this.validationManager.validate();
    if (result.ok) {
      this.injectMetricsCollector();
    }
    return result;
  }
  /**
   * Injects MetricsCollector into resolver and cache after validation.
   * This enables metrics recording without circular dependencies during bootstrap.
   *
   * Note: EnvironmentConfig is already injected via BootstrapPerformanceTracker
   * during container creation, so only MetricsCollector needs to be injected here.
   *
   * Static import is safe here because:
   * - tokenindex.ts only uses `import type { ServiceContainer }` (removed at runtime)
   * - No circular runtime dependency exists
   * - Container is already validated when this is called
   */
  injectMetricsCollector() {
    const metricsResult = this.resolutionManager.resolveWithError(metricsCollectorToken);
    if (metricsResult.ok) {
      const metricsCollector = castResolvedService(metricsResult.value);
      this.metricsInjectionManager.performInjection(metricsCollector);
    }
  }
  /**
   * Get validation state.
   * Implements both Container.getValidationState and PlatformContainerPort.getValidationState.
   * Both interfaces use identical types, so a single overload is sufficient.
   */
  getValidationState() {
    return this.validationManager.getValidationState();
  }
  /**
   * Async-safe validation for concurrent environments with timeout.
   *
   * Prevents race conditions when multiple callers validate simultaneously
   * by ensuring only one validation runs at a time.
   *
   * @param timeoutMs - Timeout in milliseconds (default: 30000 = 30 seconds)
   * @returns Promise resolving to validation result
   *
   * @example
   * ```typescript
   * const container = ServiceContainer.createRoot(ENV);
   * // ... register services
   * await container.validateAsync(); // Safe for concurrent calls
   * await container.validateAsync(5000); // With 5 second timeout
   * ```
   */
  async validateAsync(timeoutMs = 3e4) {
    const result = await this.validationManager.validateAsync(timeoutMs, withTimeout, TimeoutError);
    if (result.ok) {
      this.injectMetricsCollector();
    }
    return result;
  }
  /**
   * Creates a child scope container.
   *
   * Child containers:
   * - Inherit parent registrations (cloned)
   * - Can add their own registrations
   * - Must call validate() before resolving
   * - Share parent's singleton instances
   * - Have isolated scoped instances
   *
   * @param name - Optional custom name for the scope
   * @returns Result with child container or error
   *
   * @example
   * ```typescript
   * const parent = ServiceContainer.createRoot(ENV);
   * parent.registerClass(LoggerToken, Logger, SINGLETON);
   * parent.validate();
   *
   * const child = parent.createScope("request").value!;
   * child.registerClass(RequestToken, RequestContext, SCOPED);
   * child.validate();
   *
   * const logger = child.resolve(LoggerToken);   // From parent (shared)
   * const ctx = child.resolve(RequestToken);      // From child (isolated)
   * ```
   */
  createScope(name) {
    const scopeResult = this.scopeFacade.validateScopeCreation(name);
    if (!scopeResult.ok) {
      return err(scopeResult.error);
    }
    const childRegistry = this.registry.clone();
    const childCache = scopeResult.value.cache;
    const childManager = scopeResult.value.manager;
    const childPerformanceTracker = new BootstrapPerformanceTracker(
      createRuntimeConfig(this.env),
      null
    );
    const childResolver = new ServiceResolver(
      childRegistry,
      childCache,
      this.resolver,
      // Parent resolver for singleton delegation
      scopeResult.value.scopeName,
      childPerformanceTracker
    );
    const child = new _ServiceContainer(
      childRegistry,
      this.validator,
      // Shared (stateless)
      childCache,
      childResolver,
      childManager,
      "registering",
      // Child starts in registering state
      this.env
      // Inherit ENV from parent
    );
    return ok(child);
  }
  resolveWithError(token) {
    return this.resolutionManager.resolveWithError(token);
  }
  // Implementation (unified for both overloads)
  resolve(token) {
    const securityResult = this.apiSecurityManager.validateApiSafeToken(token);
    if (!securityResult.ok) {
      throw new Error(securityResult.error.message);
    }
    return this.resolutionManager.resolve(token);
  }
  isRegistered(token) {
    return ok(this.registrationManager.isRegistered(token));
  }
  /**
   * Returns API-safe token metadata for external consumption.
   */
  getApiSafeToken(token) {
    if (!isApiSafeTokenRuntime(token)) {
      return null;
    }
    return {
      description: String(token),
      isRegistered: this.registrationManager.isRegistered(token)
    };
  }
  /**
   * Synchronously dispose container and all children.
   *
   * Use this for scenarios where async disposal is not possible (e.g., browser unload).
   * For normal cleanup, prefer disposeAsync() which handles async disposal properly.
   *
   * @returns Result indicating success or disposal error
   */
  dispose() {
    const result = this.scopeManager.dispose();
    if (result.ok) {
      this.validationManager.resetValidationState();
    }
    return result;
  }
  /**
   * Asynchronously dispose container and all children.
   *
   * This is the preferred disposal method as it properly handles services that
   * implement AsyncDisposable, allowing for proper cleanup of resources like
   * database connections, file handles, or network sockets.
   *
   * Falls back to synchronous disposal for services implementing only Disposable.
   *
   * @returns Promise with Result indicating success or disposal error
   *
   * @example
   * ```typescript
   * // Preferred: async disposal
   * const result = await container.disposeAsync();
   * if (result.ok) {
   *   console.log("Container disposed successfully");
   * }
   *
   * // Browser unload (sync required)
   * window.addEventListener('beforeunload', () => {
   *   container.dispose();  // Sync fallback
   * });
   * ```
   */
  async disposeAsync() {
    const result = await this.scopeManager.disposeAsync();
    if (result.ok) {
      this.validationManager.resetValidationState();
    }
    return result;
  }
  /**
   * Clear all registrations and instances.
   *
   * IMPORTANT: Resets validation state (per review feedback).
   */
  clear() {
    this.registry.clear();
    this.cache.clear();
    this.validationManager.resetValidationState();
    return ok(void 0);
  }
};
__name(_ServiceContainer, "ServiceContainer");
let ServiceContainer = _ServiceContainer;
const _ContainerFactory = class _ContainerFactory {
  /**
   * Creates a root ServiceContainer with the given environment configuration.
   *
   * @param env - Environment configuration
   * @returns A new ServiceContainer instance
   */
  createRoot(env) {
    return ServiceContainer.createRoot(env);
  }
};
__name(_ContainerFactory, "ContainerFactory");
let ContainerFactory = _ContainerFactory;
const environmentConfigToken = createInjectionToken("EnvironmentConfig");
const containerHealthCheckToken = createInjectionToken("ContainerHealthCheck");
const metricsHealthCheckToken = createInjectionToken("MetricsHealthCheck");
const healthCheckRegistryToken = createInjectionToken("PlatformHealthCheckPort");
const serviceContainerToken = createInjectionToken("ServiceContainer");
const runtimeConfigToken = createInjectionToken(
  "PlatformRuntimeConfigPort"
);
const platformNotificationPortToken = createInjectionToken(
  "PlatformNotificationPort"
);
const platformCachePortToken = createInjectionToken("PlatformCachePort");
const platformI18nPortToken = createInjectionToken("PlatformI18nPort");
const platformUIPortToken = createInjectionToken("PlatformUIPort");
const platformJournalDirectoryUiPortToken = createInjectionToken("PlatformJournalDirectoryUiPort");
const platformUINotificationPortToken = createInjectionToken(
  "PlatformUINotificationPort"
);
const platformSettingsPortToken = createInjectionToken("PlatformSettingsPort");
const platformJournalEventPortToken = createInjectionToken(
  "PlatformJournalEventPort"
);
const platformJournalCollectionPortToken = createInjectionToken("PlatformJournalCollectionPort");
const platformJournalRepositoryToken = createInjectionToken(
  "PlatformJournalRepository"
);
const platformContextMenuRegistrationPortToken = createInjectionToken("PlatformContextMenuRegistrationPort");
const platformValidationPortToken = createInjectionToken("PlatformValidationPort");
const platformLoggingPortToken = createInjectionToken("PlatformLoggingPort");
const platformMetricsSnapshotPortToken = createInjectionToken(
  "PlatformMetricsSnapshotPort"
);
const platformContainerPortToken = createInjectionToken("PlatformContainerPort");
const platformSettingsRegistrationPortToken = createInjectionToken("PlatformSettingsRegistrationPort");
const platformModuleReadyPortToken = createInjectionToken("PlatformModuleReadyPort");
const platformChannelPortToken = createInjectionToken("PlatformChannelPort");
const platformUINotificationChannelPortToken = createInjectionToken("PlatformUINotificationChannelPort");
const platformConsoleChannelPortToken = createInjectionToken(
  "PlatformConsoleChannelPort"
);
const platformUIAvailabilityPortToken = createInjectionToken(
  "PlatformUIAvailabilityPort"
);
const _RuntimeConfigAdapter = class _RuntimeConfigAdapter {
  constructor(env) {
    this.service = new RuntimeConfigService(env);
  }
  get(key) {
    return this.service.get(key);
  }
  setFromPlatform(key, value2) {
    this.service.setFromFoundry(key, value2);
  }
  onChange(key, listener) {
    return this.service.onChange(key, listener);
  }
};
__name(_RuntimeConfigAdapter, "RuntimeConfigAdapter");
let RuntimeConfigAdapter = _RuntimeConfigAdapter;
const _ContainerHealthCheck = class _ContainerHealthCheck {
  constructor(container) {
    this.name = "container";
    this.container = container;
  }
  check() {
    return this.container.getValidationState() === "validated";
  }
  getDetails() {
    const state = this.container.getValidationState();
    if (state !== "validated") {
      return `Container state: ${state}`;
    }
    return null;
  }
  dispose() {
  }
};
__name(_ContainerHealthCheck, "ContainerHealthCheck");
let ContainerHealthCheck = _ContainerHealthCheck;
const _DIContainerHealthCheck = class _DIContainerHealthCheck extends ContainerHealthCheck {
  constructor(container, registry) {
    super(container);
    registry.register(this);
  }
};
__name(_DIContainerHealthCheck, "DIContainerHealthCheck");
_DIContainerHealthCheck.dependencies = [platformContainerPortToken, healthCheckRegistryToken];
let DIContainerHealthCheck = _DIContainerHealthCheck;
const _MetricsHealthCheck = class _MetricsHealthCheck {
  constructor(metricsSnapshotPort) {
    this.name = "metrics";
    this.metricsSnapshotPort = metricsSnapshotPort;
  }
  check() {
    const snapshot = this.metricsSnapshotPort.getSnapshot();
    const hasPortFailures = Object.keys(snapshot.portSelectionFailures).length > 0;
    const hasResolutionErrors = snapshot.resolutionErrors > 0;
    return !hasPortFailures && !hasResolutionErrors;
  }
  getDetails() {
    const snapshot = this.metricsSnapshotPort.getSnapshot();
    const failures = Object.keys(snapshot.portSelectionFailures);
    if (failures.length > 0) {
      return `Port selection failures: ${failures.join(", ")}`;
    }
    if (snapshot.resolutionErrors > 0) {
      return `Resolution errors: ${snapshot.resolutionErrors}`;
    }
    return null;
  }
  dispose() {
  }
};
__name(_MetricsHealthCheck, "MetricsHealthCheck");
let MetricsHealthCheck = _MetricsHealthCheck;
const _DIMetricsHealthCheck = class _DIMetricsHealthCheck extends MetricsHealthCheck {
  constructor(metricsSnapshotPort, registry) {
    super(metricsSnapshotPort);
    registry.register(this);
  }
};
__name(_DIMetricsHealthCheck, "DIMetricsHealthCheck");
_DIMetricsHealthCheck.dependencies = [platformMetricsSnapshotPortToken, healthCheckRegistryToken];
let DIMetricsHealthCheck = _DIMetricsHealthCheck;
const moduleIdToken = createInjectionToken("ModuleId");
const platformBootstrapEventPortToken = createInjectionToken(
  "PlatformBootstrapEventPort"
);
const metricsRecorderToken = createInjectionToken("MetricsRecorder");
const metricsSamplerToken = createInjectionToken("MetricsSampler");
const metricsReporterToken = createInjectionToken("MetricsReporter");
const traceContextToken = createInjectionToken("TraceContext");
const metricsStorageToken = createInjectionToken("MetricsStorage");
const moduleApiInitializerToken = createInjectionToken("ModuleApiInitializer");
const moduleHealthServiceToken = createInjectionToken("ModuleHealthService");
const HOOK_THROTTLE_WINDOW_MS = 150;
const VALIDATION_CONSTRAINTS = {
  /** Maximale Länge für IDs und Keys */
  MAX_ID_LENGTH: 100,
  /** Maximale Länge für Namen */
  MAX_NAME_LENGTH: 100,
  /** Maximale Länge für Flag-Keys */
  MAX_FLAG_KEY_LENGTH: 100
};
const METRICS_CONFIG = {
  /** Größe des Circular-Buffers für Resolution-Zeiten */
  RESOLUTION_TIMES_BUFFER_SIZE: 100
};
Object.freeze(VALIDATION_CONSTRAINTS);
Object.freeze(METRICS_CONFIG);
const _MetricsAggregator = class _MetricsAggregator {
  /**
   * Aggregates raw metrics into a snapshot.
   *
   * @param metrics - Raw metrics data
   * @returns Aggregated metrics snapshot
   */
  aggregate(metrics) {
    const avgTime = this.calculateAverage(metrics.resolutionTimes, metrics.resolutionTimesCount);
    const cacheHitRate = this.calculateCacheHitRate(metrics.cacheHits, metrics.cacheMisses);
    return {
      containerResolutions: metrics.containerResolutions,
      resolutionErrors: metrics.resolutionErrors,
      avgResolutionTimeMs: avgTime,
      portSelections: Object.fromEntries(metrics.portSelections),
      portSelectionFailures: Object.fromEntries(metrics.portSelectionFailures),
      cacheHitRate
    };
  }
  /**
   * Calculates the average of resolution times.
   *
   * @param times - Array of resolution times
   * @param count - Number of valid entries in the array
   * @returns Average time in milliseconds
   */
  calculateAverage(times, count) {
    if (count === 0) {
      return 0;
    }
    const slice = times.slice(0, count);
    const sum = slice.reduce((acc, time) => acc + time, 0);
    return sum / count;
  }
  /**
   * Calculates the cache hit rate as a percentage.
   *
   * @param hits - Number of cache hits
   * @param misses - Number of cache misses
   * @returns Cache hit rate (0-100)
   */
  calculateCacheHitRate(hits, misses) {
    const totalAccess = hits + misses;
    if (totalAccess === 0) {
      return 0;
    }
    return hits / totalAccess * 100;
  }
};
__name(_MetricsAggregator, "MetricsAggregator");
let MetricsAggregator = _MetricsAggregator;
const _MetricsPersistenceManager = class _MetricsPersistenceManager {
  /**
   * Serializes raw metrics into a persistence state.
   *
   * @param metrics - Raw metrics data
   * @returns Serializable persistence state
   */
  serialize(metrics) {
    return {
      metrics: {
        containerResolutions: metrics.containerResolutions,
        resolutionErrors: metrics.resolutionErrors,
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        portSelections: Object.fromEntries(metrics.portSelections),
        portSelectionFailures: Object.fromEntries(metrics.portSelectionFailures)
      },
      resolutionTimes: Array.from(metrics.resolutionTimes),
      resolutionTimesIndex: metrics.resolutionTimesIndex,
      resolutionTimesCount: metrics.resolutionTimesCount
    };
  }
  /**
   * Deserializes a persistence state into raw metrics.
   *
   * @param state - Persisted state (can be null or undefined)
   * @returns Raw metrics data
   */
  deserialize(state) {
    if (!state) {
      return this.createEmptyRawMetrics();
    }
    const { metrics, resolutionTimes, resolutionTimesCount, resolutionTimesIndex } = state;
    const rawMetrics = {
      containerResolutions: Math.max(0, metrics?.containerResolutions ?? 0),
      resolutionErrors: Math.max(0, metrics?.resolutionErrors ?? 0),
      cacheHits: Math.max(0, metrics?.cacheHits ?? 0),
      cacheMisses: Math.max(0, metrics?.cacheMisses ?? 0),
      portSelections: new Map(
        Object.entries(metrics?.portSelections ?? {}).map(([key, value2]) => [
          Number(key),
          Number.isFinite(Number(value2)) ? Number(value2) : 0
        ])
      ),
      portSelectionFailures: new Map(
        Object.entries(metrics?.portSelectionFailures ?? {}).map(([key, value2]) => [
          Number(key),
          Number.isFinite(Number(value2)) ? Number(value2) : 0
        ])
      ),
      resolutionTimes: new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
      resolutionTimesIndex: 0,
      resolutionTimesCount: 0
    };
    if (Array.isArray(resolutionTimes)) {
      const maxLength2 = Math.min(resolutionTimes.length, rawMetrics.resolutionTimes.length);
      for (let index = 0; index < maxLength2; index++) {
        const value2 = Number(resolutionTimes[index]);
        rawMetrics.resolutionTimes[index] = Number.isFinite(value2) ? value2 : 0;
      }
      const safeIndex = Number.isFinite(resolutionTimesIndex) ? Number(resolutionTimesIndex) : 0;
      const safeCount = Number.isFinite(resolutionTimesCount) ? Number(resolutionTimesCount) : 0;
      rawMetrics.resolutionTimesIndex = Math.min(
        Math.max(0, safeIndex),
        METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE - 1
      );
      rawMetrics.resolutionTimesCount = Math.min(
        Math.max(0, safeCount),
        METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE
      );
    } else {
      rawMetrics.resolutionTimesIndex = 0;
      rawMetrics.resolutionTimesCount = 0;
    }
    return rawMetrics;
  }
  /**
   * Creates an empty raw metrics structure.
   *
   * @returns Empty raw metrics
   */
  createEmptyRawMetrics() {
    return {
      containerResolutions: 0,
      resolutionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      portSelections: /* @__PURE__ */ new Map(),
      portSelectionFailures: /* @__PURE__ */ new Map(),
      resolutionTimes: new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
      resolutionTimesIndex: 0,
      resolutionTimesCount: 0
    };
  }
};
__name(_MetricsPersistenceManager, "MetricsPersistenceManager");
let MetricsPersistenceManager = _MetricsPersistenceManager;
const _MetricsStateManager = class _MetricsStateManager {
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set();
  }
  /**
   * Resets the state manager.
   * Clears all registered callbacks.
   */
  reset() {
    this.callbacks.clear();
  }
  /**
   * Subscribes to state changes.
   *
   * @param callback - Callback to invoke on state changes
   */
  onStateChanged(callback) {
    this.callbacks.add(callback);
  }
  /**
   * Unsubscribes from state changes.
   *
   * @param callback - Callback to remove
   */
  unsubscribe(callback) {
    this.callbacks.delete(callback);
  }
  /**
   * Notifies all registered callbacks of a state change.
   * Internal method used by MetricsCollector.
   */
  notifyStateChanged() {
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        console.error("Error in metrics state change callback:", error);
      }
    }
  }
};
__name(_MetricsStateManager, "MetricsStateManager");
let MetricsStateManager = _MetricsStateManager;
const _MetricsCollector = class _MetricsCollector {
  constructor(config2) {
    this.config = config2;
    this.metrics = {
      containerResolutions: 0,
      resolutionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      portSelections: /* @__PURE__ */ new Map(),
      portSelectionFailures: /* @__PURE__ */ new Map()
    };
    this.resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    this.resolutionTimesIndex = 0;
    this.resolutionTimesCount = 0;
    this.MAX_RESOLUTION_TIMES = METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE;
    this.aggregator = new MetricsAggregator();
    this.persistenceManager = new MetricsPersistenceManager();
    this.stateManager = new MetricsStateManager();
  }
  /**
   * Records a service resolution attempt.
   *
   * @param token - The injection token that was resolved
   * @param durationMs - Time taken to resolve in milliseconds
   * @param success - Whether resolution succeeded
   */
  recordResolution(token, durationMs, success) {
    this.metrics.containerResolutions++;
    if (!success) {
      this.metrics.resolutionErrors++;
    }
    this.resolutionTimes[this.resolutionTimesIndex] = durationMs;
    this.resolutionTimesIndex = (this.resolutionTimesIndex + 1) % this.MAX_RESOLUTION_TIMES;
    this.resolutionTimesCount = Math.min(this.resolutionTimesCount + 1, this.MAX_RESOLUTION_TIMES);
    this.notifyStateChanged();
  }
  /**
   * Records a port selection event.
   *
   * @param version - The Foundry version for which a port was selected
   */
  recordPortSelection(version) {
    const count = this.metrics.portSelections.get(version) ?? 0;
    this.metrics.portSelections.set(version, count + 1);
    this.notifyStateChanged();
  }
  /**
   * Records a port selection failure.
   *
   * Useful for tracking when no compatible port is available for a version.
   *
   * @param version - The Foundry version for which port selection failed
   */
  recordPortSelectionFailure(version) {
    const count = this.metrics.portSelectionFailures.get(version) ?? 0;
    this.metrics.portSelectionFailures.set(version, count + 1);
    this.notifyStateChanged();
  }
  /**
   * Records a cache access (hit or miss).
   *
   * @param hit - True if cache hit, false if cache miss
   */
  recordCacheAccess(hit) {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    this.notifyStateChanged();
  }
  /**
   * Gets a snapshot of current metrics.
   * Delegates aggregation to MetricsAggregator.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot() {
    return this.aggregator.aggregate(this.getRawMetrics());
  }
  /**
   * Gets raw metrics data without aggregation.
   * Used internally by aggregator and persistence manager.
   *
   * @returns Raw metrics data
   */
  getRawMetrics() {
    return {
      containerResolutions: this.metrics.containerResolutions,
      resolutionErrors: this.metrics.resolutionErrors,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      portSelections: this.metrics.portSelections,
      portSelectionFailures: this.metrics.portSelectionFailures,
      resolutionTimes: this.resolutionTimes,
      resolutionTimesIndex: this.resolutionTimesIndex,
      resolutionTimesCount: this.resolutionTimesCount
    };
  }
  /**
   * Resets all collected metrics.
   * Useful for testing or starting fresh measurements.
   */
  reset() {
    this.metrics = {
      containerResolutions: 0,
      resolutionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      portSelections: /* @__PURE__ */ new Map(),
      portSelectionFailures: /* @__PURE__ */ new Map()
    };
    this.resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    this.resolutionTimesIndex = 0;
    this.resolutionTimesCount = 0;
    this.stateManager.reset();
    this.notifyStateChanged();
  }
  /**
   * Hook invoked after state mutations. Subclasses can override to react
   * (e.g., persist metrics).
   */
  onStateChanged() {
    this.stateManager.notifyStateChanged();
  }
  /**
   * Notifies state manager of state changes.
   * Internal method that can be overridden by subclasses.
   */
  notifyStateChanged() {
    this.onStateChanged();
  }
  /**
   * Captures the internal state for persistence.
   * Delegates to MetricsPersistenceManager.
   *
   * @returns Serializable metrics state
   */
  getPersistenceState() {
    return this.persistenceManager.serialize(this.getRawMetrics());
  }
  /**
   * Restores internal state from a persisted snapshot.
   * Delegates to MetricsPersistenceManager.
   *
   * @param state - Persisted metrics state
   */
  restoreFromPersistenceState(state) {
    const rawMetrics = this.persistenceManager.deserialize(state);
    this.applyRawMetrics(rawMetrics);
  }
  /**
   * Applies raw metrics to internal state.
   * Internal method used by restoreFromPersistenceState.
   *
   * @param rawMetrics - Raw metrics to apply
   */
  applyRawMetrics(rawMetrics) {
    this.metrics = {
      containerResolutions: rawMetrics.containerResolutions,
      resolutionErrors: rawMetrics.resolutionErrors,
      cacheHits: rawMetrics.cacheHits,
      cacheMisses: rawMetrics.cacheMisses,
      portSelections: rawMetrics.portSelections,
      portSelectionFailures: rawMetrics.portSelectionFailures
    };
    this.resolutionTimes = new Float64Array(rawMetrics.resolutionTimes);
    this.resolutionTimesIndex = rawMetrics.resolutionTimesIndex;
    this.resolutionTimesCount = rawMetrics.resolutionTimesCount;
  }
};
__name(_MetricsCollector, "MetricsCollector");
_MetricsCollector.dependencies = [runtimeConfigToken];
let MetricsCollector = _MetricsCollector;
const _DIMetricsCollector = class _DIMetricsCollector extends MetricsCollector {
  constructor(config2) {
    super(config2);
  }
};
__name(_DIMetricsCollector, "DIMetricsCollector");
_DIMetricsCollector.dependencies = [runtimeConfigToken];
let DIMetricsCollector = _DIMetricsCollector;
const _PersistentMetricsCollector = class _PersistentMetricsCollector extends MetricsCollector {
  constructor(config2, metricsStorage) {
    super(config2);
    this.metricsStorage = metricsStorage;
    this.suppressPersistence = false;
    this.initialized = false;
  }
  /**
   * Initializes the collector by restoring state from storage.
   * Must be called explicitly after construction.
   *
   * @returns Result indicating success or error
   */
  initialize() {
    if (this.initialized) {
      return ok(void 0);
    }
    try {
      this.restoreFromStorage();
      this.initialized = true;
      return ok(void 0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(`Failed to initialize PersistentMetricsCollector: ${errorMessage}`);
    }
  }
  clearPersistentState() {
    this.metricsStorage.clear?.();
    this.suppressPersistence = true;
    try {
      super.reset();
    } finally {
      this.suppressPersistence = false;
    }
  }
  onStateChanged() {
    super.onStateChanged();
    if (this.suppressPersistence) {
      return;
    }
    this.persist();
  }
  restoreFromStorage() {
    let state = null;
    try {
      state = this.metricsStorage.load();
    } catch {
      state = null;
    }
    if (!state) {
      return;
    }
    this.suppressPersistence = true;
    try {
      this.restoreFromPersistenceState(state);
    } finally {
      this.suppressPersistence = false;
    }
  }
  persist() {
    try {
      this.metricsStorage.save(this.getPersistenceState());
    } catch {
    }
  }
};
__name(_PersistentMetricsCollector, "PersistentMetricsCollector");
_PersistentMetricsCollector.dependencies = [
  runtimeConfigToken,
  metricsStorageToken
];
let PersistentMetricsCollector = _PersistentMetricsCollector;
const _DIPersistentMetricsCollector = class _DIPersistentMetricsCollector extends PersistentMetricsCollector {
  constructor(config2, metricsStorage) {
    super(config2, metricsStorage);
  }
};
__name(_DIPersistentMetricsCollector, "DIPersistentMetricsCollector");
_DIPersistentMetricsCollector.dependencies = [
  runtimeConfigToken,
  metricsStorageToken
];
let DIPersistentMetricsCollector = _DIPersistentMetricsCollector;
const _MetricsSampler = class _MetricsSampler {
  constructor(config2) {
    this.config = config2;
  }
  /**
   * Determines if a performance operation should be sampled based on sampling rate.
   *
   * In production mode, uses probabilistic sampling to reduce overhead.
   * In development mode, always samples (returns true).
   *
   * @returns True if the operation should be measured/recorded
   *
   * @example
   * ```typescript
   * const sampler = container.resolve(metricsSamplerToken);
   * if (sampler.shouldSample()) {
   *   performance.mark('operation-start');
   *   // ... operation ...
   *   performance.mark('operation-end');
   *   performance.measure('operation', 'operation-start', 'operation-end');
   * }
   * ```
   */
  shouldSample() {
    if (this.config.get("isDevelopment")) {
      return true;
    }
    return Math.random() < this.config.get("performanceSamplingRate");
  }
};
__name(_MetricsSampler, "MetricsSampler");
let MetricsSampler = _MetricsSampler;
const _DIMetricsSampler = class _DIMetricsSampler extends MetricsSampler {
  constructor(config2) {
    super(config2);
  }
};
__name(_DIMetricsSampler, "DIMetricsSampler");
_DIMetricsSampler.dependencies = [runtimeConfigToken];
let DIMetricsSampler = _DIMetricsSampler;
const _MetricsReporter = class _MetricsReporter {
  constructor(collector, logger) {
    this.collector = collector;
    this.logger = logger;
  }
  /**
   * Logs a formatted metrics summary to the console.
   * Uses console.table() for easy-to-read tabular output.
   */
  logSummary() {
    const snapshot = this.collector.getSnapshot();
    const tableData = {
      "Total Resolutions": snapshot.containerResolutions,
      Errors: snapshot.resolutionErrors,
      "Avg Time (ms)": snapshot.avgResolutionTimeMs.toFixed(2),
      "Cache Hit Rate": `${snapshot.cacheHitRate.toFixed(1)}%`
    };
    console.table(tableData);
  }
  /**
   * Gibt Metrics als JSON zurück.
   *
   * @returns JSON string representation of metrics snapshot
   */
  toJSON() {
    return JSON.stringify(this.collector.getSnapshot(), null, 2);
  }
};
__name(_MetricsReporter, "MetricsReporter");
let MetricsReporter = _MetricsReporter;
const _DIMetricsReporter = class _DIMetricsReporter extends MetricsReporter {
  constructor(collector, logger) {
    super(collector, logger);
  }
};
__name(_DIMetricsReporter, "DIMetricsReporter");
_DIMetricsReporter.dependencies = [metricsCollectorToken, loggerToken];
let DIMetricsReporter = _DIMetricsReporter;
const _LocalStorageMetricsStorage = class _LocalStorageMetricsStorage {
  constructor(storageKey, storage = getStorage()) {
    this.storageKey = storageKey;
    this.storage = storage;
  }
  load() {
    if (!this.storage) {
      return null;
    }
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  save(state) {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
    }
  }
  clear() {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.removeItem(this.storageKey);
    } catch {
    }
  }
};
__name(_LocalStorageMetricsStorage, "LocalStorageMetricsStorage");
let LocalStorageMetricsStorage = _LocalStorageMetricsStorage;
function getStorage() {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return globalThis.localStorage;
    }
  } catch {
  }
  return null;
}
__name(getStorage, "getStorage");
function createMetricsStorage(key) {
  return new LocalStorageMetricsStorage(key);
}
__name(createMetricsStorage, "createMetricsStorage");
function createInMemoryMetricsStorage() {
  let state = null;
  return {
    load() {
      return state;
    },
    save(newState) {
      state = newState;
    },
    clear() {
      state = null;
    }
  };
}
__name(createInMemoryMetricsStorage, "createInMemoryMetricsStorage");
const _TracedLogger = class _TracedLogger {
  constructor(baseLogger, traceId) {
    this.baseLogger = baseLogger;
    this.traceId = traceId;
  }
  setMinLevel(level) {
    this.baseLogger.setMinLevel?.(level);
  }
  log(message2, ...optionalParams) {
    this.baseLogger.log(this.formatMessage(message2), ...optionalParams);
  }
  error(message2, ...optionalParams) {
    this.baseLogger.error(this.formatMessage(message2), ...optionalParams);
  }
  warn(message2, ...optionalParams) {
    this.baseLogger.warn(this.formatMessage(message2), ...optionalParams);
  }
  info(message2, ...optionalParams) {
    this.baseLogger.info(this.formatMessage(message2), ...optionalParams);
  }
  debug(message2, ...optionalParams) {
    this.baseLogger.debug(this.formatMessage(message2), ...optionalParams);
  }
  withTraceId(newTraceId) {
    return new _TracedLogger(this.baseLogger, `${this.traceId}/${newTraceId}`);
  }
  formatMessage(message2) {
    return `[${this.traceId}] ${message2}`;
  }
};
__name(_TracedLogger, "TracedLogger");
let TracedLogger = _TracedLogger;
const _BaseConsoleLogger = class _BaseConsoleLogger {
  constructor(minLevel) {
    this.minLevel = minLevel;
  }
  setMinLevel(level) {
    this.minLevel = level;
  }
  log(message2, ...optionalParams) {
    console.log(`${LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  error(message2, ...optionalParams) {
    if (LogLevel.ERROR < this.minLevel) return;
    console.error(`${LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  warn(message2, ...optionalParams) {
    if (LogLevel.WARN < this.minLevel) return;
    console.warn(`${LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  info(message2, ...optionalParams) {
    if (LogLevel.INFO < this.minLevel) return;
    console.info(`${LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  debug(message2, ...optionalParams) {
    if (LogLevel.DEBUG < this.minLevel) return;
    console.debug(`${LOG_PREFIX} ${message2}`, ...optionalParams);
  }
  withTraceId(traceId) {
    return new TracedLogger(this, traceId);
  }
};
__name(_BaseConsoleLogger, "BaseConsoleLogger");
let BaseConsoleLogger = _BaseConsoleLogger;
const _RuntimeConfigLoggerDecorator = class _RuntimeConfigLoggerDecorator {
  constructor(baseLogger, runtimeConfig) {
    this.baseLogger = baseLogger;
    this.runtimeConfig = runtimeConfig;
    this.unsubscribe = null;
    this.syncLogLevel();
  }
  syncLogLevel() {
    this.baseLogger.setMinLevel?.(this.runtimeConfig.get("logLevel"));
    this.unsubscribe?.();
    this.unsubscribe = this.runtimeConfig.onChange("logLevel", (level) => {
      this.baseLogger.setMinLevel?.(level);
    });
  }
  setMinLevel(level) {
    this.baseLogger.setMinLevel?.(level);
  }
  log(message2, ...optionalParams) {
    this.baseLogger.log(message2, ...optionalParams);
  }
  error(message2, ...optionalParams) {
    this.baseLogger.error(message2, ...optionalParams);
  }
  warn(message2, ...optionalParams) {
    this.baseLogger.warn(message2, ...optionalParams);
  }
  info(message2, ...optionalParams) {
    this.baseLogger.info(message2, ...optionalParams);
  }
  debug(message2, ...optionalParams) {
    this.baseLogger.debug(message2, ...optionalParams);
  }
  withTraceId(traceId) {
    return this.baseLogger.withTraceId?.(traceId) ?? this.baseLogger;
  }
  dispose() {
    this.unsubscribe?.();
  }
};
__name(_RuntimeConfigLoggerDecorator, "RuntimeConfigLoggerDecorator");
let RuntimeConfigLoggerDecorator = _RuntimeConfigLoggerDecorator;
const _StackTraceLoggerDecorator = class _StackTraceLoggerDecorator {
  constructor(baseLogger, runtimeConfig) {
    this.baseLogger = baseLogger;
    this.runtimeConfig = runtimeConfig;
  }
  setMinLevel(level) {
    this.baseLogger.setMinLevel?.(level);
  }
  /**
   * Extracts the caller information from stack trace when debug mode is enabled.
   * Filters out logger-related frames to show the actual source of the log call.
   *
   * @returns Caller info in format "filename:line" or undefined if not in debug mode or extraction fails
   */
  getCallerInfo() {
    const currentLogLevel = this.runtimeConfig.get("logLevel");
    if (currentLogLevel !== LogLevel.DEBUG) {
      return void 0;
    }
    try {
      const stack = new Error().stack;
      if (!stack) return void 0;
      const lines = stack.split("\n");
      const loggerPatterns = [
        /StackTraceLoggerDecorator/,
        /BaseConsoleLogger/,
        /ConsoleLoggerService/,
        /RuntimeConfigLoggerDecorator/,
        /TraceContextLoggerDecorator/,
        /TracedLogger/,
        /at Object\./
      ];
      for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const isLoggerFrame = loggerPatterns.some((pattern) => pattern.test(line));
        if (!isLoggerFrame && line.trim()) {
          const match2 = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || line.match(/at\s+(.+?):(\d+):(\d+)/);
          if (match2) {
            const filePath = match2[2] || match2[1];
            const lineNum = match2[3] || match2[2];
            if (filePath && lineNum) {
              const fileName = filePath.split(/[/\\]/).pop() || filePath;
              return `${fileName}:${lineNum}`;
            }
          }
          return line.trim().replace(/^at\s+/, "");
        }
      }
    } catch {
    }
    return void 0;
  }
  formatWithCallerInfo(message2) {
    const callerInfo = this.getCallerInfo();
    return callerInfo ? `${message2} [${callerInfo}]` : message2;
  }
  log(message2, ...optionalParams) {
    this.baseLogger.log(this.formatWithCallerInfo(message2), ...optionalParams);
  }
  error(message2, ...optionalParams) {
    this.baseLogger.error(this.formatWithCallerInfo(message2), ...optionalParams);
  }
  warn(message2, ...optionalParams) {
    this.baseLogger.warn(this.formatWithCallerInfo(message2), ...optionalParams);
  }
  info(message2, ...optionalParams) {
    this.baseLogger.info(this.formatWithCallerInfo(message2), ...optionalParams);
  }
  debug(message2, ...optionalParams) {
    this.baseLogger.debug(this.formatWithCallerInfo(message2), ...optionalParams);
  }
  withTraceId(traceId) {
    return this.baseLogger.withTraceId?.(traceId) ?? this.baseLogger;
  }
};
__name(_StackTraceLoggerDecorator, "StackTraceLoggerDecorator");
let StackTraceLoggerDecorator = _StackTraceLoggerDecorator;
const _TraceContextLoggerDecorator = class _TraceContextLoggerDecorator {
  constructor(baseLogger, traceContext) {
    this.baseLogger = baseLogger;
    this.traceContext = traceContext;
  }
  setMinLevel(level) {
    this.baseLogger.setMinLevel?.(level);
  }
  formatWithTrace(message2) {
    const traceId = this.traceContext?.getCurrentTraceId();
    return traceId ? `[${traceId}] ${message2}` : message2;
  }
  log(message2, ...optionalParams) {
    this.baseLogger.log(this.formatWithTrace(message2), ...optionalParams);
  }
  error(message2, ...optionalParams) {
    this.baseLogger.error(this.formatWithTrace(message2), ...optionalParams);
  }
  warn(message2, ...optionalParams) {
    this.baseLogger.warn(this.formatWithTrace(message2), ...optionalParams);
  }
  info(message2, ...optionalParams) {
    this.baseLogger.info(this.formatWithTrace(message2), ...optionalParams);
  }
  debug(message2, ...optionalParams) {
    this.baseLogger.debug(this.formatWithTrace(message2), ...optionalParams);
  }
  withTraceId(traceId) {
    return new TracedLogger(this, traceId);
  }
};
__name(_TraceContextLoggerDecorator, "TraceContextLoggerDecorator");
let TraceContextLoggerDecorator = _TraceContextLoggerDecorator;
const _LoggerCompositionFactory = class _LoggerCompositionFactory {
  /**
   * Creates a composed logger with all necessary decorators.
   *
   * @param config - Runtime configuration service
   * @param traceContext - Optional trace context for trace ID injection
   * @returns Composed logger instance
   */
  createLogger(config2, traceContext) {
    const baseLogger = new BaseConsoleLogger(config2.get("logLevel"));
    const withConfig = new RuntimeConfigLoggerDecorator(baseLogger, config2);
    const withStackTrace = new StackTraceLoggerDecorator(withConfig, config2);
    return traceContext ? new TraceContextLoggerDecorator(withStackTrace, traceContext) : withStackTrace;
  }
};
__name(_LoggerCompositionFactory, "LoggerCompositionFactory");
let LoggerCompositionFactory = _LoggerCompositionFactory;
const _ConsoleLoggerService = class _ConsoleLoggerService {
  constructor(config2, traceContext, factory) {
    const compositionFactory = factory ?? new LoggerCompositionFactory();
    this.logger = compositionFactory.createLogger(config2, traceContext);
  }
  // Delegate all methods to composed logger
  setMinLevel(level) {
    this.logger.setMinLevel?.(level);
  }
  log(message2, ...optionalParams) {
    this.logger.log(message2, ...optionalParams);
  }
  error(message2, ...optionalParams) {
    this.logger.error(message2, ...optionalParams);
  }
  warn(message2, ...optionalParams) {
    this.logger.warn(message2, ...optionalParams);
  }
  info(message2, ...optionalParams) {
    this.logger.info(message2, ...optionalParams);
  }
  debug(message2, ...optionalParams) {
    this.logger.debug(message2, ...optionalParams);
  }
  withTraceId(traceId) {
    return this.logger.withTraceId?.(traceId) ?? this.logger;
  }
};
__name(_ConsoleLoggerService, "ConsoleLoggerService");
let ConsoleLoggerService = _ConsoleLoggerService;
const _DIConsoleLoggerService = class _DIConsoleLoggerService extends ConsoleLoggerService {
  constructor(config2, traceContext) {
    super(config2, traceContext);
  }
};
__name(_DIConsoleLoggerService, "DIConsoleLoggerService");
_DIConsoleLoggerService.dependencies = [runtimeConfigToken, traceContextToken];
let DIConsoleLoggerService = _DIConsoleLoggerService;
function generateTraceId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
__name(generateTraceId, "generateTraceId");
function getTraceTimestamp(traceId) {
  const parts = traceId.split("-");
  if (parts.length !== 2) {
    return null;
  }
  const [timestampStr, randomStr] = parts;
  if (!timestampStr || !randomStr) {
    return null;
  }
  const timestamp = parseInt(timestampStr, 10);
  return isNaN(timestamp) ? null : timestamp;
}
__name(getTraceTimestamp, "getTraceTimestamp");
const _TraceContext = class _TraceContext {
  constructor() {
    this.currentTraceId = null;
  }
  /**
   * Executes a synchronous function with trace context.
   *
   * Automatically generates a trace ID if not provided.
   * Maintains a context stack for nested traces.
   * Ensures proper cleanup via try/finally.
   *
   * @template T - The return type of the function
   * @param fn - Function to execute with trace context
   * @param options - Trace options (trace ID, operation name, metadata)
   * @returns The result of the function execution
   *
   * @example
   * ```typescript
   * const result = traceContext.trace(() => {
   *   logger.info("Processing"); // Automatically traced
   *   return processData();
   * });
   * ```
   */
  trace(fn, options) {
    const opts = typeof options === "string" ? { traceId: options } : options;
    const traceId = opts?.traceId ?? generateTraceId();
    const previousTraceId = this.currentTraceId;
    this.currentTraceId = traceId;
    try {
      return fn();
    } finally {
      this.currentTraceId = previousTraceId;
    }
  }
  /**
   * Executes an asynchronous function with trace context.
   *
   * Similar to trace() but for async operations.
   * Automatically generates a trace ID if not provided.
   * Maintains a context stack for nested traces.
   * Ensures proper cleanup via try/finally.
   *
   * @template T - The return type of the async function
   * @param fn - Async function to execute with trace context
   * @param options - Trace options (trace ID, operation name, metadata)
   * @returns Promise resolving to the result of the function execution
   *
   * @example
   * ```typescript
   * const result = await traceContext.traceAsync(async () => {
   *   logger.info("Fetching data"); // Automatically traced
   *   return await fetchData();
   * });
   * ```
   */
  async traceAsync(fn, options) {
    const opts = typeof options === "string" ? { traceId: options } : options;
    const traceId = opts?.traceId ?? generateTraceId();
    const previousTraceId = this.currentTraceId;
    this.currentTraceId = traceId;
    try {
      return await fn();
    } finally {
      this.currentTraceId = previousTraceId;
    }
  }
  /**
   * Gets the current trace ID from the context stack.
   *
   * Returns null if not currently in a traced context.
   * Useful for services that need to access the current trace ID
   * without having it passed as a parameter.
   *
   * @returns Current trace ID or null if not in traced context
   *
   * @example
   * ```typescript
   * const traceId = traceContext.getCurrentTraceId();
   * if (traceId) {
   *   console.log(`Current trace: ${traceId}`);
   * }
   * ```
   */
  getCurrentTraceId() {
    return this.currentTraceId;
  }
  /**
   * Cleans up resources.
   * For TraceContext, this resets the current trace ID.
   */
  dispose() {
    this.currentTraceId = null;
  }
};
__name(_TraceContext, "TraceContext");
_TraceContext.dependencies = [];
let TraceContext = _TraceContext;
const _DITraceContext = class _DITraceContext extends TraceContext {
  constructor() {
    super();
  }
};
__name(_DITraceContext, "DITraceContext");
_DITraceContext.dependencies = [];
let DITraceContext = _DITraceContext;
const _ModuleHealthService = class _ModuleHealthService {
  constructor(registry) {
    this.registry = registry;
    this.healthChecksInitialized = false;
  }
  /**
   * Gets the current health status of the module.
   *
   * Health is determined by running all registered health checks.
   * Overall status:
   * - "healthy": All checks pass
   * - "unhealthy": Container check fails
   * - "degraded": Other checks fail
   *
   * @returns HealthStatus with overall status, individual checks, and timestamp
   *
   * @example
   * ```typescript
   * const healthService = container.resolve(moduleHealthServiceToken);
   * const health = healthService.getHealth();
   *
   * if (health.status !== 'healthy') {
   *   console.warn('Module is not healthy:', health.checks);
   * }
   * ```
   */
  getHealth() {
    if (!this.healthChecksInitialized) {
      this.healthChecksInitialized = true;
    }
    const results = this.registry.runAll();
    const allHealthy = Array.from(results.values()).every((result) => result);
    const status = allHealthy ? "healthy" : results.get("container") === false ? "unhealthy" : "degraded";
    const checks = this.registry.getAllChecks();
    let lastError = null;
    for (const check2 of checks) {
      const result = results.get(check2.name);
      if (!result && check2.getDetails) {
        lastError = check2.getDetails();
      }
    }
    return {
      status,
      checks: {
        containerValidated: results.get("container") ?? true,
        portsSelected: results.get("metrics") ?? true,
        lastError
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
__name(_ModuleHealthService, "ModuleHealthService");
let ModuleHealthService = _ModuleHealthService;
const _DIModuleHealthService = class _DIModuleHealthService extends ModuleHealthService {
  constructor(registry) {
    super(registry);
  }
};
__name(_DIModuleHealthService, "DIModuleHealthService");
_DIModuleHealthService.dependencies = [healthCheckRegistryToken];
let DIModuleHealthService = _DIModuleHealthService;
const notificationCenterToken = createInjectionToken("NotificationCenter");
const journalVisibilityServiceToken = createInjectionToken("JournalVisibilityService");
const journalVisibilityConfigToken = createInjectionToken("JournalVisibilityConfig");
const hideJournalContextMenuHandlerToken = createInjectionToken(
  "HideJournalContextMenuHandler"
);
const journalContextMenuHandlersToken = createInjectionToken(
  "JournalContextMenuHandlers"
);
const journalDirectoryProcessorToken = createInjectionToken(
  "JournalDirectoryProcessor"
);
const runtimeConfigSyncToken = createInjectionToken("RuntimeConfigSync");
const runtimeConfigSettingsSyncToken = createInjectionToken(
  "RuntimeConfigSettingsSync"
);
const settingRegistrationErrorMapperToken = createInjectionToken(
  "SettingRegistrationErrorMapper"
);
const settingDefinitionRegistryToken = createInjectionToken(
  "SettingDefinitionRegistry"
);
const runtimeConfigBindingRegistryToken = createInjectionToken(
  "RuntimeConfigBindingRegistry"
);
const i18nFacadeToken = createInjectionToken("I18nFacadeService");
const foundryGameToken = createInjectionToken("FoundryGame");
const foundryHooksToken = createInjectionToken("FoundryHooks");
const foundryDocumentToken = createInjectionToken("FoundryDocument");
const foundryUIToken = createInjectionToken("FoundryUI");
const foundrySettingsToken = createInjectionToken("FoundrySettings");
const foundryJournalFacadeToken = createInjectionToken("FoundryJournalFacade");
function createApiTokens() {
  return {
    notificationCenterToken: markAsApiSafe(notificationCenterToken),
    journalVisibilityServiceToken: markAsApiSafe(journalVisibilityServiceToken),
    journalDirectoryProcessorToken: markAsApiSafe(journalDirectoryProcessorToken),
    foundryGameToken: markAsApiSafe(foundryGameToken),
    foundryHooksToken: markAsApiSafe(foundryHooksToken),
    foundryDocumentToken: markAsApiSafe(foundryDocumentToken),
    foundryUIToken: markAsApiSafe(foundryUIToken),
    foundrySettingsToken: markAsApiSafe(foundrySettingsToken),
    i18nFacadeToken: markAsApiSafe(i18nFacadeToken),
    foundryJournalFacadeToken: markAsApiSafe(foundryJournalFacadeToken)
  };
}
__name(createApiTokens, "createApiTokens");
const _ModuleApiBuilder = class _ModuleApiBuilder {
  constructor(serviceResolver, healthMetricsProvider) {
    this.serviceResolver = serviceResolver;
    this.healthMetricsProvider = healthMetricsProvider;
  }
  /**
   * Creates the well-known API tokens collection.
   *
   * @returns Type-safe token collection for external modules
   */
  createApiTokens() {
    return createApiTokens();
  }
  /**
   * Creates the complete ModuleApi object with all methods.
   *
   * @param container - PlatformContainerPort for service resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Complete ModuleApi object
   */
  createApi(container, wellKnownTokens) {
    return {
      version: PUBLIC_API_VERSION,
      // Overloaded resolve method (throws on error)
      resolve: this.serviceResolver.createResolveFunction(container, wellKnownTokens),
      // Result-Pattern method (safe, never throws)
      resolveWithError: this.serviceResolver.createResolveWithErrorFunction(
        container,
        wellKnownTokens
      ),
      getAvailableTokens: /* @__PURE__ */ __name(() => {
        const tokenMap = /* @__PURE__ */ new Map();
        const tokenEntries = [
          ["journalVisibilityServiceToken", journalVisibilityServiceToken],
          ["journalDirectoryProcessorToken", journalDirectoryProcessorToken],
          ["foundryGameToken", foundryGameToken],
          ["foundryHooksToken", foundryHooksToken],
          ["foundryDocumentToken", foundryDocumentToken],
          ["foundryUIToken", foundryUIToken],
          ["foundrySettingsToken", foundrySettingsToken],
          ["i18nFacadeToken", i18nFacadeToken],
          ["foundryJournalFacadeToken", foundryJournalFacadeToken],
          ["notificationCenterToken", notificationCenterToken]
        ];
        for (const [, token] of tokenEntries) {
          const isRegisteredResult = container.isRegistered(token);
          tokenMap.set(token, {
            description: String(token).replace("Symbol(", "").replace(")", ""),
            isRegistered: getRegistrationStatus(isRegisteredResult)
          });
        }
        return tokenMap;
      }, "getAvailableTokens"),
      tokens: wellKnownTokens,
      getMetrics: /* @__PURE__ */ __name(() => this.healthMetricsProvider.getMetrics(container), "getMetrics"),
      getHealth: /* @__PURE__ */ __name(() => this.healthMetricsProvider.getHealth(container), "getHealth")
    };
  }
};
__name(_ModuleApiBuilder, "ModuleApiBuilder");
let ModuleApiBuilder = _ModuleApiBuilder;
const _ApiWrapperStrategyRegistry = class _ApiWrapperStrategyRegistry {
  constructor() {
    this.strategies = [];
  }
  /**
   * Registers a wrapper strategy.
   *
   * @param strategy - Strategy to register
   */
  register(strategy) {
    this.strategies.push(strategy);
  }
  /**
   * Registers multiple wrapper strategies.
   *
   * @param strategies - Array of strategies to register
   */
  registerAll(strategies) {
    for (const strategy of strategies) {
      this.register(strategy);
    }
  }
  /**
   * Gets all registered strategies, sorted by priority (lower = higher priority).
   *
   * @returns Array of strategies in priority order
   */
  getAll() {
    return [...this.strategies].sort((a, b) => {
      const priorityA = a.getPriority?.() ?? 100;
      const priorityB = b.getPriority?.() ?? 100;
      return priorityA - priorityB;
    });
  }
  /**
   * Finds the first strategy that supports the given token.
   *
   * @param token - API token to find strategy for
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Strategy that supports the token, or null if none found
   */
  findStrategy(token, wellKnownTokens) {
    const sortedStrategies = this.getAll();
    for (const strategy of sortedStrategies) {
      if (strategy.supports(token, wellKnownTokens)) {
        return strategy;
      }
    }
    return null;
  }
  /**
   * Clears all registered strategies.
   * Useful for testing or reset scenarios.
   */
  clear() {
    this.strategies.length = 0;
  }
};
__name(_ApiWrapperStrategyRegistry, "ApiWrapperStrategyRegistry");
let ApiWrapperStrategyRegistry = _ApiWrapperStrategyRegistry;
function isAllowedKey(prop, allowed) {
  if (typeof prop !== "string") {
    return false;
  }
  return allowed.includes(prop);
}
__name(isAllowedKey, "isAllowedKey");
function createReadOnlyWrapper(service, allowedMethods) {
  return new Proxy(service, {
    get(target, prop, receiver) {
      if (isAllowedKey(prop, allowedMethods)) {
        const value2 = Reflect.get(target, prop, receiver);
        if (typeof value2 === "function") {
          return value2.bind(target);
        }
        return value2;
      }
      throw new Error(
        `Property "${String(prop)}" is not accessible via Public API. Only these methods are allowed: ${allowedMethods.map(String).join(", ")}`
      );
    },
    set() {
      throw new Error("Cannot modify services via Public API (read-only)");
    },
    deleteProperty() {
      throw new Error("Cannot delete properties via Public API (read-only)");
    }
  });
}
__name(createReadOnlyWrapper, "createReadOnlyWrapper");
function createPublicLogger(logger) {
  return createReadOnlyWrapper(logger, [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "withTraceId"
    // Decorator pattern for trace context
  ]);
}
__name(createPublicLogger, "createPublicLogger");
function createPublicI18n(i18n) {
  return createReadOnlyWrapper(i18n, ["translate", "format", "has"]);
}
__name(createPublicI18n, "createPublicI18n");
function createPublicNotificationCenter(notificationCenter) {
  return createReadOnlyWrapper(notificationCenter, [
    "debug",
    "info",
    "warn",
    "error",
    "getChannelNames"
  ]);
}
__name(createPublicNotificationCenter, "createPublicNotificationCenter");
function createPublicFoundrySettings(foundrySettings) {
  return createReadOnlyWrapper(foundrySettings, ["get"]);
}
__name(createPublicFoundrySettings, "createPublicFoundrySettings");
function wrapI18nService(service, create) {
  return create(service);
}
__name(wrapI18nService, "wrapI18nService");
function wrapNotificationCenterService(service, create) {
  return create(service);
}
__name(wrapNotificationCenterService, "wrapNotificationCenterService");
function wrapFoundrySettingsPort(service, create) {
  return create(service);
}
__name(wrapFoundrySettingsPort, "wrapFoundrySettingsPort");
const _I18nWrapperStrategy = class _I18nWrapperStrategy {
  supports(token, wellKnownTokens) {
    return token === wellKnownTokens.i18nFacadeToken;
  }
  wrap(service, _token, _wellKnownTokens) {
    return wrapI18nService(service, createPublicI18n);
  }
  getPriority() {
    return 10;
  }
};
__name(_I18nWrapperStrategy, "I18nWrapperStrategy");
let I18nWrapperStrategy = _I18nWrapperStrategy;
const _NotificationWrapperStrategy = class _NotificationWrapperStrategy {
  supports(token, wellKnownTokens) {
    return token === wellKnownTokens.notificationCenterToken;
  }
  wrap(service, _token, _wellKnownTokens) {
    return wrapNotificationCenterService(service, createPublicNotificationCenter);
  }
  getPriority() {
    return 10;
  }
};
__name(_NotificationWrapperStrategy, "NotificationWrapperStrategy");
let NotificationWrapperStrategy = _NotificationWrapperStrategy;
const _SettingsWrapperStrategy = class _SettingsWrapperStrategy {
  supports(token, wellKnownTokens) {
    return token === wellKnownTokens.foundrySettingsToken;
  }
  wrap(service, _token, _wellKnownTokens) {
    return wrapFoundrySettingsPort(service, createPublicFoundrySettings);
  }
  getPriority() {
    return 10;
  }
};
__name(_SettingsWrapperStrategy, "SettingsWrapperStrategy");
let SettingsWrapperStrategy = _SettingsWrapperStrategy;
const _NoopWrapperStrategy = class _NoopWrapperStrategy {
  supports(_token, _wellKnownTokens) {
    return true;
  }
  wrap(service, _token, _wellKnownTokens) {
    return service;
  }
  getPriority() {
    return 1e3;
  }
};
__name(_NoopWrapperStrategy, "NoopWrapperStrategy");
let NoopWrapperStrategy = _NoopWrapperStrategy;
const _ServiceWrapperFactory = class _ServiceWrapperFactory {
  constructor(strategyRegistry) {
    this.strategyRegistry = strategyRegistry ?? this.createDefaultRegistry();
  }
  /**
   * Creates the default strategy registry with standard wrapper strategies.
   *
   * @returns Registry with I18n, Notification, Settings, and Noop strategies
   */
  createDefaultRegistry() {
    const registry = new ApiWrapperStrategyRegistry();
    registry.registerAll([
      new I18nWrapperStrategy(),
      new NotificationWrapperStrategy(),
      new SettingsWrapperStrategy(),
      new NoopWrapperStrategy()
      // Fallback strategy
    ]);
    return registry;
  }
  /**
   * Applies read-only wrappers when API consumers resolve sensitive services.
   *
   * Delegates to registered strategies following Open/Closed Principle.
   * No token-specific if/else chains - all logic is in strategies.
   *
   * @param token - API token used for resolution
   * @param service - Service resolved from the container
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Wrapped service when applicable
   */
  wrapSensitiveService(token, service, wellKnownTokens) {
    const strategy = this.strategyRegistry.findStrategy(token, wellKnownTokens);
    if (strategy) {
      return strategy.wrap(service, token, wellKnownTokens);
    }
    return service;
  }
};
__name(_ServiceWrapperFactory, "ServiceWrapperFactory");
let ServiceWrapperFactory = _ServiceWrapperFactory;
function formatReplacementInfo(replacement) {
  return replacement ? `Use "${replacement}" instead.
` : "";
}
__name(formatReplacementInfo, "formatReplacementInfo");
const deprecationMetadata = /* @__PURE__ */ new Map();
function markAsDeprecated(token, reason, replacement, removedInVersion) {
  const apiSafeToken = markAsApiSafe(token);
  deprecationMetadata.set(apiSafeToken, {
    reason,
    replacement: replacement ? String(replacement) : null,
    removedInVersion,
    warningShown: false
  });
  return apiSafeToken;
}
__name(markAsDeprecated, "markAsDeprecated");
function getDeprecationInfo(token) {
  if (!token || typeof token !== "symbol") {
    return null;
  }
  return deprecationMetadata.get(token) || null;
}
__name(getDeprecationInfo, "getDeprecationInfo");
const _DeprecationHandler = class _DeprecationHandler {
  /**
   * Checks if a token is deprecated.
   *
   * @param token - Token to check
   * @returns DeprecationInfo if deprecated, null otherwise
   */
  checkDeprecation(token) {
    return getDeprecationInfo(token) ?? null;
  }
  /**
   * Handles deprecation warnings for tokens.
   * Logs warning to console if token is deprecated and warning hasn't been shown yet.
   *
   * Uses console.warn instead of Logger because:
   * - Deprecation warnings are for external API consumers (not internal logs)
   * - Should be visible even if Logger is disabled/configured differently
   * - Follows npm/Node.js convention for deprecation warnings
   *
   * @param token - Token to check for deprecation
   */
  handleDeprecationWarning(token) {
    const deprecationInfo = getDeprecationInfo(token);
    if (deprecationInfo && !deprecationInfo.warningShown) {
      const replacementInfo = formatReplacementInfo(deprecationInfo.replacement);
      console.warn(
        `[${MODULE_METADATA.ID}] DEPRECATED: Token "${String(token)}" is deprecated.
Reason: ${deprecationInfo.reason}
` + replacementInfo + `This token will be removed in version ${deprecationInfo.removedInVersion}.`
      );
      deprecationInfo.warningShown = true;
    }
  }
};
__name(_DeprecationHandler, "DeprecationHandler");
let DeprecationHandler = _DeprecationHandler;
const _ApiServiceResolver = class _ApiServiceResolver {
  constructor(deprecationHandler, serviceWrapperFactory) {
    this.deprecationHandler = deprecationHandler;
    this.serviceWrapperFactory = serviceWrapperFactory;
  }
  /**
   * Creates the resolve() function for the public API.
   * Resolves services and applies wrappers (throws on error).
   *
   * @param container - PlatformContainerPort for resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Resolve function for ModuleApi
   */
  createResolveFunction(container, wellKnownTokens) {
    return (token) => {
      this.deprecationHandler.handleDeprecationWarning(token);
      const service = container.resolve(token);
      return this.serviceWrapperFactory.wrapSensitiveService(token, service, wellKnownTokens);
    };
  }
  /**
   * Creates the resolveWithError() function for the public API.
   * Resolves services with Result pattern (never throws).
   *
   * @param container - PlatformContainerPort for resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns ResolveWithError function for ModuleApi
   */
  createResolveWithErrorFunction(container, wellKnownTokens) {
    return (token) => {
      this.deprecationHandler.handleDeprecationWarning(token);
      const result = container.resolveWithError(token);
      if (!result.ok) {
        const containerError = {
          code: castContainerErrorCode(result.error.code),
          message: result.error.message,
          cause: result.error.cause,
          tokenDescription: result.error.message
        };
        return err(containerError);
      }
      const service = castResolvedService(result.value);
      const wrappedService = this.serviceWrapperFactory.wrapSensitiveService(
        token,
        service,
        wellKnownTokens
      );
      return ok(wrappedService);
    };
  }
};
__name(_ApiServiceResolver, "ApiServiceResolver");
let ApiServiceResolver = _ApiServiceResolver;
const _ApiHealthMetricsProvider = class _ApiHealthMetricsProvider {
  /**
   * Gets a snapshot of performance metrics.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Current metrics snapshot
   */
  getMetrics(container) {
    const metricsResult = container.resolveWithError(metricsCollectorToken);
    if (!metricsResult.ok) {
      return {
        containerResolutions: 0,
        resolutionErrors: 0,
        avgResolutionTimeMs: 0,
        portSelections: {},
        portSelectionFailures: {},
        cacheHitRate: 0
      };
    }
    const metricsCollector = castResolvedService(metricsResult.value);
    return metricsCollector.getSnapshot();
  }
  /**
   * Gets module health status.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Health status with checks and overall status
   */
  getHealth(container) {
    const healthServiceResult = container.resolveWithError(moduleHealthServiceToken);
    if (!healthServiceResult.ok) {
      return {
        status: "unhealthy",
        checks: {
          containerValidated: false,
          portsSelected: false,
          lastError: "ModuleHealthService not available"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const healthService = castResolvedService(healthServiceResult.value);
    return healthService.getHealth();
  }
};
__name(_ApiHealthMetricsProvider, "ApiHealthMetricsProvider");
let ApiHealthMetricsProvider = _ApiHealthMetricsProvider;
const _ModuleApiInitializer = class _ModuleApiInitializer {
  constructor(deprecationHandler, serviceWrapperFactory, apiServiceResolver, healthMetricsProvider, apiBuilder) {
    this.deprecationHandler = deprecationHandler ?? new DeprecationHandler();
    this.serviceWrapperFactory = serviceWrapperFactory ?? new ServiceWrapperFactory();
    this.apiServiceResolver = apiServiceResolver ?? new ApiServiceResolver(this.deprecationHandler, this.serviceWrapperFactory);
    this.healthMetricsProvider = healthMetricsProvider ?? new ApiHealthMetricsProvider();
    this.apiBuilder = apiBuilder ?? new ModuleApiBuilder(this.apiServiceResolver, this.healthMetricsProvider);
  }
  /**
   * Exposes the module's public API to game.modules.get(MODULE_ID).api
   *
   * This method coordinates all components to create and expose the API.
   * It acts as a Facade, delegating to specialized components.
   *
   * @param container - Initialized and validated PlatformContainerPort
   * @returns Result<void, string> - Ok if successful, Err with error message
   */
  expose(container) {
    if (typeof game === "undefined" || !game?.modules) {
      return err("Game modules not available - API cannot be exposed");
    }
    const mod = game.modules.get(MODULE_METADATA.ID);
    if (!mod) {
      return err(`Module '${MODULE_METADATA.ID}' not found in game.modules`);
    }
    const wellKnownTokens = this.apiBuilder.createApiTokens();
    const api = this.apiBuilder.createApi(container, wellKnownTokens);
    mod.api = api;
    return ok(void 0);
  }
};
__name(_ModuleApiInitializer, "ModuleApiInitializer");
_ModuleApiInitializer.dependencies = [];
let ModuleApiInitializer = _ModuleApiInitializer;
const _DIModuleApiInitializer = class _DIModuleApiInitializer extends ModuleApiInitializer {
  constructor() {
    super();
  }
};
__name(_DIModuleApiInitializer, "DIModuleApiInitializer");
_DIModuleApiInitializer.dependencies = [];
let DIModuleApiInitializer = _DIModuleApiInitializer;
const _HealthCheckRegistry = class _HealthCheckRegistry {
  constructor() {
    this.checks = /* @__PURE__ */ new Map();
  }
  register(check2) {
    this.checks.set(check2.name, check2);
  }
  unregister(name) {
    this.checks.delete(name);
  }
  runAll() {
    const results = /* @__PURE__ */ new Map();
    for (const [name, check2] of this.checks) {
      results.set(name, check2.check());
    }
    return results;
  }
  getCheck(name) {
    return this.checks.get(name);
  }
  getAllChecks() {
    return Array.from(this.checks.values());
  }
  dispose() {
    for (const check2 of this.checks.values()) {
      check2.dispose();
    }
    this.checks.clear();
  }
};
__name(_HealthCheckRegistry, "HealthCheckRegistry");
_HealthCheckRegistry.dependencies = [];
let HealthCheckRegistry = _HealthCheckRegistry;
const _DIHealthCheckRegistry = class _DIHealthCheckRegistry extends HealthCheckRegistry {
  constructor() {
    super();
  }
};
__name(_DIHealthCheckRegistry, "DIHealthCheckRegistry");
_DIHealthCheckRegistry.dependencies = [];
let DIHealthCheckRegistry = _DIHealthCheckRegistry;
const _HealthCheckRegistryAdapter = class _HealthCheckRegistryAdapter {
  constructor() {
    this.registry = new HealthCheckRegistry();
  }
  register(check2) {
    this.registry.register(check2);
  }
  unregister(name) {
    this.registry.unregister(name);
  }
  runAll() {
    return this.registry.runAll();
  }
  getCheck(name) {
    return this.registry.getCheck(name);
  }
  getAllChecks() {
    return this.registry.getAllChecks();
  }
};
__name(_HealthCheckRegistryAdapter, "HealthCheckRegistryAdapter");
let HealthCheckRegistryAdapter = _HealthCheckRegistryAdapter;
var InitPhaseCriticality = /* @__PURE__ */ ((InitPhaseCriticality2) => {
  InitPhaseCriticality2["HALT_ON_ERROR"] = "haltOnError";
  InitPhaseCriticality2["WARN_AND_CONTINUE"] = "warnAndContinue";
  return InitPhaseCriticality2;
})(InitPhaseCriticality || {});
const _InitPhaseRegistry = class _InitPhaseRegistry {
  /**
   * Creates a new registry with the provided phases.
   *
   * @param phases - Array of init phases (will be sorted by priority)
   */
  constructor(phases = []) {
    this.phases = [];
    this.phases = [...phases];
    this.sortPhases();
  }
  /**
   * Returns all phases sorted by priority (ascending).
   *
   * @returns Sorted array of init phases
   */
  getAll() {
    return [...this.phases];
  }
  /**
   * Adds a phase to the registry and re-sorts.
   *
   * @param phase - Phase to add
   */
  add(phase) {
    this.phases.push(phase);
    this.sortPhases();
  }
  /**
   * Sorts phases by priority (ascending).
   */
  sortPhases() {
    this.phases.sort((a, b) => a.priority - b.priority);
  }
};
__name(_InitPhaseRegistry, "InitPhaseRegistry");
let InitPhaseRegistry = _InitPhaseRegistry;
const _MetricsBootstrapper = class _MetricsBootstrapper {
  /**
   * Initializes metrics collector if it supports persistence.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success (warnings logged but don't fail bootstrap)
   */
  static initializeMetrics(container) {
    const metricsResult = container.resolveWithError(metricsCollectorToken);
    if (!metricsResult.ok) {
      return ok(void 0);
    }
    const collector = metricsResult.value;
    if (collector instanceof PersistentMetricsCollector) {
      const initResult = collector.initialize();
      if (!initResult.ok) {
        return ok(void 0);
      }
    }
    return ok(void 0);
  }
};
__name(_MetricsBootstrapper, "MetricsBootstrapper");
let MetricsBootstrapper = _MetricsBootstrapper;
const _MetricsInitPhase = class _MetricsInitPhase {
  constructor() {
    this.id = "metrics-initialization";
    this.priority = 1;
    this.criticality = InitPhaseCriticality.WARN_AND_CONTINUE;
  }
  execute(ctx) {
    return MetricsBootstrapper.initializeMetrics(ctx.container);
  }
};
__name(_MetricsInitPhase, "MetricsInitPhase");
let MetricsInitPhase = _MetricsInitPhase;
const queuedUIChannelToken = createInjectionToken("QueuedUIChannel");
const _NotificationBootstrapper = class _NotificationBootstrapper {
  /**
   * Attaches UI notification channel to NotificationCenter.
   *
   * Uses QueuedUIChannel which queues notifications before UI is available
   * and flushes them when UI becomes available.
   *
   * This phase is optional - failures are logged as warnings but don't fail bootstrap.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error (errors are logged as warnings but don't fail bootstrap)
   */
  static attachNotificationChannels(container) {
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    if (!notificationCenterResult.ok) {
      return err(
        `NotificationCenter could not be resolved: ${notificationCenterResult.error.message}`
      );
    }
    const queuedUIChannelResult = container.resolveWithError(queuedUIChannelToken);
    if (!queuedUIChannelResult.ok) {
      return err(`QueuedUIChannel could not be resolved: ${queuedUIChannelResult.error.message}`);
    }
    const notificationCenter = castResolvedService(
      notificationCenterResult.value
    );
    const queuedUIChannel = castResolvedService(queuedUIChannelResult.value);
    notificationCenter.addChannel(queuedUIChannel);
    return ok(void 0);
  }
};
__name(_NotificationBootstrapper, "NotificationBootstrapper");
let NotificationBootstrapper = _NotificationBootstrapper;
const _NotificationInitPhase = class _NotificationInitPhase {
  constructor() {
    this.id = "notification-channels";
    this.priority = 2;
    this.criticality = InitPhaseCriticality.WARN_AND_CONTINUE;
  }
  execute(ctx) {
    return NotificationBootstrapper.attachNotificationChannels(ctx.container);
  }
};
__name(_NotificationInitPhase, "NotificationInitPhase");
let NotificationInitPhase = _NotificationInitPhase;
const _ApiBootstrapper = class _ApiBootstrapper {
  /**
   * Exposes the module's public API.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error
   */
  static exposeApi(container) {
    const apiInitializerResult = container.resolveWithError(moduleApiInitializerToken);
    if (!apiInitializerResult.ok) {
      return err(`Failed to resolve ModuleApiInitializer: ${apiInitializerResult.error.message}`);
    }
    const apiInitializer = castResolvedService(apiInitializerResult.value);
    const exposeResult = apiInitializer.expose(container);
    if (!exposeResult.ok) {
      return err(`Failed to expose API: ${exposeResult.error}`);
    }
    return ok(void 0);
  }
};
__name(_ApiBootstrapper, "ApiBootstrapper");
let ApiBootstrapper = _ApiBootstrapper;
const _ApiInitPhase = class _ApiInitPhase {
  constructor() {
    this.id = "api-exposure";
    this.priority = 3;
    this.criticality = InitPhaseCriticality.HALT_ON_ERROR;
  }
  execute(ctx) {
    return ApiBootstrapper.exposeApi(ctx.container);
  }
};
__name(_ApiInitPhase, "ApiInitPhase");
let ApiInitPhase = _ApiInitPhase;
const moduleSettingsRegistrarToken = createInjectionToken("ModuleSettingsRegistrar");
const _SettingsBootstrapper = class _SettingsBootstrapper {
  /**
   * Registers all module settings.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error
   */
  static registerSettings(container) {
    const settingsRegistrarResult = container.resolveWithError(moduleSettingsRegistrarToken);
    if (!settingsRegistrarResult.ok) {
      return err(
        `Failed to resolve ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
      );
    }
    const settingsRegistrar = castResolvedService(
      settingsRegistrarResult.value
    );
    settingsRegistrar.registerAll();
    return ok(void 0);
  }
};
__name(_SettingsBootstrapper, "SettingsBootstrapper");
let SettingsBootstrapper = _SettingsBootstrapper;
const _SettingsInitPhase = class _SettingsInitPhase {
  constructor() {
    this.id = "settings-registration";
    this.priority = 4;
    this.criticality = InitPhaseCriticality.HALT_ON_ERROR;
  }
  execute(ctx) {
    return SettingsBootstrapper.registerSettings(ctx.container);
  }
};
__name(_SettingsInitPhase, "SettingsInitPhase");
let SettingsInitPhase = _SettingsInitPhase;
const _LoggingBootstrapper = class _LoggingBootstrapper {
  /**
   * Configures logger with current setting value.
   *
   * @param container - PlatformContainerPort for service resolution
   * @param logger - Logger instance to configure
   * @returns Result indicating success (always succeeds, settings are optional)
   */
  static configureLogging(container, logger) {
    const settingsResult = container.resolveWithError(foundrySettingsToken);
    if (!settingsResult.ok) {
      return ok(void 0);
    }
    const settings = castResolvedService(settingsResult.value);
    const logLevelResult = settings.get(
      MODULE_METADATA.ID,
      SETTING_KEYS.LOG_LEVEL,
      LOG_LEVEL_SCHEMA
    );
    if (logLevelResult.ok && logger.setMinLevel) {
      logger.setMinLevel(logLevelResult.value);
      logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
    }
    return ok(void 0);
  }
};
__name(_LoggingBootstrapper, "LoggingBootstrapper");
let LoggingBootstrapper = _LoggingBootstrapper;
const _LoggingInitPhase = class _LoggingInitPhase {
  constructor() {
    this.id = "logging-configuration";
    this.priority = 5;
    this.criticality = InitPhaseCriticality.WARN_AND_CONTINUE;
  }
  execute(ctx) {
    return LoggingBootstrapper.configureLogging(ctx.container, ctx.logger);
  }
};
__name(_LoggingInitPhase, "LoggingInitPhase");
let LoggingInitPhase = _LoggingInitPhase;
const invalidateJournalCacheOnChangeUseCaseToken = createInjectionToken(
  "InvalidateJournalCacheOnChangeUseCase"
);
const processJournalDirectoryOnRenderUseCaseToken = createInjectionToken(
  "ProcessJournalDirectoryOnRenderUseCase"
);
const triggerJournalDirectoryReRenderUseCaseToken = createInjectionToken(
  "TriggerJournalDirectoryReRenderUseCase"
);
const registerContextMenuUseCaseToken = createInjectionToken(
  "RegisterContextMenuUseCase"
);
const moduleEventRegistrarToken = createInjectionToken("ModuleEventRegistrar");
const _EventsBootstrapper = class _EventsBootstrapper {
  /**
   * Registers all event listeners.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error
   */
  static registerEvents(container) {
    const eventRegistrarResult = container.resolveWithError(moduleEventRegistrarToken);
    if (!eventRegistrarResult.ok) {
      return err(`Failed to resolve ModuleEventRegistrar: ${eventRegistrarResult.error.message}`);
    }
    const eventRegistrar = castResolvedService(eventRegistrarResult.value);
    const eventRegistrationResult = eventRegistrar.registerAll();
    if (!eventRegistrationResult.ok) {
      const errorMessages = eventRegistrationResult.error.map((e) => e.message).join(", ");
      return err(`Failed to register one or more event listeners: ${errorMessages}`);
    }
    return ok(void 0);
  }
};
__name(_EventsBootstrapper, "EventsBootstrapper");
let EventsBootstrapper = _EventsBootstrapper;
const _EventsInitPhase = class _EventsInitPhase {
  constructor() {
    this.id = "event-registration";
    this.priority = 6;
    this.criticality = InitPhaseCriticality.HALT_ON_ERROR;
  }
  execute(ctx) {
    return EventsBootstrapper.registerEvents(ctx.container);
  }
};
__name(_EventsInitPhase, "EventsInitPhase");
let EventsInitPhase = _EventsInitPhase;
const journalContextMenuLibWrapperServiceToken = createInjectionToken("JournalContextMenuLibWrapperService");
const _ContextMenuBootstrapper = class _ContextMenuBootstrapper {
  /**
   * Registers context menu libWrapper and callbacks.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error (errors are logged as warnings but don't fail bootstrap)
   */
  static registerContextMenu(container) {
    const contextMenuLibWrapperResult = container.resolveWithError(
      journalContextMenuLibWrapperServiceToken
    );
    if (!contextMenuLibWrapperResult.ok) {
      return err(
        `JournalContextMenuLibWrapperService could not be resolved: ${contextMenuLibWrapperResult.error.message}`
      );
    }
    const contextMenuLibWrapper = castResolvedService(
      contextMenuLibWrapperResult.value
    );
    const registerResult = contextMenuLibWrapper.register();
    if (!registerResult.ok) {
      return err(`Context menu libWrapper registration failed: ${registerResult.error.message}`);
    }
    const contextMenuUseCaseResult = container.resolveWithError(registerContextMenuUseCaseToken);
    if (!contextMenuUseCaseResult.ok) {
      return err(
        `RegisterContextMenuUseCase could not be resolved: ${contextMenuUseCaseResult.error.message}`
      );
    }
    const contextMenuUseCase = castResolvedService(
      contextMenuUseCaseResult.value
    );
    const callbackRegisterResult = contextMenuUseCase.register();
    if (!callbackRegisterResult.ok) {
      return err(
        `Context menu callback registration failed: ${callbackRegisterResult.error.message}`
      );
    }
    return ok(void 0);
  }
};
__name(_ContextMenuBootstrapper, "ContextMenuBootstrapper");
let ContextMenuBootstrapper = _ContextMenuBootstrapper;
const _ContextMenuInitPhase = class _ContextMenuInitPhase {
  constructor() {
    this.id = "context-menu-registration";
    this.priority = 7;
    this.criticality = InitPhaseCriticality.WARN_AND_CONTINUE;
  }
  execute(ctx) {
    return ContextMenuBootstrapper.registerContextMenu(ctx.container);
  }
};
__name(_ContextMenuInitPhase, "ContextMenuInitPhase");
let ContextMenuInitPhase = _ContextMenuInitPhase;
function createDefaultInitPhaseRegistry() {
  return new InitPhaseRegistry([
    new MetricsInitPhase(),
    new NotificationInitPhase(),
    new ApiInitPhase(),
    new SettingsInitPhase(),
    new LoggingInitPhase(),
    new EventsInitPhase(),
    new ContextMenuInitPhase()
  ]);
}
__name(createDefaultInitPhaseRegistry, "createDefaultInitPhaseRegistry");
const _InitOrchestrator = class _InitOrchestrator {
  /**
   * Creates a new InitOrchestrator instance.
   *
   * @param registry - Registry providing init phases (defaults to standard phases)
   */
  constructor(registry) {
    this.registry = registry ?? createDefaultInitPhaseRegistry();
  }
  /**
   * Executes the complete initialization sequence.
   *
   * Phases are executed in priority order (ascending). Error handling
   * follows each phase's criticality setting:
   * - HALT_ON_ERROR: Errors are collected and returned, stopping bootstrap
   * - WARN_AND_CONTINUE: Errors are logged as warnings but don't stop bootstrap
   *
   * @param container - PlatformContainerPort for service resolution
   * @param logger - Logger for error reporting
   * @returns Result indicating success or aggregated errors
   */
  execute(container, logger) {
    const errors = [];
    const phases = this.registry.getAll();
    const ctx = { container, logger };
    for (const phase of phases) {
      const result = phase.execute(ctx);
      if (!result.ok) {
        if (phase.criticality === InitPhaseCriticality.HALT_ON_ERROR) {
          errors.push({
            phase: phase.id,
            message: result.error
          });
          logger.error(`Failed to execute phase '${phase.id}': ${result.error}`);
        } else {
          logger.warn(`Phase '${phase.id}' failed: ${result.error}`);
        }
      }
    }
    if (errors.length > 0) {
      return err(errors);
    }
    return ok(void 0);
  }
  /**
   * Static convenience method for backward compatibility.
   *
   * Creates a new orchestrator with default registry and executes.
   *
   * @param container - PlatformContainerPort for service resolution
   * @param logger - Logger for error reporting
   * @returns Result indicating success or aggregated errors
   */
  static execute(container, logger) {
    const orchestrator = new _InitOrchestrator();
    return orchestrator.execute(container, logger);
  }
};
__name(_InitOrchestrator, "InitOrchestrator");
let InitOrchestrator = _InitOrchestrator;
const _BootstrapInitHookService = class _BootstrapInitHookService {
  constructor(logger, container, bootstrapEvents) {
    this.logger = logger;
    this.container = container;
    this.bootstrapEvents = bootstrapEvents;
  }
  /**
   * Registers the init event via PlatformBootstrapEventPort.
   * Must be called before the platform's init hook fires.
   */
  register() {
    const result = this.bootstrapEvents.onInit(() => this.handleInit());
    if (!result.ok) {
      this.logger.warn(
        `Init hook registration failed: ${result.error.message}`,
        result.error.details
      );
    }
  }
  /* v8 ignore start -- @preserve */
  /* Foundry-Hooks und UI-spezifische Pfade hängen stark von der Laufzeitumgebung ab
   * und werden primär über Integrations-/E2E-Tests abgesichert. Für das aktuelle Quality-Gateway
   * blenden wir diese verzweigten Pfade temporär aus und reduzieren die Ignores später gezielt. */
  handleInit() {
    this.logger.info("init-phase");
    const result = InitOrchestrator.execute(this.container, this.logger);
    if (!result.ok) {
      const errorMessages = result.error.map((e) => `${e.phase}: ${e.message}`).join("; ");
      this.logger.error(`Init phase completed with errors: ${errorMessages}`);
    } else {
      this.logger.info("init-phase completed");
    }
  }
  /* v8 ignore stop -- @preserve */
};
__name(_BootstrapInitHookService, "BootstrapInitHookService");
let BootstrapInitHookService = _BootstrapInitHookService;
const _DIBootstrapInitHookService = class _DIBootstrapInitHookService extends BootstrapInitHookService {
  constructor(logger, container, bootstrapEvents) {
    super(logger, container, bootstrapEvents);
  }
};
__name(_DIBootstrapInitHookService, "DIBootstrapInitHookService");
_DIBootstrapInitHookService.dependencies = [
  loggerToken,
  platformContainerPortToken,
  platformBootstrapEventPortToken
];
let DIBootstrapInitHookService = _DIBootstrapInitHookService;
const _ModuleReadyService = class _ModuleReadyService {
  constructor(moduleReadyPort, loggingPort) {
    this.moduleReadyPort = moduleReadyPort;
    this.loggingPort = loggingPort;
  }
  /**
   * Sets module.ready to true (ready state).
   * Should be called when bootstrap-ready-hook completes.
   */
  setReady() {
    const result = this.moduleReadyPort.setReady();
    if (!result.ok) {
      this.loggingPort.warn(
        `Failed to set module.ready: ${result.error.message}`,
        result.error.details
      );
    } else {
      this.loggingPort.info("module.ready set to true");
    }
  }
};
__name(_ModuleReadyService, "ModuleReadyService");
let ModuleReadyService = _ModuleReadyService;
const _DIModuleReadyService = class _DIModuleReadyService extends ModuleReadyService {
  constructor(moduleReadyPort, loggingPort) {
    super(moduleReadyPort, loggingPort);
  }
};
__name(_DIModuleReadyService, "DIModuleReadyService");
_DIModuleReadyService.dependencies = [platformModuleReadyPortToken, platformLoggingPortToken];
let DIModuleReadyService = _DIModuleReadyService;
const moduleReadyServiceToken = createInjectionToken("ModuleReadyService");
const _BootstrapReadyHookService = class _BootstrapReadyHookService {
  constructor(logger, bootstrapEvents, moduleReadyService) {
    this.logger = logger;
    this.bootstrapEvents = bootstrapEvents;
    this.moduleReadyService = moduleReadyService;
  }
  /**
   * Registers the ready event via PlatformBootstrapEventPort.
   * Must be called before the platform's ready hook fires.
   */
  register() {
    const result = this.bootstrapEvents.onReady(() => this.handleReady());
    if (!result.ok) {
      this.logger.warn(
        `Ready hook registration failed: ${result.error.message}`,
        result.error.details
      );
    }
  }
  /* v8 ignore start -- @preserve */
  /* Foundry-Hooks und UI-spezifische Pfade hängen stark von der Laufzeitumgebung ab
   * und werden primär über Integrations-/E2E-Tests abgesichert. Für das aktuelle Quality-Gateway
   * blenden wir diese verzweigten Pfade temporär aus und reduzieren die Ignores später gezielt. */
  handleReady() {
    this.logger.info("ready-phase");
    this.moduleReadyService.setReady();
    this.logger.info("ready-phase completed");
  }
  /* v8 ignore stop -- @preserve */
};
__name(_BootstrapReadyHookService, "BootstrapReadyHookService");
let BootstrapReadyHookService = _BootstrapReadyHookService;
const _DIBootstrapReadyHookService = class _DIBootstrapReadyHookService extends BootstrapReadyHookService {
  constructor(logger, bootstrapEvents, moduleReadyService) {
    super(logger, bootstrapEvents, moduleReadyService);
  }
};
__name(_DIBootstrapReadyHookService, "DIBootstrapReadyHookService");
_DIBootstrapReadyHookService.dependencies = [
  loggerToken,
  platformBootstrapEventPortToken,
  moduleReadyServiceToken
];
let DIBootstrapReadyHookService = _DIBootstrapReadyHookService;
const _FoundryBootstrapEventAdapter = class _FoundryBootstrapEventAdapter {
  onInit(callback) {
    if (typeof Hooks === "undefined") {
      return err({
        code: "PLATFORM_NOT_AVAILABLE",
        message: "Foundry Hooks API not available"
      });
    }
    try {
      Hooks.on("init", callback);
      return ok(void 0);
    } catch (error) {
      return err({
        code: "EVENT_REGISTRATION_FAILED",
        message: `Failed to register init event: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      });
    }
  }
  onReady(callback) {
    if (typeof Hooks === "undefined") {
      return err({
        code: "PLATFORM_NOT_AVAILABLE",
        message: "Foundry Hooks API not available"
      });
    }
    try {
      Hooks.on("ready", callback);
      return ok(void 0);
    } catch (error) {
      return err({
        code: "EVENT_REGISTRATION_FAILED",
        message: `Failed to register ready event: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      });
    }
  }
};
__name(_FoundryBootstrapEventAdapter, "FoundryBootstrapEventAdapter");
let FoundryBootstrapEventAdapter = _FoundryBootstrapEventAdapter;
const _DIFoundryBootstrapEventAdapter = class _DIFoundryBootstrapEventAdapter extends FoundryBootstrapEventAdapter {
};
__name(_DIFoundryBootstrapEventAdapter, "DIFoundryBootstrapEventAdapter");
_DIFoundryBootstrapEventAdapter.dependencies = [];
let DIFoundryBootstrapEventAdapter = _DIFoundryBootstrapEventAdapter;
function createFoundryError(code, message2, details, cause) {
  return { code, message: message2, details, cause };
}
__name(createFoundryError, "createFoundryError");
function isErrorLike(obj) {
  return typeof obj === "object" && obj !== null;
}
__name(isErrorLike, "isErrorLike");
function isFoundryError(error) {
  if (!isErrorLike(error)) return false;
  return "code" in error && "message" in error && typeof error.code === "string" && typeof error.message === "string";
}
__name(isFoundryError, "isFoundryError");
const portSelectorToken = createInjectionToken("PortSelector");
const foundryModulePortRegistryToken = createInjectionToken(
  "FoundryModulePortRegistry"
);
const retryServiceToken = createInjectionToken("RetryService");
function hasMethod(obj, methodName) {
  return obj !== null && obj !== void 0 && typeof obj === "object" && methodName in obj && // type-coverage:ignore-next-line - Runtime type guard requires cast to check method type
  typeof obj[methodName] === "function";
}
__name(hasMethod, "hasMethod");
function hasProperty(obj, propertyName) {
  return obj !== null && obj !== void 0 && typeof obj === "object" && propertyName in obj;
}
__name(hasProperty, "hasProperty");
function isObjectWithMethods(obj, methodNames) {
  if (obj === null || obj === void 0 || typeof obj !== "object") {
    return false;
  }
  return methodNames.every((methodName) => hasMethod(obj, methodName));
}
__name(isObjectWithMethods, "isObjectWithMethods");
function castFoundrySettingsApi(settings) {
  if (!isObjectWithMethods(settings, ["register", "get", "set"])) {
    return err(
      createFoundryError(
        "API_NOT_AVAILABLE",
        "game.settings does not have required methods (register, get, set)",
        {
          missingMethods: ["register", "get", "set"]
        }
      )
    );
  }
  return ok(settings);
}
__name(castFoundrySettingsApi, "castFoundrySettingsApi");
function castFoundryDocumentForFlag(document2) {
  if (!isObjectWithMethods(document2, ["getFlag", "setFlag"])) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Document does not have required methods (getFlag, setFlag)",
        {
          missingMethods: ["getFlag", "setFlag"]
        }
      )
    );
  }
  return ok(document2);
}
__name(castFoundryDocumentForFlag, "castFoundryDocumentForFlag");
function castFoundryError(error) {
  return error;
}
__name(castFoundryError, "castFoundryError");
function castDisposablePort(port) {
  if (!port || typeof port !== "object") {
    return null;
  }
  if (hasMethod(port, "dispose")) {
    return port;
  }
  return null;
}
__name(castDisposablePort, "castDisposablePort");
function ensureNonEmptyArray(arr) {
  if (arr.length === 0) {
    return err(
      createFoundryError("VALIDATION_FAILED", "Array must not be empty", { arrayLength: 0 })
    );
  }
  return ok(arr);
}
__name(ensureNonEmptyArray, "ensureNonEmptyArray");
function extractHtmlElement(html) {
  return html instanceof HTMLElement ? html : null;
}
__name(extractHtmlElement, "extractHtmlElement");
function getFactoryOrError(factories, version) {
  const factory = factories.get(version);
  if (!factory) {
    return err(
      createFoundryError("PORT_NOT_FOUND", `Factory for version ${version} not found in registry`, {
        version
      })
    );
  }
  return ok(factory);
}
__name(getFactoryOrError, "getFactoryOrError");
function castFoundryDocumentWithUpdate(document2) {
  if (!isObjectWithMethods(document2, ["update"])) {
    return err(
      createFoundryError("VALIDATION_FAILED", "Document does not have required method (update)", {
        missingMethods: ["update"]
      })
    );
  }
  return ok(document2);
}
__name(castFoundryDocumentWithUpdate, "castFoundryDocumentWithUpdate");
function castFoundryJournalEntryClass() {
  if (typeof globalThis !== "object" || globalThis === null || !("JournalEntry" in globalThis)) {
    return err(
      createFoundryError(
        "API_NOT_AVAILABLE",
        "Foundry JournalEntry class not available in globalThis",
        {}
      )
    );
  }
  const journalEntryClass = globalThis.JournalEntry;
  if (!isObjectWithMethods(journalEntryClass, ["create"])) {
    return err(
      createFoundryError(
        "API_NOT_AVAILABLE",
        "Foundry JournalEntry class does not have required method (create)",
        {
          missingMethods: ["create"]
        }
      )
    );
  }
  return ok(journalEntryClass);
}
__name(castFoundryJournalEntryClass, "castFoundryJournalEntryClass");
function castCreatedJournalEntry(document2) {
  return document2;
}
__name(castCreatedJournalEntry, "castCreatedJournalEntry");
const _FoundryServiceBase = class _FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    this.port = null;
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
    this.retryService = retryService;
  }
  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector with token-based selection to resolve ports from the DI container.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version. Ports are resolved
   * from the DI container, ensuring DIP (Dependency Inversion Principle) compliance.
   *
   * @param adapterName - Name for logging purposes (e.g., "FoundryGame")
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  getPort(adapterName) {
    if (this.port === null) {
      const tokens = this.portRegistry.getTokens();
      const portResult = this.portSelector.selectPortFromTokens(tokens, void 0, adapterName);
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }
  /**
   * Executes a Foundry API operation with automatic retry on transient failures.
   *
   * Use this for any port method call to handle:
   * - Race conditions (Foundry not fully initialized)
   * - Timing issues (DOM/Settings not ready)
   * - Transient port selection failures
   *
   * @template T - The success type
   * @param fn - Function to execute (should call port methods)
   * @param operationName - Operation name for logging (e.g., "FoundryGame.getJournalEntries")
   * @param maxAttempts - Max retry attempts (default: 2 = 1 retry)
   * @returns Result from operation or mapped error
   *
   * @example
   * ```typescript
   * getJournalEntries(): Result<Entry[], FoundryError> {
   *   return this.withRetry(
   *     () => {
   *       const portResult = this.getPort("FoundryGame");
   *       if (!portResult.ok) return portResult;
   *       return portResult.value.getJournalEntries();
   *     },
   *     "FoundryGame.getJournalEntries"
   *   );
   * }
   * ```
   */
  withRetry(fn, operationName, maxAttempts = 2) {
    return this.retryService.retrySync(fn, {
      maxAttempts,
      operationName,
      mapException: /* @__PURE__ */ __name((error) => ({
        code: "OPERATION_FAILED",
        message: `${operationName} failed: ${String(error)}`,
        cause: error instanceof Error ? error : void 0
      }), "mapException")
    });
  }
  /**
   * Async variant of withRetry for async operations.
   *
   * @template T - The success type
   * @param fn - Async function to execute
   * @param operationName - Operation name for logging
   * @param maxAttempts - Max retry attempts (default: 2)
   * @returns Promise resolving to Result
   *
   * @example
   * ```typescript
   * async setFlag<T>(doc, scope, key, value): Promise<Result<void, FoundryError>> {
   *   return this.withRetryAsync(
   *     async () => {
   *       const portResult = this.getPort("FoundryDocument");
   *       if (!portResult.ok) return portResult;
   *       return await portResult.value.setFlag(doc, scope, key, value);
   *     },
   *     "FoundryDocument.setFlag"
   *   );
   * }
   * ```
   */
  async withRetryAsync(fn, operationName, maxAttempts = 2) {
    return this.retryService.retry(fn, {
      maxAttempts,
      delayMs: 100,
      // 100ms delay between retries
      operationName,
      mapException: /* @__PURE__ */ __name((error) => ({
        code: "OPERATION_FAILED",
        message: `${operationName} failed: ${String(error)}`,
        cause: error instanceof Error ? error : void 0
      }), "mapException")
    });
  }
  /**
   * Cleans up resources.
   * Disposes the port if it implements Disposable, then resets the reference.
   * All ports now implement dispose() with #disposed state guards.
   */
  dispose() {
    const disposable = castDisposablePort(this.port);
    if (disposable) {
      disposable.dispose();
    }
    this.port = null;
  }
};
__name(_FoundryServiceBase, "FoundryServiceBase");
let FoundryServiceBase = _FoundryServiceBase;
const _FoundryModuleReadyPort = class _FoundryModuleReadyPort extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService, moduleId) {
    super(portSelector, portRegistry, retryService);
    this.moduleId = moduleId;
  }
  setReady() {
    const result = this.withRetry(() => {
      const portResult = this.getPort("FoundryModule");
      if (!portResult.ok) {
        return {
          ok: false,
          error: createFoundryError(
            "PORT_SELECTION_FAILED",
            portResult.error.message,
            portResult.error.details
          )
        };
      }
      const success = portResult.value.setModuleReady(this.moduleId);
      if (!success) {
        return {
          ok: false,
          error: createFoundryError("OPERATION_FAILED", `Module ${this.moduleId} not found`)
        };
      }
      return { ok: true, value: void 0 };
    }, "FoundryModule.setReady");
    if (!result.ok) {
      let errorCode;
      if (result.error.code === "PORT_SELECTION_FAILED" || result.error.code === "API_NOT_AVAILABLE") {
        errorCode = "PLATFORM_NOT_AVAILABLE";
      } else if (result.error.code === "OPERATION_FAILED") {
        errorCode = "OPERATION_FAILED";
      } else {
        errorCode = "OPERATION_FAILED";
      }
      return {
        ok: false,
        error: {
          code: errorCode,
          message: result.error.message,
          details: result.error.details
        }
      };
    }
    return { ok: true, value: void 0 };
  }
};
__name(_FoundryModuleReadyPort, "FoundryModuleReadyPort");
let FoundryModuleReadyPort = _FoundryModuleReadyPort;
const _DIFoundryModuleReadyPort = class _DIFoundryModuleReadyPort extends FoundryModuleReadyPort {
  constructor(portSelector, portRegistry, retryService, moduleId) {
    super(portSelector, portRegistry, retryService, moduleId);
  }
};
__name(_DIFoundryModuleReadyPort, "DIFoundryModuleReadyPort");
_DIFoundryModuleReadyPort.dependencies = [
  portSelectorToken,
  foundryModulePortRegistryToken,
  retryServiceToken,
  moduleIdToken
];
let DIFoundryModuleReadyPort = _DIFoundryModuleReadyPort;
function registerCoreServices(container) {
  const runtimeConfig = container.getRegisteredValue(runtimeConfigToken);
  if (!runtimeConfig) {
    return err("RuntimeConfigService not registered");
  }
  const enablePersistence = runtimeConfig.get("enableMetricsPersistence") === true;
  if (enablePersistence) {
    const metricsKey = runtimeConfig.get("metricsPersistenceKey") ?? "fvtt_relationship_app_module.metrics";
    const storageInstance = createMetricsStorage(metricsKey);
    const storageResult = container.registerValue(metricsStorageToken, storageInstance);
    if (isErr(storageResult)) {
      return err(`Failed to register MetricsStorage: ${storageResult.error.message}`);
    }
    const persistentResult = container.registerClass(
      metricsCollectorToken,
      DIPersistentMetricsCollector,
      ServiceLifecycle.SINGLETON
    );
    if (isErr(persistentResult)) {
      return err(
        `Failed to register PersistentMetricsCollector: ${persistentResult.error.message}`
      );
    }
  } else {
    const metricsResult = container.registerClass(
      metricsCollectorToken,
      DIMetricsCollector,
      ServiceLifecycle.SINGLETON
    );
    if (isErr(metricsResult)) {
      return err(`Failed to register MetricsCollector: ${metricsResult.error.message}`);
    }
  }
  const samplerResult = container.registerClass(
    metricsSamplerToken,
    DIMetricsSampler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(samplerResult)) {
    return err(`Failed to register MetricsSampler: ${samplerResult.error.message}`);
  }
  container.registerAlias(metricsRecorderToken, metricsCollectorToken);
  const traceContextResult = container.registerClass(
    traceContextToken,
    DITraceContext,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(traceContextResult)) {
    return err(`Failed to register TraceContext: ${traceContextResult.error.message}`);
  }
  const loggerResult = container.registerClass(
    loggerToken,
    DIConsoleLoggerService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(loggerResult)) {
    return err(`Failed to register Logger: ${loggerResult.error.message}`);
  }
  const reporterResult = container.registerClass(
    metricsReporterToken,
    DIMetricsReporter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(reporterResult)) {
    return err(`Failed to register MetricsReporter: ${reporterResult.error.message}`);
  }
  const registryResult = container.registerClass(
    healthCheckRegistryToken,
    HealthCheckRegistryAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(registryResult)) {
    return err(`Failed to register HealthCheckRegistry: ${registryResult.error.message}`);
  }
  const healthResult = container.registerClass(
    moduleHealthServiceToken,
    DIModuleHealthService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(healthResult)) {
    return err(`Failed to register ModuleHealthService: ${healthResult.error.message}`);
  }
  const apiInitResult = container.registerClass(
    moduleApiInitializerToken,
    DIModuleApiInitializer,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(apiInitResult)) {
    return err(`Failed to register ModuleApiInitializer: ${apiInitResult.error.message}`);
  }
  const bootstrapEventsResult = container.registerClass(
    platformBootstrapEventPortToken,
    DIFoundryBootstrapEventAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(bootstrapEventsResult)) {
    return err(
      `Failed to register PlatformBootstrapEventPort: ${bootstrapEventsResult.error.message}`
    );
  }
  const initHookResult = container.registerClass(
    bootstrapInitHookServiceToken,
    DIBootstrapInitHookService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(initHookResult)) {
    return err(`Failed to register BootstrapInitHookService: ${initHookResult.error.message}`);
  }
  const moduleReadyPortResult = container.registerClass(
    platformModuleReadyPortToken,
    DIFoundryModuleReadyPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(moduleReadyPortResult)) {
    return err(
      `Failed to register PlatformModuleReadyPort: ${moduleReadyPortResult.error.message}`
    );
  }
  const moduleReadyResult = container.registerClass(
    moduleReadyServiceToken,
    DIModuleReadyService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(moduleReadyResult)) {
    return err(`Failed to register ModuleReadyService: ${moduleReadyResult.error.message}`);
  }
  const readyHookResult = container.registerClass(
    bootstrapReadyHookServiceToken,
    DIBootstrapReadyHookService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(readyHookResult)) {
    return err(`Failed to register BootstrapReadyHookService: ${readyHookResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerCoreServices, "registerCoreServices");
const portSelectionEventEmitterToken = createInjectionToken(
  "PortSelectionEventEmitter"
);
const observabilityRegistryToken = createInjectionToken("ObservabilityRegistry");
const portSelectionObservabilityToken = createInjectionToken(
  "PortSelectionObservability"
);
const portSelectionPerformanceTrackerToken = createInjectionToken("PortSelectionPerformanceTracker");
const portSelectionObserverToken = createInjectionToken("PortSelectionObserver");
const _PortSelectionEventEmitter = class _PortSelectionEventEmitter {
  constructor() {
    this.subscribers = /* @__PURE__ */ new Set();
  }
  subscribe(callback) {
    this.subscribers.add(callback);
    let active = true;
    return () => {
      if (!active) {
        return;
      }
      active = false;
      this.subscribers.delete(callback);
    };
  }
  emit(event) {
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (error) {
        console.error("PortSelectionEventEmitter subscriber error", error);
      }
    }
  }
  clear() {
    this.subscribers.clear();
  }
  getSubscriberCount() {
    return this.subscribers.size;
  }
};
__name(_PortSelectionEventEmitter, "PortSelectionEventEmitter");
let PortSelectionEventEmitter = _PortSelectionEventEmitter;
const _DIPortSelectionEventEmitter = class _DIPortSelectionEventEmitter extends PortSelectionEventEmitter {
};
__name(_DIPortSelectionEventEmitter, "DIPortSelectionEventEmitter");
_DIPortSelectionEventEmitter.dependencies = [];
let DIPortSelectionEventEmitter = _DIPortSelectionEventEmitter;
const _ObservabilityRegistry = class _ObservabilityRegistry {
  constructor(logger, metrics) {
    this.logger = logger;
    this.metrics = metrics;
    this.subscriptions = [];
  }
  /**
   * Register a PortSelector for observability.
   * Wires event emission to logging and metrics.
   *
   * @param service - Observable service that emits PortSelectionEvents
   */
  registerPortSelector(service) {
    const unsubscribe = service.onEvent((event) => {
      if (event.type === "success") {
        const adapterSuffix = event.adapterName ? ` for ${event.adapterName}` : "";
        this.logger.debug(
          `Port v${event.selectedVersion} selected in ${event.durationMs.toFixed(2)}ms${adapterSuffix}`
        );
        this.metrics.recordPortSelection(event.selectedVersion);
      } else {
        this.logger.error("Port selection failed", {
          foundryVersion: event.foundryVersion,
          availableVersions: event.availableVersions,
          adapterName: event.adapterName
        });
        this.metrics.recordPortSelectionFailure(event.foundryVersion);
      }
    });
    this.subscriptions.push(unsubscribe);
  }
  /**
   * Disposes all registered observers and clears internal state.
   * Intended to be called when the DI container is disposed.
   */
  dispose() {
    while (this.subscriptions.length > 0) {
      const unsubscribe = this.subscriptions.pop();
      try {
        unsubscribe?.();
      } catch {
      }
    }
  }
  // Future: Add more registration methods for other observable services
  // registerSomeOtherService(service: ObservableService<OtherEvent>): void { ... }
};
__name(_ObservabilityRegistry, "ObservabilityRegistry");
let ObservabilityRegistry = _ObservabilityRegistry;
const _DIObservabilityRegistry = class _DIObservabilityRegistry extends ObservabilityRegistry {
  constructor(logger, metrics) {
    super(logger, metrics);
  }
};
__name(_DIObservabilityRegistry, "DIObservabilityRegistry");
_DIObservabilityRegistry.dependencies = [loggerToken, metricsRecorderToken];
let DIObservabilityRegistry = _DIObservabilityRegistry;
const _PortSelectionObservability = class _PortSelectionObservability {
  constructor(observabilityRegistry) {
    this.observabilityRegistry = observabilityRegistry;
  }
  /**
   * Register PortSelector with ObservabilityRegistry.
   * This enables automatic logging and metrics collection.
   */
  registerWithObservabilityRegistry(selector) {
    this.observabilityRegistry.registerPortSelector(selector);
  }
  /**
   * Setup observability for PortSelector.
   * Wires PortSelector events to PortSelectionObserver.
   */
  setupObservability(selector, observer) {
    selector.onEvent((event) => {
      observer.handleEvent(event);
    });
  }
};
__name(_PortSelectionObservability, "PortSelectionObservability");
let PortSelectionObservability = _PortSelectionObservability;
const _DIPortSelectionObservability = class _DIPortSelectionObservability extends PortSelectionObservability {
  constructor(observabilityRegistry) {
    super(observabilityRegistry);
  }
};
__name(_DIPortSelectionObservability, "DIPortSelectionObservability");
_DIPortSelectionObservability.dependencies = [observabilityRegistryToken];
let DIPortSelectionObservability = _DIPortSelectionObservability;
const _PortSelectionPerformanceTracker = class _PortSelectionPerformanceTracker {
  /**
   * Start performance tracking.
   * Records the current high-resolution timestamp.
   */
  startTracking() {
    this.startTime = performance.now();
  }
  /**
   * End performance tracking and return duration in milliseconds.
   * @returns Duration in milliseconds, or 0 if tracking was not started
   */
  endTracking() {
    if (this.startTime === void 0) {
      return 0;
    }
    const durationMs = performance.now() - this.startTime;
    this.startTime = void 0;
    return durationMs;
  }
};
__name(_PortSelectionPerformanceTracker, "PortSelectionPerformanceTracker");
let PortSelectionPerformanceTracker = _PortSelectionPerformanceTracker;
const _DIPortSelectionPerformanceTracker = class _DIPortSelectionPerformanceTracker extends PortSelectionPerformanceTracker {
  constructor() {
    super();
  }
};
__name(_DIPortSelectionPerformanceTracker, "DIPortSelectionPerformanceTracker");
_DIPortSelectionPerformanceTracker.dependencies = [];
let DIPortSelectionPerformanceTracker = _DIPortSelectionPerformanceTracker;
const _PortSelectionObserver = class _PortSelectionObserver {
  constructor(logger, metrics, eventEmitter) {
    this.logger = logger;
    this.metrics = metrics;
    this.eventEmitter = eventEmitter;
  }
  /**
   * Handle a port selection event.
   *
   * Performs appropriate logging, metrics recording, and event emission.
   *
   * @param event - The port selection event to handle
   */
  handleEvent(event) {
    this.eventEmitter.emit(event);
    if (event.type === "success") {
      this.handleSuccess(event);
    } else {
      this.handleFailure(event);
    }
  }
  /**
   * Handle successful port selection.
   *
   * Logs debug message and records metrics.
   */
  handleSuccess(event) {
    this.logger.debug(
      `Port selection completed in ${event.durationMs.toFixed(2)}ms (selected: v${event.selectedVersion}${event.adapterName ? ` for ${event.adapterName}` : ""})`
    );
    this.metrics.recordPortSelection(event.selectedVersion);
  }
  /**
   * Handle failed port selection.
   *
   * Logs error and records failure metrics.
   */
  handleFailure(event) {
    this.logger.error("No compatible port found", {
      foundryVersion: event.foundryVersion,
      availableVersions: event.availableVersions,
      adapterName: event.adapterName
    });
    this.metrics.recordPortSelectionFailure(event.foundryVersion);
  }
};
__name(_PortSelectionObserver, "PortSelectionObserver");
let PortSelectionObserver = _PortSelectionObserver;
const _DIPortSelectionObserver = class _DIPortSelectionObserver extends PortSelectionObserver {
  constructor(logger, metrics, eventEmitter) {
    super(logger, metrics, eventEmitter);
  }
};
__name(_DIPortSelectionObserver, "DIPortSelectionObserver");
_DIPortSelectionObserver.dependencies = [
  loggerToken,
  metricsRecorderToken,
  portSelectionEventEmitterToken
];
let DIPortSelectionObserver = _DIPortSelectionObserver;
function registerObservability(container) {
  const emitterResult = container.registerClass(
    portSelectionEventEmitterToken,
    DIPortSelectionEventEmitter,
    ServiceLifecycle.TRANSIENT
  );
  if (isErr(emitterResult)) {
    return err(`Failed to register PortSelectionEventEmitter: ${emitterResult.error.message}`);
  }
  const registryResult = container.registerClass(
    observabilityRegistryToken,
    DIObservabilityRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(registryResult)) {
    return err(`Failed to register ObservabilityRegistry: ${registryResult.error.message}`);
  }
  const observabilityResult = container.registerClass(
    portSelectionObservabilityToken,
    DIPortSelectionObservability,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(observabilityResult)) {
    return err(
      `Failed to register PortSelectionObservability: ${observabilityResult.error.message}`
    );
  }
  const performanceTrackerResult = container.registerClass(
    portSelectionPerformanceTrackerToken,
    DIPortSelectionPerformanceTracker,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(performanceTrackerResult)) {
    return err(
      `Failed to register PortSelectionPerformanceTracker: ${performanceTrackerResult.error.message}`
    );
  }
  const observerResult = container.registerClass(
    portSelectionObserverToken,
    DIPortSelectionObserver,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(observerResult)) {
    return err(`Failed to register PortSelectionObserver: ${observerResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerObservability, "registerObservability");
const foundryGamePortRegistryToken = createInjectionToken("FoundryGamePortRegistry");
const foundryHooksPortRegistryToken = createInjectionToken(
  "FoundryHooksPortRegistry"
);
const foundryDocumentPortRegistryToken = createInjectionToken(
  "FoundryDocumentPortRegistry"
);
const foundryUIPortRegistryToken = createInjectionToken("FoundryUIPortRegistry");
const foundrySettingsPortRegistryToken = createInjectionToken(
  "FoundrySettingsPortRegistry"
);
const foundryI18nPortRegistryToken = createInjectionToken("FoundryI18nPortRegistry");
const foundryVersionDetectorToken = createInjectionToken("FoundryVersionDetector");
const _PortResolutionStrategy = class _PortResolutionStrategy {
  constructor(container) {
    this.container = container;
  }
  /**
   * Resolves a port from the DI container using the provided injection token.
   *
   * @template T - The port type
   * @param token - The injection token for the port
   * @returns Result with resolved port or FoundryError
   *
   * @example
   * ```typescript
   * const strategy = new PortResolutionStrategy(container);
   * const portResult = strategy.resolve(foundryV13GamePortToken);
   * if (portResult.ok) {
   *   const port = portResult.value;
   * }
   * ```
   */
  resolve(token) {
    try {
      const resolveResult = this.container.resolveWithError(token);
      if (!resolveResult.ok) {
        return err(
          createFoundryError(
            "PORT_RESOLUTION_FAILED",
            `Failed to resolve port from container`,
            { token: String(token) },
            resolveResult.error
          )
        );
      }
      return ok(castResolvedService(resolveResult.value));
    } catch (error) {
      return err(
        createFoundryError(
          "PORT_RESOLUTION_FAILED",
          `Failed to resolve port from container`,
          { token: String(token) },
          error instanceof Error ? error : new Error(String(error))
        )
      );
    }
  }
};
__name(_PortResolutionStrategy, "PortResolutionStrategy");
let PortResolutionStrategy = _PortResolutionStrategy;
const _PortSelector = class _PortSelector {
  constructor(versionDetector, eventEmitter, observability, performanceTracker, observer, container) {
    this.versionDetector = versionDetector;
    this.eventEmitter = eventEmitter;
    this.observability = observability;
    this.performanceTracker = performanceTracker;
    this.observer = observer;
    this.observability.registerWithObservabilityRegistry(this);
    this.observability.setupObservability(this, this.observer);
    this.resolutionStrategy = new PortResolutionStrategy(container);
  }
  /**
   * Subscribe to port selection events.
   *
   * Allows observers to be notified of port selection success/failure for
   * logging, metrics, and other observability concerns.
   *
   * @param callback - Function to call when port selection events occur
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const selector = new PortSelector();
   * const unsubscribe = selector.onEvent((event) => {
   *   if (event.type === 'success') {
   *     console.log(`Port v${event.selectedVersion} selected`);
   *   }
   * });
   * ```
   */
  onEvent(callback) {
    return this.eventEmitter.subscribe(callback);
  }
  /**
   * Selects and resolves the appropriate port from injection tokens.
   *
   * CRITICAL: Works with token map to avoid eager instantiation.
   * Only the selected token is resolved from the DI container, preventing crashes from
   * incompatible constructors accessing unavailable APIs.
   *
   * @template T - The port type
   * @param tokens - Map of version numbers to injection tokens
   * @param foundryVersion - Optional version override (uses getFoundryVersion() if not provided)
   * @param adapterName - Optional adapter name for observability
   * @returns Result with resolved port or error
   *
   * @example
   * ```typescript
   * const tokens = new Map([
   *   [13, foundryV13GamePortToken],
   *   [14, foundryV14GamePortToken]
   * ]);
   * const selector = new PortSelector(eventEmitter, observability, container);
   * const result = selector.selectPortFromTokens(tokens);
   * // On Foundry v13: resolves only v13 port from container (v14 token never resolved)
   * // On Foundry v14: resolves v14 port from container
   * ```
   */
  selectPortFromTokens(tokens, foundryVersion, adapterName) {
    this.performanceTracker.startTracking();
    let version;
    if (foundryVersion !== void 0) {
      version = foundryVersion;
    } else {
      const versionResult = this.versionDetector.getVersion();
      if (!versionResult.ok) {
        this.performanceTracker.endTracking();
        this.observer.handleEvent({
          type: "failure",
          foundryVersion: 0,
          // Unknown version
          availableVersions: Array.from(tokens.keys()).sort((a, b) => a - b).join(", "),
          ...adapterName !== void 0 ? { adapterName } : {},
          error: createFoundryError(
            "PORT_SELECTION_FAILED",
            "Could not determine Foundry version",
            void 0,
            versionResult.error
          )
        });
        return err(
          createFoundryError(
            "PORT_SELECTION_FAILED",
            "Could not determine Foundry version",
            void 0,
            versionResult.error
          )
        );
      }
      version = versionResult.value;
    }
    let selectedToken;
    let selectedVersion = APP_DEFAULTS.NO_VERSION_SELECTED;
    for (const [portVersion, token] of tokens.entries()) {
      if (portVersion > version) {
        continue;
      }
      if (portVersion > selectedVersion) {
        selectedVersion = portVersion;
        selectedToken = token;
      }
    }
    if (selectedToken === void 0) {
      const availableVersions = Array.from(tokens.keys()).sort((a, b) => a - b).join(", ");
      const error = createFoundryError(
        "PORT_SELECTION_FAILED",
        `No compatible port found for Foundry version ${version}`,
        { version, availableVersions: availableVersions || "none" }
      );
      this.performanceTracker.endTracking();
      this.observer.handleEvent({
        type: "failure",
        foundryVersion: version,
        availableVersions,
        ...adapterName !== void 0 ? { adapterName } : {},
        error
      });
      return err(error);
    }
    const portResult = this.resolutionStrategy.resolve(selectedToken);
    if (!portResult.ok) {
      this.performanceTracker.endTracking();
      this.observer.handleEvent({
        type: "failure",
        foundryVersion: version,
        availableVersions: Array.from(tokens.keys()).sort((a, b) => a - b).join(", "),
        ...adapterName !== void 0 ? { adapterName } : {},
        error: portResult.error
      });
      return err(portResult.error);
    }
    const durationMs = this.performanceTracker.endTracking();
    this.observer.handleEvent({
      type: "success",
      selectedVersion,
      foundryVersion: version,
      ...adapterName !== void 0 ? { adapterName } : {},
      durationMs
    });
    return ok(portResult.value);
  }
};
__name(_PortSelector, "PortSelector");
let PortSelector = _PortSelector;
const _DIPortSelector = class _DIPortSelector extends PortSelector {
  constructor(versionDetector, eventEmitter, observability, performanceTracker, observer, container) {
    super(versionDetector, eventEmitter, observability, performanceTracker, observer, container);
  }
};
__name(_DIPortSelector, "DIPortSelector");
_DIPortSelector.dependencies = [
  foundryVersionDetectorToken,
  portSelectionEventEmitterToken,
  portSelectionObservabilityToken,
  portSelectionPerformanceTrackerToken,
  portSelectionObserverToken,
  serviceContainerToken
];
let DIPortSelector = _DIPortSelector;
let cachedVersion = null;
function detectFoundryVersion() {
  if (typeof game === "undefined") {
    return err("Foundry game object is not available or version cannot be determined");
  }
  const versionString = game.version;
  if (!versionString) {
    return err("Foundry version is not available on the game object");
  }
  const versionStr = versionString.match(/^(\d+)/)?.[1];
  if (!versionStr) {
    return err(`Could not parse Foundry version from: ${versionString}`);
  }
  return ok(Number.parseInt(versionStr, 10));
}
__name(detectFoundryVersion, "detectFoundryVersion");
function getFoundryVersionResult() {
  if (cachedVersion === null) {
    cachedVersion = detectFoundryVersion();
  }
  return cachedVersion;
}
__name(getFoundryVersionResult, "getFoundryVersionResult");
function resetVersionCache() {
  cachedVersion = null;
}
__name(resetVersionCache, "resetVersionCache");
function tryGetFoundryVersion() {
  const result = getFoundryVersionResult();
  return result.ok ? result.value : void 0;
}
__name(tryGetFoundryVersion, "tryGetFoundryVersion");
const _FoundryVersionDetector = class _FoundryVersionDetector {
  /**
   * Gets the major version number of the currently running Foundry VTT instance.
   *
   * @returns Result with major version number (e.g., 13 for "13.348") or FoundryError
   *
   * @example
   * ```typescript
   * const detector = new FoundryVersionDetector();
   * const versionResult = detector.getVersion();
   * if (versionResult.ok) {
   *   console.log(`Foundry version: ${versionResult.value}`);
   * }
   * ```
   */
  getVersion() {
    const versionResult = getFoundryVersionResult();
    if (!versionResult.ok) {
      return err(
        createFoundryError(
          "VERSION_DETECTION_FAILED",
          "Could not determine Foundry version",
          void 0,
          versionResult.error
        )
      );
    }
    return ok(versionResult.value);
  }
};
__name(_FoundryVersionDetector, "FoundryVersionDetector");
let FoundryVersionDetector = _FoundryVersionDetector;
const _DIFoundryVersionDetector = class _DIFoundryVersionDetector extends FoundryVersionDetector {
  constructor() {
    super();
  }
};
__name(_DIFoundryVersionDetector, "DIFoundryVersionDetector");
_DIFoundryVersionDetector.dependencies = [];
let DIFoundryVersionDetector = _DIFoundryVersionDetector;
const _PortRegistry = class _PortRegistry {
  constructor() {
    this.tokens = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a port injection token for a specific Foundry version.
   * @param version - The Foundry version this port supports
   * @param token - Injection token for resolving the port from the DI container
   * @returns Result indicating success or duplicate registration error
   */
  register(version, token) {
    if (this.tokens.has(version)) {
      return err(
        createFoundryError(
          "PORT_REGISTRY_ERROR",
          `Port for version ${version} already registered`,
          { version }
        )
      );
    }
    this.tokens.set(version, token);
    return ok(void 0);
  }
  /**
   * Gets all registered port versions.
   * @returns Array of registered version numbers, sorted ascending
   */
  getAvailableVersions() {
    return Array.from(this.tokens.keys()).sort((a, b) => a - b);
  }
  /**
   * Gets the token map without resolving ports.
   * Use with PortSelector.selectPortFromTokens() for safe lazy instantiation via DI.
   *
   * @returns Map of version numbers to injection tokens (NOT instances)
   *
   * @example
   * ```typescript
   * const registry = new PortRegistry<FoundryGame>();
   * registry.register(13, foundryV13GamePortToken);
   * registry.register(14, foundryGamePortV14Token);
   *
   * const tokens = registry.getTokens();
   * const selector = new PortSelector(container);
   * const result = selector.selectPortFromTokens(tokens);
   * // Only compatible port is resolved from container
   * ```
   */
  getTokens() {
    return new Map(this.tokens);
  }
  /**
   * Checks if a port is registered for a specific version.
   * @param version - The version to check
   * @returns True if a port is registered for this version
   */
  hasVersion(version) {
    return this.tokens.has(version);
  }
  /**
   * Gets the highest registered port version.
   * @returns The highest version number or undefined if no ports are registered
   */
  getHighestVersion() {
    const versions = this.getAvailableVersions();
    return versions.at(-1);
  }
};
__name(_PortRegistry, "PortRegistry");
let PortRegistry = _PortRegistry;
function isStringValue(value2, expectedType) {
  return expectedType === "string" && typeof value2 === "string";
}
__name(isStringValue, "isStringValue");
const JournalEntrySchema = /* @__PURE__ */ object({
  id: /* @__PURE__ */ string(),
  name: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
  flags: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown())),
  getFlag: /* @__PURE__ */ optional(
    /* @__PURE__ */ custom((val) => typeof val === "function")
  ),
  setFlag: /* @__PURE__ */ optional(
    /* @__PURE__ */ custom(
      (val) => typeof val === "function"
    )
  )
});
function validateJournalEntries(entries2) {
  const result = /* @__PURE__ */ safeParse(/* @__PURE__ */ array(JournalEntrySchema), entries2);
  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Journal entry validation failed",
        void 0,
        result.issues
      )
    );
  }
  return ok(result.output);
}
__name(validateJournalEntries, "validateJournalEntries");
function validateSettingValue(key, value2, expectedType, choices) {
  if (expectedType === "string" && typeof value2 !== "string") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected string, got ${typeof value2}`,
        { key, value: value2, expectedType }
      )
    );
  }
  if (expectedType === "number" && typeof value2 !== "number") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected number, got ${typeof value2}`,
        { key, value: value2, expectedType }
      )
    );
  }
  if (expectedType === "boolean" && typeof value2 !== "boolean") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected boolean, got ${typeof value2}`,
        { key, value: value2, expectedType }
      )
    );
  }
  if (choices && isStringValue(value2, expectedType)) {
    if (!choices.includes(value2)) {
      return err(
        createFoundryError(
          "VALIDATION_FAILED",
          `Setting ${key}: Invalid value "${value2}". Allowed: ${choices.join(", ")}`,
          { key, value: value2, choices }
        )
      );
    }
  }
  return ok(value2);
}
__name(validateSettingValue, "validateSettingValue");
const SettingConfigSchema = /* @__PURE__ */ object({
  name: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
  hint: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
  scope: /* @__PURE__ */ optional(/* @__PURE__ */ picklist(["world", "client", "user"])),
  config: /* @__PURE__ */ optional(/* @__PURE__ */ boolean()),
  type: /* @__PURE__ */ optional(/* @__PURE__ */ any()),
  // typeof String, Number, Boolean - cannot validate constructors
  default: /* @__PURE__ */ optional(/* @__PURE__ */ any()),
  // Default value depends on type
  choices: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ string())),
  // Record keys must be string in TS
  onChange: /* @__PURE__ */ optional(/* @__PURE__ */ custom((val) => typeof val === "function"))
});
function validateSettingConfig(namespace, key, config2) {
  if (!namespace || typeof namespace !== "string") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Invalid setting namespace: must be non-empty string",
        { namespace, key }
      )
    );
  }
  if (!key || typeof key !== "string") {
    return err(
      createFoundryError("VALIDATION_FAILED", "Invalid setting key: must be non-empty string", {
        namespace,
        key
      })
    );
  }
  if (!config2 || typeof config2 !== "object") {
    return err(
      createFoundryError("VALIDATION_FAILED", "Invalid setting config: must be object", {
        namespace,
        key
      })
    );
  }
  const result = /* @__PURE__ */ safeParse(SettingConfigSchema, config2);
  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting config validation failed for ${namespace}.${key}: ${result.issues.map((i) => i.message).join(", ")}`,
        { namespace, key, config: config2, issues: result.issues }
      )
    );
  }
  return ok(result.output);
}
__name(validateSettingConfig, "validateSettingConfig");
function sanitizeId(id) {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}
__name(sanitizeId, "sanitizeId");
function sanitizeHtml$1(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
__name(sanitizeHtml$1, "sanitizeHtml$1");
const FoundryApplicationSchema = /* @__PURE__ */ object({
  // Application should have a string ID
  id: /* @__PURE__ */ string(),
  // Application should have object property (typed as record instead of any)
  object: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown())),
  // Application should have options property
  options: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown()))
});
function validateHookApp(app) {
  if (app === null || app === void 0) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Hook app parameter is null or undefined",
        void 0,
        void 0
      )
    );
  }
  const result = /* @__PURE__ */ safeParse(FoundryApplicationSchema, app);
  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Hook app parameter validation failed",
        void 0,
        result.issues
      )
    );
  }
  return ok(result.output);
}
__name(validateHookApp, "validateHookApp");
function validateJournalId(id) {
  if (id.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "ID cannot be empty"));
  }
  if (id.length > VALIDATION_CONSTRAINTS.MAX_ID_LENGTH) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `ID too long (max ${VALIDATION_CONSTRAINTS.MAX_ID_LENGTH} characters)`
      )
    );
  }
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "ID contains invalid characters (allowed: a-z, A-Z, 0-9, -, _)",
        { id }
      )
    );
  }
  return ok(id);
}
__name(validateJournalId, "validateJournalId");
function validateJournalName(name) {
  if (typeof name !== "string" || name.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "Name cannot be empty"));
  }
  if (name.length > 255) {
    return err(createFoundryError("VALIDATION_FAILED", "Name too long (max 255 characters)"));
  }
  return ok(name);
}
__name(validateJournalName, "validateJournalName");
function validateFlagKey(key) {
  if (typeof key !== "string" || key.length === 0 || key.length > VALIDATION_CONSTRAINTS.MAX_FLAG_KEY_LENGTH) {
    return err(createFoundryError("VALIDATION_FAILED", "Invalid flag key length"));
  }
  if (!/^[a-zA-Z0-9_]+$/.test(key)) {
    return err(createFoundryError("VALIDATION_FAILED", "Invalid flag key format"));
  }
  return ok(key);
}
__name(validateFlagKey, "validateFlagKey");
const _FoundryV13GamePort = class _FoundryV13GamePort {
  constructor() {
    __privateAdd(this, _disposed);
    __privateSet(this, _disposed, false);
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
    this.cacheTtlMs = APP_DEFAULTS.CACHE_TTL_MS;
  }
  getJournalEntries() {
    if (__privateGet(this, _disposed)) {
      return err(createFoundryError("DISPOSED", "Cannot get journal entries on disposed port"));
    }
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }
    const now = Date.now();
    const cacheAge = now - this.lastCheckTimestamp;
    if (this.cachedEntries !== null && cacheAge < this.cacheTtlMs) {
      return { ok: true, value: this.cachedEntries };
    }
    const entries2 = tryCatch(
      () => Array.from(game.journal.contents),
      (error) => createFoundryError("OPERATION_FAILED", "Failed to access journal entries", void 0, error)
    );
    if (!entries2.ok) {
      return entries2;
    }
    const validationResult = validateJournalEntries(entries2.value);
    if (!validationResult.ok) {
      return validationResult;
    }
    this.cachedEntries = entries2.value;
    this.lastCheckTimestamp = now;
    return { ok: true, value: this.cachedEntries };
  }
  /**
   * Invalidates the journal entries cache.
   * Forces the next getJournalEntries() call to fetch and validate fresh data.
   */
  invalidateCache() {
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
  }
  getJournalEntryById(id) {
    if (__privateGet(this, _disposed)) {
      return err(createFoundryError("DISPOSED", "Cannot get journal entry on disposed port"));
    }
    const validationResult = validateJournalId(id);
    if (!validationResult.ok) {
      return validationResult;
    }
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }
    return tryCatch(
      () => {
        const entry = game.journal.get(validationResult.value);
        return entry ?? null;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to get journal entry by ID ${validationResult.value}`,
        { id: validationResult.value },
        error
      )
    );
  }
  dispose() {
    if (__privateGet(this, _disposed)) return;
    __privateSet(this, _disposed, true);
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
  }
};
_disposed = new WeakMap();
__name(_FoundryV13GamePort, "FoundryV13GamePort");
let FoundryV13GamePort = _FoundryV13GamePort;
const _FoundryV13HooksPort = class _FoundryV13HooksPort {
  constructor() {
    __privateAdd(this, _disposed2, false);
  }
  on(hookName, callback) {
    if (__privateGet(this, _disposed2)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot register hook on disposed port", {
          hookName
        })
      };
    }
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        const hookId = Hooks.on(hookName, callback);
        return hookId;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to register hook ${hookName}`,
        { hookName },
        error
      )
    );
  }
  once(hookName, callback) {
    if (__privateGet(this, _disposed2)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot register one-time hook on disposed port", {
          hookName
        })
      };
    }
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        const hookId = Hooks.once(hookName, callback);
        return hookId;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to register one-time hook ${hookName}`,
        { hookName },
        error
      )
    );
  }
  off(hookName, callbackOrId) {
    if (__privateGet(this, _disposed2)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot unregister hook on disposed port", {
          hookName
        })
      };
    }
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        Hooks.off(hookName, callbackOrId);
        return void 0;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to unregister hook ${hookName}`,
        { hookName },
        error
      )
    );
  }
  dispose() {
    if (__privateGet(this, _disposed2)) return;
    __privateSet(this, _disposed2, true);
  }
};
_disposed2 = new WeakMap();
__name(_FoundryV13HooksPort, "FoundryV13HooksPort");
let FoundryV13HooksPort = _FoundryV13HooksPort;
const _FoundryV13DocumentPort = class _FoundryV13DocumentPort {
  constructor() {
    __privateAdd(this, _disposed3, false);
  }
  async create(documentClass, data) {
    if (__privateGet(this, _disposed3)) {
      return err(createFoundryError("DISPOSED", "Cannot create document on disposed port"));
    }
    return fromPromise(
      documentClass.create(data),
      (error) => createFoundryError("OPERATION_FAILED", "Failed to create document", { data }, error)
    );
  }
  async update(document2, changes) {
    if (__privateGet(this, _disposed3)) {
      return err(createFoundryError("DISPOSED", "Cannot update document on disposed port"));
    }
    return fromPromise(
      document2.update(changes),
      (error) => createFoundryError("OPERATION_FAILED", "Failed to update document", { changes }, error)
    );
  }
  async delete(document2) {
    if (__privateGet(this, _disposed3)) {
      return err(createFoundryError("DISPOSED", "Cannot delete document on disposed port"));
    }
    return fromPromise(
      document2.delete().then(() => void 0),
      (error) => createFoundryError("OPERATION_FAILED", "Failed to delete document", void 0, error)
    );
  }
  getFlag(document2, scope, key, schema) {
    if (__privateGet(this, _disposed3)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot get flag on disposed port", { scope, key })
      };
    }
    return tryCatch(
      () => {
        if (!document2?.getFlag) {
          throw new Error("Document does not have getFlag method");
        }
        const rawValue = document2.getFlag(scope, key);
        if (rawValue === null || rawValue === void 0) {
          return null;
        }
        const parseResult = /* @__PURE__ */ safeParse(schema, rawValue);
        if (!parseResult.success) {
          const error = createFoundryError(
            "VALIDATION_FAILED",
            `Flag ${scope}.${key} failed validation: ${parseResult.issues.map((i) => i.message).join(", ")}`,
            { scope, key, rawValue, issues: parseResult.issues }
          );
          throw error;
        }
        return parseResult.output;
      },
      (error) => {
        if (error && typeof error === "object" && "code" in error && "message" in error) {
          return castFoundryError(error);
        }
        return createFoundryError(
          "OPERATION_FAILED",
          `Failed to get flag ${scope}.${key}`,
          { scope, key },
          error
        );
      }
    );
  }
  async setFlag(document2, scope, key, value2) {
    if (__privateGet(this, _disposed3)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot set flag on disposed port", { scope, key })
      };
    }
    return fromPromise(
      (async () => {
        if (!document2?.setFlag) {
          throw new Error("Document does not have setFlag method");
        }
        await document2.setFlag(scope, key, value2);
      })(),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to set flag ${scope}.${key}`,
        { scope, key, value: value2 },
        error
      )
    );
  }
  async unsetFlag(document2, scope, key) {
    if (__privateGet(this, _disposed3)) {
      return err(
        createFoundryError("DISPOSED", "Cannot unset flag on disposed port", { scope, key })
      );
    }
    return fromPromise(
      (async () => {
        if (document2.unsetFlag) {
          await document2.unsetFlag(scope, key);
        } else {
          const docWithUpdateResult = castFoundryDocumentWithUpdate(document2);
          if (!docWithUpdateResult.ok) {
            throw new Error(
              `Document does not support unsetFlag or update: ${docWithUpdateResult.error.message}`
            );
          }
          await docWithUpdateResult.value.update({
            [`flags.${scope}.-=${key}`]: null
          });
        }
      })(),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to unset flag ${scope}.${key}`,
        { scope, key },
        error
      )
    );
  }
  dispose() {
    if (__privateGet(this, _disposed3)) return;
    __privateSet(this, _disposed3, true);
  }
};
_disposed3 = new WeakMap();
__name(_FoundryV13DocumentPort, "FoundryV13DocumentPort");
let FoundryV13DocumentPort = _FoundryV13DocumentPort;
function isFoundryUISidebar(sidebar) {
  return typeof sidebar === "object" && sidebar !== null;
}
__name(isFoundryUISidebar, "isFoundryUISidebar");
const _FoundryV13UIPort = class _FoundryV13UIPort {
  constructor() {
    __privateAdd(this, _disposed4, false);
  }
  removeJournalElement(journalId, journalName, html) {
    if (__privateGet(this, _disposed4)) {
      return err(createFoundryError("DISPOSED", "Cannot remove journal element on disposed port"));
    }
    const safeId = sanitizeId(journalId);
    const element = html.querySelector(
      `li.directory-item[data-document-id="${safeId}"], li.directory-item[data-entry-id="${safeId}"]`
    );
    if (!element) {
      return err(
        createFoundryError(
          "NOT_FOUND",
          `Could not find element for journal entry: ${journalName}`,
          { journalName, journalId: safeId }
        )
      );
    }
    try {
      element.remove();
      return ok(void 0);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to remove element from DOM",
          { journalName, journalId: safeId },
          error
        )
      );
    }
  }
  findElement(container, selector) {
    if (__privateGet(this, _disposed4)) {
      return err(createFoundryError("DISPOSED", "Cannot find element on disposed port"));
    }
    const element = container.querySelector(selector);
    return ok(element);
  }
  notify(message2, type, options) {
    if (__privateGet(this, _disposed4)) {
      return err(createFoundryError("DISPOSED", "Cannot show notification on disposed port"));
    }
    if (typeof ui === "undefined" || !ui?.notifications) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry UI notifications not available"));
    }
    try {
      switch (type) {
        case "info":
          ui.notifications.info(message2, options);
          break;
        case "warning":
          ui.notifications.warn(message2, options);
          break;
        case "error":
          ui.notifications.error(message2, options);
          break;
      }
      return ok(void 0);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to show notification",
          { message: message2, type },
          error
        )
      );
    }
  }
  rerenderJournalDirectory() {
    if (__privateGet(this, _disposed4)) {
      return err(
        createFoundryError("DISPOSED", "Cannot rerender journal directory on disposed port")
      );
    }
    try {
      const journalElement = document.querySelector("#journal");
      if (!journalElement) {
        return ok(false);
      }
      if (typeof ui === "undefined" || !ui?.sidebar) {
        return err(createFoundryError("API_NOT_AVAILABLE", "Foundry UI sidebar not available"));
      }
      if (!isFoundryUISidebar(ui.sidebar)) {
        return err(
          createFoundryError("API_NOT_AVAILABLE", "Foundry UI sidebar has unexpected structure")
        );
      }
      const sidebar = ui.sidebar;
      const journalApp = sidebar.tabs?.journal;
      let rendered = false;
      if (journalApp && typeof journalApp.render === "function") {
        journalApp.render(false);
        rendered = true;
      }
      if (typeof game !== "undefined" && game.journal?.directory?.render) {
        game.journal.directory.render();
        rendered = true;
      }
      return ok(rendered);
    } catch (error) {
      return err(
        createFoundryError("OPERATION_FAILED", "Failed to re-render journal directory", {}, error)
      );
    }
  }
  dispose() {
    if (__privateGet(this, _disposed4)) return;
    __privateSet(this, _disposed4, true);
  }
};
_disposed4 = new WeakMap();
__name(_FoundryV13UIPort, "FoundryV13UIPort");
let FoundryV13UIPort = _FoundryV13UIPort;
const _FoundryV13SettingsPort = class _FoundryV13SettingsPort {
  constructor() {
    __privateAdd(this, _disposed5, false);
  }
  register(namespace, key, config2) {
    if (__privateGet(this, _disposed5)) {
      return err(
        createFoundryError("DISPOSED", "Cannot register setting on disposed port", {
          namespace,
          key
        })
      );
    }
    const configValidation = validateSettingConfig(namespace, key, config2);
    if (!configValidation.ok) {
      return err(configValidation.error);
    }
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    const settingsResult = castFoundrySettingsApi(game.settings);
    if (!settingsResult.ok) {
      return settingsResult;
    }
    const settings = settingsResult.value;
    return tryCatch(
      () => {
        settings.register(namespace, key, config2);
        return void 0;
      },
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to register setting ${namespace}.${key}`,
        { namespace, key },
        error
      )
    );
  }
  get(namespace, key, schema) {
    if (__privateGet(this, _disposed5)) {
      return err(
        createFoundryError("DISPOSED", "Cannot get setting on disposed port", { namespace, key })
      );
    }
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    const settingsResult = castFoundrySettingsApi(game.settings);
    if (!settingsResult.ok) {
      return settingsResult;
    }
    const settings = settingsResult.value;
    return tryCatch(
      () => {
        const rawValue = settings.get(namespace, key);
        const parseResult = /* @__PURE__ */ safeParse(schema, rawValue);
        if (!parseResult.success) {
          const error = createFoundryError(
            "VALIDATION_FAILED",
            `Setting ${namespace}.${key} failed validation: ${parseResult.issues.map((i) => i.message).join(", ")}`,
            { namespace, key, rawValue, issues: parseResult.issues }
          );
          throw error;
        }
        return parseResult.output;
      },
      (error) => {
        if (error && typeof error === "object" && "code" in error && "message" in error) {
          return castFoundryError(error);
        }
        return createFoundryError(
          "OPERATION_FAILED",
          `Failed to get setting ${namespace}.${key}`,
          { namespace, key },
          error
        );
      }
    );
  }
  async set(namespace, key, value2) {
    if (__privateGet(this, _disposed5)) {
      return err(
        createFoundryError("DISPOSED", "Cannot set setting on disposed port", { namespace, key })
      );
    }
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }
    const settingsResult = castFoundrySettingsApi(game.settings);
    if (!settingsResult.ok) {
      return Promise.resolve(settingsResult);
    }
    const settings = settingsResult.value;
    return fromPromise(
      settings.set(namespace, key, value2).then(() => void 0),
      (error) => createFoundryError(
        "OPERATION_FAILED",
        `Failed to set setting ${namespace}.${key}`,
        { namespace, key, value: value2 },
        error
      )
    );
  }
  dispose() {
    if (__privateGet(this, _disposed5)) return;
    __privateSet(this, _disposed5, true);
  }
};
_disposed5 = new WeakMap();
__name(_FoundryV13SettingsPort, "FoundryV13SettingsPort");
let FoundryV13SettingsPort = _FoundryV13SettingsPort;
const _FoundryV13I18nPort = class _FoundryV13I18nPort {
  constructor() {
    __privateAdd(this, _disposed6, false);
  }
  /**
   * Localizes a translation key using Foundry's i18n system.
   *
   * @param key - Translation key
   * @returns Result with translated string (returns key itself if not found)
   */
  localize(key) {
    if (__privateGet(this, _disposed6)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot localize on disposed port", { key })
      };
    }
    try {
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(key);
      }
      const translated = game.i18n.localize(key);
      return ok(translated);
    } catch {
      return ok(key);
    }
  }
  /**
   * Formats a translation key with placeholder values.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @returns Result with formatted string
   */
  format(key, data) {
    if (__privateGet(this, _disposed6)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot format translation on disposed port", {
          key
        })
      };
    }
    try {
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(key);
      }
      const stringData = {};
      for (const [k, v] of Object.entries(data)) {
        stringData[k] = String(v);
      }
      const formatted = game.i18n.format(key, stringData);
      return ok(formatted);
    } catch {
      return ok(key);
    }
  }
  /**
   * Checks if a translation key exists.
   *
   * @param key - Translation key to check
   * @returns Result with boolean indicating existence
   */
  has(key) {
    if (__privateGet(this, _disposed6)) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot check translation key on disposed port", {
          key
        })
      };
    }
    try {
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(false);
      }
      const exists = game.i18n.has(key);
      return ok(exists);
    } catch {
      return ok(false);
    }
  }
  dispose() {
    if (__privateGet(this, _disposed6)) return;
    __privateSet(this, _disposed6, true);
  }
};
_disposed6 = new WeakMap();
__name(_FoundryV13I18nPort, "FoundryV13I18nPort");
_FoundryV13I18nPort.dependencies = [];
let FoundryV13I18nPort = _FoundryV13I18nPort;
const _FoundryV13ModulePort = class _FoundryV13ModulePort {
  setModuleReady(moduleId) {
    if (typeof game === "undefined" || !game?.modules) {
      return false;
    }
    const mod = game.modules.get(moduleId);
    if (!mod) {
      return false;
    }
    mod.ready = true;
    return true;
  }
};
__name(_FoundryV13ModulePort, "FoundryV13ModulePort");
let FoundryV13ModulePort = _FoundryV13ModulePort;
function createFoundryV13ModulePort() {
  return new FoundryV13ModulePort();
}
__name(createFoundryV13ModulePort, "createFoundryV13ModulePort");
const foundryV13GamePortToken = createInjectionToken("FoundryV13GamePort");
const foundryV13HooksPortToken = createInjectionToken("FoundryV13HooksPort");
const foundryV13DocumentPortToken = createInjectionToken("FoundryV13DocumentPort");
const foundryV13UIPortToken = createInjectionToken("FoundryV13UIPort");
const foundryV13SettingsPortToken = createInjectionToken("FoundryV13SettingsPort");
const foundryV13I18nPortToken = createInjectionToken("FoundryV13I18nPort");
const foundryV13ModulePortToken = createInjectionToken("FoundryV13ModulePort");
function registerPortToRegistry(registry, version, token, portName, errors) {
  const result = registry.register(version, token);
  if (isErr(result)) {
    errors.push(`${portName} v${version}: ${result.error}`);
  }
}
__name(registerPortToRegistry, "registerPortToRegistry");
function registerV13Ports(registries, container) {
  const portRegistrationErrors = [];
  container.registerClass(foundryV13GamePortToken, FoundryV13GamePort, ServiceLifecycle.SINGLETON);
  container.registerClass(
    foundryV13HooksPortToken,
    FoundryV13HooksPort,
    ServiceLifecycle.SINGLETON
  );
  container.registerClass(
    foundryV13DocumentPortToken,
    FoundryV13DocumentPort,
    ServiceLifecycle.SINGLETON
  );
  container.registerClass(foundryV13UIPortToken, FoundryV13UIPort, ServiceLifecycle.SINGLETON);
  container.registerClass(
    foundryV13SettingsPortToken,
    FoundryV13SettingsPort,
    ServiceLifecycle.SINGLETON
  );
  container.registerClass(foundryV13I18nPortToken, FoundryV13I18nPort, ServiceLifecycle.SINGLETON);
  container.registerValue(foundryV13ModulePortToken, createFoundryV13ModulePort());
  registerPortToRegistry(
    registries.gamePortRegistry,
    13,
    foundryV13GamePortToken,
    "FoundryGame",
    portRegistrationErrors
  );
  registerPortToRegistry(
    registries.hooksPortRegistry,
    13,
    foundryV13HooksPortToken,
    "FoundryHooks",
    portRegistrationErrors
  );
  registerPortToRegistry(
    registries.documentPortRegistry,
    13,
    foundryV13DocumentPortToken,
    "FoundryDocument",
    portRegistrationErrors
  );
  registerPortToRegistry(
    registries.uiPortRegistry,
    13,
    foundryV13UIPortToken,
    "FoundryUI",
    portRegistrationErrors
  );
  registerPortToRegistry(
    registries.settingsPortRegistry,
    13,
    foundryV13SettingsPortToken,
    "FoundrySettings",
    portRegistrationErrors
  );
  registerPortToRegistry(
    registries.i18nPortRegistry,
    13,
    foundryV13I18nPortToken,
    "FoundryI18n",
    portRegistrationErrors
  );
  registerPortToRegistry(
    registries.modulePortRegistry,
    13,
    foundryV13ModulePortToken,
    "FoundryModule",
    portRegistrationErrors
  );
  if (portRegistrationErrors.length > 0) {
    return err(`Port registration failed: ${portRegistrationErrors.join("; ")}`);
  }
  return ok(void 0);
}
__name(registerV13Ports, "registerV13Ports");
const _FoundryUIAdapter = class _FoundryUIAdapter {
  constructor(foundryUI) {
    this.foundryUI = foundryUI;
  }
  removeJournalElement(journalId, journalName, html) {
    const result = this.foundryUI.removeJournalElement(journalId, journalName, html);
    if (!result.ok) {
      return err({
        code: "DOM_MANIPULATION_FAILED",
        message: `Failed to remove journal element '${journalName}' (${journalId}): ${result.error.message}`,
        operation: "removeJournalElement",
        details: { journalId, journalName, cause: result.error }
      });
    }
    return ok(void 0);
  }
  rerenderJournalDirectory() {
    const result = this.foundryUI.rerenderJournalDirectory();
    if (!result.ok) {
      return err({
        code: "RERENDER_FAILED",
        message: `Failed to re-render journal directory: ${result.error.message}`,
        operation: "rerenderJournalDirectory",
        details: { cause: result.error }
      });
    }
    return ok(result.value);
  }
  notify(message2, type) {
    const result = this.foundryUI.notify(message2, type);
    if (!result.ok) {
      return err({
        code: result.error.code,
        message: result.error.message,
        operation: "notify",
        details: { cause: result.error }
      });
    }
    return ok(void 0);
  }
};
__name(_FoundryUIAdapter, "FoundryUIAdapter");
let FoundryUIAdapter = _FoundryUIAdapter;
const _DIFoundryUIAdapter = class _DIFoundryUIAdapter extends FoundryUIAdapter {
  constructor(foundryUI) {
    super(foundryUI);
  }
};
__name(_DIFoundryUIAdapter, "DIFoundryUIAdapter");
_DIFoundryUIAdapter.dependencies = [foundryUIToken];
let DIFoundryUIAdapter = _DIFoundryUIAdapter;
const _ValibotValidationAdapter = class _ValibotValidationAdapter {
  /**
   * Validates a log level value using Valibot schema.
   *
   * @param value - The value to validate
   * @returns Result with validated LogLevel or validation error
   */
  validateLogLevel(value2) {
    const validationResult = /* @__PURE__ */ safeParse(LOG_LEVEL_SCHEMA, value2);
    if (!validationResult.success) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Invalid log level value: ${String(value2)}. Must be one of: ${LogLevel.DEBUG}, ${LogLevel.INFO}, ${LogLevel.WARN}, ${LogLevel.ERROR}`,
        details: validationResult.issues
      });
    }
    return ok(validationResult.output);
  }
};
__name(_ValibotValidationAdapter, "ValibotValidationAdapter");
let ValibotValidationAdapter = _ValibotValidationAdapter;
const _DIValibotValidationAdapter = class _DIValibotValidationAdapter extends ValibotValidationAdapter {
  constructor() {
    super();
  }
};
__name(_DIValibotValidationAdapter, "DIValibotValidationAdapter");
_DIValibotValidationAdapter.dependencies = [];
let DIValibotValidationAdapter = _DIValibotValidationAdapter;
const _MetricsSnapshotAdapter = class _MetricsSnapshotAdapter {
  constructor(metricsCollector) {
    this.metricsCollector = metricsCollector;
  }
  getSnapshot() {
    return this.metricsCollector.getSnapshot();
  }
};
__name(_MetricsSnapshotAdapter, "MetricsSnapshotAdapter");
let MetricsSnapshotAdapter = _MetricsSnapshotAdapter;
const _DIMetricsSnapshotAdapter = class _DIMetricsSnapshotAdapter extends MetricsSnapshotAdapter {
  constructor(metricsCollector) {
    super(metricsCollector);
  }
};
__name(_DIMetricsSnapshotAdapter, "DIMetricsSnapshotAdapter");
_DIMetricsSnapshotAdapter.dependencies = [metricsCollectorToken];
let DIMetricsSnapshotAdapter = _DIMetricsSnapshotAdapter;
function createPortRegistries(container) {
  const gamePortRegistry = new PortRegistry();
  const hooksPortRegistry = new PortRegistry();
  const documentPortRegistry = new PortRegistry();
  const uiPortRegistry = new PortRegistry();
  const settingsPortRegistry = new PortRegistry();
  const i18nPortRegistry = new PortRegistry();
  const modulePortRegistry = new PortRegistry();
  const v13RegistrationResult = registerV13Ports(
    {
      gamePortRegistry,
      hooksPortRegistry,
      documentPortRegistry,
      uiPortRegistry,
      settingsPortRegistry,
      i18nPortRegistry,
      modulePortRegistry
    },
    container
  );
  if (isErr(v13RegistrationResult)) {
    return v13RegistrationResult;
  }
  return ok({
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry,
    modulePortRegistry
  });
}
__name(createPortRegistries, "createPortRegistries");
function registerPortInfrastructure(container) {
  const versionDetectorResult = container.registerClass(
    foundryVersionDetectorToken,
    DIFoundryVersionDetector,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(versionDetectorResult)) {
    return err(`Failed to register FoundryVersionDetector: ${versionDetectorResult.error.message}`);
  }
  const portSelectorResult = container.registerClass(
    portSelectorToken,
    DIPortSelector,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(portSelectorResult)) {
    return err(`Failed to register PortSelector: ${portSelectorResult.error.message}`);
  }
  const platformUIPortResult = container.registerClass(
    platformUIPortToken,
    DIFoundryUIAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(platformUIPortResult)) {
    return err(`Failed to register PlatformUIPort: ${platformUIPortResult.error.message}`);
  }
  const journalDirectoryUiAliasResult = container.registerAlias(
    platformJournalDirectoryUiPortToken,
    platformUIPortToken
  );
  if (isErr(journalDirectoryUiAliasResult)) {
    return err(
      `Failed to register PlatformJournalDirectoryUiPort alias: ${journalDirectoryUiAliasResult.error.message}`
    );
  }
  const uiNotificationAliasResult = container.registerAlias(
    platformUINotificationPortToken,
    platformUIPortToken
  );
  if (isErr(uiNotificationAliasResult)) {
    return err(
      `Failed to register UINotificationPort alias: ${uiNotificationAliasResult.error.message}`
    );
  }
  const platformValidationPortResult = container.registerClass(
    platformValidationPortToken,
    DIValibotValidationAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(platformValidationPortResult)) {
    return err(
      `Failed to register PlatformValidationPort: ${platformValidationPortResult.error.message}`
    );
  }
  const loggingPortAliasResult = container.registerAlias(platformLoggingPortToken, loggerToken);
  if (isErr(loggingPortAliasResult)) {
    return err(
      `Failed to register PlatformLoggingPort alias: ${loggingPortAliasResult.error.message}`
    );
  }
  const metricsSnapshotPortResult = container.registerClass(
    platformMetricsSnapshotPortToken,
    DIMetricsSnapshotAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(metricsSnapshotPortResult)) {
    return err(
      `Failed to register PlatformMetricsSnapshotPort: ${metricsSnapshotPortResult.error.message}`
    );
  }
  return ok(void 0);
}
__name(registerPortInfrastructure, "registerPortInfrastructure");
function registerPortRegistries(container) {
  const portsResult = createPortRegistries(container);
  if (isErr(portsResult)) return portsResult;
  const {
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry,
    modulePortRegistry
  } = portsResult.value;
  const gameRegistryResult = container.registerValue(
    foundryGamePortRegistryToken,
    gamePortRegistry
  );
  if (isErr(gameRegistryResult)) {
    return err(`Failed to register FoundryGame PortRegistry: ${gameRegistryResult.error.message}`);
  }
  const hooksRegistryResult = container.registerValue(
    foundryHooksPortRegistryToken,
    hooksPortRegistry
  );
  if (isErr(hooksRegistryResult)) {
    return err(
      `Failed to register FoundryHooks PortRegistry: ${hooksRegistryResult.error.message}`
    );
  }
  const documentRegistryResult = container.registerValue(
    foundryDocumentPortRegistryToken,
    documentPortRegistry
  );
  if (isErr(documentRegistryResult)) {
    return err(
      `Failed to register FoundryDocument PortRegistry: ${documentRegistryResult.error.message}`
    );
  }
  const uiRegistryResult = container.registerValue(foundryUIPortRegistryToken, uiPortRegistry);
  if (isErr(uiRegistryResult)) {
    return err(`Failed to register FoundryUI PortRegistry: ${uiRegistryResult.error.message}`);
  }
  const settingsRegistryResult = container.registerValue(
    foundrySettingsPortRegistryToken,
    settingsPortRegistry
  );
  if (isErr(settingsRegistryResult)) {
    return err(
      `Failed to register FoundrySettings PortRegistry: ${settingsRegistryResult.error.message}`
    );
  }
  const i18nRegistryResult = container.registerValue(
    foundryI18nPortRegistryToken,
    i18nPortRegistry
  );
  if (isErr(i18nRegistryResult)) {
    return err(`Failed to register FoundryI18n PortRegistry: ${i18nRegistryResult.error.message}`);
  }
  const moduleRegistryResult = container.registerValue(
    foundryModulePortRegistryToken,
    modulePortRegistry
  );
  if (isErr(moduleRegistryResult)) {
    return err(
      `Failed to register FoundryModule PortRegistry: ${moduleRegistryResult.error.message}`
    );
  }
  return ok(void 0);
}
__name(registerPortRegistries, "registerPortRegistries");
const _FoundryGamePort = class _FoundryGamePort extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  getJournalEntries() {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntries();
    }, "FoundryGame.getJournalEntries");
  }
  getJournalEntryById(id) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntryById(id);
    }, "FoundryGame.getJournalEntryById");
  }
  invalidateCache() {
    const portResult = this.getPort("FoundryGame");
    if (portResult.ok) {
      portResult.value.invalidateCache();
    }
  }
};
__name(_FoundryGamePort, "FoundryGamePort");
let FoundryGamePort = _FoundryGamePort;
const _DIFoundryGamePort = class _DIFoundryGamePort extends FoundryGamePort {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundryGamePort, "DIFoundryGamePort");
_DIFoundryGamePort.dependencies = [
  portSelectorToken,
  foundryGamePortRegistryToken,
  retryServiceToken
];
let DIFoundryGamePort = _DIFoundryGamePort;
const _FoundryHooksPort = class _FoundryHooksPort extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService, logger) {
    super(portSelector, portRegistry, retryService);
    this.registeredHooks = /* @__PURE__ */ new Map();
    this.callbackToIdMap = /* @__PURE__ */ new Map();
    this.idToHookNameMap = /* @__PURE__ */ new Map();
    this.logger = logger;
  }
  on(hookName, callback) {
    const result = this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.on(hookName, callback);
    }, "FoundryHooks.on");
    if (result.ok) {
      let hookMap = this.registeredHooks.get(hookName);
      if (!hookMap) {
        hookMap = /* @__PURE__ */ new Map();
        this.registeredHooks.set(hookName, hookMap);
      }
      hookMap.set(result.value, callback);
      const existing = this.callbackToIdMap.get(callback) || [];
      existing.push({ hookName, id: result.value });
      this.callbackToIdMap.set(callback, existing);
      this.idToHookNameMap.set(result.value, hookName);
    }
    return result;
  }
  once(hookName, callback) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.once(hookName, callback);
    }, "FoundryHooks.once");
  }
  off(hookName, callbackOrId) {
    const result = this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.off(hookName, callbackOrId);
    }, "FoundryHooks.off");
    if (result.ok) {
      if (typeof callbackOrId === "number") {
        const hooks = this.registeredHooks.get(hookName);
        if (hooks) {
          const callback = hooks.get(callbackOrId);
          hooks.delete(callbackOrId);
          if (callback) {
            const hookInfos = this.callbackToIdMap.get(callback);
            if (hookInfos) {
              const filtered = hookInfos.filter(
                (info) => !(info.hookName === hookName && info.id === callbackOrId)
              );
              if (filtered.length === 0) {
                this.callbackToIdMap.delete(callback);
              } else {
                this.callbackToIdMap.set(callback, filtered);
              }
            }
          }
          this.idToHookNameMap.delete(callbackOrId);
        }
      } else {
        const hookInfos = this.callbackToIdMap.get(callbackOrId);
        if (hookInfos) {
          const matchingInfos = hookInfos.filter((info) => info.hookName === hookName);
          const hooks = this.registeredHooks.get(hookName);
          if (hooks) {
            for (const info of matchingInfos) {
              hooks.delete(info.id);
            }
          }
          const filtered = hookInfos.filter((info) => info.hookName !== hookName);
          if (filtered.length === 0) {
            this.callbackToIdMap.delete(callbackOrId);
          } else {
            this.callbackToIdMap.set(callbackOrId, filtered);
          }
        }
      }
    }
    return result;
  }
  /**
   * Cleans up all registered hooks.
   * Called automatically when the container is disposed.
   */
  dispose() {
    for (const [callback, hookInfos] of this.callbackToIdMap) {
      for (const info of hookInfos) {
        try {
          if (typeof Hooks !== "undefined") {
            Hooks.off(info.hookName, callback);
          }
        } catch (error) {
          this.logger.warn("Failed to unregister hook", {
            hookName: info.hookName,
            hookId: info.id,
            error
          });
        }
      }
    }
    this.registeredHooks.clear();
    this.callbackToIdMap.clear();
    this.idToHookNameMap.clear();
    this.port = null;
  }
  // ===== PlatformEventPort Implementation =====
  /**
   * Register a listener for platform events.
   * Delegates to FoundryHooks.on() for Foundry-specific implementation.
   * Wraps the PlatformEventPort callback to receive Foundry hook arguments as an array.
   */
  registerListener(eventType, callback) {
    const foundryCallback = /* @__PURE__ */ __name((...args2) => {
      callback(args2);
    }, "foundryCallback");
    const result = this.on(eventType, foundryCallback);
    if (!result.ok) {
      return err({
        code: "EVENT_REGISTRATION_FAILED",
        message: `Failed to register listener for event "${eventType}": ${result.error.message}`,
        details: result.error
      });
    }
    return ok(result.value);
  }
  /**
   * Unregister a previously registered listener.
   * Requires mapping from registration ID to hook name.
   */
  unregisterListener(registrationId) {
    const id = typeof registrationId === "string" ? Number.parseInt(registrationId, 10) : registrationId;
    if (Number.isNaN(id)) {
      return err({
        code: "EVENT_UNREGISTRATION_FAILED",
        message: `Invalid registration ID: ${String(registrationId)}`
      });
    }
    const hookName = this.idToHookNameMap.get(id);
    if (!hookName) {
      return err({
        code: "EVENT_UNREGISTRATION_FAILED",
        message: `No registration found for ID ${id}`
      });
    }
    const result = this.off(hookName, id);
    if (!result.ok) {
      return err({
        code: "EVENT_UNREGISTRATION_FAILED",
        message: `Failed to unregister listener for event "${hookName}": ${result.error.message}`,
        details: result.error
      });
    }
    return ok(void 0);
  }
};
__name(_FoundryHooksPort, "FoundryHooksPort");
let FoundryHooksPort = _FoundryHooksPort;
const _DIFoundryHooksPort = class _DIFoundryHooksPort extends FoundryHooksPort {
  constructor(portSelector, portRegistry, retryService, logger) {
    super(portSelector, portRegistry, retryService, logger);
  }
};
__name(_DIFoundryHooksPort, "DIFoundryHooksPort");
_DIFoundryHooksPort.dependencies = [
  portSelectorToken,
  foundryHooksPortRegistryToken,
  retryServiceToken,
  loggerToken
];
let DIFoundryHooksPort = _DIFoundryHooksPort;
const _FoundryDocumentPort = class _FoundryDocumentPort extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  async create(documentClass, data) {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.create(documentClass, data);
    }, "FoundryDocument.create");
  }
  async update(document2, changes) {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.update(document2, changes);
    }, "FoundryDocument.update");
  }
  async delete(document2) {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.delete(document2);
    }, "FoundryDocument.delete");
  }
  getFlag(document2, scope, key, schema) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return portResult.value.getFlag(document2, scope, key, schema);
    }, "FoundryDocument.getFlag");
  }
  async setFlag(document2, scope, key, value2) {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.setFlag(document2, scope, key, value2);
    }, "FoundryDocument.setFlag");
  }
  async unsetFlag(document2, scope, key) {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.unsetFlag(document2, scope, key);
    }, "FoundryDocument.unsetFlag");
  }
};
__name(_FoundryDocumentPort, "FoundryDocumentPort");
let FoundryDocumentPort = _FoundryDocumentPort;
const _DIFoundryDocumentPort = class _DIFoundryDocumentPort extends FoundryDocumentPort {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundryDocumentPort, "DIFoundryDocumentPort");
_DIFoundryDocumentPort.dependencies = [
  portSelectorToken,
  foundryDocumentPortRegistryToken,
  retryServiceToken
];
let DIFoundryDocumentPort = _DIFoundryDocumentPort;
const _FoundryUIPort = class _FoundryUIPort extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  removeJournalElement(journalId, journalName, html) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.removeJournalElement(journalId, journalName, html);
    }, "FoundryUI.removeJournalElement");
  }
  findElement(container, selector) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.findElement(container, selector);
    }, "FoundryUI.findElement");
  }
  notify(message2, type, options) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.notify(message2, type, options);
    }, "FoundryUI.notify");
  }
  rerenderJournalDirectory() {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.rerenderJournalDirectory();
    }, "FoundryUI.rerenderJournalDirectory");
  }
};
__name(_FoundryUIPort, "FoundryUIPort");
let FoundryUIPort = _FoundryUIPort;
const _DIFoundryUIPort = class _DIFoundryUIPort extends FoundryUIPort {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundryUIPort, "DIFoundryUIPort");
_DIFoundryUIPort.dependencies = [portSelectorToken, foundryUIPortRegistryToken, retryServiceToken];
let DIFoundryUIPort = _DIFoundryUIPort;
const _FoundrySettingsPort = class _FoundrySettingsPort extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  register(namespace, key, config2) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.register(namespace, key, config2);
    }, "FoundrySettings.register");
  }
  get(namespace, key, schema) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.get(namespace, key, schema);
    }, "FoundrySettings.get");
  }
  async set(namespace, key, value2) {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.set(namespace, key, value2);
    }, "FoundrySettings.set");
  }
};
__name(_FoundrySettingsPort, "FoundrySettingsPort");
let FoundrySettingsPort = _FoundrySettingsPort;
const _DIFoundrySettingsPort = class _DIFoundrySettingsPort extends FoundrySettingsPort {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundrySettingsPort, "DIFoundrySettingsPort");
_DIFoundrySettingsPort.dependencies = [
  portSelectorToken,
  foundrySettingsPortRegistryToken,
  retryServiceToken
];
let DIFoundrySettingsPort = _DIFoundrySettingsPort;
const _FoundryJournalFacade = class _FoundryJournalFacade {
  constructor(game2, document2, ui2, moduleId) {
    this.game = game2;
    this.document = document2;
    this.ui = ui2;
    this.moduleId = moduleId;
  }
  /**
   * Get all journal entries from Foundry.
   *
   * Delegates to FoundryGame.getJournalEntries().
   */
  getJournalEntries() {
    return this.game.getJournalEntries();
  }
  /**
   * Get a module flag from a journal entry with runtime validation.
   *
   * Delegates to FoundryDocument.getFlag() with module scope and schema.
   *
   * @template T - The flag value type
   * @param entry - The Foundry journal entry
   * @param key - The flag key
   * @param schema - Valibot schema for validation
   */
  getEntryFlag(entry, key, schema) {
    const documentResult = castFoundryDocumentForFlag(entry);
    if (!documentResult.ok) {
      return documentResult;
    }
    return this.document.getFlag(documentResult.value, this.moduleId, key, schema);
  }
  /**
   * Remove a journal element from the UI.
   *
   * Delegates to FoundryUI.removeJournalElement().
   *
   * @param id - Journal entry ID
   * @param name - Journal entry name (for logging)
   * @param html - HTML container element
   */
  removeJournalElement(id, name, html) {
    return this.ui.removeJournalElement(id, name, html);
  }
  /**
   * Set a module flag on a journal entry.
   *
   * Delegates to FoundryDocument.setFlag() with module scope.
   *
   * @param entry - The Foundry journal entry
   * @param key - The flag key
   * @param value - The boolean value to set
   * @returns Result indicating success or error
   */
  async setEntryFlag(entry, key, value2) {
    const documentResult = castFoundryDocumentForFlag(entry);
    if (!documentResult.ok) {
      return documentResult;
    }
    return await this.document.setFlag(documentResult.value, this.moduleId, key, value2);
  }
};
__name(_FoundryJournalFacade, "FoundryJournalFacade");
let FoundryJournalFacade = _FoundryJournalFacade;
const _DIFoundryJournalFacade = class _DIFoundryJournalFacade extends FoundryJournalFacade {
  constructor(game2, document2, ui2, moduleId) {
    super(game2, document2, ui2, moduleId);
  }
};
__name(_DIFoundryJournalFacade, "DIFoundryJournalFacade");
_DIFoundryJournalFacade.dependencies = [
  foundryGameToken,
  foundryDocumentToken,
  foundryUIToken,
  moduleIdToken
];
let DIFoundryJournalFacade = _DIFoundryJournalFacade;
function sanitizeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
__name(sanitizeHtml, "sanitizeHtml");
const HIDDEN_JOURNAL_CACHE_TAG = "journal:hidden";
const _JournalVisibilityService = class _JournalVisibilityService {
  constructor(journalCollection, journalRepository, notifications, cache, config2) {
    this.journalCollection = journalCollection;
    this.journalRepository = journalRepository;
    this.notifications = notifications;
    this.cache = cache;
    this.config = config2;
  }
  /**
   * Gets journal entries marked as hidden via module flag.
   * Logs warnings for entries where flag reading fails to aid diagnosis.
   */
  getHiddenJournalEntries() {
    const cacheKey = this.config.cacheKeyFactory("hidden-directory");
    const cached = this.cache.get(cacheKey);
    if (cached?.hit && cached.value) {
      this.notifications.debug(
        `Serving ${cached.value.length} hidden journal entries from cache (ttl=${cached.metadata.expiresAt ?? "∞"})`,
        { context: { cached } },
        { channels: ["ConsoleChannel"] }
      );
      return { ok: true, value: cached.value };
    }
    const allEntriesResult = this.journalCollection.getAll();
    if (!allEntriesResult.ok) {
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: allEntriesResult.error.message
        }
      };
    }
    const hidden = [];
    for (const journal of allEntriesResult.value) {
      const flagResult = this.journalRepository.getFlag(
        journal.id,
        this.config.moduleNamespace,
        this.config.hiddenFlagKey
      );
      if (flagResult.ok) {
        if (flagResult.value === true) {
          hidden.push(journal);
        }
      } else {
        const journalIdentifier = journal.name ?? journal.id;
        this.notifications.warn(
          `Failed to read hidden flag for journal "${sanitizeHtml(journalIdentifier)}"`,
          {
            errorCode: flagResult.error.code,
            errorMessage: flagResult.error.message
          },
          { channels: ["ConsoleChannel"] }
        );
      }
    }
    this.cache.set(cacheKey, hidden.slice(), {
      tags: [HIDDEN_JOURNAL_CACHE_TAG]
    });
    return { ok: true, value: hidden };
  }
};
__name(_JournalVisibilityService, "JournalVisibilityService");
let JournalVisibilityService = _JournalVisibilityService;
const _DIJournalVisibilityService = class _DIJournalVisibilityService extends JournalVisibilityService {
  constructor(journalCollection, journalRepository, notifications, cache, config2) {
    super(journalCollection, journalRepository, notifications, cache, config2);
  }
};
__name(_DIJournalVisibilityService, "DIJournalVisibilityService");
_DIJournalVisibilityService.dependencies = [
  platformJournalCollectionPortToken,
  platformJournalRepositoryToken,
  platformNotificationPortToken,
  platformCachePortToken,
  journalVisibilityConfigToken
];
let DIJournalVisibilityService = _DIJournalVisibilityService;
function isNonEmptyArray(array2) {
  return array2.length > 0;
}
__name(isNonEmptyArray, "isNonEmptyArray");
function getFirstArrayElement$1(array2) {
  if (!isNonEmptyArray(array2)) {
    throw new Error("Array must have length > 0 (caller violated precondition)");
  }
  return array2[0];
}
__name(getFirstArrayElement$1, "getFirstArrayElement$1");
function getFirstArrayElementSafe(array2) {
  return isNonEmptyArray(array2) ? array2[0] : null;
}
__name(getFirstArrayElementSafe, "getFirstArrayElementSafe");
const _JournalDirectoryProcessor = class _JournalDirectoryProcessor {
  constructor(journalDirectoryUI, notifications, config2) {
    this.journalDirectoryUI = journalDirectoryUI;
    this.notifications = notifications;
    this.config = config2;
  }
  /**
   * Processes journal directory HTML to hide flagged entries.
   * @param htmlElement - The HTML element containing the journal directory
   * @param hiddenEntries - Array of journal entries that should be hidden
   * @returns Result indicating success or failure with aggregated errors
   */
  processDirectory(htmlElement, hiddenEntries) {
    this.notifications.debug(
      "Processing journal directory for hidden entries",
      { context: { htmlElement, hiddenCount: hiddenEntries.length } },
      {
        channels: ["ConsoleChannel"]
      }
    );
    if (hiddenEntries.length === 0) {
      this.notifications.debug(
        "No hidden entries to process",
        { context: {} },
        {
          channels: ["ConsoleChannel"]
        }
      );
      return { ok: true, value: void 0 };
    }
    this.notifications.debug(
      `Found ${hiddenEntries.length} hidden journal entries`,
      { context: { hidden: hiddenEntries } },
      {
        channels: ["ConsoleChannel"]
      }
    );
    return this.hideEntries(hiddenEntries, htmlElement);
  }
  /**
   * Hides multiple journal entries in the DOM.
   * @param entries - Array of journal entries to hide
   * @param html - The HTML element containing the journal directory
   * @returns Result indicating success or failure with aggregated errors
   */
  hideEntries(entries2, html) {
    const errors = [];
    for (const journal of entries2) {
      const journalName = journal.name ?? this.config.unknownName;
      const removeResult = this.journalDirectoryUI.removeJournalElement(
        journal.id,
        journalName,
        html
      );
      if (!removeResult.ok) {
        const journalError = {
          code: "DOM_MANIPULATION_FAILED",
          entryId: journal.id,
          message: removeResult.error.message
        };
        errors.push(journalError);
        this.notifications.warn("Error removing journal entry", journalError, {
          channels: ["ConsoleChannel"]
        });
      } else {
        this.notifications.debug(
          `Removing journal entry: ${sanitizeHtml(journalName)}`,
          { context: { journal } },
          { channels: ["ConsoleChannel"] }
        );
      }
    }
    if (errors.length > 0) {
      const firstError = getFirstArrayElement$1(errors);
      return { ok: false, error: firstError };
    }
    return { ok: true, value: void 0 };
  }
};
__name(_JournalDirectoryProcessor, "JournalDirectoryProcessor");
let JournalDirectoryProcessor = _JournalDirectoryProcessor;
const _DIJournalDirectoryProcessor = class _DIJournalDirectoryProcessor extends JournalDirectoryProcessor {
  constructor(journalDirectoryUI, notifications, config2) {
    super(journalDirectoryUI, notifications, config2);
  }
};
__name(_DIJournalDirectoryProcessor, "DIJournalDirectoryProcessor");
_DIJournalDirectoryProcessor.dependencies = [
  platformJournalDirectoryUiPortToken,
  platformNotificationPortToken,
  journalVisibilityConfigToken
];
let DIJournalDirectoryProcessor = _DIJournalDirectoryProcessor;
const _FoundryLibWrapperService = class _FoundryLibWrapperService {
  constructor(moduleId, logger) {
    this.moduleId = moduleId;
    this.logger = logger;
    this.registeredTargets = /* @__PURE__ */ new Map();
    this.nextId = 1;
  }
  register(target, wrapperFn, type) {
    if (typeof globalThis.libWrapper === "undefined") {
      return err({
        code: "LIBWRAPPER_NOT_AVAILABLE",
        message: "libWrapper is not available"
      });
    }
    if (this.registeredTargets.has(target)) {
      return err({
        code: "REGISTRATION_FAILED",
        message: `Target "${target}" is already registered`,
        details: { target }
      });
    }
    const result = tryCatch(
      () => {
        const libWrapperInstance = globalThis.libWrapper;
        if (typeof libWrapperInstance === "undefined") {
          throw new Error("libWrapper is not available");
        }
        libWrapperInstance.register(this.moduleId, target, wrapperFn, type);
        this.registeredTargets.set(target, true);
        const registrationId = this.nextId++;
        return registrationId;
      },
      (error) => ({
        code: "REGISTRATION_FAILED",
        message: `Failed to register wrapper for target "${target}": ${String(error)}`,
        details: { target, error }
      })
    );
    if (result.ok) {
      return ok(result.value);
    }
    return result;
  }
  unregister(target) {
    if (!this.registeredTargets.has(target)) {
      return err({
        code: "TARGET_NOT_REGISTERED",
        message: `Target "${target}" is not registered`,
        details: { target }
      });
    }
    if (typeof globalThis.libWrapper === "undefined") {
      return err({
        code: "LIBWRAPPER_NOT_AVAILABLE",
        message: "libWrapper is not available"
      });
    }
    const result = tryCatch(
      () => {
        const libWrapperInstance = globalThis.libWrapper;
        if (typeof libWrapperInstance === "undefined") {
          throw new Error("libWrapper is not available");
        }
        libWrapperInstance.unregister(this.moduleId, target);
        this.registeredTargets.delete(target);
      },
      (error) => ({
        code: "UNREGISTRATION_FAILED",
        message: `Failed to unregister wrapper for target "${target}": ${String(error)}`,
        details: { target, error }
      })
    );
    if (result.ok) {
      return ok(void 0);
    }
    return result;
  }
  /**
   * Cleanup all registered wrappers.
   * Should be called during module shutdown.
   */
  dispose() {
    const targets = Array.from(this.registeredTargets.keys());
    for (const target of targets) {
      const result = this.unregister(target);
      if (!result.ok) {
        this.logger.warn("Failed to unregister libWrapper target during dispose", {
          target,
          error: result.error
        });
      }
    }
    this.registeredTargets.clear();
  }
};
__name(_FoundryLibWrapperService, "FoundryLibWrapperService");
let FoundryLibWrapperService = _FoundryLibWrapperService;
const _DIFoundryLibWrapperService = class _DIFoundryLibWrapperService extends FoundryLibWrapperService {
  constructor(moduleId, logger) {
    super(moduleId, logger);
  }
};
__name(_DIFoundryLibWrapperService, "DIFoundryLibWrapperService");
_DIFoundryLibWrapperService.dependencies = [moduleIdToken, loggerToken];
let DIFoundryLibWrapperService = _DIFoundryLibWrapperService;
const libWrapperServiceToken = createInjectionToken("LibWrapperService");
const _JournalContextMenuLibWrapperService = class _JournalContextMenuLibWrapperService {
  constructor(libWrapperService, logger) {
    this.libWrapperService = libWrapperService;
    this.logger = logger;
    this.libWrapperRegistered = false;
    this.callbacks = [];
  }
  /**
   * Register libWrapper for ContextMenu.render.
   * Should be called once during module initialization.
   *
   * @returns Success or error if registration failed
   */
  register() {
    if (this.libWrapperRegistered) {
      return ok(void 0);
    }
    const contextMenuClass = globalThis.foundry?.applications?.ux?.ContextMenu?.implementation;
    if (!contextMenuClass) {
      return err(new Error("ContextMenu is not available"));
    }
    const wrapperFn = this.createWrapperFunction();
    const result = this.libWrapperService.register(
      "foundry.applications.ux.ContextMenu.implementation.prototype.render",
      wrapperFn,
      "WRAPPER"
    );
    if (!result.ok) {
      return err(new Error(result.error.message));
    }
    this.registrationId = result.value;
    this.libWrapperRegistered = true;
    this.logger.debug("Journal context menu libWrapper registered");
    return ok(void 0);
  }
  /**
   * Add a callback that will be called when a journal context menu is rendered.
   *
   * @param callback - Callback function that receives the context menu event
   */
  addCallback(callback) {
    this.callbacks.push(callback);
  }
  /**
   * Remove a previously registered callback.
   *
   * @param callback - The callback function to remove
   */
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
  /**
   * Cleanup: Unregister libWrapper.
   * Should be called during module shutdown.
   */
  dispose() {
    if (this.libWrapperRegistered) {
      const result = this.libWrapperService.unregister(
        "foundry.applications.ux.ContextMenu.implementation.prototype.render"
      );
      if (!result.ok) {
        this.logger.warn("Failed to unregister context menu libWrapper", {
          error: result.error
        });
      }
      this.libWrapperRegistered = false;
      this.registrationId = void 0;
    }
    this.callbacks = [];
  }
  /**
   * Create the wrapper function for libWrapper.
   * This function intercepts ContextMenu.render calls and allows
   * registered callbacks to modify the menu options.
   */
  createWrapperFunction() {
    const callbacksRef = this.callbacks;
    return function(wrapped, ...args2) {
      const firstArg = args2[0];
      const target = firstArg instanceof HTMLElement ? firstArg : void 0;
      if (!target) {
        return wrapped.call(this, ...args2);
      }
      const menuItemsRaw = this.menuItems;
      if (!menuItemsRaw) {
        return wrapped.call(this, ...args2);
      }
      const menuItems = menuItemsRaw;
      const journalId = target.getAttribute?.("data-entry-id") || target.getAttribute?.("data-document-id");
      if (journalId) {
        const event = {
          htmlElement: target,
          options: menuItems.map((item) => ({
            name: item.name,
            icon: item.icon,
            callback: item.callback
          })),
          timestamp: Date.now()
        };
        for (const cb of callbacksRef) {
          cb(event);
        }
        const existingNames = new Set(menuItems.map((item) => item.name));
        for (const newOption of event.options) {
          if (!existingNames.has(newOption.name)) {
            menuItems.push({
              name: newOption.name,
              icon: newOption.icon,
              callback: /* @__PURE__ */ __name(() => {
                const result = newOption.callback(target);
                if (result instanceof Promise) {
                  result.catch(() => {
                  });
                }
              }, "callback")
            });
          }
        }
      }
      return wrapped.call(this, ...args2);
    };
  }
};
__name(_JournalContextMenuLibWrapperService, "JournalContextMenuLibWrapperService");
let JournalContextMenuLibWrapperService = _JournalContextMenuLibWrapperService;
const _DIJournalContextMenuLibWrapperService = class _DIJournalContextMenuLibWrapperService extends JournalContextMenuLibWrapperService {
  constructor(libWrapperService, logger) {
    super(libWrapperService, logger);
  }
};
__name(_DIJournalContextMenuLibWrapperService, "DIJournalContextMenuLibWrapperService");
_DIJournalContextMenuLibWrapperService.dependencies = [libWrapperServiceToken, loggerToken];
let DIJournalContextMenuLibWrapperService = _DIJournalContextMenuLibWrapperService;
const _FoundrySettingsRegistrationAdapter = class _FoundrySettingsRegistrationAdapter {
  constructor(foundrySettings) {
    this.foundrySettings = foundrySettings;
  }
  registerSetting(namespace, key, config2) {
    const foundryConfig = {
      name: config2.name,
      ...config2.hint !== void 0 && { hint: config2.hint },
      scope: config2.scope,
      config: config2.config,
      type: config2.type,
      ...config2.choices !== void 0 && { choices: config2.choices },
      default: config2.default,
      ...config2.onChange !== void 0 && { onChange: config2.onChange }
    };
    const result = this.foundrySettings.register(namespace, key, foundryConfig);
    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryError(result.error, "register", key)
      };
    }
    return { ok: true, value: void 0 };
  }
  getSettingValue(namespace, key, validator) {
    const permissiveSchema = /* @__PURE__ */ unknown();
    const result = this.foundrySettings.get(namespace, key, permissiveSchema);
    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryError(result.error, "get", key)
      };
    }
    if (!validator(result.value)) {
      return {
        ok: false,
        error: {
          code: "INVALID_SETTING_VALUE",
          message: `Setting "${namespace}.${key}" has invalid value type`,
          details: { value: result.value }
        }
      };
    }
    return { ok: true, value: result.value };
  }
  async setSettingValue(namespace, key, value2) {
    const result = await this.foundrySettings.set(namespace, key, value2);
    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryError(result.error, "set", key)
      };
    }
    return { ok: true, value: void 0 };
  }
  // ===== Private Helpers =====
  mapFoundryError(foundryError, operation, key) {
    let code;
    switch (foundryError.code) {
      case "API_NOT_AVAILABLE":
        code = "PLATFORM_NOT_AVAILABLE";
        break;
      case "VALIDATION_FAILED":
        code = "INVALID_SETTING_VALUE";
        break;
      case "OPERATION_FAILED":
        if (operation === "register") {
          code = "SETTING_REGISTRATION_FAILED";
        } else if (operation === "get") {
          code = "SETTING_READ_FAILED";
        } else {
          code = "SETTING_WRITE_FAILED";
        }
        break;
      default:
        code = operation === "register" ? "SETTING_REGISTRATION_FAILED" : operation === "get" ? "SETTING_READ_FAILED" : "SETTING_WRITE_FAILED";
    }
    return {
      code,
      message: `Failed to ${operation} setting "${key}": ${foundryError.message}`,
      details: foundryError
    };
  }
};
__name(_FoundrySettingsRegistrationAdapter, "FoundrySettingsRegistrationAdapter");
let FoundrySettingsRegistrationAdapter = _FoundrySettingsRegistrationAdapter;
const _DIFoundrySettingsRegistrationAdapter = class _DIFoundrySettingsRegistrationAdapter extends FoundrySettingsRegistrationAdapter {
  constructor(foundrySettings) {
    super(foundrySettings);
  }
};
__name(_DIFoundrySettingsRegistrationAdapter, "DIFoundrySettingsRegistrationAdapter");
_DIFoundrySettingsRegistrationAdapter.dependencies = [foundrySettingsToken];
let DIFoundrySettingsRegistrationAdapter = _DIFoundrySettingsRegistrationAdapter;
function registerFoundryServices(container) {
  const gameServiceResult = container.registerClass(
    foundryGameToken,
    DIFoundryGamePort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(gameServiceResult)) {
    return err(`Failed to register FoundryGame service: ${gameServiceResult.error.message}`);
  }
  const hooksServiceResult = container.registerClass(
    foundryHooksToken,
    DIFoundryHooksPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(hooksServiceResult)) {
    return err(`Failed to register FoundryHooks service: ${hooksServiceResult.error.message}`);
  }
  const documentServiceResult = container.registerClass(
    foundryDocumentToken,
    DIFoundryDocumentPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(documentServiceResult)) {
    return err(
      `Failed to register FoundryDocument service: ${documentServiceResult.error.message}`
    );
  }
  const uiServiceResult = container.registerClass(
    foundryUIToken,
    DIFoundryUIPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiServiceResult)) {
    return err(`Failed to register FoundryUI service: ${uiServiceResult.error.message}`);
  }
  const settingsServiceResult = container.registerClass(
    foundrySettingsToken,
    DIFoundrySettingsPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsServiceResult)) {
    return err(
      `Failed to register FoundrySettings service: ${settingsServiceResult.error.message}`
    );
  }
  const settingsRegistrationResult = container.registerClass(
    platformSettingsRegistrationPortToken,
    DIFoundrySettingsRegistrationAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsRegistrationResult)) {
    return err(
      `Failed to register PlatformSettingsRegistrationPort: ${settingsRegistrationResult.error.message}`
    );
  }
  const journalFacadeResult = container.registerClass(
    foundryJournalFacadeToken,
    DIFoundryJournalFacade,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalFacadeResult)) {
    return err(`Failed to register FoundryJournalFacade: ${journalFacadeResult.error.message}`);
  }
  const journalVisibilityResult = container.registerClass(
    journalVisibilityServiceToken,
    DIJournalVisibilityService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalVisibilityResult)) {
    return err(
      `Failed to register JournalVisibility service: ${journalVisibilityResult.error.message}`
    );
  }
  const journalDirectoryProcessorResult = container.registerClass(
    journalDirectoryProcessorToken,
    DIJournalDirectoryProcessor,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalDirectoryProcessorResult)) {
    return err(
      `Failed to register JournalDirectoryProcessor: ${journalDirectoryProcessorResult.error.message}`
    );
  }
  const libWrapperServiceResult = container.registerClass(
    libWrapperServiceToken,
    DIFoundryLibWrapperService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(libWrapperServiceResult)) {
    return err(`Failed to register LibWrapperService: ${libWrapperServiceResult.error.message}`);
  }
  const contextMenuLibWrapperResult = container.registerClass(
    journalContextMenuLibWrapperServiceToken,
    DIJournalContextMenuLibWrapperService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(contextMenuLibWrapperResult)) {
    return err(
      `Failed to register JournalContextMenuLibWrapperService: ${contextMenuLibWrapperResult.error.message}`
    );
  }
  const contextMenuPortResult = container.registerAlias(
    platformContextMenuRegistrationPortToken,
    journalContextMenuLibWrapperServiceToken
  );
  if (isErr(contextMenuPortResult)) {
    return err(
      `Failed to register PlatformContextMenuRegistrationPort: ${contextMenuPortResult.error.message}`
    );
  }
  return ok(void 0);
}
__name(registerFoundryServices, "registerFoundryServices");
const performanceTrackingServiceToken = createInjectionToken(
  "PerformanceTrackingService"
);
const _PerformanceTrackingService = class _PerformanceTrackingService extends PerformanceTrackerImpl {
  constructor(config2, sampler) {
    super(config2, sampler);
  }
};
__name(_PerformanceTrackingService, "PerformanceTrackingService");
let PerformanceTrackingService = _PerformanceTrackingService;
const _DIPerformanceTrackingService = class _DIPerformanceTrackingService extends PerformanceTrackingService {
  constructor(config2, sampler) {
    super(config2, sampler);
  }
};
__name(_DIPerformanceTrackingService, "DIPerformanceTrackingService");
_DIPerformanceTrackingService.dependencies = [runtimeConfigToken, metricsSamplerToken];
let DIPerformanceTrackingService = _DIPerformanceTrackingService;
const _BaseRetryService = class _BaseRetryService {
  /**
   * Retries an async operation with exponential backoff.
   *
   * @template SuccessType - The success type of the operation
   * @template ErrorType - The error type of the operation
   * @param fn - Async function that returns a Result
   * @param options - Retry configuration options
   * @returns Promise resolving to the Result (success or last error)
   */
  async retry(fn, options) {
    const maxAttempts = options.maxAttempts ?? 3;
    const delayMs = options.delayMs ?? 100;
    const backoffFactor = options.backoffFactor ?? 1;
    const { mapException } = options;
    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }
    let lastError = mapException("Initial retry error", 0);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        if (result.ok) {
          return result;
        }
        lastError = result.error;
        if (attempt === maxAttempts) {
          break;
        }
        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        lastError = mapException(error, attempt);
        if (attempt === maxAttempts) {
          break;
        }
        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return err(lastError);
  }
  /**
   * Retries a synchronous operation.
   * Similar to retry but for sync functions.
   *
   * @template SuccessType - The success type
   * @template ErrorType - The error type
   * @param fn - Function that returns a Result
   * @param options - Retry configuration options (without delayMs and backoffFactor)
   * @returns The Result (success or last error)
   */
  retrySync(fn, options) {
    const maxAttempts = options.maxAttempts ?? 3;
    const { mapException } = options;
    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }
    let lastError = mapException("Initial retry error", 0);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = fn();
        if (result.ok) {
          return result;
        }
        lastError = result.error;
        if (attempt === maxAttempts) {
          break;
        }
      } catch (error) {
        lastError = mapException(error, attempt);
        if (attempt === maxAttempts) {
          break;
        }
      }
    }
    return err(lastError);
  }
};
__name(_BaseRetryService, "BaseRetryService");
let BaseRetryService = _BaseRetryService;
const _RetryObservabilityDecorator = class _RetryObservabilityDecorator extends BaseRetryService {
  constructor(logger) {
    super();
    this.logger = logger;
  }
  /**
   * Retries an async operation with exponential backoff and observability.
   *
   * @template SuccessType - The success type of the operation
   * @template ErrorType - The error type of the operation
   * @param fn - Async function that returns a Result
   * @param options - Retry configuration options with optional observability
   * @returns Promise resolving to the Result (success or last error)
   */
  async retry(fn, options) {
    const { operationName, ...baseOptions } = options;
    const startTime = performance.now();
    let attemptCount = 0;
    const wrappedFn = /* @__PURE__ */ __name(async () => {
      attemptCount++;
      try {
        const result2 = await fn();
        if (!result2.ok && attemptCount < (baseOptions.maxAttempts ?? 3)) {
          if (operationName) {
            this.logger.debug(
              `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} failed for "${operationName}"`,
              { error: result2.error }
            );
          }
        }
        return result2;
      } catch (error) {
        if (attemptCount < (baseOptions.maxAttempts ?? 3) && operationName) {
          this.logger.warn(
            `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} threw exception for "${operationName}"`,
            { error }
          );
        }
        throw error;
      }
    }, "wrappedFn");
    const result = await super.retry(wrappedFn, baseOptions);
    const duration = performance.now() - startTime;
    if (operationName) {
      if (result.ok && attemptCount > 1) {
        this.logger.debug(
          `Retry succeeded for "${operationName}" after ${attemptCount} attempts (${duration.toFixed(2)}ms)`
        );
      } else if (!result.ok) {
        this.logger.warn(
          `All retry attempts exhausted for "${operationName}" after ${baseOptions.maxAttempts ?? 3} attempts (${duration.toFixed(2)}ms)`
        );
      }
    }
    return result;
  }
  /**
   * Retries a synchronous operation with observability.
   *
   * @template SuccessType - The success type
   * @template ErrorType - The error type
   * @param fn - Function that returns a Result
   * @param options - Retry configuration options (without delayMs and backoffFactor)
   * @returns The Result (success or last error)
   */
  retrySync(fn, options) {
    const { operationName, ...baseOptions } = options;
    let attemptCount = 0;
    const wrappedFn = /* @__PURE__ */ __name(() => {
      attemptCount++;
      try {
        const result2 = fn();
        if (!result2.ok && attemptCount < (baseOptions.maxAttempts ?? 3)) {
          if (operationName) {
            this.logger.debug(
              `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} failed for "${operationName}"`,
              { error: result2.error }
            );
          }
        }
        return result2;
      } catch (error) {
        if (attemptCount < (baseOptions.maxAttempts ?? 3) && operationName) {
          this.logger.warn(
            `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} threw exception for "${operationName}"`,
            { error }
          );
        }
        throw error;
      }
    }, "wrappedFn");
    const result = super.retrySync(wrappedFn, baseOptions);
    if (operationName && !result.ok) {
      this.logger.warn(
        `All retry attempts exhausted for "${operationName}" after ${baseOptions.maxAttempts ?? 3} attempts`
      );
    } else if (operationName && result.ok && attemptCount > 1) {
      this.logger.debug(`Retry succeeded for "${operationName}" after ${attemptCount} attempts`);
    }
    return result;
  }
};
__name(_RetryObservabilityDecorator, "RetryObservabilityDecorator");
let RetryObservabilityDecorator = _RetryObservabilityDecorator;
function isLogger(value2) {
  return !(value2 instanceof BaseRetryService);
}
__name(isLogger, "isLogger");
const _RetryService = class _RetryService {
  constructor(loggerOrBaseService, observabilityDecorator) {
    if (observabilityDecorator) {
      this.composedService = observabilityDecorator;
    } else {
      if (!isLogger(loggerOrBaseService)) {
        throw new Error("BaseRetryService cannot be used without RetryObservabilityDecorator");
      }
      this.composedService = new RetryObservabilityDecorator(loggerOrBaseService);
    }
  }
  /**
   * Retries an async operation with exponential backoff.
   *
   * Useful for handling transient failures in external APIs (e.g., Foundry API calls).
   *
   * @template SuccessType - The success type of the operation
   * @template ErrorType - The error type of the operation
   * @param fn - Async function that returns a Result
   * @param options - Retry configuration options
   * @returns Promise resolving to the Result (success or last error)
   *
   * @example
   * ```typescript
   * const result = await retryService.retry(
   *   () => foundryApi.fetchData(),
   *   {
   *     maxAttempts: 3,
   *     delayMs: 100,
   *     operationName: "fetchData",
   *     mapException: (error, attempt) => ({
   *       code: 'OPERATION_FAILED' as const,
   *       message: `Attempt ${attempt} failed: ${String(error)}`
   *     })
   *   }
   * );
   * ```
   */
  async retry(fn, options) {
    return this.composedService.retry(fn, options);
  }
  /**
   * Retries a synchronous operation.
   * Similar to retry but for sync functions.
   *
   * @template SuccessType - The success type
   * @template ErrorType - The error type
   * @param fn - Function that returns a Result
   * @param options - Retry configuration options
   * @returns The Result (success or last error)
   *
   * @example
   * ```typescript
   * const result = retryService.retrySync(
   *   () => parseData(input),
   *   {
   *     maxAttempts: 3,
   *     operationName: "parseData",
   *     mapException: (error, attempt) => ({
   *       code: 'PARSE_FAILED' as const,
   *       message: `Parse attempt ${attempt} failed: ${String(error)}`
   *     })
   *   }
   * );
   * ```
   */
  retrySync(fn, options) {
    return this.composedService.retrySync(fn, options);
  }
};
__name(_RetryService, "RetryService");
let RetryService = _RetryService;
const _DIRetryService = class _DIRetryService extends RetryService {
  constructor(logger) {
    super(logger);
  }
};
__name(_DIRetryService, "DIRetryService");
_DIRetryService.dependencies = [loggerToken];
let DIRetryService = _DIRetryService;
function registerUtilityServices(container) {
  const perfTrackingResult = container.registerClass(
    performanceTrackingServiceToken,
    DIPerformanceTrackingService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(perfTrackingResult)) {
    return err(
      `Failed to register PerformanceTrackingService: ${perfTrackingResult.error.message}`
    );
  }
  const retryServiceResult = container.registerClass(
    retryServiceToken,
    DIRetryService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(retryServiceResult)) {
    return err(`Failed to register RetryService: ${retryServiceResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerUtilityServices, "registerUtilityServices");
const cacheServiceConfigToken = createInjectionToken("CacheServiceConfig");
const cacheServiceToken = createInjectionToken("CacheService");
const cacheConfigSyncToken = createInjectionToken("CacheConfigSync");
function toStringKeyArray(allowed) {
  return allowed;
}
__name(toStringKeyArray, "toStringKeyArray");
function castCacheValue(value2) {
  return value2;
}
__name(castCacheValue, "castCacheValue");
function getFirstArrayElement(array2) {
  return array2[0];
}
__name(getFirstArrayElement, "getFirstArrayElement");
function getFirstElementIfArray(value2, typeGuard) {
  if (Array.isArray(value2) && value2.length > 0) {
    const firstElement = value2[0];
    if (typeGuard(firstElement)) {
      return firstElement;
    }
  }
  return null;
}
__name(getFirstElementIfArray, "getFirstElementIfArray");
function castToRecord(value2) {
  return value2;
}
__name(castToRecord, "castToRecord");
function normalizeToRecord(value2) {
  return Object.assign({}, value2);
}
__name(normalizeToRecord, "normalizeToRecord");
function assertCacheKey(value2) {
  return value2;
}
__name(assertCacheKey, "assertCacheKey");
const _CacheCapacityManager = class _CacheCapacityManager {
  constructor(strategy, store2) {
    this.strategy = strategy;
    this.store = store2;
  }
  /**
   * Enforces capacity limit by evicting entries using the configured strategy.
   *
   * @param maxEntries - The maximum number of entries allowed
   * @returns Array of cache keys that were evicted
   */
  enforceCapacity(maxEntries2) {
    if (this.store.size <= maxEntries2) {
      return [];
    }
    const entriesMap = /* @__PURE__ */ new Map();
    for (const [key, entry] of this.store.entries()) {
      entriesMap.set(key, entry);
    }
    const keysToEvict = this.strategy.selectForEviction(entriesMap, maxEntries2);
    for (const key of keysToEvict) {
      this.store.delete(key);
    }
    return keysToEvict;
  }
};
__name(_CacheCapacityManager, "CacheCapacityManager");
let CacheCapacityManager = _CacheCapacityManager;
const _LRUEvictionStrategy = class _LRUEvictionStrategy {
  /**
   * Selects entries for eviction using LRU algorithm.
   *
   * Sorts entries by lastAccessedAt (ascending) and selects the oldest entries
   * until the cache size is within maxEntries limit.
   *
   * @param entries - The current cache entries
   * @param maxEntries - The maximum number of entries allowed
   * @returns Array of cache keys to evict (oldest first)
   */
  selectForEviction(entries2, maxEntries2) {
    const toRemove = entries2.size - maxEntries2;
    if (toRemove <= 0) {
      return [];
    }
    const sorted = Array.from(entries2.entries()).sort(
      (a, b) => a[1].metadata.lastAccessedAt - b[1].metadata.lastAccessedAt
    );
    return sorted.slice(0, toRemove).map(([key]) => key);
  }
};
__name(_LRUEvictionStrategy, "LRUEvictionStrategy");
let LRUEvictionStrategy = _LRUEvictionStrategy;
const _CacheMetricsCollector = class _CacheMetricsCollector {
  constructor(metricsCollector) {
    this.metricsCollector = metricsCollector;
  }
  /**
   * Records a cache hit.
   *
   * @param _key - The cache key that was hit
   */
  onCacheHit(_key) {
    this.metricsCollector?.recordCacheAccess(true);
  }
  /**
   * Records a cache miss.
   *
   * @param _key - The cache key that was missed
   */
  onCacheMiss(_key) {
    this.metricsCollector?.recordCacheAccess(false);
  }
  /**
   * Records a cache eviction.
   *
   * @param _key - The cache key that was evicted
   */
  onCacheEviction(_key) {
  }
};
__name(_CacheMetricsCollector, "CacheMetricsCollector");
let CacheMetricsCollector = _CacheMetricsCollector;
const _CacheStore = class _CacheStore {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
  }
  get(key) {
    return this.store.get(key);
  }
  set(key, entry) {
    this.store.set(key, entry);
  }
  delete(key) {
    return this.store.delete(key);
  }
  has(key) {
    return this.store.has(key);
  }
  clear() {
    const size2 = this.store.size;
    this.store.clear();
    return size2;
  }
  get size() {
    return this.store.size;
  }
  entries() {
    return this.store.entries();
  }
};
__name(_CacheStore, "CacheStore");
let CacheStore = _CacheStore;
function clampTtl$1(ttl, fallback2) {
  if (typeof ttl !== "number" || Number.isNaN(ttl)) {
    return fallback2;
  }
  return ttl < 0 ? 0 : ttl;
}
__name(clampTtl$1, "clampTtl$1");
function defaultClock() {
  return Date.now();
}
__name(defaultClock, "defaultClock");
const _CacheExpirationManager = class _CacheExpirationManager {
  constructor(clock) {
    this.clock = clock ?? defaultClock;
  }
  isExpired(entry, now) {
    return typeof entry.expiresAt === "number" && entry.expiresAt > 0 && entry.expiresAt <= now;
  }
  createMetadata(key, options, now, defaultTtlMs) {
    const ttlMs = clampTtl$1(options?.ttlMs, defaultTtlMs);
    const expiresAt = ttlMs > 0 ? now + ttlMs : null;
    const tags = options?.tags ? Array.from(new Set(options.tags.map((tag) => String(tag)))) : [];
    return {
      key,
      createdAt: now,
      expiresAt,
      lastAccessedAt: now,
      hits: 0,
      tags
    };
  }
  handleExpiration(key, store2) {
    return store2.delete(key);
  }
};
__name(_CacheExpirationManager, "CacheExpirationManager");
let CacheExpirationManager = _CacheExpirationManager;
const _CacheStatisticsCollector = class _CacheStatisticsCollector {
  constructor(metricsObserver) {
    this.metricsObserver = metricsObserver;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }
  recordHit(key) {
    this.metricsObserver.onCacheHit(key);
    this.stats.hits++;
  }
  recordMiss(key) {
    this.metricsObserver.onCacheMiss(key);
    this.stats.misses++;
  }
  recordEviction(key) {
    this.metricsObserver.onCacheEviction(key);
    this.stats.evictions++;
  }
  getStatistics(size2, enabled) {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: size2,
      enabled
    };
  }
  reset() {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }
};
__name(_CacheStatisticsCollector, "CacheStatisticsCollector");
let CacheStatisticsCollector = _CacheStatisticsCollector;
const DEFAULT_CACHE_SERVICE_CONFIG$1 = {
  enabled: true,
  defaultTtlMs: APP_DEFAULTS.CACHE_TTL_MS,
  namespace: "global"
};
function clampTtl(ttl, fallback2) {
  if (typeof ttl !== "number" || Number.isNaN(ttl)) {
    return fallback2;
  }
  return ttl < 0 ? 0 : ttl;
}
__name(clampTtl, "clampTtl");
const _CacheConfigManager = class _CacheConfigManager {
  constructor(config2 = DEFAULT_CACHE_SERVICE_CONFIG$1) {
    const resolvedMaxEntries = typeof config2?.maxEntries === "number" && config2.maxEntries > 0 ? config2.maxEntries : void 0;
    this.config = {
      ...DEFAULT_CACHE_SERVICE_CONFIG$1,
      ...config2,
      defaultTtlMs: clampTtl(config2?.defaultTtlMs, DEFAULT_CACHE_SERVICE_CONFIG$1.defaultTtlMs),
      ...resolvedMaxEntries !== void 0 ? { maxEntries: resolvedMaxEntries } : {}
    };
  }
  updateConfig(partial2) {
    const merged = {
      ...this.config,
      ...partial2
    };
    merged.defaultTtlMs = clampTtl(merged.defaultTtlMs, DEFAULT_CACHE_SERVICE_CONFIG$1.defaultTtlMs);
    this.config = merged;
  }
  getConfig() {
    return { ...this.config };
  }
  isEnabled() {
    return this.config.enabled;
  }
};
__name(_CacheConfigManager, "CacheConfigManager");
let CacheConfigManager = _CacheConfigManager;
const DEFAULT_CACHE_SERVICE_CONFIG = {
  enabled: true,
  defaultTtlMs: APP_DEFAULTS.CACHE_TTL_MS,
  namespace: "global"
};
const _CacheService = class _CacheService {
  constructor(config2 = DEFAULT_CACHE_SERVICE_CONFIG, metricsCollector, clock = () => Date.now(), capacityManager, metricsObserver, store2, expirationManager, statisticsCollector, configManager) {
    this.metricsCollector = metricsCollector;
    this.clock = clock;
    this.store = store2 ?? new CacheStore();
    this.configManager = configManager ?? new CacheConfigManager(config2);
    const resolvedMetricsObserver = metricsObserver ?? new CacheMetricsCollector(metricsCollector);
    this.statisticsCollector = statisticsCollector ?? new CacheStatisticsCollector(resolvedMetricsObserver);
    this.expirationManager = expirationManager ?? new CacheExpirationManager(clock);
    this.capacityManager = capacityManager ?? new CacheCapacityManager(new LRUEvictionStrategy(), this.store);
  }
  get isEnabled() {
    return this.configManager.isEnabled();
  }
  get size() {
    return this.store.size;
  }
  get(key) {
    return this.accessEntry(key, true);
  }
  async getOrSet(key, factory, options) {
    const existing = this.get(key);
    if (existing) {
      return ok(existing);
    }
    let factoryValue;
    try {
      const factoryResult = factory();
      if (factoryResult instanceof Promise) {
        const asyncResult = await fromPromise(
          factoryResult,
          (error) => `Factory failed for cache key ${String(key)}: ${String(error)}`
        );
        if (!asyncResult.ok) {
          return asyncResult;
        }
        factoryValue = asyncResult.value;
      } else {
        factoryValue = factoryResult;
      }
    } catch (error) {
      return err(`Factory failed for cache key ${String(key)}: ${String(error)}`);
    }
    const metadata2 = this.set(key, factoryValue, options);
    return ok({
      hit: false,
      value: factoryValue,
      metadata: metadata2
    });
  }
  set(key, value2, options) {
    const now = this.clock();
    const config2 = this.configManager.getConfig();
    const metadata2 = this.expirationManager.createMetadata(key, options, now, config2.defaultTtlMs);
    if (!this.isEnabled) {
      return metadata2;
    }
    const entry = {
      value: value2,
      expiresAt: metadata2.expiresAt,
      metadata: metadata2
    };
    this.store.set(key, entry);
    this.enforceCapacity();
    return { ...metadata2, tags: [...metadata2.tags] };
  }
  delete(key) {
    if (!this.isEnabled) return false;
    const removed = this.store.delete(key);
    if (removed) {
      this.statisticsCollector.recordEviction(key);
    }
    return removed;
  }
  has(key) {
    return Boolean(this.accessEntry(key, false));
  }
  clear() {
    if (!this.isEnabled) return 0;
    return this.clearStore();
  }
  invalidateWhere(predicate) {
    if (!this.isEnabled) return 0;
    let removed = 0;
    const keysToEvict = [];
    for (const [key, entry] of this.store.entries()) {
      if (predicate(entry.metadata)) {
        keysToEvict.push(key);
      }
    }
    for (const key of keysToEvict) {
      if (this.store.delete(key)) {
        removed++;
        this.statisticsCollector.recordEviction(key);
      }
    }
    return removed;
  }
  getMetadata(key) {
    if (!this.isEnabled) return null;
    const entry = this.store.get(key);
    if (!entry) return null;
    const now = this.clock();
    if (this.expirationManager.isExpired(entry, now)) {
      const wasRemoved = this.expirationManager.handleExpiration(key, this.store);
      if (wasRemoved) {
        this.statisticsCollector.recordEviction(key);
      }
      return null;
    }
    return this.cloneMetadata(entry.metadata);
  }
  getStatistics() {
    return this.statisticsCollector.getStatistics(this.store.size, this.isEnabled);
  }
  accessEntry(key, mutateUsage) {
    if (!this.isEnabled) {
      return null;
    }
    const entry = this.store.get(key);
    if (!entry) {
      this.statisticsCollector.recordMiss(key);
      return null;
    }
    const now = this.clock();
    if (this.expirationManager.isExpired(entry, now)) {
      this.expirationManager.handleExpiration(key, this.store);
      this.statisticsCollector.recordEviction(key);
      this.statisticsCollector.recordMiss(key);
      return null;
    }
    if (mutateUsage) {
      entry.metadata.hits += 1;
      entry.metadata.lastAccessedAt = now;
    }
    this.statisticsCollector.recordHit(key);
    return {
      hit: true,
      value: castCacheValue(entry.value),
      metadata: this.cloneMetadata(entry.metadata)
    };
  }
  enforceCapacity() {
    const config2 = this.configManager.getConfig();
    if (!config2.maxEntries || this.store.size <= config2.maxEntries) {
      return;
    }
    const evictedKeys = this.capacityManager.enforceCapacity(config2.maxEntries);
    for (const key of evictedKeys) {
      this.statisticsCollector.recordEviction(key);
    }
  }
  cloneMetadata(metadata2) {
    return {
      ...metadata2,
      tags: [...metadata2.tags]
    };
  }
  /**
   * Updates the cache service configuration at runtime.
   * Used by CacheConfigSync to synchronize RuntimeConfig changes.
   *
   * @param partial - Partial configuration to merge with existing config
   */
  updateConfig(partial2) {
    this.configManager.updateConfig(partial2);
    if (!this.isEnabled) {
      this.clearStore();
      return;
    }
    const config2 = this.configManager.getConfig();
    if (typeof config2.maxEntries === "number") {
      this.enforceCapacity();
    }
  }
  clearStore() {
    const keysToEvict = [];
    for (const [key] of this.store.entries()) {
      keysToEvict.push(key);
    }
    const removed = this.store.clear();
    if (removed > 0) {
      for (const key of keysToEvict) {
        this.statisticsCollector.recordEviction(key);
      }
    }
    return removed;
  }
};
__name(_CacheService, "CacheService");
let CacheService = _CacheService;
const _DICacheService = class _DICacheService extends CacheService {
  constructor(config2, metrics) {
    super(config2, metrics);
  }
};
__name(_DICacheService, "DICacheService");
_DICacheService.dependencies = [cacheServiceConfigToken, metricsCollectorToken];
let DICacheService = _DICacheService;
const _CacheConfigSync = class _CacheConfigSync {
  constructor(runtimeConfig, cache) {
    this.runtimeConfig = runtimeConfig;
    this.cache = cache;
    this.unsubscribe = null;
  }
  /**
   * Binds RuntimeConfig changes to CacheService.
   * Returns unsubscribe function for cleanup.
   *
   * @returns Unsubscribe function to clean up all subscriptions
   */
  bind() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    const unsubscribers = [];
    unsubscribers.push(
      this.runtimeConfig.onChange("enableCacheService", (enabled) => {
        this.cache.updateConfig({ enabled });
      })
    );
    unsubscribers.push(
      this.runtimeConfig.onChange("cacheDefaultTtlMs", (ttl) => {
        this.cache.updateConfig({ defaultTtlMs: ttl });
      })
    );
    unsubscribers.push(
      this.runtimeConfig.onChange("cacheMaxEntries", (maxEntries2) => {
        this.cache.updateConfig({
          maxEntries: typeof maxEntries2 === "number" && maxEntries2 > 0 ? maxEntries2 : void 0
        });
      })
    );
    this.unsubscribe = () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
      this.unsubscribe = null;
    };
    return this.unsubscribe;
  }
  /**
   * Unbinds RuntimeConfig synchronization.
   */
  unbind() {
    this.unsubscribe?.();
  }
};
__name(_CacheConfigSync, "CacheConfigSync");
let CacheConfigSync = _CacheConfigSync;
const _DICacheConfigSync = class _DICacheConfigSync extends CacheConfigSync {
  constructor(runtimeConfig, cache) {
    super(runtimeConfig, cache);
  }
};
__name(_DICacheConfigSync, "DICacheConfigSync");
_DICacheConfigSync.dependencies = [runtimeConfigToken, cacheServiceToken];
let DICacheConfigSync = _DICacheConfigSync;
const _CachePortAdapter = class _CachePortAdapter {
  constructor(cacheService) {
    this.cacheService = cacheService;
  }
  /**
   * Maps Domain cache key (plain string) to Infrastructure cache key (branded type).
   */
  mapDomainKeyToInfrastructure(key) {
    return assertCacheKey(key);
  }
  /**
   * Maps Infrastructure cache key (branded type) to Domain cache key (plain string).
   */
  mapInfrastructureKeyToDomain(key) {
    return key;
  }
  /**
   * Maps Domain cache options to Infrastructure cache options.
   */
  mapDomainOptionsToInfrastructure(options) {
    if (!options) return void 0;
    const result = {};
    if (options.ttlMs !== void 0) {
      result.ttlMs = options.ttlMs;
    }
    if (options.tags !== void 0) {
      result.tags = options.tags;
    }
    return Object.keys(result).length > 0 ? result : void 0;
  }
  /**
   * Maps Infrastructure cache metadata to Domain cache metadata.
   */
  mapInfrastructureMetadataToDomain(metadata2) {
    return {
      key: this.mapInfrastructureKeyToDomain(metadata2.key),
      createdAt: metadata2.createdAt,
      expiresAt: metadata2.expiresAt,
      lastAccessedAt: metadata2.lastAccessedAt,
      hits: metadata2.hits,
      tags: metadata2.tags
    };
  }
  /**
   * Maps Infrastructure cache lookup result to Domain cache lookup result.
   */
  mapInfrastructureLookupResultToDomain(result) {
    const domainResult = {
      hit: result.hit,
      metadata: this.mapInfrastructureMetadataToDomain(result.metadata)
    };
    if (result.value !== void 0) {
      domainResult.value = result.value;
    }
    return domainResult;
  }
  /**
   * Maps Infrastructure cache statistics to Domain cache statistics.
   */
  mapInfrastructureStatisticsToDomain(statistics) {
    return {
      hits: statistics.hits,
      misses: statistics.misses,
      evictions: statistics.evictions,
      size: statistics.size,
      enabled: statistics.enabled
    };
  }
  /**
   * Maps Domain invalidation predicate to Infrastructure invalidation predicate.
   */
  mapDomainPredicateToInfrastructure(predicate) {
    return (entry) => {
      const domainEntry = this.mapInfrastructureMetadataToDomain(entry);
      return predicate(domainEntry);
    };
  }
  get isEnabled() {
    return this.cacheService.isEnabled;
  }
  get size() {
    return this.cacheService.size;
  }
  get(key) {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    const result = this.cacheService.get(infraKey);
    if (!result) return null;
    return this.mapInfrastructureLookupResultToDomain(result);
  }
  set(key, value2, options) {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    const infraOptions = this.mapDomainOptionsToInfrastructure(options);
    const metadata2 = this.cacheService.set(infraKey, value2, infraOptions);
    return this.mapInfrastructureMetadataToDomain(metadata2);
  }
  delete(key) {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    return this.cacheService.delete(infraKey);
  }
  has(key) {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    return this.cacheService.has(infraKey);
  }
  clear() {
    return this.cacheService.clear();
  }
  invalidateWhere(predicate) {
    const infraPredicate = this.mapDomainPredicateToInfrastructure(predicate);
    return this.cacheService.invalidateWhere(infraPredicate);
  }
  getMetadata(key) {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    const metadata2 = this.cacheService.getMetadata(infraKey);
    if (!metadata2) return null;
    return this.mapInfrastructureMetadataToDomain(metadata2);
  }
  getStatistics() {
    const statistics = this.cacheService.getStatistics();
    return this.mapInfrastructureStatisticsToDomain(statistics);
  }
  async getOrSet(key, factory, options) {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    const infraOptions = this.mapDomainOptionsToInfrastructure(options);
    const result = await this.cacheService.getOrSet(infraKey, factory, infraOptions);
    if (!result.ok) {
      return result;
    }
    return {
      ok: true,
      value: this.mapInfrastructureLookupResultToDomain(result.value)
    };
  }
};
__name(_CachePortAdapter, "CachePortAdapter");
let CachePortAdapter = _CachePortAdapter;
const _DICachePortAdapter = class _DICachePortAdapter extends CachePortAdapter {
  constructor(cacheService) {
    super(cacheService);
  }
};
__name(_DICachePortAdapter, "DICachePortAdapter");
_DICachePortAdapter.dependencies = [cacheServiceToken];
let DICachePortAdapter = _DICachePortAdapter;
function registerCacheServices(container) {
  const runtimeConfig = container.getRegisteredValue(runtimeConfigToken);
  if (!runtimeConfig) {
    return err("PlatformRuntimeConfigPort not registered");
  }
  const maxEntries2 = runtimeConfig.get("cacheMaxEntries");
  const config2 = {
    enabled: runtimeConfig.get("enableCacheService"),
    defaultTtlMs: runtimeConfig.get("cacheDefaultTtlMs"),
    namespace: MODULE_METADATA.ID,
    ...typeof maxEntries2 === "number" && maxEntries2 > 0 ? { maxEntries: maxEntries2 } : {}
  };
  const configResult = container.registerValue(cacheServiceConfigToken, config2);
  if (isErr(configResult)) {
    return err(`Failed to register CacheServiceConfig: ${configResult.error.message}`);
  }
  const serviceResult = container.registerClass(
    cacheServiceToken,
    DICacheService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(serviceResult)) {
    return err(`Failed to register CacheService: ${serviceResult.error.message}`);
  }
  const cachePortResult = container.registerClass(
    platformCachePortToken,
    DICachePortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(cachePortResult)) {
    return err(`Failed to register PlatformCachePort: ${cachePortResult.error.message}`);
  }
  const configSyncResult = container.registerClass(
    cacheConfigSyncToken,
    DICacheConfigSync,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(configSyncResult)) {
    return err(`Failed to register CacheConfigSync: ${configSyncResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerCacheServices, "registerCacheServices");
function initializeCacheConfigSync(container) {
  const configSyncResult = container.resolveWithError(cacheConfigSyncToken);
  if (!configSyncResult.ok) {
    return ok(void 0);
  }
  const configSync = configSyncResult.value;
  configSync.bind();
  return ok(void 0);
}
__name(initializeCacheConfigSync, "initializeCacheConfigSync");
const foundryI18nToken = createInjectionToken("FoundryI18nPort");
const localI18nToken = createInjectionToken("LocalI18nService");
const foundryTranslationHandlerToken = createInjectionToken(
  "FoundryTranslationHandler"
);
const localTranslationHandlerToken = createInjectionToken("LocalTranslationHandler");
const fallbackTranslationHandlerToken = createInjectionToken(
  "FallbackTranslationHandler"
);
const translationHandlerChainToken = createInjectionToken("TranslationHandlerChain");
const translationHandlersToken = createInjectionToken("TranslationHandlers");
const _FoundryI18nPort = class _FoundryI18nPort extends FoundryServiceBase {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
  localize(key) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.localize(key);
    }, "FoundryI18n.localize");
  }
  format(key, data) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.format(key, data);
    }, "FoundryI18n.format");
  }
  has(key) {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.has(key);
    }, "FoundryI18n.has");
  }
};
__name(_FoundryI18nPort, "FoundryI18nPort");
let FoundryI18nPort = _FoundryI18nPort;
const _DIFoundryI18nPort = class _DIFoundryI18nPort extends FoundryI18nPort {
  constructor(portSelector, portRegistry, retryService) {
    super(portSelector, portRegistry, retryService);
  }
};
__name(_DIFoundryI18nPort, "DIFoundryI18nPort");
_DIFoundryI18nPort.dependencies = [
  portSelectorToken,
  foundryI18nPortRegistryToken,
  retryServiceToken
];
let DIFoundryI18nPort = _DIFoundryI18nPort;
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
__name(escapeRegex, "escapeRegex");
const _LocalI18nService = class _LocalI18nService {
  constructor() {
    this.translations = /* @__PURE__ */ new Map();
    this.currentLocale = "en";
    this.detectLocale();
  }
  /**
   * Detects browser locale and sets current language.
   * Falls back to 'en' if detection fails.
   */
  detectLocale() {
    if (typeof navigator !== "undefined" && navigator.language) {
      const lang = navigator.language.split("-")[0];
      this.currentLocale = lang ?? "en";
    }
  }
  /**
   * Loads translations from a JSON object.
   * Useful for testing or pre-loaded translation data.
   *
   * @param translations - Object with key-value pairs
   *
   * @example
   * ```typescript
   * const i18n = new LocalI18nService();
   * i18n.loadTranslations({
   *   "MODULE.SETTINGS.logLevel.name": "Log Level",
   *   "MODULE.WELCOME": "Welcome, {name}!"
   * });
   * ```
   */
  loadTranslations(translations) {
    for (const [key, value2] of Object.entries(translations)) {
      this.translations.set(key, value2);
    }
  }
  /**
   * Translates a key using local translations.
   *
   * @param key - Translation key
   * @returns Result with translated string (or key itself if not found)
   *
   * @example
   * ```typescript
   * const result = i18n.translate("MODULE.SETTINGS.logLevel.name");
   * if (result.ok) {
   *   console.log(result.value); // "Enable Feature" or key if not found
   * }
   * ```
   */
  translate(key) {
    const value2 = this.translations.get(key);
    return ok(value2 ?? key);
  }
  /**
   * Formats a string with placeholders.
   * Simple implementation: replaces `{key}` with values from data object.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @returns Result with formatted string
   *
   * @example
   * ```typescript
   * // Translation: "Welcome, {name}!"
   * const result = i18n.format("MODULE.WELCOME", { name: "Alice" });
   * if (result.ok) {
   *   console.log(result.value); // "Welcome, Alice!"
   * }
   * ```
   */
  format(key, data) {
    const template = this.translations.get(key) ?? key;
    let formatted = template;
    for (const [placeholder, value2] of Object.entries(data)) {
      const escapedPlaceholder = escapeRegex(placeholder);
      const regex2 = new RegExp(`\\{${escapedPlaceholder}\\}`, "g");
      formatted = formatted.replace(regex2, String(value2));
    }
    return ok(formatted);
  }
  /**
   * Checks if a translation key exists.
   *
   * @param key - Translation key to check
   * @returns Result with boolean
   */
  has(key) {
    return ok(this.translations.has(key));
  }
  /**
   * Gets the current locale.
   *
   * @returns Current locale string (e.g., "en", "de")
   */
  getCurrentLocale() {
    return this.currentLocale;
  }
  /**
   * Sets the current locale.
   * Note: Changing locale requires reloading translations for the new language.
   *
   * @param locale - Locale code (e.g., "en", "de", "fr")
   */
  setLocale(locale) {
    this.currentLocale = locale;
  }
};
__name(_LocalI18nService, "LocalI18nService");
_LocalI18nService.dependencies = [];
let LocalI18nService = _LocalI18nService;
const _DILocalI18nService = class _DILocalI18nService extends LocalI18nService {
  constructor() {
    super();
  }
};
__name(_DILocalI18nService, "DILocalI18nService");
_DILocalI18nService.dependencies = [];
let DILocalI18nService = _DILocalI18nService;
const _I18nFacadeService = class _I18nFacadeService {
  constructor(handlerChain, localI18n) {
    this.handlerChain = handlerChain;
    this.localI18n = localI18n;
  }
  /**
   * Translates a key using the handler chain: Foundry → Local → Fallback.
   *
   * @param key - Translation key
   * @param fallback - Optional fallback string (defaults to key itself)
   * @returns Result with translated string or fallback
   *
   * @example
   * ```typescript
   * // With fallback
   * const result = i18n.translate("MODULE.UNKNOWN_KEY", "Default Text");
   * if (result.ok) {
   *   console.log(result.value); // "Default Text"
   * }
   *
   * // Without fallback (returns key as fallback)
   * const result2 = i18n.translate("MODULE.UNKNOWN_KEY");
   * if (result2.ok) {
   *   console.log(result2.value); // "MODULE.UNKNOWN_KEY"
   * }
   * ```
   */
  translate(key, fallback2) {
    return this.handlerChain.handle(key, void 0, fallback2);
  }
  /**
   * Formats a string with placeholders using the handler chain.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @param fallback - Optional fallback string
   * @returns Result with formatted string or fallback
   *
   * @example
   * ```typescript
   * const result = i18n.format("MODULE.WELCOME", { name: "Alice" }, "Welcome!");
   * if (result.ok) {
   *   console.log(result.value); // "Welcome, Alice!" or "Welcome!"
   * }
   * ```
   */
  format(key, data, fallback2) {
    return this.handlerChain.handle(key, data, fallback2);
  }
  /**
   * Checks if a translation key exists in the handler chain.
   * Checks Foundry → Local (Fallback always returns false for has()).
   *
   * @param key - Translation key to check
   * @returns Result with true if key exists in Foundry or local i18n
   */
  has(key) {
    return this.handlerChain.has(key);
  }
  /**
   * Loads local translations from a JSON object.
   * Useful for initializing translations on module startup.
   *
   * @param translations - Object with key-value pairs
   *
   * @example
   * ```typescript
   * i18n.loadLocalTranslations({
   *   "MODULE.SETTINGS.logLevel.name": "Log Level",
   *   "MODULE.WELCOME": "Welcome, {name}!"
   * });
   * ```
   */
  loadLocalTranslations(translations) {
    this.localI18n.loadTranslations(translations);
  }
};
__name(_I18nFacadeService, "I18nFacadeService");
let I18nFacadeService = _I18nFacadeService;
const _DII18nFacadeService = class _DII18nFacadeService extends I18nFacadeService {
  constructor(handlerChain, localI18n) {
    super(handlerChain, localI18n);
  }
};
__name(_DII18nFacadeService, "DII18nFacadeService");
_DII18nFacadeService.dependencies = [translationHandlerChainToken, localI18nToken];
let DII18nFacadeService = _DII18nFacadeService;
const _AbstractTranslationHandler = class _AbstractTranslationHandler {
  constructor() {
    this.nextHandler = null;
  }
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }
  handle(key, data, fallback2) {
    const result = this.doHandle(key, data, fallback2);
    if (result.ok) {
      return result;
    }
    if (this.nextHandler) {
      return this.nextHandler.handle(key, data, fallback2);
    }
    if (fallback2 !== void 0) {
      return ok(fallback2);
    }
    return err(`Translation key not found: ${key}`);
  }
  has(key) {
    const ourResult = this.doHas(key);
    if (!ourResult.ok) {
      return ourResult;
    }
    if (ourResult.value) {
      return ok(true);
    }
    if (this.nextHandler) {
      return this.nextHandler.has(key);
    }
    return ok(false);
  }
};
__name(_AbstractTranslationHandler, "AbstractTranslationHandler");
let AbstractTranslationHandler = _AbstractTranslationHandler;
const _FoundryTranslationHandler = class _FoundryTranslationHandler extends AbstractTranslationHandler {
  constructor(foundryI18n) {
    super();
    this.foundryI18n = foundryI18n;
  }
  doHandle(key, data, _fallback) {
    const result = data ? this.foundryI18n.format(key, data) : this.foundryI18n.localize(key);
    if (result.ok && result.value !== key) {
      return ok(result.value);
    }
    return err(`Foundry i18n could not translate key: ${key}`);
  }
  doHas(key) {
    const result = this.foundryI18n.has(key);
    if (!result.ok) {
      return err(`Failed to check Foundry i18n for key: ${key}`);
    }
    return ok(result.value);
  }
};
__name(_FoundryTranslationHandler, "FoundryTranslationHandler");
let FoundryTranslationHandler = _FoundryTranslationHandler;
const _DIFoundryTranslationHandler = class _DIFoundryTranslationHandler extends FoundryTranslationHandler {
  constructor(foundryI18n) {
    super(foundryI18n);
  }
};
__name(_DIFoundryTranslationHandler, "DIFoundryTranslationHandler");
_DIFoundryTranslationHandler.dependencies = [foundryI18nToken];
let DIFoundryTranslationHandler = _DIFoundryTranslationHandler;
const _LocalTranslationHandler = class _LocalTranslationHandler extends AbstractTranslationHandler {
  constructor(localI18n) {
    super();
    this.localI18n = localI18n;
  }
  doHandle(key, data, _fallback) {
    const result = data ? this.localI18n.format(key, data) : this.localI18n.translate(key);
    if (result.ok && result.value !== key) {
      return ok(result.value);
    }
    return err(`Local i18n could not translate key: ${key}`);
  }
  doHas(key) {
    const result = this.localI18n.has(key);
    if (!result.ok) {
      return err(`Failed to check local i18n for key: ${key}`);
    }
    return ok(result.value);
  }
};
__name(_LocalTranslationHandler, "LocalTranslationHandler");
let LocalTranslationHandler = _LocalTranslationHandler;
const _DILocalTranslationHandler = class _DILocalTranslationHandler extends LocalTranslationHandler {
  constructor(localI18n) {
    super(localI18n);
  }
};
__name(_DILocalTranslationHandler, "DILocalTranslationHandler");
_DILocalTranslationHandler.dependencies = [localI18nToken];
let DILocalTranslationHandler = _DILocalTranslationHandler;
const _FallbackTranslationHandler = class _FallbackTranslationHandler extends AbstractTranslationHandler {
  doHandle(key, _data, fallback2) {
    return ok(fallback2 ?? key);
  }
  doHas(_key) {
    return ok(false);
  }
};
__name(_FallbackTranslationHandler, "FallbackTranslationHandler");
_FallbackTranslationHandler.dependencies = [];
let FallbackTranslationHandler = _FallbackTranslationHandler;
const _DIFallbackTranslationHandler = class _DIFallbackTranslationHandler extends FallbackTranslationHandler {
  constructor() {
    super();
  }
};
__name(_DIFallbackTranslationHandler, "DIFallbackTranslationHandler");
_DIFallbackTranslationHandler.dependencies = [];
let DIFallbackTranslationHandler = _DIFallbackTranslationHandler;
const _TranslationHandlerChain = class _TranslationHandlerChain {
  constructor(handlers) {
    assertNonEmptyHandlers(handlers);
    const [head, ...rest] = handlers;
    this.head = head;
    let current = head;
    for (const handler of rest) {
      current = current.setNext(handler);
    }
  }
  setNext(handler) {
    return this.head.setNext(handler);
  }
  handle(key, data, fallback2) {
    return this.head.handle(key, data, fallback2);
  }
  has(key) {
    return this.head.has(key);
  }
};
__name(_TranslationHandlerChain, "TranslationHandlerChain");
let TranslationHandlerChain = _TranslationHandlerChain;
const _DITranslationHandlerChain = class _DITranslationHandlerChain extends TranslationHandlerChain {
  constructor(handlers) {
    super(handlers);
  }
};
__name(_DITranslationHandlerChain, "DITranslationHandlerChain");
_DITranslationHandlerChain.dependencies = [translationHandlersToken];
let DITranslationHandlerChain = _DITranslationHandlerChain;
function assertNonEmptyHandlers(handlers) {
  if (handlers.length === 0) {
    throw new Error("TranslationHandlerChain requires at least one handler");
  }
}
__name(assertNonEmptyHandlers, "assertNonEmptyHandlers");
const _I18nPortAdapter = class _I18nPortAdapter {
  constructor(i18nFacade) {
    this.i18nFacade = i18nFacade;
  }
  translate(key, fallback2) {
    return this.i18nFacade.translate(key, fallback2);
  }
  format(key, data, fallback2) {
    return this.i18nFacade.format(key, data, fallback2);
  }
  has(key) {
    return this.i18nFacade.has(key);
  }
  loadLocalTranslations(translations) {
    this.i18nFacade.loadLocalTranslations(translations);
  }
};
__name(_I18nPortAdapter, "I18nPortAdapter");
let I18nPortAdapter = _I18nPortAdapter;
const _DII18nPortAdapter = class _DII18nPortAdapter extends I18nPortAdapter {
  constructor(i18nFacade) {
    super(i18nFacade);
  }
};
__name(_DII18nPortAdapter, "DII18nPortAdapter");
_DII18nPortAdapter.dependencies = [i18nFacadeToken];
let DII18nPortAdapter = _DII18nPortAdapter;
function resolveMultipleServices$1(container, tokens) {
  const results = [];
  for (const { token, name } of tokens) {
    const result = container.resolveWithError(token);
    if (!result.ok) {
      throw new Error(`Failed to resolve ${name}: ${result.error.message}`);
    }
    results.push(castResolvedService(result.value));
  }
  return results;
}
__name(resolveMultipleServices$1, "resolveMultipleServices$1");
function registerI18nServices(container) {
  const foundryI18nResult = container.registerClass(
    foundryI18nToken,
    DIFoundryI18nPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryI18nResult)) {
    return err(`Failed to register FoundryI18nPort: ${foundryI18nResult.error.message}`);
  }
  const localI18nResult = container.registerClass(
    localI18nToken,
    DILocalI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localI18nResult)) {
    return err(`Failed to register LocalI18nService: ${localI18nResult.error.message}`);
  }
  const foundryHandlerResult = container.registerClass(
    foundryTranslationHandlerToken,
    DIFoundryTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryHandlerResult)) {
    return err(
      `Failed to register FoundryTranslationHandler: ${foundryHandlerResult.error.message}`
    );
  }
  const localHandlerResult = container.registerClass(
    localTranslationHandlerToken,
    DILocalTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localHandlerResult)) {
    return err(`Failed to register LocalTranslationHandler: ${localHandlerResult.error.message}`);
  }
  const fallbackHandlerResult = container.registerClass(
    fallbackTranslationHandlerToken,
    DIFallbackTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(fallbackHandlerResult)) {
    return err(
      `Failed to register FallbackTranslationHandler: ${fallbackHandlerResult.error.message}`
    );
  }
  const handlersArrayResult = container.registerFactory(
    translationHandlersToken,
    () => {
      return resolveMultipleServices$1(container, [
        { token: foundryTranslationHandlerToken, name: "FoundryTranslationHandler" },
        { token: localTranslationHandlerToken, name: "LocalTranslationHandler" },
        { token: fallbackTranslationHandlerToken, name: "FallbackTranslationHandler" }
      ]);
    },
    ServiceLifecycle.SINGLETON,
    [foundryTranslationHandlerToken, localTranslationHandlerToken, fallbackTranslationHandlerToken]
  );
  if (isErr(handlersArrayResult)) {
    return err(
      `Failed to register TranslationHandlers array: ${handlersArrayResult.error.message}`
    );
  }
  const chainResult = container.registerClass(
    translationHandlerChainToken,
    DITranslationHandlerChain,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(chainResult)) {
    return err(`Failed to register TranslationHandlerChain: ${chainResult.error.message}`);
  }
  const facadeResult = container.registerClass(
    i18nFacadeToken,
    DII18nFacadeService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(facadeResult)) {
    return err(`Failed to register I18nFacadeService: ${facadeResult.error.message}`);
  }
  const i18nPortResult = container.registerClass(
    platformI18nPortToken,
    DII18nPortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(i18nPortResult)) {
    return err(`Failed to register PlatformI18nPort: ${i18nPortResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerI18nServices, "registerI18nServices");
const consoleChannelToken = createInjectionToken("ConsoleChannel");
const uiChannelToken = createInjectionToken("UIChannel");
const notificationQueueToken = createInjectionToken("NotificationQueue");
const _NotificationCenter = class _NotificationCenter {
  constructor(initialChannels) {
    this.channels = [...initialChannels];
  }
  debug(context, data, options) {
    const payload = data === void 0 ? {} : { data };
    return this.notify("debug", context, payload, options);
  }
  info(context, data, options) {
    const payload = data === void 0 ? {} : { data };
    return this.notify("info", context, payload, options);
  }
  warn(context, data, options) {
    const payload = data === void 0 ? {} : { data };
    return this.notify("warn", context, payload, options);
  }
  error(context, error, options) {
    const payload = error === void 0 ? {} : { error };
    return this.notify("error", context, payload, options);
  }
  addChannel(channel) {
    const alreadyRegistered = this.channels.some((existing) => existing.name === channel.name);
    if (!alreadyRegistered) {
      this.channels.push(channel);
    }
  }
  removeChannel(name) {
    const index = this.channels.findIndex((channel) => channel.name === name);
    if (index === -1) {
      return false;
    }
    this.channels.splice(index, 1);
    return true;
  }
  getChannelNames() {
    return this.channels.map((channel) => channel.name);
  }
  notify(level, context, payload, options) {
    const notification = {
      level,
      context,
      timestamp: /* @__PURE__ */ new Date(),
      ...payload.data !== void 0 ? { data: payload.data } : {},
      ...payload.error !== void 0 ? { error: payload.error } : {},
      ...options?.traceId !== void 0 ? { traceId: options.traceId } : {},
      ...options?.uiOptions !== void 0 ? { uiOptions: options.uiOptions } : {}
    };
    const targetChannels = this.selectChannels(options?.channels);
    let attempted = false;
    let succeeded = false;
    const failures = [];
    for (const channel of targetChannels) {
      if (!channel.canHandle(notification)) {
        continue;
      }
      attempted = true;
      const result = channel.send(notification);
      if (result.ok) {
        succeeded = true;
      } else {
        failures.push(`${channel.name}: ${result.error.message}`);
      }
    }
    if (!attempted) {
      if (options?.channels && options.channels.length > 0) {
        return err(
          `No channels attempted to handle notification (requested: ${options.channels.join(", ")})`
        );
      }
      return ok(void 0);
    }
    if (succeeded) {
      return ok(void 0);
    }
    return err(`All channels failed: ${failures.join("; ")}`);
  }
  selectChannels(channelNames) {
    if (!channelNames || channelNames.length === 0) {
      return this.channels;
    }
    return this.channels.filter((channel) => channelNames.includes(channel.name));
  }
};
__name(_NotificationCenter, "NotificationCenter");
let NotificationCenter = _NotificationCenter;
const _DINotificationCenter = class _DINotificationCenter extends NotificationCenter {
  constructor(consoleChannel, uiChannel) {
    super([consoleChannel, uiChannel]);
  }
};
__name(_DINotificationCenter, "DINotificationCenter");
_DINotificationCenter.dependencies = [consoleChannelToken, uiChannelToken];
let DINotificationCenter = _DINotificationCenter;
const _ConsoleChannel = class _ConsoleChannel {
  constructor(logger) {
    this.logger = logger;
    this.name = "ConsoleChannel";
  }
  canHandle() {
    return true;
  }
  send(notification) {
    const { level, context, data, error } = notification;
    const payload = level === "error" ? error ?? data : data ?? error;
    this.log(level, context, payload);
    return ok(void 0);
  }
  log(level, message2, data) {
    switch (level) {
      case "debug":
        this.logger.debug(message2, data);
        break;
      case "info":
        this.logger.info(message2, data);
        break;
      case "warn":
        this.logger.warn(message2, data);
        break;
      case "error":
        this.logger.error(message2, data);
        break;
    }
  }
};
__name(_ConsoleChannel, "ConsoleChannel");
let ConsoleChannel = _ConsoleChannel;
const _DIConsoleChannel = class _DIConsoleChannel extends ConsoleChannel {
  constructor(logger) {
    super(logger);
  }
};
__name(_DIConsoleChannel, "DIConsoleChannel");
_DIConsoleChannel.dependencies = [platformLoggingPortToken];
let DIConsoleChannel = _DIConsoleChannel;
const _UIChannel = class _UIChannel {
  constructor(platformUI, config2) {
    this.platformUI = platformUI;
    this.config = config2;
    this.name = "UIChannel";
  }
  canHandle(notification) {
    return notification.level !== "debug";
  }
  send(notification) {
    const sanitizedMessage = this.sanitizeForUI(notification);
    const uiTypeResult = this.mapLevelToUIType(notification.level);
    if (!uiTypeResult.ok) {
      return err({
        code: "MAPPING_FAILED",
        message: uiTypeResult.error,
        channelName: this.name
      });
    }
    const result = this.platformUI.notify(sanitizedMessage, uiTypeResult.value);
    if (!result.ok) {
      return err({
        code: "UI_NOTIFICATION_FAILED",
        message: result.error.message,
        channelName: this.name,
        details: result.error
      });
    }
    return ok(void 0);
  }
  notify(message2, type) {
    const result = this.platformUI.notify(message2, type);
    if (!result.ok) {
      return err({
        code: "UI_NOTIFICATION_FAILED",
        message: result.error.message,
        channelName: this.name,
        details: result.error
      });
    }
    return ok(void 0);
  }
  /**
   * Sanitizes notification message for UI display.
   *
   * Development: Shows detailed messages
   * Production: Shows generic messages to prevent information leakage
   */
  sanitizeForUI(notification) {
    const { level, context, data, error } = notification;
    if (this.config.get("isDevelopment")) {
      if (level === "error" && error) {
        return `${context}: ${error.message}`;
      }
      if (data && typeof data === "object" && "message" in data) {
        return `${context}: ${String(data.message)}`;
      }
      return context;
    }
    if (level === "error" && error) {
      return `${context}. Please try again or contact support. (Error: ${error.code})`;
    }
    return context;
  }
  /**
   * Maps notification level to UI notification type.
   * Protected to allow testing of exhaustive type check.
   */
  mapLevelToUIType(level) {
    switch (level) {
      case "info":
        return ok("info");
      case "warn":
        return ok("warning");
      case "error":
        return ok("error");
      case "debug": {
        return err(`Debug level should be filtered by canHandle(). Received: ${level}`);
      }
    }
  }
};
__name(_UIChannel, "UIChannel");
let UIChannel = _UIChannel;
const _DIUIChannel = class _DIUIChannel extends UIChannel {
  constructor(platformUI, config2) {
    super(platformUI, config2);
  }
};
__name(_DIUIChannel, "DIUIChannel");
_DIUIChannel.dependencies = [platformUINotificationPortToken, runtimeConfigToken];
let DIUIChannel = _DIUIChannel;
const _QueuedUIChannel = class _QueuedUIChannel {
  constructor(queue, uiAvailability, container) {
    this.queue = queue;
    this.uiAvailability = uiAvailability;
    this.container = container;
    this.name = "UIChannel";
    this.realChannel = null;
    this.hasFlushed = false;
  }
  /**
   * Gets or creates the real UIChannel.
   * Uses lazy initialization to avoid creating channel before UI is available.
   */
  getRealChannel() {
    if (this.realChannel) {
      return this.realChannel;
    }
    const channelResult = this.container.resolveWithError(uiChannelToken);
    if (!channelResult.ok) {
      return null;
    }
    this.realChannel = channelResult.value;
    return this.realChannel;
  }
  /**
   * Determines if this channel should handle the notification.
   * Delegates to real channel if available, otherwise uses same logic as UIChannel.
   */
  canHandle(notification) {
    if (notification.level === "debug") {
      return false;
    }
    const realChannel = this.getRealChannel();
    if (realChannel) {
      return realChannel.canHandle(notification);
    }
    return true;
  }
  /**
   * Sends notification to UI or queues it if UI is not available.
   */
  send(notification) {
    if (this.uiAvailability.isAvailable()) {
      if (!this.hasFlushed && this.queue.size > 0) {
        const realChannel2 = this.getRealChannel();
        if (realChannel2) {
          this.queue.flush((n) => {
            realChannel2.send(n);
          });
        }
        this.hasFlushed = true;
      }
      const realChannel = this.getRealChannel();
      if (!realChannel) {
        this.queue.enqueue(notification);
        return ok(void 0);
      }
      return realChannel.send(notification);
    }
    if (notification.level === "debug") {
      return ok(void 0);
    }
    this.queue.enqueue(notification);
    return ok(void 0);
  }
  /**
   * Sends notification directly to UI (bypasses queue).
   * Used for immediate notifications when UI is available.
   */
  notify(message2, type) {
    if (this.uiAvailability.isAvailable()) {
      const realChannel = this.getRealChannel();
      if (!realChannel) {
        return err({
          code: "CHANNEL_NOT_AVAILABLE",
          message: "UIChannel could not be resolved",
          channelName: this.name
        });
      }
      return realChannel.notify(message2, type);
    }
    return err({
      code: "UI_NOT_AVAILABLE",
      message: "UI is not available for immediate notifications",
      channelName: this.name
    });
  }
};
__name(_QueuedUIChannel, "QueuedUIChannel");
let QueuedUIChannel = _QueuedUIChannel;
const _DIQueuedUIChannel = class _DIQueuedUIChannel extends QueuedUIChannel {
  constructor(queue, uiAvailability, container) {
    super(queue, uiAvailability, container);
  }
};
__name(_DIQueuedUIChannel, "DIQueuedUIChannel");
_DIQueuedUIChannel.dependencies = [
  notificationQueueToken,
  platformUIAvailabilityPortToken,
  platformContainerPortToken
];
let DIQueuedUIChannel = _DIQueuedUIChannel;
const _NotificationPortAdapter = class _NotificationPortAdapter {
  constructor(notificationCenter) {
    this.notificationCenter = notificationCenter;
  }
  debug(context, data, options) {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.debug(context, data, centerOptions);
    return this.mapResult(result);
  }
  info(context, data, options) {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.info(context, data, centerOptions);
    return this.mapResult(result);
  }
  warn(context, data, options) {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.warn(context, data, centerOptions);
    return this.mapResult(result);
  }
  error(context, error, options) {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.error(context, error, centerOptions);
    return this.mapResult(result);
  }
  addChannel(_channelName) {
    return err({
      code: "OPERATION_NOT_SUPPORTED",
      message: "Dynamic channel addition via name not supported. Use NotificationCenter.addChannel() directly.",
      operation: "addChannel"
    });
  }
  removeChannel(channelName) {
    const removed = this.notificationCenter.removeChannel(channelName);
    return ok(removed);
  }
  getChannelNames() {
    const names = this.notificationCenter.getChannelNames();
    return ok(names);
  }
  // ===== Private Helpers =====
  /**
   * Maps platform-agnostic options to NotificationCenter options.
   * Handles Foundry-specific options via type guard if present.
   */
  mapToCenterOptions(options) {
    if (!options) return void 0;
    const centerOptions = {
      ...options.channels !== void 0 && { channels: options.channels },
      ...options.traceId !== void 0 && { traceId: options.traceId }
    };
    if (this.isFoundryNotificationOptions(options)) {
      const foundryOptions = {
        ...options.permanent !== void 0 && { permanent: options.permanent },
        ...options.console !== void 0 && { console: options.console },
        ...options.localize !== void 0 && { localize: options.localize },
        ...options.progress !== void 0 && { progress: options.progress },
        ...options.clean !== void 0 && { clean: options.clean },
        ...options.escape !== void 0 && { escape: options.escape },
        ...options.format !== void 0 && { format: options.format }
      };
      centerOptions.uiOptions = foundryOptions;
    }
    return centerOptions;
  }
  /**
   * Type guard to detect Foundry-specific notification options.
   * This allows adapters to pass Foundry options without exposing them in the domain interface.
   */
  isFoundryNotificationOptions(options) {
    return typeof options === "object" && options !== null && ("permanent" in options || "console" in options || "localize" in options || "progress" in options || "clean" in options || "escape" in options || "format" in options);
  }
  /**
   * Maps NotificationCenter Result to PlatformNotificationPort Result.
   */
  mapResult(result) {
    if (result.ok) {
      return ok(void 0);
    }
    return err({
      code: "NOTIFICATION_FAILED",
      message: result.error,
      operation: "notify"
    });
  }
};
__name(_NotificationPortAdapter, "NotificationPortAdapter");
let NotificationPortAdapter = _NotificationPortAdapter;
const _DINotificationPortAdapter = class _DINotificationPortAdapter extends NotificationPortAdapter {
  constructor(notificationCenter) {
    super(notificationCenter);
  }
};
__name(_DINotificationPortAdapter, "DINotificationPortAdapter");
_DINotificationPortAdapter.dependencies = [notificationCenterToken];
let DINotificationPortAdapter = _DINotificationPortAdapter;
const _NotificationQueue = class _NotificationQueue {
  constructor(runtimeConfig, env) {
    this.runtimeConfig = runtimeConfig;
    this.env = env;
    this.queue = [];
  }
  /**
   * Gets the maximum queue size from RuntimeConfig, with ENV fallback.
   */
  getMaxSize() {
    const value2 = this.runtimeConfig.get("notificationQueueMaxSize");
    return value2 ?? this.env.notificationQueueDefaultSize;
  }
  /**
   * Adds a notification to the queue.
   * If the queue is full, removes the oldest notification.
   */
  enqueue(notification) {
    const maxSize2 = this.getMaxSize();
    if (this.queue.length >= maxSize2) {
      this.queue.shift();
    }
    this.queue.push(notification);
  }
  /**
   * Flushes all queued notifications by calling the handler for each.
   * Queue is cleared after flushing.
   */
  flush(handler) {
    for (const notification of this.queue) {
      try {
        handler(notification);
      } catch (_error) {
      }
    }
    this.queue.length = 0;
  }
  /**
   * Clears all queued notifications without processing them.
   */
  clear() {
    this.queue.length = 0;
  }
  /**
   * Gets the current number of queued notifications.
   */
  get size() {
    return this.queue.length;
  }
};
__name(_NotificationQueue, "NotificationQueue");
let NotificationQueue = _NotificationQueue;
const _DINotificationQueue = class _DINotificationQueue extends NotificationQueue {
  constructor(runtimeConfig, env) {
    super(runtimeConfig, env);
  }
};
__name(_DINotificationQueue, "DINotificationQueue");
_DINotificationQueue.dependencies = [runtimeConfigToken, environmentConfigToken];
let DINotificationQueue = _DINotificationQueue;
const _FoundryUIAvailabilityPort = class _FoundryUIAvailabilityPort {
  /**
   * Checks if Foundry UI is available.
   * UI is available when `ui` is defined and `ui.notifications` exists.
   */
  isAvailable() {
    return typeof ui !== "undefined" && ui?.notifications !== void 0;
  }
  /**
   * Optional callback registration for when UI becomes available.
   * Not implemented for now - can be extended with event-based approach later.
   */
  onAvailable(_callback) {
  }
};
__name(_FoundryUIAvailabilityPort, "FoundryUIAvailabilityPort");
let FoundryUIAvailabilityPort = _FoundryUIAvailabilityPort;
const _DIFoundryUIAvailabilityPort = class _DIFoundryUIAvailabilityPort extends FoundryUIAvailabilityPort {
  constructor() {
    super();
  }
};
__name(_DIFoundryUIAvailabilityPort, "DIFoundryUIAvailabilityPort");
_DIFoundryUIAvailabilityPort.dependencies = [];
let DIFoundryUIAvailabilityPort = _DIFoundryUIAvailabilityPort;
function registerNotifications(container) {
  const notificationQueueResult = container.registerClass(
    notificationQueueToken,
    DINotificationQueue,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(notificationQueueResult)) {
    return err(`Failed to register NotificationQueue: ${notificationQueueResult.error.message}`);
  }
  const uiAvailabilityResult = container.registerClass(
    platformUIAvailabilityPortToken,
    DIFoundryUIAvailabilityPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiAvailabilityResult)) {
    return err(
      `Failed to register PlatformUIAvailabilityPort: ${uiAvailabilityResult.error.message}`
    );
  }
  const consoleChannelResult = container.registerClass(
    consoleChannelToken,
    DIConsoleChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(consoleChannelResult)) {
    return err(`Failed to register ConsoleChannel: ${consoleChannelResult.error.message}`);
  }
  const uiChannelResult = container.registerClass(
    uiChannelToken,
    DIUIChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiChannelResult)) {
    return err(`Failed to register UIChannel: ${uiChannelResult.error.message}`);
  }
  const queuedUIChannelResult = container.registerClass(
    queuedUIChannelToken,
    DIQueuedUIChannel,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(queuedUIChannelResult)) {
    return err(`Failed to register QueuedUIChannel: ${queuedUIChannelResult.error.message}`);
  }
  const notificationCenterResult = container.registerClass(
    notificationCenterToken,
    DINotificationCenter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(notificationCenterResult)) {
    return err(`Failed to register NotificationCenter: ${notificationCenterResult.error.message}`);
  }
  const notificationPortResult = container.registerClass(
    platformNotificationPortToken,
    DINotificationPortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(notificationPortResult)) {
    return err(
      `Failed to register PlatformNotificationPort: ${notificationPortResult.error.message}`
    );
  }
  return ok(void 0);
}
__name(registerNotifications, "registerNotifications");
const _ModuleSettingsRegistrar = class _ModuleSettingsRegistrar {
  constructor(settings, runtimeConfigSettingsSync, errorMapper, notifications, i18n, logger, validator, settingDefinitionRegistry, runtimeConfigBindingRegistry) {
    this.settings = settings;
    this.runtimeConfigSettingsSync = runtimeConfigSettingsSync;
    this.errorMapper = errorMapper;
    this.notifications = notifications;
    this.i18n = i18n;
    this.logger = logger;
    this.validator = validator;
    this.settingDefinitionRegistry = settingDefinitionRegistry;
    this.runtimeConfigBindingRegistry = runtimeConfigBindingRegistry;
  }
  /**
   * Registers all module settings.
   * Must be called during or after the 'init' hook.
   *
   * Iterates over settings from SettingDefinitionRegistry and applies
   * corresponding bindings from RuntimeConfigBindingRegistry.
   *
   * Implements Open/Closed Principle: New settings can be added via registry
   * extension without modifying this method.
   */
  registerAll() {
    const definitions = this.settingDefinitionRegistry.getAll();
    const bindings = this.runtimeConfigBindingRegistry.getAll();
    for (const definition of definitions) {
      const binding = bindings.get(definition.key);
      this.registerDefinition(
        definition,
        binding,
        this.settings,
        this.runtimeConfigSettingsSync,
        this.errorMapper,
        this.i18n,
        this.logger,
        this.validator
      );
    }
  }
  registerDefinition(definition, binding, settings, runtimeConfigSettingsSync, errorMapper, i18n, logger, validator) {
    const config2 = definition.createConfig(i18n, logger, validator);
    const configWithRuntimeBridge = binding ? runtimeConfigSettingsSync.attachBinding(config2, binding) : config2;
    const result = settings.registerSetting(
      MODULE_METADATA.ID,
      definition.key,
      configWithRuntimeBridge
    );
    if (!result.ok) {
      errorMapper.mapAndNotify(result.error, definition.key);
      return;
    }
    if (binding) {
      runtimeConfigSettingsSync.syncInitialValue(settings, binding, definition.key);
    }
  }
};
__name(_ModuleSettingsRegistrar, "ModuleSettingsRegistrar");
let ModuleSettingsRegistrar = _ModuleSettingsRegistrar;
const _DIModuleSettingsRegistrar = class _DIModuleSettingsRegistrar extends ModuleSettingsRegistrar {
  constructor(settings, runtimeConfigSettingsSync, errorMapper, notifications, i18n, logger, validator, settingDefinitionRegistry, runtimeConfigBindingRegistry) {
    super(
      settings,
      runtimeConfigSettingsSync,
      errorMapper,
      notifications,
      i18n,
      logger,
      validator,
      settingDefinitionRegistry,
      runtimeConfigBindingRegistry
    );
  }
};
__name(_DIModuleSettingsRegistrar, "DIModuleSettingsRegistrar");
_DIModuleSettingsRegistrar.dependencies = [
  platformSettingsRegistrationPortToken,
  runtimeConfigSettingsSyncToken,
  settingRegistrationErrorMapperToken,
  platformNotificationPortToken,
  platformI18nPortToken,
  platformLoggingPortToken,
  platformValidationPortToken,
  settingDefinitionRegistryToken,
  runtimeConfigBindingRegistryToken
];
let DIModuleSettingsRegistrar = _DIModuleSettingsRegistrar;
const SettingValidators = {
  /**
   * Validates that value is a boolean.
   */
  boolean: /* @__PURE__ */ __name((value2) => typeof value2 === "boolean", "boolean"),
  /**
   * Validates that value is a number.
   */
  number: /* @__PURE__ */ __name((value2) => typeof value2 === "number" && !Number.isNaN(value2), "number"),
  /**
   * Validates that value is a non-negative number.
   */
  nonNegativeNumber: /* @__PURE__ */ __name((value2) => typeof value2 === "number" && !Number.isNaN(value2) && value2 >= 0, "nonNegativeNumber"),
  /**
   * Validates that value is a non-negative integer.
   */
  nonNegativeInteger: /* @__PURE__ */ __name((value2) => typeof value2 === "number" && Number.isInteger(value2) && value2 >= 0, "nonNegativeInteger"),
  /**
   * Validates that value is a positive integer (greater than 0).
   */
  positiveInteger: /* @__PURE__ */ __name((value2) => typeof value2 === "number" && Number.isInteger(value2) && value2 > 0, "positiveInteger"),
  /**
   * Validates that value is a string.
   */
  string: /* @__PURE__ */ __name((value2) => typeof value2 === "string", "string"),
  /**
   * Validates that value is a non-empty string.
   */
  nonEmptyString: /* @__PURE__ */ __name((value2) => typeof value2 === "string" && value2.length > 0, "nonEmptyString"),
  /**
   * Validates that value is a number between 0 and 1 (inclusive).
   */
  samplingRate: /* @__PURE__ */ __name((value2) => typeof value2 === "number" && !Number.isNaN(value2) && value2 >= 0 && value2 <= 1, "samplingRate"),
  /**
   * Creates a validator for enum values.
   */
  oneOf: /* @__PURE__ */ __name((validValues) => (value2) => (typeof value2 === "string" || typeof value2 === "number") && validValues.includes(value2), "oneOf")
};
const NOTIFICATION_QUEUE_CONSTANTS = {
  minSize: 10,
  maxSize: 1e3,
  defaultSize: 50
};
function getNotificationQueueConstants() {
  return NOTIFICATION_QUEUE_CONSTANTS;
}
__name(getNotificationQueueConstants, "getNotificationQueueConstants");
const notificationQueueMaxSizeSetting = {
  key: SETTING_KEYS.NOTIFICATION_QUEUE_MAX_SIZE,
  createConfig(i18n, logger, _validator) {
    const constants = getNotificationQueueConstants();
    return {
      name: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.notificationQueueMaxSize.name",
          "Notification Queue Max Size"
        ),
        "Notification Queue Max Size"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.notificationQueueMaxSize.hint",
          `Maximum number of notifications queued before UI is available. Range: ${constants.minSize}-${constants.maxSize}.`
        ),
        `Maximum number of notifications queued before UI is available. Range: ${constants.minSize}-${constants.maxSize}.`
      ),
      scope: "world",
      config: true,
      type: Number,
      default: constants.defaultSize,
      onChange: /* @__PURE__ */ __name((value2) => {
        const numericValue = Number(value2);
        const clamped = Math.max(
          constants.minSize,
          Math.min(constants.maxSize, Math.floor(numericValue))
        );
        if (clamped !== numericValue) {
          logger.info(
            `Notification queue max size clamped from ${numericValue} to ${clamped} (range: ${constants.minSize}-${constants.maxSize})`
          );
        } else {
          logger.info(`Notification queue max size updated via settings: ${clamped}`);
        }
      }, "onChange")
    };
  }
};
const _RuntimeConfigSync = class _RuntimeConfigSync {
  constructor(runtimeConfig, notifications) {
    this.runtimeConfig = runtimeConfig;
    this.notifications = notifications;
  }
  /**
   * Bindet RuntimeConfig-Synchronisation an ein Setting.
   *
   * Wraps the original onChange callback and adds RuntimeConfig synchronization.
   *
   * @param config - The Setting configuration
   * @param binding - Binding configuration for RuntimeConfig sync
   * @returns Modified config with RuntimeConfig bridge attached
   */
  attachBinding(config2, binding) {
    const originalOnChange = config2.onChange;
    return {
      ...config2,
      onChange: /* @__PURE__ */ __name((value2) => {
        const normalized = binding.normalize(value2);
        this.runtimeConfig.setFromPlatform(binding.runtimeKey, normalized);
        originalOnChange?.(value2);
      }, "onChange")
    };
  }
  /**
   * Synchronisiert initialen Setting-Wert zu RuntimeConfig.
   *
   * Reads the current Setting value and updates RuntimeConfig accordingly.
   *
   * @param settings - Settings port for reading values
   * @param binding - Binding configuration for RuntimeConfig sync
   * @param settingKey - The Setting key to read
   */
  syncInitialValue(settings, binding, settingKey) {
    const currentValue = settings.getSettingValue(
      MODULE_METADATA.ID,
      settingKey,
      binding.validator
    );
    if (!currentValue.ok) {
      this.notifications.warn(
        `Failed to read initial value for ${settingKey}`,
        currentValue.error,
        {
          channels: ["ConsoleChannel"]
        }
      );
      return;
    }
    this.runtimeConfig.setFromPlatform(binding.runtimeKey, binding.normalize(currentValue.value));
  }
};
__name(_RuntimeConfigSync, "RuntimeConfigSync");
let RuntimeConfigSync = _RuntimeConfigSync;
const isLogLevel = /* @__PURE__ */ __name((value2) => typeof value2 === "number" && value2 >= 0 && value2 <= 3, "isLogLevel");
const runtimeConfigBindings = {
  [SETTING_KEYS.LOG_LEVEL]: {
    runtimeKey: "logLevel",
    validator: isLogLevel,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [SETTING_KEYS.CACHE_ENABLED]: {
    runtimeKey: "enableCacheService",
    validator: SettingValidators.boolean,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [SETTING_KEYS.CACHE_TTL_MS]: {
    runtimeKey: "cacheDefaultTtlMs",
    validator: SettingValidators.nonNegativeNumber,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [SETTING_KEYS.CACHE_MAX_ENTRIES]: {
    runtimeKey: "cacheMaxEntries",
    validator: SettingValidators.nonNegativeInteger,
    normalize: /* @__PURE__ */ __name((value2) => value2 > 0 ? value2 : void 0, "normalize")
  },
  [SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED]: {
    runtimeKey: "enablePerformanceTracking",
    validator: SettingValidators.boolean,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [SETTING_KEYS.PERFORMANCE_SAMPLING_RATE]: {
    runtimeKey: "performanceSamplingRate",
    validator: SettingValidators.samplingRate,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [SETTING_KEYS.METRICS_PERSISTENCE_ENABLED]: {
    runtimeKey: "enableMetricsPersistence",
    validator: SettingValidators.boolean,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [SETTING_KEYS.METRICS_PERSISTENCE_KEY]: {
    runtimeKey: "metricsPersistenceKey",
    validator: SettingValidators.nonEmptyString,
    normalize: /* @__PURE__ */ __name((value2) => value2, "normalize")
  },
  [SETTING_KEYS.NOTIFICATION_QUEUE_MAX_SIZE]: {
    runtimeKey: "notificationQueueMaxSize",
    validator: SettingValidators.positiveInteger,
    normalize: /* @__PURE__ */ __name((value2) => {
      const constants = getNotificationQueueConstants();
      return Math.max(constants.minSize, Math.min(constants.maxSize, Math.floor(value2)));
    }, "normalize")
  }
};
const _DIRuntimeConfigSync = class _DIRuntimeConfigSync extends RuntimeConfigSync {
  constructor(runtimeConfig, notifications) {
    super(runtimeConfig, notifications);
  }
};
__name(_DIRuntimeConfigSync, "DIRuntimeConfigSync");
_DIRuntimeConfigSync.dependencies = [runtimeConfigToken, platformNotificationPortToken];
let DIRuntimeConfigSync = _DIRuntimeConfigSync;
const _RuntimeConfigSettingsSync = class _RuntimeConfigSettingsSync {
  constructor(runtimeConfigSync) {
    this.runtimeConfigSync = runtimeConfigSync;
  }
  /**
   * Attaches RuntimeConfig synchronization binding to a setting configuration.
   *
   * Delegates to RuntimeConfigSync.attachBinding().
   *
   * @param config - The Setting configuration
   * @param binding - Binding configuration for RuntimeConfig sync
   * @returns Modified config with RuntimeConfig bridge attached
   */
  attachBinding(config2, binding) {
    return this.runtimeConfigSync.attachBinding(config2, binding);
  }
  /**
   * Synchronizes initial Setting value to RuntimeConfig.
   *
   * Delegates to RuntimeConfigSync.syncInitialValue().
   *
   * @param settings - Settings port for reading values
   * @param binding - Binding configuration for RuntimeConfig sync
   * @param settingKey - The Setting key to read
   */
  syncInitialValue(settings, binding, settingKey) {
    this.runtimeConfigSync.syncInitialValue(settings, binding, settingKey);
  }
};
__name(_RuntimeConfigSettingsSync, "RuntimeConfigSettingsSync");
let RuntimeConfigSettingsSync = _RuntimeConfigSettingsSync;
const _DIRuntimeConfigSettingsSync = class _DIRuntimeConfigSettingsSync extends RuntimeConfigSettingsSync {
  constructor(runtimeConfigSync) {
    super(runtimeConfigSync);
  }
};
__name(_DIRuntimeConfigSettingsSync, "DIRuntimeConfigSettingsSync");
_DIRuntimeConfigSettingsSync.dependencies = [runtimeConfigSyncToken];
let DIRuntimeConfigSettingsSync = _DIRuntimeConfigSettingsSync;
const _SettingRegistrationErrorMapper = class _SettingRegistrationErrorMapper {
  constructor(notifications) {
    this.notifications = notifications;
  }
  mapAndNotify(error, settingKey) {
    const notificationError = {
      code: error.code,
      message: error.message,
      ...error.details !== void 0 && { details: error.details }
    };
    this.notifications.error(`Failed to register ${settingKey} setting`, notificationError, {
      channels: ["ConsoleChannel"]
    });
  }
};
__name(_SettingRegistrationErrorMapper, "SettingRegistrationErrorMapper");
let SettingRegistrationErrorMapper = _SettingRegistrationErrorMapper;
const _DISettingRegistrationErrorMapper = class _DISettingRegistrationErrorMapper extends SettingRegistrationErrorMapper {
  constructor(notifications) {
    super(notifications);
  }
};
__name(_DISettingRegistrationErrorMapper, "DISettingRegistrationErrorMapper");
_DISettingRegistrationErrorMapper.dependencies = [platformNotificationPortToken];
let DISettingRegistrationErrorMapper = _DISettingRegistrationErrorMapper;
function castSettingDefinitionToUnknown(definition) {
  return definition;
}
__name(castSettingDefinitionToUnknown, "castSettingDefinitionToUnknown");
function castBindingToUnknown(binding) {
  return binding;
}
__name(castBindingToUnknown, "castBindingToUnknown");
function validateAndSetLogLevel(value2, logger, validator) {
  const validationResult = validator.validateLogLevel(value2);
  if (!validationResult.ok) {
    logger.warn(`Invalid log level value received: ${value2}, using default INFO`);
    if (logger.setMinLevel) {
      logger.setMinLevel(LogLevel.INFO);
    }
    return;
  }
  if (logger.setMinLevel) {
    logger.setMinLevel(validationResult.value);
    logger.info(`Log level changed to: ${LogLevel[validationResult.value]}`);
  }
}
__name(validateAndSetLogLevel, "validateAndSetLogLevel");
const logLevelSetting = {
  key: SETTING_KEYS.LOG_LEVEL,
  createConfig(i18n, logger, validator) {
    return {
      name: unwrapOr(i18n.translate("MODULE.SETTINGS.logLevel.name", "Log Level"), "Log Level"),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.logLevel.hint",
          "Minimum log level for module output. DEBUG shows all logs, ERROR only critical errors."
        ),
        "Minimum log level for module output. DEBUG shows all logs, ERROR only critical errors."
      ),
      scope: "world",
      config: true,
      type: Number,
      choices: {
        [LogLevel.DEBUG]: unwrapOr(
          i18n.translate(
            "MODULE.SETTINGS.logLevel.choices.debug",
            "DEBUG (All logs - for debugging)"
          ),
          "DEBUG (All logs - for debugging)"
        ),
        [LogLevel.INFO]: unwrapOr(
          i18n.translate("MODULE.SETTINGS.logLevel.choices.info", "INFO (Standard)"),
          "INFO (Standard)"
        ),
        [LogLevel.WARN]: unwrapOr(
          i18n.translate(
            "MODULE.SETTINGS.logLevel.choices.warn",
            "WARN (Warnings and errors only)"
          ),
          "WARN (Warnings and errors only)"
        ),
        [LogLevel.ERROR]: unwrapOr(
          i18n.translate("MODULE.SETTINGS.logLevel.choices.error", "ERROR (Critical errors only)"),
          "ERROR (Critical errors only)"
        )
      },
      default: LogLevel.INFO,
      onChange: /* @__PURE__ */ __name((value2) => {
        validateAndSetLogLevel(value2, logger, validator);
      }, "onChange")
    };
  }
};
const cacheEnabledSetting = {
  key: SETTING_KEYS.CACHE_ENABLED,
  createConfig(i18n, logger, _validator) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.cacheEnabled.name", "Enable Cache Service"),
        "Enable Cache Service"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.cacheEnabled.hint",
          "Toggle the global CacheService. When disabled, all cache interactions bypass the cache layer."
        ),
        "Toggle the global CacheService. When disabled, all cache interactions bypass the cache layer."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      onChange: /* @__PURE__ */ __name((value2) => {
        const action = value2 ? "enabled" : "disabled";
        logger.info(`CacheService ${action} via module setting.`);
      }, "onChange")
    };
  }
};
const cacheDefaultTtlSetting = {
  key: SETTING_KEYS.CACHE_TTL_MS,
  createConfig(i18n, logger, _validator) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.cacheDefaultTtlMs.name", "Cache TTL (ms)"),
        "Cache TTL (ms)"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.cacheDefaultTtlMs.hint",
          "Default lifetime for cache entries in milliseconds. Use 0 to disable TTL (entries live until invalidated)."
        ),
        "Default lifetime for cache entries in milliseconds. Use 0 to disable TTL (entries live until invalidated)."
      ),
      scope: "world",
      config: true,
      type: Number,
      default: APP_DEFAULTS.CACHE_TTL_MS,
      onChange: /* @__PURE__ */ __name((value2) => {
        const numericValue = Number(value2);
        const sanitized = Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
        logger.info(`Cache TTL updated via settings: ${sanitized}ms`);
      }, "onChange")
    };
  }
};
const cacheMaxEntriesSetting = {
  key: SETTING_KEYS.CACHE_MAX_ENTRIES,
  createConfig(i18n, logger, _validator) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.cacheMaxEntries.name", "Cache Max Entries"),
        "Cache Max Entries"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.cacheMaxEntries.hint",
          "Optional LRU limit. Use 0 to allow unlimited cache entries."
        ),
        "Optional LRU limit. Use 0 to allow unlimited cache entries."
      ),
      scope: "world",
      config: true,
      type: Number,
      default: 0,
      onChange: /* @__PURE__ */ __name((value2) => {
        const numericValue = Number(value2);
        const sanitized = Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : 0;
        if (sanitized === 0) {
          logger.info("Cache max entries reset to unlimited via settings.");
        } else {
          logger.info(`Cache max entries updated via settings: ${sanitized}`);
        }
      }, "onChange")
    };
  }
};
const performanceTrackingSetting = {
  key: SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED,
  createConfig(i18n, logger, _validator) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.performanceTracking.name", "Performance Tracking"),
        "Performance Tracking"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.performanceTracking.hint",
          "Enables internal performance instrumentation (requires sampling)."
        ),
        "Enables internal performance instrumentation (requires sampling)."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: /* @__PURE__ */ __name((value2) => {
        const action = value2 ? "enabled" : "disabled";
        logger.info(`Performance tracking ${action} via module setting.`);
      }, "onChange")
    };
  }
};
const performanceSamplingSetting = {
  key: SETTING_KEYS.PERFORMANCE_SAMPLING_RATE,
  createConfig(i18n, logger, _validator) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.performanceSamplingRate.name", "Performance Sampling Rate"),
        "Performance Sampling Rate"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.performanceSamplingRate.hint",
          "Fraction of operations to instrument (0 = 0%, 1 = 100%)."
        ),
        "Fraction of operations to instrument (0 = 0%, 1 = 100%)."
      ),
      scope: "world",
      config: true,
      type: Number,
      default: 1,
      onChange: /* @__PURE__ */ __name((value2) => {
        const clamped = Math.max(0, Math.min(1, Number(value2) || 0));
        logger.info(
          `Performance sampling rate updated via settings: ${(clamped * 100).toFixed(1)}%`
        );
      }, "onChange")
    };
  }
};
const metricsPersistenceEnabledSetting = {
  key: SETTING_KEYS.METRICS_PERSISTENCE_ENABLED,
  createConfig(i18n, logger, _validator) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.metricsPersistenceEnabled.name", "Persist Metrics"),
        "Persist Metrics"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.metricsPersistenceEnabled.hint",
          "Keeps observability metrics across Foundry restarts (uses LocalStorage)."
        ),
        "Keeps observability metrics across Foundry restarts (uses LocalStorage)."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: /* @__PURE__ */ __name((value2) => {
        const action = value2 ? "enabled" : "disabled";
        logger.info(`Metrics persistence ${action} via module setting.`);
      }, "onChange")
    };
  }
};
const metricsPersistenceKeySetting = {
  key: SETTING_KEYS.METRICS_PERSISTENCE_KEY,
  createConfig(i18n, logger, _validator) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.metricsPersistenceKey.name", "Metrics Storage Key"),
        "Metrics Storage Key"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.metricsPersistenceKey.hint",
          "LocalStorage key used when metrics persistence is enabled."
        ),
        "LocalStorage key used when metrics persistence is enabled."
      ),
      scope: "world",
      config: true,
      type: String,
      default: `${MODULE_METADATA.ID}.metrics`,
      onChange: /* @__PURE__ */ __name((value2) => {
        logger.info(`Metrics persistence key set to: ${value2 || "(empty)"}`);
      }, "onChange")
    };
  }
};
const _DefaultSettingDefinitionRegistry = class _DefaultSettingDefinitionRegistry {
  getAll() {
    return [
      castSettingDefinitionToUnknown(logLevelSetting),
      castSettingDefinitionToUnknown(cacheEnabledSetting),
      castSettingDefinitionToUnknown(cacheDefaultTtlSetting),
      castSettingDefinitionToUnknown(cacheMaxEntriesSetting),
      castSettingDefinitionToUnknown(performanceTrackingSetting),
      castSettingDefinitionToUnknown(performanceSamplingSetting),
      castSettingDefinitionToUnknown(metricsPersistenceEnabledSetting),
      castSettingDefinitionToUnknown(metricsPersistenceKeySetting),
      castSettingDefinitionToUnknown(notificationQueueMaxSizeSetting)
    ];
  }
};
__name(_DefaultSettingDefinitionRegistry, "DefaultSettingDefinitionRegistry");
let DefaultSettingDefinitionRegistry = _DefaultSettingDefinitionRegistry;
const _DefaultRuntimeConfigBindingRegistry = class _DefaultRuntimeConfigBindingRegistry {
  getAll() {
    const map2 = /* @__PURE__ */ new Map();
    Object.entries(runtimeConfigBindings).forEach(([key, binding]) => {
      map2.set(key, castBindingToUnknown(binding));
    });
    return map2;
  }
};
__name(_DefaultRuntimeConfigBindingRegistry, "DefaultRuntimeConfigBindingRegistry");
let DefaultRuntimeConfigBindingRegistry = _DefaultRuntimeConfigBindingRegistry;
function registerRegistrars(container) {
  const runtimeConfigSyncResult = container.registerClass(
    runtimeConfigSyncToken,
    DIRuntimeConfigSync,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(runtimeConfigSyncResult)) {
    return err(`Failed to register RuntimeConfigSync: ${runtimeConfigSyncResult.error.message}`);
  }
  const runtimeConfigSettingsSyncResult = container.registerClass(
    runtimeConfigSettingsSyncToken,
    DIRuntimeConfigSettingsSync,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(runtimeConfigSettingsSyncResult)) {
    return err(
      `Failed to register RuntimeConfigSettingsSync: ${runtimeConfigSettingsSyncResult.error.message}`
    );
  }
  const errorMapperResult = container.registerClass(
    settingRegistrationErrorMapperToken,
    DISettingRegistrationErrorMapper,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(errorMapperResult)) {
    return err(
      `Failed to register SettingRegistrationErrorMapper: ${errorMapperResult.error.message}`
    );
  }
  const settingDefinitionRegistryResult = container.registerClass(
    settingDefinitionRegistryToken,
    DefaultSettingDefinitionRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingDefinitionRegistryResult)) {
    return err(
      `Failed to register SettingDefinitionRegistry: ${settingDefinitionRegistryResult.error.message}`
    );
  }
  const runtimeConfigBindingRegistryResult = container.registerClass(
    runtimeConfigBindingRegistryToken,
    DefaultRuntimeConfigBindingRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(runtimeConfigBindingRegistryResult)) {
    return err(
      `Failed to register RuntimeConfigBindingRegistry: ${runtimeConfigBindingRegistryResult.error.message}`
    );
  }
  const settingsRegistrarResult = container.registerClass(
    moduleSettingsRegistrarToken,
    DIModuleSettingsRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsRegistrarResult)) {
    return err(
      `Failed to register ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
    );
  }
  return ok(void 0);
}
__name(registerRegistrars, "registerRegistrars");
const _FoundryJournalEventAdapter = class _FoundryJournalEventAdapter {
  constructor(foundryHooksPort) {
    this.foundryHooksPort = foundryHooksPort;
    this.registrations = /* @__PURE__ */ new Map();
    this.nextId = 1;
  }
  // ===== Specialized Journal Methods =====
  onJournalCreated(callback) {
    return this.registerFoundryHook(
      "createJournalEntry",
      // Foundry-spezifischer Hook-Name
      (...args2) => {
        const [foundryEntry] = args2;
        const event = {
          journalId: this.extractId(foundryEntry),
          timestamp: Date.now()
        };
        callback(event);
      }
    );
  }
  onJournalUpdated(callback) {
    return this.registerFoundryHook(
      "updateJournalEntry",
      // Foundry-spezifisch
      (...args2) => {
        const [foundryEntry, changes] = args2;
        const event = {
          journalId: this.extractId(foundryEntry),
          changes: this.normalizeChanges(changes),
          timestamp: Date.now()
        };
        callback(event);
      }
    );
  }
  onJournalDeleted(callback) {
    return this.registerFoundryHook("deleteJournalEntry", (...args2) => {
      const [foundryEntry] = args2;
      const event = {
        journalId: this.extractId(foundryEntry),
        timestamp: Date.now()
      };
      callback(event);
    });
  }
  onJournalDirectoryRendered(callback) {
    return this.registerFoundryHook("renderJournalDirectory", (app, html) => {
      const htmlElement = this.extractHtmlElement(html);
      if (!htmlElement) return;
      const event = {
        htmlElement,
        timestamp: Date.now()
      };
      callback(event);
    });
  }
  // ===== Generic Methods (from PlatformEventPort) =====
  registerListener(eventType, callback) {
    const foundryCallback = /* @__PURE__ */ __name((...args2) => {
      if (args2.length > 0 && typeof args2[0] === "object" && args2[0] !== null) {
        const candidate = args2[0];
        if (typeof candidate === "object" && candidate !== null && ("journalId" in candidate || "timestamp" in candidate)) {
          const eventRecord = castToRecord(candidate);
          const event = {
            journalId: typeof eventRecord.journalId === "string" ? eventRecord.journalId : "",
            timestamp: typeof eventRecord.timestamp === "number" ? eventRecord.timestamp : Date.now()
          };
          callback(event);
        }
      }
    }, "foundryCallback");
    return this.registerFoundryHook(eventType, foundryCallback);
  }
  unregisterListener(registrationId) {
    const cleanup = this.registrations.get(registrationId);
    if (!cleanup) {
      return {
        ok: false,
        error: {
          code: "EVENT_UNREGISTRATION_FAILED",
          message: `No registration found for ID ${registrationId}`
        }
      };
    }
    cleanup();
    this.registrations.delete(registrationId);
    return { ok: true, value: void 0 };
  }
  // ===== Lifecycle =====
  /**
   * Cleanup all registered listeners.
   * Should be called during module shutdown.
   */
  dispose() {
    for (const cleanup of this.registrations.values()) {
      cleanup();
    }
    this.registrations.clear();
  }
  // ===== Private Helpers =====
  registerFoundryHook(hookName, callback) {
    const platformCallback = /* @__PURE__ */ __name((event) => {
      function isArrayOfUnknown(value2) {
        return Array.isArray(value2);
      }
      __name(isArrayOfUnknown, "isArrayOfUnknown");
      if (isArrayOfUnknown(event)) {
        let isValidArg = /* @__PURE__ */ __name(function(arg) {
          return arg !== null && arg !== void 0;
        }, "isValidArg");
        const validArgs = event.filter(isValidArg);
        if (validArgs.length > 0) {
          callback(...validArgs);
        }
      } else {
        let isNotNullOrUndefined = /* @__PURE__ */ __name(function(value2) {
          return value2 !== null && value2 !== void 0;
        }, "isNotNullOrUndefined");
        if (isNotNullOrUndefined(event)) {
          callback(event);
        }
      }
    }, "platformCallback");
    const result = this.foundryHooksPort.registerListener(hookName, platformCallback);
    if (!result.ok) {
      return result;
    }
    const registrationId = result.value;
    this.registrations.set(registrationId, () => {
      this.foundryHooksPort.unregisterListener(registrationId);
    });
    return { ok: true, value: registrationId };
  }
  extractId(foundryEntry) {
    if (typeof foundryEntry === "object" && foundryEntry !== null && "id" in foundryEntry) {
      const entry = castToRecord(foundryEntry);
      if (typeof entry.id === "string") {
        return entry.id;
      }
    }
    return "";
  }
  normalizeChanges(foundryChanges) {
    if (!foundryChanges || typeof foundryChanges !== "object") {
      return {};
    }
    const changes = normalizeToRecord(foundryChanges);
    const result = { ...changes };
    if (changes.flags !== void 0 && typeof changes.flags === "object" && changes.flags !== null) {
      result.flags = normalizeToRecord(changes.flags);
    }
    if (changes.name !== void 0 && typeof changes.name === "string") {
      result.name = changes.name;
    }
    return result;
  }
  extractHtmlElement(htmlInput) {
    if (htmlInput instanceof HTMLElement) return htmlInput;
    return getFirstElementIfArray(htmlInput, (el) => el instanceof HTMLElement);
  }
};
__name(_FoundryJournalEventAdapter, "FoundryJournalEventAdapter");
let FoundryJournalEventAdapter = _FoundryJournalEventAdapter;
const _DIFoundryJournalEventAdapter = class _DIFoundryJournalEventAdapter extends FoundryJournalEventAdapter {
  constructor(foundryHooksPort) {
    super(foundryHooksPort);
  }
};
__name(_DIFoundryJournalEventAdapter, "DIFoundryJournalEventAdapter");
_DIFoundryJournalEventAdapter.dependencies = [foundryHooksToken];
let DIFoundryJournalEventAdapter = _DIFoundryJournalEventAdapter;
const _InvalidateJournalCacheOnChangeUseCase = class _InvalidateJournalCacheOnChangeUseCase {
  constructor(journalEvents, cache, notifications) {
    this.journalEvents = journalEvents;
    this.cache = cache;
    this.notifications = notifications;
    this.registrationIds = [];
  }
  /**
   * Register event listeners for journal change events.
   */
  register() {
    const results = [
      this.journalEvents.onJournalCreated((event) => {
        this.invalidateCache("created", event.journalId);
      }),
      this.journalEvents.onJournalUpdated((event) => {
        this.invalidateCache("updated", event.journalId);
        if (event.changes.flags?.["hidden"] !== void 0) {
          this.triggerUIUpdate(event.journalId);
        }
      }),
      this.journalEvents.onJournalDeleted((event) => {
        this.invalidateCache("deleted", event.journalId);
      })
    ];
    const errors = [];
    for (const result of results) {
      if (result.ok) {
        this.registrationIds.push(result.value);
      } else {
        const error = new Error(
          `Failed to register journal event listener: ${result.error.message}`
        );
        errors.push(error);
        this.notifications.error(
          "Failed to register journal event listener",
          {
            code: result.error.code,
            message: result.error.message,
            details: result.error.details
          },
          { channels: ["ConsoleChannel"] }
        );
      }
    }
    if (errors.length > 0) {
      this.dispose();
      return err(getFirstArrayElement$1(errors));
    }
    return ok(void 0);
  }
  /**
   * Invalidate cache entries related to journals.
   */
  invalidateCache(reason, journalId) {
    const removed = this.cache.invalidateWhere((meta) => meta.tags.includes("journal:hidden"));
    if (removed > 0) {
      this.notifications.debug(
        `Invalidated ${removed} journal cache entries (${reason})`,
        { journalId },
        { channels: ["ConsoleChannel"] }
      );
    }
  }
  /**
   * Trigger UI update when journal visibility changes.
   */
  triggerUIUpdate(journalId) {
    this.notifications.debug(
      "Journal hidden flag changed, UI update needed",
      { journalId },
      { channels: ["ConsoleChannel"] }
    );
  }
  /**
   * Cleanup: Unregister all event listeners.
   */
  dispose() {
    for (const id of this.registrationIds) {
      this.journalEvents.unregisterListener(id);
    }
    this.registrationIds = [];
  }
};
__name(_InvalidateJournalCacheOnChangeUseCase, "InvalidateJournalCacheOnChangeUseCase");
let InvalidateJournalCacheOnChangeUseCase = _InvalidateJournalCacheOnChangeUseCase;
const _DIInvalidateJournalCacheOnChangeUseCase = class _DIInvalidateJournalCacheOnChangeUseCase extends InvalidateJournalCacheOnChangeUseCase {
  constructor(journalEvents, cache, notifications) {
    super(journalEvents, cache, notifications);
  }
};
__name(_DIInvalidateJournalCacheOnChangeUseCase, "DIInvalidateJournalCacheOnChangeUseCase");
_DIInvalidateJournalCacheOnChangeUseCase.dependencies = [
  platformJournalEventPortToken,
  platformCachePortToken,
  platformNotificationPortToken
];
let DIInvalidateJournalCacheOnChangeUseCase = _DIInvalidateJournalCacheOnChangeUseCase;
const _ProcessJournalDirectoryOnRenderUseCase = class _ProcessJournalDirectoryOnRenderUseCase {
  constructor(journalEvents, journalVisibility, directoryProcessor, notifications) {
    this.journalEvents = journalEvents;
    this.journalVisibility = journalVisibility;
    this.directoryProcessor = directoryProcessor;
    this.notifications = notifications;
  }
  /**
   * Register event listener for directory render events.
   */
  register() {
    const result = this.journalEvents.onJournalDirectoryRendered((event) => {
      this.notifications.debug(
        "Journal directory rendered, processing visibility",
        { timestamp: event.timestamp },
        { channels: ["ConsoleChannel"] }
      );
      const hiddenResult = this.journalVisibility.getHiddenJournalEntries();
      if (!hiddenResult.ok) {
        this.notifications.error("Failed to get hidden entries", hiddenResult.error, {
          channels: ["ConsoleChannel"]
        });
        return;
      }
      const processResult = this.directoryProcessor.processDirectory(
        event.htmlElement,
        hiddenResult.value
      );
      if (!processResult.ok) {
        this.notifications.error("Failed to process directory", processResult.error, {
          channels: ["ConsoleChannel"]
        });
      }
    });
    if (result.ok) {
      this.registrationId = result.value;
      return ok(void 0);
    } else {
      return err(new Error(result.error.message));
    }
  }
  /**
   * Cleanup: Unregister event listener.
   */
  dispose() {
    if (this.registrationId !== void 0) {
      this.journalEvents.unregisterListener(this.registrationId);
      this.registrationId = void 0;
    }
  }
};
__name(_ProcessJournalDirectoryOnRenderUseCase, "ProcessJournalDirectoryOnRenderUseCase");
let ProcessJournalDirectoryOnRenderUseCase = _ProcessJournalDirectoryOnRenderUseCase;
const _DIProcessJournalDirectoryOnRenderUseCase = class _DIProcessJournalDirectoryOnRenderUseCase extends ProcessJournalDirectoryOnRenderUseCase {
  constructor(journalEvents, journalVisibility, directoryProcessor, notifications) {
    super(journalEvents, journalVisibility, directoryProcessor, notifications);
  }
};
__name(_DIProcessJournalDirectoryOnRenderUseCase, "DIProcessJournalDirectoryOnRenderUseCase");
_DIProcessJournalDirectoryOnRenderUseCase.dependencies = [
  platformJournalEventPortToken,
  journalVisibilityServiceToken,
  journalDirectoryProcessorToken,
  platformNotificationPortToken
];
let DIProcessJournalDirectoryOnRenderUseCase = _DIProcessJournalDirectoryOnRenderUseCase;
const DOMAIN_FLAGS = {
  /** Flag key für versteckte Journal-Einträge */
  HIDDEN: "hidden"
};
const DOMAIN_EVENTS = {
  /** Event: Journal Directory wird gerendert */
  RENDER_JOURNAL_DIRECTORY: "renderJournalDirectory",
  /** Event: System-Initialisierung */
  INIT: "init",
  /** Event: System ist bereit */
  READY: "ready",
  /** Event: Journal Entry wird erstellt */
  CREATE_JOURNAL_ENTRY: "createJournalEntry",
  /** Event: Journal Entry wird aktualisiert */
  UPDATE_JOURNAL_ENTRY: "updateJournalEntry",
  /** Event: Journal Entry wird gelöscht */
  DELETE_JOURNAL_ENTRY: "deleteJournalEntry"
};
Object.freeze(DOMAIN_FLAGS);
Object.freeze(DOMAIN_EVENTS);
const _TriggerJournalDirectoryReRenderUseCase = class _TriggerJournalDirectoryReRenderUseCase {
  constructor(journalEvents, journalDirectoryUI, notifications) {
    this.journalEvents = journalEvents;
    this.journalDirectoryUI = journalDirectoryUI;
    this.notifications = notifications;
  }
  /**
   * Register event listener for journal update events.
   */
  register() {
    const result = this.journalEvents.onJournalUpdated((event) => {
      const moduleId = MODULE_METADATA.ID;
      const flagKey = DOMAIN_FLAGS.HIDDEN;
      const moduleFlags = event.changes.flags?.[moduleId];
      if (moduleFlags && typeof moduleFlags === "object" && flagKey in moduleFlags) {
        this.triggerReRender(event.journalId);
      }
    });
    if (result.ok) {
      this.registrationId = result.value;
      return ok(void 0);
    } else {
      return err(new Error(result.error.message));
    }
  }
  /**
   * Trigger journal directory re-render.
   */
  triggerReRender(journalId) {
    const result = this.journalDirectoryUI.rerenderJournalDirectory();
    if (!result.ok) {
      this.notifications.warn(
        "Failed to re-render journal directory after hidden flag change",
        result.error,
        { channels: ["ConsoleChannel"] }
      );
      return;
    }
    if (result.value) {
      this.notifications.debug(
        "Triggered journal directory re-render after hidden flag change",
        { journalId },
        { channels: ["ConsoleChannel"] }
      );
    }
  }
  /**
   * Cleanup: Unregister event listener.
   */
  dispose() {
    if (this.registrationId !== void 0) {
      this.journalEvents.unregisterListener(this.registrationId);
      this.registrationId = void 0;
    }
  }
};
__name(_TriggerJournalDirectoryReRenderUseCase, "TriggerJournalDirectoryReRenderUseCase");
let TriggerJournalDirectoryReRenderUseCase = _TriggerJournalDirectoryReRenderUseCase;
const _DITriggerJournalDirectoryReRenderUseCase = class _DITriggerJournalDirectoryReRenderUseCase extends TriggerJournalDirectoryReRenderUseCase {
  constructor(journalEvents, journalDirectoryUI, notifications) {
    super(journalEvents, journalDirectoryUI, notifications);
  }
};
__name(_DITriggerJournalDirectoryReRenderUseCase, "DITriggerJournalDirectoryReRenderUseCase");
_DITriggerJournalDirectoryReRenderUseCase.dependencies = [
  platformJournalEventPortToken,
  platformJournalDirectoryUiPortToken,
  platformNotificationPortToken
];
let DITriggerJournalDirectoryReRenderUseCase = _DITriggerJournalDirectoryReRenderUseCase;
const _RegisterContextMenuUseCase = class _RegisterContextMenuUseCase {
  constructor(contextMenuRegistration, handlers, logger) {
    this.contextMenuRegistration = contextMenuRegistration;
    this.handlers = handlers;
    this.logger = logger;
  }
  /**
   * Register callback for context menu events.
   * All handlers are called for each context menu event.
   * Errors in individual handlers are caught and logged, but don't stop other handlers.
   */
  register() {
    this.callback = (event) => {
      for (const handler of this.handlers) {
        try {
          handler.handle(event);
        } catch (error) {
          const handlerError = error instanceof Error ? error : new Error(String(error));
          this.logger.warn(`Context menu handler failed: ${handlerError.message}`, {
            error: handlerError,
            handler: handler.constructor.name
          });
        }
      }
    };
    this.contextMenuRegistration.addCallback(this.callback);
    return ok(void 0);
  }
  /**
   * Cleanup: Unregister callback.
   */
  dispose() {
    if (this.callback !== void 0) {
      this.contextMenuRegistration.removeCallback(this.callback);
      this.callback = void 0;
    }
  }
};
__name(_RegisterContextMenuUseCase, "RegisterContextMenuUseCase");
let RegisterContextMenuUseCase = _RegisterContextMenuUseCase;
const _DIRegisterContextMenuUseCase = class _DIRegisterContextMenuUseCase extends RegisterContextMenuUseCase {
  constructor(contextMenuRegistration, handlers, logger) {
    super(contextMenuRegistration, handlers, logger);
  }
};
__name(_DIRegisterContextMenuUseCase, "DIRegisterContextMenuUseCase");
_DIRegisterContextMenuUseCase.dependencies = [
  platformContextMenuRegistrationPortToken,
  journalContextMenuHandlersToken,
  platformLoggingPortToken
];
let DIRegisterContextMenuUseCase = _DIRegisterContextMenuUseCase;
const _HideJournalContextMenuHandler = class _HideJournalContextMenuHandler {
  constructor(journalRepository, platformUI, notifications) {
    this.journalRepository = journalRepository;
    this.platformUI = platformUI;
    this.notifications = notifications;
  }
  handle(event) {
    const journalId = this.extractJournalId(event.htmlElement);
    if (!journalId) {
      return;
    }
    const existingItem = event.options.find((item) => item.name === "Journal ausblenden");
    if (existingItem) {
      return;
    }
    const flagResult = this.journalRepository.getFlag(
      journalId,
      MODULE_METADATA.ID,
      DOMAIN_FLAGS.HIDDEN
    );
    if (flagResult.ok && flagResult.value !== true) {
      event.options.push({
        name: "Journal ausblenden",
        icon: '<i class="fas fa-eye-slash"></i>',
        callback: /* @__PURE__ */ __name(async (_li) => {
          const hideResult = await this.journalRepository.setFlag(
            journalId,
            MODULE_METADATA.ID,
            DOMAIN_FLAGS.HIDDEN,
            true
          );
          if (hideResult.ok) {
            const journalEntryResult = this.journalRepository.getById(journalId);
            const journalName = journalEntryResult.ok && journalEntryResult.value ? journalEntryResult.value.name ?? journalId : journalId;
            const notifyResult = this.platformUI.notify(
              `Journal "${journalName}" wurde ausgeblendet`,
              "info"
            );
            if (!notifyResult.ok) {
              this.notifications.warn(
                "Failed to show notification after hiding journal",
                notifyResult.error,
                { channels: ["ConsoleChannel"] }
              );
            }
            this.notifications.debug(
              `Journal ${journalId} (${journalName}) hidden via context menu`,
              { journalId, journalName },
              { channels: ["ConsoleChannel"] }
            );
          } else {
            this.notifications.error(
              `Failed to hide journal ${journalId}`,
              { code: hideResult.error.code, message: hideResult.error.message },
              {
                channels: ["ConsoleChannel", "UINotificationChannel"]
              }
            );
          }
        }, "callback")
      });
    }
  }
  /**
   * Extract journal ID from an HTML element.
   */
  extractJournalId(element) {
    const documentId = element.getAttribute("data-document-id");
    if (documentId) return documentId;
    const entryId = element.getAttribute("data-entry-id");
    if (entryId) return entryId;
    return null;
  }
};
__name(_HideJournalContextMenuHandler, "HideJournalContextMenuHandler");
let HideJournalContextMenuHandler = _HideJournalContextMenuHandler;
const _DIHideJournalContextMenuHandler = class _DIHideJournalContextMenuHandler extends HideJournalContextMenuHandler {
  constructor(journalRepository, platformUI, notifications) {
    super(journalRepository, platformUI, notifications);
  }
};
__name(_DIHideJournalContextMenuHandler, "DIHideJournalContextMenuHandler");
_DIHideJournalContextMenuHandler.dependencies = [
  platformJournalRepositoryToken,
  platformUIPortToken,
  platformNotificationPortToken
];
let DIHideJournalContextMenuHandler = _DIHideJournalContextMenuHandler;
function disposeHooks(hooks) {
  for (const hook of hooks) {
    hook.dispose();
  }
}
__name(disposeHooks, "disposeHooks");
const _ModuleEventRegistrar = class _ModuleEventRegistrar {
  constructor(processJournalDirectoryOnRender, invalidateJournalCacheOnChange, triggerJournalDirectoryReRender, notifications) {
    this.notifications = notifications;
    this.eventRegistrars = [
      processJournalDirectoryOnRender,
      invalidateJournalCacheOnChange,
      triggerJournalDirectoryReRender
    ];
  }
  /**
   * Registers all event listeners.
   *
   * NOTE: Container parameter removed - event listeners receive all dependencies via constructor injection.
   */
  registerAll() {
    const errors = [];
    for (const registrar of this.eventRegistrars) {
      const result = registrar.register();
      if (!result.ok) {
        const error = {
          code: "EVENT_REGISTRATION_FAILED",
          message: result.error.message
        };
        this.notifications.error("Failed to register event listener", error, {
          channels: ["ConsoleChannel"]
        });
        errors.push(result.error);
      }
    }
    if (errors.length > 0) {
      return err(errors);
    }
    return ok(void 0);
  }
  /**
   * Dispose all event listeners.
   * Called when the module is disabled or reloaded.
   */
  disposeAll() {
    disposeHooks(this.eventRegistrars);
  }
};
__name(_ModuleEventRegistrar, "ModuleEventRegistrar");
let ModuleEventRegistrar = _ModuleEventRegistrar;
const _DIModuleEventRegistrar = class _DIModuleEventRegistrar extends ModuleEventRegistrar {
  constructor(processJournalDirectoryOnRender, invalidateJournalCacheOnChange, triggerJournalDirectoryReRender, notifications) {
    super(
      processJournalDirectoryOnRender,
      invalidateJournalCacheOnChange,
      triggerJournalDirectoryReRender,
      notifications
    );
  }
};
__name(_DIModuleEventRegistrar, "DIModuleEventRegistrar");
_DIModuleEventRegistrar.dependencies = [
  processJournalDirectoryOnRenderUseCaseToken,
  invalidateJournalCacheOnChangeUseCaseToken,
  triggerJournalDirectoryReRenderUseCaseToken,
  platformNotificationPortToken
];
let DIModuleEventRegistrar = _DIModuleEventRegistrar;
function resolveMultipleServices(container, tokens) {
  const results = [];
  for (const { token, name } of tokens) {
    const result = container.resolveWithError(token);
    if (!result.ok) {
      throw new Error(`Failed to resolve ${name}: ${result.error.message}`);
    }
    results.push(castResolvedService(result.value));
  }
  return results;
}
__name(resolveMultipleServices, "resolveMultipleServices");
function registerEventPorts(container) {
  const eventPortResult = container.registerClass(
    platformJournalEventPortToken,
    DIFoundryJournalEventAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(eventPortResult)) {
    return err(`Failed to register PlatformJournalEventPort: ${eventPortResult.error.message}`);
  }
  const cacheInvalidationUseCaseResult = container.registerClass(
    invalidateJournalCacheOnChangeUseCaseToken,
    DIInvalidateJournalCacheOnChangeUseCase,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(cacheInvalidationUseCaseResult)) {
    return err(
      `Failed to register InvalidateJournalCacheOnChangeUseCase: ${cacheInvalidationUseCaseResult.error.message}`
    );
  }
  const directoryRenderUseCaseResult = container.registerClass(
    processJournalDirectoryOnRenderUseCaseToken,
    DIProcessJournalDirectoryOnRenderUseCase,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(directoryRenderUseCaseResult)) {
    return err(
      `Failed to register ProcessJournalDirectoryOnRenderUseCase: ${directoryRenderUseCaseResult.error.message}`
    );
  }
  const reRenderUseCaseResult = container.registerClass(
    triggerJournalDirectoryReRenderUseCaseToken,
    DITriggerJournalDirectoryReRenderUseCase,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(reRenderUseCaseResult)) {
    return err(
      `Failed to register TriggerJournalDirectoryReRenderUseCase: ${reRenderUseCaseResult.error.message}`
    );
  }
  const hideJournalHandlerResult = container.registerClass(
    hideJournalContextMenuHandlerToken,
    DIHideJournalContextMenuHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(hideJournalHandlerResult)) {
    return err(
      `Failed to register HideJournalContextMenuHandler: ${hideJournalHandlerResult.error.message}`
    );
  }
  const handlersArrayResult = container.registerFactory(
    journalContextMenuHandlersToken,
    () => {
      return resolveMultipleServices(container, [
        { token: hideJournalContextMenuHandlerToken, name: "HideJournalContextMenuHandler" }
      ]);
    },
    ServiceLifecycle.SINGLETON,
    [hideJournalContextMenuHandlerToken]
  );
  if (isErr(handlersArrayResult)) {
    return err(
      `Failed to register JournalContextMenuHandlers array: ${handlersArrayResult.error.message}`
    );
  }
  const contextMenuUseCaseResult = container.registerClass(
    registerContextMenuUseCaseToken,
    DIRegisterContextMenuUseCase,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(contextMenuUseCaseResult)) {
    return err(
      `Failed to register RegisterContextMenuUseCase: ${contextMenuUseCaseResult.error.message}`
    );
  }
  const eventRegistrarResult = container.registerClass(
    moduleEventRegistrarToken,
    DIModuleEventRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(eventRegistrarResult)) {
    return err(`Failed to register ModuleEventRegistrar: ${eventRegistrarResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerEventPorts, "registerEventPorts");
const _FoundryJournalCollectionAdapter = class _FoundryJournalCollectionAdapter {
  constructor(foundryGame) {
    this.foundryGame = foundryGame;
  }
  getAll() {
    const result = this.foundryGame.getJournalEntries();
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "COLLECTION_NOT_AVAILABLE",
          message: `Failed to get journals from Foundry: ${result.error.message}`,
          details: result.error
        }
      };
    }
    const entries2 = result.value.map((foundryEntry) => ({
      id: foundryEntry.id,
      name: foundryEntry.name ?? null
    }));
    return ok(entries2);
  }
  getById(id) {
    const result = this.foundryGame.getJournalEntryById(id);
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: `Failed to get journal ${id} from Foundry: ${result.error.message}`,
          details: result.error
        }
      };
    }
    if (!result.value) {
      return ok(null);
    }
    const entry = {
      id: result.value.id,
      name: result.value.name ?? null
    };
    return ok(entry);
  }
  getByIds(ids) {
    const results = [];
    const errors = [];
    for (const id of ids) {
      const result = this.getById(id);
      if (!result.ok) {
        errors.push(result.error);
      } else if (result.value) {
        results.push(result.value);
      }
    }
    if (errors.length > 0) {
      const firstError = errors[0];
      return err(firstError);
    }
    return ok(results);
  }
  exists(id) {
    const result = this.getById(id);
    if (!result.ok) {
      return result;
    }
    return ok(result.value !== null);
  }
  count() {
    const result = this.getAll();
    if (!result.ok) {
      return {
        ok: false,
        error: result.error
      };
    }
    return ok(result.value.length);
  }
  search(query) {
    const allResult = this.getAll();
    if (!allResult.ok) {
      return allResult;
    }
    let results = allResult.value;
    if (query.filters && query.filters.length > 0) {
      const filters = query.filters;
      results = results.filter((entity) => {
        return filters.every((filter) => {
          const fieldValue = entity[filter.field];
          return this.matchesFilter(fieldValue, filter.operator, filter.value);
        });
      });
    }
    if (query.filterGroups && query.filterGroups.length > 0) {
      const filterGroups = query.filterGroups;
      results = results.filter((entity) => {
        return filterGroups.every((group) => {
          if (group.filters.length === 0) return true;
          if (group.logic === "OR") {
            return group.filters.some((filter) => {
              const fieldValue = entity[filter.field];
              return this.matchesFilter(fieldValue, filter.operator, filter.value);
            });
          } else {
            return group.filters.every((filter) => {
              const fieldValue = entity[filter.field];
              return this.matchesFilter(fieldValue, filter.operator, filter.value);
            });
          }
        });
      });
    }
    if (query.sortBy) {
      const sortBy = query.sortBy;
      results.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === void 0) return 1;
        if (bValue === null || bValue === void 0) return -1;
        const comparison = aValue < bValue ? -1 : 1;
        return query.sortOrder === "desc" ? -comparison : comparison;
      });
    }
    if (query.offset) {
      results = results.slice(query.offset);
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    return ok(results);
  }
  query() {
    return new FoundryJournalQueryBuilder(this);
  }
  matchesFilter(fieldValue, operator, filterValue) {
    switch (operator) {
      case "equals":
        return fieldValue === filterValue;
      case "notEquals":
        return fieldValue !== filterValue;
      case "contains":
        return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case "startsWith":
        return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
      case "endsWith":
        return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
      case "in": {
        if (!Array.isArray(filterValue)) {
          return false;
        }
        const filterArray = filterValue;
        return filterArray.includes(fieldValue);
      }
      case "notIn": {
        if (!Array.isArray(filterValue)) {
          return false;
        }
        const filterArray = filterValue;
        return !filterArray.includes(fieldValue);
      }
      case "greaterThan":
        return Number(fieldValue) > Number(filterValue);
      case "lessThan":
        return Number(fieldValue) < Number(filterValue);
      case "greaterThanOrEqual":
        return Number(fieldValue) >= Number(filterValue);
      case "lessThanOrEqual":
        return Number(fieldValue) <= Number(filterValue);
      default:
        return false;
    }
  }
};
__name(_FoundryJournalCollectionAdapter, "FoundryJournalCollectionAdapter");
let FoundryJournalCollectionAdapter = _FoundryJournalCollectionAdapter;
const _FoundryJournalQueryBuilder = class _FoundryJournalQueryBuilder {
  constructor(adapter) {
    this.adapter = adapter;
    this.query = {};
    this.currentOrGroup = null;
  }
  where(field, operator, value2) {
    if (this.currentOrGroup !== null) {
      this.currentOrGroup.push({ field, operator, value: value2 });
      return this;
    }
    this.closeOrGroup();
    if (!this.query.filters) {
      this.query.filters = [];
    }
    this.query.filters.push({ field, operator, value: value2 });
    return this;
  }
  orWhere(field, operator, value2) {
    if (this.currentOrGroup === null) {
      this.currentOrGroup = [];
      if (this.query.filters && this.query.filters.length > 0) {
        const lastFilter = this.query.filters.pop();
        this.currentOrGroup.push({
          field: lastFilter.field,
          operator: lastFilter.operator,
          value: lastFilter.value
        });
      }
    }
    this.currentOrGroup.push({ field, operator, value: value2 });
    return this;
  }
  or(callback) {
    this.closeOrGroup();
    const orGroup = [];
    if (this.query.filters && this.query.filters.length > 0) {
      const lastFilter = this.query.filters.pop();
      orGroup.push({
        field: lastFilter.field,
        operator: lastFilter.operator,
        value: lastFilter.value
      });
    }
    const originalOrGroup = this.currentOrGroup;
    this.currentOrGroup = orGroup;
    callback(this);
    this.currentOrGroup = originalOrGroup;
    if (orGroup.length > 0) {
      if (!this.query.filterGroups) {
        this.query.filterGroups = [];
      }
      this.query.filterGroups.push({
        logic: "OR",
        filters: orGroup.map((f) => ({ field: f.field, operator: f.operator, value: f.value }))
      });
    }
    return this;
  }
  and(callback) {
    this.closeOrGroup();
    const andGroup = [];
    const originalFilters = this.query.filters;
    this.query.filters = andGroup;
    callback(this);
    if (originalFilters !== void 0) {
      this.query.filters = originalFilters;
    } else {
      delete this.query.filters;
    }
    if (andGroup.length > 0) {
      if (!this.query.filterGroups) {
        this.query.filterGroups = [];
      }
      this.query.filterGroups.push({
        logic: "AND",
        filters: andGroup.map((f) => ({ field: f.field, operator: f.operator, value: f.value }))
      });
    }
    return this;
  }
  limit(count) {
    this.closeOrGroup();
    this.query.limit = count;
    return this;
  }
  offset(count) {
    this.closeOrGroup();
    this.query.offset = count;
    return this;
  }
  sortBy(field, order) {
    this.closeOrGroup();
    this.query.sortBy = field;
    this.query.sortOrder = order;
    return this;
  }
  execute() {
    this.closeOrGroup();
    return this.adapter.search(this.query);
  }
  /**
   * Closes the current OR group and adds it to filterGroups.
   * Called automatically before where(), limit(), offset(), sortBy(), execute().
   */
  closeOrGroup() {
    if (this.currentOrGroup && this.currentOrGroup.length > 0) {
      if (!this.query.filterGroups) {
        this.query.filterGroups = [];
      }
      this.query.filterGroups.push({
        logic: "OR",
        filters: this.currentOrGroup.map((f) => ({
          field: f.field,
          operator: f.operator,
          value: f.value
        }))
      });
      this.currentOrGroup = null;
    }
  }
};
__name(_FoundryJournalQueryBuilder, "FoundryJournalQueryBuilder");
let FoundryJournalQueryBuilder = _FoundryJournalQueryBuilder;
const _DIFoundryJournalCollectionAdapter = class _DIFoundryJournalCollectionAdapter extends FoundryJournalCollectionAdapter {
  // foundryGameToken → FoundryGamePort (version-agnostisch)
  constructor(foundryGame) {
    super(foundryGame);
  }
};
__name(_DIFoundryJournalCollectionAdapter, "DIFoundryJournalCollectionAdapter");
_DIFoundryJournalCollectionAdapter.dependencies = [foundryGameToken];
let DIFoundryJournalCollectionAdapter = _DIFoundryJournalCollectionAdapter;
const _JournalTypeMapper = class _JournalTypeMapper {
  /**
   * Maps a Foundry journal entry to a domain journal entry.
   *
   * Conversion rules:
   * - `id` is copied as-is
   * - `name` is converted: `undefined` → `null` (domain requires `string | null`)
   *
   * @param foundry - The Foundry journal entry
   * @returns The domain journal entry
   */
  mapFoundryToDomain(foundry) {
    return {
      id: foundry.id,
      name: foundry.name ?? null
    };
  }
  /**
   * Maps a domain journal entry to a Foundry journal entry structure.
   *
   * Note: This is primarily for data transformation purposes.
   * For creating Foundry documents, use FoundryDocument.create() directly.
   *
   * @param domain - The domain journal entry
   * @returns A Foundry-compatible journal entry structure
   */
  mapDomainToFoundry(domain) {
    const result = {
      id: domain.id
    };
    if (domain.name !== null) {
      result.name = domain.name;
    }
    return result;
  }
};
__name(_JournalTypeMapper, "JournalTypeMapper");
let JournalTypeMapper = _JournalTypeMapper;
const _FoundryJournalRepositoryAdapter = class _FoundryJournalRepositoryAdapter {
  constructor(collection, foundryGame, foundryDocument) {
    this.collection = collection;
    this.foundryGame = foundryGame;
    this.foundryDocument = foundryDocument;
    this.typeMapper = new JournalTypeMapper();
  }
  // ===== Collection Methods (delegate to collection adapter) =====
  getAll() {
    return this.collection.getAll();
  }
  getById(id) {
    return this.collection.getById(id);
  }
  getByIds(ids) {
    return this.collection.getByIds(ids);
  }
  exists(id) {
    return this.collection.exists(id);
  }
  count() {
    return this.collection.count();
  }
  search(query) {
    return this.collection.search(query);
  }
  query() {
    return this.collection.query();
  }
  // ===== CREATE Operations =====
  async create(data) {
    const journalEntryClassResult = castFoundryJournalEntryClass();
    if (!journalEntryClassResult.ok) {
      return err({
        code: "PLATFORM_ERROR",
        message: `Foundry JournalEntry class not available: ${journalEntryClassResult.error.message}`,
        details: journalEntryClassResult.error
      });
    }
    const JournalEntryClass = journalEntryClassResult.value;
    try {
      const createResult = await this.foundryDocument.create(JournalEntryClass, data);
      if (!createResult.ok) {
        return err({
          code: "OPERATION_FAILED",
          message: `Failed to create journal: ${createResult.error.message}`,
          details: createResult.error
        });
      }
      const foundryEntry = castCreatedJournalEntry(createResult.value);
      const createdEntry = this.typeMapper.mapFoundryToDomain(foundryEntry);
      return ok(createdEntry);
    } catch (error) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to create journal: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      });
    }
  }
  async createMany(data) {
    const results = [];
    const errors = [];
    for (const item of data) {
      const result = await this.create(item);
      if (result.ok) {
        results.push(result.value);
      } else {
        errors.push(result.error);
      }
    }
    if (errors.length > 0) {
      const firstError = errors[0];
      return err(firstError);
    }
    return ok(results);
  }
  // ===== UPDATE Operations =====
  async update(id, changes) {
    const currentResult = this.getById(id);
    if (!currentResult.ok) {
      return {
        ok: false,
        error: {
          code: "ENTITY_NOT_FOUND",
          message: `Journal ${id} not found`,
          details: currentResult.error
        }
      };
    }
    if (!currentResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`
      });
    }
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found in Foundry`
      });
    }
    const foundryEntry = foundryResult.value;
    const updateData = {};
    if (changes.name !== void 0) {
      if (changes.name === null) {
        updateData["name.-="] = null;
      } else {
        updateData.name = changes.name;
      }
    }
    const docWithUpdateResult = castFoundryDocumentWithUpdate(
      foundryEntry
    );
    if (!docWithUpdateResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Document does not support update: ${docWithUpdateResult.error.message}`,
        details: docWithUpdateResult.error
      });
    }
    const updateResult = await this.foundryDocument.update(docWithUpdateResult.value, updateData);
    if (!updateResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to update journal ${id}: ${updateResult.error.message}`,
        details: updateResult.error
      });
    }
    const updatedResult = this.getById(id);
    if (!updatedResult.ok || !updatedResult.value) {
      return err({
        code: "OPERATION_FAILED",
        message: "Failed to retrieve updated journal"
      });
    }
    return ok(updatedResult.value);
  }
  async updateMany(updates) {
    const results = [];
    const errors = [];
    for (const update of updates) {
      const result = await this.update(update.id, update.changes);
      if (result.ok) {
        results.push(result.value);
      } else {
        errors.push(result.error);
      }
    }
    if (errors.length > 0) {
      const firstError = errors[0];
      return err(firstError);
    }
    return ok(results);
  }
  async patch(id, partial2) {
    return this.update(id, partial2);
  }
  async upsert(id, data) {
    const existsResult = this.exists(id);
    if (!existsResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to check if journal ${id} exists`,
        details: existsResult.error
      });
    }
    if (existsResult.value) {
      return this.update(id, data);
    } else {
      return this.create({ ...data, id });
    }
  }
  // ===== DELETE Operations =====
  async delete(id) {
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`
      });
    }
    const deleteResult = await this.foundryDocument.delete(foundryResult.value);
    if (!deleteResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to delete journal ${id}: ${deleteResult.error.message}`,
        details: deleteResult.error
      });
    }
    return ok(void 0);
  }
  async deleteMany(ids) {
    const errors = [];
    for (const id of ids) {
      const result = await this.delete(id);
      if (!result.ok) {
        errors.push(result.error);
      }
    }
    if (errors.length > 0) {
      const firstError = errors[0];
      return err(firstError);
    }
    return ok(void 0);
  }
  // ===== Flag Convenience Methods =====
  getFlag(id, scope, key) {
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`
      });
    }
    const foundryEntry = foundryResult.value;
    const documentResult = castFoundryDocumentForFlag(foundryEntry);
    if (!documentResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Document does not support flags: ${documentResult.error.message}`,
        details: documentResult.error
      });
    }
    const flagResult = this.foundryDocument.getFlag(documentResult.value, scope, key, /* @__PURE__ */ unknown());
    if (!flagResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to get flag ${scope}.${key}: ${flagResult.error.message}`,
        details: flagResult.error
      });
    }
    return ok(flagResult.value);
  }
  async setFlag(id, scope, key, value2) {
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`
      });
    }
    const foundryEntry = foundryResult.value;
    const documentResult = castFoundryDocumentForFlag(foundryEntry);
    if (!documentResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Document does not support flags: ${documentResult.error.message}`,
        details: documentResult.error
      });
    }
    const flagResult = await this.foundryDocument.setFlag(documentResult.value, scope, key, value2);
    if (!flagResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to set flag ${scope}.${key}: ${flagResult.error.message}`,
        details: flagResult.error
      });
    }
    return ok(void 0);
  }
  async unsetFlag(id, scope, key) {
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`
      });
    }
    const foundryEntry = foundryResult.value;
    const documentResult = castFoundryDocumentForFlag(foundryEntry);
    if (!documentResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Document does not support flags: ${documentResult.error.message}`,
        details: documentResult.error
      });
    }
    const unsetResult = await this.foundryDocument.unsetFlag(documentResult.value, scope, key);
    if (!unsetResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to unset flag ${scope}.${key}: ${unsetResult.error.message}`,
        details: unsetResult.error
      });
    }
    return ok(void 0);
  }
};
__name(_FoundryJournalRepositoryAdapter, "FoundryJournalRepositoryAdapter");
let FoundryJournalRepositoryAdapter = _FoundryJournalRepositoryAdapter;
const _DIFoundryJournalRepositoryAdapter = class _DIFoundryJournalRepositoryAdapter extends FoundryJournalRepositoryAdapter {
  constructor(foundryGame, foundryDocument) {
    const collection = new FoundryJournalCollectionAdapter(foundryGame);
    super(collection, foundryGame, foundryDocument);
  }
};
__name(_DIFoundryJournalRepositoryAdapter, "DIFoundryJournalRepositoryAdapter");
_DIFoundryJournalRepositoryAdapter.dependencies = [foundryGameToken, foundryDocumentToken];
let DIFoundryJournalRepositoryAdapter = _DIFoundryJournalRepositoryAdapter;
function registerEntityPorts(container) {
  const collectionResult = container.registerClass(
    platformJournalCollectionPortToken,
    DIFoundryJournalCollectionAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(collectionResult)) {
    return err(
      `Failed to register PlatformJournalCollectionPort: ${collectionResult.error.message}`
    );
  }
  const repositoryResult = container.registerClass(
    platformJournalRepositoryToken,
    DIFoundryJournalRepositoryAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(repositoryResult)) {
    return err(`Failed to register PlatformJournalRepository: ${repositoryResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerEntityPorts, "registerEntityPorts");
const _FoundrySettingsAdapter = class _FoundrySettingsAdapter {
  constructor(foundrySettings) {
    this.foundrySettings = foundrySettings;
  }
  /**
   * Register a setting in Foundry.
   *
   * Maps platform config → Foundry config.
   */
  register(namespace, key, config2) {
    const typeResult = this.mapSettingType(config2.type);
    if (!typeResult.ok) {
      return {
        ok: false,
        error: typeResult.error
      };
    }
    const foundryConfig = {
      name: config2.name,
      ...config2.hint !== void 0 && { hint: config2.hint },
      scope: config2.scope,
      config: config2.config,
      type: typeResult.value,
      ...config2.choices !== void 0 && { choices: config2.choices },
      default: config2.default,
      ...config2.onChange !== void 0 && { onChange: config2.onChange }
    };
    const result = this.foundrySettings.register(namespace, key, foundryConfig);
    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryErrorToSettingsError(result.error, "register", namespace, key)
      };
    }
    return { ok: true, value: void 0 };
  }
  /**
   * Get setting value from Foundry with validation.
   *
   * Uses Valibot schema to validate at runtime.
   */
  get(namespace, key, schema) {
    const result = this.foundrySettings.get(namespace, key, schema);
    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryErrorToSettingsError(result.error, "get", namespace, key)
      };
    }
    return { ok: true, value: result.value };
  }
  /**
   * Set setting value in Foundry.
   *
   * Persists to Foundry's database and triggers onChange.
   */
  async set(namespace, key, value2) {
    const result = await this.foundrySettings.set(namespace, key, value2);
    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryErrorToSettingsError(result.error, "set", namespace, key)
      };
    }
    return { ok: true, value: void 0 };
  }
  // ===== Private Helpers =====
  /**
   * Map platform type to Foundry type.
   *
   * Handles both constructor types and string types.
   * Returns Result to comply with Result-Pattern instead of throwing exceptions.
   */
  mapSettingType(type) {
    if (type === "String" || type === String) {
      return { ok: true, value: String };
    }
    if (type === "Number" || type === Number) {
      return { ok: true, value: Number };
    }
    if (type === "Boolean" || type === Boolean) {
      return { ok: true, value: Boolean };
    }
    return {
      ok: false,
      error: {
        code: "SETTING_REGISTRATION_FAILED",
        message: `Unknown setting type: ${type}. Supported types are: String, Number, Boolean`,
        details: { type }
      }
    };
  }
  /**
   * Maps FoundryError to SettingsError.
   *
   * Maps Foundry-specific error codes to platform-agnostic settings error codes.
   */
  mapFoundryErrorToSettingsError(foundryError, operation, namespace, key) {
    let code;
    switch (foundryError.code) {
      case "API_NOT_AVAILABLE":
        code = "PLATFORM_NOT_AVAILABLE";
        break;
      case "VALIDATION_FAILED":
        code = "SETTING_VALIDATION_FAILED";
        break;
      case "OPERATION_FAILED":
        if (operation === "register") {
          code = "SETTING_REGISTRATION_FAILED";
        } else {
          const message2 = foundryError.message.toLowerCase();
          if (message2.includes("not registered") || message2.includes("not found")) {
            code = "SETTING_NOT_REGISTERED";
          } else {
            code = "SETTING_VALIDATION_FAILED";
          }
        }
        break;
      default:
        code = operation === "register" ? "SETTING_REGISTRATION_FAILED" : "SETTING_VALIDATION_FAILED";
    }
    return {
      code,
      message: `Failed to ${operation} setting "${namespace}.${key}": ${foundryError.message}`,
      details: foundryError
    };
  }
};
__name(_FoundrySettingsAdapter, "FoundrySettingsAdapter");
let FoundrySettingsAdapter = _FoundrySettingsAdapter;
const _DIFoundrySettingsAdapter = class _DIFoundrySettingsAdapter extends FoundrySettingsAdapter {
  constructor(foundrySettings) {
    super(foundrySettings);
  }
};
__name(_DIFoundrySettingsAdapter, "DIFoundrySettingsAdapter");
_DIFoundrySettingsAdapter.dependencies = [foundrySettingsToken];
let DIFoundrySettingsAdapter = _DIFoundrySettingsAdapter;
function registerSettingsPorts(container) {
  const settingsPortResult = container.registerClass(
    platformSettingsPortToken,
    DIFoundrySettingsAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsPortResult)) {
    return err(`Failed to register PlatformSettingsPort: ${settingsPortResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerSettingsPorts, "registerSettingsPorts");
const KEY_SEPARATOR = ":";
function normalizeSegment(segment) {
  return segment.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase();
}
__name(normalizeSegment, "normalizeSegment");
function createCacheKey(parts, moduleId) {
  const { namespace, resource, identifier } = parts;
  const payload = [moduleId, namespace, resource];
  if (identifier !== null && identifier !== void 0) {
    payload.push(String(identifier));
  }
  return assertCacheKey(payload.map(normalizeSegment).join(KEY_SEPARATOR));
}
__name(createCacheKey, "createCacheKey");
function createCacheNamespace(namespace, moduleId) {
  const normalizedNamespace = normalizeSegment(namespace);
  return (resource, identifier) => identifier === void 0 ? createCacheKey({ namespace: normalizedNamespace, resource }, moduleId) : createCacheKey({ namespace: normalizedNamespace, resource, identifier }, moduleId);
}
__name(createCacheNamespace, "createCacheNamespace");
function registerJournalVisibilityConfig(container) {
  const buildCacheKey = createCacheNamespace("journal-visibility", MODULE_METADATA.ID);
  const cacheKeyFactory = /* @__PURE__ */ __name((resource) => {
    return buildCacheKey(resource);
  }, "cacheKeyFactory");
  const config2 = {
    moduleNamespace: MODULE_METADATA.ID,
    hiddenFlagKey: DOMAIN_FLAGS.HIDDEN,
    unknownName: APP_DEFAULTS.UNKNOWN_NAME,
    cacheKeyFactory
  };
  const configResult = container.registerValue(journalVisibilityConfigToken, config2);
  if (isErr(configResult)) {
    return err(`Failed to register JournalVisibilityConfig: ${configResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerJournalVisibilityConfig, "registerJournalVisibilityConfig");
function registerStaticValues(container) {
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }
  const runtimeConfigAdapter = new RuntimeConfigAdapter(ENV);
  const runtimeConfigResult = container.registerValue(runtimeConfigToken, runtimeConfigAdapter);
  if (isErr(runtimeConfigResult)) {
    return err(`Failed to register RuntimeConfigAdapter: ${runtimeConfigResult.error.message}`);
  }
  const containerResult = container.registerValue(serviceContainerToken, container);
  if (isErr(containerResult)) {
    return err(`Failed to register ServiceContainer: ${containerResult.error.message}`);
  }
  const aliasResult = container.registerAlias(
    platformContainerPortToken,
    castContainerTokenToPlatformContainerPortToken(serviceContainerToken)
  );
  if (isErr(aliasResult)) {
    return err(`Failed to register PlatformContainerPort alias: ${aliasResult.error.message}`);
  }
  const moduleIdResult = container.registerValue(moduleIdToken, MODULE_METADATA.ID);
  if (isErr(moduleIdResult)) {
    return err(`Failed to register ModuleId: ${moduleIdResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerStaticValues, "registerStaticValues");
function registerSubcontainerValues(container) {
  return registerPortRegistries(container);
}
__name(registerSubcontainerValues, "registerSubcontainerValues");
function registerLoopPreventionServices(container) {
  const containerCheckResult = container.registerClass(
    containerHealthCheckToken,
    DIContainerHealthCheck,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(containerCheckResult)) {
    return err(`Failed to register ContainerHealthCheck: ${containerCheckResult.error.message}`);
  }
  const metricsCheckResult = container.registerClass(
    metricsHealthCheckToken,
    DIMetricsHealthCheck,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(metricsCheckResult)) {
    return err(`Failed to register MetricsHealthCheck: ${metricsCheckResult.error.message}`);
  }
  return ok(void 0);
}
__name(registerLoopPreventionServices, "registerLoopPreventionServices");
function initializeLoopPreventionValues(container) {
  const registryRes = container.resolveWithError(healthCheckRegistryToken);
  const metricsRes = container.resolveWithError(metricsCollectorToken);
  if (!registryRes.ok) {
    return err(`Failed to resolve HealthCheckRegistry: ${registryRes.error.message}`);
  }
  if (!metricsRes.ok) {
    return err(`Failed to resolve MetricsCollector: ${metricsRes.error.message}`);
  }
  const containerCheckResult = container.resolveWithError(containerHealthCheckToken);
  if (!containerCheckResult.ok) {
    return err(`Failed to resolve ContainerHealthCheck: ${containerCheckResult.error.message}`);
  }
  const metricsCheckResult = container.resolveWithError(metricsHealthCheckToken);
  if (!metricsCheckResult.ok) {
    return err(`Failed to resolve MetricsHealthCheck: ${metricsCheckResult.error.message}`);
  }
  return ok(void 0);
}
__name(initializeLoopPreventionValues, "initializeLoopPreventionValues");
function validateContainer(container) {
  const validateResult = container.validate();
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }
  return ok(void 0);
}
__name(validateContainer, "validateContainer");
function configureDependencies(container) {
  const staticValuesResult = registerStaticValues(container);
  if (isErr(staticValuesResult)) return staticValuesResult;
  const coreResult = registerCoreServices(container);
  if (isErr(coreResult)) return coreResult;
  const observabilityResult = registerObservability(container);
  if (isErr(observabilityResult)) return observabilityResult;
  const utilityResult = registerUtilityServices(container);
  if (isErr(utilityResult)) return utilityResult;
  const cacheServiceResult = registerCacheServices(container);
  if (isErr(cacheServiceResult)) return cacheServiceResult;
  const portInfraResult = registerPortInfrastructure(container);
  if (isErr(portInfraResult)) return portInfraResult;
  const subcontainerValuesResult = registerSubcontainerValues(container);
  if (isErr(subcontainerValuesResult)) return subcontainerValuesResult;
  const foundryServicesResult = registerFoundryServices(container);
  if (isErr(foundryServicesResult)) return foundryServicesResult;
  const settingsPortsResult = registerSettingsPorts(container);
  if (isErr(settingsPortsResult)) return settingsPortsResult;
  const entityPortsResult = registerEntityPorts(container);
  if (isErr(entityPortsResult)) return entityPortsResult;
  const journalVisibilityConfigResult = registerJournalVisibilityConfig(container);
  if (isErr(journalVisibilityConfigResult)) return journalVisibilityConfigResult;
  const i18nServicesResult = registerI18nServices(container);
  if (isErr(i18nServicesResult)) return i18nServicesResult;
  const notificationsResult = registerNotifications(container);
  if (isErr(notificationsResult)) return notificationsResult;
  const eventPortsResult = registerEventPorts(container);
  if (isErr(eventPortsResult)) return eventPortsResult;
  const registrarsResult = registerRegistrars(container);
  if (isErr(registrarsResult)) return registrarsResult;
  const loopServiceResult = registerLoopPreventionServices(container);
  if (isErr(loopServiceResult)) return loopServiceResult;
  const validationResult = validateContainer(container);
  if (isErr(validationResult)) return validationResult;
  const loopPreventionInitResult = initializeLoopPreventionValues(container);
  if (isErr(loopPreventionInitResult)) return loopPreventionInitResult;
  const cacheConfigSyncInitResult = initializeCacheConfigSync(container);
  if (isErr(cacheConfigSyncInitResult)) return cacheConfigSyncInitResult;
  return ok(void 0);
}
__name(configureDependencies, "configureDependencies");
const _DependencyConfigurator = class _DependencyConfigurator {
  /**
   * Configures all dependencies in the given container.
   *
   * @param container - The service container to configure
   * @returns Result indicating success or configuration errors
   */
  configure(container) {
    return configureDependencies(container);
  }
};
__name(_DependencyConfigurator, "DependencyConfigurator");
let DependencyConfigurator = _DependencyConfigurator;
const _CompositionRoot = class _CompositionRoot {
  /**
   * Creates a new CompositionRoot instance.
   *
   * @param containerFactory - Factory for creating containers (defaults to ContainerFactory)
   * @param dependencyConfigurator - Configurator for setting up dependencies (defaults to DependencyConfigurator)
   * @param performanceTracker - Optional performance tracker (created internally if not provided)
   * @param errorHandler - Optional error handler (defaults to BootstrapErrorHandler)
   */
  constructor(containerFactory, dependencyConfigurator, performanceTracker, errorHandler = BootstrapErrorHandler) {
    this.container = null;
    this.containerFactory = containerFactory ?? new ContainerFactory();
    this.dependencyConfigurator = dependencyConfigurator ?? new DependencyConfigurator();
    this.performanceTracker = performanceTracker ?? new BootstrapPerformanceTracker(createRuntimeConfig(ENV), null);
    this.errorHandler = errorHandler;
  }
  /**
   * Erstellt den ServiceContainer und führt Basis-Registrierungen aus.
   * Misst Performance für Diagnose-Zwecke.
   *
   * **Coordination Flow:**
   * 1. ContainerFactory creates container
   * 2. BootstrapPerformanceTracker tracks performance
   * 3. DependencyConfigurator configures dependencies
   * 4. BootstrapErrorHandler handles errors if needed
   *
   * **Performance Tracking:**
   * Uses BootstrapPerformanceTracker with ENV (direct import) and null MetricsCollector.
   * MetricsCollector is not yet available during bootstrap phase.
   *
   * @returns Result mit initialisiertem Container oder Fehlermeldung
   */
  bootstrap() {
    const container = this.containerFactory.createRoot(ENV);
    const configured = this.performanceTracker.track(
      () => this.dependencyConfigurator.configure(container),
      (duration) => {
        const loggerResult = container.resolveWithError(loggerToken);
        if (loggerResult.ok) {
          const logger = castResolvedService(loggerResult.value);
          logger.debug(`Bootstrap completed in ${duration.toFixed(2)}ms`);
        }
      }
    );
    if (configured.ok) {
      this.container = container;
      return { ok: true, value: container };
    }
    this.errorHandler.logError(configured.error, {
      phase: "bootstrap",
      component: "CompositionRoot",
      metadata: { error: configured.error }
    });
    return { ok: false, error: configured.error };
  }
  /**
   * Liefert den initialisierten Container als Result.
   * @returns Result mit Container oder Fehlermeldung
   */
  getContainer() {
    if (!this.container) {
      return { ok: false, error: `${LOG_PREFIX} Container not initialized` };
    }
    return { ok: true, value: this.container };
  }
};
__name(_CompositionRoot, "CompositionRoot");
let CompositionRoot = _CompositionRoot;
function initializeFoundryModule() {
  const containerResult = root.getContainer();
  if (!containerResult.ok) {
    console.error(`${LOG_PREFIX} ${containerResult.error}`);
    return;
  }
  const loggerResult = containerResult.value.resolveWithError(loggerToken);
  if (!loggerResult.ok) {
    console.error(`${LOG_PREFIX} Failed to resolve logger: ${loggerResult.error.message}`);
    return;
  }
  const logger = castResolvedService(loggerResult.value);
  const initHookServiceResult = containerResult.value.resolveWithError(
    bootstrapInitHookServiceToken
  );
  if (!initHookServiceResult.ok) {
    logger.error(
      `Failed to resolve BootstrapInitHookService: ${initHookServiceResult.error.message}`
    );
    return;
  }
  const initHookService = castResolvedService(
    initHookServiceResult.value
  );
  initHookService.register();
  const readyHookServiceResult = containerResult.value.resolveWithError(
    bootstrapReadyHookServiceToken
  );
  if (!readyHookServiceResult.ok) {
    logger.error(
      `Failed to resolve BootstrapReadyHookService: ${readyHookServiceResult.error.message}`
    );
    return;
  }
  const readyHookService = castResolvedService(
    readyHookServiceResult.value
  );
  readyHookService.register();
}
__name(initializeFoundryModule, "initializeFoundryModule");
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
const bootstrapOk = isOk(bootstrapResult);
function getRootContainer() {
  return root.getContainer();
}
__name(getRootContainer, "getRootContainer");
if (!bootstrapOk) {
  const foundryVersion = tryGetFoundryVersion();
  BootstrapErrorHandler.logError(bootstrapResult.error, {
    phase: "bootstrap",
    component: "CompositionRoot",
    metadata: {
      foundryVersion
    }
  });
  let isOldFoundryVersion = false;
  if (typeof bootstrapResult.error === "string" && bootstrapResult.error.includes("PORT_SELECTION_FAILED")) {
    if (foundryVersion !== void 0 && foundryVersion < 13) {
      isOldFoundryVersion = true;
      if (typeof ui !== "undefined" && ui?.notifications) {
        ui.notifications.error(
          `${MODULE_METADATA.NAME} benötigt mindestens Foundry VTT Version 13. Ihre Version: ${foundryVersion}. Bitte aktualisieren Sie Foundry VTT.`,
          { permanent: true }
        );
      }
    }
  }
  if (!isOldFoundryVersion && typeof ui !== "undefined" && ui?.notifications) {
    ui.notifications?.error(
      `${MODULE_METADATA.NAME} failed to initialize. Check console for details.`,
      { permanent: true }
    );
  }
} else {
  initializeFoundryModule();
}
//# sourceMappingURL=fvtt_relationship_app_module.js.map
