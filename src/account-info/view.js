import xs from "xstream";
import { button, fieldset, h3, form, input, label, div } from "@cycle/dom";

import { cond } from "../../utility/index";

function renderSignInForm(state) {
  return form(".sign-in-form", [
    h3("Sign in"),
    div(
      fieldset({ attrs: { disabled: state.user.waiting } }, [
        label({ attrs: { for: "username" } }, "Username"),
        input({
          attrs: {
            required: true,
            minlength: 3,
            maxlength: 20,
            name: "username",
            id: "username"
          }
        }),
        label({ attrs: { for: "password" } }, "Password"),
        input({
          attrs: {
            required: true,
            minlength: 8,
            maxlength: 20,
            name: "password",
            id: "password",
            type: "password"
          }
        }),
        button({ attrs: { type: "submit" } }, "Sign in!")
      ])
    ),
    button(".switch-view-type", "Create new account")
  ]);
}

function renderCreateAccountForm(state) {
  return form(".create-account-form", [
    h3("Create account"),
    div([
      fieldset({ attrs: { disabled: state.user.waiting } }, [
        label({ attrs: { for: "username" } }, "Username"),
        input({
          attrs: {
            required: true,
            minlength: 3,
            maxlength: 20,
            name: "username",
            id: "username"
          }
        }),
        label({ attrs: { for: "password" } }, "Password"),
        input({
          attrs: {
            required: true,
            minlength: 8,
            maxlength: 20,
            name: "password",
            id: "password",
            type: "password"
          }
        }),
        button({ attrs: { type: "submit" } }, "Create account!")
      ])
    ]),
    button(".switch-view-type", "Back to sign in")
  ]);
}

function renderUserInformation(state) {
  return div(["Hello, ", state.user.information.username]);
}

export default function view(sources) {
  const switchView = cond(
    [s => s.user.information, renderUserInformation],
    [(_, a) => a.viewType === "sign-in", renderSignInForm],
    [(_, a) => a.viewType === "create-account", renderCreateAccountForm]
  );

  return xs
    .combine(sources.state.stream, sources.account.stream)
    .map(([state, account]) => switchView(state, account));
}
