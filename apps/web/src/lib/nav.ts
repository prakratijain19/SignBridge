import {
  LayoutDashboard,
  Mic,
  Hand,
  Users,
  Video,
  Languages,
  PersonStanding,
  GraduationCap,
  Siren,
  History,
  Settings,
  User,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  /** English label; also the fallback when a translation is missing. */
  label: string;
  /** Translation key resolved via `useT()` for the active interface language. */
  labelKey: string;
  icon: LucideIcon;
  /** Emergency entry is styled distinctly (beacon) for fast recognition. */
  emphasis?: 'emergency';
}

/** Primary navigation for the authenticated app shell. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/live', label: 'Live conversation', labelKey: 'nav.live', icon: Users },
  { href: '/call', label: 'Video call', labelKey: 'nav.call', icon: Video },
  { href: '/speech', label: 'Speech', labelKey: 'nav.speech', icon: Mic },
  { href: '/sign', label: 'Sign recognition', labelKey: 'nav.sign', icon: Hand },
  { href: '/avatar', label: 'Sign avatar', labelKey: 'nav.avatar', icon: PersonStanding },
  { href: '/translate', label: 'Translate', labelKey: 'nav.translate', icon: Languages },
  { href: '/learn', label: 'Learn ISL', labelKey: 'nav.learn', icon: GraduationCap },
  {
    href: '/emergency',
    label: 'Emergency',
    labelKey: 'nav.emergency',
    icon: Siren,
    emphasis: 'emergency',
  },
  { href: '/history', label: 'History', labelKey: 'nav.history', icon: History },
  { href: '/profile', label: 'Profile', labelKey: 'nav.profile', icon: User },
  { href: '/settings', label: 'Settings', labelKey: 'nav.settings', icon: Settings },
];

export const ROLE_LABELS: Record<string, string> = {
  DEAF_USER: 'Deaf user',
  HEARING_USER: 'Hearing user',
  LEARNER: 'Learner',
  ADMIN: 'Administrator',
};
