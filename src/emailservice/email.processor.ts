import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './emailservice.service';
import { EMAIL_CONSTANTS } from './constants/email.constants';

@Processor('EMAIL_QUEUE')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { email, otp, fullName, type } = job.data;

    switch (job.name) {
      case EMAIL_CONSTANTS.SEND_OTP:
        await this.emailService.sendOtpEmail(email, otp, fullName);
        break;
      // Add more cases as needed (e.g., welcome email, reset password success)
      default:
        console.warn(`No handler for job ${job.name}`);
    }
  }
}
