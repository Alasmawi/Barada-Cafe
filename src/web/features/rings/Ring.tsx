import { ringFromTags } from '../../../shared/ring';

const CENTRE = 300;
const VIEW_BOX = `0 0 ${CENTRE * 2} ${CENTRE * 2}`;

type Props = { tags: string[]; size: number; name?: string };

/** A creator's mark. It spins as one piece, so every ring turns at the same speed. */
export function Ring({ tags, size, name }: Props) {
  const { layers, lineWidth, dotRadius } = ringFromTags(tags);
  const label = name ? `${name}'s ring: ${tags.join(', ')}` : `Ring: ${tags.join(', ')}`;

  return (
    <svg className="ring" viewBox={VIEW_BOX} width={size} height={size} role="img" aria-label={label}>
      <g className="ring__spin">
        {layers.map(({ radius, color, dots, dashes }) => {
          const dash = dashes ? (Math.PI * radius) / dashes : 0;
          return (
            <g key={color}>
              <circle
                cx={CENTRE}
                cy={CENTRE}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={lineWidth}
                strokeDasharray={dashes ? `${dash} ${dash}` : undefined}
              />
              {Array.from({ length: dots }, (_, index) => {
                const angle = (index / dots) * 2 * Math.PI;
                return (
                  <circle
                    key={index}
                    cx={CENTRE + Math.cos(angle) * radius}
                    cy={CENTRE + Math.sin(angle) * radius}
                    r={dotRadius}
                    fill={color}
                  />
                );
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
