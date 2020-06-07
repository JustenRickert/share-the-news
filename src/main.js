import xs from "xstream";
import { run } from "@cycle/run";
import { makeHTTPDriver } from "@cycle/http";
import { makeDOMDriver, div } from "@cycle/dom";
import { withState } from "@cycle/state";

// import Topic from "./topic";
import AccountInfo from "./account-info";
import TopicList from "./topic-list";
import CreateNewTopic from "./create-new-topic";
import { set, update, updateAll } from "../utility/index";

function model(sources) {
  const initStateReducer$ = xs.of(() => ({
    user: {
      information: null,
      waiting: true
    },
    topics: null
  }));

  const requestTopics$ = xs.of({
    url: "/api/topics",
    category: "topics"
  });

  const initTopicsReducer$ = sources.http
    .select("topics")
    .flatten()
    .map(res => state => set(state, "topics", res.body));

  const requestUserInformation$ = xs.of({
    url: "/api/user/information",
    category: "sign-in",
    ok: res => [200, 404].some(s => s === res.status)
  });

  const initUserInformationReducer$ = sources.http
    .select("sign-in")
    .flatten()
    .map(res => state => {
      switch (res.status) {
        case 200:
          return updateAll(
            state,
            ["user.information", res.body],
            ["user.waiting", false]
          );
        case 404:
          return update(state, "user.waiting", false);
        default:
          throw new Error("not impl");
      }
    });

  return {
    http: xs.merge(requestUserInformation$, requestTopics$),
    state: xs.merge(
      initStateReducer$,
      initTopicsReducer$,
      initUserInformationReducer$
    )
  };
}

function main(sources) {
  const accountInfoSinks = AccountInfo(sources);
  const createNewTopicSinks = CreateNewTopic(sources);
  const topicListSinks = TopicList(sources);
  const dom$ = xs
    .combine(accountInfoSinks.dom, topicListSinks.dom, createNewTopicSinks.dom)
    .map(([accountInfo, topicList, createNewTopic]) =>
      div([accountInfo, topicList, createNewTopic])
    );
  const effects = model(sources);
  return {
    dom: dom$,
    state: xs.merge(effects.state, createNewTopicSinks.state),
    http: xs.merge(
      effects.http,
      createNewTopicSinks.http,
      accountInfoSinks.http
    )
  };
}

run(withState(main, "state"), {
  dom: makeDOMDriver("#app"),
  http: makeHTTPDriver()
});
