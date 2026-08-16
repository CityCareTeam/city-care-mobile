import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

/**
 * Heure courante, dans l'en-tête de l'accueil.
 *
 * Le battement est calé sur la minute pleine et non sur un intervalle de
 * soixante secondes : lancé à 10 h 30 min 40 s, un intervalle afficherait 10:31
 * à 10 h 31 min 40 s, avec quarante secondes de retard permanent. On vise donc
 * la seconde 0 suivante, puis on repart d'une minute.
 *
 * Pas de deux-points clignotant : il aurait demandé un rendu par seconde sur un
 * écran qui sonde déjà le réseau, pour une décoration. Une minute suffit.
 */
export function HeaderClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return (
    <View
      style={styles.clock}
      accessibilityRole="text"
      accessibilityLabel={`${hours} heures ${minutes}`}
    >
      {/* Heures et minutes séparées pour que chacune s'anime quand elle change :
          à 10 h 59 → 11 h 00, les deux bougent ; le reste du temps, une seule.
          Les chiffres sont en chasse fixe, sans quoi l'heure se décale d'un
          pixel à chaque changement. */}
      <Turning value={hours} />
      <Text style={styles.digits}>:</Text>
      <Turning value={minutes} />
    </View>
  );
}

/**
 * Un nombre qui se renouvelle en glissant, brièvement.
 *
 * Volontairement discret : un chiffre qui tombe de quatre pixels en un quart de
 * seconde se remarque du coin de l'œil et s'oublie aussitôt. Une rotation de
 * carte ou un rebond auraient attiré le regard sur ce qui est, au fond, une
 * décoration d'en-tête.
 *
 * Rien ne bouge au premier rendu : l'animation dit « ça vient de changer », et
 * l'affichage initial n'est le changement de rien.
 */
function Turning({ value }: { value: string }) {
  const progress = useRef(new Animated.Value(1)).current;
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [value, progress]);

  return (
    <Animated.Text
      style={[
        styles.digits,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) },
          ],
        },
      ]}
    >
      {value}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  clock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  digits: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
  },
});
