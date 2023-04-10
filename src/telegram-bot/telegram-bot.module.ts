import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { EthereumModule } from '../ethereum';
import { ChatsModule } from '../storage';

@Module({
  imports: [EthereumModule, ChatsModule],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
