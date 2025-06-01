"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { PORT } = require("./config.js");
const corsOptions = require('./src/corsConfig.js');
const { ErrorHandler, handleError, responseHandler } = require('./src/helpers');
const { userUnrestricted, userRestricted } = require('./src/routes');

// function main() {
    const app = express();
    app.use(helmet());

    app.use(express.json({ limit: "400mb" }));
    app.use(express.urlencoded({ limit: "400mb", extended: false }));

    app.use(cors(corsOptions));

    // Apply the response handler middleware to all routes
    app.use(responseHandler);

	app.use('/', userUnrestricted); // Unrestricted routing file
	app.use('/', userRestricted); // Restricted routing file


    // Handle unknown routes
    app.all("/*splat", (req, res, next) => {
        next(new ErrorHandler(`Can't find ${req.originalUrl} on this server!`, 404));
    });

    // Always use the end of other middlewares and routes for it to function correctly
    app.use((err, req, res, next) => {
        handleError(err, res);
    });

    if (require.main === module) {
        app.listen(PORT, () => {
            console.log(`API server started on: ${PORT}`);
        });
    }


    // app.listen(PORT, () => {
    //     console.log(`API server started on: ${PORT}`);
    // });

//     return app;
// };
// const mainApp = main();
module.exports = app;