const express = require("express")
const router = express.Router()
const Joi = require("joi")
const Users = require("../models/Users")
const auth = require("../middlewares/auth")
const { hash, genSalt, compare } = require("bcrypt")
const Jwt = require("jsonwebtoken")
const _ = require("lodash")
const usersSchema = Joi.object({
    name: Joi.object({
        first: Joi.string().min(2).required(),
        middle: Joi.string().allow(""),
        last: Joi.string().min(1).required(),
    }),
    email: Joi.string().required().email(),
    password: Joi.string().min(8).required(),
    isBusiness: Joi.boolean().optional(),
    isAdmin: Joi.boolean().optional(),
    phone: Joi.string()
        .required()
        .min(9)
        .max(10)
        .pattern(/^05\d{8,9}$/)
        .message(
            "The phone number must be an Israeli phone number starting with 05 and max digits is 9-10 ",
        ),
    address: Joi.object({
        state: Joi.string().min(2).allow(""),
        country: Joi.string().min(2).required(),
        city: Joi.string().min(2).required(),
        street: Joi.string().min(2).required(),
        houseNumber: Joi.number().required(),
        zip: Joi.number().required(),
    }),
    image: Joi.object({
        url: Joi.string().allow(""),
        alt: Joi.string().default("profile").allow(""),
    }).optional(),
})

const loginSchema = Joi.object({
    email: Joi.string().email().min(2).required(),
    password: Joi.string()
        .min(6)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/)
        .message(
            "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character",
        ),
});

router.get("/", auth, async (req, res) => {
    try {
        if (!req.payload.isAdmin) return res.status(401).send("You can't access this page")
        const users = await Users.find().select("-password")
        if (!users) return res.status(404).send("User not found")
        res.status(200).send(users)
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.post("/", async (req, res) => {
    try {
        const { error } = usersSchema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const userExist = await Users.findOne({ email: req.body.email });
        if (userExist) {
            console.log("User already exists try another email");
            return res.status(400).send("User already exists try another email");
        }

        const salt = await genSalt(10);

        const hashPass = await hash(req.body.password, salt);

        const newUser = new Users({ ...req.body, registryStamp: new Date().toLocaleString(), password: hashPass });
        await newUser.save()
        res.status(201).send("User has been created successfully")

    } catch (error) {
        res.status(400).send(error.message)
    }
})


router.post("/login", async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body)
        if (error) return res.status(400).send(error.details[0].message);

        const existUser = await Users.findOne({ email: req.body.email })
        if (!existUser) return res.status(404).send("Account dosn't exist")

        const userPass = await bcrypt.compare(req.body.password, existUser.password)
        if (!userPass) return res.status(400).send("Invalid email or password")

        const token = Jwt.sign(_.pick(existUser, ["_id", "isAdmin"]), process.env.JWTSECRET)
        res.status(200).send(token)

    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.put("/:id", auth, async (req, res) => {
    try {
        if (!req.payload.isAdmin || req.payload._id !== req.params.id)
            return res.status(401).send("Access denied")

        const { error } = usersSchema.validate(req.body)
        if (error) return res.status(400).send(error.details[0].message);

        const user = await Users.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
        res.status(200).send(user)
    } catch (error) {
        res.status(400).send(error.message)
    }
})

router.patch("/:id", auth, async (req, res) => {
    try {
        if (!req.payload.isAdmin || req.payload._id !== req.params.id)
            return res.status(401).send("Access denied")

        const user = await Users.findById(req.params.id)
        if (!user) return res.status(404).send("User not found")

        user.isBusiness = !user.isBusiness

        await user.save()


        res.status(200).send("Is business status have been changed")
    } catch (error) {
        res.status(400).send(error.message)
    }
})
router.delete("/:id", auth, async (req, res) => {
    try {
        if (!req.payload.isAdmin)
            return res.status(401).send("Access denied")

        const user = await Users.findById(req.params.id)
        if (!user) return res.status(400).send("User not found")

        await Users.deleteOne({ _id: req.params.id })
        res.status(200).send("User deleted successfully")
    } catch (error) {
        res.status(400).send(error.message)
    }

})




module.exports = router