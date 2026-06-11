import { IsString, IsOptional } from 'class-validator';

export class IClockCDataQueryDto {
  @IsString()
  SN: string;

  @IsString()
  table: string;
}

export class IClockRtLogDto {
  @IsString()
  time: string;

  @IsString()
  pin: string;

  @IsString()
  cardno: string;

  @IsString()
  eventaddr: string;

  @IsString()
  event: string;

  @IsString()
  inoutstatus: string;

  @IsString()
  verifytype: string;

  @IsString()
  index: string;

  @IsString()
  sitecode: string;

  @IsString()
  linkid: string;

  @IsString()
  maskflag: string;

  @IsString()
  temperature: string;

  @IsString()
  convtemperature: string;
}

export class IClockCDataRequestDto {
  @IsOptional()
  @IsString()
  received?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  sn?: string;

  @IsOptional()
  @IsString()
  table?: string;

  /**
   * Raw body received from device:
   * time=2026-06-10 09:39:32\tpin=88...
   * Left untyped (no @IsString) so non-rtlog pushes whose body is an object
   * aren't rejected; the handler guards on `typeof body === 'string'`.
   */
  @IsOptional()
  body?: string | IClockCDataQueryDto;
}