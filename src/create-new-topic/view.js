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

export default function view() {
  return xs.of(
    form(".new-topic", [
      label({ attrs: { for: "title " } }, "Title"),
      input({ attrs: { name: "title", id: "title" } }),
      button({ attrs: { type: "submit" } }, "Okay")
    ])
  );
}
