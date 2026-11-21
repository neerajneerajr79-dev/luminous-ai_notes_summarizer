class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Not authorized') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Access denied') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message) {
    return new ApiError(409, message);
  }
  static tooLarge(message = 'File too large') {
    return new ApiError(413, message);
  }
  static serviceUnavailable(message) {
    return new ApiError(503, message);
  }
}

module.exports = ApiError;
