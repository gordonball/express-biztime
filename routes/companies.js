"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");
const router = new express.Router();


const db = require("../db");

/** A simple GET request that returns a list of companies as JSON.
 * Example: {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
        FROM companies
        ORDER BY name`
  );
  return res.json({ companies: results.rows });
});


/**  Taking in a Company Code as URL parameter, it returns that company
 *  detail as JSON.
 *  Example response: {company: {code, name, description, invoices: [id, ...]}}
 *  If company not found, a 404 error is returned. s
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;
  const cResult = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [code]);

  const company = cResult.rows[0];

  if (!company) {
    throw new NotFoundError(`Not found ${code}`);
  };

  const iResults = await db.query(
    `SELECT id, comp_code
        FROM invoices
        WHERE comp_code = $1`, [code]);
  const invoices = iResults.rows;

  company.invoices = invoices;



  return res.json({ company });

});


/**  Given a company code, name and description in the JSON body, function
 *  creates a new company instance, adds it to the database, and then returns the data
 *  as JSON. Example response: {company: {code, name, description}}
 */
router.post("/", async function (req, res) {
  const { code, name, description } = req.body;

  if (req.body === undefined) {
    throw new BadRequestError("No data provided in request")
  }

  const result = await db.query(
    `INSERT INTO companies
        (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
    [code, name, description],
  );
  const resultCompany = result.rows[0];
  return res.status(201).json({ company: resultCompany });
});

/** Given a company code in the URL and a name and description in the JSON body
 * example request body: {name, description},
 * edits the company in the database and returns a JSON object of the updated company.
 * Example response: {company: {code, name, description}}.
 * If the company code is not found, it returns a NotFoundError 404.
 */

router.put("/:code", async function (req, res) {

  if (req.body === undefined) {
    throw new BadRequestError("No data provided in request")
  }

  const companyCode = req.params.code;

  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
        SET name= $2,
        description= $3
        WHERE code = $1
        RETURNING code, name, description`,
    [companyCode, name, description],
  );
  const company = result.rows[0];

  if (!company) {
    throw new NotFoundError(`Not found ${companyCode}`);
  };

  return res.json({ company });
});

/** Given a company code in the URL, this function will delete the company
 * from the database. Upon successful deletion, it will return {status: "deleted"}.
 * If the company code is not found, it returns a NotFoundError 404 error.
*/

router.delete("/:code", async function (req, res) {
  const companyCode = req.params.code;
  const result = await db.query(
    `DELETE FROM companies
        WHERE code = $1
        RETURNING name`,
    [companyCode],
  );

  if (!result.rows[0]) {
    throw new NotFoundError(`Not found ${companyCode}`);
  };

  return res.json({ status: "deleted" });

});

module.exports = router;