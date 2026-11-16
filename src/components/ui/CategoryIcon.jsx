import {
  Baby, Banknote, BookOpen, Briefcase, Bus, Car, CircleDollarSign, Coffee, Dumbbell, Film, Fuel, Gamepad2, Gem, Gift,
  GraduationCap, Handshake, HeartPulse, Home, Landmark, Laptop, Music, PawPrint, PiggyBank, Plane, Receipt,
  Shirt, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Tag, TrendingUp, Utensils, Wallet, Wrench, Zap,
} from 'lucide-react';

export const ICONS = {
  Baby, Banknote, BookOpen, Briefcase, Bus, Car, CircleDollarSign, Coffee, Dumbbell, Film, Fuel, Gamepad2, Gem, Gift,
  GraduationCap, Handshake, HeartPulse, Home, Landmark, Laptop, Music, PawPrint, PiggyBank, Plane, Receipt,
  Shirt, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Tag, TrendingUp, Utensils, Wallet, Wrench, Zap,
};

/** Tinted rounded-square badge — the one visual identity for a category everywhere in the app. */
export default function CategoryIcon({ name, color = '#8B9BB4', size = 40, className = '', neutral = false }) {
  const Icon = ICONS[name] || Tag;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${className}`}
      style={{
        width: size,
        height: size,
        background: neutral ? '#29292B' : `${color}26`,
        color: neutral ? '#F5F5F5' : color,
        boxShadow: neutral ? 'none' : `inset 0 0 0 1px ${color}33`,
        borderRadius: neutral ? '9999px' : undefined,
      }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </span>
  );
}
