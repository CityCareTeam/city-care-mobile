import { useAppColors } from "@/hooks/use-app-colors";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PAD = 4;

export type PillOption<T> = {
  label: string;
  value: T;
  dotColor?: string;
  badge?: number;
};

type Props<T> = {
  options: PillOption<T>[];
  activeValue: T;
  onSelect: (v: T) => void;
  indicatorColor?: string;
  style?: object;
};

export function GlassPillSelector<T>({
  options,
  activeValue,
  onSelect,
  indicatorColor,
  style,
}: Props<T>) {
  const { colors, isDark } = useAppColors();
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === activeValue));
  const [containerWidth, setContainerWidth] = useState(0);

  const tabWidth = containerWidth > 0 ? (containerWidth - PAD * 2) / options.length : 0;
  const translateX = useRef(new Animated.Value(PAD)).current;

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(translateX, {
      toValue: PAD + activeIndex * tabWidth,
      useNativeDriver: true,
      mass: 0.5,
      stiffness: 200,
      damping: 18,
    }).start();
  }, [activeIndex, tabWidth]);

  const color = indicatorColor ?? colors.primary;

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderColor: isDark
            ? "rgba(255,255,255,0.12)"
            : "rgba(255,255,255,0.7)",
        },
        style,
      ]}
      onLayout={(e: LayoutChangeEvent) =>
        setContainerWidth(e.nativeEvent.layout.width)
      }
    >
      <BlurView
        style={StyleSheet.absoluteFillObject}
        intensity={isDark ? 55 : 75}
        tint={isDark ? "dark" : "light"}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: isDark
              ? "rgba(25, 25, 30, 0.40)"
              : "rgba(255, 255, 255, 0.30)",
          },
        ]}
        pointerEvents="none"
      />

      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth - PAD,
              backgroundColor: color,
              transform: [{ translateX }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {options.map((opt, index) => {
        const isActive = activeIndex === index;
        return (
          <Pressable
            key={String(opt.value ?? "__null__")}
            style={styles.item}
            onPress={() => onSelect(opt.value)}
          >
            <View style={styles.itemContent}>
              {opt.dotColor != null && (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isActive ? "#fff" : opt.dotColor },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? "#fff"
                      : isDark
                      ? "rgba(255,255,255,0.45)"
                      : "rgba(0,0,0,0.40)",
                  },
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
              {opt.badge != null && opt.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: isActive ? "rgba(255,255,255,0.25)" : color + "30" }]}>
                  <Text style={[styles.badgeText, { color: isActive ? "#fff" : color }]}>
                    {opt.badge}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignSelf: "stretch",
    borderRadius: 30,
    borderWidth: 1,
    overflow: "hidden",
    height: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  indicator: {
    position: "absolute",
    top: PAD,
    bottom: PAD,
    borderRadius: 22,
    zIndex: 0,
  },
  item: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
