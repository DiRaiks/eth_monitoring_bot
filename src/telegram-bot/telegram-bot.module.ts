import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { EthereumModule } from '../ethereum';

@Module({
  imports: [EthereumModule],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
