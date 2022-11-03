"use strict";

const express = require("express");
const { NotFoundError } = require("../expressError");
const router = new express.Router();


const app = require("../app");
const db = require("../db");

router.get("/", async function (req, res) {
  const results = await db.query(`SELECT code, name FROM companies`);
  res.json({companies: results.rows});
})

module.exports = router;