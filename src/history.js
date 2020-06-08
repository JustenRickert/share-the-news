import { adapt } from "@cycle/run/lib/adapt";
import xs from "xstream";

const DEFAULT_PAGINATION = {
  hash: window.location.hash.slice(1)
};

export function historyDriver(navigation$) {
  let pagination = DEFAULT_PAGINATION;

  let navigationListener;

  function handleGotoTopic({ event, topic }) {
    if (!event.defaultPrevented) event.preventDefault();
    pagination = {
      ...pagination,
      hash: topic.id
    };
    window.history.pushState(pagination, topic.title, "#" + topic.id);
  }

  function handleGoBack({ event }) {
    if (!event.defaultPrevented) event.preventDefault();
    window.history.back();
  }

  function handleNavigationEvent(navigationEvent) {
    switch (navigationEvent.type) {
      case "goto-topic":
        return handleGotoTopic(navigationEvent);
      case "go-back":
        return handleGoBack(navigationEvent);
    }
  }

  navigation$.addListener({
    next: handleNavigationEvent,
    error: console.error,
    complete: () => {}
  });

  const state$ = xs.create({
    start: listener => {
      listener.next(pagination);
      navigationListener = {
        next: () => listener.next(pagination),
        error: console.error
      };
      navigation$.addListener(navigationListener);
      window.addEventListener("popstate", event => {
        pagination = event.state || DEFAULT_PAGINATION;
        listener.next(pagination);
      });
    },
    stop: () => {
      navigation$.removeListener(navigationListener);
    }
  });

  return { stream: adapt(state$) };
}
