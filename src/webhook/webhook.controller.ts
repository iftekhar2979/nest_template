import { Body, Controller, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeviceIpGuard } from '../shared/guards/device-ip.guard';
import { ZktecoPunchDto } from '../attendance/dto/attendance.dto';
import { WebhookService } from './webhook.service';
import { IClockCDataRequestDto } from './dto/biometricDto';
import { parseRtLog } from './utils/parseBiometricLog';

@ApiTags('Webhooks')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  // External ZKTeco push bridge posts raw device punches here.
  // Trusted by source IP (the bridge), not an API key.
  @Post('zkteco')
  // @UseGuards(DeviceIpGuard)
  @ApiOperation({
    summary: 'Receive ZKTeco device punches from the push bridge (trusted by source IP)',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Punches accepted and processed.' })
  async zkteco(@Query() dto: IClockCDataRequestDto) {
    // Diagnostic: shows exactly what the proxy delivered into the body.
    console.log('[zkteco] incoming body:', dto);
    // Non-attendance pushes (handshake / options / heartbeat) carry no rtlog body.
    if (!dto?.body || typeof dto.body !== 'string') {
      console.warn(
        '[zkteco] no string rtlog body — skipping (handshake, or body not sent as JSON)',
      );
      return { accepted: 0, skipped: true };
    }

    // Device may send one or more tab-separated rtlog lines, newline-delimited.
    // String() guards the values (employeeNumber is matched as a string).
    const punches: ZktecoPunchDto[] = dto.body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => parseRtLog(line))
      .filter((log) => log.pin !== undefined && log.time !== undefined)
      .map((log) => ({
        pin: String(log.pin),
        time: String(log.time),
        sn: dto.sn ? String(dto.sn) : undefined,
        index: log.index !== undefined ? String(log.index) : undefined,
        status:
          log.inoutstatus !== undefined ? String(log.inoutstatus) : undefined,
      }));

    console.log('[zkteco] parsed punches:', punches);

    if (punches.length === 0) {
      return { accepted: 0, skipped: true };
    }

    const result = await this.webhookService.handleZktecoPunches(punches);
    console.log('[zkteco] result:', result);
    return result;
  }
}
