import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  PanGestureHandler,
  ScrollView,
  State,
  type PanGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { ZoomableImage } from "./ZoomableImage";
import {
  computeContainedSize,
  computeWidthScaledSize,
  MIN_TOUCH_TARGET,
  SHEET_MUSIC_MAX_WIDTH,
} from "../utils/sheetMusicLayout";

interface SheetMusicViewerModalProps {
  visible: boolean;
  hymnId: string;
  title: string;
  page: number | null;
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
  onPreviousHymn?: () => void;
  onNextHymn?: () => void;
  busy?: boolean;
}

function ViewerPageImage({
  uri,
  pageWidth,
  availableHeight,
  resetTrigger,
  onZoomChange,
}: {
  uri: string;
  pageWidth: number;
  availableHeight: number;
  resetTrigger: number;
  onZoomChange: (isZoomed: boolean) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const horizontalPadding = spacing.lg * 2;
  const arrowReserve = MIN_TOUCH_TARGET * 2 + spacing.md * 2;
  const contentWidth = pageWidth - horizontalPadding - arrowReserve;

  useEffect(() => {
    setLoading(true);
    setDisplaySize(null);
    Image.getSize(
      uri,
      (naturalWidth, naturalHeight) => {
        setDisplaySize(
          computeContainedSize(
            naturalWidth,
            naturalHeight,
            contentWidth,
            availableHeight,
            SHEET_MUSIC_MAX_WIDTH,
          ),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uri, contentWidth, availableHeight]);

  return (
    <View style={[styles.pageSlide, { width: pageWidth, height: availableHeight }]}>
      {loading && (
        <View style={styles.pageLoading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
      {displaySize && (
        <ZoomableImage
          uri={uri}
          width={displaySize.width}
          height={displaySize.height}
          resetTrigger={resetTrigger}
          onZoomChange={onZoomChange}
        />
      )}
    </View>
  );
}

function ScrollableSheetImage({
  uri,
  contentWidth,
}: {
  uri: string;
  contentWidth: number;
}) {
  const [loading, setLoading] = useState(true);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    setLoading(true);
    setDisplaySize(null);
    Image.getSize(
      uri,
      (naturalWidth, naturalHeight) => {
        setDisplaySize(
          computeWidthScaledSize(naturalWidth, naturalHeight, contentWidth, SHEET_MUSIC_MAX_WIDTH),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [uri, contentWidth]);

  return (
    <View style={styles.scrollableImageWrap}>
      {loading && (
        <View style={styles.scrollableLoading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
      {displaySize && (
        <Image
          source={{ uri }}
          style={{ width: displaySize.width, height: displaySize.height }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

export function SheetMusicViewerModal({
  visible,
  hymnId,
  title,
  page,
  imageUrls,
  initialIndex,
  onClose,
  onPreviousHymn,
  onNextHymn,
  busy = false,
}: SheetMusicViewerModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<string>>(null);
  const panRef = useRef(null);
  const offsetX = useRef(0);
  const openedForHymn = useRef<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [pageResetKey, setPageResetKey] = useState(0);

  const totalPages = imageUrls.length;
  const isScrollableSinglePage = totalPages === 1;
  const hasMultiplePages = totalPages > 1;
  const canSwipePages = hasMultiplePages && !isZoomed;
  const onFirstImage = isScrollableSinglePage || currentIndex === 0;
  const onLastImage = isScrollableSinglePage || currentIndex >= totalPages - 1;
  const showPreviousPage = canSwipePages && currentIndex > 0;
  const showNextPage = canSwipePages && currentIndex < totalPages - 1;
  const showPreviousHymn = !isZoomed && !busy && onFirstImage && !!onPreviousHymn;
  const showNextHymn = !isZoomed && !busy && onLastImage && !!onNextHymn;

  const topChrome = insets.top + MIN_TOUCH_TARGET + spacing.md;
  const bottomChrome = insets.bottom + spacing.lg;
  const viewerHeight = windowHeight - topChrome - bottomChrome;
  const scrollableContentWidth = windowWidth - spacing.lg * 2;
  const hymnLabel =
    page != null && title ? `${page} · ${title}` : title;

  useEffect(() => {
    if (!visible) {
      setIsZoomed(false);
      openedForHymn.current = null;
      return;
    }

    const hymnChanged =
      openedForHymn.current !== null && openedForHymn.current !== hymnId;
    openedForHymn.current = hymnId;

    const index = hymnChanged ? 0 : initialIndex;
    setCurrentIndex(index);
    setIsZoomed(false);
    setPageResetKey((key) => key + 1);
    offsetX.current = index * windowWidth;

    if (imageUrls.length > 1) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index, animated: false });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep the current image across rotation
  }, [visible, initialIndex, hymnId, imageUrls.length]);

  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, totalPages - 1));
      setIsZoomed(false);
      setPageResetKey((key) => key + 1);
      offsetX.current = clamped * windowWidth;
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
      setCurrentIndex(clamped);
    },
    [totalPages, windowWidth],
  );

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    if (index !== currentIndex) {
      setIsZoomed(false);
      setPageResetKey((key) => key + 1);
      setCurrentIndex(index);
    }
  };

  const handleZoomChange = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
  }, []);

  const onHorizontalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetX.current = event.nativeEvent.contentOffset.x;
  };

  const handleHymnSwipe = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state !== State.END || isZoomed || busy) return;

      const { translationX, velocityX } = event.nativeEvent;
      const swipeLeft = translationX < -70 || velocityX < -800;
      const swipeRight = translationX > 70 || velocityX > 800;
      const atFirst =
        isScrollableSinglePage || offsetX.current <= windowWidth * 0.15;
      const atLast =
        isScrollableSinglePage ||
        offsetX.current >= windowWidth * (totalPages - 1 - 0.15);

      if (swipeLeft && atLast) onNextHymn?.();
      else if (swipeRight && atFirst) onPreviousHymn?.();
    },
    [
      isZoomed,
      busy,
      isScrollableSinglePage,
      windowWidth,
      totalPages,
      onNextHymn,
      onPreviousHymn,
    ],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar style="light" />
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close sheet music viewer"
        />

        {hymnLabel.length > 0 && (
          <View
            style={[
              styles.hymnLabel,
              {
                top: insets.top + spacing.sm,
                left: insets.left + spacing.md,
                right: insets.right + MIN_TOUCH_TARGET + spacing.lg,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.hymnLabelText} numberOfLines={1}>
              {hymnLabel}
            </Text>
          </View>
        )}

        <Pressable
          onPress={onClose}
          style={[
            styles.closeButton,
            { top: insets.top + spacing.sm, right: insets.right + spacing.sm },
          ]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </Pressable>

        <View
          style={[
            styles.viewerBody,
            { marginTop: topChrome, height: viewerHeight },
          ]}
          pointerEvents="box-none"
        >
          {isScrollableSinglePage ? (
            <PanGestureHandler
              ref={panRef}
              enabled={!isZoomed && !busy}
              activeOffsetX={[-24, 24]}
              failOffsetY={[-18, 18]}
              onHandlerStateChange={handleHymnSwipe}
            >
              <View style={styles.flexFill} collapsable={false}>
                <ScrollView
                  simultaneousHandlers={panRef}
                  style={styles.scrollableViewer}
                  contentContainerStyle={styles.scrollableContent}
                  showsVerticalScrollIndicator
                  bounces
                >
                  <ScrollableSheetImage
                    uri={imageUrls[0]}
                    contentWidth={scrollableContentWidth}
                  />
                </ScrollView>
              </View>
            </PanGestureHandler>
          ) : (
            <PanGestureHandler
              ref={panRef}
              enabled={!isZoomed && !busy}
              activeOffsetX={[-24, 24]}
              failOffsetY={[-18, 18]}
              onHandlerStateChange={handleHymnSwipe}
            >
              <View style={styles.flexFill} collapsable={false}>
                <FlatList
                  ref={listRef}
                  simultaneousHandlers={panRef}
                  style={styles.flexFill}
                  data={imageUrls}
                  keyExtractor={(uri, index) => `${uri}-${index}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  bounces={canSwipePages}
                  scrollEnabled={canSwipePages}
                  initialScrollIndex={initialIndex}
                  getItemLayout={(_, index) => ({
                    length: windowWidth,
                    offset: windowWidth * index,
                    index,
                  })}
                  onScroll={onHorizontalScroll}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  onScrollToIndexFailed={(info) => {
                    requestAnimationFrame(() => {
                      listRef.current?.scrollToOffset({
                        offset: info.averageItemLength * info.index,
                        animated: false,
                      });
                    });
                  }}
                  renderItem={({ item }) => (
                    <ViewerPageImage
                      uri={item}
                      pageWidth={windowWidth}
                      availableHeight={viewerHeight}
                      resetTrigger={pageResetKey}
                      onZoomChange={handleZoomChange}
                    />
                  )}
                />
              </View>
            </PanGestureHandler>
          )}

          {showPreviousPage && (
            <Pressable
              onPress={() => goToPage(currentIndex - 1)}
              style={[styles.arrowButton, { left: insets.left + spacing.sm }]}
              accessibilityRole="button"
              accessibilityLabel="Previous page"
            >
              <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            </Pressable>
          )}

          {showNextPage && (
            <Pressable
              onPress={() => goToPage(currentIndex + 1)}
              style={[styles.arrowButton, { right: insets.right + spacing.sm }]}
              accessibilityRole="button"
              accessibilityLabel="Next page"
            >
              <Ionicons name="chevron-forward" size={28} color={colors.textPrimary} />
            </Pressable>
          )}

          {showPreviousHymn && (
            <Pressable
              onPress={onPreviousHymn}
              style={[styles.arrowButton, { left: insets.left + spacing.sm }]}
              accessibilityRole="button"
              accessibilityLabel="Previous hymn"
            >
              <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            </Pressable>
          )}

          {showNextHymn && (
            <Pressable
              onPress={onNextHymn}
              style={[styles.arrowButton, { right: insets.right + spacing.sm }]}
              accessibilityRole="button"
              accessibilityLabel="Next hymn"
            >
              <Ionicons name="chevron-forward" size={28} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>

        {busy && (
          <View
            style={[styles.busyBadge, { bottom: insets.bottom + spacing.lg }]}
            pointerEvents="none"
          >
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        )}

        {hasMultiplePages && (
          <View
            style={[
              styles.pageBadge,
              {
                bottom: insets.bottom + spacing.lg,
                right: insets.right + spacing.lg,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.pageBadgeText}>
              {currentIndex + 1} / {totalPages}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
  },
  flexFill: {
    flex: 1,
  },
  hymnLabel: {
    position: "absolute",
    zIndex: 10,
    height: MIN_TOUCH_TARGET,
    justifyContent: "center",
  },
  hymnLabelText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  busyBadge: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  closeButton: {
    position: "absolute",
    zIndex: 10,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  viewerBody: {
    flex: 1,
    justifyContent: "center",
  },
  scrollableViewer: {
    flex: 1,
  },
  scrollableContent: {
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  scrollableImageWrap: {
    alignItems: "center",
  },
  scrollableLoading: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  pageSlide: {
    alignItems: "center",
    justifyContent: "center",
  },
  pageLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    marginTop: -MIN_TOUCH_TARGET / 2,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    zIndex: 10,
  },
  pageBadge: {
    position: "absolute",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  pageBadgeText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
});
