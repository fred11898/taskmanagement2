const logger = (req, res, next) => {
    console.log("Logger Middleware");
    next();
}

module.exports = logger;