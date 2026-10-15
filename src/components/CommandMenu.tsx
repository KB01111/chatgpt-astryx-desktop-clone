import { useMemo } from "react";
import { CommandPalette } from "@astryxdesign/core/CommandPalette";
import { HStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { Kbd } from "@astryxdesign/core/Kbd";
import type { SearchableItem } from "@astryxdesign/core/Typeahead";
import {
  MessageCircle,
  Moon,
  PanelLeft,
  PictureInPicture2,
  Plus,
  Settings2,
} from "lucide-react";
import type { Conversation } from "../types";

interface CommandItem extends SearchableItem {
  auxiliaryData: { group: string; kind: "chat" | "command"; shortcut?: string };
}

interface CommandMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onSettings: () => void;
  onCompanion: () => void;
  onTheme: () => void;
  onSidebar: () => void;
}

export function CommandMenu(props: CommandMenuProps) {
  const items = useMemo<CommandItem[]>(
    () => [
      {
        id: "new",
        label: "Start a new chat",
        auxiliaryData: {
          group: "Quick actions",
          kind: "command",
          shortcut: "mod+n",
        },
      },
      {
        id: "companion",
        label: "Open companion mode",
        auxiliaryData: {
          group: "Quick actions",
          kind: "command",
          shortcut: "alt+space",
        },
      },
      {
        id: "settings",
        label: "Open settings",
        auxiliaryData: { group: "Quick actions", kind: "command" },
      },
      {
        id: "theme",
        label: "Toggle light / dark theme",
        auxiliaryData: { group: "Quick actions", kind: "command" },
      },
      {
        id: "sidebar",
        label: "Toggle sidebar",
        auxiliaryData: {
          group: "Quick actions",
          kind: "command",
          shortcut: "mod+shift+s",
        },
      },
      ...props.conversations
        .filter((chat) => !chat.archived)
        .map((chat) => ({
          id: `chat:${chat.id}`,
          label: chat.title,
          auxiliaryData: { group: "Your conversations", kind: "chat" as const },
        })),
    ],
    [props.conversations],
  );

  const searchSource = useMemo(
    () => ({
      bootstrap: () => items,
      search: (query: string) =>
        items.filter((item) =>
          item.label.toLowerCase().includes(query.toLowerCase()),
        ),
    }),
    [items],
  );
  const icons = {
    new: Plus,
    companion: PictureInPicture2,
    settings: Settings2,
    theme: Moon,
    sidebar: PanelLeft,
  };

  function choose(id: string) {
    props.onOpenChange(false);
    if (id.startsWith("chat:")) props.onSelect(id.slice(5));
    else if (id === "new") props.onNewChat();
    else if (id === "companion") props.onCompanion();
    else if (id === "settings") props.onSettings();
    else if (id === "theme") props.onTheme();
    else if (id === "sidebar") props.onSidebar();
  }

  return (
    <CommandPalette<CommandItem>
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      searchSource={searchSource}
      onValueChange={choose}
      label="Search chats and commands"
      width="var(--command-width)"
      className="command-palette"
      emptySearchText="No matches. Try a different title or command."
      renderItem={(item) => {
        const Icon =
          item.auxiliaryData.kind === "chat"
            ? MessageCircle
            : (icons[item.id as keyof typeof icons] ?? Plus);
        return (
          <HStack className="command-item-content" gap={3} align="center">
            <Icon />
            <Text>{item.label}</Text>
            {item.auxiliaryData.shortcut && (
              <Kbd keys={item.auxiliaryData.shortcut} />
            )}
          </HStack>
        );
      }}
    />
  );
}
