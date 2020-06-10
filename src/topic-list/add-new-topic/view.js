import { form, button, fieldset, input, label } from "@cycle/dom";

export default function view(sources) {
  return sources.local.stream.map(local =>
    form(
      ".new-topic",
      fieldset(
        {
          attrs: { disabled: local.waiting }
        },
        [
          label({ attrs: { for: "title " } }, "Title"),
          input({
            attrs: { name: "title", id: "title" }
          }),
          button({ attrs: { type: "submit" } }, "Okay")
        ]
      )
    )
  );
}
