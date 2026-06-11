import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type ResponseEnvelope = {
  ok?: boolean;
  status?: number;
  statusCode?: number;
  message?: string;
  data?: unknown;
  token?: unknown;
  pagination?: unknown;
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((res) => {
        if (this.shouldBypassWrapping(res)) {
          return res;
        }

        const payload = this.toEnvelope(res);
        const { ok = true, status, statusCode, message = 'Request was successful', data, token, pagination } = payload;
        const finalStatus = statusCode || status || response.statusCode || 200;

        response.statusCode = finalStatus;

        return {
          ok,
          status: finalStatus,
          message,
          data: this.serialize(data ?? {}),
          ...(token !== undefined && { token: this.serialize(token) }),
          ...(pagination !== undefined && { pagination: this.serialize(pagination) }),
        };
      }),
    );
  }

  private toEnvelope(res: unknown): ResponseEnvelope {
    if (!this.isPlainObject(res)) {
      return { data: res };
    }

    if (!this.hasEnvelopeMetadata(res)) {
      return { data: res };
    }

    const resObj = res as Record<string, any>;
    const payload: ResponseEnvelope = {};
    const dataObj: Record<string, any> = { ...resObj };

    if (typeof resObj.ok === 'boolean') {
      payload.ok = resObj.ok;
      delete dataObj.ok;
    }

    if (typeof resObj.status === 'number') {
      payload.status = resObj.status;
      delete dataObj.status;
    }

    if (typeof resObj.statusCode === 'number') {
      payload.statusCode = resObj.statusCode;
      delete dataObj.statusCode;
    }

    if (typeof resObj.message === 'string') {
      payload.message = resObj.message;
      delete dataObj.message;
    }

    if (resObj.token !== undefined) {
      payload.token = resObj.token;
      delete dataObj.token;
    }

    if (resObj.pagination !== undefined) {
      payload.pagination = resObj.pagination;
      delete dataObj.pagination;
    }

    if (resObj.data !== undefined) {
      payload.data = resObj.data;
    } else {
      payload.data = dataObj;
    }

    return payload;
  }

  private hasEnvelopeMetadata(value: any): boolean {
    if (!this.isPlainObject(value)) {
      return false;
    }

    return (
      typeof value.ok === 'boolean' ||
      typeof value.status === 'number' ||
      typeof value.statusCode === 'number' ||
      typeof value.message === 'string' ||
      value.data !== undefined ||
      value.token !== undefined ||
      value.pagination !== undefined
    );
  }

  private shouldBypassWrapping(value: unknown): boolean {
    return value instanceof StreamableFile || Buffer.isBuffer(value);
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
    );
  }

  private serialize(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.serialize(item));
    }

    if (typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.serialize(item)]));
    }

    return value;
  }
}
