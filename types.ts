export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded data
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachments?: Attachment[];
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}