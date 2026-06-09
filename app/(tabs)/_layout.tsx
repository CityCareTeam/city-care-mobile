import { AuthProvider } from "@/context/AuthContext";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const TABS = [
  { name: "index",   label: "Accueil", icon: "chart.bar.fill" as const },
  { name: "explore", label: "Carte",   icon: "map.fill" as const },
  { name: "profile", label: "Profil",  icon: "person.fill" as const },
];

const TAB_BAR_HEIGHT = 60;
const MARGIN_H = 20;
const MARGIN_BOTTOM = Platform.OS === "ios" ? 28 : 16;
const PAD = 6;

function LiquidTabBar({ state, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? CityCareColorsDark : CityCareColors;

  const screenWidth = Dimensions.get("window").width;
  const barWidth = screenWidth - MARGIN_H * 2;
  const tabWidth = (barWidth - PAD * 2) / TABS.length;

  const translateX = useRef(new Animated.Value(PAD + state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: PAD + state.index * tabWidth,
      useNativeDriver: true,
      mass: 0.5,
      stiffness: 200,
      damping: 18,
    }).start();
  }, [state.index, tabWidth]);

  const handlePress = (index: number) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const route = state.routes[index];
    const isFocused = state.index === index;
    if (!isFocused) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: MARGIN_BOTTOM }]}
    >
      <View
        style={[
          styles.bar,
          {
            borderColor: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(255,255,255,0.7)",
          },
        ]}
      >
        {/* Glass blur layer */}
        <BlurView
          style={StyleSheet.absoluteFillObject}
          intensity={isDark ? 55 : 75}
          tint={isDark ? "dark" : "light"}
        />
        {/* Tinted overlay for glass depth */}
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
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth - PAD,
              backgroundColor: colors.primary,
              transform: [{ translateX }],
            },
          ]}
          pointerEvents="none"
        />
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => handlePress(index)}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <View style={styles.tabContent}>
                <IconSymbol
                  name={tab.icon}
                  size={20}
                  color={isFocused ? "#ffffff" : isDark ? "#ffffff55" : "#00000040"}
                />
                {isFocused && (
                  <Text style={styles.label}>{tab.label}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <AuthProvider>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <LiquidTabBar {...props} />}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.label }}
          />
        ))}
      </Tabs>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: MARGIN_H,
    right: MARGIN_H,
    height: TAB_BAR_HEIGHT,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: PAD,
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: PAD,
    bottom: PAD,
    borderRadius: 22,
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#ffffff",
  },
});
