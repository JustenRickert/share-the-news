import xs from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import { run } from "@cycle/run";
import { makeHTTPDriver } from "@cycle/http";
import { makeDOMDriver, div } from "@cycle/dom";
import { withState } from "@cycle/state";
import { cond, set, lensPath, pipe, test, T } from "ramda";

import { Sources, Sinks } from "./types";
import List from "./topic-list";

function Loading(_sources: Sources): Partial<Sinks> {
  return {
    dom: xs.of(div("Loading..."))
  };
}

function Topic(): Partial<Sinks> {
  return {
    dom: xs.of(div("topic"))
  };
}

// TODO dynamic import these, probably(?)
const route = cond<string, typeof List | typeof Topic | typeof Loading>([
  [test(/\/$/), () => List],
  [test(/topic\/\w+/), () => Topic],
  [T, () => Loading]
]);

function network(sources: Sources) {
  const initUser$ = sources.http
    .select("user-information")
    .flatten()
    .map(res => res.body as { username: string });
  return {
    initUser$
  };
}

function model(response: ReturnType<typeof network>) {
  return xs.merge(
    xs.of(() => ({
      location: {
        pathname: window.location.pathname
      },
      user: {
        loading: true,
        info: null
      },
      topics: {
        loaded: false,
        list: null
      }
    })),
    response.initUser$.map(user =>
      pipe(
        set(lensPath(["user", "info"]), user),
        set(lensPath(["user", "loading"]), false)
      )
    )
  );
}

function main(sources: Sources): Sinks {
  sources.state.stream.addListener({ next: console.log });
  const sinks$ = sources.state.stream
    .map(state => state.location.pathname)
    .compose(dropRepeats())
    .map(route)
    .map(Fn => Fn(sources));
  const response = network(sources);
  const state$ = model(response);
  return {
    dom: sinks$.map(s => s.dom).flatten(),
    state: xs.merge(state$, sinks$.map(s => s.state).flatten()),
    http: xs.merge(
      xs.of({
        url: "/api/user/information",
        category: "user-information"
      }),
      sinks$.map(s => s.http).flatten()
    )
  };
}

run(withState<Sources, Sinks>(main, "state"), {
  dom: makeDOMDriver("#app"),
  http: makeHTTPDriver()
});
