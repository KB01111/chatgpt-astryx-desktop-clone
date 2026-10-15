import { useMemo, useRef, type RefObject } from "react";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import {
  ChatComposer,
  ChatComposerDrawer,
  ChatComposerInput,
  ChatDictationButton,
  ChatSendButton,
  useChatDictation,
  type ChatComposerInputHandle,
  type ChatComposerTrigger,
} from "@astryxdesign/core/Chat";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import {
  ArrowUp,
  AudioLines,
  FileText,
  Globe2,
  Image,
  Lightbulb,
  Plus,
  Square,
  X,
} from "lucide-react";
import type { Attachment } from "../types";
import { IconAction } from "./IconAction";
import { formatFileSize } from "../utils/browser";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  search: boolean;
  onSearch: (value: boolean) => void;
  reason: boolean;
  onReason: (value: boolean) => void;
  attachments: Attachment[];
  onAttachments: (attachments: Attachment[]) => void;
  inputRef: RefObject<ChatComposerInputHandle | null>;
  onCompanion: () => void;
  notify: (message: string) => void;
}

export function Composer(props: ComposerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dictation = useChatDictation({
    inputRef: props.inputRef,
    hasSounds: false,
    onError: (error) =>
      props.notify(
        error.error === "not-allowed"
          ? "Microphone access was denied. You can enable it in your browser settings."
          : "Dictation is unavailable right now. You can keep typing instead.",
      ),
  });

  const triggers = useMemo<ChatComposerTrigger[]>(() => {
    const commands = [
      {
        id: "search",
        label: "Search the web",
        auxiliaryData: { hint: "Enable the demo web search tool" },
      },
      {
        id: "reason",
        label: "Think it through",
        auxiliaryData: { hint: "Add an approach summary" },
      },
      { id: "write", label: "Help me write" },
      { id: "code", label: "Help me code" },
    ];
    return [
      {
        character: "/",
        menuLabel: "Composer commands",
        searchSource: {
          bootstrap: () => commands,
          search: (query) =>
            commands.filter(
              (item) =>
                item.label.toLowerCase().includes(query.toLowerCase()) ||
                item.id.startsWith(query.toLowerCase()),
            ),
        },
        onSelect: (item) => {
          if (item.id === "search") {
            props.onSearch(true);
            return { value: "[Search]", label: "Search", variant: "neutral" };
          }
          if (item.id === "reason") {
            props.onReason(true);
            return { value: "[Reason]", label: "Reason", variant: "neutral" };
          }
          return item.id === "write" ? "Help me write " : "Help me debug ";
        },
      },
    ];
  }, [props.onSearch, props.onReason]);

  function addFiles(files: File[]) {
    const accepted = files.filter((file) => file.size <= 20 * 1024 * 1024);
    if (accepted.length !== files.length)
      props.notify(
        "Files must be smaller than 20 MB. Larger files were not attached.",
      );
    const room = Math.max(0, 5 - props.attachments.length);
    if (accepted.length > room)
      props.notify("You can attach up to 5 files to a message.");
    props.onAttachments([
      ...props.attachments,
      ...accepted.slice(0, room).map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        mime: file.type,
      })),
    ]);
  }

  return (
    <VStack className="composer-stack" gap={3}>
      <input
        ref={fileRef}
        type="file"
        multiple
        className="visually-hidden"
        tabIndex={-1}
        aria-label="Choose attachments"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <ChatComposer
        className="main-composer"
        value={props.value}
        onChange={props.onChange}
        onSubmit={props.onSend}
        onStop={props.onStop}
        isStopShown={props.isStreaming}
        elevation="none"
        drawer={
          props.attachments.length > 0 ? (
            <ChatComposerDrawer
              label="Attachments"
              count={props.attachments.length}
              className="attachment-drawer"
            >
              <HStack gap={2} wrap="wrap" className="attachment-list">
                {props.attachments.map((file) => (
                  <HStack
                    className="attachment-chip"
                    gap={2}
                    align="center"
                    key={file.id}
                  >
                    {file.mime.startsWith("image/") ? <Image /> : <FileText />}
                    <VStack gap={0}>
                      <Text className="attachment-name">{file.name}</Text>
                      <Text className="attachment-size">
                        {formatFileSize(file.size)}
                      </Text>
                    </VStack>
                    <IconAction
                      label={`Remove ${file.name}`}
                      icon={<X />}
                      onClick={() =>
                        props.onAttachments(
                          props.attachments.filter(
                            (item) => item.id !== file.id,
                          ),
                        )
                      }
                    />
                  </HStack>
                ))}
              </HStack>
            </ChatComposerDrawer>
          ) : undefined
        }
        input={
          <ChatComposerInput
            handleRef={props.inputRef}
            label="Message ChatGPT"
            placeholder="Ask anything"
            maxRows={7}
            triggers={triggers}
            hasHistory
            onFiles={addFiles}
            className="composer-input"
          />
        }
        footerActions={
          <HStack gap={1} align="center" className="composer-tools">
            <IconAction
              label="Attach files (up to 20 MB each)"
              icon={<Plus />}
              onClick={() => fileRef.current?.click()}
            />
            <HStack className="composer-tool-divider" />
            <Button
              label="Search"
              icon={<Globe2 />}
              variant="ghost"
              className={`composer-toggle ${props.search ? "is-active" : ""}`}
              aria-pressed={props.search}
              onClick={() => props.onSearch(!props.search)}
            />
            <Button
              label="Reason"
              icon={<Lightbulb />}
              variant="ghost"
              className={`composer-toggle ${props.reason ? "is-active" : ""}`}
              aria-pressed={props.reason}
              onClick={() => props.onReason(!props.reason)}
            />
          </HStack>
        }
        sendActions={
          <HStack gap={1} align="center">
            <ChatDictationButton
              dictation={dictation}
              isHiddenWhenUnsupported={false}
              label="Dictate a message"
              className="dictation-button"
            />
            <IconAction
              label="Start voice mode"
              icon={<AudioLines />}
              onClick={props.onCompanion}
              className="voice-mode-button"
            />
          </HStack>
        }
        sendButton={
          <ChatSendButton
            isStopShown={props.isStreaming}
            isDisabled={
              !props.isStreaming &&
              !props.value.trim() &&
              !props.attachments.length
            }
            onSend={props.onSend}
            onStop={props.onStop}
            sendIcon={<ArrowUp />}
            stopIcon={<Square className="stop-icon" />}
            className="send-button"
          />
        }
      />
      <Text className="composer-disclaimer" justify="center">
        ChatGPT can make mistakes. Check important info.
      </Text>
    </VStack>
  );
}
