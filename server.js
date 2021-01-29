// creates express app
var express = require("express");
var app = express()
var db = require("./database.js");
var md5 = require("md5");

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

//server port
const HTTP_PORT = 8000;
//start server
app.listen(HTTP_PORT, () => {
    console.log(`Server running on port: ${HTTP_PORT}`);
});

//root endpoint
app.get("/", (req, res, next) => {
    res.json({"message":"Ok"})
});

//other endpoints
app.get('/api/users', (req, res, next) => {
    var sql = 'select * from user'
    var params = []
    db.all(sql, params, (err, rows) => {
        if(err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
});

app.get('/api/users/:id', (req, res, next) => {
    var sql = "select * from user where id = ?"
    var params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if(err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": row
        })
    });
});

//creating new users
app.post("/api/user/", (req, res, next) => {
    var errors = []
    if(!req.body.password){
        errors.push("No password specified");
    }
    if(!req.body.email){
        errors.push("No email specified");
    }
    if(errors.length){
        res.status(400).json({"error": error.join(",")});
        return;
    }
    var data = {
        name: req.body.name,
        email: req.body.email,
        password: md5(req.body.password)
    }
    var sql ='INSERT INTO user (name, email, password) VALUES (?,?,?)'
    var params= [data.name, data.email, data.password]
    db.run(sql, params, function (err, result) {
        if(err) {
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success",
            "data": data,
            "id": this.lastID
        })
    });
})

//updating users datails
app.patch("/api/user/:id", (req, res, next) => {
    var data = {
        name: req.body.name,
        email:req.body.email,
        password: req.body.password ? md5(req.body.password): null
    }
    db.run(
        `UPDATE user set
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        password = COALESCE(?, password)
        WHERE id = ?`,
        [data.name, data.email, data.password, req.params.id],
        function (err, result) {
            if(err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({
                message: "success",
                data: data,
                changes: this.changes
            })
        });
})

//delete a user
app.delete("/api/user/:id", (req, res, next) => {
    db.run(
        'DELETE FROM user WHERE id = ?',
        req.params.id,
        function (err, result) {
            if(err) {
                res.status(400).json({"error": err.message})
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
        }
    );
})

//default reponse for any other requests to the server
app.use(function(req, res){
    res.status(404);
});
