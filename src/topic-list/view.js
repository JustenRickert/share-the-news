import xs from "xstream";
import {
  a,
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
import { makeCollection } from "@cycle/state";

export default function TopicList(sources) {}

// export default function view(sources) {
//   return sources.state.stream.map(state => {
//     const { topics } = state;
//     if (!topics) return div("Loading...");
//     if (!topics.length) return div("EMPTY");
//     return ul(
//       topics.map(t => {
//         console.log(t);
//         return li(".topic-list-topic", a(t.title));
//       })
//     );
//   });
// }
