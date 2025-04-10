import { useState, useEffect, Children, isValidElement } from 'react';

const FadeTransition = ({
    children,
    activeIndex = 0,
    duration = 500,
    easing = 'ease-in-out',
    blur = false,
    className = ''
}) => {
    const [currentIndex, setCurrentIndex] = useState(activeIndex);
    const [transitioning, setTransitioning] = useState(false);
    const [currentOpacity, setCurrentOpacity] = useState(1);
    const [nextChild, setNextChild] = useState(null);
    
    const childrenArray = Children.toArray(children).filter(isValidElement);
    
    useEffect(() => {
        if (activeIndex !== currentIndex) {
            // Start fade out
            setTransitioning(true);
            setCurrentOpacity(0);
            
            // Set the next child to be shown
            const timer = setTimeout(() => {
                setCurrentIndex(activeIndex);
                setNextChild(childrenArray[activeIndex]);
                
                // Start fade in
                setTimeout(() => {
                    setCurrentOpacity(1);
                    
                    // End transition
                    setTimeout(() => {
                        setTransitioning(false);
                        setNextChild(null);
                    }, duration);
                }, 50); // Small delay to ensure DOM updates
            }, duration);
            
            return () => clearTimeout(timer);
        }
    }, [activeIndex, childrenArray, currentIndex, duration]);
    
    const currentChild = childrenArray[currentIndex];
    const displayChild = transitioning && nextChild ? nextChild : currentChild;
    
    return (
        <div className={className}>
          <div
              style={{
                  opacity: currentOpacity,
                  transition: `opacity ${duration}ms ${easing}, filter ${duration}ms ${easing}`,
                  filter: blur ? (currentOpacity === 1 ? 'blur(0px)' : 'blur(10px)') : 'none',
              }}
          >
            {displayChild}
          </div>
        </div>
    );
};

export default FadeTransition;
