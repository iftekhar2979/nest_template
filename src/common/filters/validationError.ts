import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, ForbiddenException } from '@nestjs/common';
import { error } from 'console';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    // console.log("Exception from forbidden",exception)
    const validationErrors = exception.getResponse() as any;
    // console.log(exception)
    response.status(exception.getStatus()).json({
      path: request.url,
      statusCode: exception.getStatus(),
      message: "Validation Error!",
      error:validationErrors.message,
      status:"fail"
    });
  }
}
