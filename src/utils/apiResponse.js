class APIError extends Error{
    constructor(
    statusCode,
    message = "Something Went Wrong",
    errors =[],
    stack = ""
    ){
        super(message),
        this.statusCode = statusCode,
        this.data = null,
        this.success = false,
        this.message = message,
        this.errors = errors

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this,this.constructor);
        }

    }
}

class APIResponse {
    constructor(
        statusCode,data,message = "Success"
    ){
        this.statusCode = statusCode,
        this.data = data,
        this.message = message,
        this.success = statusCode < 400
    }
}

export {
    APIError,
    APIResponse
};