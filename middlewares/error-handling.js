const erorHandlerMiddleware = (errors, req, res, next) => {
    console.log(errors)

    if (errors) {
        const extractedErrors = {}

        errors.array().map(err => {
            if (!extractedErrors[err.path]) {
                extractedErrors[err.path] = [];
            }
            extractedErrors[err.path].push(err.msg)
        })

        return res.status(400).json({
            status: "failed",
            message: "validation erorr",
            error : extractedErrors
        })
    }
    next()


}

module.exports = erorHandlerMiddleware;