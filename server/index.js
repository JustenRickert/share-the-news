import express from "express";

import setup from "./setup";
import { addNewTopic, getTopics, addTopicLink } from "./topics";
import { createNewUser, getUser, getUserById } from "./users";
import validateUrl from "./validate-url";
import { assert } from "../utility/index";

const app = express();

setup(app).then(({ mongodb }) => {
  app.post("/api/user/new", (req, res) => {
    createNewUser(mongodb, req.body)
      .then(({ insertedId, username }) => {
        req.session.userId = insertedId;
        res.status(200).json({ username });
      })
      .catch(({ error }) => res.status(400).send(error));
  });

  app.get("/api/user/information", (req, res) => {
    if (req.session.userId)
      return getUserById(mongodb, req.session.userId).then(({ username }) =>
        res.status(200).json({ username })
      );
    return res.status(404).send();
  });

  app.post("/api/user/information", (req, res) => {
    return getUser(mongodb, req.body)
      .then(({ username, id }) => {
        req.session.userId = id;
        res.status(200).json({ username });
      })
      .catch(({ error }) => res.status(400).send(error));
  });

  app.post("/api/validate", (req, res) => {
    validateUrl(req.body.url)
      .then(() => res.status(200).send())
      .catch(() => res.status(404).send());
  });

  app.post("/api/add-new-topic", (req, res) => {
    addNewTopic(mongodb, {
      ...req.body,
      submittedBy: req.session.userId
    }).then(({ insertedId }) => {
      res.status(200).send(insertedId);
    });
  });

  app.get("/api/topics", (_req, res) => {
    getTopics(mongodb).then(topics => {
      res.status(200).json(topics);
    });
  });

  app.post("/api/topic/:topicId", async (req, res) => {
    assert(req.body.href, `need "href"`, req.body);
    try {
      await validateUrl(req.body.href);
    } catch (e) {
      console.error(e);
      return res.status(400).send("bad-link");
    }
    return addTopicLink(mongodb, {
      topicId: req.params.topicId,
      link: req.body
    }).then(() => res.status(200).send(), () => res.status(500).send());
  });

  app.use(express.static("public"));

  app.all("*", req => console.error(req.body, req.method, req.url));

  app.listen(10002, err => {
    if (err) throw err;
    console.log("listening... 10002");
  });
});
