import { withState } from "@cycle/state";

import view from "./view";
import intent from "./intent";
import model from "./model";

function Topic(sources) {
  const dom$ = view(sources);
  const action = intent(sources);
  const { topic$ } = model(sources, action);
  return {
    dom: dom$,
    topic: topic$
  };
}

export default withState(Topic, "topic");
