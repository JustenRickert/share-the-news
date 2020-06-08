import xs from "xstream";
import { run } from "@cycle/run";
import { makeHTTPDriver } from "@cycle/http";
import { makeDOMDriver, div } from "@cycle/dom";
import { withState } from "@cycle/state";

import makeTopic from "./topic";
import { historyDriver } from "./history";
import model from "./model";
import AccountInfo from "./account-info";
import makeTopicList from "./topic-list";
import CreateNewTopic from "./create-new-topic";
import { cond } from "../utility/index";

const makeRouteCond = cond(
  [history => !history.hash, () => makeTopicList],
  [history => history.hash, history => makeTopic(history.hash)]
);

function main(sources) {
  const accountInfoSinks = AccountInfo(sources);
  const createNewTopicSinks = CreateNewTopic(sources);
  const route$ = sources.history.stream
    .map(makeRouteCond)
    .map(makeRoute => makeRoute(sources))
    .flatten();
  const dom$ = xs
    .combine(
      accountInfoSinks.dom,
      route$.map(s => s.dom).flatten(),
      createNewTopicSinks.dom
    )
    .map(([accountInfo, route, createNewTopic]) =>
      div([accountInfo, route, createNewTopic])
    );
  const effects = model(sources);
  return {
    dom: dom$,
    state: xs.merge(effects.state, createNewTopicSinks.state),
    history: route$.map(s => s.history || xs.never()).flatten(),
    http: xs.merge(
      effects.http,
      createNewTopicSinks.http,
      accountInfoSinks.http
    )
  };
}

run(withState(main, "state"), {
  dom: makeDOMDriver("#app"),
  history: historyDriver,
  http: makeHTTPDriver()
});
