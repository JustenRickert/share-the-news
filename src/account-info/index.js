import xs from "xstream";
import isolate from "@cycle/isolate";
import { withState } from "@cycle/state";

import view from "./view";
import intent from "./intent";
import model from "./model";

function AccountInfo(sources) {
  const dom$ = view(sources);
  const action = intent(sources);
  const effects = model(action);

  const initAccountReducer$ = xs.of(() => ({
    viewType: "sign-in" // sign-in | create-account
  }));

  return {
    dom: dom$,
    account: xs.merge(initAccountReducer$, effects.account),
    http: effects.http
  };
}

export default isolate(withState(AccountInfo, "account"), {
  state: null,
  http: null
});
