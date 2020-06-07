import xs from "xstream";
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

export default function view(sources) {
  return sources.state.stream.map(state => {
    const { topics } = state;
    if (!topics) return div("Loading...");
    if (!topics.length) return div("EMPTY");
    return ul(topics.map(({ title }) => li(title)));
  });
}
