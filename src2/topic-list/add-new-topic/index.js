import isolate from "@cycle/isolate";
import { withState } from "@cycle/state";

import view from "./view";
import intent from "./intent";
import model from "./model";

function AddNewTopic(sources) {
  const dom$ = view(sources);
  const action = intent(sources);
  const effects = model(action);

  const request$ = action.createNewTopic.map(newTopic => ({
    method: "post",
    url: "/api/add-new-topic",
    category: "add-new-topic",
    send: newTopic
  }));

  const gotoTopic$ = sources.http
    .select("add-new-topic")
    .flatten()
    .map(req => ({ type: "goto-topic", topic: { id: req.body } }));

  return {
    dom: dom$,
    local: effects.local,
    state: effects.state,
    http: request$,
    history: gotoTopic$
  };
}

export default isolate(withState(AddNewTopic, "local"), { state: null });
