import xs, { Stream } from "xstream";
import { run } from "@cycle/run";
import { makeHTTPDriver } from "@cycle/http";
import { a, button, h2, div, nav, DOMSource, VNode, ul, li } from "@cycle/dom";
import { withState, makeCollection } from "@cycle/state";
import isolate, { Component } from "@cycle/isolate";
import { pipe, pick, set, lensPath, mergeRight, over, assoc } from "ramda";

import { Sources, Sinks, State, Topic } from "./types";
import sampleCombine from "xstream/extra/sampleCombine";

function renderNav(state: State) {
  return nav(
    ".sign-in",
    state.user.loading
      ? "loading..."
      : !state.user.info
      ? button("Sign in")
      : div([
          div(["hello ", state.user.info.username]),
          button(".nav-add-to-topic", "Add new topic")
        ])
  );
}

const toTopicPathname = (topic: Topic) => `/topic/${topic.id}`;

function renderTopicItem(topic: Topic) {
  const { title, submittedBy, submittedDate, linkIds } = topic;
  return li(
    div([
      h2(a(".topic-item", { attrs: { href: toTopicPathname(topic) } }, title)),
      div([div(submittedBy), div(submittedDate), div(linkIds.length)])
    ])
  );
}

function TopicItem(sources: Sources<Topic>) {
  const dom$ = sources.state.stream.map(renderTopicItem);
  const gotoTopic$ = sources.dom
    .select("a.topic-item")
    .events("click", { preventDefault: true })
    .compose(sampleCombine(sources.state.stream))
    .map(([, topic]) => ({
      pathname: toTopicPathname(topic)
    }));
  return {
    dom: dom$,
    nav: gotoTopic$
  };
}

const TopicItemCollection = isolate(
  makeCollection<Topic>({
    item: TopicItem,
    itemKey: topic => topic.id,
    itemScope: key => key,
    collectSinks: instances => ({
      dom: instances.pickCombine("dom").map(lis => ul(lis)),
      nav: instances.pickMerge("nav")
    })
  }),
  {
    state: {
      get(state: State) {
        return state.topics.idList.map(id => state.topics.record[id]);
      },
      // NOTE Not tested. Probably won't ever need this
      set(state: State, topics: Topic[]) {
        return over(
          lensPath(["topics", "record"]),
          record =>
            topics.reduce(
              (record, topic) => assoc(topic.id, topic, record),
              record
            ),
          state
        );
      }
    }
  }
) as Component<Sources, Sinks>;

function normalizeTopics(
  topics: Topic[]
): { idList: string[]; record: Record<string, Topic> } {
  const record = topics.reduce(
    (record, topic) => ({
      ...record,
      [topic.id]: topic
    }),
    {} as Record<string, Topic>
  );
  return {
    idList: topics.map(t => t.id),
    record
  };
}

function network(sources: Sources) {
  return {
    topics$: sources.http
      .select("get-topics")
      .flatten()
      .map(res => res.body as Topic[])
      .map(normalizeTopics)
  };
}

function TopicList(sources: Sources): Sinks {
  const topicItemsSinks = TopicItemCollection(sources);
  const dom$ = xs
    .combine(topicItemsSinks.dom, sources.state.stream)
    .map(([topicItems, state]) =>
      div([renderNav(state), !state.topics.loaded ? "Loading..." : topicItems])
    );
  const { topics$ } = network(sources);
  const gotoAddNewTopic$ = sources.dom
    .select(".nav-add-to-topic")
    .events("click")
    .mapTo({
      pathname: "add-new-topic"
    });
  return {
    nav: xs.merge(topicItemsSinks.nav, gotoAddNewTopic$),
    dom: dom$,
    state: xs.merge(
      topics$.map(topics =>
        pipe(
          set(lensPath(["topics", "idList"]), topics.idList),
          set(lensPath(["topics", "record"]), topics.record),
          set(lensPath(["topics", "loaded"]), true)
        )
      )
    ),
    http: sources.state.stream
      .filter(state => !state.topics.loaded)
      .mapTo({
        url: "/api/topics",
        category: "get-topics"
      })
  };
}

export default isolate(TopicList, {
  state: {
    get: pick(["user", "topics"]),
    set: mergeRight
  }
}) as Component<Sources, Sinks>;
