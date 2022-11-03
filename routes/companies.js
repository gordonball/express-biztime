"use strict";

const express = require("express");
const { NotFoundError } = require("../expressError");
const router = new express.Router();


const app = require("../app");
const db = require("../db");

/**  */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
        FROM companies`
  );
  return res.json({ companies: results.rows });
});


/**  */
router.get("/:code", async function (req, res) {
  const code = req.params.code;
  const results = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [code]);

  const company = results.rows[0]
  if (!company) {
    throw new NotFoundError(`Not found ${code}`);
  };

  return res.json({ company: company })

});


/**  */
router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body
  const result = await db.query(
    `INSERT INTO companies
        (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
    [code, name, description],
  );
  const company = result.rows[0];
  return res.status(201).json({ company: company });
})


module.exports = router;