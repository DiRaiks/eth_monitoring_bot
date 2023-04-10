import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatsService {
  protected chats: { [chatId: string]: string[] } = {};

  constructor() {
    if (process.env.DEFAULT_CHANNEL_ID) {
      this.chats[process.env.DEFAULT_CHANNEL_ID] = [];

      if (process.env.DEFAULT_ADDRESSES) {
        this.chats[process.env.DEFAULT_CHANNEL_ID] =
          process.env.DEFAULT_ADDRESSES.split(',');
      }
    }
  }

  public getChats(): { [chatId: string]: string[] } {
    return this.chats;
  }

  public getAddressesByChatId(chatId: number): string[] {
    return this.chats[chatId];
  }

  public getTotalChats(): number {
    return Object.keys(this.chats).length;
  }

  public setAddressByChatId(chatId: number, address: string): void {
    if (this.chats[chatId]) {
      if (this.chats[chatId].includes(address)) return;

      this.chats[chatId].push(address);
    } else {
      this.chats[chatId] = [address];
    }
  }

  public removeAddressByChatId(chatId: number, address: string): void {
    if (this.chats[chatId]) {
      this.chats[chatId] = this.chats[chatId].filter(
        (item) => item !== address,
      );
    }
  }

  public removeChat(chatId: number): void {
    delete this.chats[chatId];
  }
}
