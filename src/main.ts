import xs, { Stream } from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import sampleCombine from "xstream/extra/sampleCombine";
import fromEvent from "xstream/extra/fromEvent";
import { run } from "@cycle/run";
import { makeHTTPDriver } from "@cycle/http";
import { makeDOMDriver, div } from "@cycle/dom";
import { withState } from "@cycle/state";
import { cond, set, has, lensPath, pipe, test, T, always, over } from "ramda";

import { Navigation, Sources, Sinks, State } from "./types";
import AddNewTopic from "./add-new-topic";
import TopicList from "./topic-list";
import Topic from "./topic";

function Loading(_sources: Sources): Partial<Sinks> {
  return {
    dom: xs.of(div("Loading..."))
  };
}

// TODO dynamic import these, probably(?)
const route = cond<
  string,
  typeof TopicList | typeof Topic | typeof AddNewTopic | typeof Loading
>([
  [test(/\/$/), always(TopicList)],
  [test(/topic\/\w+/), always(Topic)],
  [test(/add-new-topic/), always(AddNewTopic)],
  [T, always(Loading)]
]);

function network(sources: Sources) {
  const initUser$ = sources.http
    .select("user-information")
    .flatten()
    .map(res => res.body as { username: string });
  return {
    initUser$
  };
}

const withDerivedTopicId = (location: State["location"]): State["location"] => {
  const result = /topic\/(\w+)/.exec(location.pathname);
  if (!result)
    return {
      ...location,
      topic: null
    };
  const [, topicId] = result;
  return {
    ...location,
    topic: {
      ...location.topic,
      topicId
    }
  };
};

function model(response: ReturnType<typeof network>) {
  return xs.merge(
    xs.of(() => ({
      location: withDerivedTopicId({
        pathname: window.location.pathname,
        topic: null
      }),
      user: {
        loading: true,
        info: null
      },
      topics: {
        loaded: false,
        record: {},
        idList: []
      }
    })),
    response.initUser$.map(user =>
      pipe(
        set(lensPath(["user", "info"]), user),
        set(lensPath(["user", "loading"]), false)
      )
    )
  );
}

function navigation(sources: Sources, nav$: Stream<Navigation>) {
  const stateOnNav$ = nav$
    .map(
      cond([
        [
          has("pathname"),
          navAction =>
            pipe(
              set(lensPath(["location", "pathname"]), navAction.pathname),
              over(lensPath(["location"]), withDerivedTopicId)
            )
        ]
      ])
    )
    .compose(sampleCombine(sources.state.stream))
    .map(([reducer, state]) => reducer(state));
  const navListener = {
    next(newState: State) {
      window.history.pushState(
        newState.location,
        newState.location.pathname,
        newState.location.pathname
      );
    }
  };
  sources.state.stream.take(1).addListener(navListener); // initialize history state
  stateOnNav$.addListener(navListener);
  const state$ = xs.merge(
    fromEvent<PopStateEvent>(window, "popstate").map(event =>
      set(lensPath(["location"]), event.state)
    ),
    stateOnNav$.map(state => () => state)
  );
  return {
    state$
  };
}

type MainSinks = Omit<Sinks, "nav">;

function main(sources: Sources): MainSinks {
  sources.state.stream.addListener({ next: console.log });
  const sinks$ = sources.state.stream
    .map(state => state.location.pathname)
    .compose(dropRepeats())
    .map(route)
    .map(Fn => Fn(sources));
  const response = network(sources);
  const state$ = model(response);
  const nav = navigation(sources, sinks$.map(s => s.nav).flatten());
  return {
    dom: sinks$.map(s => s.dom).flatten(),
    state: xs.merge(state$, sinks$.map(s => s.state).flatten(), nav.state$),
    http: xs.merge(
      xs.of({
        url: "/api/user/information",
        category: "user-information"
      }),
      sinks$.map(s => s.http).flatten()
    )
  };
}

run(withState<Sources, MainSinks>(main, "state"), {
  dom: makeDOMDriver("#app"),
  http: makeHTTPDriver()
});
