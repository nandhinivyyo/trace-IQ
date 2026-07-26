import {
  LayoutDashboard,
  GitGraph,
  Workflow,
  History,
  FolderCode,
  Sparkles,
  Settings,
  UserRound,
} from "lucide-react";

export const navGroups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
        description: "An overview of your activity across TraceIQ AI.",
      },
      {
        label: "Code Visualizer",
        path: "/code-visualizer",
        icon: GitGraph,
        description: "Step through code execution as an interactive graph.",
      },
      {
        label: "DSA Visualizer",
        path: "/dsa-visualizer",
        icon: Workflow,
        description:
          "Watch data structures and algorithms run, frame by frame.",
      },
    ],
  },
  {
    label: "Library",
    items: [
      {
        label: "Execution History",
        path: "/history",
        icon: History,
        description: "Every run you've traced, searchable and timestamped.",
      },
      {
        label: "Saved Programs",
        path: "/saved",
        icon: FolderCode,
        description: "Programs you've bookmarked for later review.",
      },
    ],
  },
  {
    label: "Assistant",
    items: [
      {
        label: "AI Hint Tutor",
        path: "/hint-tutor",
        icon: Sparkles,
        description: "Ask for a nudge in the right direction, not the answer.",
      },
    ],
  },
];

export const utilityNavItems = [
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    description: "Manage your preferences, editor, and integrations.",
  },
  {
    label: "Profile",
    path: "/profile",
    icon: UserRound,
    description: "Your account, plan, and personal details.",
  },
];

export const allNavItems = [
  ...navGroups.flatMap((g) => g.items),
  ...utilityNavItems,
];
