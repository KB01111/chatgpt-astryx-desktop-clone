import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMockResponse,
  initialConversations,
} from "../data/conversations";
import type {
  Conversation,
  Message,
  MockResponse,
  SendOptions,
} from "../types";

const STORAGE_KEY = "chatgpt-desktop.conversations.v1";

function isConversationArray(value: unknown): value is Conversation[] {
  return (
    Array.isArray(value) &&
    value.every(
      (chat) =>
        chat &&
        typeof chat.id === "string" &&
        typeof chat.title === "string" &&
        ["Today", "Yesterday", "Previous 7 Days"].includes(chat.group) &&
        Array.isArray(chat.messages) &&
        chat.messages.every(
          (m: Message) =>
            m &&
            typeof m.id === "string" &&
            typeof m.content === "string" &&
            (m.sender === "user" || m.sender === "assistant") &&
            typeof m.createdAt === "string",
        ),
    )
  );
}

function loadConversations(): Conversation[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    return isConversationArray(saved) ? saved : initialConversations;
  } catch {
    return initialConversations;
  }
}

export function useChatStore(saveHistory: boolean) {
  const [conversations, setConversations] =
    useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streamingChatId, setStreamingChatId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const generationRef = useRef<{ chatId: string; messageId: string } | null>(
    null,
  );
  const lastOptions = useRef<SendOptions>({
    model: "gpt-4o",
    search: false,
    reason: false,
    attachments: [],
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        if (saveHistory)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* A storage limit must never interrupt a conversation. */
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [conversations, saveHistory]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    },
    [],
  );

  const updateChat = useCallback(
    (id: string, update: (chat: Conversation) => Conversation) => {
      setConversations((chats) =>
        chats.map((chat) => (chat.id === id ? update(chat) : chat)),
      );
    },
    [],
  );

  const stopGeneration = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    const generation = generationRef.current;
    if (generation)
      updateChat(generation.chatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((message) =>
          message.id === generation.messageId
            ? {
                ...message,
                interrupted: true,
                content:
                  message.content ||
                  "Response stopped. You can regenerate it whenever you are ready.",
              }
            : message,
        ),
      }));
    timerRef.current = null;
    generationRef.current = null;
    setStreamingChatId(null);
  }, [updateChat]);

  const streamResponse = useCallback(
    (chatId: string, messageId: string, response: MockResponse) => {
      const tokens = response.content.match(/\S+\s*/g) ?? [];
      let cursor = 0;
      generationRef.current = { chatId, messageId };
      setStreamingChatId(chatId);
      timerRef.current = window.setInterval(() => {
        cursor = Math.min(cursor + 2, tokens.length);
        const content = tokens.slice(0, cursor).join("");
        updateChat(chatId, (chat) => ({
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === messageId ? { ...message, content } : message,
          ),
        }));
        if (cursor >= tokens.length) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current);
          timerRef.current = null;
          generationRef.current = null;
          setStreamingChatId(null);
        }
      }, 36);
    },
    [updateChat],
  );

  const sendMessage = useCallback(
    (raw: string, options: SendOptions) => {
      const content = raw.trim();
      if (!content && options.attachments.length === 0) return;
      stopGeneration();
      const chatId = activeId ?? crypto.randomUUID();
      const prompt = content || "Help me understand these attachments.";
      const createdAt = new Date().toISOString();
      const response = createMockResponse(prompt, options);
      const user: Message = {
        id: crypto.randomUUID(),
        sender: "user",
        content: prompt,
        createdAt,
        attachments: options.attachments,
      };
      const assistant: Message = {
        id: crypto.randomUUID(),
        sender: "assistant",
        createdAt,
        ...response,
        content: "",
      };
      lastOptions.current = options;
      setConversations((chats) => {
        const existing = chats.find((chat) => chat.id === chatId);
        if (existing)
          return chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  group: "Today",
                  messages: [...chat.messages, user, assistant],
                }
              : chat,
          );
        return [
          {
            id: chatId,
            title:
              prompt.length > 36 ? `${prompt.slice(0, 36).trim()}...` : prompt,
            group: "Today",
            messages: [user, assistant],
          },
          ...chats,
        ];
      });
      setActiveId(chatId);
      streamResponse(chatId, assistant.id, response);
    },
    [activeId, stopGeneration, streamResponse],
  );

  const regenerate = useCallback(
    (messageId: string) => {
      const chat = conversations.find((c) => c.id === activeId);
      if (!chat) return;
      const index = chat.messages.findIndex((m) => m.id === messageId);
      const user = [...chat.messages.slice(0, index)]
        .reverse()
        .find((m) => m.sender === "user");
      if (!user) return;
      stopGeneration();
      const response = createMockResponse(user.content, {
        ...lastOptions.current,
        attachments: user.attachments ?? [],
      });
      updateChat(chat.id, (current) => ({
        ...current,
        messages: current.messages.map((m) =>
          m.id === messageId
            ? {
                ...m,
                ...response,
                content: "",
                feedback: undefined,
                interrupted: false,
                createdAt: new Date().toISOString(),
              }
            : m,
        ),
      }));
      streamResponse(chat.id, messageId, response);
    },
    [activeId, conversations, stopGeneration, streamResponse, updateChat],
  );

  const removeChat = useCallback(
    (id: string) => {
      if (generationRef.current?.chatId === id) stopGeneration();
      setConversations((chats) => chats.filter((chat) => chat.id !== id));
      setActiveId((current) => (current === id ? null : current));
    },
    [stopGeneration],
  );

  const archiveChat = useCallback(
    (id: string, archived = true) => {
      updateChat(id, (chat) => ({ ...chat, archived }));
      if (archived) setActiveId((current) => (current === id ? null : current));
    },
    [updateChat],
  );

  const clearHistory = useCallback(() => {
    stopGeneration();
    setConversations([]);
    setActiveId(null);
  }, [stopGeneration]);

  const setFeedback = useCallback(
    (messageId: string, feedback: "up" | "down") => {
      if (!activeId) return;
      updateChat(activeId, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === messageId
            ? { ...m, feedback: m.feedback === feedback ? undefined : feedback }
            : m,
        ),
      }));
    },
    [activeId, updateChat],
  );

  return {
    conversations,
    activeId,
    activeChat: conversations.find((chat) => chat.id === activeId) ?? null,
    isStreaming: streamingChatId !== null && streamingChatId === activeId,
    streamingMessageId: generationRef.current?.messageId ?? null,
    setActiveId,
    newChat: () => setActiveId(null),
    sendMessage,
    stopGeneration,
    regenerate,
    removeChat,
    archiveChat,
    clearHistory,
    setFeedback,
    renameChat: (id: string, title: string) =>
      updateChat(id, (chat) => ({ ...chat, title: title.trim() })),
    pinChat: (id: string) =>
      updateChat(id, (chat) => ({ ...chat, pinned: !chat.pinned })),
  };
}
