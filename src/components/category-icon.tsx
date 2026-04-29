"use client";

import {
  UtensilsCrossed,
  Coffee,
  Pizza,
  ShoppingBag,
  ShoppingCart,
  Car,
  Bus,
  Plane,
  Fuel,
  Home,
  Receipt,
  Lightbulb,
  Wifi,
  Smartphone,
  Gamepad2,
  Music,
  Film,
  Book,
  GraduationCap,
  HeartPulse,
  Pill,
  Dumbbell,
  Shirt,
  Sparkles,
  Gift,
  PawPrint,
  Baby,
  PiggyBank,
  CreditCard,
  Tag,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Coffee,
  Pizza,
  ShoppingBag,
  ShoppingCart,
  Car,
  Bus,
  Plane,
  Fuel,
  Home,
  Receipt,
  Lightbulb,
  Wifi,
  Smartphone,
  Gamepad2,
  Music,
  Film,
  Book,
  GraduationCap,
  HeartPulse,
  Pill,
  Dumbbell,
  Shirt,
  Sparkles,
  Gift,
  PawPrint,
  Baby,
  PiggyBank,
  CreditCard,
  Tag,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon className={className} />;
}
