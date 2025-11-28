import { useState } from 'react';
import { Group } from '../types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupDragStart, setGroupDragStart] = useState<{ 
    groupX: number; 
    groupY: number; 
    shapePositions: Map<number, { x: number; y: number }>; 
    textPositions: Map<number, { x: number; y: number }> 
  } | null>(null);

  return {
    groups,
    setGroups,
    selectedGroup,
    setSelectedGroup,
    groupDragStart,
    setGroupDragStart,
  };
}


