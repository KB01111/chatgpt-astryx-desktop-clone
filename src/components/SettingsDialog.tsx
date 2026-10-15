import { useEffect, useState } from "react";
import { Dialog } from "@astryxdesign/core/Dialog";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Button } from "@astryxdesign/core/Button";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Switch } from "@astryxdesign/core/Switch";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Kbd } from "@astryxdesign/core/Kbd";
import {
  Check,
  ChevronDown,
  Download,
  Keyboard,
  Leaf,
  LockKeyhole,
  Mic,
  Moon,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Square,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import type {
  Conversation,
  Preferences,
  SettingsTab,
  ThemeChoice,
} from "../types";
import { IconAction } from "./IconAction";
import { downloadJson } from "../utils/browser";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: Preferences;
  onPreferences: (preferences: Preferences) => void;
  conversations: Conversation[];
  onClearHistory: () => void;
  onRestore: (id: string) => void;
  notify: (message: string) => void;
  initialTab?: SettingsTab;
}

const shortcuts = [
  ["Search chats and commands", "mod+k"],
  ["Start a new chat", "mod+n"],
  ["Open companion mode", "alt+space"],
  ["Toggle the sidebar", "mod+shift+s"],
  ["Add a new line", "shift+enter"],
  ["Close a dialog", "esc"],
];

export function SettingsDialog(props: SettingsDialogProps) {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [confirmClear, setConfirmClear] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const preferences = props.preferences;
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    props.onPreferences({ ...preferences, [key]: value });

  useEffect(() => {
    if (props.isOpen) {
      setTab(props.initialTab ?? "general");
      setConfirmClear(false);
    }
  }, [props.isOpen, props.initialTab]);
  useEffect(() => {
    if (!props.isOpen && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPreviewing(false);
    }
  }, [props.isOpen]);

  function previewVoice() {
    if (!("speechSynthesis" in window)) {
      props.notify("Voice previews are not supported by this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    if (previewing) {
      setPreviewing(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      "Hi Alex. A little clarity, a fresh perspective, or your next big idea. What can I help with today?",
    );
    const voices = window.speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang.startsWith("en"));
    const index = ["Juniper", "Cove", "Ember"].indexOf(preferences.voice);
    if (voices.length)
      utterance.voice = voices[Math.max(0, index) % voices.length];
    utterance.rate = preferences.voice === "Cove" ? 0.9 : 1;
    utterance.onend = () => setPreviewing(false);
    utterance.onerror = () => {
      setPreviewing(false);
      props.notify(
        "No audio voice is available. Try a browser with speech synthesis enabled.",
      );
    };
    setPreviewing(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <Dialog
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      width="var(--settings-width)"
      className="settings-dialog"
      aria-label="Settings"
      aria-labelledby="settings-title"
      padding={0}
    >
      <VStack gap={0}>
        <HStack className="dialog-header" justify="between" align="center">
          <VStack gap={1}>
            <Heading level={2} id="settings-title">
              Make yourself at home
            </Heading>
            <Text color="secondary">
              A few things to make ChatGPT feel more like you.
            </Text>
          </VStack>
          <IconAction
            label="Close settings"
            icon={<X />}
            onClick={() => props.onOpenChange(false)}
          />
        </HStack>
        <TabList
          role="tablist"
          value={tab}
          onChange={(value) => setTab(value as SettingsTab)}
          layout="fill"
          hasDivider
          className="settings-tabs"
          aria-label="Settings categories"
        >
          <Tab
            id="tab-general"
            value="general"
            label="General"
            icon={<Settings2 />}
            panelId="settings-general"
          />
          <Tab
            id="tab-speech"
            value="speech"
            label="Speech"
            icon={<Mic />}
            panelId="settings-speech"
          />
          <Tab
            id="tab-data"
            value="data"
            label="Data controls"
            icon={<ShieldCheck />}
            panelId="settings-data"
          />
          <Tab
            id="tab-shortcuts"
            value="shortcuts"
            label="Shortcuts"
            icon={<Keyboard />}
            panelId="settings-shortcuts"
          />
        </TabList>
        {(["general", "speech", "data", "shortcuts"] as const)
          .filter((panel) => panel !== tab)
          .map((panel) => (
            <VStack
              key={panel}
              role="tabpanel"
              id={`settings-${panel}`}
              aria-labelledby={`tab-${panel}`}
              hidden
              className="inactive-tab-panel"
            />
          ))}
        <VStack
          className="settings-body"
          gap={0}
          role="tabpanel"
          id={`settings-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
        >
          {tab === "general" && (
            <>
              <VStack className="setting-section" gap={4}>
                <VStack gap={1}>
                  <Text weight="medium">Appearance</Text>
                  <Text color="secondary">
                    Find a little comfort in your workspace.
                  </Text>
                </VStack>
                <HStack gap={3} className="theme-options">
                  {(
                    [
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "matcha", label: "Matcha", icon: Leaf },
                    ] as const
                  ).map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      label={label}
                      variant="secondary"
                      icon={<Icon />}
                      endContent={
                        preferences.theme === value ? <Check /> : undefined
                      }
                      className={`theme-choice ${preferences.theme === value ? "is-selected" : ""}`}
                      aria-pressed={preferences.theme === value}
                      onClick={() => update("theme", value as ThemeChoice)}
                    />
                  ))}
                </HStack>
              </VStack>
              <HStack
                className="setting-row"
                justify="between"
                align="center"
                gap={4}
              >
                <VStack gap={1}>
                  <Text weight="medium">Sound effects</Text>
                  <Text color="secondary">
                    A subtle sound when a response is ready.
                  </Text>
                </VStack>
                <Switch
                  label="Sound effects"
                  isLabelHidden
                  value={preferences.soundEffects}
                  onChange={(value) => update("soundEffects", value)}
                />
              </HStack>
              <HStack
                className="setting-row"
                justify="between"
                align="center"
                gap={4}
              >
                <VStack gap={1}>
                  <Text weight="medium">Language</Text>
                  <Text color="secondary">
                    The language used for this workspace.
                  </Text>
                </VStack>
                <Text color="secondary">English</Text>
              </HStack>
              <HStack className="about-workspace" gap={2} align="center">
                <LockKeyhole />
                <Text>
                  This is a local demo. Your messages stay in this browser.
                </Text>
              </HStack>
            </>
          )}
          {tab === "speech" && (
            <>
              <VStack className="setting-section" gap={4}>
                <VStack gap={1}>
                  <Text weight="medium">A voice that feels right</Text>
                  <Text color="secondary">
                    Choose a voice for your conversations.
                  </Text>
                </VStack>
                <HStack gap={3} align="center">
                  <DropdownMenu
                    button={{
                      label: preferences.voice,
                      variant: "secondary",
                      endContent: <ChevronDown />,
                    }}
                    hasChevron={false}
                    items={["Juniper", "Cove", "Ember"].map((voice, index) => ({
                      label: voice,
                      description: [
                        "Warm and upbeat",
                        "Calm and thoughtful",
                        "Clear and confident",
                      ][index],
                      endContent:
                        preferences.voice === voice ? <Check /> : undefined,
                      onClick: () => update("voice", voice),
                    }))}
                  />
                  <Button
                    label={previewing ? "Stop preview" : "Preview voice"}
                    icon={previewing ? <Square /> : <Play />}
                    variant="ghost"
                    onClick={previewVoice}
                  />
                </HStack>
                <Text className="setting-note">
                  Previews use the English voices installed in your browser.
                </Text>
              </VStack>
              <VStack className="setting-row" gap={2}>
                <Text weight="medium">Dictation</Text>
                <Text color="secondary">
                  Use the microphone in the composer to turn your voice into
                  text. Microphone access is requested only when you start.
                </Text>
                <Text className="setting-note">
                  Speech recognition availability depends on your browser and
                  device.
                </Text>
              </VStack>
            </>
          )}
          {tab === "data" && (
            <>
              <HStack
                className="setting-row"
                justify="between"
                align="center"
                gap={4}
              >
                <VStack gap={1}>
                  <Text weight="medium">Save chat history</Text>
                  <Text color="secondary">
                    Keep conversations on this device between visits.
                  </Text>
                </VStack>
                <Switch
                  label="Save chat history"
                  isLabelHidden
                  value={preferences.saveHistory}
                  onChange={(value) => update("saveHistory", value)}
                />
              </HStack>
              <HStack
                className="setting-row"
                justify="between"
                align="center"
                gap={4}
              >
                <VStack gap={1}>
                  <Text weight="medium">Improve the model for everyone</Text>
                  <Text color="secondary">
                    Demo preference only. No data is sent anywhere.
                  </Text>
                </VStack>
                <Switch
                  label="Improve the model for everyone"
                  isLabelHidden
                  value={preferences.improveModels}
                  onChange={(value) => update("improveModels", value)}
                />
              </HStack>
              <HStack
                className="setting-row"
                justify="between"
                align="center"
                gap={4}
              >
                <Text weight="medium">Take your conversations with you</Text>
                <Button
                  label="Export data"
                  variant="secondary"
                  icon={<Download />}
                  onClick={() => {
                    downloadJson(
                      "chatgpt-conversations.json",
                      props.conversations,
                    );
                    props.notify("Your conversations have been exported.");
                  }}
                />
              </HStack>
              {props.conversations.some((chat) => chat.archived) && (
                <VStack className="setting-section" gap={2}>
                  <Text weight="medium">Archived conversations</Text>
                  {props.conversations
                    .filter((chat) => chat.archived)
                    .map((chat) => (
                      <HStack
                        key={chat.id}
                        className="archive-row"
                        justify="between"
                        align="center"
                        gap={3}
                      >
                        <Text maxLines={1}>{chat.title}</Text>
                        <IconAction
                          label={`Restore ${chat.title}`}
                          icon={<RotateCcw />}
                          onClick={() => props.onRestore(chat.id)}
                        />
                      </HStack>
                    ))}
                </VStack>
              )}
              <HStack
                className="setting-row"
                justify="between"
                align="center"
                gap={4}
              >
                <VStack gap={1}>
                  <Text weight="medium">
                    {confirmClear
                      ? "Delete all conversations?"
                      : "Delete all chats"}
                  </Text>
                  <Text color="secondary">
                    {confirmClear
                      ? "This cannot be undone."
                      : "Make space for a fresh start."}
                  </Text>
                </VStack>
                {confirmClear ? (
                  <HStack gap={2}>
                    <Button
                      label="Cancel"
                      variant="ghost"
                      onClick={() => setConfirmClear(false)}
                    />
                    <Button
                      label="Delete all"
                      variant="destructive"
                      onClick={() => {
                        props.onClearHistory();
                        setConfirmClear(false);
                        props.notify("All conversations have been deleted.");
                      }}
                    />
                  </HStack>
                ) : (
                  <Button
                    label="Delete all"
                    variant="ghost"
                    icon={<Trash2 />}
                    className="destructive-text"
                    onClick={() => setConfirmClear(true)}
                  />
                )}
              </HStack>
            </>
          )}
          {tab === "shortcuts" && (
            <VStack gap={0}>
              <Text className="shortcuts-intro" color="secondary">
                A little less clicking. A little more flow.
              </Text>
              {shortcuts.map(([label, keys]) => (
                <HStack
                  key={keys}
                  className="shortcut-row"
                  justify="between"
                  align="center"
                >
                  <Text>{label}</Text>
                  <Kbd keys={keys} />
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
        <HStack className="dialog-footer" justify="between" align="center">
          <Text className="setting-note">
            Your preferences are saved automatically.
          </Text>
          <Text className="setting-note">ChatGPT Desktop / Demo</Text>
        </HStack>
      </VStack>
    </Dialog>
  );
}
