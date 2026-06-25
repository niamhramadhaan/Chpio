export interface GoalDetection {
  isGoalAck: boolean;
  goal?: string;
  steps?: string[];
  isGoalComplete: boolean;
  isGoalCheckIn: boolean;
}

const GOAL_ACK_PATTERNS = [
  /got it\s*[—–-]\s*(.+?)(?:\.|$)/i,
  /your goal is\s*[—–:]?\s*(.+?)(?:\.|$)/i,
  /i'?ll track\s*[—–:]?\s*(.+?)(?:\.|$)/i,
  /(?:i'?ll|let me) keep (?:tabs|track) on\s*[—–:]?\s*(.+?)(?:\.|$)/i,
  /tracking\s*[—–:]?\s*(.+?)(?:\.|$)/i,
];

const GOAL_COMPLETE_PATTERNS = [
  /looks like (?:we|you) (?:nailed|completed|finished|done with)\s*[—–:]?\s*(.+?)(?:\.|$)/i,
  /(?:we|you) (?:nailed|completed|finished|done with)\s*[—–:]?\s*(.+?)(?:\.|$)/i,
  /goal (?:complete|done|achieved|reached)\s*[—–:]?\s*(.+?)(?:\.|$)/i,
  /that'?s?\s*(?:a wrap|done|complete)\s*(?:for|on)\s*[—–:]?\s*(.+?)(?:\.|$)/i,
];

const GOAL_CHECK_IN_PATTERNS = [
  /how'?s?\s+(?:the\s+)?(.+?)\s+(?:going|coming along|progressing)/i,
  /(?:any|made)\s+(?:progress|headway)\s+(?:on|with)\s+(.+?)\?/i,
  /where (?:are|do) (?:we|you) (?:stand|at)\s+(?:on|with)\s+(.+?)\?/i,
  /(?:still|are you) working on\s+(.+?)\?/i,
];

export function detectGoalResponse(content: string): GoalDetection {
  const result: GoalDetection = {
    isGoalAck: false,
    isGoalComplete: false,
    isGoalCheckIn: false,
  };

  // Check for goal acknowledgment
  for (const pattern of GOAL_ACK_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      result.isGoalAck = true;
      result.goal = match[1].trim();
      break;
    }
  }

  // Check for goal completion
  if (!result.isGoalAck) {
    for (const pattern of GOAL_COMPLETE_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        result.isGoalComplete = true;
        result.goal = match[1].trim();
        break;
      }
    }
  }

  // Check for goal check-in
  if (!result.isGoalAck && !result.isGoalComplete) {
    for (const pattern of GOAL_CHECK_IN_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        result.isGoalCheckIn = true;
        result.goal = match[1].trim();
        break;
      }
    }
  }

  // Extract steps if present
  if (result.isGoalAck && result.goal) {
    const steps: string[] = [];
    const stepMatches = content.match(/^[-*\d]+[.)]\s*.+$/gm);
    if (stepMatches) {
      for (const step of stepMatches) {
        const cleaned = step.replace(/^[-*\d]+[.)]\s*/, '').trim();
        if (cleaned) steps.push(cleaned);
      }
    }
    if (steps.length > 0) {
      result.steps = steps;
    }
  }

  return result;
}
