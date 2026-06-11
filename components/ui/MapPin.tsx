import { Text, View } from "react-native";

type PinProps = {
  color: string;
  active?: boolean;
};

export function MapPin({ color, active = false }: PinProps) {
  const head  = active ? 36 : 28;
  const dot   = active ? 11 : 8;
  const tailW = active ? 13 : 10;
  const tailH = active ? 18 : 14;
  const ring  = head + 18;

  return (
    <View collapsable={false} style={{ alignItems: "center" }}>
      {active && (
        <View
          collapsable={false}
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
        collapsable={false}
        style={{
          width: head,
          height: head,
          borderRadius: head / 2,
          backgroundColor: color,
          borderWidth: active ? 3 : 2.5,
          borderColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: active ? 4 : 2 },
          shadowOpacity: active ? 0.4 : 0.25,
          shadowRadius: active ? 6 : 3,
          elevation: active ? 10 : 5,
        }}
      >
        <View
          collapsable={false}
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
        collapsable={false}
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

type ClusterPinProps = {
  count: number;
  color: string;
};

export function ClusterPin({ count, color }: ClusterPinProps) {
  const inner = count < 10 ? 32 : count < 50 ? 38 : 46;
  const outer = inner + 14;
  const fontSize = count < 10 ? 14 : count < 100 ? 13 : 11;

  return (
    <View
      collapsable={false}
      style={{ width: outer, height: outer, alignItems: "center", justifyContent: "center" }}
    >
      <View
        collapsable={false}
        style={{
          position: "absolute",
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          backgroundColor: color + "33",
        }}
      />
      <View
        collapsable={false}
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize }}>
          {count}
        </Text>
      </View>
    </View>
  );
}
