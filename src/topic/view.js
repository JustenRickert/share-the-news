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
  return button(".add-topic", "Add url");
}

export default function view(sources) {
  return sources.topic.stream.map(topic =>
    div([h2("topic"), renderLinks(topic), renderAddNewTopic(topic)])
  );
}
