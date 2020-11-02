const express = require("express"),
      router = express.Router(),
      passport = require("passport"),
      User = require("../models/user"),
      Hotel = require("../models/hotel"),
      async = require("async"),
      nodemailer = require("nodemailer"),
      crypto = require("crypto");

//Landing Route
router.get("/", (req, res) => {
    res.render("landing");
});

// =================
//    AUTH ROUTES
// =================

// SHOW register form
router.get("/register",function(req, res){
    res.render("register", {page: 'register'});
});

//Handles Sign Up Logic
router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar,
        description: req.body.description
    });
    // eval(require('locus')); //stop the code for a few seconds and look at it
    if(req.body.adminCode === process.env.SECRETCODE) {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err) {
            // req.flash("error", err.message);
            return res.render("register", {"error": err.message});
        } 
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Hotel Simplified " + user.username);
            res.redirect("/hotels");
        })
    });
});

//SHOW LOGIN FORM 
router.get("/login", function(req, res){
    res.render("login", {page: 'login'});
});

//Handle Login Logic
router.post("/login", passport.authenticate("local", {
        successRedirect: "/hotels",
        failureRedirect: "/login"
    }), function(req, res){  
});

// Logout
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged You Out !");
    res.redirect("/hotels");
});

//FORGOT PASSWORD ROUTE
router.get('/forgot', function(req, res) {
    res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash("error", 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in ms
                                                          //link becomes invalid after an hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// USER PROFILE 
router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Something went wrong !");
            return res.redirect("/");
        } else {
            Hotel.find().where('author.id').equals(foundUser._id).exec(function(err, hotels){
                if(err) {
                    req.flash("error", "Something went wrong !");
                    return res.redirect("/");
                } 
                res.render("users/show", {user: foundUser, hotels, hotels});
            })
            
        }
    });
});

module.exports = router;