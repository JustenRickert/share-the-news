import isolate from "@cycle/isolate";

import view from "./view";

function TopicList(sources) {
  const dom$ = view(sources);
  return {
    dom: dom$
  };
}

export default isolate(TopicList, { state: null });
