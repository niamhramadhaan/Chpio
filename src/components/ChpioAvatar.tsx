import { useRef, memo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-web';
import chpioAvatar from '../assets/chpio-avatar.json';

interface ChpioAvatarProps {
  animated?: boolean;
  className?: string;
}

export const ChpioAvatar = memo(function ChpioAvatar({ animated = false, className = '' }: ChpioAvatarProps) {
  const dotLottieRef = useRef<DotLottie | null>(null);

  if (!animated) {
    return (
      <div className={className}>
        <DotLottieReact
          data={chpioAvatar}
          autoplay={false}
          loop={false}
          dotLottieRefCallback={(ref) => {
            dotLottieRef.current = ref;
            if (ref) {
              ref.addEventListener('load', () => {
                ref.setFrame(0);
                ref.pause();
              });
            }
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <DotLottieReact
        data={chpioAvatar}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});
