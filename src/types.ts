import { Stream } from "xstream";
import { VNode, MainDOMSource } from "@cycle/dom";
import { StateSource } from "@cycle/state";
import { HTTPSource, RequestOptions } from "@cycle/http";

export interface Topic {
  id: string;
  linkIds: string[];
  submittedDate: string;
  submittedBy: string;
  title: string;
}

export interface Link {
  id: string;
}

export interface State {
  location: {
    pathname: string;
    topic: null | {
      topicId: string;
    };
  };
  user: {
    loading: boolean;
    info: null | { username: string };
  };
  links: {
    record: Record<string, Link>;
  };
  topics: {
    loaded: boolean;
    record: Record<string, Topic>;
    idList: string[];
  };
}

export interface Sources<S = State> {
  dom: MainDOMSource;
  state: StateSource<S>;
  http: HTTPSource;
}

export interface Navigation {
  pathname: string;
}

export interface Sinks<S = State> {
  nav: Stream<Navigation>;
  dom: Stream<VNode>;
  state: Stream<(state: S) => S>;
  http: Stream<RequestOptions>;
}
