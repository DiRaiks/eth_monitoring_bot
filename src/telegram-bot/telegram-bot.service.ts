import { Injectable } from '@nestjs/common';
import * as telegraf from 'telegraf';
import * as Stage from 'telegraf/stage';

import * as WizardScene from 'telegraf/scenes/wizard';
import * as Composer from 'telegraf/composer';
import { ethers } from 'ethers';

import { EthereumService } from '../ethereum';

export const validateAddressInput = (
  address: string,
  { allowEmpty = true } = {},
): { error: string } | { error: null; ok: true } => {
  switch (true) {
    case address === '':
      return allowEmpty
        ? { error: null, ok: true }
        : { error: 'Address is empty' };
    case !/^0x[0-9A-Fa-f]*$/.test(address):
      return { error: "This doesn't look like an address" };
    case /^(0x)?[0-9a-fA-F]{41,}$/.test(address):
      return { error: 'Address is too long' };
    case /^(0x)?[0-9a-fA-F]{0,39}$/.test(address):
      return { error: 'Address is too short' };
    case !/^(0x)?[0-9a-fA-F]{40}$/.test(address):
      return { error: 'Something is wrong with your address' };
    default:
      return { error: null, ok: true };
  }
};

@Injectable()
export class TelegramBotService {
  private readonly bot: telegraf.Telegraf<telegraf.Context>;
  private chats: { [chatId: string]: string[] } = {};
  private subscription: ethers.JsonRpcProvider;

  constructor(protected readonly ethereum: EthereumService) {
    this.bot = new telegraf.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.initBot();
    this.subscribe();
  }

  private initBot = () => {
    this.bot.start((ctx) => {
      ctx.reply('Hello, I am a bot!');
    });

    this.bot.command('stop', (ctx) => {
      this.chats[ctx.chat.id] = [];
      ctx.reply('Bye!');
    });

    this.bot.command('status', async (ctx) => {
      const status = await this.ethereum.getSuscriptionStatus();
      ctx.reply(
        `Status: ${status.status}\nCount:${status.count}\nAddresses: ${
          this.chats && this.chats[ctx.chat.id]
        }`,
      );
    });

    this.bot.command('chats', async (ctx) => {
      const chatIds = this.getChatIds();
      ctx.reply(`Chat ids: ${chatIds}`);
    });

    this.bot.command('help', (ctx) => {
      const message =
        `/init - зарегистрировать чат для отправки уведомлений` +
        `\n/stop - не отправлять уведомления в текущий чат` +
        `\n/status - статус подписки на блоки` +
        `\n/chats - список чатов, которые получают уведомления`;

      return ctx.reply(message);
    });

    const amountScene = this.initScene();
    const stage = new Stage([amountScene]);
    this.bot.use(telegraf.session());
    this.bot.use(stage.middleware());

    this.bot.command('init', (ctx: any) => ctx.scene.enter('init'));
    this.bot.launch();
  };

  private initScene() {
    const stepHandler = new Composer();

    stepHandler.hears(/^0x[0-9A-Fa-f]*$/gm, async (ctx) => {
      console.log('CALL');
      const { id } = ctx.chat;
      const address = ctx.match.input;
      console.log('address', address);
      if (!address) return;

      if (!this.chats[id]) this.chats[id] = [];

      if (this.chats[id].includes(address)) {
        ctx.reply('Address already added');
        return ctx.scene.leave();
      }
      this.chats[id].push(address);

      ctx.reply(`Addresses: ${this.chats[id].join(', ')}`);
      return ctx.scene.leave();
    });

    stepHandler.command('exit', (ctx) => {
      ctx.reply('exit');
      return ctx.scene.leave();
    });

    const amountScene = new WizardScene(
      'init',
      async (ctx) => {
        ctx.reply('Enter eth address');
        return ctx.wizard.next();
      },
      stepHandler,
    );

    return amountScene;
  }

  public sendMessage = (message: string, chatId: string) => {
    this.bot.telegram.sendMessage(chatId, message, {
      disable_web_page_preview: true,
    });
  };

  private getChatIds = () => {
    return this.chats;
  };

  private subscribe = async () => {
    const callback = (blockNumber: number) => async (tx) => {
      if (!this.chats) return;
      const allAddresses = Object.values(this.chats).flat();

      if (!allAddresses.includes(tx.from) && !allAddresses.includes(tx.to))
        return;

      const address = tx.from || tx.to;

      const message = `
          New transaction received\nAddress: ${address}\nBlock # ${blockNumber}\nTx hash: ${tx.hash}\nEtherscan: https://etherscan.io/tx/${tx.hash}\nTx
          ------------------------`;
      const chatId = Object.keys(this.chats).find((key) =>
        this.chats[key].includes(address),
      );
      this.sendMessage(message, chatId);
    };

    this.subscription = await this.ethereum.ethBlockSubscribe(callback);
  };
}
