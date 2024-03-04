const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/Girls")
.then(() => {
    console.log("mongodb connected")
})

.catch(() => {
    console.log("failed to connect mongodb")
})

const LogIndb = new mongoose.Schema({
    uname:{
        type: String,
        required: true
    },

    psw:{
        type: String,
        required: true
    }
})

const collection = new mongoose.model("SignUpCollection", LogIndb)

module.exports = collection