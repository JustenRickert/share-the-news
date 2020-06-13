export default function intent(sources) {
  const clickSignIn$ = sources.dom
    .select(".sign-in-form")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { username, password } } }) => ({
      username: username.value,
      password: password.value
    }));

  const clickCreateAccount$ = sources.dom
    .select(".create-account-form")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { username, password } } }) => ({
      username: username.value,
      password: password.value
    }));

  const switchViewType$ = sources.dom
    .select(".switch-view-type")
    .events("click");

  return {
    clickSignIn: clickSignIn$,
    clickCreateAccount: clickCreateAccount$,
    switchViewType: switchViewType$
  };
}
