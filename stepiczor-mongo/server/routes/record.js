const express = require("express");
const recordRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

recordRoutes.route("/products").get(async function (req, response) {
  const db_connect = dbo.getDb();

  let sortBy = req.query.sortBy;
  let lessThan = req.query.lessThan;
  let moreThan = req.query.moreThan;
  let filterBy = req.query.filterBy;

  sortBy = sortBy === undefined ? "name" : sortBy;
  filterBy = filterBy === undefined ? "price" : filterBy;
  lessThan = lessThan === undefined ? 1000000 : parseInt(lessThan);
  moreThan = moreThan === undefined ? 0 : parseInt(moreThan);

  await db_connect
    .collection("products")
    .find({ [filterBy]: { $gt: moreThan, $lt: lessThan } })
    .sort({ [sortBy]: 1 })
    .toArray(function (err, result) {
      if (err) throw err;
      response.status(200).json(result);
    });
});

recordRoutes.route("/products").post(async function (req, response) {
  const db_connect = dbo.getDb();
  await db_connect
    .collection("products")
    .findOne({ name: req.body.name }, function (err, res) {
      if (err) throw err;
      if (res == null) {
        db_connect
          .collection("products")
          .insertOne(req.body, function (err, res) {
            if (err) throw err;
            response.status(201).json(res);
          });
      } else {
        response.status(400).send("Produkt już istnieje.");
      }
    });
});

recordRoutes.route("/products/:id").put(async function (req, response) {
  const db_connect = dbo.getDb();
  const myquery = { _id: ObjectId(req.params.id) };
  await db_connect
    .collection("products")
    .updateOne(myquery, req.body, function (err, res) {
      if (err) throw err;
      console.log("1 document updated successfully");
      response.status(201).json(res);
    });
});

recordRoutes.route("/products/:id").delete(async function (req, response) {
  const db_connect = dbo.getDb();
  if (req.params.id.length != 24) {
    response.status(404).send("Produkt nie istnieje.");
  } else {
    const myquery = { _id: ObjectId(req.params.id) };

    await db_connect
      .collection("products")
      .findOne(myquery, function (err, res) {
        if (err) throw err;
        if (res == null) {
          response.status(404).send("Produkt nie istnieje.");
        } else {
          db_connect
            .collection("products")
            .deleteOne(myquery, function (err, obj) {
              if (err) throw err;
              console.log(`1 document deleted: ${req.params.id}`);
              response.status(200).json(obj);
            });
        }
      });
  }
});

recordRoutes.route("/raport").get(async function (req, response) {
  const db_connect = dbo.getDb();
  const aggregate = db_connect.collection("products").aggregate([
    {
      $project: {
        name: 1,
        description: 1,
        amount: 1,
        price: 1,
        total: { $multiply: ["$price", "$amount"] },
      },
    },
  ]);
  let arr = [];
  for await (const elem of aggregate) {
    arr = [...arr, elem];
  }
  response.status(200).json(arr);
});

module.exports = recordRoutes;
