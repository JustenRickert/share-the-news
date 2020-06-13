import { Stream } from "xstream";
import { DOMSource, VNode } from "@cycle/dom";
import { StateSource } from "@cycle/state";
import { HTTPSource, RequestOptions } from "@cycle/http";

export interface State {
  location: {
    pathname: string;
  };
  user: {
    loading: boolean;
    info: null | { username: string };
  };
  topics: {
    loaded: boolean;
    list: null | Topic[];
  };
}

export interface Sources<S = State> {
  dom: DOMSource;
  state: StateSource<S>;
  http: HTTPSource;
}

export interface Sinks {
  dom: Stream<VNode>;
  state: Stream<(state: State) => State>;
  http: Stream<RequestOptions>;
}

export interface Topic {
  id: string;
  linkIds: string[];
  submittedDate: string;
  submittedBy: string;
  title: string;
}
