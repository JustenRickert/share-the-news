import isolate from "@cycle/isolate";

import view from "./view";
import intent from "./intent";
import model from "./model";

function CreateNewTopic(sources) {
  const dom$ = view();
  const action = intent(sources);
  const state$ = model(action);

  const request$ = action.createNewTopic.map(newTopic => ({
    method: "post",
    url: "http://localhost:10002/api/create-new-topic",
    send: newTopic
  }));

  return {
    dom: dom$,
    state: state$,
    http: request$
  };
}

export default isolate(CreateNewTopic, { state: null });
