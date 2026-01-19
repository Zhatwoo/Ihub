"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useContext,
} from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { cn } from "../../../lib/utils";

/* -------------------------
   Utility: wrap (unchanged)
   ------------------------- */
export const wrap = (min, max, v) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

/* -----------------------------------
   Context to share velocity between columns
   ----------------------------------- */
const ThreeDScrollTriggerContext = React.createContext(null);

/* --------------------------
   Container that provides velocity
   -------------------------- */
export function ThreeDScrollTriggerContainer({
  children,
  className,
  ...props
}) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  // map to a bounded factor [-5...5] with smoother behaviour
  const velocityFactor = useTransform(smoothVelocity, (v) => {
    const sign = v < 0 ? -1 : 1;
    const magnitude = Math.min(5, (Math.abs(v) / 1000) * 5);
    return sign * magnitude;
  });

  return (
    <ThreeDScrollTriggerContext.Provider value={velocityFactor}>
      <div className={cn("relative w-full", className)} {...props}>
        {children}
      </div>
    </ThreeDScrollTriggerContext.Provider>
  );
}

/* --------------------------
   Column entry that chooses shared or local velocity
   -------------------------- */
export function ThreeDScrollTriggerColumn(props) {
  const sharedVelocityFactor = useContext(ThreeDScrollTriggerContext);
  if (sharedVelocityFactor) {
    return (
      <ThreeDScrollTriggerColumnImpl
        {...props}
        velocityFactor={sharedVelocityFactor}
      />
    );
  }
  return <ThreeDScrollTriggerColumnLocal {...props} />;
}

/* --------------------------
   Impl with velocity passed in
   -------------------------- */
function ThreeDScrollTriggerColumnImpl({
  children,
  baseVelocity = 5,
  direction = 1,
  className,
  velocityFactor,
  ...props
}) {
  const containerRef = useRef(null);
  const [numCopies, setNumCopies] = useState(3);
  const y = useMotionValue(0);

  const prevTimeRef = useRef(null);
  const unitHeightRef = useRef(0);
  const baseYRef = useRef(0);

  // Memoized children
  const childrenArray = useMemo(() => React.Children.toArray(children), [children]);

  const BlockContent = useMemo(() => {
    return (
      <div className="flex flex-col shrink-0" style={{ contain: "paint" }}>
        {childrenArray}
      </div>
    );
  }, [childrenArray]);

  // Measure block height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const block = container.querySelector(".threed-scroll-trigger-block");
    if (block) {
      unitHeightRef.current = block.scrollHeight;
      // keep just enough to cover the viewport + 1
      const containerHeight = container.offsetHeight;
      const needed = Math.max(3, Math.ceil(containerHeight / unitHeightRef.current) + 2);
      setNumCopies(needed);
    }
  }, [childrenArray]);

  // Animation loop
  useAnimationFrame((time) => {
    if (prevTimeRef.current == null) prevTimeRef.current = time;
    const dt = Math.max(0, (time - prevTimeRef.current) / 1000);
    prevTimeRef.current = time;

    const unitHeight = unitHeightRef.current;
    if (unitHeight <= 0) return;

    const velocity = velocityFactor.get();
    const speedMultiplier = Math.min(5, Math.abs(velocity));
    const scrollDirection = velocity >= 0 ? 1 : -1;
    const currentDirection = direction * scrollDirection;

    const pixelsPerSecond = (unitHeight * baseVelocity) / 100;
    const moveBy = currentDirection * pixelsPerSecond * (1 + speedMultiplier) * dt;

    const newY = baseYRef.current + moveBy;
    
    // ✅ FIXED: Proper wrapping in both directions
    // When moving down (positive newY), wrap back
    if (newY >= unitHeight) {
      baseYRef.current = newY % unitHeight;
    } 
    // When moving up (negative newY), wrap forward
    else if (newY <= 0) {
      baseYRef.current = unitHeight + (newY % unitHeight);
    } 
    else {
      baseYRef.current = newY;
    }

    y.set(baseYRef.current);
  });

  const yTransform = useTransform(y, (v) => `translate3d(0,${-v}px,0)`);

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full overflow-y-hidden overflow-x-hidden", className)}
      {...props}
    >
      <motion.div
        className="flex flex-col will-change-transform transform-gpu"
        style={{ transform: yTransform }}
      >
        {Array.from({ length: numCopies }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col shrink-0",
              i === 0 ? "threed-scroll-trigger-block" : ""
            )}
          >
            {BlockContent}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* --------------------------
   Local column (if no shared velocity)
   -------------------------- */
function ThreeDScrollTriggerColumnLocal(props) {
  const { scrollY } = useScroll();
  const localVelocity = useVelocity(scrollY);
  const localSmoothVelocity = useSpring(localVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const localVelocityFactor = useTransform(localSmoothVelocity, (v) => {
    const sign = v < 0 ? -1 : 1;
    const magnitude = Math.min(5, (Math.abs(v) / 1000) * 5);
    return sign * magnitude;
  });

  return (
    <ThreeDScrollTriggerColumnImpl
      {...props}
      velocityFactor={localVelocityFactor}
    />
  );
}

export default ThreeDScrollTriggerColumn;
