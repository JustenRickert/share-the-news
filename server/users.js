import { ObjectId } from "mongodb";

import { assert } from "../utility/index";

export function createNewUser(db, user) {
  assert(user.username, user.password, `Need "username" and "password"`, user);
  const collection = db.collection("users");
  return collection.findOne({ username: user.username }).then(result => {
    if (result) throw { error: "username-exists-already" };
    return collection
      .insertOne({
        ...user,
        createdDate: new Date()
      })
      .then(({ insertedId }) => ({
        insertedId,
        username: user.username
      }));
  });
}

export function getUserById(db, userId) {
  assert(userId, `Need "userId"`);
  return db
    .collection("users")
    .findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: false } }
    );
}

export function getUser(db, user) {
  assert(user.username, user.password, `Need "username" and "password"`, user);
  return db
    .collection("users")
    .findOne(user)
    .then(result => {
      if (!result) throw { error: "no-username-or-bad-password" };
      return { username: result.username, id: result._id };
    });
}
