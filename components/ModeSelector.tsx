import Link from 'next/link';
import { Crosshair, Move, Focus, Zap, Orbit, type LucideIcon } from 'lucide-react';

interface ModeConfig {
  href: string;
  name: string;
  description: string;
  icon: LucideIcon;
  difficulty: string;
  tags: string[];
  targets: string;
  duration: string;
  classes: {
    iconBg: string;
    iconText: string;
    hoverBorder: string;
    hoverShadow: string;
    nameHover: string;
    cornerGradient: string;
    glowBg: string;
    diffColor: string;
  };
}

const MODES: ModeConfig[] = [
  {
    href: '/flick',
    name: 'Micro-Flick',
    description: 'Hit appearing targets as fast as possible. Train snap-aim and target acquisition speed.',
    icon: Crosshair,
    difficulty: 'Medium',
    tags: ['Precision', 'Speed'],
    targets: '5 Targets',
    duration: '60s',
    classes: {
      iconBg: 'bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20',
      iconText: 'text-red-500',
      hoverBorder: 'hover:border-red-500/50',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(255,62,62,0.15)]',
      nameHover: 'group-hover:text-red-400',
      cornerGradient: 'from-red-500/15',
      glowBg: 'bg-[radial-gradient(circle_at_center,rgba(255,62,62,0.08)_0%,transparent_70%)]',
      diffColor: 'text-yellow-400',
    },
  },
  {
    href: '/tracking',
    name: 'Smooth Tracking',
    description: 'Keep your crosshair locked on a moving target. Build consistency and control.',
    icon: Move,
    difficulty: 'Hard',
    tags: ['Tracking', 'Control'],
    targets: '1 Target',
    duration: '60s',
    classes: {
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      iconText: 'text-cyan-400',
      hoverBorder: 'hover:border-cyan-500/50',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(0,210,255,0.15)]',
      nameHover: 'group-hover:text-cyan-400',
      cornerGradient: 'from-cyan-500/15',
      glowBg: 'bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.08)_0%,transparent_70%)]',
      diffColor: 'text-red-400',
    },
  },
  {
    href: '/micro-adjustment',
    name: 'Micro Adjustment',
    description: 'Tiny target, tight zone, slow drift. Pure precision and patience under pressure.',
    icon: Focus,
    difficulty: 'Hard',
    tags: ['Precision', 'Patience'],
    targets: '1 Target',
    duration: '60s',
    classes: {
      iconBg: 'bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/20',
      iconText: 'text-purple-400',
      hoverBorder: 'hover:border-purple-500/50',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
      nameHover: 'group-hover:text-purple-400',
      cornerGradient: 'from-purple-500/15',
      glowBg: 'bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)]',
      diffColor: 'text-red-400',
    },
  },
  {
    href: '/pasu-track',
    name: 'Pasu Track',
    description: 'Reactive evasive target that sharply changes direction. Train your reactive tracking.',
    icon: Orbit,
    difficulty: 'Hard',
    tags: ['Reactive', 'Tracking'],
    targets: '1 Target',
    duration: '60s',
    classes: {
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
      iconText: 'text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/50',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      nameHover: 'group-hover:text-emerald-400',
      cornerGradient: 'from-emerald-500/15',
      glowBg: 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)]',
      diffColor: 'text-red-400',
    },
  },
  {
    href: '/reaction',
    name: 'Reaction Time',
    description: 'Human Benchmark style reflex training. Measure and improve your reaction speed.',
    icon: Zap,
    difficulty: 'Easy',
    tags: ['Reaction', 'Reflex'],
    targets: 'Custom',
    duration: 'Summary',
    classes: {
      iconBg: 'bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20',
      iconText: 'text-orange-400',
      hoverBorder: 'hover:border-orange-500/50',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(255,140,0,0.15)]',
      nameHover: 'group-hover:text-orange-400',
      cornerGradient: 'from-orange-500/15',
      glowBg: 'bg-[radial-gradient(circle_at_center,rgba(255,140,0,0.08)_0%,transparent_70%)]',
      diffColor: 'text-green-400',
    },
  },
];

export default function ModeSelector() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const c = mode.classes;
        return (
          <Link
            key={mode.href}
            href={mode.href}
            className={`group relative block bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-2 border-white/[0.08] rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${c.hoverBorder} ${c.hoverShadow}`}
          >
            {/* Corner accent */}
            <div
              className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${c.cornerGradient} to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-300`}
              style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
            />

            {/* Hover glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${c.glowBg}`} />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon + Difficulty */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${c.iconBg}`}>
                  <Icon className={`w-6 h-6 ${c.iconText}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04] ${c.diffColor}`}>
                  {mode.difficulty}
                </span>
              </div>

              {/* Name */}
              <h3 className={`text-lg font-bold uppercase tracking-wide text-white mb-2 transition-colors ${c.nameHover}`}>
                {mode.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-white/45 leading-relaxed mb-4">
                {mode.description}
              </p>

              {/* Tags + Meta */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {mode.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.06] text-white/35">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 text-[10px] text-white/25 uppercase tracking-widest font-semibold">
                  <span>{mode.targets}</span>
                  <span>{mode.duration}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
