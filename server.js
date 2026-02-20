require("module-alias/register");
require("dotenv").config();
require("@config/db.config");
// require("@config/passport.config");

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(process.env.PORT, () => {
    console.log(`Server running at port: ${process.env.PORT}`);
    console.log(`click the link to open : http://localhost:${process.env.PORT}`);
});