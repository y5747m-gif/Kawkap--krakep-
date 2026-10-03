import {
  Layers, Coins, Anvil, Package, CupSoda, Box, Newspaper, Cpu, WashingMachine,
  Radio, Droplets, TreePine, Wrench, Sofa, Hammer, Tags, Tag,
} from "lucide-react";

const MAP: Record<string, typeof Tag> = {
  layers: Layers,
  coins: Coins,
  anvil: Anvil,
  package: Package,
  "cup-soda": CupSoda,
  box: Box,
  newspaper: Newspaper,
  cpu: Cpu,
  "washing-machine": WashingMachine,
  radio: Radio,
  droplets: Droplets,
  "tree-pine": TreePine,
  wrench: Wrench,
  sofa: Sofa,
  hammer: Hammer,
  tags: Tags,
};

/** أيقونة SVG لكل تصنيف (بدون أي Emojis) */
export default function CategoryIcon({
  icon, size = 20, className = "",
}: { icon: string; size?: number; className?: string }) {
  const Icon = MAP[icon] ?? Tag;
  return <Icon size={size} className={className} strokeWidth={2} aria-hidden="true" />;
}
