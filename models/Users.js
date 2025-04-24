const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type: {
            first: { type: String, required: true },
            middle: { type: String, },
            last: { type: String, required: true }
        }
    },
    isBusiness: { type: Boolean, required: true },
    isAdmin: { type: Boolean, default: false },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    address: {
        type: {
            state: { type: String },
            country: { type: String, required: true },
            city: { type: String, required: true },
            street: { type: String, required: true },
            houseNumber: { type: Number, required: true },
            zip: { type: String, required: true },
        }
    },
    image: {
        type: {
            url: { type: String, default: "https://images.unsplash.com/photo-1744762561513-6691932920fb?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
            alt: { type: String },
        }
    },
    createdAt: { type: String, default: new Date().toLocaleString("he-IL") },
    updatedAt: { type: String, default: new Date().toLocaleString("he-IL") },


}, { timeStamp: true })

const Users = mongoose.model("Users", userSchema)
module.exports = Users