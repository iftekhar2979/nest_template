import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const url = request.url;
    const method = request.method;
    const now = Date.now();
    const bodySize = Buffer.byteLength(JSON.stringify(request.body)); // Size of request body

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        const statusCode = response.statusCode; // Correctly get the status code from response
        console.log(
          `[${method}] ${statusCode} ${url} - Body Size: ${bodySize} bytes - ${responseTime}ms`
        );
      }),
    );
  }
}
