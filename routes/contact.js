const express = require("express")
const Joi = require("joi")
const mysql = require("mysql-await")

const config = require("../config/config")


const router = express.Router()
const pool = mysql.createPool(config.database)

const schema = Joi.object({
    name: Joi.string().min(3).max(99).regex(/[a-zA-Z][a-zA-Z ]+[a-zA-Z]$/).required().messages({
        "string.pattern.base": "Name can only contain aphlabets and whitespace"
    }),
    email: Joi.string().email().required(),
    msg: Joi.string().required().label("message"),
    _route: Joi.string().regex(/^\/([a-z]+)?$/).required().label("route").messages({
        "string.pattern.base": "Invalid route specified"
    }),
    _csrf: Joi.string().required().label("token")
})

router.get("/", async (req, res) => {
    try {
        const formErrors = await req.consumeFlash("form-error")
        const formData = await req.consumeFlash("form-data")
        const formSuccess = await req.consumeFlash("form-success")
        res.render("contact", {formErrors, formData, formSuccess, route: "/contact", token: req.csrfToken()})
    } catch (error) {
        res.status(500).send("An error occured")
    }
    
})

router.post("/", async (req, res) => {
    const route = req.body._route
    try {
        const validate = await schema.validateAsync(req.body)
        const sql = `INSERT INTO contact_msg (name, email, msg) VALUES (?, ?, ?);`
        const data = Object.values(validate)//extract values into an array
        const result = await pool.awaitQuery(sql, data)
        if(result.affectedRows > 0) {
            await req.flash('form-success', "Thank you for your feedback. We'll get back to you as soon as possible.")
            res.redirect(route)
        } else {
            await req.flash('form-error', "There seem to be some database error. Please, try again. If problem persist, Do well to contact admin by sending us an e-mail at admin@cron.com")
            res.redirect(route)
        }
    } catch (error) {
        try {
            await req.flash('form-error', error.details[0].message)
            await req.flash('form-data', error._original)
            res.redirect(route)
        } catch (err) {
            console.log(err)
            res.status(500).send("An error occured.\n")
        }
    }
})

module.exports = router