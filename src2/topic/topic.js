import xs from "xstream";
import sampleCombine from "xstream/extra/sampleCombine";
import flattenConcurrently from "xstream/extra/flattenConcurrently";
import {
  a,
  button,
  div,
  h4,
  ul,
  li,
  form,
  fieldset,
  input,
  label
} from "@cycle/dom";

import { set, updateAll, not, update, updateMerge } from "../../utility/index";

import "./topic.css";

function isOwnDomain(href) {
  const reg = new RegExp(
    `https?:\\/\\/${window.location.host.replace(/\./g, "\\.")}`
  );
  const t = reg.test(href);
  console.log("own?", { href, reg, t });
  return t;
}

function intent(sources) {
  const inputValue$ = sources.dom
    .select(".add-link-input")
    .events("input")
    .map(({ ownerTarget: { value } }) => value);

  const addLink$ = sources.dom
    .select(".add-link")
    .events("submit", { preventDefault: true })
    .map(
      ({
        ownerTarget: {
          elements: { href }
        }
      }) => href.value
    );

  const goBack$ = sources.dom
    .select(".back-button")
    .events("click")
    .map(event => ({ type: "goto-topic-list", event }));

  return {
    inputValue: inputValue$,
    addLink: addLink$.filter(not(isOwnDomain)),
    cannotLinkOwnDomain: addLink$.filter(isOwnDomain),
    goBack: goBack$
  };
}

function model(sources, action) {
  const addLinkRequest$ = action.addLink
    .compose(sampleCombine(sources.state.stream))
    .map(([href, state]) => ({
      method: "post",
      url: `/api/topic/${state.topic.id}/add-link`,
      send: { href },
      category: "add-topic-link",
      ok: res => [200, 400].some(s => s === res.status)
    }));

  const addLinkResponse$ = sources.http.select("add-topic-link").flatten();

  const localInitReducer$ = xs.merge(
    xs.of(() => ({
      inputValue: "",
      pendingLinkRequest: false,
      latestLinkRequestError: false
    })),
    action.cannotLinkOwnDomain.mapTo(local =>
      update(local, "triedToAddOwnDomainError", true)
    ),
    action.inputValue.map(value => local =>
      updateAll(
        local,
        ["inputValue", value],
        ["latestLinkRequestError", false],
        ["triedToAddOwnDomainError", false]
      )
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

  const toLinkInformationRequest = href => ({
    url: `/api/link/information/${encodeURIComponent(href)}`,
    category: "link-information",
    ok: res => [200, 500].some(s => s === res.status)
  });

  const linkInformationRequests$ = xs.merge(
    addLinkResponse$
      .map(res => toLinkInformationRequest(res.request.send.href))
      .debug("request!"),
    sources.state.stream
      .take(1)
      .debug("state")
      .map(state =>
        xs.of({
          url: `/api/topic/links/information/${state.topic.id}`,
          category: "all-link-information"
        })
      )
      .flatten()
  );

  const stateReducer$ = xs.merge(
    addLinkResponse$
      .filter(res => res.status === 200)
      .map(res => state => {
        const {
          body: linkIds,
          request: { send: link }
        } = res;
        return updateAll(
          state,
          [["topic", "linkIds"], linkIds],
          [["linkRecord", link.href], r => r || null]
        );
      }),
    sources.http
      .select("link-information")
      .compose(flattenConcurrently)
      .filter(res => res.status === 200) // TODO handle 500s somehow?
      .map(res => state =>
        updateMerge(state, ["linkRecord", res.body.href, res.body])
      ),
    sources.http
      .select("all-link-information")
      .flatten()
      .map(res => state => {
        console.log({ res });
        return updateMerge(
          state,
          ...res.body.map(link => ["linkRecord", link.href, link])
        );
      })
  );

  return {
    local: localInitReducer$,
    state: stateReducer$,
    http: xs.merge(addLinkRequest$, linkInformationRequests$)
  };
}

function view(sources) {
  return xs
    .combine(sources.state.stream, sources.local.stream)
    .debug("view")
    .map(([state, local]) => {
      return div(".topic", [
        button(".back-button", "back"),
        h4(state.topic.title),
        ul(
          state.topic.linkIds.map(href =>
            li(
              a(
                {
                  attrs: {
                    href,
                    target: "_blank",
                    rel: "noopener noreferrer"
                  }
                },
                state.linkRecord[href]?.generatedHeadline || `(${href})`
              )
            )
          )
        ),
        form(
          ".add-link",
          fieldset({ attrs: { disabled: local.pendingLinkRequest } }, [
            local.triedToAddOwnDomainError ? div("Can't add that! :)") : null,
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
