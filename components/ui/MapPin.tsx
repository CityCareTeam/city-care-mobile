import { View } from "react-native";

type Props = {
  color: string;
  active?: boolean;
};

export function MapPin({ color, active = false }: Props) {
  const head = active ? 34 : 26;
  const dot = active ? 10 : 7;
  const tailW = active ? 9 : 7;
  const tailH = active ? 13 : 10;
  const ring = head + 16;

  return (
    <View style={{ alignItems: "center" }}>
      {active && (
        <View
          style={{
            position: "absolute",
            top: -(ring - head) / 2,
            width: ring,
            height: ring,
            borderRadius: ring / 2,
            borderWidth: 2,
            borderColor: color + "55",
            backgroundColor: color + "18",
          }}
        />
      )}
      <View
        style={{
          width: head,
          height: head,
          borderRadius: head / 2,
          backgroundColor: color,
          borderWidth: active ? 3 : 2,
          borderColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: active ? 4 : 2 },
          shadowOpacity: active ? 0.4 : 0.2,
          shadowRadius: active ? 6 : 3,
          elevation: active ? 10 : 5,
        }}
      >
        <View
          style={{
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: "#fff",
            opacity: 0.9,
          }}
        />
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: tailW,
          borderRightWidth: tailW,
          borderTopWidth: tailH,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: color,
          marginTop: -1,
        }}
      />
    </View>
  );
}
