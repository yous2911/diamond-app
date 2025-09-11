import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSound } from '../hooks/useSound';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MascotMobile3DProps {
  mascotType?: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  emotion?: 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy';
}

const MascotMobile3D: React.FC<MascotMobile3DProps> = ({ mascotType = 'cat', emotion: initialEmotion = 'happy' }) => {
  const [emotion, setEmotion] = React.useState(initialEmotion);
  const breathing = useSharedValue(1);
  const tapAnimation = useSharedValue(1);

  const playTapSound = useSound(require('../../assets/sounds/tap.mp3'));
  const playCelebrateSound = useSound(require('../../assets/sounds/celebrate.mp3'));
  const playThinkSound = useSound(require('../../assets/sounds/think.mp3'));
  const playSleepySound = useSound(require('../../assets/sounds/sleepy.mp3'));

  const tapGesture = Gesture.Tap().onEnd(() => {
    tapAnimation.value = withTiming(1.2, { duration: 100 }, () => {
        tapAnimation.value = withTiming(1);
    });
    runOnJS(setEmotion)('happy');
    runOnJS(playTapSound)();
  });

  React.useEffect(() => {
    switch (emotion) {
        case 'celebrating':
            playCelebrateSound();
            break;
        case 'thinking':
            playThinkSound();
            break;
        case 'sleepy':
            playSleepySound();
            break;
    }
  }, [emotion, playCelebrateSound, playThinkSound, playSleepySound]);

  React.useEffect(() => {
    breathing.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [breathing]);

  const animatedStyle = useAnimatedStyle(() => {
    let rotation = 0;
    if (emotion === 'thinking') {
      rotation = 15;
    } else if (emotion === 'sleepy') {
        rotation = -15;
    }
    return {
      transform: [
        { scale: breathing.value * tapAnimation.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const mascotColors = {
    dragon: '#FF6B35',
    fairy: '#FF69B4',
    robot: '#4ECDC4',
    cat: '#45B7D1',
    owl: '#96CEB4',
  };

  const color = mascotColors[mascotType];

  return (
    <GestureDetector gesture={tapGesture}>
<View
    style={{ alignItems: 'center', justifyContent: 'center' }}
    accessible={true}
    accessibilityLabel={`Mascot: ${mascotType}, emotion: ${emotion}`}
    accessibilityHint="Tap to interact with the mascot"
>
        <AnimatedG style={animatedStyle}>
            <Svg height="200" width="200" viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Eyes emotion={emotion} />
            <Mouth emotion={emotion} />
            {emotion === 'celebrating' && <ParticleEffects />}
            </Svg>
        </AnimatedG>
        </View>
    </GestureDetector>
  );
};

const Particle = () => {
    const x = Math.random() * 100;
    const y = useSharedValue(-10);

    React.useEffect(() => {
        y.value = withTiming(110, { duration: 2000, easing: Easing.linear });
    }, [y]);

    const animatedProps = useAnimatedStyle(() => {
        return {
            cy: y.value,
        };
    });

    return (
        <AnimatedCircle cx={x} r="2" fill="yellow" animatedProps={animatedProps} />
    );
}

const ParticleEffects = () => {
    return (
        <G>
            {Array.from({ length: 50 }).map((_, i) => (
                <Particle key={i} />
            ))}
        </G>
    );
}

const Eyes = ({ emotion }: { emotion: MascotMobile3DProps['emotion'] }) => {
  switch (emotion) {
    case 'excited':
      return (
        <>
          <Circle cx="35" cy="40" r="7" fill="white" />
          <Circle cx="65" cy="40" r="7" fill="white" />
          <Circle cx="35" cy="40" r="3" fill="black" />
          <Circle cx="65" cy="40" r="3" fill="black" />
        </>
      );
    case 'thinking':
        return (
            <>
                <Path d="M30 40 H40" stroke="white" strokeWidth="2" />
                <Path d="M60 40 H70" stroke="white" strokeWidth="2" />
            </>
        );
    case 'celebrating':
        return (
            <>
                <Path d="M35 35 L40 45 L30 45 Z" fill="yellow" />
                <Path d="M65 35 L70 45 L60 45 Z" fill="yellow" />
            </>
        )
    case 'sleepy':
        return (
            <>
                <Path d="M30 42 C 35 35, 40 35, 45 42" stroke="white" strokeWidth="2" fill="none" />
                <Path d="M55 42 C 60 35, 65 35, 70 42" stroke="white" strokeWidth="2" fill="none" />
            </>
        )
    case 'happy':
    default:
      return (
        <>
          <Circle cx="35" cy="40" r="5" fill="white" />
          <Circle cx="65" cy="40" r="5" fill="white" />
          <Circle cx="35" cy="40" r="2" fill="black" />
          <Circle cx="65" cy="40" r="2" fill="black" />
        </>
      );
  }
};

const Mouth = ({ emotion }: { emotion: MascotMobile3DProps['emotion'] }) => {
    switch (emotion) {
        case 'excited':
            return <Circle cx="50" cy="65" r="15" fill="white" />;
        case 'thinking':
            return <Path d="M40 65 H60" stroke="white" strokeWidth="2" />;
        case 'celebrating':
            return <Circle cx="50" cy="65" r="12" fill="white" />;
        case 'sleepy':
            return <Circle cx="50" cy="65" r="3" fill="white" />;
        case 'happy':
        default:
            return <Path d="M40 60 Q 50 70 60 60" stroke="white" strokeWidth="2" fill="none"/>;
    }
};

export default MascotMobile3D;
