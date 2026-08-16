import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
      {/* Chiffres en chasse fixe : sans quoi l'heure se décale d'un pixel à
          chaque changement de minute. */}
      <Text style={styles.digits}>{`${hours}:${minutes}`}</Text>
    </View>
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
