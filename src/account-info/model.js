import xs from "xstream";

import { set, update } from "../../utility/index";

export default function model(action) {
  const accountViewTypeReducer$ = action.switchViewType.mapTo(state =>
    update(state, "viewType", t =>
      t === "sign-in" ? "create-account" : "sign-in"
    )
  );

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

  const clickSignInReducer$ = xs
    .merge(action.clickSignIn, action.clickCreateAccount)
    .mapTo(state => set(state, "user.waiting", true));

  return {
    http: xs.merge(clickSignInRequest$, clickCreateAccountRequest$),
    state: xs.merge(clickSignInReducer$),
    account: xs.merge(accountViewTypeReducer$)
  };
}
