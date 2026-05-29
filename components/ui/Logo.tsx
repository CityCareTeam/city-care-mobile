import { Image, type ImageStyle } from "react-native";

type LogoProps = {
  size?: number;
  style?: ImageStyle;
};

export function Logo({ size = 102, style }: LogoProps) {
  return (
    <Image
      source={require("@/assets/images/logo-city-care.png")}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
