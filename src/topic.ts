import xs from "xstream";
import { withState } from "@cycle/state";
import isolate, { Component } from "@cycle/isolate";
import { a, button, div, h1, address, nav, h } from "@cycle/dom";
import { assocPath, set, lensPath, lensProp } from "ramda";

import { Sources, Sinks, State, Topic as TopicType } from "./types";

interface TopicState {
  id: string;
  loaded: boolean;
  topic: TopicType;
}

function network(sources: Sources<TopicState>) {
  const request$ = sources.state.stream
    .take(1)
    .filter(state => !state.loaded)
    .map(state => ({
      url: `/api/topic/${state.id}`,
      category: "get-topic"
    }));

  const topicResponse$ = sources.http
    .select("get-topic")
    .flatten()
    .map(res => res.body as TopicType);

  return {
    request$,
    topicResponse$
  };
}

function intent(sources: Sources<TopicState>) {
  const gotoRoot$ = sources.dom
    .select(".back-to-root")
    .events("click")
    .mapTo({
      pathname: "/"
    });

  return {
    gotoRoot$
  };
}

function renderNav() {
  return nav([button(".back-to-root", "Back")]);
}

function renderTopic(state: TopicState) {
  const { title, submittedDate, submittedBy, linkIds, id } = state.topic;
  return div([
    h1(title),
    address(a({ attrs: { rel: "author" } }, submittedBy)),
    h(
      "time",
      { attrs: { datetime: submittedDate } },
      new Date(submittedDate).toLocaleDateString()
    )
  ]);
}

function Topic(sources: Sources<TopicState>): Sinks {
  const dom$ = sources.state.stream.map(state =>
    div([renderNav(), !state.loaded ? div("Loading...") : renderTopic(state)])
  );
  const { request$, topicResponse$ } = network(sources);
  const { gotoRoot$ } = intent(sources);
  return {
    dom: dom$,
    state: xs.merge(topicResponse$.map(topic => set(lensProp("topic"), topic))),
    http: request$,
    nav: gotoRoot$
  };
}

export default isolate(Topic, {
  state: {
    get(state: State): TopicState {
      const topic = state.topics.record[state.location.topic!.topicId] || null;
      return {
        id: state.location.topic!.topicId,
        loaded: Boolean(topic),
        topic
      };
    },
    set(state: State, local: TopicState): State {
      return assocPath(["topics", "record", local.id], local.topic, state);
    }
  }
}) as Component<Sources, Sinks>;
