import xs from "xstream";
import sampleCombine from "xstream/extra/sampleCombine";
import {
  a,
  div,
  form,
  button,
  fieldset,
  input,
  label,
  h2,
  ul,
  li
} from "@cycle/dom";
import { makeCollection } from "@cycle/state";
import isolate from "@cycle/isolate";

function Topic(sources) {
  const dom$ = sources.state.stream.map(t =>
    li(".topic-list-item", a(t.title))
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

const TopicList = isolate(
  makeCollection({
    item: Topic,
    itemKey: state => state.id,
    itemScope: key => key,
    collectSinks: instances => ({
      dom: instances.pickCombine("dom").map(lis => ul(lis)),
      history: instances.pickMerge("history")
    })
  }),
  {
    state: {
      get: state => state.topics,
      set: (state, topics) => ({
        ...state,
        topics
      })
    }
  }
);

export default function makeTopicList(sources) {
  const isLoading$ = sources.state.stream.map(state => !state.topics);
  return isLoading$.map(isLoading =>
    isLoading ? { dom: xs.of(div("Loading...")) } : TopicList(sources)
  );
}
