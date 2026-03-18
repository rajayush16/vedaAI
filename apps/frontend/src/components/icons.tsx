import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  Library,
  Menu,
  Plus,
  School,
  Sparkles,
  SquareLibrary,
  Users,
} from "lucide-react";

const iconMap = {
  bell: Bell,
  grid: Grid2x2,
  groups: Users,
  file: BookOpen,
  library: Library,
  sparkles: Sparkles,
  school: School,
  plus: Plus,
  menu: Menu,
  left: ChevronLeft,
  right: ChevronRight,
  square: SquareLibrary,
};

export type IconName = keyof typeof iconMap;

export function AppIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Icon = iconMap[name];

  return <Icon className={className} strokeWidth={1.9} />;
}
