import xs from "xstream";

import { set, update } from "../../../utility/index";

export default function model(action) {
  const createNewTopicReducer$ = action.createNewTopic.map(newTopic => state =>
    update(state, "topics", list => [newTopic].concat(list))
  );

  const initLocalReducer$ = xs.of(() => ({
    waiting: false
  }));

  const createNewTopicLocalReducer$ = action.createNewTopic.mapTo(state =>
    set(state, "waiting", true)
  );

  // TODO error handling?
  const createNewTopicResponseReducer$ = action.createNewTopicResponse.mapTo(
    state => set(state, "waiting", false)
  );

  return {
    local: xs.merge(
      initLocalReducer$,
      createNewTopicLocalReducer$,
      createNewTopicResponseReducer$
    ),
    state: xs.merge(createNewTopicReducer$)
  };
}
