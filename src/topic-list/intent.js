export default function intent(sources) {
  const clickTopic$ = sources.dom
    .select(".topic-list-topic a")
    .events("click", { preventDefault: true });
  return {
    clickTopic: clickTopic$
  };
}
