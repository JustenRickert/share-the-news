import xs from "xstream";
import concat from "xstream/extra/concat";
import {
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
import { withState } from "@cycle/state";

import { set, updateAll } from "./util";

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

function model(sources, actionSource) {
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
    topic: xs.merge(
      initReducer$,
      addTopicReducer$,
      closeNewTopicReducer$,
      newTopicReducer$
    )
  };
}

function renderLinks(topic) {
  return ul(topic.links.map(l => li(l.url)));
}

function renderAddNewTopic(topic) {
  if (topic.adding || topic.validating || topic.latestError)
    return div([
      button(".close-new-topic", "X"),
      form(
        ".new-topic",
        fieldset({ attrs: { disabled: topic.validating } }, [
          topic.validating ? div("Validating...") : null,
          topic.latestError
            ? div({ style: { color: "tomato" } }, "Invalid url")
            : null,
          label({ attrs: { for: "add-topic-url" } }, "Url"),
          input({ attrs: { id: "add-topic-url", name: "url" } }),
          button({ attrs: { type: "sumbit" } }, "Okay")
        ])
      )
    ]);
  return button(".add-topic", "Add new");
}

function view(sources) {
  return sources.topic.stream.map(topic =>
    div([h2("topic"), renderLinks(topic), renderAddNewTopic(topic)])
  );
}

function intent(sources) {
  const addTopic = sources.dom.select(".add-topic").events("click");
  const newTopic = sources.dom
    .select(".new-topic")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { url } } }) => ({
      url: url.value
    }))
    .debug("new");
  const closeNewTopic = sources.dom.select(".close-new-topic").events("click");
  return {
    addTopic,
    newTopic,
    closeNewTopic
  };
}

function Topic(sources) {
  const dom$ = view(sources);
  const action = intent(sources);
  const { topic } = model(sources, action);
  return {
    dom: dom$,
    topic
  };
}

export default withState(Topic, "topic");
