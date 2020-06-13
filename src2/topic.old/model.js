import xs from "xstream";
import concat from "xstream/extra/concat";

import { set, updateAll } from "../util";

function validateUrl(action) {
  return fetch("http://localhost:10002/api/validate", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(action)
  }).then(response => {
    if (response.status !== 200) throw new Error(response);
    return response;
  });
}

export default function model(sources, actionSource) {
  const initReducer$ = xs.of(() => ({
    adding: false,
    validating: false,
    latestError: false,
    links: []
  }));
  const addTopicReducer$ = actionSource.addTopic.mapTo(state =>
    set(state, "adding", true)
  );
  const closeNewTopicReducer$ = actionSource.closeNewTopic.mapTo(state =>
    set(state, "adding", false)
  );
  const newTopicReducer$ = actionSource.newTopic
    .map(action => {
      const startValidation = xs.of(state =>
        updateAll(state, ["validating", true], ["latestError", false])
      );
      const doValidation = xs.fromPromise(
        validateUrl(action)
          .then(() => state =>
            updateAll(
              state,
              ["links", ls => ls.concat(action)],
              ["adding", false],
              ["validating", false]
            )
          )
          .catch(() => state =>
            updateAll(
              state,
              ["adding", false],
              ["latestError", true],
              ["validating", false]
            )
          )
      );
      return concat(startValidation, doValidation);
    })
    .flatten();
  return {
    topic$: xs.merge(
      initReducer$,
      addTopicReducer$,
      closeNewTopicReducer$,
      newTopicReducer$
    )
  };
}
