import xs, { Stream } from "xstream";
import { div, form, fieldset, button, input, label, nav } from "@cycle/dom";
import { StateSource, withState } from "@cycle/state";
import isolate, { Component } from "@cycle/isolate";

import { Sources, Sinks } from "./types";
import { lensPath, set } from "ramda";

interface LocalState {
  request: {
    waiting: boolean;
  };
}

interface LocalSources {
  local: StateSource<LocalState>;
}

interface LocalSinks {
  local: Stream<(state: LocalState) => LocalState>;
}

function renderNav() {
  return nav([button(".back-to-root", "Back")]);
}

function renderForm(local: LocalState) {
  return form(
    ".new-topic",
    fieldset(
      {
        attrs: { disabled: local.request.waiting }
      },
      [
        label({ attrs: { for: "title " } }, "Title"),
        input({
          attrs: { name: "title", id: "title" }
        }),
        button({ attrs: { type: "submit" } }, "Okay")
      ]
    )
  );
}

function intent(sources: Sources) {
  const newTopic$ = sources.dom
    .select("form.new-topic")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { title } } }: any) => ({
      title: title.value.trim() as string
    }));

  const gotoRoot$ = sources.dom
    .select(".back-to-root")
    .events("click")
    .mapTo({
      pathname: "/"
    });

  return {
    gotoRoot$,
    newTopic$
  };
}

function network(action: ReturnType<typeof intent>, sources: Sources) {
  const newTopic$ = sources.http
    .select("add-new-topic")
    .flatten()
    .map(res => res.body);
  return {
    request$: xs.merge(
      action.newTopic$.map(topic => ({
        method: "post",
        url: "/api/add-new-topic",
        category: "add-new-topic",
        send: topic
      }))
    ),
    response: {
      newTopic$
    }
  };
}

function AddNewTopic(sources: Sources & LocalSources): Sinks & LocalSinks {
  const action = intent(sources);
  const { request$, response } = network(action, sources);

  const dom$ = sources.local.stream.map(local =>
    div([renderNav(), renderForm(local)])
  );

  return {
    local: xs.merge(
      xs.of(() => ({
        request: {
          waiting: false
        }
      })),
      action.newTopic$.mapTo(set(lensPath(["request", "waiting"]), true))
    ),
    state: xs.never(),
    dom: dom$,
    nav: xs.merge(
      action.gotoRoot$,
      response.newTopic$.map(topicId => ({
        pathname: `/topic/${topicId}`
      }))
    ),
    http: request$
  };
}

export default isolate(withState(AddNewTopic, "local"), {
  state: null
}) as Component<Sources, Sinks>;
