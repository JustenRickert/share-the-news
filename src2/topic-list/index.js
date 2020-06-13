import xs from "xstream";
import sampleCombine from "xstream/extra/sampleCombine";
import dropRepeats from "xstream/extra/dropRepeats";
import { a, div, h4, ul, li } from "@cycle/dom";
import { makeCollection } from "@cycle/state";
import isolate from "@cycle/isolate";

import AddNewTopic from "./add-new-topic";

import "./topic-list.css";

function Topic(sources) {
  const dom$ = sources.state.stream.map(t =>
    li(".topic-list-item", [h4(a(t.title)), div([t.linkIds.length, " links"])])
  );

  const clickLink$ = sources.dom
    .select(".topic-list-item")
    .events("click")
    .compose(sampleCombine(sources.state.stream))
    .map(([event, topic]) => ({ type: "goto-topic", event, topic }));

  return {
    dom: dom$,
    history: clickLink$
  };
}

const TopicCollection = isolate(
  makeCollection({
    item: Topic,
    itemKey: state => state.id,
    itemScope: key => key,
    collectSinks: instances => ({
      dom: instances.pickCombine("dom").map(lis => ul(".topic-list", lis)),
      history: instances.pickMerge("history")
    })
  }),
  {
    state: {
      get: state => state.topicIds.map(id => state.topicRecord[id]),
      set: (state, topics) => ({
        ...state,
        topicIds: topics.map(t => t.id)
      })
    }
  }
);

function TopicList(sources) {
  const collectionSinks = TopicCollection(sources);
  const addNewTopicSinks = AddNewTopic(sources);
  return {
    dom: xs
      .combine(collectionSinks.dom, addNewTopicSinks.dom)
      .map(([collection, addNewTopic]) => div([collection, addNewTopic])),
    state: addNewTopicSinks.state,
    http: addNewTopicSinks.http,
    history: xs.merge(collectionSinks.history, addNewTopicSinks.history)
  };
}

export default function makeTopicList(sources) {
  const isLoading$ = sources.state.stream
    .map(state => !state.topicIds)
    .compose(dropRepeats());
  return isLoading$.map(isLoading =>
    isLoading ? { dom: xs.of(div("Loading...")) } : TopicList(sources)
  );
}
