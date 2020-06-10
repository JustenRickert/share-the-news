import { ObjectId } from "mongodb";

import { assert } from "../utility/index";

export function getTopics(db) {
  return db
    .collection("topics")
    .find()
    .sort({ createdDate: -1 })
    .toArray()
    .then(topics =>
      topics.map(t => {
        t.id = t._id;
        delete t._id;
        return t;
      })
    );
}

export function addNewTopic(db, payload) {
  assert(payload.title, `"title" is required in new topic`, payload);
  assert(
    payload.submittedBy,
    `"submittedBy" is required in new topic`,
    payload
  );
  return db.collection("topics").insertOne({
    ...payload,
    links: [],
    createdDate: new Date()
  });
}

export function addTopicLink(db, payload) {
  assert(payload.topicId, `"topicId" required`, payload);
  assert(payload.link, `"link", required`, payload);
  assert(
    typeof payload.link.href === "string",
    `link "href" required`,
    payload.link
  );
  return addTopicLinks(db, {
    topicId: payload.topicId,
    links: [payload.link]
  });
}

export function addTopicLinks(db, payload) {
  assert(payload.topicId, `"topicId" required`, payload);
  assert(Array.isArray(payload.links), `"links", Array, required`, payload);
  assert(
    payload.links.every(l => typeof l.href === "string"),
    `links "href" required`,
    payload.links
  );
  return db
    .collection("topics")
    .updateOne(
      { _id: new ObjectId(payload.topicId) },
      { $push: { links: { $each: payload.links } } }
    );
}
