import { assert } from "../utility/index";

export function getTopics(db) {
  return db
    .collection("topics")
    .find()
    .toArray();
}

export function createNewTopic(db, payload) {
  assert(payload.title, `"title" is required in new topic`, payload);
  assert(
    payload.submittedBy,
    `"submittedBy" is required in new topic`,
    payload
  );
  return db.collection("topics").insertOne({
    ...payload,
    createdDate: new Date()
  });
}
