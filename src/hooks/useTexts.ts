import { useState, useRef } from 'react';
import { Text } from '../types';

export function useTexts() {
  const [texts, setTexts] = useState<Text[]>([]);
  const [selectedText, setSelectedText] = useState<Text | null>(null);
  const [textColor, setTextColor] = useState("#000000");
  const [pendingText, setPendingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const textInputRef = useRef<HTMLDivElement>(null);

  return {
    texts,
    setTexts,
    selectedText,
    setSelectedText,
    textColor,
    setTextColor,
    pendingText,
    setPendingText,
    editingTextId,
    setEditingTextId,
    showTextColorMenu,
    setShowTextColorMenu,
    textInputRef,
  };
}


