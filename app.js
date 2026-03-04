const express = require("express");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const notFound = require("./middlewares/notFound.middleware");
const globalErrorHandler = require("./middlewares/error.middleware");
const loadRoutes = require("./helpers/routeLoader");
const morgan = require('morgan');
const cors = require("cors");
const chalk = require('chalk');
const app = express();

// InBuild Middleware
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors());

morgan.token('colored-status', (req, res) => {
    const status = res.statusCode;
    const color =
        status >= 500 ? chalk.red
            : status >= 400 ? chalk.yellow
                : status >= 300 ? chalk.cyan
                    : status >= 200 ? chalk.green
                        : chalk.white;
    return color(status);
});

app.use(morgan((tokens, req, res) => {
    return [
        chalk.blue(tokens.method(req, res)),
        chalk.magenta(tokens.url(req, res)),
        tokens['colored-status'](req, res),
        chalk.gray(`${tokens['response-time'](req, res)} ms`),
        chalk.yellow(`- ${tokens.res(req, res, 'content-length') || 0} bytes`)
    ].join(' ');
}));

loadRoutes(app);

app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;