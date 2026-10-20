import Svg, { Rect } from 'react-native-svg';

import { encodeCode39 } from '../lib/code39';

export function Barcode39({
  value,
  width,
  height = 72,
}: {
  value: string;
  width: number;
  height?: number;
}) {
  const modules = encodeCode39(value);
  const unit = width / modules.length;
  return (
    <Svg width={width} height={height} accessibilityLabel={value}>
      <Rect x={0} y={0} width={width} height={height} fill="#FFFFFF" />
      {modules.map((bar, index) =>
        bar ? (
          <Rect
            key={index}
            x={index * unit}
            y={0}
            width={unit + 0.2}
            height={height}
            fill="#000000"
          />
        ) : null,
      )}
    </Svg>
  );
}
