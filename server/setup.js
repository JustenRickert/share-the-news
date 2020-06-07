import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import { MongoClient } from "mongodb";
import ConnectMongo from "connect-mongo";

export default function setup(app) {
  const MongoSessionStore = ConnectMongo(session);

  const mongoUrl = "mongodb://localhost:27017";
  const mongoDbName = "leftist";

  const mongoClientPromise = MongoClient.connect(mongoUrl).catch(err => {
    console.error(err);
    process.exit(1);
  });

  const expressSessionConfig = {
    secret: "TODO change me ENV variable or something maybe who cares",
    saveUninitialized: false,
    resave: false,
    store: new MongoSessionStore({
      clientPromise: mongoClientPromise,
      dbName: mongoDbName,
      url: mongoUrl
    }),
    cookie: {}
  };

  app.use(
    cors({
      origin: "http://localhost:10001"
    })
  );
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(session(expressSessionConfig));

  return mongoClientPromise.then(mongoclient => {
    const mongodb = mongoclient.db(mongoDbName);
    return {
      mongoclient,
      mongodb
    };
  });
}
