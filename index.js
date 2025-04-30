const expressRoutes = require("express-list-routes");
const express = require("express")
const users = require("./routes/users")
const app = express()
const chalk = require("chalk")
const cors = require("cors")
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose")
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
require("dotenv").config({ path: envFile });
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "logger.log"),
    { flags: "a" }
);
const port = process.env.PORT || 8001

app.use(express.json());
app.use(cors())
app.use(morgan("dev", { stream: accessLogStream }))

mongoose.connect(process.env.DB,).then(() => {
    console.log("Conected to mongoose");
}).catch(() => {
    console.log("Error conecting mongoose");
})


app.use((req, res, next) => {
    next()
})
app.use("/api/users", users)
app.use("/cards")
app.listen(port, () => console.log(chalk.green(`Server started on ${port}`)))


if (process.env.NODE_ENV === "development") {
    console.log(chalk.white.bgBlack.bold("App is running in Development mode"));
    expressRoutes(app);
} else {
    console.log(chalk.bgBlack.red.bold("App is running in Production mode"));
}