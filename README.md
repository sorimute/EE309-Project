# Shape Design Editor

A visual shape design editor that automatically generates XML and CSS code as you create shapes on a PowerPoint-like whiteboard. Edit shapes visually or modify the code directly - changes sync bidirectionally!

## Features

- **Multiple Shape Types**: Create rectangles, circles, ellipses, triangles, stars, and diamonds
- **Drag-to-Create**: Select a shape type and drag on the canvas to create it
- **Visual Editing**: Drag shapes to move, resize using the handle, and customize colors, borders, and opacity
- **Code Generation**: Automatically generates XML and CSS code as you work
- **Bidirectional Sync**: Edit the code directly and see shapes update in real-time
- **Two-Panel Layout**: PowerPoint-like whiteboard on the left, code editor on the right

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## How to Use

### Creating Shapes

1. **Select a shape type** from the toolbar (Rectangle, Circle, Ellipse, Triangle, Star, or Diamond)
2. **Click and drag** on the white canvas to create a shape
3. The shape will appear as you drag - release to finalize it

### Editing Shapes

- **Move**: Click and drag a shape to move it
- **Resize**: Click and drag the red resize handle in the bottom-right corner
- **Customize**: Select a shape to see the formatting toolbar:
  - Change fill color
  - Change border color
  - Adjust border width
  - Adjust opacity

### Code Editing

- Switch between **XML** and **CSS** tabs to view the generated code
- **Edit the code directly** - changes to size or color will update the shapes automatically
- The code editor supports syntax highlighting and real-time updates

### Keyboard Shortcuts

- **Delete**: Delete the selected shape

## Shape Types

- **Rectangle** (▭): Standard rectangular shape
- **Circle** (○): Perfect circle
- **Ellipse** (◯): Elliptical shape
- **Triangle** (△): Triangular shape
- **Star** (★): Five-pointed star
- **Diamond** (◆): Diamond shape (rotated square)

## Code Format

### XML Format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<design>
  <shape id="shape-0" type="rectangle">
    <position x="100" y="100"/>
    <size width="200" height="150"/>
    <style>
      <fillColor>#3498db</fillColor>
      <borderColor>#2980b9</borderColor>
      <borderWidth>2</borderWidth>
      <opacity>1</opacity>
    </style>
  </shape>
</design>
```

### CSS Format
```css
#shape-0 {
  position: absolute;
  left: 100px;
  top: 100px;
  width: 200px;
  height: 150px;
  background-color: #3498db;
  border: 2px solid #2980b9;
  opacity: 1;
}
```

## Technologies

- HTML5
- CSS3
- JavaScript (ES6+)
- Express.js (for local server)

## License

MIT

