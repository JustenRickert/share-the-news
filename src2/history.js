import { adapt } from "@cycle/run/lib/adapt";
import xs from "xstream";

const DEFAULT_PAGINATION = {
  hash: window.location.hash.slice(1)
};

export function historyDriver(navigation$) {
  let pagination = DEFAULT_PAGINATION;

  function handleGotoTopic({ event, topic }) {
    if (event && !event.defaultPrevented) event.preventDefault();
    pagination = {
      ...pagination,
      hash: topic.id
    };
    window.history.pushState(pagination, topic.title, "#" + topic.id);
  }

  function handleGotoTopicList({ event }) {
    if (event && !event.defaultPrevented) event.preventDefault();
    window.history.back();
  }

  function handleNavigationEvent(navigationEvent) {
    switch (navigationEvent.type) {
      case "goto-topic":
        return handleGotoTopic(navigationEvent);
      case "goto-topic-list":
        return handleGotoTopicList(navigationEvent);
    }
  }

  navigation$.addListener({
    next: handleNavigationEvent,
    error: console.error
  });

  let navigationStateListener;

  const state$ = xs.create({
    start: listener => {
      listener.next(pagination);
      navigationStateListener = {
        next: () => listener.next(pagination),
        error: console.error
      };
      navigation$.addListener(navigationStateListener);
      window.addEventListener("popstate", event => {
        pagination = event.state || DEFAULT_PAGINATION;
        listener.next(pagination);
      });
    },
    stop: () => {
      navigation$.removeListener(navigationStateListener);
    }
  });

  return { stream: adapt(state$) };
}
