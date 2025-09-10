"use client";

import * as React from "react";
import {
  SVGMotionProps,
  useAnimation,
  UseInViewOptions,
  type LegacyAnimationControls,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useIsInView } from "@/hooks/use-is-in-view";

const staticAnimations = {
  path: {
    initial: { pathLength: 1, opacity: 1 },
    animate: {
      pathLength: [0.05, 1],
      opacity: [0, 1],
      transition: {
        duration: 0.8,
        ease: "easeInOut",
        opacity: { duration: 0.01 },
      },
    },
  } as Variants,
  "path-loop": {
    initial: { pathLength: 1, opacity: 1 },
    animate: {
      pathLength: [1, 0.05, 1],
      opacity: [1, 0, 1],
      transition: {
        duration: 1.6,
        ease: "easeInOut",
        opacity: { duration: 0.01 },
      },
    },
  } as Variants,
} as const;

type StaticAnimations = keyof typeof staticAnimations;
type TriggerProp<T = string> = boolean | StaticAnimations | T;

interface AnimateIconContextValue {
  controls: LegacyAnimationControls | undefined;
  animation: StaticAnimations | string;
  loop: boolean;
  loopDelay: number;
}

interface DefaultIconProps<T = string> {
  animate?: TriggerProp<T>;
  onAnimateChange?: (
    value: boolean,
    animation: StaticAnimations | string
  ) => void;
  animateOnHover?: TriggerProp<T>;
  animateOnTap?: TriggerProp<T>;
  animateOnView?: TriggerProp<T>;
  animateOnViewMargin?: UseInViewOptions["margin"];
  animateOnViewOnce?: boolean;
  animation?: T | StaticAnimations;
  loop?: boolean;
  loopDelay?: number;
  onAnimateStart?: () => void;
  onAnimateEnd?: () => void;
  delay?: number;
}

interface AnimateIconProps<T = string> extends DefaultIconProps<T> {
  children: React.ReactNode;
  asChild?: boolean;
}

interface IconProps<T>
  extends DefaultIconProps<T>,
    Omit<
      SVGMotionProps<SVGSVGElement>,
      "animate" | "onAnimationStart" | "onAnimationEnd"
    > {
  size?: number;
}

interface IconWrapperProps<T> extends IconProps<T> {
  icon: React.ComponentType<IconProps<T>>;
}

const AnimateIconContext = React.createContext<AnimateIconContextValue | null>(
  null
);

function useAnimateIconContext() {
  const context = React.useContext(AnimateIconContext);
  if (!context)
    return {
      controls: undefined,
      animation: "default",
      loop: false,
      loopDelay: 0,
    };
  return context;
}

function composeEventHandlers<E extends React.SyntheticEvent<unknown>>(
  theirs?: (event: E) => void,
  ours?: (event: E) => void
) {
  return (event: E) => {
    theirs?.(event);
    ours?.(event);
  };
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else (ref as React.MutableRefObject<T | null>).current = value;
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProps = Record<string, any>;

type SlotProps<E extends Element = HTMLElement> = {
  children: React.ReactElement;
} & React.HTMLAttributes<E> &
  AnyProps;

function Slot<E extends Element = HTMLElement>({
  children,
  ...slotProps
}: SlotProps<E>) {
  if (!React.isValidElement(children)) return children;

  const {
    className: slotClassName,
    style: slotStyle,
    ref: slotRef,
    onMouseEnter: sOnMouseEnter,
    onMouseLeave: sOnMouseLeave,
    onPointerDown: sOnPointerDown,
    onPointerUp: sOnPointerUp,
    ...restSlot
  } = slotProps;

  const {
    className: childClassName,
    style: childStyle,
    ref: childRef,
    onMouseEnter: cOnMouseEnter,
    onMouseLeave: cOnMouseLeave,
    onPointerDown: cOnPointerDown,
    onPointerUp: cOnPointerUp,
    ...restChild
  } = (children.props ?? {}) as AnyProps;

  const mergedProps: AnyProps = {
    ...restChild,
    ...restSlot,
    className: cn(childClassName, slotClassName),
    style: { ...(childStyle || {}), ...(slotStyle || {}) },
    ref: mergeRefs(childRef, slotRef),
    onMouseEnter: composeEventHandlers(cOnMouseEnter, sOnMouseEnter),
    onMouseLeave: composeEventHandlers(cOnMouseLeave, sOnMouseLeave),
    onPointerDown: composeEventHandlers(cOnPointerDown, sOnPointerDown),
    onPointerUp: composeEventHandlers(cOnPointerUp, sOnPointerUp),
  };

  return React.cloneElement(children, mergedProps);
}

function AnimateIcon({
  animate,
  onAnimateChange,
  asChild = true,
  animateOnHover,
  animateOnTap,
  animateOnView,
  animateOnViewMargin = "0px",
  animateOnViewOnce = true,
  animation = "default",
  loop = false,
  loopDelay = 0,
  onAnimateStart,
  onAnimateEnd,
  delay = 0,
  children,
}: AnimateIconProps) {
  const controls = useAnimation();

  const [localAnimate, setLocalAnimate] = React.useState<boolean>(() => {
    if (animate === undefined || animate === false) return false;
    return delay <= 0;
  });

  const [currentAnimation, setCurrentAnimation] = React.useState<
    string | StaticAnimations
  >(typeof animate === "string" ? animate : animation);

  const delayRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAnimation = React.useCallback(
    (trigger: TriggerProp) => {
      const next = typeof trigger === "string" ? trigger : animation;
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      setCurrentAnimation(next);
      if (delay > 0) {
        setLocalAnimate(false);
        delayRef.current = setTimeout(() => {
          setLocalAnimate(true);
        }, delay);
      } else {
        setLocalAnimate(true);
      }
    },
    [animation, delay]
  );

  const stopAnimation = React.useCallback(() => {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    setLocalAnimate(false);
  }, []);

  React.useEffect(() => {
    if (animate === undefined) return;
    setCurrentAnimation(typeof animate === "string" ? animate : animation);
    if (animate) startAnimation(animate as TriggerProp);
    else stopAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);

  React.useEffect(
    () => onAnimateChange?.(localAnimate, currentAnimation),
    [localAnimate, onAnimateChange, currentAnimation]
  );

  React.useEffect(() => {
    if (localAnimate) onAnimateStart?.();
    controls.start(localAnimate ? "animate" : "initial").then(() => {
      if (localAnimate) onAnimateEnd?.();
    });
  }, [localAnimate, controls, onAnimateStart, onAnimateEnd]);

  React.useEffect(() => {
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  const viewOuterRef = React.useRef<HTMLElement>(null);
  const { ref: inViewRef, isInView } = useIsInView(viewOuterRef, {
    inView: !!animateOnView,
    inViewOnce: animateOnViewOnce,
    inViewMargin: animateOnViewMargin,
  });

  React.useEffect(() => {
    if (!animateOnView) return;
    if (isInView) startAnimation(animateOnView);
    else stopAnimation();
  }, [isInView, animateOnView, startAnimation, stopAnimation]);

  const childProps = (
    React.isValidElement(children) ? (children as React.ReactElement).props : {}
  ) as AnyProps;

  const handleMouseEnter = composeEventHandlers<React.MouseEvent<HTMLElement>>(
    childProps.onMouseEnter,
    () => {
      if (animateOnHover) startAnimation(animateOnHover);
    }
  );

  const handleMouseLeave = composeEventHandlers<React.MouseEvent<HTMLElement>>(
    childProps.onMouseLeave,
    () => {
      if (animateOnHover || animateOnTap) stopAnimation();
    }
  );

  const handlePointerDown = composeEventHandlers<
    React.PointerEvent<HTMLElement>
  >(childProps.onPointerDown, () => {
    if (animateOnTap) startAnimation(animateOnTap);
  });

  const handlePointerUp = composeEventHandlers<React.PointerEvent<HTMLElement>>(
    childProps.onPointerUp,
    () => {
      if (animateOnTap) stopAnimation();
    }
  );

  const content = asChild ? (
    <Slot
      ref={inViewRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {children as React.ReactElement}
    </Slot>
  ) : (
    <span
      ref={inViewRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ display: "contents" }}
    >
      {children}
    </span>
  );

  return (
    <AnimateIconContext.Provider
      value={{
        controls,
        animation: currentAnimation,
        loop,
        loopDelay,
      }}
    >
      {content}
    </AnimateIconContext.Provider>
  );
}

const pathClassName =
  "[&_[stroke-dasharray='1px_1px']]:![stroke-dasharray:1px_0px]";

function IconWrapper<T extends string>({
  size = 22,
  animation: animationProp,
  animate,
  onAnimateChange,
  animateOnHover = false,
  animateOnTap = false,
  animateOnView = false,
  animateOnViewMargin = "0px",
  animateOnViewOnce = true,
  icon: IconComponent,
  loop = false,
  loopDelay = 0,
  onAnimateStart,
  onAnimateEnd,
  delay = 0,
  className,
  ...props
}: IconWrapperProps<T>) {
  const context = React.useContext(AnimateIconContext);

  if (context) {
    const {
      controls,
      animation: parentAnimation,
      loop: parentLoop,
      loopDelay: parentLoopDelay,
    } = context;
    const animationToUse = animationProp ?? parentAnimation;
    const loopToUse = loop || parentLoop;
    const loopDelayToUse = loopDelay || parentLoopDelay;

    return (
      <AnimateIconContext.Provider
        value={{
          controls,
          animation: animationToUse,
          loop: loopToUse,
          loopDelay: loopDelayToUse,
        }}
      >
        <IconComponent
          size={size}
          className={cn(
            className,
            (animationToUse === "path" || animationToUse === "path-loop") &&
              pathClassName
          )}
          {...props}
        />
      </AnimateIconContext.Provider>
    );
  }

  if (
    animate !== undefined ||
    onAnimateChange !== undefined ||
    animateOnHover ||
    animateOnTap ||
    animateOnView ||
    animationProp
  ) {
    return (
      <AnimateIcon
        animate={animate}
        onAnimateChange={onAnimateChange}
        animateOnHover={animateOnHover}
        animateOnTap={animateOnTap}
        animateOnView={animateOnView}
        animateOnViewMargin={animateOnViewMargin}
        animateOnViewOnce={animateOnViewOnce}
        animation={animationProp}
        loop={loop}
        loopDelay={loopDelay}
        onAnimateStart={onAnimateStart}
        onAnimateEnd={onAnimateEnd}
        delay={delay}
        asChild
      >
        <IconComponent
          size={size}
          className={cn(
            className,
            (animationProp === "path" || animationProp === "path-loop") &&
              pathClassName
          )}
          {...props}
        />
      </AnimateIcon>
    );
  }

  return (
    <IconComponent
      size={size}
      className={cn(
        className,
        (animationProp === "path" || animationProp === "path-loop") &&
          pathClassName
      )}
      {...props}
    />
  );
}

function getVariants<
  V extends { default: T; [key: string]: T },
  T extends Record<string, Variants>
>(animations: V): T {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { animation: animationType, loop, loopDelay } = useAnimateIconContext();

  let result: T;

  if (animationType in staticAnimations) {
    const variant = staticAnimations[animationType as StaticAnimations];
    result = {} as T;
    for (const key in animations.default) {
      if (
        (animationType === "path" || animationType === "path-loop") &&
        key.includes("group")
      )
        continue;
      result[key] = variant as T[Extract<keyof T, string>];
    }
  } else {
    result = (animations[animationType as keyof V] as T) ?? animations.default;
  }

  if (loop) {
    for (const key in result) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = result[key] as any;
      const transition = state.animate?.transition;
      if (!transition) continue;

      const hasNestedKeys = Object.values(transition).some(
        (v) =>
          typeof v === "object" &&
          v !== null &&
          ("ease" in v || "duration" in v || "times" in v)
      );

      if (hasNestedKeys) {
        for (const prop in transition) {
          const subTrans = transition[prop];
          if (typeof subTrans === "object" && subTrans !== null) {
            transition[prop] = {
              ...subTrans,
              repeat: Infinity,
              repeatType: "loop",
              repeatDelay: loopDelay,
            };
          }
        }
      } else {
        state.animate.transition = {
          ...transition,
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: loopDelay,
        };
      }
    }
  }

  return result;
}

export {
  pathClassName,
  staticAnimations,
  AnimateIcon,
  IconWrapper,
  useAnimateIconContext,
  getVariants,
  type IconProps,
  type IconWrapperProps,
  type AnimateIconProps,
  type AnimateIconContextValue,
};
