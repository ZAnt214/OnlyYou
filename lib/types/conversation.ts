export type ConversationStatus = "open" | "closed";

export interface Conversation {
  id: string;
  customRequestId: string;
  createdAt: string;
  updatedAt: string;
  status: ConversationStatus;
  lastMessageAt: string;
}

export type ConversationRole = "requester" | "creator";

/**
 * Participantes de uma conversa. Nesta fase mantemos apenas dois papéis
 * fixos (requester/creator) por CustomRequest — por isso não existe uma
 * tabela de participantes separada: eles são derivados diretamente do
 * CustomRequest (requesterId/creatorId). Esta interface documenta o
 * conceito e é usada por helpers de autorização, não por um repositório
 * próprio.
 */
export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  role: ConversationRole;
  joinedAt: string;
}

export type MessageType = "text" | "proposal" | "system" | "delivery" | "attachment";

export interface MessageMetadata {
  proposalId?: string;
  attachmentIds?: string[];
  customServiceOrderId?: string;
}

/**
 * Mensagens usam "soft delete" (deletedAt) em vez de remoção física: o
 * registro continua existindo (e visível para a administração), mas deixa
 * de ser exibido normalmente na conversa.
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  metadata?: MessageMetadata;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  customRequestId: string;
  uploaderId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: string;
}
