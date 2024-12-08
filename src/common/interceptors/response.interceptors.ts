import { pagination } from 'src/common/pagination/pagination';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// import { pagination } from '../pagination/pagination';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // console.log(context)
    return next.handle().pipe(
      map((data) => {
        let message = 'Request was successful';
        if (Array.isArray(data?.data)) {
          // If the response is an array (e.g., a list of users or products)
          message = `Found ${data?.data.length} items`;
        }
        // if (data && data.name) {
        //   // If the data contains a 'name' property (e.g., User model)
        //   message = `User has been retrieved`;
        // } else if (data && data.productName) {
        //   // If the data contains a 'productName' property (e.g., Product model)
        //   message = `Product ${data.productName} has been retrieved`;
        // }
        if(data?.token){
          return {
            status: 'success',
            statusCode: 200,
            message: data?.message ? data?.message : message,
            data: data?.pagination || data.data ? data?.data : data || {}, // Provide a default empty object if no data exists
            // pagination: data?.pagination ? data?.pagination : {},
            token:data?.token
          };
        }
        if(data?.pagination){
          return {
            status: 'success',
            statusCode: 200,
            message: data?.message ? data?.message : message,
            data: data?.pagination || data.data ? data?.data : data || {}, // Provide a default empty object if no data exists
            pagination: data?.pagination,
          };
        }
        // Check if data is undefined or null and handle appropriately
        return {
          status: 'success',
          statusCode: 200,
          message: data?.message ? data?.message : message,
          data: data?.pagination || data.data ? data?.data : data || {}, // Provide a default empty object if no data exists
         
        };
      }),
    );
  }
}
