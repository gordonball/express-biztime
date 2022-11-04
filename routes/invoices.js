"use strict";

const express = require("express");
const { NotFoundError } = require("../expressError");
const router = new express.Router();
const db = require("../db");

/** A simple GET request that returns a list of invoices as JSON
 * Example: {invoices: [{id, comp_code}, ...]}
*/

router.get('/', async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices
        ORDER BY id`
  );
  const invoices = results.rows
  return res.json({ invoices });
});

/** Taking an invoice ID at URL param, it returns that invoice detail as
 * JSON.
 * Example return value: {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}
 * If invoice Id is not found, 404 error is returned.
 */
router.get("/:id", async function (req, res) {
  const id = req.params.id;
  const iResult = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
        FROM invoices
        WHERE id = $1`, [id]);
  const invoice = iResult.rows[0];
//TODO: add 404
  const cResult = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [invoice.comp_code]);
  const company = cResult.rows[0];
  delete invoice.comp_code;

  invoice.company = company;

  return res.json({ invoice });
});

/** Given a comp_code and amount in the JSON body, example - {comp_code, amt} -
 * a new invoice is created and added to the database. The new invoice
 * object is returns as JSON
 * Example:
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {

  if (req.body === undefined) {
    throw new BadRequestError("No data provided in request")
  }

  const { comp_code, amt } = req.body;

  const result = await db.query(
    `INSERT INTO invoices
        (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt],
  );
  const invoice = result.rows[0];
  return res.status(201).json({ invoice })
})

/** Given an invoice Id in the URL and an amount (as JSON) in the body
 * ( Example input: {amt} ) it will update the invoice amount for the invoice
 * and return the new invoice details as JSON.
 * Example response: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function(req, res) {

  if (req.body === undefined) {
    throw new BadRequestError("No amount was provided")
  }

  const invoiceId = req.params.id;
  const invoiceAmt = req.body.amt;

  const result = await db.query(
    `UPDATE invoices
        SET amt = $2
        WHERE id = $1
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [invoiceId, invoiceAmt],
  );
  const invoice = result.rows[0];

  if (!invoice) {
    throw new NotFoundError(`No invoice found at ${invoiceId}`);
  };

  return res.json({ invoice });
});

/** Given an invoice id in the URL, this function will delete the invoice from
 * the database. Upon successful deletion, it will return JSON {status: "deleted"}.
 * If the invoice id is not found, it returns a 404 NotFoundError.
 */

router.delete("/:id", async function (req, res) {
  const invoiceId = req.params.id;
  const result = await db.query(
    `DELETE FROM invoices
        WHERE id = $1
        RETURNING id`,
        [invoiceId],
  );

  if (!result.rows[0]) {
    throw new NotFoundError(`No invoice found at ${invoiceId}`);
  };

  return res.json({ status: "deleted" })
});

module.exports = router;