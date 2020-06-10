import xs from "xstream";
import sampleCombine from "xstream/extra/sampleCombine";
import { button, div, ul, li, form, fieldset, input, label } from "@cycle/dom";

import { set, updateAll } from "../../utility/index";

function intent(sources) {
  const inputValue$ = sources.dom
    .select(".add-link-input")
    .events("input")
    .map(({ ownerTarget: { value } }) => value);

  const addLink$ = sources.dom
    .select(".add-link")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { href } } }) => ({
      href: href.value
    }));

  const goBack$ = sources.dom
    .select(".back-button")
    .events("click")
    .map(event => ({ type: "goto-topic-list", event }));

  return {
    inputValue: inputValue$,
    addLink: addLink$,
    goBack: goBack$
  };
}

function model(sources, action) {
  const addLinkRequest$ = action.addLink
    .compose(sampleCombine(sources.state.stream))
    .map(([payload, state]) => ({
      method: "post",
      url: `/api/topic/${state.topic.id}`,
      send: payload,
      category: "add-topic-link",
      ok: res => [200, 400].some(s => s === res.status)
    }));

  const addLinkResponse$ = sources.http.select("add-topic-link").flatten();

  const localReducer$ = xs.merge(
    xs.of(() => ({
      inputValue: "",
      pendingLinkRequest: false,
      latestLinkRequestError: false
    })),
    action.inputValue.map(value => local =>
      updateAll(local, ["inputValue", value], ["latestLinkRequestError", false])
    ),
    addLinkResponse$
      .filter(res => res.status === 200)
      .mapTo(local => set(local, "inputValue", "")),
    addLinkResponse$
      .filter(res => res.status === 400)
      .mapTo(local => set(local, "latestLinkRequestError", true)),
    addLinkRequest$.mapTo(local => set(local, "pendingLinkRequest", true)),
    addLinkResponse$.mapTo(local => set(local, "pendingLinkRequest", false))
  );

  const stateReducer$ = addLinkResponse$
    .filter(res => res.status === 200)
    .map(res => state => {
      const {
        request: { send: link }
      } = res;
      return updateAll(
        state,
        [["topic", "linkIds"], ids => [link.href].concat(ids)],
        ["linkRecord", r => set(r, link.href, link)]
      );
    });

  return {
    local: localReducer$,
    state: stateReducer$,
    http: addLinkRequest$
  };
}

function view(sources) {
  return xs
    .combine(sources.state.stream, sources.local.stream)
    .map(([state, local]) => {
      const links = state.topic.linkIds.map(id => state.linkRecord[id]);
      return div([
        button(".back-button", "back"),
        div(state.topic.title),
        ul(links.map(l => li(l.href))),
        form(
          ".add-link",
          fieldset({ attrs: { disabled: local.pendingLinkRequest } }, [
            local.latestLinkRequestError ? div("Error!") : null,
            label({ attrs: { for: "href" } }, "Add link"),
            input(".add-link-input", {
              attrs: { name: "href", id: "href" },
              props: { value: local.inputValue }
            }),
            button({ type: "submit" }, "Okay")
          ])
        )
      ]);
    });
}

export default function Topic(sources) {
  const dom$ = view(sources);
  const action = intent(sources);
  const effects = model(sources, action);
  return {
    local: effects.local,
    dom: dom$,
    state: effects.state,
    http: effects.http,
    history: action.goBack
  };
}
