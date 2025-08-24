const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const User = require("./models/user.js")
const carpenter = require("./models/carpenter.js");
const elctrical = require("./models/elctrical.js");
const plumber = require("./models/plumber.js");
const Booking = require('./models/booking.js');
const methodOverride = require("method-override");
const passport=require("passport");
const localStrategy=require("passport-local");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const Review=require("./models/review.js");
const { selectFields } = require("express-validator/lib/field-selection.js");
// const Listing = require("./models/listing"); // Ensure this points to your plumber model
// const Review = require("./models/review"); 


 
const MONGO_URL = "mongodb://127.0.0.1:27017/utility";

main().then(()=>{
    console.log("conected to Database");
})
.catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.use(express.urlencoded({ extended: true }));
app.engine("ejs",ejsMate);
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"/public")));
app.use(methodOverride("_method"));
app.use(cookieParser("mysecretecode"));


const sessionOptions = {
    secret:"ourFirstProject",
    resave : false,
    saveUninitialized:true,
    rolling: true,
    cookie:{
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge : 1000 * 60 * 60 * 24 * 7,
        httpOnly : true,
    }
}

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currUser = req.user; // Make currUser available in all templates
    next();
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}



app.get("/home", (req, res)=>{
    res.render("./listings/home.ejs");
})


app.get("/signup", (req,res)=>{
    res.render("./users/signup.ejs");
});


app.post("/signup",wrapAsync(async(req,res)=>{
        let {username,email,password} = req.body;
       let newUser=new User({email,username});
       const registeredUser=await User.register(newUser,password);
       req.login(registeredUser,(err)=>{
           if(err){
               return next();
           }
        //    req.flash("success","welcome to wnaderlust");
       res.redirect("/home");
       })
}))

app.get("/login", async(req,res,next)=>{
    res.render("./users/login.ejs");
})

app.post("/login",
    passport.authenticate("local",{
        failureRedirect: '/login', 
        }), 
        wrapAsync(async(req,res)=>{
            res.redirect("/home");
}))

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/home");
    });
  });

app.get("/search", (req, res) => {
  let query = req.query.query ? req.query.query.trim().toLowerCase() : "";

  if (query.includes("plumber") || query.includes("plumbers")) {
    return res.redirect("/plumbers");
  } 
  else if (
    query.includes("electrician") || 
    query.includes("electrical")  || 
    query.includes("elctrical")   || 
    query.includes("electricians")
  ) {
    return res.redirect("/elctricals");  // ✅ Correct spelling of your route
  } 
  else if (query.includes("carpenter") || query.includes("carpenters")) {
    return res.redirect("/carpenters");
  } 
  else {
    // fallback
    return res.redirect("/home");
  }
});



// index book
app.get("/booking",async(req,res)=>{
    const allbook = await Booking.find({});
    res.render("carpenter/cart.ejs",{allbook});
});

//add bookings
app.get("/booking/new" , async(req ,res)=>{
   res.render("carpenter/book.ejs")
})


//show bookings
app.get("/booking/:id" ,async(req,res)=>{
   let{id} = req.params;
   const book = await Booking.findById(id);
   res.render("carpenter/bookshow.ejs",{book})
})

//create booking
app.post("/booking" ,isLoggedIn,async(req,res)=>{
   const newbook = new Booking(req.body.book);
   await newbook.save();
   // console.log(book);
   res.redirect("/booking")
})

//cancle booking
app.delete("/booking/:id",isLoggedIn,async(req,res)=>{
      let {id } = req.params;
    let canclebook =   await Booking.findByIdAndDelete(id);
    res.redirect("/booking");
})   






// Review Carpenter

app.get("/services",(req,res)=>{
    res.render("./listings/services.ejs")
})

app.get("/carpenters/:id/review", async (req, res) => {
    try { 
        const listing = await carpenter.findById(req.params.id)
            .populate({
                path: "reviews",
                populate: { path: "author", select: "username" },
            });

        if (!listing) {
            return res.status(404).send("Carpenter not found");
        }

        res.render("./listings/reviews.ejs", { listing });  
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// Route to add a review to a carpenter
app.post("/carpenters/:id/review", isLoggedIn,async (req, res) => {
    try {
        console.log("User:", req.user); // ✅ Check if req.user exists

        let listing = await carpenter.findById(req.params.id);
        if (!listing) {
            return res.status(404).send("Carpenter not found");
        }

        if (!req.user) {
            return res.status(401).send("You must be logged in to post a review");
        }

        let newReview = new Review({
            ...req.body.review,
            author: req.user._id,  // ✅ Check if req.user._id exists
        });

        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();

        res.redirect(`/carpenters/${listing._id}/review`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


app.delete("/carpenters/:id/reviews/:reviewId",isLoggedIn, async (req, res) => {
    try {
        let { id, reviewId } = req.params;

        await carpenter.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);

        res.redirect(`/carpenters/${id}/review`);  // Redirect back to the reviews page
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


//Review Plumber
// Route to show plumber details and reviews
app.get("/plumbers/:id/plumreview",isLoggedIn, async (req, res) => {
    try {
        let listing = await plumber.findById(req.params.id)
            .populate({
                path: "reviews",
                populate: {
                    path: "author",
                    select: "username" // ✅ Ensures author details are populated
                }
            });

        if (!listing) {
            return res.status(404).send("Plumber not found");
        }

        res.render("listings/plumreview", { listing }); // ✅ No need to separately pass `reviews`
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// Route to add a review to a plumber
app.post("/plumbers/:id/plumreview",isLoggedIn, async (req, res) => {
    try {
        if (!req.user) {  // ✅ Check if user is logged in
            return res.status(401).send("You must be logged in to submit a review.");
        }

        let listing = await plumber.findById(req.params.id);
        if (!listing) {
            return res.status(404).send("Plumber not found");
        }

        let newReview = new Review({
            ...req.body.review,
            author: req.user._id,  // ✅ Assign logged-in user as the author
        });

        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();

        res.redirect(`/plumbers/${listing._id}/plumreview`); // ✅ Correct redirect path
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.delete("/plumbers/:id/plumreview/:reviewId", isLoggedIn,async (req, res) => {
    try {
        let listing = await plumber.findById(req.params.id);
        if (!listing) {
            return res.status(404).send("Plumber not found");
        }

        // Remove the review from the listing
        listing.reviews = listing.reviews.filter(
            (review) => review.toString() !== req.params.reviewId
        );

        await listing.save(); // Save updated listing

        // Delete the review from the database
        await Review.findByIdAndDelete(req.params.reviewId);

        res.redirect("back"); // ✅ Stay on the same page
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// electrical review

app.get("/elctricals/:id/elcreview", async (req, res) => {
    try { 
        const listing = await elctrical.findById(req.params.id)
            .populate({
                path: "reviews",
                populate: { path: "author", select: "username" },
            });

        if (!listing) {
            return res.status(404).send("elctrical not found");
        }

        res.render("./listings/elcreview.ejs",{listing});  
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// Route to add a review to a carpenter
app.post("/elctricals/:id/elcreview",isLoggedIn, async (req, res) => {
    try {
        console.log("User:", req.user); // ✅ Check if req.user exists

        let listing = await elctrical.findById(req.params.id);
        if (!listing) {
            return res.status(404).send("elctrical not found");
        }

        if (!req.user) {
            return res.status(401).send("You must be logged in to post a review");
        }

        let newReview = new Review({
            ...req.body.review,
            author: req.user._id,  // ✅ Check if req.user._id exists
        });

        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();

        res.redirect(`/elctricals/${listing._id}/elcreview`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


app.delete("/elctricals/:id/elcreview/:reviewId",isLoggedIn, async (req, res) => {
    try {
        let { id, reviewId } = req.params;

        await elctrical.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);

        res.redirect(`/elctricals/${id}/elcreview`);  // Redirect back to the reviews page
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});



// index rout
app.get("/carpenters" , wrapAsync(async(req ,res)=>{
    const allcarpenter = await carpenter.find({});
    res.render("carpenter/carpenter.ejs" , {allcarpenter});
}));

app.get("/elctricals" , wrapAsync(async(req ,res)=>{
    const allelctrical = await elctrical.find({});
    res.render("carpenter/elctrical.ejs" , {allelctrical});
}));

app.get("/plumbers" ,wrapAsync( async(req ,res)=>{
    const allplumber = await plumber.find({});
    res.render("carpenter/plumber.ejs" , {allplumber});
}));


//new route
app.get("/carpenters/new", (req,res)=>{
    res.render("carpenter/newcar.ejs")
})
app.get("/elctricals/new", (req,res)=>{
    res.render("carpenter/newelc.ejs")
})
app.get("/plumbers/new", (req,res)=>{
    res.render("carpenter/newplum.ejs")
})


//show rout
app.get("/carpenters/:id" ,wrapAsync( async(req,res)=>{
    let{id} = req.params;
    const onecarpenter = await carpenter.findById(id);
    res.render("carpenter/carpentershow.ejs",{onecarpenter});
}))

app.get("/elctricals/:id" , wrapAsync(async(req,res)=>{
    let{id} = req.params;
    const oneelctrical = await elctrical.findById(id);
    res.render("carpenter/elctricalshow.ejs",{oneelctrical});
}))

app.get("/plumbers/:id" , wrapAsync(async(req,res)=>{
    let{id} = req.params;
    const oneplumber = await plumber.findById(id);
    res.render("carpenter/plumbershow.ejs",{oneplumber});
}))


// create
app.post("/carpenters",isLoggedIn,wrapAsync(async(req,res) => {
   const newcar =  new carpenter(req.body.car);
    await newcar.save(); 
    res.redirect("/carpenters");
}));

app.post("/elctricals",isLoggedIn,wrapAsync(async(req,res) => {
    const newelc =  new elctrical(req.body.elc);
     await newelc.save(); 
     res.redirect("/elctricals");
 }));

 app.post("/plumbers",isLoggedIn,wrapAsync(async(req,res) => {
    const newplum =  new plumber(req.body.plum);
     await newplum.save(); 
     res.redirect("/plumbers");
 }));


 //edit rout 
app.get("/carpenters/:id/edit",isLoggedIn,wrapAsync(async(req,res) =>{
    let{id} = req.params;
    const onecarpenter = await carpenter.findById(id);
    res.render("carpenter/caredit.ejs", {onecarpenter});
}));

app.get("/elctricals/:id/edit",isLoggedIn,wrapAsync(async(req,res) =>{
    let{id} = req.params;
    const oneelctrical = await elctrical.findById(id);
    res.render("carpenter/elcedit.ejs", {oneelctrical});
}));

app.get("/plumbers/:id/edit",isLoggedIn,wrapAsync(async(req,res) =>{
    let{id} = req.params;
    const oneplumber = await plumber.findById(id);
    res.render("carpenter/plumedit.ejs", {oneplumber});
}));




//update route
app.put("/carpenters/:id" ,isLoggedIn, wrapAsync(async(req,res)=>{
    let{id} = req.params;
    await carpenter.findByIdAndUpdate(id , {...req.body.car});
    res.redirect(`/carpenters/${id}`);
    
}));

app.put("/elctricals/:id" ,isLoggedIn, wrapAsync(async(req,res)=>{
    let{id} = req.params;
    await elctrical.findByIdAndUpdate(id , {...req.body.elc});
    res.redirect(`/elctricals/${id}`);
    
}));

app.put("/plumbers/:id" , isLoggedIn,wrapAsync(async(req,res)=>{
    let{id} = req.params;
    await plumber.findByIdAndUpdate(id , {...req.body.plum});
    res.redirect(`/plumbers/${id}`);
    
}));








//delete route
app.delete("/carpenters/:id",isLoggedIn, wrapAsync(async(req,res)=>{
    let{id} = req.params;
    await carpenter.findByIdAndDelete(id);
    res.redirect("/carpenters");

}));

app.delete("/elctricals/:id",isLoggedIn, wrapAsync(async(req,res)=>{
    let{id} = req.params;
    await elctrical.findByIdAndDelete(id);
    res.redirect("/elctricals");

}));

app.delete("/plumbers/:id",isLoggedIn, wrapAsync(async(req,res)=>{
    let{id} = req.params;
    await plumber.findByIdAndDelete(id);
    res.redirect("/plumbers");
}));

app.all("*", (req,res,next)=>{
    next(new ExpressError(404, "Page not found"))
})

app.use((err,req,res, next)=>{
    let {statusCode=500, message="Something went wrong"} = err;
    res.status(statusCode).render("error.ejs",{message})
})


app.listen(8080, ()=>{
    console.log('server listining...')
})

