import { ObjectId } from "mongodb";

import { assert } from "../utility/index";

// export function getLinks(db, payload) {
//   assert(Array.isArray(payload.linkIds), '"linkIds" is an array', payload);
//   assert(
//     payload.linkIds.every(id => typeof id === "string"),
//     '"linkIds" are strings',
//     payload
//   );
// }

export function toLink({ _id: id, ...link }) {
  return { id, ...link };
}

export function getLinkInformation(db, href) {
  assert(typeof href === "string", 'need "href" string', href);
  return db
    .collection("links")
    .findOne({ _id: href })
    .then(toLink);
}

export async function getTopicLinksInformation(db, topicId) {
  const topic = await db
    .collection("topics")
    .findOne({ _id: new ObjectId(topicId) });
  assert(topic.linkIds, `"topicId" should have associated "linkIds"`, topic);
  const links = await db
    .collection("links")
    .find({ _id: { $in: topic.linkIds } })
    .toArray()
    .then(results => results.map(toLink));
  return links;
}

export function addLinkInformation(db, payload) {
  assert(typeof payload.linkId === "string", 'need "linkId"', payload);
  assert(typeof payload.href === "string", `payload needs "href"`, payload);
  const { href, ...link } = payload;
  return db
    .collection("links")
    .findOneAndUpdate({ _id: href }, { $set: link }, { returnOriginal: false })
    .then(result => toLink(result.value));
}
