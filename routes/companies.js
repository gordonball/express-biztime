"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");
const router = new express.Router();


const app = require("../app");
const db = require("../db");

/** A simple GET request that returns a list of companies as JSON.
 * Example: {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
        FROM companies`
        //TODO: Add order by
  );
  return res.json({ companies: results.rows });
});


/**  Taking in a Company Code as URL parameter, it returns that company
 *  detail as JSON. Example: {company: {code, name, description}}
 *  If company not found, a 404 error is returned. s
 */
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

  return res.json({ company })

});


/**  Given a company code, name and description in the JSON body, function
 *  creates a new company instance, adds it to the database, and then returns the data
 *  as JSON. Example response: {company: {code, name, description}}
 */
router.post("/", async function (req, res) {
  const { code, name, description } = req.body
  // const company = req.body
  //TODO: At least make sure req.body isn't undefined


  // Object.values(company).forEach(field => field === ""
  //   ? throw new BadRequestError("You cannot pass in empty fields")
  //   : continue; );

  const result = await db.query(
    `INSERT INTO companies
        (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
    [code, name, description],
  );
  const resultCompany = result.rows[0];
  return res.status(201).json({ company: resultCompany });
})

/** Given a company code in the URL and a name and description in the JSON body
 * example request body: {name, description},
 * edits the company in the database and returns a JSON object of the updated company.
 * Example response: {company: {code, name, description}}.
 * If the company code is not found, it returns a NotFoundError 404.
 */

router.put("/:code", async function (req, res) {

  //TODO: If req.body is undefined, return BadRequestError
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

  return res.json({company});
})

/** Given a company code in the URL, this function will delete the company
 * from the database. Upon successful deletion, it will return {status: "deleted"}.
 * If the company code is not found, it returns a NotFoundError 404 error.
*/

router.delete("/:code", async function(req, res) {
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

  return res.json({status: "deleted"})

})

module.exports = router;