import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  RadialGradient,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthBackgroundProps {
  showBack?: boolean;
}

export function AuthBackground({ showBack }: AuthBackgroundProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', backgroundColor: '#0B112C' }]}>
      {/* ── Solid base gradient ── */}
      <LinearGradient
        colors={['#3F6AE8', '#2B48BC', '#1A2D7A', '#0B112C']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── SVG: 100% responsive viewBox scaled organic waves + 3D spheres ── */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 850"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* ── Wave gradients ── */}
          <SvgLinearGradient id="w1" x1="1" y1="0" x2="0.1" y2="0.8">
            <Stop offset="0" stopColor="#D0E0FF" stopOpacity="0.85" />
            <Stop offset="0.5" stopColor="#7AA8F8" stopOpacity="0.70" />
            <Stop offset="1" stopColor="#3A60E4" stopOpacity="0.45" />
          </SvgLinearGradient>

          <SvgLinearGradient id="w2" x1="0.85" y1="0.05" x2="0.15" y2="0.95">
            <Stop offset="0" stopColor="#4B78F5" stopOpacity="0.78" />
            <Stop offset="1" stopColor="#1F3EA8" stopOpacity="0.88" />
          </SvgLinearGradient>

          <SvgLinearGradient id="w3" x1="0.5" y1="0.1" x2="0.1" y2="1">
            <Stop offset="0" stopColor="#253C92" stopOpacity="0.92" />
            <Stop offset="1" stopColor="#0B112C" stopOpacity="0.98" />
          </SvgLinearGradient>

          {/* ── 3D Sphere gradients ── */}
          <RadialGradient id="sDark" cx="32%" cy="28%" r="68%">
            <Stop offset="0%" stopColor="#2E4898" stopOpacity="1" />
            <Stop offset="55%" stopColor="#172358" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0C1436" stopOpacity="1" />
          </RadialGradient>

          <RadialGradient id="sIce" cx="30%" cy="25%" r="65%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="35%" stopColor="#C6DEFF" stopOpacity="1" />
            <Stop offset="75%" stopColor="#6B96F6" stopOpacity="1" />
            <Stop offset="100%" stopColor="#3660D4" stopOpacity="1" />
          </RadialGradient>

          <RadialGradient id="sSoft" cx="32%" cy="28%" r="65%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="50%" stopColor="#D8E9FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#86ADFA" stopOpacity="1" />
          </RadialGradient>

          <RadialGradient id="sRoyal" cx="28%" cy="22%" r="78%">
            <Stop offset="0%" stopColor="#6A9FFF" stopOpacity="1" />
            <Stop offset="40%" stopColor="#2857EA" stopOpacity="1" />
            <Stop offset="82%" stopColor="#1530A0" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0D1D68" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Organic wave paths */}
        <Path
          d="M 100 0 Q 300 85, 400 34 L 400 323 Q 220 238, 72 153 Q 0 76, 0 0 Z"
          fill="url(#w1)"
        />

        <Path
          d="M 0 119 C 152 76, 352 187, 400 374 L 400 663 C 248 629, 112 493, 0 450 Z"
          fill="url(#w2)"
        />

        <Path
          d="M 0 357 C 192 391, 320 544, 400 714 L 400 850 L 0 850 Z"
          fill="url(#w3)"
        />

        {/* 3D Spheres */}
        <Circle cx={40} cy={60} r={62} fill="url(#sDark)" />
        <Circle cx={320} cy={145} r={52} fill="url(#sIce)" />
        <Circle cx={56} cy={510} r={36} fill="url(#sSoft)" />
        <Circle cx={180} cy={646} r={88} fill="url(#sRoyal)" />
      </Svg>
    </View>
  );
}
