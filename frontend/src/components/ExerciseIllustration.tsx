import React from 'react';

interface ExerciseIllustrationProps {
  type: string;
  className?: string;
}

export const ExerciseIllustration: React.FC<ExerciseIllustrationProps> = ({
  type,
  className = 'w-full h-36',
}) => {
  // Base SVG wrapper with stylized dark tech grid backdrop
  const renderBackdrop = () => (
    <>
      <defs>
        <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </pattern>
        <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#00f59b" />
        </linearGradient>
        <linearGradient id="bodyLine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#00f59b" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="#0a0f17" rx="12" />
      <rect width="100%" height="100%" fill="url(#grid)" rx="12" />
      {/* Floor line */}
      <line x1="10" y1="110" x2="190" y2="110" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
    </>
  );

  switch (type) {
    // -------------------------------------------------------------
    // SQUATS
    // -------------------------------------------------------------
    case 'chair_squat':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Chair */}
          <rect x="55" y="65" width="30" height="45" fill="none" stroke="#64748b" strokeWidth="2.5" rx="2" />
          <line x1="55" y1="65" x2="55" y2="35" stroke="#64748b" strokeWidth="2.5" />
          {/* Person seated/hovering above chair */}
          <circle cx="95" cy="30" r="8" fill="#38bdf8" />
          <line x1="95" y1="38" x2="88" y2="65" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Thighs parallel */}
          <line x1="88" y1="65" x2="120" y2="67" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Shins down */}
          <line x1="120" y1="67" x2="122" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Arms reached forward for balance */}
          <line x1="93" y1="45" x2="135" y2="45" stroke="#00f59b" strokeWidth="3" strokeLinecap="round" />
          {/* Angle arc */}
          <path d="M 108 66 A 12 12 0 0 0 120 78" fill="none" stroke="#f59e0b" strokeWidth="2" />
        </svg>
      );

    case 'bodyweight_squat':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Head */}
          <circle cx="90" cy="28" r="8" fill="#38bdf8" />
          {/* Torso upright */}
          <line x1="90" y1="36" x2="78" y2="68" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Thighs reaching 90° parallel */}
          <line x1="78" y1="68" x2="118" y2="70" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Shins */}
          <line x1="118" y1="70" x2="118" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Hands out in front */}
          <line x1="88" y1="44" x2="130" y2="44" stroke="#00f59b" strokeWidth="3" strokeLinecap="round" />
          {/* Hip depth guide line */}
          <line x1="60" y1="70" x2="135" y2="70" stroke="rgba(0,245,155,0.3)" strokeDasharray="3 3" strokeWidth="1.5" />
        </svg>
      );

    case 'goblet_squat':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Head */}
          <circle cx="95" cy="28" r="8" fill="#38bdf8" />
          {/* Torso */}
          <line x1="95" y1="36" x2="82" y2="68" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Thighs */}
          <line x1="82" y1="68" x2="122" y2="70" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Shins */}
          <line x1="122" y1="70" x2="122" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Arms holding dumbbell at chest */}
          <line x1="93" y1="44" x2="108" y2="52" stroke="#00f59b" strokeWidth="3" />
          {/* Dumbbell icon held at chest */}
          <rect x="105" y="44" width="12" height="16" fill="#f59e0b" rx="2" />
          <line x1="102" y1="52" x2="120" y2="52" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    // -------------------------------------------------------------
    // PUSH-UPS
    // -------------------------------------------------------------
    case 'wall_pushup':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Wall */}
          <line x1="160" y1="15" x2="160" y2="110" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          {/* Head */}
          <circle cx="132" cy="35" r="7" fill="#38bdf8" />
          {/* Incline Body line */}
          <line x1="130" y1="40" x2="85" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Arms pressing against wall */}
          <line x1="128" y1="50" x2="148" y2="58" stroke="#00f59b" strokeWidth="3" />
          <line x1="148" y1="58" x2="160" y2="50" stroke="#00f59b" strokeWidth="3" />
        </svg>
      );

    case 'knee_pushup':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Knees on ground */}
          <circle cx="65" cy="108" r="4" fill="#f59e0b" />
          {/* Feet slightly elevated behind */}
          <line x1="65" y1="108" x2="45" y2="95" stroke="url(#neonGlow)" strokeWidth="3" strokeLinecap="round" />
          {/* Thigh & Torso in straight line */}
          <line x1="65" y1="108" x2="135" y2="75" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Head */}
          <circle cx="145" cy="70" r="7" fill="#38bdf8" />
          {/* Arms down to floor */}
          <line x1="130" y1="78" x2="122" y2="95" stroke="#00f59b" strokeWidth="3" />
          <line x1="122" y1="95" x2="135" y2="110" stroke="#00f59b" strokeWidth="3" />
        </svg>
      );

    case 'standard_pushup':
    case 'diamond_pushup':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Rigid plank line from heels to head */}
          <line x1="40" y1="105" x2="145" y2="72" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Head */}
          <circle cx="155" cy="68" r="7" fill="#38bdf8" />
          {/* Arms at 90° elbow depth */}
          <line x1="138" y1="74" x2="130" y2="92" stroke="#00f59b" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="130" y1="92" x2="145" y2="110" stroke="#00f59b" strokeWidth="3.5" strokeLinecap="round" />
          {/* Elbow 90° indicator */}
          <circle cx="130" cy="92" r="3.5" fill="#f59e0b" />
          {type === 'diamond_pushup' && (
            <polygon points="145,108 150,113 145,118 140,113" fill="#f59e0b" />
          )}
        </svg>
      );

    // -------------------------------------------------------------
    // LUNGES
    // -------------------------------------------------------------
    case 'supported_lunge':
    case 'reverse_lunge':
    case 'dumbbell_lunge':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {type === 'supported_lunge' && (
            <line x1="150" y1="20" x2="150" y2="110" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          )}
          {/* Head */}
          <circle cx="95" cy="32" r="7" fill="#38bdf8" />
          {/* Torso vertical */}
          <line x1="95" y1="39" x2="95" y2="70" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Front Leg (90°) */}
          <line x1="95" y1="70" x2="125" y2="70" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="125" y1="70" x2="125" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Back Leg (90° down) */}
          <line x1="95" y1="70" x2="65" y2="92" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="65" y1="92" x2="65" y2="108" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Arms / Dumbbells */}
          {type === 'dumbbell_lunge' ? (
            <>
              <line x1="95" y1="46" x2="95" y2="75" stroke="#00f59b" strokeWidth="3" />
              <rect x="91" y="75" width="8" height="14" fill="#f59e0b" rx="2" />
            </>
          ) : type === 'supported_lunge' ? (
            <line x1="95" y1="46" x2="150" y2="46" stroke="#00f59b" strokeWidth="3" />
          ) : (
            <line x1="95" y1="46" x2="110" y2="55" stroke="#00f59b" strokeWidth="3" />
          )}
        </svg>
      );

    // -------------------------------------------------------------
    // BICEP CURLS
    // -------------------------------------------------------------
    case 'band_curl':
    case 'dumbbell_curl':
    case 'alternating_curl':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Head */}
          <circle cx="95" cy="26" r="7" fill="#38bdf8" />
          {/* Torso & Legs */}
          <line x1="95" y1="33" x2="95" y2="68" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="95" y1="68" x2="90" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="95" y1="68" x2="102" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Upper Arm pinned to side */}
          <line x1="95" y1="40" x2="102" y2="58" stroke="url(#neonGlow)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Forearm curled upward */}
          <line x1="102" y1="58" x2="118" y2="42" stroke="url(#neonGlow)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Elbow pivot indicator */}
          <circle cx="102" cy="58" r="3" fill="#00f59b" />
          {/* Weight or Band */}
          {type === 'band_curl' ? (
            <path d="M 90 110 Q 110 90 118 42" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 2" />
          ) : (
            <circle cx="120" cy="40" r="5" fill="#f59e0b" />
          )}
        </svg>
      );

    // -------------------------------------------------------------
    // PLANKS
    // -------------------------------------------------------------
    case 'knee_plank':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Forearms on mat */}
          <line x1="145" y1="95" x2="145" y2="110" stroke="#00f59b" strokeWidth="4" strokeLinecap="round" />
          <line x1="145" y1="110" x2="160" y2="110" stroke="#00f59b" strokeWidth="4" strokeLinecap="round" />
          {/* Straight line from head to knees */}
          <circle cx="155" cy="85" r="7" fill="#38bdf8" />
          <line x1="145" y1="95" x2="70" y2="108" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Feet back */}
          <line x1="70" y1="108" x2="48" y2="96" stroke="url(#neonGlow)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="70" cy="108" r="4" fill="#f59e0b" />
        </svg>
      );

    case 'standard_plank':
    case 'shoulder_tap_plank':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Forearms or hands */}
          {type === 'shoulder_tap_plank' ? (
            <>
              {/* Supporting single arm */}
              <line x1="142" y1="78" x2="142" y2="110" stroke="#00f59b" strokeWidth="4" strokeLinecap="round" />
              {/* Arm reaching across to shoulder */}
              <line x1="142" y1="78" x2="135" y2="78" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <line x1="145" y1="92" x2="145" y2="110" stroke="#00f59b" strokeWidth="4" strokeLinecap="round" />
              <line x1="145" y1="110" x2="160" y2="110" stroke="#00f59b" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          {/* Straight horizontal line */}
          <circle cx="155" cy="80" r="7" fill="#38bdf8" />
          <line x1="145" y1="88" x2="45" y2="105" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Alignment guide line */}
          <line x1="40" y1="96" x2="160" y2="96" stroke="rgba(0,245,155,0.25)" strokeDasharray="3 3" strokeWidth="1" />
        </svg>
      );

    // -------------------------------------------------------------
    // SHOULDER PRESS
    // -------------------------------------------------------------
    case 'band_press':
    case 'dumbbell_press':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Head */}
          <circle cx="100" cy="40" r="7" fill="#38bdf8" />
          {/* Torso & Legs */}
          <line x1="100" y1="47" x2="100" y2="76" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="100" y1="76" x2="90" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="100" y1="76" x2="110" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Arms locked out overhead */}
          <line x1="100" y1="52" x2="80" y2="20" stroke="url(#neonGlow)" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="100" y1="52" x2="120" y2="20" stroke="url(#neonGlow)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Dumbbells or Band */}
          {type === 'band_press' ? (
            <path d="M 90 110 L 80 20 M 110 110 L 120 20" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
          ) : (
            <>
              <circle cx="80" cy="18" r="4.5" fill="#f59e0b" />
              <circle cx="120" cy="18" r="4.5" fill="#f59e0b" />
            </>
          )}
        </svg>
      );

    // -------------------------------------------------------------
    // CORE / SIT-UPS
    // -------------------------------------------------------------
    case 'floor_crunch':
    case 'situp':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Knees bent */}
          <line x1="130" y1="110" x2="115" y2="85" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="115" y1="85" x2="85" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Torso curling off mat */}
          <line x1="85" y1="110" x2="52" y2="80" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Head */}
          <circle cx="45" cy="74" r="7" fill="#38bdf8" />
          {/* Arms crossed on chest */}
          <line x1="56" y1="83" x2="70" y2="92" stroke="#00f59b" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    // -------------------------------------------------------------
    // JUMPING JACKS
    // -------------------------------------------------------------
    case 'step_jack':
    case 'jumping_jack':
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Head */}
          <circle cx="100" cy="26" r="7" fill="#38bdf8" />
          {/* Torso */}
          <line x1="100" y1="33" x2="100" y2="70" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Arms spread high overhead */}
          <line x1="100" y1="42" x2="65" y2="18" stroke="url(#neonGlow)" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="100" y1="42" x2="135" y2="18" stroke="url(#neonGlow)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Legs wide */}
          <line x1="100" y1="70" x2="68" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="100" y1="70" x2="132" y2="110" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    // -------------------------------------------------------------
    // REST DAY & MOBILITY
    // -------------------------------------------------------------
    case 'rest_day':
    case 'mobility_stretch':
    default:
      return (
        <svg viewBox="0 0 200 130" className={className}>
          {renderBackdrop()}
          {/* Calming restorative figure */}
          <circle cx="100" cy="42" r="7" fill="#38bdf8" />
          {/* Seated cross-legged posture */}
          <line x1="100" y1="49" x2="100" y2="85" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="100" y1="85" x2="65" y2="105" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          <line x1="100" y1="85" x2="135" y2="105" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" />
          {/* Arms resting softly on knees */}
          <line x1="100" y1="60" x2="75" y2="95" stroke="#00f59b" strokeWidth="3" strokeLinecap="round" />
          <line x1="100" y1="60" x2="125" y2="95" stroke="#00f59b" strokeWidth="3" strokeLinecap="round" />
          {/* Gentle breath pulse glow */}
          <circle cx="100" cy="70" r="18" fill="none" stroke="#00f59b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        </svg>
      );
  }
};
