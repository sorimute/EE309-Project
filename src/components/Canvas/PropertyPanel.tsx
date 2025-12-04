import React from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import './PropertyPanel.css';

export function PropertyPanel() {
  const { selectedElementId } = useCanvasStore();

  if (!selectedElementId) {
    return null;
  }

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <h3>속성</h3>
      </div>
      <div className="property-panel-content">
        <div className="property-group">
          <label>요소 ID</label>
          <div className="property-value">{selectedElementId}</div>
        </div>
        {/* 나중에 추가: 위치, 크기, 색상 등 속성 편집 */}
      </div>
    </div>
  );
}

