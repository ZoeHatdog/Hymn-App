import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSizes, radii, spacing } from "@hymn-app/shared-themes";
import { ZoomableImage } from "./ZoomableImage";
import {
  computeContainedSize,
  MIN_TOUCH_TARGET,
  SHEET_MUSIC_MAX_WIDTH,
} from "../utils/sheetMusicLayout";

interface SheetMusicViewerModalProps {
  visible: boolean;
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
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

export function SheetMusicViewerModal({
  visible,
  imageUrls,
  initialIndex,
  onClose,
}: SheetMusicViewerModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<string>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [pageResetKey, setPageResetKey] = useState(0);

  const totalPages = imageUrls.length;
  const hasMultiplePages = totalPages > 1;
  const canSwipePages = hasMultiplePages && !isZoomed;

  const topChrome = insets.top + MIN_TOUCH_TARGET + spacing.md;
  const bottomChrome = insets.bottom + spacing.xl + fontSizes.md + spacing.md;
  const viewerHeight = windowHeight - topChrome - bottomChrome;

  useEffect(() => {
    if (!visible) {
      setIsZoomed(false);
      return;
    }

    setCurrentIndex(initialIndex);
    setIsZoomed(false);
    setPageResetKey((key) => key + 1);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false,
      });
    });
  }, [visible, initialIndex]);

  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, totalPages - 1));
      setIsZoomed(false);
      setPageResetKey((key) => key + 1);
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
      setCurrentIndex(clamped);
    },
    [totalPages],
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
          <FlatList
            ref={listRef}
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

          {canSwipePages && currentIndex > 0 && (
            <Pressable
              onPress={() => goToPage(currentIndex - 1)}
              style={[
                styles.arrowButton,
                { left: insets.left + spacing.sm },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Previous page"
            >
              <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            </Pressable>
          )}

          {canSwipePages && currentIndex < totalPages - 1 && (
            <Pressable
              onPress={() => goToPage(currentIndex + 1)}
              style={[
                styles.arrowButton,
                { right: insets.right + spacing.sm },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Next page"
            >
              <Ionicons name="chevron-forward" size={28} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>

        {totalPages > 0 && (
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
  pageSlide: {
    alignItems: "center",
    justifyContent: "center",
  },
  pageLoading: {
    ...StyleSheet.absoluteFillObject,
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
