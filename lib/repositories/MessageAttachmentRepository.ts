import type { MessageAttachment } from "@/lib/types";
import { messageAttachments } from "@/lib/data/message-attachments";

/**
 * Repositório mock "plano" (não precisa do padrão session-backed): metadado
 * de anexo é criado uma vez, na entrega, e não precisa sobreviver a reload
 * de forma crítica para a demo — mesmo padrão usado por ReportRepository.
 */
export interface MessageAttachmentRepository {
  findByMessage(messageId: string): MessageAttachment[];
  findByIds(ids: string[]): MessageAttachment[];
  create(attachment: MessageAttachment): MessageAttachment;
}

let mockAttachments: MessageAttachment[] = [...messageAttachments];

export class MockMessageAttachmentRepository implements MessageAttachmentRepository {
  findByMessage(messageId: string): MessageAttachment[] {
    return mockAttachments.filter((a) => a.messageId === messageId);
  }

  findByIds(ids: string[]): MessageAttachment[] {
    return mockAttachments.filter((a) => ids.includes(a.id));
  }

  create(attachment: MessageAttachment): MessageAttachment {
    mockAttachments = [...mockAttachments, attachment];
    return attachment;
  }
}

export const messageAttachmentRepository = new MockMessageAttachmentRepository();
