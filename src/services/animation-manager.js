class AnimationCoordinator {
  /**
   * Calculates dynamic animation transition durations based on playback speed (0.25x - 8x).
   */
  getDuration(baseSeconds, speed) {
    return Math.max(0.05, baseSeconds / speed);
  }

  /**
   * Framer Motion Transition config.
   */
  getTransition(speed, preset = "smooth") {
    const duration = this.getDuration(0.45, speed);
    switch (preset) {
      case "spring":
        return {
          type: "spring",
          stiffness: 120 * speed,
          damping: 14,
          mass: 0.8,
        };
      case "bounce":
        return {
          type: "spring",
          bounce: 0.4,
          duration: duration,
        };
      case "smooth":
      default:
        return {
          type: "tween",
          ease: "easeInOut",
          duration: duration,
        };
    }
  }

  /**
   * Dynamic background glow keyframes for modified variables.
   */
  getGlowKeyframes(color = "rgba(34, 197, 94, 0.4)") {
    return {
      boxShadow: [`0 0 0px ${color}`, `0 0 12px ${color}`, `0 0 0px ${color}`],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    };
  }

  /**
   * Animation presets for Canvas render nodes.
   */
  getNodeVariants(speed) {
    const duration = this.getDuration(0.35, speed);
    return {
      initial: {
        opacity: 0,
        scale: 0.6,
        y: 10,
      },
      animate: {
        opacity: 1,
        scale: 1.0,
        y: 0,
        transition: { duration, ease: "easeOut" },
      },
      exit: {
        opacity: 0,
        scale: 0.6,
        y: -10,
        transition: { duration, ease: "easeIn" },
      },
      modified: {
        scale: [1, 1.12, 1],
        transition: {
          duration: this.getDuration(0.5, speed),
          ease: "easeInOut",
        },
      },
    };
  }
}

export const animationManager = new AnimationCoordinator();
