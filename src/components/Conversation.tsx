import { useEffect, useState } from "react";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import {
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatMessageMetadata,
  ChatToolCalls,
} from "@astryxdesign/core/Chat";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Markdown } from "@astryxdesign/core/Markdown";
import { CodeBlock } from "@astryxdesign/core/CodeBlock";
import { Text } from "@astryxdesign/core/Text";
import {
  Brain,
  Check,
  Copy,
  FileText,
  RotateCcw,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import type { Conversation as ConversationType } from "../types";
import { BrandMark } from "./BrandMark";
import { IconAction } from "./IconAction";
import { copyText, plainSpeechText } from "../utils/browser";

interface ConversationProps {
  chat: ConversationType;
  isStreaming: boolean;
  streamingMessageId: string | null;
  voice: string;
  onRegenerate: (messageId: string) => void;
  onFeedback: (messageId: string, feedback: "up" | "down") => void;
  notify: (message: string) => void;
}

function MessageCode({ code, language }: { code: string; language?: string }) {
  return (
    <CodeBlock
      code={code}
      language={language}
      hasLanguageLabel
      hasCopyButton
      width="100%"
      isWrapped
      className="message-code"
    />
  );
}

const markdownComponents = { code: MessageCode };

export function Conversation({
  chat,
  isStreaming,
  streamingMessageId,
  voice,
  onRegenerate,
  onFeedback,
  notify,
}: ConversationProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    setSpeakingId(null);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [chat.id]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 2200);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  function readAloud(id: string, content: string) {
    if (!("speechSynthesis" in window)) {
      notify("Read aloud is not supported by this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(plainSpeechText(content));
    const voices = window.speechSynthesis
      .getVoices()
      .filter((item) => item.lang.startsWith("en"));
    if (voices.length)
      utterance.voice =
        voices[
          Math.max(0, ["Juniper", "Cove", "Ember"].indexOf(voice)) %
            voices.length
        ];
    utterance.rate = 0.98;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => {
      setSpeakingId(null);
      notify("Audio playback is unavailable. Please try again.");
    };
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <ChatMessageList
      align="top"
      gap={8}
      isStreaming={isStreaming}
      className="message-list"
      aria-label={chat.title}
    >
      {chat.messages.map((message) => {
        const streaming = isStreaming && message.id === streamingMessageId;
        const assistant = message.sender === "assistant";
        return (
          <ChatMessage
            key={message.id}
            sender={message.sender}
            className={`thread-message ${assistant ? "assistant-message" : "user-message"}`}
            avatar={
              assistant ? (
                <VStack
                  className="assistant-avatar"
                  align="center"
                  justify="center"
                >
                  <BrandMark />
                </VStack>
              ) : undefined
            }
            name={
              assistant ? (
                <HStack gap={2} align="center">
                  <Text className="assistant-name">ChatGPT</Text>
                  <Text className="assistant-model">
                    {streaming ? "Thinking with you" : "Your thinking partner"}
                  </Text>
                </HStack>
              ) : undefined
            }
          >
            <ChatMessageBubble
              variant={assistant ? "ghost" : "filled"}
              width={assistant ? "100%" : undefined}
              className={assistant ? "assistant-bubble" : "user-bubble"}
            >
              {message.attachments && message.attachments.length > 0 && (
                <HStack gap={2} wrap="wrap" className="message-attachments">
                  {message.attachments.map((file) => (
                    <HStack
                      gap={2}
                      align="center"
                      className="message-attachment"
                      key={file.id}
                    >
                      <FileText />
                      <Text>{file.name}</Text>
                    </HStack>
                  ))}
                </HStack>
              )}
              {assistant && message.reasoning && (
                <Collapsible
                  defaultIsOpen={false}
                  className="reasoning-step"
                  trigger={
                    <HStack gap={2} align="center">
                      <Brain />
                      <Text>Thought for 4 seconds</Text>
                    </HStack>
                  }
                >
                  <VStack gap={2} className="reasoning-summary">
                    <Text weight="medium">Approach summary</Text>
                    {message.reasoning.map((step) => (
                      <Text color="secondary" key={step}>
                        {step}
                      </Text>
                    ))}
                    <Text className="reasoning-note">
                      A simulated summary, not internal reasoning.
                    </Text>
                  </VStack>
                </Collapsible>
              )}
              {assistant && message.toolCalls && (
                <ChatToolCalls
                  calls={message.toolCalls}
                  className="message-tools"
                />
              )}
              {message.content ? (
                <Markdown
                  components={markdownComponents}
                  isStreaming={streaming}
                  className="message-markdown"
                >
                  {message.content}
                </Markdown>
              ) : (
                <HStack
                  gap={1}
                  className="thinking-dots"
                  aria-label="Generating response"
                >
                  <VStack />
                  <VStack />
                  <VStack />
                </HStack>
              )}
              {message.interrupted && (
                <Text className="interrupted-label">
                  You stopped this response.
                </Text>
              )}
            </ChatMessageBubble>
            {assistant && !streaming && (
              <ChatMessageMetadata
                className="message-metadata"
                timestamp={
                  <Text className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                }
                footer={
                  <HStack gap={1} align="center">
                    <IconAction
                      label={
                        copiedId === message.id ? "Copied" : "Copy response"
                      }
                      icon={copiedId === message.id ? <Check /> : <Copy />}
                      onClick={async () => {
                        if (await copyText(message.content))
                          setCopiedId(message.id);
                        else
                          notify(
                            "Clipboard access is unavailable in this browser.",
                          );
                      }}
                    />
                    <IconAction
                      label="Regenerate response"
                      icon={<RotateCcw />}
                      onClick={() => onRegenerate(message.id)}
                      isDisabled={isStreaming}
                    />
                    <IconAction
                      label="Good response"
                      icon={<ThumbsUp />}
                      aria-pressed={message.feedback === "up"}
                      className={message.feedback === "up" ? "is-active" : ""}
                      onClick={() => onFeedback(message.id, "up")}
                    />
                    <IconAction
                      label="Bad response"
                      icon={<ThumbsDown />}
                      aria-pressed={message.feedback === "down"}
                      className={message.feedback === "down" ? "is-active" : ""}
                      onClick={() => onFeedback(message.id, "down")}
                    />
                    <IconAction
                      label={
                        speakingId === message.id
                          ? "Stop reading"
                          : "Read aloud"
                      }
                      icon={
                        speakingId === message.id ? <Square /> : <Volume2 />
                      }
                      onClick={() => readAloud(message.id, message.content)}
                    />
                    <Text className="demo-response-label">Demo response</Text>
                  </HStack>
                }
              />
            )}
          </ChatMessage>
        );
      })}
    </ChatMessageList>
  );
}
