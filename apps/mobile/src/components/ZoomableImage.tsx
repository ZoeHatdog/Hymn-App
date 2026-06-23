import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  TapGestureHandler,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerStateChangeEvent,
  type TapGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

interface ZoomableImageProps {
  uri: string;
  width: number;
  height: number;
  resetTrigger: number;
  onZoomChange?: (isZoomed: boolean) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampTranslation(
  value: number,
  scaledSize: number,
  containerSize: number,
) {
  const maxOffset = Math.max(0, (scaledSize - containerSize) / 2);
  return clamp(value, -maxOffset, maxOffset);
}

export function ZoomableImage({
  uri,
  width,
  height,
  resetTrigger,
  onZoomChange,
}: ZoomableImageProps) {
  const pinchRef = useRef(null);
  const panRef = useRef(null);

  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const lastScale = useRef(1);
  const lastOffsetX = useRef(0);
  const lastOffsetY = useRef(0);
  const layoutWidth = useRef(width);
  const layoutHeight = useRef(height);
  const [panEnabled, setPanEnabled] = useState(false);

  useEffect(() => {
    layoutWidth.current = width;
    layoutHeight.current = height;
  }, [width, height]);

  const setZoomed = (isZoomed: boolean) => {
    setPanEnabled(isZoomed);
    onZoomChange?.(isZoomed);
  };

  const resetZoom = () => {
    lastScale.current = 1;
    lastOffsetX.current = 0;
    lastOffsetY.current = 0;
    baseScale.setValue(1);
    pinchScale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    panX.setValue(0);
    panY.setValue(0);
    setZoomed(false);
  };

  useEffect(() => {
    resetZoom();
  }, [resetTrigger]);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState !== State.ACTIVE) {
      return;
    }

    const nextScale = clamp(
      lastScale.current * event.nativeEvent.scale,
      MIN_SCALE,
      MAX_SCALE,
    );

    if (nextScale <= 1.05) {
      resetZoom();
      return;
    }

    lastScale.current = nextScale;
    baseScale.setValue(nextScale);
    pinchScale.setValue(1);

    const clampedX = clampTranslation(
      lastOffsetX.current,
      layoutWidth.current * nextScale,
      layoutWidth.current,
    );
    const clampedY = clampTranslation(
      lastOffsetY.current,
      layoutHeight.current * nextScale,
      layoutHeight.current,
    );

    lastOffsetX.current = clampedX;
    lastOffsetY.current = clampedY;
    translateX.setValue(clampedX);
    translateY.setValue(clampedY);
    setZoomed(true);
  };

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: panX, translationY: panY } }],
    { useNativeDriver: true },
  );

  const onPanStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState !== State.ACTIVE) {
      return;
    }

    if (lastScale.current <= 1.01) {
      panX.setValue(0);
      panY.setValue(0);
      return;
    }

    const scaledWidth = layoutWidth.current * lastScale.current;
    const scaledHeight = layoutHeight.current * lastScale.current;

    const nextX = clampTranslation(
      lastOffsetX.current + event.nativeEvent.translationX,
      scaledWidth,
      layoutWidth.current,
    );
    const nextY = clampTranslation(
      lastOffsetY.current + event.nativeEvent.translationY,
      scaledHeight,
      layoutHeight.current,
    );

    lastOffsetX.current = nextX;
    lastOffsetY.current = nextY;
    translateX.setValue(nextX);
    translateY.setValue(nextY);
    panX.setValue(0);
    panY.setValue(0);
  };

  const onDoubleTap = (event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state !== State.ACTIVE) {
      return;
    }

    if (lastScale.current > 1.05) {
      resetZoom();
      return;
    }

    const targetScale = DOUBLE_TAP_SCALE;
    lastScale.current = targetScale;
    baseScale.setValue(targetScale);
    pinchScale.setValue(1);
    lastOffsetX.current = 0;
    lastOffsetY.current = 0;
    translateX.setValue(0);
    translateY.setValue(0);
    panX.setValue(0);
    panY.setValue(0);
    setZoomed(true);
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
        <Animated.View>
          <PanGestureHandler
            ref={panRef}
            simultaneousHandlers={pinchRef}
            enabled={panEnabled}
            onGestureEvent={onPanEvent}
            onHandlerStateChange={onPanStateChange}
          >
            <Animated.View>
              <PinchGestureHandler
                ref={pinchRef}
                simultaneousHandlers={panRef}
                onGestureEvent={onPinchEvent}
                onHandlerStateChange={onPinchStateChange}
              >
                <Animated.View
                  style={[
                    styles.imageWrap,
                    { width, height },
                    {
                      transform: [
                        { translateX: Animated.add(translateX, panX) },
                        { translateY: Animated.add(translateY, panY) },
                        { scale },
                      ],
                    },
                  ]}
                >
                  <Image source={{ uri }} style={{ width, height }} resizeMode="contain" />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </TapGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
