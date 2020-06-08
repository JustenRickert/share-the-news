import xs from "xstream";

// import Topic from "./topic";
import { set, update, updateAll } from "../utility/index";

export default function model(sources) {
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
