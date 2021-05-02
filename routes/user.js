const express = require("express")
const Joi = require("joi")
const mysql = require("mysql-await")
const bcrypt = require("bcryptjs")

const config = require("../config/config")


const router = express.Router()
const pool = mysql.createPool(config.database)

const signupSchema = Joi.object({
    username: Joi.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_]+$/).required().messages({
        "string.pattern.base": "Username can only contain letters, numbers and underscore"
    }),
    email: Joi.string().trim().email().max(100).required(),
    password: Joi.string().min(8).max(99).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+=]).*$/).required().messages({
        "string.pattern.base": "Password must contain uppercase and lowercase letters, numbers and any of the following symbols @ # $ % ^ & + ="
    }),
    re_password: Joi.ref("password"),
    _csrf: Joi.string().required().label("token")
})

router.get("/login", async (req, res) => {
    try {
        const formErrors = await req.consumeFlash("form-error")
        const formData = await req.consumeFlash("form-data")
        const formSuccess = await req.consumeFlash("form-success")
        res.render("login", {formErrors, formData, formSuccess, token: req.csrfToken()})
    } catch(error) {
        console.log(error)
        res.status(500).send("An error occured")
    }
})
//implement login
router.post("/login", (req, res) => {
    
})

router.get("/signup", async (req, res) => {
    try {
        const formErrors = await req.consumeFlash("form-error")
        const formData = await req.consumeFlash("form-data")
        const formSuccess = await req.consumeFlash("form-success")
        res.render("signup", {formErrors, formData, formSuccess, token: req.csrfToken()})
    } catch (error) {
        res.status(500).send("An error occured")
    }
})

router.post("/signup", async (req, res) => {
    const route = "/auth/signup"
    try {
        const validate = await signupSchema.validateAsync(req.body)
        const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?);"
        const salt = await bcrypt.genSalt(10)
        const data = Object.values(validate)//extract values into an array
        data[2] = await bcrypt.hash(data[2], salt)
        const result = await pool.awaitQuery(sql, data)
        if(result.affectedRows > 0) {
            await req.flash('form-success', "Sign up successful. You can now log in.")
            res.redirect("/auth/login")
        } else {
            await req.flash('form-error', "There seem to be some database error. Please, try again. If problem persist, Do well to contact admin by sending us an e-mail at admin@cron.com")
            res.redirect(route)
        }
    } catch(error) {
        try {
            if(error.details) {
                await req.flash('form-error', error.details[0].message)
                await req.flash('form-data', error._original)
            } else {
                await req.flash("form-error", "Something went wrong.")
            }
            res.redirect(route)
        } catch (err) {
            console.log(err)
            res.status(500).send("An error occured.\n")
        }
    }
})
/*
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
})*/

module.exports = router