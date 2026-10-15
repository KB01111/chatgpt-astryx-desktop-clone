import { useEffect, useRef, useState } from "react";
import { Dialog } from "@astryxdesign/core/Dialog";
import {
  ChatComposer,
  ChatComposerInput,
  ChatDictationButton,
  ChatSendButton,
  useChatDictation,
  type ChatComposerInputHandle,
} from "@astryxdesign/core/Chat";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { Kbd } from "@astryxdesign/core/Kbd";
import { ArrowUp, X } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { IconAction } from "./IconAction";

interface CompanionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (message: string) => void;
  notify: (message: string) => void;
}

export function CompanionDialog({
  isOpen,
  onOpenChange,
  onSend,
  notify,
}: CompanionDialogProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<ChatComposerInputHandle>(null);
  const dictation = useChatDictation({
    inputRef,
    hasSounds: false,
    onError: () =>
      notify(
        "Microphone access is unavailable. You can type your message instead.",
      ),
  });

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(timer);
    }
    dictation.stop();
  }, [isOpen]);

  function send() {
    if (!value.trim()) return;
    dictation.stop();
    onSend(value);
    setValue("");
    onOpenChange(false);
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width="var(--companion-width)"
      position={{ top: "26vh" }}
      padding={0}
      className="companion-dialog"
      aria-label="ChatGPT companion"
    >
      <VStack gap={0}>
        <HStack className="companion-header" justify="between" align="center">
          <HStack gap={2} align="center">
            <BrandMark />
            <Text weight="medium">A little help, right here.</Text>
          </HStack>
          <IconAction
            label="Close companion"
            icon={<X />}
            onClick={() => onOpenChange(false)}
          />
        </HStack>
        <ChatComposer
          className="companion-composer"
          value={value}
          onChange={setValue}
          onSubmit={send}
          elevation="none"
          input={
            <ChatComposerInput
              handleRef={inputRef}
              label="Ask ChatGPT companion"
              placeholder="Ask anything, from anywhere..."
              maxRows={4}
              hasHistory
            />
          }
          footerActions={
            dictation.isListening ? (
              <HStack gap={2} align="center">
                <HStack className="voice-wave" gap={1}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <VStack key={index} />
                  ))}
                </HStack>
                <Text className="listening-label">Listening...</Text>
              </HStack>
            ) : (
              <Text className="companion-hint">
                Your thinking partner, one shortcut away.
              </Text>
            )
          }
          sendActions={
            <ChatDictationButton
              dictation={dictation}
              isHiddenWhenUnsupported={false}
              label="Start companion dictation"
            />
          }
          sendButton={
            <ChatSendButton
              onSend={send}
              isDisabled={!value.trim()}
              sendIcon={<ArrowUp />}
              className="send-button"
            />
          }
        />
        <HStack className="companion-footer" justify="between" align="center">
          <HStack gap={2} align="center">
            <Kbd keys="alt+space" />
            <Text>Open from anywhere in this app</Text>
          </HStack>
          <HStack gap={2} align="center">
            <Kbd keys="esc" />
            <Text>to close</Text>
          </HStack>
        </HStack>
      </VStack>
    </Dialog>
  );
}
