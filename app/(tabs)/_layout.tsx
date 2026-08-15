import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider, useNotificationContext } from "@/context/NotificationContext";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "@/components/ui/GlassSurface";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CityCareColors, CityCareColorsDark } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const TABS = [
  { name: "index",         label: "Accueil", icon: "chart.bar.fill" as const },
  { name: "explore",       label: "Carte",   icon: "map.fill" as const },
  { name: "notifications", label: "Notifs",  icon: "bell.fill" as const },
  { name: "profile",       label: "Profil",  icon: "person.fill" as const },
];

/** Capturé hors composant : un worklet ne doit lire que des valeurs simples. */
const TAB_COUNT = TABS.length;

const TAB_BAR_HEIGHT = 60;
const MARGIN_H = 20;
const PAD = 6;

const SPRING = { mass: 0.5, stiffness: 200, damping: 18 };

/** Déplacement horizontal à franchir avant que le glissement prenne la main. */
const DRAG_SLOP = 8;
/** Étirement maximal de la pastille lancée à pleine vitesse. */
const MAX_STRETCH = 0.14;
const STRETCH_VELOCITY = 4000;

function LiquidTabBar({ state, navigation }: BottomTabBarProps) {
  const { unreadCount } = useNotificationContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? CityCareColorsDark : CityCareColors;
  const { bottom: bottomInset } = useSafeAreaInsets();
  const marginBottom = bottomInset + (Platform.OS === "ios" ? 0 : 8);

  // `useWindowDimensions` plutôt qu'un `Dimensions.get` figé au premier rendu :
  // la barre se recalcule à la rotation.
  const { width: screenWidth } = useWindowDimensions();
  const barWidth = screenWidth - MARGIN_H * 2;
  const tabWidth = (barWidth - PAD * 2) / TABS.length;
  const restingX = (index: number) => PAD + index * tabWidth;
  const maxX = restingX(TABS.length - 1);

  const x = useSharedValue(restingX(state.index));
  const grabbedAt = useSharedValue(0);
  const stretch = useSharedValue(1);
  const held = useSharedValue(false);
  const hoveredOnUi = useSharedValue(state.index);

  // Onglet sous la pastille pendant le glissement ; retombe sur l'onglet réel
  // dès qu'on lâche.
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = hovered ?? state.index;

  const tap = useCallback((index: number) => {
    if (Platform.OS === "ios") Haptics.selectionAsync();
    setHovered(index);
  }, []);

  const settle = useCallback((index: number) => {
    setHovered(null);
    if (state.index !== index) navigation.navigate(state.routes[index].name);
  }, [state.index, state.routes, navigation]);

  // Suit la navigation venue d'ailleurs — retour arrière, lien profond — mais
  // jamais pendant qu'un doigt tient la pastille.
  useEffect(() => {
    if (!held.value) x.value = withSpring(restingX(state.index), SPRING);
    hoveredOnUi.value = state.index;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, tabWidth]);

  /**
   * Glissement de la pastille. Tout se joue sur le thread UI : la position
   * suit le doigt image par image sans repasser par le JS, et seul le
   * franchissement d'un onglet déclenche un aller-retour — trois fois par
   * geste au maximum, au lieu d'une fois par image.
   */
  const pan = useMemo(
    () => Gesture.Pan()
      // Laisse les appuis simples atteindre les onglets en dessous.
      .activeOffsetX([-DRAG_SLOP, DRAG_SLOP])
      .onStart(() => {
        held.value = true;
        grabbedAt.value = x.value;
      })
      .onUpdate((e) => {
        const next = Math.min(Math.max(grabbedAt.value + e.translationX, PAD), maxX);
        x.value = next;

        // L'étirement suit la vitesse : la pastille s'allonge quand on la
        // lance et se retasse quand on la pose. C'est là qu'est le « liquide ».
        stretch.value = 1 + Math.min(Math.abs(e.velocityX) / STRETCH_VELOCITY, MAX_STRETCH);

        const under = Math.round((next - PAD) / tabWidth);
        if (under !== hoveredOnUi.value) {
          hoveredOnUi.value = under;
          runOnJS(tap)(under);
        }
      })
      .onFinalize(() => {
        if (!held.value) return;
        held.value = false;
        const landing = Math.min(Math.max(Math.round((x.value - PAD) / tabWidth), 0), TAB_COUNT - 1);
        // Position recalculée sur place : `restingX` est une fonction JS
        // ordinaire, et l'appeler depuis un worklet fait planter l'application.
        x.value = withSpring(PAD + landing * tabWidth, SPRING);
        stretch.value = withSpring(1, SPRING);
        hoveredOnUi.value = landing;
        runOnJS(settle)(landing);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tabWidth, maxX, tap, settle],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scaleX: stretch.value }],
  }));

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
      style={[styles.wrapper, { bottom: marginBottom }]}
    >
      <GestureDetector gesture={pan}>
      <GlassSurface style={styles.bar}>
        <Animated.View
          style={[
            styles.indicator,
            { width: tabWidth - PAD, backgroundColor: colors.primary },
            indicatorStyle,
          ]}
          pointerEvents="none"
        />
        {TABS.map((tab, index) => {
          const isFocused = activeIndex === index;
          const showBadge = tab.name === "notifications" && unreadCount > 0;
          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => handlePress(index)}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <View style={styles.tabContent}>
                <View>
                  <IconSymbol
                    name={tab.icon}
                    size={20}
                    color={isFocused ? "#ffffff" : isDark ? "#ffffff55" : "#00000040"}
                  />
                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? "99+" : String(unreadCount)}
                      </Text>
                    </View>
                  )}
                </View>
                {isFocused && (
                  <Text style={styles.label}>{tab.label}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </GlassSurface>
      </GestureDetector>
    </View>
  );
}

export default function TabLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
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
      </NotificationProvider>
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
  // Flou, voile, liseré et ombre viennent de GlassSurface.
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingHorizontal: PAD,
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
  badge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#e53e3e",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
});
