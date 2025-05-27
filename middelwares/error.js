

const errorMiddelware = (err, req, res, next) => {
    err.message ||= "Internal server error"
    err.statusCode ||= 500

    if(err.name === "CastError") err.message = "Invalid Id"

    console.log(err)

    const response = {
        success: false,
        message: err.message,
      };

      return res.status(err.statusCode).json(response);

}

const TryCatch = (passedfun) => async(req, res, next) =>{
    try {
        await passedfun(req, res, next)
    } catch (error) {
        next(error)
    }
}


export {TryCatch, errorMiddelware}