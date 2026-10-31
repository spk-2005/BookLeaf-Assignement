import React from 'react';

/**
 * Official BookLeaf Publishing Logo Component
 * Faithfully matches the brand mark:
 * - Coral rose square (#f16977) with crisp white slash (/)
 * - BookLeaf Publishing typography in refined modern charcoal (#2d2d2d)
 * - India | USA | UK tagline with elegant letter-spacing
 */
export function BookLeafLogo({ size = 'md', showTagline = true, light = false }) {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return {
          markSize: 28,
          strokeWidth: 3.5,
          slashStart: 'M18 6L10 22',
          titleSize: '1.05rem',
          subSize: '0.9rem',
          taglineSize: '0.62rem',
          gap: '0.65rem'
        };
      case 'lg':
        return {
          markSize: 64,
          strokeWidth: 7,
          slashStart: 'M41 14L23 50',
          titleSize: '2.1rem',
          subSize: '1.85rem',
          taglineSize: '0.85rem',
          gap: '1.25rem'
        };
      case 'md':
      default:
        return {
          markSize: 42,
          strokeWidth: 5,
          slashStart: 'M27 9L15 33',
          titleSize: '1.45rem',
          subSize: '1.25rem',
          taglineSize: '0.72rem',
          gap: '0.85rem'
        };
    }
  };

  const dim = getDimensions();
  const textColor = light ? '#ffffff' : '#2d2d2d';
  const taglineColor = light ? 'rgba(255, 255, 255, 0.75)' : '#4a4a4a';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: dim.gap }}>
        {/* Coral Square Brand Mark with / */}
        <div style={{
          width: dim.markSize,
          height: dim.markSize,
          backgroundColor: '#f16977',
          borderRadius: size === 'sm' ? '5px' : size === 'lg' ? '12px' : '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(241, 105, 119, 0.28)',
          flexShrink: 0
        }}>
          <svg
            width={dim.markSize}
            height={dim.markSize}
            viewBox={`0 0 ${dim.markSize} ${dim.markSize}`}
            fill="none"
          >
            <path
              d={dim.slashStart}
              stroke="#ffffff"
              strokeWidth={dim.strokeWidth}
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Brand Typography */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize: dim.titleSize,
            fontWeight: 400,
            color: textColor,
            letterSpacing: '-0.01em'
          }}>
            BookLeaf
          </span>
          <span style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize: dim.subSize,
            fontWeight: 300,
            color: textColor,
            letterSpacing: '0.01em',
            marginTop: '0.05rem'
          }}>
            Publishing
          </span>
        </div>
      </div>

      {/* Tagline: India | USA | UK */}
      {showTagline && (
        <div style={{
          fontSize: dim.taglineSize,
          fontWeight: 500,
          color: taglineColor,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginTop: size === 'lg' ? '0.65rem' : '0.4rem',
          paddingLeft: size === 'lg' ? '0.15rem' : '0.1rem'
        }}>
          India <span style={{ opacity: 0.5, margin: '0 0.15rem' }}>|</span> USA <span style={{ opacity: 0.5, margin: '0 0.15rem' }}>|</span> UK
        </div>
      )}
    </div>
  );
}
