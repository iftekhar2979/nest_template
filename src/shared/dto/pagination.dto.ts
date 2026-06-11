import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsOptional, IsNumber, Min, Max } from "class-validator";

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

/**
 * Transform a query-string value into an optional boolean.
 * Preserves `undefined` so an absent filter is not coerced to `false`.
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    if (typeof value === "boolean") {
      return value;
    }
    return value === "true" || value === "1";
  });
}

export class PaginationDto {
  @ApiPropertyOptional({ description: "Page number", type: Number })
  @Min(1)
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: "Number of items per page", type: Number })
  @Max(100)
  @Min(1)
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
