import { HStack } from "@astryxdesign/core/Layout";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Text } from "@astryxdesign/core/Text";
import {
  Check,
  ChevronDown,
  Globe2,
  PanelLeftOpen,
  PictureInPicture2,
  Search,
  Sparkles,
  SquarePen,
  Zap,
} from "lucide-react";
import type { ModelId } from "../types";
import { models } from "../data/conversations";
import { IconAction } from "./IconAction";
import { WindowControls } from "./Sidebar";

interface TitlebarProps {
  model: ModelId;
  onModel: (model: ModelId) => void;
  sidebarOpen: boolean;
  onSidebar: () => void;
  onSearch: () => void;
  onNewChat: () => void;
  onCompanion: () => void;
  onWindowAction: (action: "close" | "minimize" | "expand") => void;
}

export function Titlebar(props: TitlebarProps) {
  const current = models.find((model) => model.id === props.model)!;
  const icons = [<Zap />, <Sparkles />, <SquarePen />, <Globe2 />];
  return (
    <HStack className="main-titlebar" justify="between" align="center" gap={3}>
      <HStack align="center" gap={3} className="titlebar-start">
        {!props.sidebarOpen && (
          <HStack gap={4} align="center" className="collapsed-window-controls">
            <WindowControls onAction={props.onWindowAction} />
            <IconAction
              label="Open sidebar"
              icon={<PanelLeftOpen />}
              onClick={props.onSidebar}
            />
          </HStack>
        )}
        <DropdownMenu
          className="model-dropdown"
          menuWidth="var(--model-menu-width)"
          hasChevron={false}
          button={{
            label: `ChatGPT ${current.shortName}`,
            variant: "ghost",
            className: "model-trigger",
            children: (
              <HStack align="center" gap={2}>
                <Text className="model-brand">ChatGPT</Text>
                <Text className="model-name">{current.shortName}</Text>
                <ChevronDown />
              </HStack>
            ),
          }}
          header={
            <Text className="dropdown-heading">
              Choose your thinking partner
            </Text>
          }
          items={models.map((model, index) => ({
            label: model.name,
            description: model.description,
            icon: icons[index],
            endContent: (
              <HStack gap={2} align="center">
                <Badge label={model.capability} variant="neutral" />
                {model.id === props.model && (
                  <Check className="selected-model-check" />
                )}
              </HStack>
            ),
            onClick: () => props.onModel(model.id),
          }))}
          footer={
            <Text className="dropdown-footnote">
              Demo workspace. Responses are simulated locally.
            </Text>
          }
        />
      </HStack>
      <HStack className="quick-actions" gap={2} align="center">
        <Button
          label="Search commands"
          icon={<Search />}
          variant="ghost"
          className="command-trigger"
          onClick={props.onSearch}
        >
          <Kbd keys="mod+k" />
        </Button>
        <HStack className="toolbar-divider" />
        <IconAction
          label="Open companion mode (Alt+Space)"
          icon={<PictureInPicture2 />}
          onClick={props.onCompanion}
        />
        <IconAction
          label="New chat (Cmd+N)"
          icon={<SquarePen />}
          onClick={props.onNewChat}
        />
      </HStack>
    </HStack>
  );
}
