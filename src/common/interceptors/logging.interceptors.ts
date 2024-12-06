import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const method = request.method;
    const now = Date.now();
    // Calculate the size of the request body (in bytes)
    const bodySize = Buffer.byteLength(JSON.stringify(request.body));
    return next
      .handle()
      .pipe(
        tap(() => {
          const responseTime = Date.now() - now;
          console.log(`[${method}] ${url} - Body Size: ${bodySize} bytes - ${responseTime}ms`);
        }),
      );
  }
}
