"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChatGptIcon,
  ClaudeIcon,
  GoogleGeminiIcon,
} from "@hugeicons/core-free-icons";

export interface AIAgent {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface SelectAIAgentProps {
  agents?: AIAgent[];
  onSendMessage?: (message: string, agentId: string) => void;
  className?: string;
}

const AGENTS = [
  {
    id: "chatgpt",
    name: "Chatgpt",
    icon: (
      <HugeiconsIcon
        icon={ChatGptIcon}
        size={24}
        color="currentColor"
        strokeWidth={1.5}
      />
    ),
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: (
      <HugeiconsIcon
        icon={GoogleGeminiIcon}
        size={24}
        color="currentColor"
        strokeWidth={1.5}
      />
    ),
  },
  {
    id: "claude",
    name: "Claude",
    icon: (
      <HugeiconsIcon
        icon={ClaudeIcon}
        size={24}
        color="currentColor"
        strokeWidth={1.5}
      />
    ),
  },
];

export const SelectAIAgent: React.FC<SelectAIAgentProps> = ({
  agents = AGENTS,
  onSendMessage,
  className = "",
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(agents[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [appType, setAppType] = useState<"Web App" | "Mobile App">("Web App");

  return (
    <div
      className={`theme-injected flex w-full flex-col items-center justify-center p-4 antialiased select-none sm:p-6 ${className}`}
    >
      <div className="relative z-40 w-full max-w-[95%] sm:max-w-110">
        <LayoutGroup>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8,
                }}
                className="border-oklch(0.922 0 0) bg-oklch(1 0 0)/90 absolute -top-16 left-0 z-0 flex w-fit origin-bottom-left gap-1 rounded-lg border p-1.5 backdrop-blur-xl sm:gap-2 dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.145 0 0)/90"
              >
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setIsMenuOpen(false);
                    }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all active:scale-95 sm:h-11 sm:w-11 ${
                      selectedAgent.id === agent.id
                        ? "border-oklch(0.922 0 0) bg-oklch(1 0 0) border shadow-sm dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.145 0 0)"
                        : "text-oklch(0.556 0 0) hover:bg-oklch(0.97 0 0) dark:text-oklch(0.708 0 0) dark:hover:bg-oklch(0.269 0 0)"
                    }`}
                  >
                    <div className="scale-110 sm:scale-125">{agent.icon}</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout
            className="border-oklch(0.922 0 0) bg-oklch(0.97 0 0) border p-4 shadow-sm transition-all rounded-lg sm:p-5 dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.269 0 0)"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <motion.button
                layoutId={`agent-${selectedAgent.id}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center"
              >
                <div className="text-oklch(0.145 0 0) brightness-120  scale-[1.4] sm:scale-[1.6] dark:text-oklch(0.985 0 0)">
                  {selectedAgent.icon}
                </div>
              </motion.button>

              <div className="ml-1 flex h-14 flex-1 flex-col gap-3 sm:h-18 sm:gap-5">
                <input
                  type="text"
                  placeholder="Start a new project"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="text-oklch(0.145 0 0) placeholder:text-oklch(0.556 0 0) w-full border-none bg-transparent pt-1 text-lg font-medium outline-none sm:text-[20px] dark:text-oklch(0.985 0 0) dark:placeholder:text-oklch(0.708 0 0)"
                />
              </div>
            </div>

            <div className="mt-6 flex w-full items-center justify-between sm:mt-8">
              <motion.button
                onClick={() =>
                  setAppType((t) =>
                    t === "Web App" ? "Mobile App" : "Web App"
                  )
                }
                className="border-oklch(0.922 0 0) bg-oklch(1 0 0) hover:bg-oklch(0.97 0 0)/5 flex items-center gap-2 overflow-hidden rounded-lg border px-4 py-1.5 shadow-xs transition-all active:scale-95 sm:px-5 sm:py-2 dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.145 0 0) dark:hover:bg-oklch(0.269 0 0)/5"
              >
                <div className="relative h-5 overflow-hidden sm:h-6">
                  <AnimatedText
                    text={appType}
                    className="text-oklch(0.556 0 0) text-sm font-semibold whitespace-nowrap sm:text-base dark:text-oklch(0.708 0 0)"
                  />
                </div>

                <motion.div
                  layout
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 26,
                  }}
                  className="text-oklch(0.556 0 0) flex flex-col -space-y-1 dark:text-oklch(0.708 0 0)"
                >
                  <ChevronUp size={14} strokeWidth={3} />
                  <ChevronDown size={14} strokeWidth={3} />
                </motion.div>
              </motion.button>

              <button
                title="send"
                onClick={() => onSendMessage?.(message, selectedAgent.id)}
                className="bg-oklch(0.205 0 0) text-oklch(0.985 0 0) flex h-10 w-10 items-center justify-center rounded-lg shadow-md transition-all hover:scale-105 active:scale-90 sm:h-11 sm:w-11 dark:bg-oklch(0.922 0 0) dark:text-oklch(0.205 0 0)"
              >
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
};

function AnimatedText({
  text,
  className,
  delayStep = 0.014,
}: {
  text: string;
  className?: string;
  delayStep?: number;
}) {
  const chars = text.split("");

  return (
    <span className={className} style={{ display: "inline-flex" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} style={{ display: "inline-flex" }}>
          {chars.map((char, i) => (
            <motion.span
              key={i}
              initial={{
                y: 10,
                opacity: 0,
                scale: 0.5,
                filter: "blur(2px)",
              }}
              animate={{
                y: 0,
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                y: -10,
                opacity: 0,
                scale: 0.5,
                filter: "blur(2px)",
              }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 16,
                mass: 1.2,
                delay: i * delayStep,
              }}
              style={{
                display: "inline-block",
                whiteSpace: char === "" ? "pre" : undefined,
                willChange: "transform",
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
