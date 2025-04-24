const mongoose = require("mongoose")
const CardsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    web: { type: String },
    image: {
        type: {
            url: { type: String, required: true },
            alt: { type: String },
        }
    },
    likes: { type: Array },
    address: {
        type: {
            state: { type: String },
            country: { type: String, required: true },
            city: { type: String, required: true },
            street: { type: String, required: true },
            houseNumber: { type: Number, required: true },
            zip: { type: String },
        }
    },
    createdAt: { type: String, default: new Date().toLocaleString("he-IL") },
    updatedAt: { type: String, default: new Date().toLocaleString("he-IL") },
}, { timeStamp: true })
module.exports = mongoose.model("Cards", CardsSchema)