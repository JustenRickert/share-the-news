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
import { cond } from "../utility/index";

const makeRouteCond = cond(
  [history => !history.hash, () => makeTopicList],
  [history => history.hash, history => makeTopic(history.hash)]
);

function main(sources) {
  const accountInfoSinks = AccountInfo(sources);
  const route$ = sources.history.stream
    .map(makeRouteCond)
    .map(makeRoute => makeRoute(sources))
    .flatten();
  const dom$ = xs
    .combine(accountInfoSinks.dom, route$.map(s => s.dom).flatten())
    .map(([accountInfo, route]) => div([accountInfo, route]));
  const effects = model(sources);
  return {
    dom: dom$,
    state: xs.merge(
      effects.state,
      route$.map(s => s.state || xs.never()).flatten()
    ),
    history: route$.map(s => s.history || xs.never()).flatten(),
    http: xs.merge(
      effects.http,
      accountInfoSinks.http,
      route$.map(s => s.http || xs.never()).flatten()
    )
  };
}

run(withState(main, "state"), {
  dom: makeDOMDriver("#app"),
  history: historyDriver,
  http: makeHTTPDriver()
});
