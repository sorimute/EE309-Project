class ShapeEditor {
    constructor() {
        this.shapes = [];
        this.selectedShape = null;
        this.shapeIdCounter = 0;
        this.isDragging = false;
        this.isResizing = false;
        this.isCreating = false;
        this.currentShapeType = 'rectangle';
        this.createStartPos = null;
        this.dragOffset = { x: 0, y: 0 };
        this.codeUpdateTimeout = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('canvas');
        this.xmlCode = document.getElementById('xmlCode');
        this.cssCode = document.getElementById('cssCode');
        this.formattingToolbar = document.getElementById('formattingToolbar');
        
        // Toggle main shape selector
        const toggleBtn = document.getElementById('toggleShapes');
        const shapeSelector = document.getElementById('shapeSelector');
        toggleBtn.addEventListener('click', () => {
            shapeSelector.classList.toggle('collapsed');
            toggleBtn.classList.toggle('collapsed');
        });
        
        // Shape selection buttons - toggle on/off
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clickedShape = e.target.dataset.shape;
                const isCurrentlyActive = e.target.classList.contains('active');
                
                // If clicking the same active button, deselect it
                if (isCurrentlyActive) {
                    e.target.classList.remove('active');
                    this.currentShapeType = null;
                } else {
                    // Otherwise, select the new button
                    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.currentShapeType = clickedShape;
                }
            });
        });
        
        // Formatting toolbar controls
        document.getElementById('shapeColor').addEventListener('input', (e) => this.applyFillColor(e.target.value));
        document.getElementById('borderColor').addEventListener('input', (e) => this.applyBorderColor(e.target.value));
        document.getElementById('borderWidth').addEventListener('input', (e) => this.applyBorderWidth(e.target.value));
        document.getElementById('opacity').addEventListener('input', (e) => {
            document.getElementById('opacityValue').textContent = e.target.value + '%';
            this.applyOpacity(e.target.value / 100);
        });
        
        // Text formatting controls
        document.getElementById('textFontFamily').addEventListener('change', (e) => this.applyTextFontFamily(e.target.value));
        document.getElementById('textFontSize').addEventListener('input', (e) => this.applyTextFontSize(e.target.value));
        document.getElementById('textColor').addEventListener('input', (e) => this.applyTextColor(e.target.value));
        document.getElementById('textBoldBtn').addEventListener('click', () => this.toggleTextBold());
        document.getElementById('textItalicBtn').addEventListener('click', () => this.toggleTextItalic());
        
        // Text alignment controls
        document.getElementById('textAlignLeftBtn').addEventListener('click', () => this.applyTextAlign('left'));
        document.getElementById('textAlignCenterBtn').addEventListener('click', () => this.applyTextAlign('center'));
        document.getElementById('textAlignRightBtn').addEventListener('click', () => this.applyTextAlign('right'));
        document.getElementById('textAlignTopBtn').addEventListener('click', () => this.applyTextVerticalAlign('top'));
        document.getElementById('textAlignMiddleBtn').addEventListener('click', () => this.applyTextVerticalAlign('middle'));
        document.getElementById('textAlignBottomBtn').addEventListener('click', () => this.applyTextVerticalAlign('bottom'));
        
        // Keyboard shortcuts for text formatting
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b' && this.selectedShape) {
                e.preventDefault();
                this.toggleTextBold();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'i' && this.selectedShape) {
                e.preventDefault();
                this.toggleTextItalic();
            }
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Canvas events for drag-to-create
        this.canvas.addEventListener('mousedown', (e) => this.startCreate(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Canvas click to deselect and stop text editing
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas || e.target.classList.contains('canvas-hint')) {
                // Stop any active text editing
                const activeTextEditor = document.querySelector('.shape-text[contenteditable="true"]');
                if (activeTextEditor) {
                    activeTextEditor.blur();
                }
                this.deselectShape();
            }
        });
        
        // Code editor events for bidirectional sync
        this.xmlCode.addEventListener('input', () => this.onCodeChange('xml'));
        this.cssCode.addEventListener('input', () => this.onCodeChange('css'));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedShape) {
                this.deleteShape(this.selectedShape);
            }
        });
        
        // Clear canvas
        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        
        this.updateCode();
    }
    
    startCreate(e) {
        if (e.target !== this.canvas && !e.target.classList.contains('canvas-hint')) return;
        if (!this.currentShapeType) return; // Don't create if no shape is selected
        
        this.isCreating = true;
        const rect = this.canvas.getBoundingClientRect();
        this.createStartPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Remove hint after first shape
        const hint = this.canvas.querySelector('.canvas-hint');
        if (hint) hint.style.display = 'none';
        
        e.preventDefault();
    }
    
    onMouseMove(e) {
        if (this.isCreating && this.createStartPos) {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            const width = Math.abs(currentX - this.createStartPos.x);
            const height = Math.abs(currentY - this.createStartPos.y);
            const left = Math.min(this.createStartPos.x, currentX);
            const top = Math.min(this.createStartPos.y, currentY);
            
            // Create or update preview shape
            const newWidth = Math.max(20, width);
            const newHeight = Math.max(20, height);
            
            if (!this.previewShape) {
                this.previewShape = this.createShape(this.currentShapeType, left, top, newWidth, newHeight);
                this.canvas.appendChild(this.previewShape);
            } else {
                this.previewShape.style.left = `${left}px`;
                this.previewShape.style.top = `${top}px`;
                
                if (this.isTriangleType(this.previewShape.dataset.type)) {
                    this.updateTriangleSize(this.previewShape, newWidth, newHeight);
                } else {
                    this.previewShape.style.width = `${newWidth}px`;
                    this.previewShape.style.height = `${newHeight}px`;
                }
            }
        } else if (this.isDragging && this.selectedShape) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.dragOffset.x;
            const y = e.clientY - rect.top - this.dragOffset.y;
            
            this.selectedShape.style.left = `${Math.max(0, x)}px`;
            this.selectedShape.style.top = `${Math.max(0, y)}px`;
            
            this.updateCode();
        } else if (this.isResizing && this.selectedShape) {
            const rect = this.canvas.getBoundingClientRect();
            const dx = e.clientX - rect.left - this.resizeStartX;
            const dy = e.clientY - rect.top - this.resizeStartY;
            
            const newWidth = Math.max(20, this.resizeStartWidth + dx);
            const newHeight = Math.max(20, this.resizeStartHeight + dy);
            
            if (this.isTriangleType(this.selectedShape.dataset.type)) {
                this.updateTriangleSize(this.selectedShape, newWidth, newHeight);
            } else {
                this.selectedShape.style.width = `${newWidth}px`;
                this.selectedShape.style.height = `${newHeight}px`;
            }
            
            this.updateCode();
        }
    }
    
    onMouseUp(e) {
        if (this.isCreating && this.previewShape) {
            // Finalize the shape
            let width, height;
            
            // For triangles, get dimensions from dataset
            if (this.isTriangleType(this.previewShape.dataset.type)) {
                width = parseInt(this.previewShape.dataset.originalWidth) || 0;
                height = parseInt(this.previewShape.dataset.originalHeight) || 0;
            } else {
                width = parseInt(this.previewShape.style.width) || 0;
                height = parseInt(this.previewShape.style.height) || 0;
            }
            
            if (width > 10 && height > 10) {
                this.previewShape.classList.remove('preview');
                this.shapes.push(this.previewShape);
                this.selectShape(this.previewShape);
                this.updateCode();
            } else {
                this.previewShape.remove();
            }
            
            this.previewShape = null;
        }
        
        this.isCreating = false;
        this.isDragging = false;
        this.isResizing = false;
        this.createStartPos = null;
    }
    
    createShape(type, x, y, width, height) {
        const shape = document.createElement('div');
        shape.className = `shape shape-${type} preview`;
        shape.dataset.id = `shape-${this.shapeIdCounter++}`;
        shape.dataset.type = type;
        
        // Default styles
        shape.style.left = `${x}px`;
        shape.style.top = `${y}px`;
        shape.style.width = `${width}px`;
        shape.style.height = `${height}px`;
        shape.style.backgroundColor = '#3498db';
        shape.style.borderColor = '#2980b9';
        shape.style.borderWidth = '2px';
        shape.style.borderStyle = 'solid';
        shape.dataset.actualBorderColor = '#2980b9'; // Store initial border color
        shape.style.opacity = '1';
        shape.style.display = 'flex';
        shape.style.flexDirection = 'column'; // Column for vertical alignment
        shape.style.alignItems = 'stretch'; // Stretch horizontally
        shape.style.justifyContent = 'center'; // Center vertically by default
        shape.style.position = 'absolute';
        
        // Create text content element
        const textContent = document.createElement('div');
        textContent.className = 'shape-text';
        textContent.contentEditable = false;
        textContent.style.width = '100%';
        textContent.style.flex = '0 0 auto'; // Don't fill container, auto-size
        textContent.style.minHeight = '20px';
        textContent.style.padding = '5px';
        textContent.style.outline = 'none';
        textContent.style.wordWrap = 'break-word';
        textContent.style.overflow = 'hidden';
        textContent.style.fontFamily = 'Arial';
        textContent.style.fontSize = '16px';
        textContent.style.color = '#000000';
        textContent.style.textAlign = 'center';
        textContent.style.userSelect = 'none';
        textContent.textContent = '';
        textContent.dataset.textAlign = 'center';
        // Vertical alignment is stored on shape, not textContent
        shape.dataset.verticalAlign = 'middle';
        
        shape.appendChild(textContent);
        
        // Shape-specific styling
        this.applyShapeType(shape, type);
        
        // Make draggable and resizable
        this.makeDraggable(shape);
        this.makeResizable(shape);
        
        // Make selectable
        shape.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectShape(shape);
        });
        
        // Double-click to edit text
        shape.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startTextEditing(shape);
        });
        
        return shape;
    }
    
    startTextEditing(shape) {
        const textContent = shape.querySelector('.shape-text');
        if (!textContent) return;
        
        this.selectShape(shape);
        textContent.contentEditable = true;
        textContent.style.userSelect = 'text';
        textContent.style.cursor = 'text';
        
        // Focus and place cursor
        textContent.focus();
        
        // Move cursor to end if there's text
        if (textContent.textContent.length > 0) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(textContent);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        // Update code on input
        textContent.addEventListener('input', () => {
            this.updateCode();
        });
        
        // Stop editing on blur
        const stopEditing = () => {
            textContent.contentEditable = false;
            textContent.style.userSelect = 'none';
            textContent.style.cursor = 'default';
            this.updateCode();
        };
        
        textContent.addEventListener('blur', stopEditing, { once: true });
        
        // Stop editing on Escape
        textContent.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                textContent.blur();
                e.preventDefault();
            }
        });
    }
    
    applyShapeType(shape, type) {
        // Remove previous shape type classes
        shape.className = `shape shape-${type}`;
        
        const width = parseInt(shape.style.width) || 50;
        const height = parseInt(shape.style.height) || 50;
        const bgColor = shape.style.backgroundColor || '#3498db';
        
        // Reset transform and clip-path
        shape.style.transform = '';
        shape.style.clipPath = '';
        shape.style.borderRadius = '';
        shape.style.borderLeft = '';
        shape.style.borderRight = '';
        shape.style.borderTop = '';
        shape.style.borderBottom = '';
        shape.style.borderStyle = 'solid';
        
        switch(type) {
            // Basic Shapes
            case 'rectangle':
                shape.style.borderRadius = '0';
                break;
            case 'square':
                shape.style.borderRadius = '0';
                // Make it square
                const size = Math.min(width, height);
                shape.style.width = `${size}px`;
                shape.style.height = `${size}px`;
                break;
            case 'circle':
                shape.style.borderRadius = '50%';
                break;
            case 'ellipse':
                shape.style.borderRadius = '50%';
                break;
            case 'rounded-rect':
                shape.style.borderRadius = '10px';
                break;
            
            // Triangles
            case 'triangle':
                shape.dataset.originalWidth = width;
                shape.dataset.originalHeight = height;
                shape.style.width = '0';
                shape.style.height = '0';
                shape.style.borderLeft = `${width / 2}px solid transparent`;
                shape.style.borderRight = `${width / 2}px solid transparent`;
                shape.style.borderBottom = `${height}px solid ${bgColor}`;
                shape.style.backgroundColor = 'transparent';
                shape.style.borderTop = 'none';
                break;
            case 'right-triangle':
                shape.dataset.originalWidth = width;
                shape.dataset.originalHeight = height;
                shape.style.width = '0';
                shape.style.height = '0';
                shape.style.borderTop = `${height}px solid ${bgColor}`;
                shape.style.borderRight = `${width}px solid transparent`;
                shape.style.borderBottom = 'none';
                shape.style.borderLeft = 'none';
                shape.style.backgroundColor = 'transparent';
                break;
            case 'triangle-down':
                shape.dataset.originalWidth = width;
                shape.dataset.originalHeight = height;
                shape.style.width = '0';
                shape.style.height = '0';
                shape.style.borderTop = `${height}px solid ${bgColor}`;
                shape.style.borderLeft = `${width / 2}px solid transparent`;
                shape.style.borderRight = `${width / 2}px solid transparent`;
                shape.style.borderBottom = 'none';
                shape.style.backgroundColor = 'transparent';
                break;
            case 'triangle-left':
                shape.dataset.originalWidth = width;
                shape.dataset.originalHeight = height;
                shape.style.width = '0';
                shape.style.height = '0';
                shape.style.borderTop = `${height / 2}px solid transparent`;
                shape.style.borderBottom = `${height / 2}px solid transparent`;
                shape.style.borderRight = `${width}px solid ${bgColor}`;
                shape.style.borderLeft = 'none';
                shape.style.backgroundColor = 'transparent';
                break;
            
            // Polygons
            case 'diamond':
                shape.style.transform = 'rotate(45deg)';
                break;
            case 'pentagon':
                shape.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
                break;
            case 'hexagon':
                shape.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
                break;
            case 'octagon':
                shape.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
                break;
            case 'parallelogram':
                shape.style.transform = 'skew(-20deg)';
                break;
            case 'trapezoid':
                shape.style.clipPath = 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)';
                break;
            
            // Stars & Banners
            case 'star':
                shape.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                break;
            case 'star-4':
                shape.style.clipPath = 'polygon(50% 0%, 61% 35%, 100% 35%, 50% 100%, 0% 35%, 39% 35%)';
                break;
            case 'star-6':
                shape.style.clipPath = 'polygon(50% 0%, 61% 25%, 98% 35%, 82% 62%, 98% 90%, 50% 100%, 2% 90%, 18% 62%, 2% 35%, 39% 25%)';
                break;
            case 'burst':
                shape.style.clipPath = 'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)';
                break;
            case 'banner':
                shape.style.clipPath = 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)';
                break;
            
            // Arrows
            case 'arrow-right':
                shape.style.clipPath = 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)';
                break;
            case 'arrow-left':
                shape.style.clipPath = 'polygon(40% 0%, 100% 50%, 40% 100%, 40% 80%, 0% 80%, 0% 20%, 40% 20%)';
                break;
            case 'arrow-up':
                shape.style.clipPath = 'polygon(50% 0%, 100% 50%, 80% 50%, 80% 100%, 20% 100%, 20% 50%, 0% 50%)';
                break;
            case 'arrow-down':
                shape.style.clipPath = 'polygon(50% 100%, 0% 50%, 20% 50%, 20% 0%, 80% 0%, 80% 50%, 100% 50%)';
                break;
            case 'arrow-curved':
                shape.style.clipPath = 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)';
                shape.style.transform = 'rotate(45deg)';
                break;
            
            // Flowchart
            case 'flowchart-process':
                shape.style.borderRadius = '0';
                break;
            case 'flowchart-decision':
                shape.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                break;
            case 'flowchart-data':
                shape.style.clipPath = 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)';
                break;
            case 'flowchart-predefined':
                shape.style.clipPath = 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)';
                break;
            case 'flowchart-internal-storage':
                shape.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 70%, 85% 100%, 0% 100%)';
                break;
            
            // Callouts
            case 'callout-rect':
                shape.style.borderRadius = '5px';
                shape.style.position = 'relative';
                // Add a small triangle pointer
                break;
            case 'callout-rounded':
                shape.style.borderRadius = '20px';
                break;
            case 'callout-cloud':
                shape.style.borderRadius = '50px';
                shape.style.clipPath = 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 60%, 80% 80%, 50% 100%, 20% 80%, 0% 60%, 0% 20%)';
                break;
            case 'callout-oval':
                shape.style.borderRadius = '50%';
                break;
            
            default: // rectangle
                shape.style.borderRadius = '0';
                break;
        }
    }
    
    updateTriangleSize(shape, width, height) {
        const bgColor = shape.style.borderBottomColor || shape.style.borderTopColor || 
                       shape.style.borderRightColor || shape.dataset.triangleColor || '#3498db';
        shape.dataset.originalWidth = width;
        shape.dataset.originalHeight = height;
        shape.dataset.triangleColor = bgColor;
        
        const type = shape.dataset.type;
        if (type === 'triangle') {
            shape.style.borderLeft = `${width / 2}px solid transparent`;
            shape.style.borderRight = `${width / 2}px solid transparent`;
            shape.style.borderBottom = `${height}px solid ${bgColor}`;
            shape.style.borderTop = 'none';
        } else if (type === 'right-triangle') {
            shape.style.borderTop = `${height}px solid ${bgColor}`;
            shape.style.borderRight = `${width}px solid transparent`;
            shape.style.borderBottom = 'none';
            shape.style.borderLeft = 'none';
        } else if (type === 'triangle-down') {
            shape.style.borderTop = `${height}px solid ${bgColor}`;
            shape.style.borderLeft = `${width / 2}px solid transparent`;
            shape.style.borderRight = `${width / 2}px solid transparent`;
            shape.style.borderBottom = 'none';
        } else if (type === 'triangle-left') {
            shape.style.borderTop = `${height / 2}px solid transparent`;
            shape.style.borderBottom = `${height / 2}px solid transparent`;
            shape.style.borderRight = `${width}px solid ${bgColor}`;
            shape.style.borderLeft = 'none';
        }
    }
    
    isTriangleType(type) {
        return ['triangle', 'right-triangle', 'triangle-down', 'triangle-left'].includes(type);
    }
    
    makeDraggable(shape) {
        shape.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) return;
            if (e.target.classList.contains('shape-text') && e.target.contentEditable === 'true') return;
            
            this.isDragging = true;
            this.selectShape(shape);
            
            const rect = shape.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            e.preventDefault();
        });
    }
    
    makeResizable(shape) {
        if (!shape.querySelector('.resize-handle')) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            shape.appendChild(resizeHandle);
        }
        
        const resizeHandle = shape.querySelector('.resize-handle');
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.isResizing = true;
            this.selectShape(shape);
            
            const rect = this.canvas.getBoundingClientRect();
            this.resizeStartX = e.clientX - rect.left;
            this.resizeStartY = e.clientY - rect.top;
            
            // For triangles, use original dimensions
            if (this.isTriangleType(shape.dataset.type)) {
                this.resizeStartWidth = parseInt(shape.dataset.originalWidth) || 100;
                this.resizeStartHeight = parseInt(shape.dataset.originalHeight) || 100;
            } else {
                this.resizeStartWidth = parseInt(shape.style.width) || 100;
                this.resizeStartHeight = parseInt(shape.style.height) || 100;
            }
            
            e.preventDefault();
        });
    }
    
    selectShape(shape) {
        // Stop any active text editing on previously selected shape
        if (this.selectedShape) {
            // Restore the actual border color from data attribute
            const storedBorderColor = this.selectedShape.dataset.actualBorderColor;
            this.selectedShape.classList.remove('selected');
            
            // Restore the border color explicitly
            if (storedBorderColor) {
                this.selectedShape.style.borderColor = storedBorderColor;
            }
            
            const prevTextContent = this.selectedShape.querySelector('.shape-text[contenteditable="true"]');
            if (prevTextContent) {
                prevTextContent.blur();
            }
        }
        
        // Stop any other active text editing
        const activeTextEditor = document.querySelector('.shape-text[contenteditable="true"]');
        if (activeTextEditor && activeTextEditor !== shape.querySelector('.shape-text')) {
            activeTextEditor.blur();
        }
        
        // Store the current border color in data attribute before adding selected class
        // This preserves it even when the selected class overrides it visually
        // Prioritize data attribute over style/computed style to avoid reading selection color
        const currentBorderColor = shape.dataset.actualBorderColor || shape.style.borderColor || window.getComputedStyle(shape).borderColor;
        if (currentBorderColor && currentBorderColor !== 'rgb(231, 76, 60)' && currentBorderColor !== '#e74c3c') {
            shape.dataset.actualBorderColor = currentBorderColor;
        }
        
        this.selectedShape = shape;
        shape.classList.add('selected');
        
        // Show formatting toolbar
        this.formattingToolbar.style.display = 'flex';
        this.updateFormattingToolbar(shape);
        
        // Show text formatting if shape has text
        const textContent = shape.querySelector('.shape-text');
        const textFormattingSection = document.getElementById('textFormattingSection');
        if (textContent && textFormattingSection) {
            textFormattingSection.style.display = 'flex';
            this.updateTextFormattingToolbar(shape);
        } else if (textFormattingSection) {
            textFormattingSection.style.display = 'none';
        }
    }
    
    updateTextFormattingToolbar(shape) {
        const textContent = shape.querySelector('.shape-text');
        if (!textContent) return;
        
        const computedStyle = window.getComputedStyle(textContent);
        
        // Get font family
        const fontFamily = textContent.style.fontFamily || computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        const fontSelect = document.getElementById('textFontFamily');
        const availableFonts = Array.from(fontSelect.options).map(opt => opt.value);
        const matchedFont = availableFonts.find(font => font.toLowerCase() === fontFamily.toLowerCase()) || availableFonts[0] || 'Arial';
        fontSelect.value = matchedFont;
        
        // Get font size
        const fontSize = parseInt(textContent.style.fontSize || computedStyle.fontSize) || 16;
        document.getElementById('textFontSize').value = fontSize;
        
        // Get text color
        const textColor = textContent.style.color || computedStyle.color || '#000000';
        document.getElementById('textColor').value = this.colorToHex(textColor);
        
        // Get bold state
        const fontWeight = computedStyle.fontWeight;
        const isBold = fontWeight === 'bold' || (parseInt(fontWeight) >= 600);
        document.getElementById('textBoldBtn').classList.toggle('active', isBold);
        
        // Get italic state
        const isItalic = computedStyle.fontStyle === 'italic';
        document.getElementById('textItalicBtn').classList.toggle('active', isItalic);
        
        // Get text alignment
        const textAlign = computedStyle.textAlign || 'center';
        document.querySelectorAll('[data-align]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === textAlign);
        });
        
        // Get vertical alignment - read from SHAPE container, not textContent
        const shapeStyle = window.getComputedStyle(shape);
        let verticalAlign = 'middle';
        const justifyContent = shape.style.justifyContent || shapeStyle.justifyContent;
        if (justifyContent === 'flex-start') {
            verticalAlign = 'top';
        } else if (justifyContent === 'center') {
            verticalAlign = 'middle';
        } else if (justifyContent === 'flex-end') {
            verticalAlign = 'bottom';
        }
        // Also check dataset as fallback
        if (shape.dataset.verticalAlign) {
            verticalAlign = shape.dataset.verticalAlign;
        }
        document.querySelectorAll('[data-valign]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.valign === verticalAlign);
        });
    }
    
    applyTextFontFamily(fontFamily) {
        if (!this.selectedShape) return;
        const textContent = this.selectedShape.querySelector('.shape-text');
        if (!textContent) return;
        
        textContent.style.fontFamily = fontFamily;
        this.updateCode();
    }
    
    applyTextFontSize(size) {
        if (!this.selectedShape) return;
        const textContent = this.selectedShape.querySelector('.shape-text');
        if (!textContent) return;
        
        textContent.style.fontSize = `${size}px`;
        this.updateCode();
    }
    
    applyTextColor(color) {
        if (!this.selectedShape) return;
        const textContent = this.selectedShape.querySelector('.shape-text');
        if (!textContent) return;
        
        textContent.style.color = color;
        this.updateCode();
    }
    
    toggleTextBold() {
        if (!this.selectedShape) return;
        const textContent = this.selectedShape.querySelector('.shape-text');
        if (!textContent) return;
        
        const isBold = textContent.style.fontWeight === 'bold';
        textContent.style.fontWeight = isBold ? 'normal' : 'bold';
        
        document.getElementById('textBoldBtn').classList.toggle('active', !isBold);
        this.updateCode();
    }
    
    toggleTextItalic() {
        if (!this.selectedShape) return;
        const textContent = this.selectedShape.querySelector('.shape-text');
        if (!textContent) return;
        
        const isItalic = textContent.style.fontStyle === 'italic';
        textContent.style.fontStyle = isItalic ? 'normal' : 'italic';
        
        document.getElementById('textItalicBtn').classList.toggle('active', !isItalic);
        this.updateCode();
    }
    
    applyTextAlign(align) {
        if (!this.selectedShape) return;
        const textContent = this.selectedShape.querySelector('.shape-text');
        if (!textContent) return;
        
        textContent.style.textAlign = align;
        textContent.dataset.textAlign = align;
        
        // Update button states
        document.querySelectorAll('[data-align]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === align);
        });
        
        this.updateCode();
    }
    
    applyTextVerticalAlign(align) {
        if (!this.selectedShape) return;
        const shape = this.selectedShape;
        const textContent = shape.querySelector('.shape-text');
        if (!textContent) return;
        
        // Ensure shape uses flexbox column layout
        shape.style.display = 'flex';
        shape.style.flexDirection = 'column';
        
        // Make textContent auto-size so justify-content can position it
        textContent.style.flex = '0 0 auto';
        textContent.style.width = '100%';
        
        // Apply vertical alignment to the SHAPE container
        if (align === 'top') {
            shape.style.justifyContent = 'flex-start';
        } else if (align === 'middle') {
            shape.style.justifyContent = 'center';
        } else if (align === 'bottom') {
            shape.style.justifyContent = 'flex-end';
        }
        
        // Store alignment in dataset for reference
        shape.dataset.verticalAlign = align;
        
        // Update button states
        document.querySelectorAll('[data-valign]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.valign === align);
        });
        
        this.updateCode();
    }
    
    updateFormattingToolbar(shape) {
        const computedStyle = window.getComputedStyle(shape);
        
        // Get fill color
        let bgColor;
        if (this.isTriangleType(shape.dataset.type)) {
            const type = shape.dataset.type;
            if (type === 'triangle') {
                bgColor = shape.style.borderBottomColor || shape.dataset.triangleColor || '#3498db';
            } else if (type === 'right-triangle') {
                bgColor = shape.style.borderTopColor || shape.dataset.triangleColor || '#3498db';
            } else if (type === 'triangle-down') {
                bgColor = shape.style.borderTopColor || shape.dataset.triangleColor || '#3498db';
            } else if (type === 'triangle-left') {
                bgColor = shape.style.borderRightColor || shape.dataset.triangleColor || '#3498db';
            } else {
                bgColor = shape.dataset.triangleColor || '#3498db';
            }
        } else {
            bgColor = shape.style.backgroundColor || computedStyle.backgroundColor;
        }
        document.getElementById('shapeColor').value = this.colorToHex(bgColor);
        
        // Get border color - prioritize data attribute to avoid reading selection color
        const borderColor = shape.dataset.actualBorderColor || shape.style.borderColor || computedStyle.borderColor;
        // Convert to hex, but skip if it's the selection color
        const hexColor = this.colorToHex(borderColor);
        if (hexColor !== '#e74c3c') {
            document.getElementById('borderColor').value = hexColor;
        } else if (shape.dataset.actualBorderColor) {
            // If computed shows selection color but we have stored color, use stored
            document.getElementById('borderColor').value = this.colorToHex(shape.dataset.actualBorderColor);
        } else {
            document.getElementById('borderColor').value = hexColor;
        }
        
        // Get border width
        const borderWidth = parseInt(shape.style.borderWidth || computedStyle.borderWidth) || 2;
        document.getElementById('borderWidth').value = borderWidth;
        
        // Get opacity
        const opacity = parseFloat(shape.style.opacity || computedStyle.opacity) * 100;
        document.getElementById('opacity').value = opacity;
        document.getElementById('opacityValue').textContent = Math.round(opacity) + '%';
    }
    
    colorToHex(color) {
        if (color.startsWith('#')) return color;
        if (color === 'transparent') return '#000000';
        
        // Handle rgb/rgba
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
        
        return '#3498db';
    }
    
    applyFillColor(color) {
        if (!this.selectedShape) return;
        
        if (this.isTriangleType(this.selectedShape.dataset.type)) {
            // For triangles, update the appropriate border color
            const type = this.selectedShape.dataset.type;
            if (type === 'triangle') {
                this.selectedShape.style.borderBottomColor = color;
            } else if (type === 'right-triangle') {
                this.selectedShape.style.borderTopColor = color;
            } else if (type === 'triangle-down') {
                this.selectedShape.style.borderTopColor = color;
            } else if (type === 'triangle-left') {
                this.selectedShape.style.borderRightColor = color;
            }
            this.selectedShape.dataset.triangleColor = color;
        } else {
            this.selectedShape.style.backgroundColor = color;
        }
        
        this.updateCode();
    }
    
    applyBorderColor(color) {
        if (!this.selectedShape) return;
        
        this.selectedShape.style.borderColor = color;
        // Store in data attribute to preserve it when selected class is applied
        this.selectedShape.dataset.actualBorderColor = color;
        this.updateCode();
    }
    
    applyBorderWidth(width) {
        if (!this.selectedShape) return;
        
        this.selectedShape.style.borderWidth = `${width}px`;
        this.updateCode();
    }
    
    applyOpacity(opacity) {
        if (!this.selectedShape) return;
        
        this.selectedShape.style.opacity = opacity;
        this.updateCode();
    }
    
    deselectShape() {
        if (this.selectedShape) {
            // Restore the actual border color from data attribute
            const storedBorderColor = this.selectedShape.dataset.actualBorderColor;
            
            // Remove selected class
            this.selectedShape.classList.remove('selected');
            
            // Restore the border color explicitly
            if (storedBorderColor) {
                this.selectedShape.style.borderColor = storedBorderColor;
            }
            
            this.selectedShape = null;
        }
        this.formattingToolbar.style.display = 'none';
    }
    
    deleteShape(shape) {
        const index = this.shapes.indexOf(shape);
        if (index > -1) {
            this.shapes.splice(index, 1);
            shape.remove();
            this.selectedShape = null;
            this.updateCode();
        }
    }
    
    clearCanvas() {
        if (confirm('Are you sure you want to clear all shapes?')) {
            this.shapes.forEach(shape => shape.remove());
            this.shapes = [];
            this.selectedShape = null;
            const hint = this.canvas.querySelector('.canvas-hint');
            if (hint) hint.style.display = 'block';
            this.updateCode();
        }
    }
    
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.code-editor').forEach(editor => {
            editor.classList.toggle('active', editor.id === `${tab}Code`);
        });
    }
    
    getShapeStyles(shape) {
        let width, height, backgroundColor;
        
        if (this.isTriangleType(shape.dataset.type)) {
            width = parseInt(shape.dataset.originalWidth) || 100;
            height = parseInt(shape.dataset.originalHeight) || 100;
            const type = shape.dataset.type;
            if (type === 'triangle') {
                backgroundColor = shape.style.borderBottomColor || shape.dataset.triangleColor || '#3498db';
            } else if (type === 'right-triangle') {
                backgroundColor = shape.style.borderTopColor || shape.dataset.triangleColor || '#3498db';
            } else if (type === 'triangle-down') {
                backgroundColor = shape.style.borderTopColor || shape.dataset.triangleColor || '#3498db';
            } else if (type === 'triangle-left') {
                backgroundColor = shape.style.borderRightColor || shape.dataset.triangleColor || '#3498db';
            } else {
                backgroundColor = shape.dataset.triangleColor || '#3498db';
            }
        } else {
            width = parseInt(shape.style.width) || 100;
            height = parseInt(shape.style.height) || 100;
            backgroundColor = shape.style.backgroundColor || '#3498db';
        }
        
        // Get text content and styles
        const textContent = shape.querySelector('.shape-text');
        let textData = null;
        if (textContent) {
            const computedStyle = window.getComputedStyle(textContent);
            const shapeStyle = window.getComputedStyle(shape);
            
            // Get vertical alignment from SHAPE container, not textContent
            let verticalAlign = 'middle';
            const justifyContent = shape.style.justifyContent || shapeStyle.justifyContent;
            if (justifyContent === 'flex-start') {
                verticalAlign = 'top';
            } else if (justifyContent === 'flex-end') {
                verticalAlign = 'bottom';
            } else {
                verticalAlign = 'middle';
            }
            // Check dataset as fallback
            if (shape.dataset.verticalAlign) {
                verticalAlign = shape.dataset.verticalAlign;
            }
            
            textData = {
                text: textContent.textContent || '',
                fontFamily: textContent.style.fontFamily || computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
                fontSize: textContent.style.fontSize || computedStyle.fontSize,
                fontWeight: textContent.style.fontWeight || computedStyle.fontWeight,
                fontStyle: textContent.style.fontStyle || computedStyle.fontStyle,
                color: textContent.style.color || computedStyle.color,
                textAlign: textContent.style.textAlign || computedStyle.textAlign || 'center',
                verticalAlign: verticalAlign
            };
        }
        
        return {
            id: shape.dataset.id,
            type: shape.dataset.type,
            left: parseInt(shape.style.left) || 0,
            top: parseInt(shape.style.top) || 0,
            width: width,
            height: height,
            backgroundColor: backgroundColor,
            borderColor: shape.style.borderColor || '#2980b9',
            borderWidth: parseInt(shape.style.borderWidth) || 2,
            opacity: parseFloat(shape.style.opacity) || 1,
            text: textData
        };
    }
    
    generateXML() {
        if (this.shapes.length === 0) {
            return '<?xml version="1.0" encoding="UTF-8"?>\n<design>\n  <!-- No shapes on canvas -->\n</design>';
        }
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<design>\n';
        
        this.shapes.forEach((shape) => {
            const styles = this.getShapeStyles(shape);
            
            xml += `  <shape id="${styles.id}" type="${styles.type}">\n`;
            xml += `    <position x="${styles.left}" y="${styles.top}"/>\n`;
            xml += `    <size width="${styles.width}" height="${styles.height}"/>\n`;
            xml += `    <style>\n`;
            xml += `      <fillColor>${styles.backgroundColor}</fillColor>\n`;
            xml += `      <borderColor>${styles.borderColor}</borderColor>\n`;
            xml += `      <borderWidth>${styles.borderWidth}</borderWidth>\n`;
            xml += `      <opacity>${styles.opacity}</opacity>\n`;
            if (styles.text) {
                xml += `      <text>\n`;
                xml += `        <content><![CDATA[${styles.text.text}]]></content>\n`;
                xml += `        <fontFamily>${styles.text.fontFamily}</fontFamily>\n`;
                xml += `        <fontSize>${styles.text.fontSize}</fontSize>\n`;
                xml += `        <fontWeight>${styles.text.fontWeight}</fontWeight>\n`;
                xml += `        <fontStyle>${styles.text.fontStyle}</fontStyle>\n`;
                xml += `        <color>${styles.text.color}</color>\n`;
                xml += `        <textAlign>${styles.text.textAlign}</textAlign>\n`;
                xml += `        <verticalAlign>${styles.text.verticalAlign}</verticalAlign>\n`;
                xml += `      </text>\n`;
            }
            xml += `    </style>\n`;
            xml += `  </shape>\n`;
        });
        
        xml += '</design>';
        return xml;
    }
    
    generateCSS() {
        if (this.shapes.length === 0) {
            return '/* No shapes on canvas */';
        }
        
        let css = '/* Generated CSS for shapes */\n\n';
        
        this.shapes.forEach((shape) => {
            const styles = this.getShapeStyles(shape);
            const id = styles.id;
            
            css += `#${id} {\n`;
            css += `  position: absolute;\n`;
            css += `  left: ${styles.left}px;\n`;
            css += `  top: ${styles.top}px;\n`;
            css += `  width: ${styles.width}px;\n`;
            css += `  height: ${styles.height}px;\n`;
            css += `  background-color: ${styles.backgroundColor};\n`;
            css += `  border: ${styles.borderWidth}px solid ${styles.borderColor};\n`;
            css += `  opacity: ${styles.opacity};\n`;
            
            // Text styles
            if (styles.text) {
                let justifyContent = 'center';
                if (styles.text.verticalAlign === 'top') {
                    justifyContent = 'flex-start';
                } else if (styles.text.verticalAlign === 'bottom') {
                    justifyContent = 'flex-end';
                }
                
                css += `  display: flex;\n`;
                css += `  align-items: center;\n`;
                css += `  justify-content: ${justifyContent};\n`;
                css += `}\n\n`;
                css += `#${id} .shape-text {\n`;
                css += `  font-family: ${styles.text.fontFamily};\n`;
                css += `  font-size: ${styles.text.fontSize};\n`;
                css += `  font-weight: ${styles.text.fontWeight};\n`;
                css += `  font-style: ${styles.text.fontStyle};\n`;
                css += `  color: ${styles.text.color};\n`;
                css += `  text-align: ${styles.text.textAlign};\n`;
            }
            
            // Shape-specific CSS
            if (this.isTriangleType(styles.type)) {
                css += `  width: 0;\n`;
                css += `  height: 0;\n`;
                css += `  background-color: transparent;\n`;
                if (styles.type === 'triangle') {
                    css += `  border-left: ${styles.width / 2}px solid transparent;\n`;
                    css += `  border-right: ${styles.width / 2}px solid transparent;\n`;
                    css += `  border-bottom: ${styles.height}px solid ${styles.backgroundColor};\n`;
                    css += `  border-top: none;\n`;
                } else if (styles.type === 'right-triangle') {
                    css += `  border-top: ${styles.height}px solid ${styles.backgroundColor};\n`;
                    css += `  border-right: ${styles.width}px solid transparent;\n`;
                    css += `  border-bottom: none;\n`;
                    css += `  border-left: none;\n`;
                } else if (styles.type === 'triangle-down') {
                    css += `  border-top: ${styles.height}px solid ${styles.backgroundColor};\n`;
                    css += `  border-left: ${styles.width / 2}px solid transparent;\n`;
                    css += `  border-right: ${styles.width / 2}px solid transparent;\n`;
                    css += `  border-bottom: none;\n`;
                } else if (styles.type === 'triangle-left') {
                    css += `  border-top: ${styles.height / 2}px solid transparent;\n`;
                    css += `  border-bottom: ${styles.height / 2}px solid transparent;\n`;
                    css += `  border-right: ${styles.width}px solid ${styles.backgroundColor};\n`;
                    css += `  border-left: none;\n`;
                }
            } else if (styles.type === 'circle' || styles.type === 'ellipse') {
                css += `  border-radius: 50%;\n`;
            } else if (styles.type === 'star') {
                css += `  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);\n`;
            } else if (styles.type === 'diamond') {
                css += `  transform: rotate(45deg);\n`;
            } else if (styles.type === 'parallelogram') {
                css += `  transform: skew(-20deg);\n`;
            } else if (styles.type === 'rounded-rect') {
                css += `  border-radius: 10px;\n`;
            } else if (styles.type === 'pentagon') {
                css += `  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);\n`;
            } else if (styles.type === 'hexagon') {
                css += `  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);\n`;
            } else if (styles.type === 'octagon') {
                css += `  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);\n`;
            } else if (styles.type === 'trapezoid') {
                css += `  clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);\n`;
            } else if (styles.type === 'arrow-right') {
                css += `  clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%);\n`;
            } else if (styles.type === 'arrow-left') {
                css += `  clip-path: polygon(40% 0%, 100% 50%, 40% 100%, 40% 80%, 0% 80%, 0% 20%, 40% 20%);\n`;
            } else if (styles.type === 'arrow-up') {
                css += `  clip-path: polygon(50% 0%, 100% 50%, 80% 50%, 80% 100%, 20% 100%, 20% 50%, 0% 50%);\n`;
            } else if (styles.type === 'arrow-down') {
                css += `  clip-path: polygon(50% 100%, 0% 50%, 20% 50%, 20% 0%, 80% 0%, 80% 50%, 100% 50%);\n`;
            } else if (styles.type === 'arrow-curved') {
                css += `  clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%);\n`;
                css += `  transform: rotate(45deg);\n`;
            } else if (styles.type === 'flowchart-decision') {
                css += `  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);\n`;
            } else if (styles.type === 'flowchart-data') {
                css += `  clip-path: polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%);\n`;
            } else if (styles.type === 'flowchart-predefined') {
                css += `  clip-path: polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%);\n`;
            } else if (styles.type === 'flowchart-internal-storage') {
                css += `  clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 85% 100%, 0% 100%);\n`;
            } else if (styles.type === 'callout-rounded') {
                css += `  border-radius: 20px;\n`;
            } else if (styles.type === 'callout-oval') {
                css += `  border-radius: 50%;\n`;
            }
            
            css += `}\n\n`;
        });
        
        return css;
    }
    
    updateCode() {
        // Debounce code updates
        clearTimeout(this.codeUpdateTimeout);
        this.codeUpdateTimeout = setTimeout(() => {
            const xml = this.generateXML();
            const css = this.generateCSS();
            
            // Only update if user isn't editing
            if (document.activeElement !== this.xmlCode && document.activeElement !== this.cssCode) {
                this.xmlCode.value = xml;
                this.cssCode.value = css;
            }
        }, 100);
    }
    
    onCodeChange(type) {
        // Debounce to avoid too frequent updates
        clearTimeout(this.codeUpdateTimeout);
        this.codeUpdateTimeout = setTimeout(() => {
            this.parseCode(type);
        }, 500);
    }
    
    parseCode(type) {
        try {
            if (type === 'xml') {
                this.parseXML(this.xmlCode.value);
            } else if (type === 'css') {
                this.parseCSS(this.cssCode.value);
            }
        } catch (error) {
            console.error('Error parsing code:', error);
        }
    }
    
    parseXML(xmlText) {
        // Simple XML parser for our format
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Check for parsing errors
        if (xmlDoc.querySelector('parsererror')) {
            return; // Invalid XML, don't update
        }
        
        const shapes = xmlDoc.querySelectorAll('shape');
        
        // Update existing shapes or create new ones
        shapes.forEach((shapeNode, index) => {
            const id = shapeNode.getAttribute('id');
            let shape = this.shapes.find(s => s.dataset.id === id);
            
            if (!shape && index < this.shapes.length) {
                shape = this.shapes[index];
            }
            
            if (shape) {
                const position = shapeNode.querySelector('position');
                const size = shapeNode.querySelector('size');
                const style = shapeNode.querySelector('style');
                
                if (position) {
                    shape.style.left = position.getAttribute('x') + 'px';
                    shape.style.top = position.getAttribute('y') + 'px';
                }
                
                if (size) {
                    shape.style.width = size.getAttribute('width') + 'px';
                    shape.style.height = size.getAttribute('height') + 'px';
                }
                
                if (style) {
                    const fillColor = style.querySelector('fillColor');
                    const borderColor = style.querySelector('borderColor');
                    const borderWidth = style.querySelector('borderWidth');
                    const opacity = style.querySelector('opacity');
                    
                    if (fillColor) {
                        if (this.isTriangleType(shape.dataset.type)) {
                            const type = shape.dataset.type;
                            if (type === 'triangle') {
                                shape.style.borderBottomColor = fillColor.textContent;
                            } else if (type === 'right-triangle') {
                                shape.style.borderTopColor = fillColor.textContent;
                            } else if (type === 'triangle-down') {
                                shape.style.borderTopColor = fillColor.textContent;
                            } else if (type === 'triangle-left') {
                                shape.style.borderRightColor = fillColor.textContent;
                            }
                            shape.dataset.triangleColor = fillColor.textContent;
                        } else {
                            shape.style.backgroundColor = fillColor.textContent;
                        }
                    }
                    if (borderColor) {
                        shape.style.borderColor = borderColor.textContent;
                        shape.style.borderStyle = 'solid'; // Ensure border style is set
                        shape.dataset.actualBorderColor = borderColor.textContent; // Store border color
                    }
                    if (borderWidth) shape.style.borderWidth = borderWidth.textContent + 'px';
                    if (opacity) shape.style.opacity = opacity.textContent;
                    
                    // Update formatting toolbar if this shape is selected
                    // But ensure border color is preserved even if shape is selected
                    if (this.selectedShape === shape) {
                        // Temporarily remove selected class to read actual border color
                        const wasSelected = shape.classList.contains('selected');
                        if (wasSelected) {
                            shape.classList.remove('selected');
                        }
                        this.updateFormattingToolbar(shape);
                        if (wasSelected) {
                            shape.classList.add('selected');
                        }
                    }
                    
                    // Update text content
                    const text = style.querySelector('text');
                    if (text) {
                        let textContent = shape.querySelector('.shape-text');
                        if (!textContent) {
                            textContent = document.createElement('div');
                            textContent.className = 'shape-text';
                            textContent.style.width = '100%';
                            textContent.style.flex = '0 0 auto'; // Don't fill container
                            textContent.style.minHeight = '20px';
                            textContent.style.padding = '5px';
                            // Ensure shape uses flexbox column layout
                            shape.style.display = 'flex';
                            shape.style.flexDirection = 'column';
                            textContent.style.outline = 'none';
                            textContent.style.wordWrap = 'break-word';
                            textContent.style.overflow = 'hidden';
                            textContent.style.userSelect = 'none';
                            shape.appendChild(textContent);
                            
                            // Add double-click handler
                            shape.addEventListener('dblclick', (e) => {
                                e.stopPropagation();
                                this.startTextEditing(shape);
                            });
                        }
                        
                        const content = text.querySelector('content');
                        const fontFamily = text.querySelector('fontFamily');
                        const fontSize = text.querySelector('fontSize');
                        const fontWeight = text.querySelector('fontWeight');
                        const fontStyle = text.querySelector('fontStyle');
                        const color = text.querySelector('color');
                        const textAlign = text.querySelector('textAlign');
                        const verticalAlign = text.querySelector('verticalAlign');
                        
                        if (content) textContent.textContent = content.textContent;
                        if (fontFamily) textContent.style.fontFamily = fontFamily.textContent;
                        if (fontSize) textContent.style.fontSize = fontSize.textContent;
                        if (fontWeight) textContent.style.fontWeight = fontWeight.textContent;
                        if (fontStyle) textContent.style.fontStyle = fontStyle.textContent;
                        if (color) textContent.style.color = color.textContent;
                        if (textAlign) {
                            textContent.style.textAlign = textAlign.textContent;
                            textContent.dataset.textAlign = textAlign.textContent;
                        }
                        if (verticalAlign) {
                            const valign = verticalAlign.textContent;
                            shape.dataset.verticalAlign = valign;
                            // Apply to SHAPE container, not textContent
                            if (valign === 'top') {
                                shape.style.justifyContent = 'flex-start';
                            } else if (valign === 'middle') {
                                shape.style.justifyContent = 'center';
                            } else if (valign === 'bottom') {
                                shape.style.justifyContent = 'flex-end';
                            }
                        }
                    }
                }
                
                // Reapply shape type to update visual
                if (this.isTriangleType(shape.dataset.type) && size) {
                    const width = parseInt(size.getAttribute('width'));
                    const height = parseInt(size.getAttribute('height'));
                    this.updateTriangleSize(shape, width, height);
                } else {
                    this.applyShapeType(shape, shape.dataset.type);
                }
            }
        });
        
        // Update code display (but not trigger another parse)
        clearTimeout(this.codeUpdateTimeout);
        this.codeUpdateTimeout = setTimeout(() => {
            if (document.activeElement !== this.xmlCode) {
                this.xmlCode.value = this.generateXML();
            }
            if (document.activeElement !== this.cssCode) {
                this.cssCode.value = this.generateCSS();
            }
        }, 100);
    }
    
    parseCSS(cssText) {
        // Simple CSS parser - extract values from CSS rules
        const rules = cssText.match(/#shape-\d+\s*\{[^}]+\}/g);
        
        if (!rules) return;
        
        rules.forEach((rule, index) => {
            if (index >= this.shapes.length) return;
            
            const shape = this.shapes[index];
            if (!shape) return;
            
            // Extract values using regex
            const leftMatch = rule.match(/left:\s*(\d+)px/);
            const topMatch = rule.match(/top:\s*(\d+)px/);
            const widthMatch = rule.match(/width:\s*(\d+)px/);
            const heightMatch = rule.match(/height:\s*(\d+)px/);
            const bgMatch = rule.match(/background-color:\s*([^;]+)/);
            const borderMatch = rule.match(/border:\s*(\d+)px\s+solid\s+([^;]+?)(?:\s*;|$)/);
            const opacityMatch = rule.match(/opacity:\s*([^;]+)/);
            
            if (leftMatch) shape.style.left = leftMatch[1] + 'px';
            if (topMatch) shape.style.top = topMatch[1] + 'px';
            if (widthMatch) shape.style.width = widthMatch[1] + 'px';
            if (heightMatch) shape.style.height = heightMatch[1] + 'px';
            if (bgMatch) {
                const color = bgMatch[1].trim();
                if (this.isTriangleType(shape.dataset.type)) {
                    const type = shape.dataset.type;
                    if (type === 'triangle') {
                        shape.style.borderBottomColor = color;
                    } else if (type === 'right-triangle') {
                        shape.style.borderTopColor = color;
                    } else if (type === 'triangle-down') {
                        shape.style.borderTopColor = color;
                    } else if (type === 'triangle-left') {
                        shape.style.borderRightColor = color;
                    }
                    shape.dataset.triangleColor = color;
                } else {
                    shape.style.backgroundColor = color;
                }
            }
            
            // Parse border first
            if (borderMatch) {
                shape.style.borderWidth = borderMatch[1] + 'px';
                const borderColorValue = borderMatch[2].trim();
                shape.style.borderColor = borderColorValue;
                shape.style.borderStyle = 'solid'; // Ensure border style is set
                shape.dataset.actualBorderColor = borderColorValue; // Store border color
            }
            
            // Reapply shape type if needed (after border is set)
            if (this.isTriangleType(shape.dataset.type) && widthMatch && heightMatch) {
                this.updateTriangleSize(shape, parseInt(widthMatch[1]), parseInt(heightMatch[1]));
            }
            
            if (opacityMatch) shape.style.opacity = opacityMatch[1].trim();
            
            // Update formatting toolbar if this shape is selected
            // But ensure border color is preserved even if shape is selected
            if (this.selectedShape === shape) {
                // Temporarily remove selected class to read actual border color
                const wasSelected = shape.classList.contains('selected');
                if (wasSelected) {
                    shape.classList.remove('selected');
                }
                this.updateFormattingToolbar(shape);
                if (wasSelected) {
                    shape.classList.add('selected');
                }
            }
        });
        
        // Update code display (but not trigger another parse)
        clearTimeout(this.codeUpdateTimeout);
        this.codeUpdateTimeout = setTimeout(() => {
            if (document.activeElement !== this.xmlCode) {
                this.xmlCode.value = this.generateXML();
            }
            if (document.activeElement !== this.cssCode) {
                this.cssCode.value = this.generateCSS();
            }
        }, 100);
    }
}

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShapeEditor();
});

