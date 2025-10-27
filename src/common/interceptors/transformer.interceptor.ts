import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IApiResponse<T> {
  Code: number;
  Type: string;
  Message: string;
  Result: T | null;
  Extras: any;
  Time: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, IApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IApiResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => ({
        Code: statusCode,
        Type: 'success',
        Message: 'success',
        Result: data,
        Extras: null,
        Time: new Date().toISOString(),
      })),
    );
  }
}
