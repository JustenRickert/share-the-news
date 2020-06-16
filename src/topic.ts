import xs, { Stream } from "xstream";
import sampleCombine from "xstream/extra/sampleCombine";
import { Response } from "@cycle/http";
import { withState, StateSource } from "@cycle/state";
import isolate, { Component } from "@cycle/isolate";
import {
  a,
  button,
  div,
  h1,
  address,
  nav,
  h,
  ul,
  li,
  form,
  fieldset,
  label,
  input
} from "@cycle/dom";
import {
  path,
  assocPath,
  lensPath,
  over,
  pipe,
  assoc,
  cond,
  equals,
  T,
  always,
  concat
} from "ramda";
import normalizeUrl from "normalize-url";

import { Sources, Sinks, State, Topic as TopicType, Link } from "./types";

interface TopicState {
  id: string;
  links: { record: Record<string, Link> };
  linksLoaded: boolean;
  topic: TopicType;
  topicLoaded: boolean;
}

interface LocalState {
  addNewLink: {
    open: boolean;
    request: {
      latestError: string | Boolean;
      waiting: Boolean;
    };
  };
}

interface LocalSources {
  local: StateSource<LocalState>;
}

interface LocalSinks {
  local: Stream<(state: LocalState) => LocalState>;
}

function network(
  sources: Sources<TopicState>,
  action: ReturnType<typeof intent>
) {
  const request = {
    addNewLink$: action.addNewLink$
      .compose(sampleCombine(sources.state.stream))
      .map(([{ href }, state]) => ({
        method: "post",
        url: `/api/topic/${state.id}/add-link`,
        category: "add-link",
        send: { href: normalizeUrl(href) },
        ok: (r: Response) => [200, 400].some(s => r.status === s)
      })),
    initialTopic$: sources.state.stream
      .take(1)
      .filter(state => !state.topicLoaded)
      .map(state => ({
        url: `/api/topic/${state.id}`,
        category: "get-topic"
      })),
    initialLinks$: sources.state.stream
      .take(1)
      .map(state =>
        xs.of({
          url: `/api/topic/links/information/${state.id}`,
          category: "get-links"
        })
      )
      .flatten()
  };

  const response = {
    addNewLink$: sources.http.select("add-link").flatten(),
    initialTopic$: sources.http
      .select("get-topic")
      .flatten()
      .map(res => res.body as TopicType),
    initialLinks$: sources.http
      .select("get-links")
      .flatten()
      .map(res => res.body as Link[])
  };

  return {
    request,
    response
  };
}

function intent(sources: Sources<TopicState>) {
  const gotoRoot$ = sources.dom
    .select(".back-to-root")
    .events("click")
    .mapTo({
      pathname: "/"
    });

  const openAddNewLink$ = sources.dom
    .select("button.add-new-link")
    .events("click");

  const addNewLink$ = sources.dom
    .select("form.new-link")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { link } } }: any) => ({
      href: link.value as string
    }))
    .debug("link action");

  const addNewLinkInput$ = sources.dom
    .select(".new-link input#link")
    .events("input");

  return {
    addNewLinkInput$,
    addNewLink$,
    gotoRoot$,
    openAddNewLink$
  };
}

function model(
  action: ReturnType<typeof intent>,
  networking: ReturnType<typeof network>
) {
  const addNewLinkResponseError$ = networking.response.addNewLink$.filter(
    res => res.status === 400
  );

  const addNewLinkResponseSuccess$ = networking.response.addNewLink$.filter(
    res => res.status === 200
  );

  return {
    local$: xs.merge<(t: LocalState) => LocalState>(
      xs.of(() => ({
        addNewLink: {
          open: false,
          request: {
            latestError: false,
            waiting: false
          }
        }
      })),
      xs
        .merge(action.addNewLinkInput$, action.openAddNewLink$)
        .mapTo(assocPath(["addNewLink", "request", "latestError"], false)),
      addNewLinkResponseError$.map(res =>
        pipe(
          assocPath<boolean | string, LocalState>(
            ["addNewLink", "request", "latestError"],
            res.text || true
          ),
          assocPath(["addNewLink", "request", "waiting"], false)
        )
      ),
      addNewLinkResponseSuccess$.mapTo(
        pipe(
          assocPath<boolean, LocalState>(
            ["addNewLink", "request", "waiting"],
            false
          ),
          assocPath(["addNewLink", "open"], false)
        )
      ),
      networking.request.addNewLink$.mapTo(
        assocPath(["addNewLink", "request", "waiting"], true)
      ),
      action.openAddNewLink$.mapTo(
        over(lensPath(["addNewLink", "open"]), open => !open)
      )
    ),

    state$: xs.merge(
      addNewLinkResponseSuccess$
        .map(res => res.body as Link[])
        .map<(t: TopicState) => TopicState>(links =>
          over(lensPath(["topic", "linkIds"]), concat(links.map(l => l.id)))
        ),
      addNewLinkResponseSuccess$
        .map(res => res.body as Link[])
        .map(links => (state: TopicState) =>
          links.reduce<TopicState>(
            (state, link) =>
              assocPath(["links", "record", link.id], link, state),
            state
          )
        ),
      networking.response.initialLinks$.map(links => (state: TopicState) =>
        links.reduce<TopicState>(
          (state, link) => assocPath(["links", "record", link.id], link, state),
          state
        )
      ),
      networking.response.initialTopic$.map<(state: TopicState) => TopicState>(
        assoc("topic")
      )
    )
  };
}

function renderNav() {
  return nav([button(".back-to-root", "Back")]);
}

function renderLink(link: Link) {
  return li(link.id);
}

const renderAddNewLinkErrorMessage = pipe<LocalState, string, string>(
  path(["addNewLink", "request", "latestError"]),
  cond([
    [equals("bad-link"), always("Link isn't valid")],
    [equals("duplicate-link"), always("Link already in topic")],
    [equals(false), always(null)],
    [T, always("Error...")]
  ])
);

function renderAddNewLink(local: LocalState) {
  if (!local.addNewLink.open) return button(".add-new-link", "Add new link");
  return div([
    div(button(".add-new-link", "Close")),
    form(
      ".new-link",
      div([
        renderAddNewLinkErrorMessage(local),
        fieldset({ attrs: { disabled: local.addNewLink.request.waiting } }, [
          label({ attrs: { for: "link" } }, "Link"),
          input({ attrs: { name: "link", id: "link" } }),
          button({ attrs: { type: "submit" } }, "Okay")
        ])
      ])
    )
  ]);
}

function renderTopic(state: TopicState, local: LocalState) {
  const { title, submittedDate, submittedBy, linkIds, id } = state.topic;
  const links = !state.linksLoaded
    ? null
    : linkIds.map(linkId => state.links.record[linkId]);
  return div([
    h1(title),
    address(a({ attrs: { rel: "author" } }, submittedBy)),
    h(
      "time",
      { attrs: { datetime: submittedDate } },
      new Date(submittedDate).toLocaleDateString()
    ),
    links && div(ul(links.map(renderLink))),
    div(renderAddNewLink(local))
  ]);
}

function Topic(
  sources: Sources<TopicState> & LocalSources
): Sinks<TopicState> & LocalSinks {
  const dom$ = xs
    .combine(sources.state.stream, sources.local.stream)
    .map(([state, local]) =>
      div([
        renderNav(),
        !state.topicLoaded ? div("Loading...") : renderTopic(state, local)
      ])
    );
  const action = intent(sources);
  const networking = network(sources, action);
  const { local$, state$ } = model(action, networking);
  return {
    dom: dom$,
    local: local$,
    state: state$,
    http: xs.merge(
      networking.request.initialTopic$,
      networking.request.addNewLink$,
      networking.request.initialLinks$
    ),
    nav: action.gotoRoot$
  };
}

export default isolate(withState(Topic, "local"), {
  state: {
    get(state: State): TopicState {
      const topic = state.topics.record[state.location.topic!.topicId] || null;
      return {
        id: state.location.topic!.topicId,
        links: state.links,
        linksLoaded:
          topic &&
          topic.linkIds.every(
            linkId => typeof state.links.record[linkId] !== "undefined"
          ),
        topicLoaded: Boolean(topic),
        topic
      };
    },
    set(state: State, local: TopicState): State {
      const reducer = pipe(
        assocPath<TopicType, State>(
          ["topics", "record", local.id],
          local.topic
        ),
        assocPath(["links", "record"], local.links.record)
      );
      return reducer(state);
    }
  }
}) as Component<Sources, Sinks>;
