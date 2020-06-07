export default function intent(sources) {
  const openNewLinkForm = sources.dom.select(".add-topic").events("click");
  const addNewLink = sources.dom
    .select(".new-topic")
    .events("submit", { preventDefault: true })
    .map(({ ownerTarget: { elements: { url } } }) => ({
      url: url.value
    }))
    .debug("new");
  const closeNewTopic = sources.dom.select(".close-new-topic").events("click");
  return {
    openNewLinkForm,
    addNewLink,
    closeNewTopic
  };
}
