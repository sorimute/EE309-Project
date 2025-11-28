import { useState } from 'react';
import { Shape } from '../types';
import { DEFAULT_SHAPE_COLOR } from '../constants/colors';
import { ShapeType } from '../types';

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [shapeColor, setShapeColor] = useState(DEFAULT_SHAPE_COLOR);
  const [shapeWidth, setShapeWidth] = useState(100);
  const [shapeHeight, setShapeHeight] = useState(100);
  const [shapeBorderRadius, setShapeBorderRadius] = useState(0);
  const [borderRadiusInputValue, setBorderRadiusInputValue] = useState<string>("0");
  const [pendingShapeType, setPendingShapeType] = useState<ShapeType | null>(null);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showShapeColorMenu, setShowShapeColorMenu] = useState(false);
  const [showEffectsMenu, setShowEffectsMenu] = useState(false);
  const [showOpacityControl, setShowOpacityControl] = useState(false);
  const [showGlowControl, setShowGlowControl] = useState(false);
  const [showStrokeMenu, setShowStrokeMenu] = useState(false);
  const [showBringForwardMenu, setShowBringForwardMenu] = useState(false);
  const [showSendBackwardMenu, setShowSendBackwardMenu] = useState(false);

  return {
    shapes,
    setShapes,
    selectedShape,
    setSelectedShape,
    shapeColor,
    setShapeColor,
    shapeWidth,
    setShapeWidth,
    shapeHeight,
    setShapeHeight,
    shapeBorderRadius,
    setShapeBorderRadius,
    borderRadiusInputValue,
    setBorderRadiusInputValue,
    pendingShapeType,
    setPendingShapeType,
    showShapeMenu,
    setShowShapeMenu,
    showShapeColorMenu,
    setShowShapeColorMenu,
    showEffectsMenu,
    setShowEffectsMenu,
    showOpacityControl,
    setShowOpacityControl,
    showGlowControl,
    setShowGlowControl,
    showStrokeMenu,
    setShowStrokeMenu,
    showBringForwardMenu,
    setShowBringForwardMenu,
    showSendBackwardMenu,
    setShowSendBackwardMenu,
  };
}


