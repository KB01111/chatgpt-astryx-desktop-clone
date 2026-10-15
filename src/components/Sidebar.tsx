import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Text } from "@astryxdesign/core/Text";
import { Avatar } from "@astryxdesign/core/Avatar";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Badge } from "@astryxdesign/core/Badge";
import { Kbd } from "@astryxdesign/core/Kbd";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Grid2X2,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { Conversation, HistoryGroup } from "../types";
import { BrandMark } from "./BrandMark";
import { IconAction } from "./IconAction";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  workspace: string;
  onWorkspace: (workspace: string) => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onSearch: () => void;
  onExplore: () => void;
  onCollapse: () => void;
  onSettings: () => void;
  onRename: (chat: Conversation) => void;
  onDelete: (chat: Conversation) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  onWindowAction: (action: "close" | "minimize" | "expand") => void;
}

export function WindowControls({
  onAction,
}: {
  onAction: SidebarProps["onWindowAction"];
}) {
  return (
    <HStack gap={2} className="window-controls" aria-label="Window controls">
      <IconButton
        label="Close window"
        icon={<Plus className="traffic-icon close-symbol" />}
        className="traffic-light traffic-close"
        onClick={() => onAction("close")}
      />
      <IconButton
        label="Minimize window"
        icon={<Text className="traffic-icon">-</Text>}
        className="traffic-light traffic-minimize"
        onClick={() => onAction("minimize")}
      />
      <IconButton
        label="Toggle full screen"
        icon={<Plus className="traffic-icon" />}
        className="traffic-light traffic-expand"
        onClick={() => onAction("expand")}
      />
    </HStack>
  );
}

export function Sidebar(props: SidebarProps) {
  const visible = props.conversations.filter((chat) => !chat.archived);
  const groups: (HistoryGroup | "Pinned")[] = [
    "Pinned",
    "Today",
    "Yesterday",
    "Previous 7 Days",
  ];

  return (
    <VStack className="sidebar-content" gap={0}>
      <HStack className="sidebar-titlebar" align="center">
        <WindowControls onAction={props.onWindowAction} />
      </HStack>
      <VStack className="sidebar-top" gap={0}>
        <HStack className="sidebar-brand" justify="between" align="center">
          <HStack gap={2} align="center">
            <BrandMark />
            <Text className="brand-name">ChatGPT</Text>
          </HStack>
          <IconAction
            label="Collapse sidebar"
            icon={<PanelLeftClose />}
            onClick={props.onCollapse}
          />
        </HStack>
        <HStack className="workspace-menu">
          <DropdownMenu
            button={{
              label: `${props.workspace} workspace`,
              variant: "ghost",
              className: "workspace-trigger",
              endContent: <ChevronDown />,
            }}
            hasChevron={false}
            menuWidth="var(--desktop-sidebar-width)"
            items={[
              {
                label: "Personal workspace",
                description: "Just for you",
                icon: <UserRound />,
                endContent:
                  props.workspace === "Personal" ? <Check /> : undefined,
                onClick: () => props.onWorkspace("Personal"),
              },
              {
                label: "Design team",
                description: "Your shared creative space",
                icon: <UsersRound />,
                endContent:
                  props.workspace === "Design team" ? <Check /> : undefined,
                onClick: () => props.onWorkspace("Design team"),
              },
            ]}
          />
        </HStack>
        <Button
          label="New chat"
          variant="primary"
          icon={<Plus />}
          endContent={<Kbd keys="mod+n" />}
          className="new-chat-button"
          onClick={props.onNewChat}
        />
        <VStack gap={1} className="sidebar-tools">
          <Button
            label="Search chats"
            icon={<Search />}
            variant="ghost"
            endContent={<Kbd keys="mod+k" />}
            className="sidebar-tool"
            onClick={props.onSearch}
          />
          <Button
            label="Explore GPTs"
            icon={<Grid2X2 />}
            variant="ghost"
            className="sidebar-tool"
            onClick={props.onExplore}
          />
        </VStack>
      </VStack>
      <VStack
        gap={5}
        className="history-scroll"
        aria-label="Conversation history"
      >
        {groups.map((group) => {
          const chats = visible.filter((chat) =>
            group === "Pinned"
              ? chat.pinned
              : !chat.pinned && chat.group === group,
          );
          if (!chats.length) return null;
          return (
            <VStack gap={1} className="history-group" key={group}>
              <Text className="history-heading">{group}</Text>
              <VStack gap={0}>
                {chats.map((chat) => (
                  <HStack
                    gap={0}
                    align="center"
                    key={chat.id}
                    className={`history-row ${chat.id === props.activeId ? "is-selected" : ""}`}
                  >
                    <Button
                      label={chat.title}
                      variant="ghost"
                      className="history-item"
                      aria-current={
                        chat.id === props.activeId ? "page" : undefined
                      }
                      onClick={() => props.onSelect(chat.id)}
                    />
                    {chat.pinned && <Pin className="history-pin" />}
                    <HStack className="history-menu">
                      <DropdownMenu
                        alignment="end"
                        menuWidth="var(--menu-width)"
                        renderTrigger={(trigger) => (
                          <IconButton
                            {...trigger}
                            label={`Options for ${chat.title}`}
                            icon={<MoreHorizontal />}
                            variant="ghost"
                            className="history-more"
                          />
                        )}
                        items={[
                          {
                            label: "Rename",
                            icon: <Pencil />,
                            onClick: () => props.onRename(chat),
                          },
                          {
                            label: chat.pinned ? "Unpin chat" : "Pin chat",
                            icon: <Pin />,
                            onClick: () => props.onPin(chat.id),
                          },
                          {
                            label: "Archive",
                            icon: <Archive />,
                            onClick: () => props.onArchive(chat.id),
                          },
                          { type: "divider" },
                          {
                            label: "Delete chat",
                            icon: <Trash2 />,
                            variant: "destructive",
                            onClick: () => props.onDelete(chat),
                          },
                        ]}
                      />
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          );
        })}
        {!visible.length && (
          <Text className="history-empty" color="secondary">
            A fresh start. Your conversations will appear here.
          </Text>
        )}
      </VStack>
      <VStack className="sidebar-footer" gap={0}>
        <Button
          label="Alex Morgan account settings"
          variant="ghost"
          className="profile-button"
          onClick={props.onSettings}
        >
          <HStack gap={3} align="center" className="profile-content">
            <Avatar
              name="Alex Morgan"
              size="md"
              tooltip={false}
              className="profile-avatar"
              status={<StatusDot variant="success" label="Online" />}
            />
            <VStack gap={0} className="profile-copy">
              <Text className="profile-name">Alex Morgan</Text>
              <Text className="profile-subtitle">Personal account</Text>
            </VStack>
            <Badge label="Plus" variant="neutral" className="plus-badge" />
            <ChevronsUpDown className="profile-chevron" />
          </HStack>
        </Button>
      </VStack>
    </VStack>
  );
}
