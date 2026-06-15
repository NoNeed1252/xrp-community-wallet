/**
 * Centralized icon pack: Phosphor Icons (regular weight) — open source MIT.
 * Re-exported под привычные нам имена (бывший lucide naming), чтобы
 * сменить пак можно было одной правкой здесь.
 *
 * Если нужно изменить вес (regular | light | bold | duotone | fill) —
 * либо передавайте проп `weight` точечно, либо меняйте сразу всё через
 * <IconContext.Provider value={{ weight: 'regular' }}> в корне приложения.
 */

import {
  AddressBook,
  ArrowDownLeft,
  ArrowLineDown,
  ArrowRight,
  ArrowSquareOut,
  ArrowsLeftRight,
  ArrowsClockwise,
  ArrowUpRight,
  CalendarBlank,
  CaretDown,
  CaretRight,
  ChartLineUp,
  Check,
  CheckCircle,
  ClockCounterClockwise as ClockHistory,
  Clock,
  Coin,
  Coins,
  Copy,
  Desktop,
  DotsThree,
  DownloadSimple,
  Eye,
  EyeSlash,
  Gear,
  GithubLogo,
  Globe,
  HandCoins,
  Hammer,
  House,
  Info,
  Key,
  LockKey,
  Lock,
  MagnifyingGlass,
  Money,
  Moon,
  PencilSimple,
  Percent,
  Plant,
  ChartPie,
  Plus,
  Question,
  ShareNetwork,
  Shield,
  ShieldCheck,
  Sparkle,
  Spinner as PhSpinner,
  Star,
  Sun,
  Tag,
  Trash,
  Tray,
  TrendUp,
  Usb as UsbIcon,
  Vault,
  Wallet,
  Warning,
  X,
  XCircle,
  XLogo,
} from '@phosphor-icons/react';

import type { IconProps } from '@phosphor-icons/react';
export type { IconProps };

// Алиасы — старые lucide-имена → Phosphor-эквиваленты.
export {
  // Нав / arrows
  House as Home,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ArrowsLeftRight as ArrowLeftRight,
  ArrowsClockwise as RefreshCw,
  ArrowSquareOut as ExternalLink,
  CaretDown as ChevronDown,
  CaretRight as ChevronRight,
  // Discovery / system
  MagnifyingGlass as Search,
  Gear as Settings,
  DotsThree as MoreHorizontal,
  Question as HelpCircle,
  Hammer as Construction,
  // Wallet / finance
  Wallet,
  Coins,
  Coin,
  Money as Banknote,
  ChartPie as PieChart,
  TrendUp as TrendingUp,
  Sparkle as Sparkles,
  Shield,
  ShieldCheck,
  Tag,
  Clock,
  ClockHistory as History,
  // Staking-specific
  Vault,
  HandCoins,
  ChartLineUp,
  Percent,
  Plant,
  CalendarBlank,
  ArrowLineDown,
  // Social
  XLogo,
  GithubLogo,
  Globe,
  Star,
  // Token / data ops
  Plus,
  PencilSimple as Pencil,
  Trash as Trash2,
  Copy,
  ShareNetwork as Share2,
  DownloadSimple as Download,
  Check,
  // Status
  CheckCircle as CheckCircle2,
  XCircle,
  Warning as AlertTriangle,
  Info,
  Tray as Inbox,
  // Theme switcher
  Sun,
  Moon,
  Desktop as Monitor,
  // Security
  Lock,
  LockKey as LockKeyhole,
  Eye,
  EyeSlash as EyeOff,
  Key as KeyRound,
  // Hardware
  UsbIcon as Usb,
  AddressBook,
  // Misc
  X,
  PhSpinner as Loader2,
};
