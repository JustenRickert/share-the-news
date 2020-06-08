import xs from "xstream";
import isolate from "@cycle/isolate";
import { button, div } from "@cycle/dom";

function renderTopic(state) {
  return div(state.topic.title);
}

function _Topic(sources) {
  const dom$ = sources.state.stream.map(state =>
    div([button(".back-button", "back"), renderTopic(state)])
  );
  const goBack$ = sources.dom
    .select(".back-button")
    .events("click")
    .map(event => ({ type: "go-back", event }));
  return {
    dom: dom$,
    history: goBack$
  };
}

export default function makeTopic(topicId) {
  const Topic = isolate(_Topic, {
    state: {
      get: state => ({
        topic: state.topics.find(t => t.id === topicId)
      })
    }
  });
  return sources => {
    const isLoading$ = sources.state.stream.map(state => !state.topics);
    return isLoading$.map(isLoading =>
      isLoading ? { dom: xs.of(div("Loading...")) } : Topic(sources)
    );
  };
}
