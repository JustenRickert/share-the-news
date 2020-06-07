export function assert(condition, message, errorInformation) {
  if (!condition) {
    console.error(errorInformation);
    throw new Error(message);
  }
}

export function update(o, key, fnOrValue) {
  if (typeof key === "string") key = key.split(".");
  if (key.length === 0)
    return fnOrValue instanceof Function ? fnOrValue(o) : fnOrValue;
  const updated = update(o[key[0]], key.slice(1), fnOrValue);
  if (Array.isArray(o))
    return [...o.slice(0, key[0]), updated, ...o.slice(key[0] + 1)];
  return {
    ...o,
    [key[0]]: updated
  };
}

export function updateAll(o, ...keyFns) {
  return keyFns.reduce((o, [key, fn]) => update(o, key, fn), o);
}

export function get(o, key) {
  if (typeof key === "string") key = key.split(".");
  if (key.length === 0) return o;
  return get(o[key[0]], key.slice(1));
}

export function set(o, key, value) {
  if (typeof key === "string") key = key.split(".");
  if (key.length === 0) return value;
  if (o === undefined) o = {};
  return {
    ...o,
    [key[0]]: set(o[key[0]], key.slice(1), value)
  };
}

export function setAll(o, ...keyValues) {
  return keyValues.reduce((o, [key, value]) => set(o, key, value), o);
}

export function first(xs) {
  return xs[0];
}

export function last(xs) {
  return xs[xs.length - 1];
}

export function tap() {
  const args = Array.from(arguments);
  console.log(args);
  return last(args);
}

export function tapError() {
  const args = Array.from(arguments);
  console.error(args);
  return last(args);
}

export function cases(...args) {
  return x => {
    for (const [condition, result] of args) {
      if (x === condition) return result;
    }
    throw new Error("case not handled");
  };
}

export function cond(...args) {
  return (...xs) => {
    for (const [predicate, resultFn] of args) {
      if (predicate(...xs)) return resultFn(...xs);
    }
    throw new Error("case not handled");
  };
}
