import xs from "xstream";

import { set, update } from "../../utility/index";

export default function model(action) {
  const accountViewTypeReducer$ = action.switchViewType.mapTo(state =>
    update(state, "viewType", t =>
      t === "sign-in" ? "create-account" : "sign-in"
    )
  );

  const clickSignInReducer$ = xs
    .merge(action.clickSignIn, action.clickCreateAccount)
    .mapTo(state => set(state, "user.waiting", true));

  return {
    state: xs.merge(clickSignInReducer$),
    account: xs.merge(accountViewTypeReducer$)
  };
}
