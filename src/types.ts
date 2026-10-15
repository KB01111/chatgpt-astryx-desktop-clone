import type { ChatToolCallItem } from "@astryxdesign/core/Chat";

export type ModelId = "gpt-4o" | "o3-mini" | "canvas" | "web-search";
export type ThemeChoice = "light" | "dark" | "matcha";
export type HistoryGroup = "Today" | "Yesterday" | "Previous 7 Days";
export type SettingsTab = "general" | "speech" | "data" | "shortcuts";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mime: string;
}

export interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  createdAt: string;
  attachments?: Attachment[];
  reasoning?: string[];
  toolCalls?: ChatToolCallItem[];
  feedback?: "up" | "down";
  interrupted?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  group: HistoryGroup;
  messages: Message[];
  pinned?: boolean;
  archived?: boolean;
}

export interface SendOptions {
  model: ModelId;
  search: boolean;
  reason: boolean;
  attachments: Attachment[];
}

export interface Preferences {
  theme: ThemeChoice;
  voice: string;
  saveHistory: boolean;
  improveModels: boolean;
  soundEffects: boolean;
}

export interface MockResponse {
  content: string;
  reasoning?: string[];
  toolCalls?: ChatToolCallItem[];
}
