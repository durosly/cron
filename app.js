const express = require("express")
const session = require('express-session')
const { flash } = require('express-flash-message')
const csurf = require('csurf')
const mysql = require("mysql-await")

const config = require("./config/config")
const contact = require("./routes/contact")
const user = require("./routes/user")

const app = express()

// express-session
app.use(
    session({
      secret: 'secret',
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        // secure: true, // becareful set this option, check here: https://www.npmjs.com/package/express-session#cookiesecure. In local, if you set this to true, you won't receive flash as you are using `http` in local, but http is not secure
      },
    })
)
// apply express-flash-message middleware
app.use(flash({ sessionKeyName: 'flashMessage' }))

//set view engine
app.set("view engine", "ejs")

//set static files folder
app.use(express.static("public"))

//middleware to handle form data
app.use(express.urlencoded({extended: true}))

//add csrf (cross site request forgery)
app.use(csurf())

//test connection
const pool = mysql.createPool(config.database)
const testConnection = async () => {
    try {
        const connection = await pool.awaitGetConnection()
        connection.release()
    } catch(error) {
        console.log("An error occured trying to connect to database from app handler")
    }
}
testConnection()
//end test

app.get("/", async (req, res) => {
    try {
        const formErrors = await req.consumeFlash("form-error")
        const formData = await req.consumeFlash("form-data")
        const formSuccess = await req.consumeFlash("form-success")
        res.render("index", {formErrors, formData, formSuccess, route: req.url, token: req.csrfToken()})
    } catch (error) {
        res.status(500).send("An error occured")
    }
})

app.get("/about", (req, res) => {
    res.render("about")
})

app.get("/services", (req, res) => {
    res.render("services")
})

app.get("/blog", (req, res) => {
    res.render("blog")
})

app.use("/contact", contact)

app.use("/auth", user)

// error handler
app.use( (err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)
  
    // handle CSRF token errors here
    res.status(403).send('form tampered with')
})

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Listening on port ${port}...`))