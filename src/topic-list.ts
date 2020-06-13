import xs, { Stream } from "xstream";
import { run } from "@cycle/run";
import { makeHTTPDriver } from "@cycle/http";
import { button, h2, div, nav, DOMSource, VNode, ul, li } from "@cycle/dom";
import { withState } from "@cycle/state";
import isolate, { Component } from "@cycle/isolate";
import { pipe, pick, set, lensPath, mergeRight } from "ramda";

import { Sources, Sinks, State, Topic } from "./types";

function renderNav(state: State) {
  return nav(
    ".sign-in",
    state.user.loading
      ? "loading..."
      : !state.user.info
      ? button("Sign in")
      : ["hello ", state.user.info.username]
  );
}

function renderTopicItem(topic: Topic) {
  const { title, submittedBy, submittedDate, linkIds } = topic;
  return li(
    div([
      h2(title),
      div([div(submittedBy), div(submittedDate), div(linkIds.length)])
    ])
  );
}

function renderList(state: State) {
  return ul(
    !state.topics.loaded ? "loading" : state.topics.list.map(renderTopicItem)
  );
}

function network(sources: Sources) {
  return {
    topics$: sources.http
      .select("get-topics")
      .flatten()
      .map(res => res.body as Topic[])
  };
}

function List(sources: Sources): Sinks {
  const dom$ = sources.state.stream.map(state =>
    div([renderNav(state), renderList(state)])
  );
  const { topics$ } = network(sources);
  topics$.addListener({ next: console.log });
  return {
    dom: dom$,
    state: xs.merge(
      topics$.map(topics =>
        pipe(
          set(lensPath(["topics", "list"]), topics),
          set(lensPath(["topics", "loaded"]), true)
        )
      )
    ),
    http: xs.merge(
      xs.of({
        url: "/api/topics",
        category: "get-topics"
      })
    )
  };
}

export default isolate(List, {
  state: {
    get: pick(["user", "topics"]),
    set: mergeRight
  }
}) as Component<Sources, Sinks>;
