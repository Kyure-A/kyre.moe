import {
  Children,
  isValidElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type FadeTransitionProps = {
  children: ReactNode;
  activeIndex?: number;
  duration?: number;
  easing?: string;
  blur?: boolean;
  className?: string;
};

const FadeTransition = ({
  children,
  activeIndex = 0,
  duration = 500,
  easing = "ease-in-out",
  blur = false,
  className = "",
}: FadeTransitionProps) => {
  // 全 children を常時 mount し、opacity の切替だけで順次フェードを再現する
  const [currentIndex, setCurrentIndex] = useState(activeIndex);
  const [visible, setVisible] = useState(true);

  const childrenArray = useMemo(
    () => Children.toArray(children).filter(isValidElement),
    [children],
  );

  useEffect(() => {
    if (activeIndex !== currentIndex) {
      // フェードアウト開始
      setVisible(false);

      // フェードアウト完了後に表示対象を差し替え
      const timer = setTimeout(() => {
        setCurrentIndex(activeIndex);

        // 少し置いてフェードイン開始
        setTimeout(() => {
          setVisible(true);
        }, 50);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [activeIndex, currentIndex, duration]);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => {
        const isCurrent = index === currentIndex;
        const isShown = isCurrent && visible;
        return (
          <div
            key={child.key ?? index}
            aria-hidden={isCurrent ? undefined : true}
            style={{
              opacity: isShown ? 1 : 0,
              pointerEvents: isCurrent ? undefined : "none",
              transition: `opacity ${duration}ms ${easing}, filter ${duration}ms ${easing}`,
              filter: blur ? (isShown ? "blur(0px)" : "blur(10px)") : "none",
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default FadeTransition;
