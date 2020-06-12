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
    linkIds: [],
    createdDate: new Date()
  });
}

export function addTopicLinkComment(db, payload) {
  assert(payload.topicId, `need "topicId"`, payload);
  assert(payload.linkId, `need "linkId"`, payload);
  assert(payload.comment, `need "comment"`, payload);
  return db.collection("topics.comments").findOneAndUpdate(
    {
      _id: new ObjectId(payload.topicId),
      _linkId: new ObjectId(payload.linkId)
    },
    { $addToSet: { comments: comment } },
    { upsert: true }
  );
}

export function addTopicLink(db, payload) {
  assert(payload.topicId, `"topicId" required`, payload);
  assert(typeof payload.href === "string", `"href" is href`, payload);
  return addTopicLinks(db, {
    topicId: payload.topicId,
    hrefs: [payload.href]
  });
}

export function addTopicLinks(db, payload) {
  assert(payload.topicId, `"topicId" required`, payload);
  assert(Array.isArray(payload.hrefs), `"hrefs", Array, required`, payload);
  assert(
    payload.hrefs.every(href => typeof href === "string"),
    `"hrefs" are hrefs`,
    payload
  );
  return Promise.all([
    db
      .collection("topics")
      .findOneAndUpdate(
        { _id: new ObjectId(payload.topicId) },
        { $addToSet: { linkIds: { $each: payload.hrefs.map(href => href) } } },
        { returnOriginal: false }
      ),
    db
      .collection("links")
      .insertMany(payload.hrefs.map(href => ({ _id: href })), {
        ordered: false
      })
      .catch(() => {}) // okay if duplicates found and no insert
  ]);
}
