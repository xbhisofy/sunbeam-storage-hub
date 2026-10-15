import { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, Animated } from "react-native";

// Native-driver entrance motion; disabled for the system Reduce Motion setting.
export function Motion({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let live = true;
    let animation: Animated.CompositeAnimation | undefined;
    const show = (reduced: boolean) => {
      if (!live) return;
      animation?.stop();
      if (reduced) { progress.setValue(1); return; }
      progress.setValue(0);
      animation = Animated.timing(progress, { toValue: 1, duration: 320, delay, useNativeDriver: true });
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(show).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", show);
    return () => { live = false; animation?.stop(); subscription.remove(); };
  }, [delay, progress]);
  return <Animated.View style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>{children}</Animated.View>;
}