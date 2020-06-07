import xs from "xstream";

import { set, update } from "../../utility/index";

export default function model(action) {
  const createNewTopicReducer$ = action.createNewTopic.map(newTopic => state =>
    update(state, "topics", list => [newTopic].concat(list))
  );
  return xs.merge(createNewTopicReducer$);
}
