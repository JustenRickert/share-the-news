import xs from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import isolate from "@cycle/isolate";
import { div } from "@cycle/dom";
import { withState } from "@cycle/state";

import { updateAll } from "../../utility/index";
import _Topic from "./topic";

export default function makeTopic(topicId) {
  const Topic = isolate(withState(_Topic, "local"), {
    state: {
      get: state => ({
        linkRecord: state.linkRecord,
        topic: state.topicRecord[topicId]
      }),
      set: (state, inner) =>
        updateAll(
          state,
          [["topicRecord", topicId], inner.topic],
          ["linkRecord", inner.linkRecord]
        )
    }
  });
  return sources => {
    const isLoading$ = sources.state.stream
      .map(state => !state.topicRecord?.[topicId])
      .compose(dropRepeats());
    return isLoading$.map(isLoading =>
      isLoading ? { dom: xs.of(div("Loading...")) } : Topic(sources)
    );
  };
}
