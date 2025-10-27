import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message: string | string[];
    let type: string;

    if (typeof exceptionResponse === 'object') {
      if (exceptionResponse['message']) {
        message = exceptionResponse['message'];
        type = 'validation_error';
      } else {
        message = exceptionResponse['error'] || exception.message;
        type = exceptionResponse['error'] || 'http_exception';
      }
    } else {
      message = exceptionResponse;
      type = 'http_exception';
    }

    response.status(statusCode).json({
      Code: statusCode,
      Type: type,
      Message: message,
      Result: null,
      Extras: { path: request.url },
      Time: new Date().toISOString(),
    });
  }
}
