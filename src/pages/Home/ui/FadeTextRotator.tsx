import { useState, useEffect } from 'react';
import FadeTransition from '@/shared/ui/FadeTransition/FadeTransition';
import ASCIIText from '@/shared/ui/ASCIIText/ASCIIText';

export const FadeTextRotator = ({ 
    texts = ["キュレェ", "Kyure_A"], 
    interval = 5000,
    fadeDuration = 300,
    asciiFontSize = 12,
    textFontSize = 20
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
      const timer = setInterval(() => {
          setActiveIndex((prevIndex) => (prevIndex + 1) % texts.length);
      }, interval);

      return () => clearInterval(timer);
  }, [interval, texts.length]);
  
  return (
    <FadeTransition 
        activeIndex={activeIndex} 
        duration={fadeDuration}
        blur={false}
    >
      {texts.map((text, index) => (
          <ASCIIText
              key={index}
              text={text}
              asciiFontSize={asciiFontSize}
              textFontSize={textFontSize}
          />
      ))}
    </FadeTransition>
  );
};

export default FadeTextRotator;
