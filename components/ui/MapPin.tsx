import { View } from "react-native";
import Svg, { Circle, Polygon } from "react-native-svg";

type Props = {
  color: string;
  active?: boolean;
};

export function MapPin({ color, active = false }: Props) {
  const head  = active ? 34 : 26;
  const dot   = active ? 10 : 7;
  const tailW = active ? 9  : 7;
  const tailH = active ? 13 : 10;
  const r     = head / 2;
  const ringPad = active ? 8 : 0;

  const svgW = head + ringPad * 2;
  const svgH = head + ringPad * 2 + tailH;
  const cx   = svgW / 2;
  const cy   = r + ringPad;

  return (
    <View
      style={{
        elevation: active ? 10 : 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: active ? 4 : 2 },
        shadowOpacity: active ? 0.4 : 0.2,
        shadowRadius: active ? 6 : 3,
      }}
    >
      <Svg width={svgW} height={svgH}>
        {active && (
          <Circle
            cx={cx} cy={cy}
            r={r + ringPad}
            fill={color + "18"}
            stroke={color + "55"}
            strokeWidth={2}
          />
        )}
        {/* Triangle tail — drawn first so the circle head covers the base */}
        <Polygon
          points={`${cx - tailW},${cy + r} ${cx + tailW},${cy + r} ${cx},${cy + r + tailH}`}
          fill={color}
        />
        {/* Circle head */}
        <Circle
          cx={cx} cy={cy}
          r={r}
          fill={color}
          stroke="white"
          strokeWidth={active ? 3 : 2}
        />
        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={dot / 2} fill="white" opacity={0.9} />
      </Svg>
    </View>
  );
}
