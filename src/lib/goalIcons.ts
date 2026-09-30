import {
  Briefcase,
  CircleGauge,
  Dumbbell,
  Laptop,
  MessageCircle,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { PrimaryGoal } from './onboardingContent'

/** The mark for each goal, where onboarding and the LaunchPad both draw it. */
export const GOAL_ICONS: Record<PrimaryGoal['icon'], typeof Briefcase> = {
  briefcase: Briefcase,
  rocket: Rocket,
  sparkles: Sparkles,
  'trending-up': TrendingUp,
  laptop: Laptop,
  users: Users,
  'message-circle': MessageCircle,
  dumbbell: Dumbbell,
  gauge: CircleGauge,
}
