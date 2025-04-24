const express = require("express");
const router = express.Router();
const Joi = require("joi");
const chalk = require("chalk");
const auth = require("../middlewares/auth");
const Cards = require("../models/Card");

const cardSchema = Joi.object({
	_id: Joi.string(),
	title: Joi.string().required(),
	subtitle: Joi.string().required(),
	description: Joi.string().optional(),
	phone: Joi.string()
		.min(9)
		.max(10)
		.required()
		.regex(/^05\d{8,9}$/),
	email: Joi.string().email().min(5).required(),
	web: Joi.string().allow(""),
	image: Joi.object({
		url: Joi.string().uri().required(),
		alt: Joi.string().required(),
	}),
	address: Joi.object({
		state: Joi.string().allow("").default("not defined"),
		country: Joi.string().min(2).required(),
		city: Joi.string().min(2).required(),
		street: Joi.string().min(2).required(),
		houseNumber: Joi.number().required(),
		zip: Joi.string().default("00000"),
	}),
	bizNumber: Joi.number(),
	likes: Joi.array().items(Joi.string()),
	user_id: Joi.string(),
	__v: Joi.number(),
});


async function generateBizNumber() {
	const randomBizNumber = Math.floor(Math.random() * 1000000);
	return randomBizNumber;
}


router.post("/", auth, async (req, res) => {
	try {

		if (!(req.payload.isBusiness || req.payload.isAdmin)) {
			console.log(chalk.red("Only business or admin accounts can add cards"));
			return res.status(403).send("Only business or admin accounts can add cards");
		}

		const { error } = cardSchema.validate(req.body);
		if (error) return res.status(400).send(error.details[0].message);

		let card = await Cards.findOne({ email: req.body.email });
		if (card) return res.status(409).send("The card already exists");

		let bizNumber = await generateBizNumber();
		while (await Cards.findOne({ bizNumber })) {
			bizNumber = await generateBizNumber();
		}


		const newCard = new Cards({ ...req.body, bizNumber, user_id: req.payload._id });

		await newCard.save();

		console.log(chalk.green("Card added successfully"));
		return res.status(201).send(newCard);
	} catch (error) {
		console.log(chalk.red("Internal server error"));
		res.status(400).send(error.message);
	}
});


router.put("/:id", auth, async (req, res) => {
	try {

		const card = await Cards.findById(req.params.id);
		if (!card) return res.status(404).send("User not found");


		if (card.user_id !== req.payload._id && !req.payload.isAdmin)
			return res.status(401).send("Only owner or admin users can update the card");

		const { error } = cardSchema.validate(req.body);
		if (error) return res.status(400).send(error.details[0].message);


		let userCardToUpdae = await Cards.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		if (!userCardToUpdae) return res.status(404).send("Card not found");

		res.status(200).send(userCardToUpdae);
	} catch (error) {
		res.status(400).send(error);
	}
});


router.patch("/:id", auth, async (req, res) => {
	try {

		if (!req.payload._id) return res.status(401).send("Unauthorized");

		let card = await Cards.findById(req.params.id);
		if (!card) return res.status(400).send("card not found");


		const isLiked = card.likes.includes(req.payload._id);


		if (isLiked) {
			card.likes = card.likes.filter((like) => like !== req.payload._id);
		} else {

			card.likes.push(req.payload._id);
		}


		await card.save();


		res.status(200).send(card);
	} catch (error) {
		res.status(400).send(error.message);
	}
});


router.delete("/:id", auth, async (req, res) => {
	try {

		if (!req.payload.isBusiness && !req.payload.isAdmin) {
			let cardToDelete = await Cards.findById(req.params.id);
			if (!cardToDelete) return res.status(404).send("Card not found");

			if (cardToDelete.user_id !== req.payload._id)
				return res
					.status(403)
					.send("You do not have permission to delete this card");
		} else {

			cardToDelete = await Cards.findById(req.params.id);
			if (!cardToDelete) return res.status(404).send("Card not found");
		}

		await Cards.findByIdAndDelete(req.params.id);

		res.status(200).send("The card has been deleted successfully");
	} catch (error) {
		res.status(400).send(error);
	}
});


router.get("/", async (req, res) => {
	try {

		const cards = await Cards.find();

		if (!cards.length) return res.status(400).send("no cards to provide");

		res.status(200).send(cards);
	} catch (error) {
		res.status(400).send(error);
	}
});


router.get("/my-cards", auth, async (req, res) => {
	try {

		if (!req.payload._id) {
			return res.status(401).send("You have to login to see your cards");
		}


		const specific_user_cards = await Cards.find({ user_id: req.payload._id });
		if (specific_user_cards.length === 0)
			return res.status(404).send("No cards found for this user");


		res.status(200).send(specific_user_cards);
	} catch (error) {
		res.status(400).send(error.message);
	}
});


router.get("/:id", async (req, res) => {
	try {

		const card = await Cards.findById(req.params.id);
		if (!card) return res.status(404).send("Card not found");


		res.status(200).send(card);
	} catch (error) {
		res.status(400).send(error.message);
	}
});

module.exports = router;
