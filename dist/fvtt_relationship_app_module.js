var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
Object.assign = function(target, ...sources) {
  for (const source of sources) {
    if (source != null) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key) && key !== "equals") {
          try {
            target[key] = source[key];
          } catch {
          }
        }
      }
    }
  }
  return target;
};
const MODULE_CONSTANTS = {
  MODULE: {
    ID: "fvtt_relationship_app_module",
    NAME: "Beziehungsnetzwerke für Foundry",
    AUTHOR: "Andreas Rothe",
    AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
    AUTHOR_DISCORD: "lewellyen"
  },
  LOG_PREFIX: "Foundry VTT Relationship App Module |"
};
function ok(value) {
  return { ok: true, value };
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
function map(result, transform) {
  return result.ok ? ok(transform(result.value)) : result;
}
__name(map, "map");
function mapError(result, transform) {
  return result.ok ? result : err(transform(result.error));
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
function unwrapOrElse(result, getFallback) {
  return result.ok ? result.value : getFallback(result.error);
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
async function asyncMap(asyncResult, transform) {
  const result = await asyncResult;
  return result.ok ? ok(await transform(result.value)) : result;
}
__name(asyncMap, "asyncMap");
async function asyncAndThen(asyncResult, next) {
  const result = await asyncResult;
  return result.ok ? next(result.value) : result;
}
__name(asyncAndThen, "asyncAndThen");
async function fromPromise(promise, mapUnknownError) {
  try {
    return ok(await promise);
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
function getHiddenJournalEntries() {
  return tryCatch(
    () => {
      if (!game?.journal) {
        throw new Error("game.journal is not available");
      }
      return game.journal.filter(
        (j) => j.getFlag(MODULE_CONSTANTS.MODULE.ID, "hidden") === true
      );
    },
    (error) => `Failed to get hidden journal entries: ${error}`
  );
}
__name(getHiddenJournalEntries, "getHiddenJournalEntries");
function removeJournalElement(journalId, journalName, html) {
  const element = html.querySelector(
    `li.directory-item[data-entry-id="${journalId}"]`
  );
  if (!element) {
    return err(`Could not find element for journal entry: ${journalName} (${journalId})`);
  }
  element.remove();
  return ok(void 0);
}
__name(removeJournalElement, "removeJournalElement");
Hooks.on("init", () => {
  console.log(`${MODULE_CONSTANTS.LOG_PREFIX} init`);
  Hooks.on("renderJournalDirectory", (app, html) => {
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} renderJournalDirectory fired`, app);
    const hiddenResult = getHiddenJournalEntries();
    match(hiddenResult, {
      onOk: /* @__PURE__ */ __name((hidden) => {
        console.debug(
          `${MODULE_CONSTANTS.LOG_PREFIX} Found ${hidden.length} hidden journal entries`
        );
        for (const journal of hidden) {
          const removeResult = removeJournalElement(journal.id, journal.name, html);
          match(removeResult, {
            onOk: /* @__PURE__ */ __name(() => {
              console.debug(
                `${MODULE_CONSTANTS.LOG_PREFIX} Removing journal entry: ${journal.name}`
              );
            }, "onOk"),
            onErr: /* @__PURE__ */ __name((error) => {
              console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${error}`);
            }, "onErr")
          });
        }
      }, "onOk"),
      onErr: /* @__PURE__ */ __name((error) => {
        console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${error}`);
      }, "onErr")
    });
  });
});
Hooks.on("ready", () => {
  console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ready`);
});
//# sourceMappingURL=fvtt_relationship_app_module.js.map
