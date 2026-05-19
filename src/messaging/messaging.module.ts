import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schema/conversations.schema';
import { ConversationParticipant, ConversationParticipantSchema } from './schema/conversation-participants.schema';
import { Message, MessageSchema } from './schema/messages.schema';
import { PinnedMessage, PinnedMessageSchema } from './schema/pinned-messages.schema';
import { CustomOffer, CustomOfferSchema } from './schema/custom-offers.schema';
import { MessageAttachment, MessageAttachmentSchema } from './schema/message-attachments.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationParticipant.name, schema: ConversationParticipantSchema },
      { name: Message.name, schema: MessageSchema },
      { name: PinnedMessage.name, schema: PinnedMessageSchema },
      { name: CustomOffer.name, schema: CustomOfferSchema },
      { name: MessageAttachment.name, schema: MessageAttachmentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MessagingModule {}
