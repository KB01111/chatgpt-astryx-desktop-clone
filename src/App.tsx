import { useCallback, useEffect, useRef, useState } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { desktopMatchaTheme } from "./themes/desktop-matcha";
import { Layout, LayoutPanel, HStack, VStack } from "@astryxdesign/core/Layout";
import {
  ChatLayout,
  ChatLayoutScrollButton,
  type ChatComposerInputHandle,
} from "@astryxdesign/core/Chat";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import {
  ArrowRight,
  Check,
  CircleHelp,
  Code2,
  Compass,
  ExternalLink,
  Keyboard,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { usePersistentState } from "./hooks/usePersistentState";
import { useChatStore } from "./hooks/useChatStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { Sidebar } from "./components/Sidebar";
import { Titlebar } from "./components/Titlebar";
import { Welcome } from "./components/Welcome";
import { Composer } from "./components/Composer";
import { Conversation } from "./components/Conversation";
import { SettingsDialog } from "./components/SettingsDialog";
import { CommandMenu } from "./components/CommandMenu";
import { CompanionDialog } from "./components/CompanionDialog";
import { BrandMark } from "./components/BrandMark";
import { IconAction } from "./components/IconAction";
import type {
  Attachment,
  Conversation as ConversationType,
  ModelId,
  Preferences,
  SettingsTab,
} from "./types";

const defaultPreferences: Preferences = {
  theme: "light",
  voice: "Juniper",
  saveHistory: true,
  improveModels: false,
  soundEffects: false,
};
const compactQuery = "(max-width: 48rem)";

function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Preferences>;
  return (
    ["light", "dark", "matcha"].includes(candidate.theme ?? "") &&
    ["Juniper", "Cove", "Ember"].includes(candidate.voice ?? "") &&
    typeof candidate.saveHistory === "boolean" &&
    typeof candidate.improveModels === "boolean" &&
    typeof candidate.soundEffects === "boolean"
  );
}

function Desktop({
  preferences,
  onPreferences,
}: {
  preferences: Preferences;
  onPreferences: (preferences: Preferences) => void;
}) {
  const store = useChatStore(preferences.saveHistory);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => !window.matchMedia(compactQuery).matches,
  );
  const [workspace, setWorkspace] = useState("Personal");
  const [model, setModel] = useState<ModelId>("gpt-4o");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState(false);
  const [reason, setReason] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [companionOpen, setCompanionOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [windowState, setWindowState] = useState<
    "open" | "closed" | "minimized"
  >("open");
  const [pendingAction, setPendingAction] = useState<{
    type: "rename" | "delete";
    chat: ConversationType;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [notification, setNotification] = useState("");
  const [scrolledUp, setScrolledUp] = useState(false);
  const inputRef = useRef<ChatComposerInputHandle>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const wasStreaming = useRef(false);

  const notify = useCallback((message: string) => setNotification(message), []);
  const focusComposer = () =>
    window.setTimeout(() => inputRef.current?.focus(), 50);

  useEffect(() => {
    if (!notification) return;
    const timeout = window.setTimeout(() => setNotification(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  useEffect(() => {
    const query = window.matchMedia(compactQuery);
    const change = () => setSidebarOpen(!query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    if (!sidebarOpen || !window.matchMedia(compactQuery).matches) return;
    const focusTimer = window.setTimeout(
      () =>
        sidebarRef.current
          ?.querySelector<HTMLButtonElement>('[aria-label="Collapse sidebar"]')
          ?.focus(),
      50,
    );
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSidebarOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey);
      window.setTimeout(
        () =>
          document
            .querySelector<HTMLButtonElement>('[aria-label="Open sidebar"]')
            ?.focus(),
        0,
      );
    };
  }, [sidebarOpen]);

  useEffect(() => {
    document.title = store.activeChat
      ? `${store.activeChat.title} - ChatGPT`
      : "ChatGPT - A little help. A lot of possibility.";
    setScrolledUp(false);
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "instant",
    });
  }, [store.activeChat?.id, store.activeChat?.title]);

  useEffect(() => {
    if (
      wasStreaming.current &&
      !store.isStreaming &&
      preferences.soundEffects &&
      "AudioContext" in window
    ) {
      try {
        const audio = new AudioContext();
        const tone = audio.createOscillator();
        const gain = audio.createGain();
        tone.type = "sine";
        tone.frequency.value = 660;
        gain.gain.setValueAtTime(0.035, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.2);
        tone.connect(gain).connect(audio.destination);
        tone.start();
        tone.stop(audio.currentTime + 0.2);
        tone.onended = () => {
          void audio.close();
        };
      } catch {
        /* Audio restrictions should not block chat. */
      }
    }
    wasStreaming.current = store.isStreaming;
  }, [store.isStreaming, preferences.soundEffects]);

  function newChat() {
    store.stopGeneration();
    store.newChat();
    setDraft("");
    setAttachments([]);
    setCommandOpen(false);
    setSettingsOpen(false);
    setCompanionOpen(false);
    setWindowState("open");
    if (window.matchMedia(compactQuery).matches) setSidebarOpen(false);
    focusComposer();
  }

  function selectChat(id: string) {
    store.setActiveId(id);
    setDraft("");
    setAttachments([]);
    setCommandOpen(false);
    if (window.matchMedia(compactQuery).matches) setSidebarOpen(false);
  }

  function send(message = draft) {
    if (!message.trim() && !attachments.length) return;
    store.sendMessage(message, { model, search, reason, attachments });
    setDraft("");
    setAttachments([]);
    focusComposer();
  }

  function choosePrompt(prompt: string) {
    setDraft(prompt);
    setExploreOpen(false);
    focusComposer();
  }

  function openSettings(tab: SettingsTab = "general") {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  function windowAction(action: "close" | "minimize" | "expand") {
    if (action === "close") {
      store.stopGeneration();
      setWindowState("closed");
    } else if (action === "minimize") setWindowState("minimized");
    else if (document.fullscreenElement)
      void document
        .exitFullscreen()
        .catch(() => notify("Full screen is not available in this browser."));
    else if (document.documentElement.requestFullscreen)
      void document.documentElement
        .requestFullscreen()
        .catch(() => notify("Your browser does not allow full screen here."));
    else notify("Full screen is not available in this browser.");
  }

  useKeyboardShortcuts({
    command: () => setCommandOpen((open) => !open),
    newChat,
    companion: () => setCompanionOpen((open) => !open),
    sidebar: () => setSidebarOpen((open) => !open),
  });

  const assistants = [
    {
      title: "The writing partner",
      description: "Your words, with a little more clarity.",
      icon: PenLine,
      prompt: "Help me write a thoughtful first draft.",
    },
    {
      title: "The code companion",
      description: "Think through bugs and build with confidence.",
      icon: Code2,
      prompt: "Help me debug a TypeScript error.",
    },
    {
      title: "The idea explorer",
      description: "Find the possibility in a half-formed thought.",
      icon: Lightbulb,
      prompt: "Help me brainstorm a new product idea.",
    },
    {
      title: "The everyday planner",
      description: "Make a little more room for what matters.",
      icon: Compass,
      prompt: "Help me make a simple, realistic plan for my week.",
    },
  ];

  return (
    <>
      {windowState === "open" ? (
        <Layout
          className={`desktop-frame ${sidebarOpen ? "sidebar-is-open" : ""}`}
          padding={0}
          start={
            sidebarOpen ? (
              <LayoutPanel
                ref={sidebarRef}
                width="var(--desktop-sidebar-width)"
                padding={0}
                isScrollable={false}
                hasDivider
                role="navigation"
                label="Main navigation"
                className="desktop-sidebar"
              >
                <Sidebar
                  conversations={store.conversations}
                  activeId={store.activeId}
                  workspace={workspace}
                  onWorkspace={(value) => {
                    setWorkspace(value);
                    notify(
                      `Switched to ${value === "Personal" ? "your personal workspace" : "the Design team workspace"}.`,
                    );
                  }}
                  onNewChat={newChat}
                  onSelect={selectChat}
                  onSearch={() => setCommandOpen(true)}
                  onExplore={() => setExploreOpen(true)}
                  onCollapse={() => setSidebarOpen(false)}
                  onSettings={() => openSettings()}
                  onRename={(chat) => {
                    setRenameValue(chat.title);
                    setPendingAction({ type: "rename", chat });
                  }}
                  onDelete={(chat) =>
                    setPendingAction({ type: "delete", chat })
                  }
                  onPin={store.pinChat}
                  onArchive={(id) => {
                    store.archiveChat(id);
                    notify(
                      "Chat archived. You can restore it in Settings > Data controls.",
                    );
                  }}
                  onWindowAction={windowAction}
                />
              </LayoutPanel>
            ) : undefined
          }
          content={
            <VStack as="main" className="main-pane" gap={0}>
              {/* Desktop: fixed sidebar + fluid canvas. Compact screens: the sidebar overlays the canvas. */}
              {sidebarOpen && (
                <IconButton
                  label="Close navigation"
                  icon={<X />}
                  className="sidebar-scrim"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <Titlebar
                model={model}
                onModel={(value) => {
                  setModel(value);
                  if (value === "web-search") setSearch(true);
                  if (value === "o3-mini") setReason(true);
                }}
                sidebarOpen={sidebarOpen}
                onSidebar={() => setSidebarOpen(true)}
                onSearch={() => setCommandOpen(true)}
                onNewChat={newChat}
                onCompanion={() => setCompanionOpen(true)}
                onWindowAction={windowAction}
              />
              <ChatLayout
                ref={chatRef}
                density="spacious"
                className={`chat-canvas ${store.activeChat ? "has-conversation" : "is-welcome"}`}
                onScroll={(event) => {
                  const element = event.currentTarget;
                  setScrolledUp(
                    element.scrollHeight -
                      element.scrollTop -
                      element.clientHeight >
                      160,
                  );
                }}
                scrollButton={
                  <ChatLayoutScrollButton
                    isVisible={scrolledUp}
                    onClick={() =>
                      chatRef.current?.scrollTo({
                        top: chatRef.current.scrollHeight,
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "instant"
                          : "smooth",
                      })
                    }
                  />
                }
                emptyState={<Welcome onPrompt={choosePrompt} />}
                composer={
                  <Composer
                    value={draft}
                    onChange={setDraft}
                    onSend={() => send()}
                    onStop={store.stopGeneration}
                    isStreaming={store.isStreaming}
                    search={search}
                    onSearch={setSearch}
                    reason={reason}
                    onReason={setReason}
                    attachments={attachments}
                    onAttachments={setAttachments}
                    inputRef={inputRef}
                    onCompanion={() => setCompanionOpen(true)}
                    notify={notify}
                  />
                }
              >
                {store.activeChat ? (
                  <Conversation
                    key={store.activeId}
                    chat={store.activeChat}
                    isStreaming={store.isStreaming}
                    streamingMessageId={store.streamingMessageId}
                    voice={preferences.voice}
                    onRegenerate={store.regenerate}
                    onFeedback={store.setFeedback}
                    notify={notify}
                  />
                ) : null}
              </ChatLayout>
              <HStack className="help-menu">
                <DropdownMenu
                  placement="above"
                  alignment="end"
                  renderTrigger={(trigger) => (
                    <IconButton
                      {...trigger}
                      label="Help and information"
                      icon={<CircleHelp />}
                      variant="ghost"
                      className="help-button"
                    />
                  )}
                  items={[
                    {
                      label: "About this workspace",
                      icon: <MessageCircle />,
                      onClick: () => setAboutOpen(true),
                    },
                    {
                      label: "Keyboard shortcuts",
                      icon: <Keyboard />,
                      onClick: () => openSettings("shortcuts"),
                    },
                    {
                      label: "Data and privacy",
                      icon: <ShieldCheck />,
                      onClick: () => openSettings("data"),
                    },
                  ]}
                />
              </HStack>
            </VStack>
          }
        />
      ) : (
        <VStack className="resting-window" align="center" justify="center">
          <EmptyState
            icon={<BrandMark className="welcome-mark" />}
            title={
              windowState === "closed"
                ? "See you soon, Alex."
                : "A little breathing room."
            }
            description={
              windowState === "closed"
                ? "Your conversations are right here when you need them."
                : "ChatGPT is minimized. Come back whenever you are ready."
            }
            actions={
              <Button
                label="Back to ChatGPT"
                variant="primary"
                icon={<ArrowRight />}
                onClick={() => setWindowState("open")}
              />
            }
          />
        </VStack>
      )}

      <CommandMenu
        isOpen={commandOpen}
        onOpenChange={setCommandOpen}
        conversations={store.conversations}
        onSelect={selectChat}
        onNewChat={newChat}
        onSettings={() => openSettings()}
        onCompanion={() => setCompanionOpen(true)}
        onTheme={() =>
          onPreferences({
            ...preferences,
            theme: preferences.theme === "dark" ? "light" : "dark",
          })
        }
        onSidebar={() => setSidebarOpen((open) => !open)}
      />
      <SettingsDialog
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialTab={settingsTab}
        preferences={preferences}
        onPreferences={onPreferences}
        conversations={store.conversations}
        onClearHistory={store.clearHistory}
        onRestore={(id) => {
          store.archiveChat(id, false);
          notify("Conversation restored to your history.");
        }}
        notify={notify}
      />
      <CompanionDialog
        isOpen={companionOpen}
        onOpenChange={setCompanionOpen}
        onSend={(message) => send(message)}
        notify={notify}
      />

      <Dialog
        isOpen={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        width="var(--small-dialog-width)"
        aria-labelledby="chat-action-title"
        className="small-dialog"
      >
        <VStack gap={5}>
          <HStack justify="between" align="center">
            <Heading id="chat-action-title" level={2}>
              {pendingAction?.type === "rename"
                ? "A new name for this chat"
                : "Delete this conversation?"}
            </Heading>
            <IconAction
              label="Cancel"
              icon={<X />}
              onClick={() => setPendingAction(null)}
            />
          </HStack>
          {pendingAction?.type === "rename" ? (
            <TextInput
              label="Conversation title"
              value={renameValue}
              onChange={setRenameValue}
              hasAutoFocus
              onEnter={() => {
                if (renameValue.trim() && pendingAction) {
                  store.renameChat(pendingAction.chat.id, renameValue);
                  setPendingAction(null);
                }
              }}
            />
          ) : (
            <Text color="secondary">
              &quot;{pendingAction?.chat.title}&quot; will be permanently
              deleted. This can't be undone.
            </Text>
          )}
          <HStack justify="end" gap={2}>
            <Button
              label="Cancel"
              variant="ghost"
              onClick={() => setPendingAction(null)}
            />
            <Button
              label={
                pendingAction?.type === "rename"
                  ? "Save changes"
                  : "Delete chat"
              }
              variant={
                pendingAction?.type === "rename" ? "primary" : "destructive"
              }
              isDisabled={
                pendingAction?.type === "rename" && !renameValue.trim()
              }
              onClick={() => {
                if (!pendingAction) return;
                if (pendingAction.type === "rename")
                  store.renameChat(pendingAction.chat.id, renameValue);
                else {
                  store.removeChat(pendingAction.chat.id);
                  notify("Conversation deleted.");
                }
                setPendingAction(null);
              }}
            />
          </HStack>
        </VStack>
      </Dialog>

      <Dialog
        isOpen={exploreOpen}
        onOpenChange={setExploreOpen}
        width="var(--command-width)"
        padding={0}
        className="explore-dialog"
        aria-labelledby="explore-title"
      >
        <VStack gap={0}>
          <HStack className="dialog-header" justify="between" align="center">
            <VStack gap={2}>
              <HStack gap={2} align="center">
                <Sparkles />
                <Heading level={2} id="explore-title">
                  A partner for every possibility
                </Heading>
              </HStack>
              <Text color="secondary">
                Find a starting point for whatever's on your mind.
              </Text>
            </VStack>
            <IconAction
              label="Close Explore GPTs"
              icon={<X />}
              onClick={() => setExploreOpen(false)}
            />
          </HStack>
          <VStack className="assistants-list" gap={0}>
            {assistants.map(({ title, description, icon: Icon, prompt }) => (
              <Button
                label={title}
                key={title}
                variant="ghost"
                className="assistant-option"
                onClick={() => choosePrompt(prompt)}
              >
                <HStack
                  gap={4}
                  align="center"
                  className="assistant-option-content"
                >
                  <Icon />
                  <VStack gap={1}>
                    <Text weight="medium">{title}</Text>
                    <Text color="secondary">{description}</Text>
                  </VStack>
                  <ArrowRight />
                </HStack>
              </Button>
            ))}
          </VStack>
          <Text className="explore-note">
            Prompt starters for this demo, not external GPT integrations.
          </Text>
        </VStack>
      </Dialog>

      <Dialog
        isOpen={aboutOpen}
        onOpenChange={setAboutOpen}
        width="var(--small-dialog-width)"
        className="about-dialog"
        aria-labelledby="about-title"
      >
        <VStack gap={5}>
          <HStack justify="between" align="center">
            <BrandMark className="about-mark" />
            <IconAction
              label="Close information"
              icon={<X />}
              onClick={() => setAboutOpen(false)}
            />
          </HStack>
          <VStack gap={2}>
            <Heading level={2} id="about-title">
              A familiar space. Thoughtfully built.
            </Heading>
            <Text color="secondary">
              An interactive ChatGPT desktop concept built with React 19 and the
              official Astryx design system.
            </Text>
          </VStack>
          <HStack align="start" gap={3}>
            <LockKeyhole />
            <Text>
              Conversations and preferences stay in your browser. Responses and
              tool calls are simulated, and attachments are metadata previews
              only.
            </Text>
          </HStack>
          <Text color="secondary">
            Voice features use browser speech APIs and may require a network
            connection and microphone permission. This is not an official OpenAI
            application.
          </Text>
          <Button
            label="Explore Astryx"
            icon={<ExternalLink />}
            href="https://astryx.atmeta.com/"
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          />
        </VStack>
      </Dialog>

      {notification && (
        <HStack
          className="app-toast"
          role="status"
          aria-live="polite"
          gap={3}
          align="center"
        >
          <Check />
          <Text>{notification}</Text>
          <IconAction
            label="Dismiss notification"
            icon={<X />}
            onClick={() => setNotification("")}
          />
        </HStack>
      )}
    </>
  );
}

export default function App() {
  const [preferences, setPreferences] = usePersistentState(
    "chatgpt-desktop.preferences.v1",
    defaultPreferences,
    isPreferences,
  );
  return (
    <Theme
      theme={preferences.theme === "matcha" ? desktopMatchaTheme : neutralTheme}
      mode={preferences.theme === "dark" ? "dark" : "light"}
    >
      <Desktop preferences={preferences} onPreferences={setPreferences} />
    </Theme>
  );
}
