export function assert(condition, message, errorInformation) {
  if (!condition) {
    console.error(errorInformation);
    throw new Error(message);
  }
}

/**
 * @template O
 * @param {O} o
 * @returns {O}
 */
export function update(o, ...pathFnOrValue) {
  const key = butlast(pathFnOrValue);
  const fnOrValue = last(pathFnOrValue);
  if (key.length === 0)
    return fnOrValue instanceof Function ? fnOrValue(o) : fnOrValue;
  const updated = update(o[key[0]], ...key.slice(1), fnOrValue);
  if (Array.isArray(o))
    return [...o.slice(0, key[0]), updated, ...o.slice(key[0] + 1)];
  return {
    ...o,
    [key[0]]: updated
  };
}

function updateUpduce(o, key, fnOrValue) {
  if (!key.length)
    return fnOrValue instanceof Function ? fnOrValue(o) : fnOrValue;
  return {
    ...o,
    [key[0]]: updateUpduce(o[key[0]], key.slice(1), fnOrValue)
  };
}

/**
 * @template T
 * @returns {(t: T) => T}
 */
export function upduce(...pathFnOrValues) {
  return o => {
    for (const pathFnOrValue of pathFnOrValues) {
      const key = butlast(pathFnOrValue);
      const fnOrValue = last(pathFnOrValue);
      o = updateUpduce(o, key, fnOrValue);
    }
    return o;
  };
}

export function butlast(xs) {
  return xs.slice(0, -1);
}

function updateMergeOne(o, mergePath) {
  if (mergePath.length === 1) return Object.assign({}, o, last(mergePath));
  else
    return {
      ...o,
      [first(mergePath)]: updateMerge(o[first(mergePath)], mergePath.slice(1))
    };
}

export function updateMerge(o, ...mergePaths) {
  return mergePaths.reduce((o, mergePath) => updateMergeOne(o, mergePath), o);
}

export function not(predicate) {
  return (...args) => !predicate(...args);
}

export function updateAll(o, ...keyFns) {
  return keyFns.reduce((o, [key, fn]) => update(o, key, fn), o);
}

export function get(o, key) {
  if (typeof key === "string") key = [key];
  if (key.length === 0) return o;
  return get(o[key[0]], key.slice(1));
}

export function set(o, key, value) {
  if (typeof key === "string") key = [key];
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

export function omit(o, keys) {
  return Object.keys(o)
    .filter(k => !keys.includes(k))
    .reduce(
      (o, k) => ({
        [k]: o[k]
      }),
      {}
    );
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

/**
 * @template T
 * @template R
 * @param {[(...ts: T[]) => boolean, (...ts: T[]) => R][]} args
 */
export function cond(...args) {
  return (/** @type {T[]} */ ...xs) => {
    for (const [predicate, resultFn] of args) {
      if (predicate(...xs)) return resultFn(...xs);
    }
    throw new Error("case not handled");
  };
}

export function which() {
  return (...xs) => {
    for (const [predicate, result] of args) {
      if (predicate(...xs)) return result;
    }
    throw new Error("case not handled");
  };
}

// const time = fn => (...args) => {
//   const b = performance.now()
//   const result = fn(...args)
//   console.log('TIME', performance.now() - b)
//   return result
// }
