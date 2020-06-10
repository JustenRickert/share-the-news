export default function intent(sources) {
  const createNewTopic$ = sources.dom
    .select("form.new-topic")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { title } } }) => ({
      title: title.value.trim()
    }));

  const createNewTopicResponse$ = sources.http.select("create-new-topic");

  return {
    createNewTopic: createNewTopic$,
    createNewTopicResponse: createNewTopicResponse$
  };
}
