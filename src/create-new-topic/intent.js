export default function intent(sources) {
  const createNewTopic$ = sources.dom
    .select("form.new-topic")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { title } } }) => ({
      title: title.value.trim()
    }));
  return {
    createNewTopic: createNewTopic$
  };
}
