
export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  image?: string; // base64
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
