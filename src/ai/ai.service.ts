import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiApiUrl = this.configService.get('AI_SERVICE_URL') ?? '';
  }

  async analyzeComment(
    text: string,
  ): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.aiApiUrl, { content: text }),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
      return response.data.label;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.logger.error('error');
      return 'neutral';
    }
  }
}