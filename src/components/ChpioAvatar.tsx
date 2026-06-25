import { useRef, useEffect, memo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-web';
import chpioAvatar from '../assets/chpio-avatar.json';

export type AvatarMood = 'idle' | 'thinking' | 'responding' | 'celebrating' | 'welcoming';

interface ChpioAvatarProps {
  animated?: boolean;
  mood?: AvatarMood;
  className?: string;
}

const MOOD_CONFIG: Record<AvatarMood, { startFrame: number; endFrame: number; speed: number; loop: boolean }> = {
  idle: { startFrame: 0, endFrame: 0, speed: 0, loop: false },
  thinking: { startFrame: 0, endFrame: 60, speed: 0.5, loop: true },
  responding: { startFrame: 0, endFrame: 231, speed: 1, loop: true },
  celebrating: { startFrame: 71, endFrame: 161, speed: 1, loop: false },
  welcoming: { startFrame: 0, endFrame: 60, speed: 1, loop: false },
};

export const ChpioAvatar = memo(function ChpioAvatar({ animated: _animated = false, mood = 'idle', className = '' }: ChpioAvatarProps) {
  const dotLottieRef = useRef<DotLottie | null>(null);
  const config = MOOD_CONFIG[mood];

  useEffect(() => {
    const lottie = dotLottieRef.current;
    if (!lottie) return;

    const handleLoad = () => {
      if (mood === 'idle') {
        lottie.setFrame(0);
        lottie.pause();
      } else {
        lottie.setFrame(config.startFrame);
        lottie.setSpeed(config.speed);
        if (config.loop) {
          lottie.play();
        } else {
          // Play to end frame then pause
          lottie.play();
          const checkFrame = () => {
            const currentFrame = lottie.currentFrame || 0;
            if (currentFrame >= config.endFrame) {
              lottie.pause();
              return;
            }
            requestAnimationFrame(checkFrame);
          };
          requestAnimationFrame(checkFrame);
        }
      }
    };

    lottie.addEventListener('load', handleLoad);
    // If already loaded
    if (lottie.isLoaded) {
      handleLoad();
    }

    return () => {
      lottie.removeEventListener('load', handleLoad);
    };
  }, [mood, config]);

  return (
    <div className={className}>
      <DotLottieReact
        data={chpioAvatar}
        autoplay={false}
        loop={false}
        dotLottieRefCallback={(ref) => {
          dotLottieRef.current = ref;
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});
