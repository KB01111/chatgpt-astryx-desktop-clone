import { HStack, VStack } from "@astryxdesign/core/Layout";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Code2,
  Lightbulb,
  PenLine,
} from "lucide-react";
import { BrandMark } from "./BrandMark";

const suggestions = [
  {
    title: "Make sense of data",
    description: "Find the story behind the numbers",
    icon: ChartNoAxesCombined,
    color: "blue",
    prompt:
      "Help me analyze stock data and turn the numbers into a clear, useful story.",
  },
  {
    title: "Bring an idea to life",
    description: "A little spark for your next big thing",
    icon: Lightbulb,
    color: "orange",
    prompt: "Help me brainstorm a compelling product pitch for a new idea.",
  },
  {
    title: "Find the right words",
    description: "From a first draft to the final polish",
    icon: PenLine,
    color: "purple",
    prompt:
      "Help me write something thoughtful about starting before you feel ready.",
  },
  {
    title: "Build something great",
    description: "Work through a bug or try a new idea",
    icon: Code2,
    color: "green",
    prompt:
      "Help me debug a TypeScript error with optional properties and type guards.",
  },
] as const;

export function Welcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <VStack className="welcome" gap={0} align="center">
      <EmptyState
        className="welcome-heading"
        icon={<BrandMark className="welcome-mark" />}
        title="What can I help with?"
        description="A little clarity, a fresh perspective, or your next big idea."
        headingLevel={1}
      />
      <VStack className="suggestion-grid" gap={0}>
        {suggestions.map(
          ({ title, description, icon: Icon, color, prompt }) => (
            <Card
              key={title}
              padding={0}
              elevation="none"
              className={`suggestion-card suggestion-${color}`}
            >
              <Button
                label={title}
                variant="ghost"
                className="suggestion-button"
                onClick={() => onPrompt(prompt)}
              >
                <VStack gap={3} className="suggestion-content">
                  <HStack align="center" justify="between">
                    <Icon className="suggestion-icon" />
                    <ArrowUpRight className="suggestion-arrow" />
                  </HStack>
                  <VStack gap={1}>
                    <Text className="suggestion-title">{title}</Text>
                    <Text className="suggestion-description">
                      {description}
                    </Text>
                  </VStack>
                </VStack>
              </Button>
            </Card>
          ),
        )}
      </VStack>
      <Text className="welcome-hint">
        Big questions. Small tasks. A place to start.
      </Text>
    </VStack>
  );
}
