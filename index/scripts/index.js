
/**
 * isLoggedIn = false;
 * ^ turns true when user logs in
 * 
 * if isLoggedIn == true
 *      change:
 *      Log In -> Log Out
 *      link   -> link
 */


// function filter() {
//     document.getElementById("myDropdown").classList.toggle("show");
//   }

// function filterFunction() {
//     var input, filter, ul, li, a, i;

//     input = document.getElementById("myInput");
//     filter = input.value.toUpperCase();
//     div = document.getElementById("myDropdown");
//     a = div.getElementsByTagName("a");
    
//     for (i = 0; i < a.length; i++) {
//         txtValue = a[i].textContent || a[i].innerText;
//         if (txtValue.toUpperCase().indexOf(filter) > -1) {
//             a[i].style.display = "";
//         } else {
//             a[i].style.display = "none";
            
//         }
//     }
// }  

const express = require('express')
const app = express()
const path = require('path')
const hbs = require("hbs")
const collection = require('./mongodb')

const templatePath = path.join(__dirname, "../templates")

app.use(express.json()) //have to write this to use hbs and connect mongoDB?
app.set("view engine", "hbs")
app.set("views", templatePath)
app.use(express.urlencoded({extended:false}))
app.use(express.static(path.join(__dirname, "../public")))

app.get("/", (req,res) => {
    res.render("login")
})

app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/signup", (req,res) => {
    res.render("signup")
})

app.post("/signup", async(req, res) => {
    

    const checksu = await collection.findOne({uname: req.body.uname})

    if (checksu && checksu.uname === req.body.uname){
        res.send("Account already exists!")
    }

    else {
        const data = {
            uname: req.body.uname,
            psw: req.body.psw
        }

        await collection.insertMany([data])

        res.render("index")
    }

})

app.post("/login", async(req, res) => {
    try {
        const check = await collection.findOne({uname: req.body.uname})

        if(check && check.psw === req.body.psw){
            res.render("index")
        }
        else {
            res.send("wrong password")
        }
    }
    catch {
        res.send("wrong details")
    }

})

app.listen(3000, () => {
    console.log("port connected");
})