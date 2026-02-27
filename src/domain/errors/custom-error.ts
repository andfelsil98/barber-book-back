export class CustomError extends Error {
    private constructor(
        public readonly statusCode: number,
        public readonly message: string,
        public readonly code?: string
    ) {
        super(message);
    }

    static badRequest(message: string, code?: string): CustomError {
        return new CustomError(400, message, code);
    }

    static notFound(message: string, code?: string): CustomError {
        return new CustomError(404, message, code);
    }

    static internalServerError(message: string, code?: string): CustomError {
        return new CustomError(500, message, code);
    }

    static unauthorized(message: string, code?: string): CustomError {
        return new CustomError(401, message, code);
    }

    static forbidden(message: string, code?: string): CustomError {
        return new CustomError(403, message, code);
    }

    static conflict(message: string, code?: string): CustomError {
        return new CustomError(409, message, code);
    }   

    static notContent(message: string, code?: string): CustomError {
        return new CustomError(204, message, code);
    }
    
}
