import xs from "xstream";

import { set, setAll, update, updateAll } from "../utility/index";

export default function model(sources) {
  const initStateReducer$ = xs.of(() => ({
    user: {
      information: null,
      waiting: true
    },
    topicIds: null,
    topicRecord: null,
    linkRecord: {}
  }));

  const requestTopics$ = xs.of({
    url: "/api/topics",
    category: "topics"
  });

  const topicsResponse$ = sources.http.select("topics").flatten();

  const initTopicsReducer$ = topicsResponse$.map(({ body: topics }) => state =>
    setAll(
      state,
      ["topicIds", topics.map(t => t.id)],
      [
        "topicRecord",
        topics.reduce(
          (r, t) => ({
            ...r,
            [t.id]: set(t, "linkIds", (t.links || []).map(t => t.href)) // TODO delete `|| []`
          }),
          {}
        )
      ],
      [
        "linkRecord",
        topics
          .filter(t => t.links) // TODO delete this line
          .flatMap(t => t.links)
          .reduce(
            (links, l) => ({
              ...links,
              [l.href]: l
            }),
            {}
          )
      ]
    )
  );

  const userInformationRequest$ = xs.of({
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
            [["user", "information"], res.body],
            [["user", "waiting"], false]
          );
        case 404:
          return update(state, ["user", "waiting"], false);
        default:
          throw new Error("not impl");
      }
    });

  const addNewTopicResponseReducer$ = sources.http
    .select("add-new-topic")
    .flatten()
    .map(({ body: topicId, request: { send: topic } }) => state =>
      updateAll(
        state,
        ["topicIds", ids => [topicId].concat(ids)],
        [["topicRecord", topicId], { id: topicId, ...topic, linkIds: [] }]
      )
    );

  return {
    http: xs.merge(userInformationRequest$, requestTopics$),
    state: xs.merge(
      initStateReducer$,
      initTopicsReducer$,
      initUserInformationReducer$,
      addNewTopicResponseReducer$
    )
  };
}
