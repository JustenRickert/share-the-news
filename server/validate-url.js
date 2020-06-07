import fetch from "node-fetch";

export default function validateUrl(url) {
  console.log("validating...", url);
  return fetch(url, {
    method: "get",
    headers: {
      Accept: "text/html"
    }
  });
}
