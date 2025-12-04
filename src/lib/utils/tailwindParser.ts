/**
 * Tailwind CSS 클래스를 기본 CSS 스타일로 변환하는 간단한 파서
 * 완전한 변환은 아니지만, 주요 유틸리티 클래스를 처리합니다.
 */

export function parseTailwindClasses(className: string): Record<string, string | number> {
  if (!className) return {};
  
  const classes = className.split(/\s+/);
  const styles: React.CSSProperties = {};
  const processedClasses = new Set<string>();
  
  // 먼저 그라데이션 처리 (여러 클래스가 함께 작동)
  const gradientClass = classes.find(c => c.startsWith('bg-gradient-'));
  if (gradientClass) {
    const gradientType = gradientClass.match(/bg-gradient-to-([a-z]+)/)?.[1] || 'r';
    const fromMatch = classes.find(c => c.startsWith('from-'));
    const viaMatch = classes.find(c => c.startsWith('via-'));
    const toMatch = classes.find(c => c.startsWith('to-'));
    
    if (fromMatch && toMatch) {
      const fromColor = getColorValue(fromMatch.replace('from-', ''));
      const viaColor = viaMatch ? getColorValue(viaMatch.replace('via-', '')) : null;
      const toColor = getColorValue(toMatch.replace('to-', ''));
      
      if (fromColor && toColor) {
        let direction = 'to right';
        if (gradientType === 'br') direction = 'to bottom right';
        else if (gradientType === 'bl') direction = 'to bottom left';
        else if (gradientType === 'tr') direction = 'to top right';
        else if (gradientType === 'tl') direction = 'to top left';
        else if (gradientType === 'b') direction = 'to bottom';
        else if (gradientType === 't') direction = 'to top';
        else if (gradientType === 'l') direction = 'to left';
        
        if (viaColor) {
          styles.backgroundImage = `linear-gradient(${direction}, ${fromColor}, ${viaColor}, ${toColor})`;
        } else {
          styles.backgroundImage = `linear-gradient(${direction}, ${fromColor}, ${toColor})`;
        }
        
        // 처리된 클래스 표시
        processedClasses.add(gradientClass);
        processedClasses.add(fromMatch);
        processedClasses.add(toMatch);
        if (viaMatch) processedClasses.add(viaMatch);
      }
    }
  }
  
  classes.forEach((cls) => {
    // 이미 처리된 클래스는 건너뛰기
    if (processedClasses.has(cls)) return;
    
    // 배경색 (그라데이션이 아닌 경우만)
    if (cls.startsWith('bg-') && !cls.startsWith('bg-gradient-')) {
      const color = cls.replace('bg-', '');
      const colorValue = getColorValue(color);
      if (colorValue) {
        styles.backgroundColor = colorValue;
      }
    }
    
    // 텍스트 색상
    if (cls.startsWith('text-')) {
      const color = cls.replace('text-', '');
      const colorValue = getColorValue(color);
      if (colorValue) {
        styles.color = colorValue;
      } else {
        // 기본 색상 처리
        if (color === 'white') styles.color = '#ffffff';
        else if (color === 'black') styles.color = '#000000';
      }
    }
    
    // 패딩 - 순서 중요: 개별 방향이 전체 패딩보다 우선
    if (cls.startsWith('pt-')) {
      const size = cls.replace('pt-', '');
      styles.paddingTop = parseSize(size);
    } else if (cls.startsWith('pb-')) {
      const size = cls.replace('pb-', '');
      styles.paddingBottom = parseSize(size);
    } else if (cls.startsWith('pl-')) {
      const size = cls.replace('pl-', '');
      styles.paddingLeft = parseSize(size);
    } else if (cls.startsWith('pr-')) {
      const size = cls.replace('pr-', '');
      styles.paddingRight = parseSize(size);
    } else if (cls.startsWith('px-')) {
      const size = cls.replace('px-', '');
      const paddingValue = parseSize(size);
      styles.paddingLeft = paddingValue;
      styles.paddingRight = paddingValue;
    } else if (cls.startsWith('py-')) {
      const size = cls.replace('py-', '');
      const paddingValue = parseSize(size);
      styles.paddingTop = paddingValue;
      styles.paddingBottom = paddingValue;
    } else if (cls === 'p-0') {
      styles.padding = '0';
    } else if (cls.startsWith('p-')) {
      const size = cls.replace('p-', '');
      const padding = parseSize(size);
      if (padding) {
        styles.padding = padding;
      }
    }
    
    // 마진
    if (cls.startsWith('m-')) {
      const size = cls.replace('m-', '');
      styles.margin = parseSize(size);
    }
    if (cls.startsWith('mx-')) {
      const size = cls.replace('mx-', '');
      styles.marginLeft = parseSize(size);
      styles.marginRight = parseSize(size);
    }
    if (cls.startsWith('my-')) {
      const size = cls.replace('my-', '');
      styles.marginTop = parseSize(size);
      styles.marginBottom = parseSize(size);
    }
    if (cls.startsWith('mt-')) styles.marginTop = parseSize(cls.replace('mt-', ''));
    if (cls.startsWith('mb-')) styles.marginBottom = parseSize(cls.replace('mb-', ''));
    if (cls.startsWith('ml-')) styles.marginLeft = parseSize(cls.replace('ml-', ''));
    if (cls.startsWith('mr-')) styles.marginRight = parseSize(cls.replace('mr-', ''));
    
    // 너비
    if (cls === 'w-full') styles.width = '100%';
    else if (cls === 'w-screen') styles.width = '100vw';
    else if (cls.startsWith('w-')) {
      const size = cls.replace('w-', '');
      styles.width = parseSize(size);
    }
    
    // 높이
    if (cls === 'h-full') styles.height = '100%';
    else if (cls === 'h-screen') styles.height = '100vh';
    else if (cls.startsWith('h-')) {
      const size = cls.replace('h-', '');
      styles.height = parseSize(size);
    }
    
    // 텍스트 정렬
    if (cls === 'text-center') styles.textAlign = 'center';
    else if (cls === 'text-left') styles.textAlign = 'left';
    else if (cls === 'text-right') styles.textAlign = 'right';
    else if (cls === 'text-justify') styles.textAlign = 'justify';
    
    // 폰트 크기
    if (cls === 'text-xs') styles.fontSize = '0.75rem';
    else if (cls === 'text-sm') styles.fontSize = '0.875rem';
    else if (cls === 'text-base') styles.fontSize = '1rem';
    else if (cls === 'text-lg') styles.fontSize = '1.125rem';
    else if (cls === 'text-xl') styles.fontSize = '1.25rem';
    else if (cls === 'text-2xl') styles.fontSize = '1.5rem';
    else if (cls === 'text-3xl') styles.fontSize = '1.875rem';
    else if (cls === 'text-4xl') styles.fontSize = '2.25rem';
    
    // 폰트 굵기
    if (cls === 'font-bold') styles.fontWeight = 'bold';
    else if (cls === 'font-semibold') styles.fontWeight = '600';
    else if (cls === 'font-medium') styles.fontWeight = '500';
    else if (cls === 'font-normal') styles.fontWeight = '400';
    else if (cls === 'font-light') styles.fontWeight = '300';
    
    // 그림자
    if (cls === 'shadow') styles.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
    else if (cls === 'shadow-md') styles.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    else if (cls === 'shadow-lg') styles.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
    else if (cls === 'shadow-xl') styles.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
    
    // 둥근 모서리
    if (cls === 'rounded') styles.borderRadius = '0.25rem';
    else if (cls === 'rounded-md') styles.borderRadius = '0.375rem';
    else if (cls === 'rounded-lg') styles.borderRadius = '0.5rem';
    else if (cls === 'rounded-xl') styles.borderRadius = '0.75rem';
    else if (cls === 'rounded-full') styles.borderRadius = '9999px';
    
    // Grid
    if (cls === 'grid') styles.display = 'grid';
    if (cls.startsWith('grid-cols-')) {
      const cols = cls.replace('grid-cols-', '');
      if (cols === '1') styles.gridTemplateColumns = 'repeat(1, minmax(0, 1fr))';
      else if (cols === '2') styles.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      else if (cols === '3') styles.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
      else if (cols === '4') styles.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      else if (cols === '12') styles.gridTemplateColumns = 'repeat(12, minmax(0, 1fr))';
    }
    if (cls.startsWith('md:grid-cols-')) {
      // 미디어 쿼리는 간단히 처리 (일단 기본값으로)
      const cols = cls.replace('md:grid-cols-', '');
      if (!styles.gridTemplateColumns) {
        if (cols === '3') styles.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
        else if (cols === '4') styles.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      }
    }
    if (cls.startsWith('gap-')) {
      const gap = cls.replace('gap-', '');
      styles.gap = parseSize(gap);
    }
    
    // Flexbox
    if (cls === 'flex') styles.display = 'flex';
    if (cls === 'flex-col') styles.flexDirection = 'column';
    if (cls === 'flex-row') styles.flexDirection = 'row';
    if (cls === 'flex-wrap') styles.flexWrap = 'wrap';
    if (cls === 'items-center') styles.alignItems = 'center';
    if (cls === 'items-start') styles.alignItems = 'flex-start';
    if (cls === 'items-end') styles.alignItems = 'flex-end';
    if (cls === 'justify-center') styles.justifyContent = 'center';
    if (cls === 'justify-between') styles.justifyContent = 'space-between';
    if (cls === 'justify-start') styles.justifyContent = 'flex-start';
    if (cls === 'justify-end') styles.justifyContent = 'flex-end';
    
    // 위치
    if (cls === 'relative') styles.position = 'relative';
    if (cls === 'absolute') styles.position = 'absolute';
    if (cls === 'fixed') styles.position = 'fixed';
    if (cls === 'sticky') styles.position = 'sticky';
    
    // Border
    if (cls === 'border') styles.borderWidth = '1px';
    if (cls.startsWith('border-')) {
      const borderSize = cls.replace('border-', '');
      if (borderSize === '2') styles.borderWidth = '2px';
      else if (borderSize.match(/^\d+$/)) {
        styles.borderWidth = `${borderSize}px`;
      } else {
        const borderColor = getColorValue(borderSize);
        if (borderColor) {
          styles.borderColor = borderColor;
        }
      }
    }
    if (cls.startsWith('border-') && cls.includes('-')) {
      const parts = cls.split('-');
      if (parts.length >= 3) {
        const colorName = parts.slice(1).join('-');
        const borderColor = getColorValue(colorName);
        if (borderColor) {
          styles.borderColor = borderColor;
        }
      }
    }
    
    // Container
    if (cls === 'container') {
      styles.maxWidth = '1280px';
      styles.marginLeft = 'auto';
      styles.marginRight = 'auto';
      styles.paddingLeft = '1rem';
      styles.paddingRight = '1rem';
    }
    
    // Min height
    if (cls === 'min-h-screen') styles.minHeight = '100vh';
    if (cls.startsWith('min-h-')) {
      const height = cls.replace('min-h-', '');
      if (height === 'screen') styles.minHeight = '100vh';
      else styles.minHeight = parseSize(height);
    }
    
    // Overflow
    if (cls === 'overflow-x-auto') styles.overflowX = 'auto';
    if (cls === 'overflow-hidden') styles.overflow = 'hidden';
    
    // List
    if (cls === 'list-disc') styles.listStyleType = 'disc';
    if (cls === 'list-inside') styles.listStylePosition = 'inside';
    
    // Space (자식 요소 간 간격)
    if (cls.startsWith('space-y-')) {
      const space = cls.replace('space-y-', '');
      const spaceValue = parseSize(space);
      if (spaceValue) {
        // 특별한 속성으로 저장 (CanvasRenderer에서 처리)
        (styles as any).__spaceY__ = spaceValue;
      }
    }
    if (cls.startsWith('space-x-')) {
      const space = cls.replace('space-x-', '');
      const spaceValue = parseSize(space);
      if (spaceValue) {
        // 특별한 속성으로 저장 (CanvasRenderer에서 처리)
        (styles as any).__spaceX__ = spaceValue;
      }
    }
  });
  
  return styles;
}

function parseSize(size: string): string {
  if (!size || size === '') return '';
  
  // 0은 특별 처리
  if (size === '0') return '0';
  
  // 정확한 매칭
  const sizeMap: Record<string, string> = {
    '0': '0',
    '0.5': '0.125rem', // 2px
    '1': '0.25rem',    // 4px
    '1.5': '0.375rem', // 6px
    '2': '0.5rem',     // 8px
    '2.5': '0.625rem', // 10px
    '3': '0.75rem',    // 12px
    '3.5': '0.875rem', // 14px
    '4': '1rem',       // 16px
    '5': '1.25rem',    // 20px
    '6': '1.5rem',     // 24px
    '7': '1.75rem',    // 28px
    '8': '2rem',       // 32px
    '9': '2.25rem',    // 36px
    '10': '2.5rem',    // 40px
    '11': '2.75rem',   // 44px
    '12': '3rem',      // 48px
    '14': '3.5rem',    // 56px
    '16': '4rem',      // 64px
    '20': '5rem',      // 80px
    '24': '6rem',      // 96px
    '28': '7rem',      // 112px
    '32': '8rem',      // 128px
    '36': '9rem',      // 144px
    '40': '10rem',     // 160px
    '44': '11rem',     // 176px
    '48': '12rem',     // 192px
    '52': '13rem',     // 208px
    '56': '14rem',     // 224px
    '60': '15rem',     // 240px
    '64': '16rem',     // 256px
    '72': '18rem',     // 288px
    '80': '20rem',     // 320px
    '96': '24rem',     // 384px
  };
  
  // 정확한 매칭이 있으면 반환
  if (sizeMap[size]) {
    return sizeMap[size];
  }
  
  // 숫자로 끝나는 경우 (예: p-4, m-6)
  const match = size.match(/^(\d+(?:\.\d+)?)$/);
  if (match) {
    const num = parseFloat(match[1]);
    return `${num * 0.25}rem`;
  }
  
  // 기본값 반환 (예: auto, full 등)
  return size;
}

// Tailwind 색상 값을 실제 CSS 색상으로 변환
function getColorValue(color: string): string | null {
  const colorMap: Record<string, string> = {
    // Blue
    'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd',
    'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'blue-700': '#1d4ed8',
    'blue-800': '#1e40af', 'blue-900': '#1e3a8a',
    // Purple
    'purple-50': '#faf5ff', 'purple-100': '#f3e8ff', 'purple-200': '#e9d5ff', 'purple-300': '#d8b4fe',
    'purple-400': '#c084fc', 'purple-500': '#a855f7', 'purple-600': '#9333ea', 'purple-700': '#7e22ce',
    'purple-800': '#6b21a8', 'purple-900': '#581c87',
    // Pink
    'pink-50': '#fdf2f8', 'pink-100': '#fce7f3', 'pink-200': '#fbcfe8', 'pink-300': '#f9a8d4',
    'pink-400': '#f472b6', 'pink-500': '#ec4899', 'pink-600': '#db2777', 'pink-700': '#be185d',
    'pink-800': '#9f1239', 'pink-900': '#831843',
    // Gray
    'gray-50': '#f9fafb', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db',
    'gray-400': '#9ca3af', 'gray-500': '#6b7280', 'gray-600': '#4b5563', 'gray-700': '#374151',
    'gray-800': '#1f2937', 'gray-900': '#111827',
    // Red
    'red-50': '#fef2f2', 'red-100': '#fee2e2', 'red-200': '#fecaca', 'red-300': '#fca5a5',
    'red-400': '#f87171', 'red-500': '#ef4444', 'red-600': '#dc2626', 'red-700': '#b91c1c',
    'red-800': '#991b1b', 'red-900': '#7f1d1d',
    // Green
    'green-50': '#f0fdf4', 'green-100': '#dcfce7', 'green-200': '#bbf7d0', 'green-300': '#86efac',
    'green-400': '#4ade80', 'green-500': '#22c55e', 'green-600': '#16a34a', 'green-700': '#15803d',
    'green-800': '#166534', 'green-900': '#14532d',
    // Yellow
    'yellow-50': '#fefce8', 'yellow-100': '#fef9c3', 'yellow-200': '#fef08a', 'yellow-300': '#fde047',
    'yellow-400': '#facc15', 'yellow-500': '#eab308', 'yellow-600': '#ca8a04', 'yellow-700': '#a16207',
    'yellow-800': '#854d0e', 'yellow-900': '#713f12',
    // Orange
    'orange-50': '#fff7ed', 'orange-100': '#ffedd5', 'orange-200': '#fed7aa', 'orange-300': '#fdba74',
    'orange-400': '#fb923c', 'orange-500': '#f97316', 'orange-600': '#ea580c', 'orange-700': '#c2410c',
    'orange-800': '#9a3412', 'orange-900': '#7c2d12',
    // Slate
    'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1',
    'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155',
    'slate-800': '#1e293b', 'slate-900': '#0f172a',
    // 기본 색상
    'white': '#ffffff', 'black': '#000000', 'transparent': 'transparent',
  };
  
  return colorMap[color] || null;
}

