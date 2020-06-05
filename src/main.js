import xs from "xstream";
import { run } from "@cycle/run";
import { makeDOMDriver, div } from "@cycle/dom";

function main(sources) {
  return {
    dom: xs.of(div("something else again"))
  };
}

run(main, {
  dom: makeDOMDriver("#app")
});

console.log("hella just no twice");
console.log("nice");
