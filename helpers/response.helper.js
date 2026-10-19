class Response {

  static success(res, message = "Success", data) {
    return res.status(200).json({
      success: true,
      message,
      ...(data !== undefined && { data })
    });
  }

  static created(res, message = "Resource created", data) {
    return res.status(201).json({
      success: true,
      message,
      ...(data !== undefined && { data })
    });
  }

  static badRequest(res, message = "Bad Request") {
    return res.status(400).json({
      success: false,
      message
    });
  }

  static unauthorized(res, message = "Unauthorized") {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = "Forbidden") {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static notFound(res, message = "Resource not found") {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static error(res, message = "Internal Server Error", status = 500) {
    return res.status(status).json({
      success: false,
      message
    });
  }

}

module.exports = Response;