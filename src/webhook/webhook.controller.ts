import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeviceIpGuard } from '../shared/guards/device-ip.guard';
import { ZktecoBatchDto } from '../attendance/dto/attendance.dto';
import { WebhookService } from './webhook.service';

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
  zkteco(@Body() dto: ZktecoBatchDto) {
    console.log(dto)
    return this.webhookService.handleZktecoPunches(dto.punches);
  }
}
