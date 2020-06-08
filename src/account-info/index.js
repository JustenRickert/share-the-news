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

  const clickCreateAccountRequest$ = action.clickCreateAccount.map(
    signInInformation => ({
      method: "post",
      url: "/api/user/new",
      category: "sign-in",
      send: signInInformation
    })
  );

  const clickSignInRequest$ = action.clickSignIn.map(signInInformation => ({
    method: "post",
    url: "/api/user/information",
    category: "sign-in",
    send: signInInformation
  }));

  return {
    dom: dom$,
    account: xs.merge(initAccountReducer$, effects.account),
    state: effects.state,
    http: xs.merge(clickCreateAccountRequest$, clickSignInRequest$)
  };
}

export default isolate(withState(AccountInfo, "account"), {
  state: null,
  http: null
});
