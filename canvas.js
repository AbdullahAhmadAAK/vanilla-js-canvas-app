// SECTION 1: DEFINITION OF FUNCTIONS

const render = () => {
  // Code for drawing layer canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(viewportTransform.scale, 0, 0, viewportTransform.scale, viewportTransform.x, viewportTransform.y);

  // Code for background layer canvas
  backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);
  backgroundCtx.clearRect(0, 0, canvas.width, canvas.height);
  backgroundCtx.setTransform(viewportTransform.scale, 0, 0, viewportTransform.scale, viewportTransform.x, viewportTransform.y);
  backgroundCtx.drawImage(imageObj, 0, 0);

  // Ok, so we DO need to redraw the lines. That means we DO need to KEEP TRACK of them!
  // This drawing just needs absolute figures, the same as they were when the line was being made! The viewportTransform will automatically adjust shit here and there.
  lines.forEach((line, idx) => {
    if (line.isEraseLine) {
      eraseLine(line.x, line.y, line.previousX, line.previousY)
    } else {
      drawLine(line.x, line.y, line.previousX, line.previousY)
    }


    // TODO: bullshit most likely
    // previousXDrawing = line.x
    // previousYDrawing = line.y
  });

}

function toggleDrawMode() {
  isDrawingMode = !isDrawingMode
}

const updatePanning = (e) => {
  const localX = e.clientX;
  const localY = e.clientY;

  viewportTransform.x += localX - previousX;
  viewportTransform.y += localY - previousY;

  previousX = localX;
  previousY = localY;
}

// If we are trying to zoom out to a level lesser than zoom level 1, then we will not do anything
const isZoomAllowed = (viewportTransform, deltaY) => {
  return viewportTransform.scale + deltaY * -0.01 >= 1
}

const updateZooming = (e) => {
  const oldX = viewportTransform.x;
  const oldY = viewportTransform.y;

  const localX = e.clientX;
  const localY = e.clientY;

  const previousScale = viewportTransform.scale;

  const newScale = viewportTransform.scale += e.deltaY * -0.01;

  const newX = localX - (localX - oldX) * (newScale / previousScale);
  const newY = localY - (localY - oldY) * (newScale / previousScale);

  viewportTransform.x = newX;
  viewportTransform.y = newY;
  viewportTransform.scale = newScale;
}

const drawLine = (x, y, previousPosX, previousPosY) => {
  // Check if the line is within the image bounds
  // if (x >= 0 && x <= imageObj.width && y >= 0 && y <= imageObj.height &&
  //  previousPosX >= 0 && previousPosX <= imageObj.width && previousPosY >= 0 && previousPosY <= imageObj.height) {
  ctx.beginPath();
  ctx.moveTo(previousPosX, previousPosY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = penColor;
  ctx.lineWidth = penWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
  // }
}

const eraseLine = (x, y, previousPosX, previousPosY) => {
  ctx.save()

  ctx.beginPath()
  ctx.moveTo(previousPosX, previousPosY)
  ctx.lineTo(x, y)

  ctx.globalCompositeOperation = 'destination-out'

  // ctx.strokeStyle = 'white' // NOT REALLY NEEDED. Destination out means you're just removing the effects of the pen, regardless of whatever colors they were.
  ctx.lineWidth = penWidth
  ctx.lineCap = 'round'

  ctx.stroke()
  ctx.restore()
}

// SECTION 2: MOUSE EVENT HANDLERS

const onMouseMove = (e) => {
  if (isDrawingMode) {
    var bounding = canvas.getBoundingClientRect();
    var x = e.clientX - bounding.left;
    var y = e.clientY - bounding.top;

    const p = DOMPoint.fromPoint({ x, y }); // Create a DOMPoint for the pixel coordinates
    const t = ctx.getTransform().inverse(); // Get the inverse of the transformation applied to the canvas context
    const { x: adjustedX, y: adjustedY } = t.transformPoint(p); // Use it to calculate context coordinates for your pixel point

    const xToDraw = adjustedX
    const yToDraw = adjustedY

    if (e.shiftKey) {
      eraseLine(xToDraw, yToDraw, previousXDrawing, previousYDrawing)
      lines.push({ x: xToDraw, y: yToDraw, previousX: previousXDrawing, previousY: previousYDrawing, isEraseLine: true }) // TODO: of course we somehow need to remember that this is a erased line. and handle it that way
    } else {
      if (drawModeType === 'freehand') {
        drawLine(xToDraw, yToDraw, previousXDrawing, previousYDrawing)
        lines.push({ x: xToDraw, y: yToDraw, previousX: previousXDrawing, previousY: previousYDrawing, isEraseLine: false })
      }
    }
    previousXDrawing = adjustedX
    previousYDrawing = adjustedY
  } else {
    updatePanning(e)
    render()
  }
}

const onMouseWheel = (e) => {
  if (isZoomAllowed(viewportTransform, e.deltaY)) {
    updateZooming(e)
    render()
  }
}

// SECTION 3: INITIALIZING VARIABLES AND CONSTANTS

let drawModeType = 'freehand'
const backgroundCanvas = document.getElementById('backgroundLayerCanvas')
const backgroundCtx = backgroundCanvas.getContext('2d')
const canvas = document.getElementById('drawingCanvas')
const ctx = canvas.getContext('2d')
let lines = [];
let rectangles = [];
let previousX = 0, previousY = 0; // these are previous mouse event's X and Y coordinate positions for the canvas
let previousXDrawing = 0, previousYDrawing = 0; // these are previous mouse event's X and Y coordinate positions for the canvas TODO: resolve confusion
const viewportTransform = {
  x: 0,
  y: 0,
  scale: 1
}
let isDrawingMode = true
const penWidth = 5
const penColor = 'red'

// SECTION 4: DRAWING OF IMAGE ON THE CANVAS
imageObj = new Image();
imageObj.onload = function () {
  backgroundCtx.drawImage(imageObj, 0, 0);
}
const duckImageSrc = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAlAMBIgACEQEDEQH/xAAcAAEAAQUBAQAAAAAAAAAAAAAABgIDBAUHAQj/xAA7EAABAwIFAQcCAwcDBQEAAAABAAIDBBEFBhIhMUEHEyJRYXGBkaFCscEUFSMyUtHwYoKiM0NzkuEI/8QAGQEBAAMBAQAAAAAAAAAAAAAAAAECAwQF/8QAIhEBAQACAgICAgMAAAAAAAAAAAECEQMxEiEEQRNRMjNx/9oADAMBAAIRAxEAPwDuKIiAiIgIiICIiAiIgLxeqiWRsUbpJHBrGgucT0A5QaHNeb8LyxDGa55fUTf9Gmj/AJ325PoPU/nsoce1d7DrkwyMRE7ASnVb6LmWYa3Ec0Y3iGLENcJXEU4J2ZECdDR8bn1JWBJiQ0CJ5j1htntad2bkb+vHnyFa6kZXO26xfQWWs+YNjszaaN7qerdxFNbxejXcH2UrBuvkxk7mG4lIc0hzHtO4PQ39OV9NZNxR2NZYw3EJBaWaAd4P9Y2d9wVGvW15W6REULCIiAiIgIiICIiAiIgIiICiParXOosj4iI3lj6kNpWuHTvHBp+xKly5t29VDocn07GOsZa6MD1sHO/REXpzuiEMVK2GNv8ADY223VYeJUcEzbhrQL3u3qVoaXFSwd2/byKrlxSZjSRaTT+EHcqttefh8fOZ72zMOwSpxeWrZh+kvpYhIWO21gutYHi+xPwu0di0tQMrS0lWxzJKepeGse0ghpsfzuorkLBZKPCJ6qpcx1RiIDgWC7WsAOn35J6c2UnylV1OHVLGV8sby+7HljNIG+2x46LknzMfyXC37ep+K+MroaKlrgW3aQQeCFUu1QREQEREBERAREQEREBERAXK/wD9BOJwDCIywljsQuXeREb7D5ufouqLmPbwC7A8IFwG/vDe/wD43oi9OC1FO2Jjmkl++3ote4PbYh556FbPEJWC4DtTgbEk3ssSOPw6nEA+RKrEY9Po3svwEMyFg9QJZWVcsRlL3PLwdTiQC0m1tNhtZUYrDNR1ZFXRPhcb6Zo7uid7Hp7Fb3sxnjqMgYC+EgtbSNjOnzbdp+4KlBF1z8vxOPku61x5Mo5hT57iwFjXVpfJR98IXu6s53t5C1l0miqo6ymjqIXB0cgu0jqsHGMuYNjbGtxbDKWrDTdveRgkfPK2UUbYmNZG1rWNFg1osAF0YY+OOlPtWiIrAiIgIiICIiAiIgIi8uEHqi+e8uUeYoMObiD5W09JVtlf3brEggtsT0G43Uouot2lVoo8n4gGv0STx9yw+RP/AMuoqZN1z/MlT2XPlZTzYO06DcS0gLL+d3MNz8q/SydmGmKfD8Hhd3cnMl2hptydbvsVzJsbWCzwG22NxsvQRpcGWvbbSNx+qY1bLCR9H5PxrCsYwy+DiOKOJxa6BukGMkk7tHF9z8rfr5/7N8zHAsaj/a5HGkqLRS3cSGXOzrcbbfF138EHhSprT1ERAREQEREBEXhcALkiyD1FizV9PCPFK0nyBWqqsxwQtvrjYPN7gEG9LgNri6sS1kMQJcdh5KITZtpy116tmvq5vl7rTVeaaMNHj7w9ASo8onVTmqxuFsbv2cgvt4S4bXUarMZzDZ+maldbfTT+En4d1+VHIMYfVPBZs2/krs1XKBsXc72F7qdymmbFmitcJXfvCVjgbRxyMBP25Uez3i+J1lFR0ldPHIAXSPsN3cW2t7q3SOe/FJdYOoybkjqfJavN0rpMWfuC1ttBI24H5FZ5VphPaL1Tg1xL22ttfj81Swgahc2udS9qg/SWNJtaxHPVU041dNiFaGVX6dzg4jW4nqL9PJdx7K8xnE8JOHVb71dE0Btzu+PofUjj6ea4doLXhwF+lxst1lnGpcCxqmxOIamRG0zWfijOzhb7+4Csr2+kF6rVPNHPBHNC8PjkaHMcDcEHcFXUUEREBRLMefcJwbBJ8TjElX3dWaJkUY095MDYtBO1hY7+ilh4XzLm6qMeDVmXqppZV4VjksoufDNHJqJ+RcfDkHboM1VUdAybGaKnw6oO5pW1HfuaOlyAAD6XKiOYu0K+pkbtI9CQoI7MbsTwmJ0els0TdE0Q5B/qF+QfPzuohX1cj3+Jxv5AXWdtt00mM1t0KPP889QYXSAAsNiBurNVg+P45KyowyN8jHt3mmlDWfA5V3IXZ7FUQRYvjmp93Nkp6VrvDsb3f5+y6tFG0NDWtAAGwGyt4+/aPL9Oc0fZ5XSRN/eONd0fxMpotX/J39luqfIGERWMslZM4cF05A/4gKXWDdlS5wHt6KdRXyrSxYJhtCwNipm2H9RLj91bdBFG4uhiaHeQFltKh12lxN/daupmDYy5vJNgOE9DTSh9LiFTIYw52gPsPRQzEqltTUukLgC/xWP8w/wKaYm10MFTOXESOYWi/U26LnURu5webAcO03v7fks722w6VTxAll2EtP8ALpAVmKIN4AG+922/zosmomaCL21OG1+SfO3CxZiS60jAHHkltvoFeK1dD2vd3cnJO3BXheYnOifbwja1jb1sOqw++a14byPRV1EwOiNsm+m5LW2AA53/AM3U2okd47H8YdieVjTyEmShmMIubksIDmH6OI/2qdrjXYLUufX4xAG6Gd1E7SDfe7v0K7KpimXYiIiGPUse4s7tzhY72XF+2LIVRJI3G8v0M00r3udXRMc6R7nHh4BcfazQu4WUczjlyXHaFzaDFq7C65o/h1FLUSMBPk9rSNQ+46IONdj2SKPMlRiVVjEU3c0jmQiLU5l5L3cD8CxH+r2XXDlnL1DUh+H4Hh1PK0Ed5HTtB32IvbyWJ2bZfrcrZeq6LEHNfXy1kk8shk1CS9gHA87gDne91uJqhpmcJG2PUHYhQLUkUMLGNjYGtaLBreAFbjbqu4m99grkxjEbi1/sL8q2x7QfDYDgg7WKbFL79ArEjiTbkgdAr7nCzdJuCOisuLJCXWAsOU2lgytc47C1vNYbo+9Lrt2bc6vILOqWaX2uVYg0sGl5uL8AbkKKnTnmcscc8GKBpjEM5DnHryLH7/RQkz2lN3F4O7SVK89YZLR4g+bvNUc5JtqsRsT7cC/ruoVM0gWPA2BBtqHmLqjWdMsTOld4XaXje7WW87qiefS0tANmn8LrW6e54WEXtNt7W4c3bbyVPenRdwvz4gbW/upRautmJcGNIdfre/2V9ziYw0yBurdzXm9vXyssFrhcbG3Ut4cP0WTGQbAu3ANr2FvqrVWOx9gdIWz4zVabN0RRDw26uP6rsagvY9gzsJydDLK3TNXvNS6/kQA37AH5KnSmKXsREUoEREFqWISehHB8lqKmmjD9FXHfmzwei3iokjbKwteA5p6FRYNBLFStgMMRMYcNng33KwLOim7pzncXLtPg3/z0W2r8Ie1pdQm550O6H0J/VRisfKyYtnc+JtrvYRv8XVL6WjaNe3vw1wsRe4ubhUvMfiAd6+S0EVTK9zKeQEkWLHA2J+N7nzWU6d34jyeo2UbNMx72k7jxc3BCwHys4vpud3DpvysWorhc2Av7rW1VdbceLzA6JtOmvzcG1VE58szmOaQ5jttrHqfn7rlNU10bzGTp0cDouk4jVsmjex5FnDfi30UMxbD2h+uN97bWN7j2Kfa86aE38RvfffdUDnkg+ivyw6NNiDc2tvz5Le4JkbM2OOH7Bg9SIz/3Z290wfLrX+Lq8VqPtaS7qetiAbqe9mmR6nNWJNqaqLRhFM7+M9wt3x/ob5+p6D1Uxyr2JxwvjqMyV4mDTf8AZKUFrT6OfyR7Ae665RUdPQU0dLRwshp4mhscUbbNaPIBSrausaGtDWtAaBYADgKpEUqiIiAiIgIiIPFj1tFTVkYZVQMkA4Lhu32PIWShQQvFsoxUzHVVFVSiJnifBJ4thv4TsQfquc1+HYxjGcqmnweqkllMRm7qSoLRta4ub254XdZ2CWGSN3D2kFQPItGyPM9ZVSN/ivpGsYfIBw1/fSufP1ySft28Mxy4M7e4ikuXczxRDvsHrNfUtljkv/6laquwjMVNS1FXPhVXBTQM7yV7rNAaOfUr6AWpzW0SZdxGJztIkgcy/uLfqtLjI5scrbI4hlPLVfnAzPoaimghiID3yFxdv5NA/VT/AAvskwqEh+K1tVWu2vGy0Uf28X3WB2UMGH4xPTNN2T02r5a7+xK6pdRx2ZY7afIx/Hn4tTheWMCwlxfh2E0cEp5kbEC8/wC47/dbeyXQG61c72yIiAiIgIiICIiAiIgIiIKSLC/kobl86Mb8O15ZGfG5t9giLm5/5Yu34v8AXyf4mYUQz6w1VTgOHPkkbT1lcWTCN2kkBjjz7hEW+Tlwtl3EFwyuqKHNYfTO06aVrtPS7udvhbquzjjLMW/Yo5o2xmMO1CIar29URcGOVmWpXt58eGUtyjFrMSxGsdC2oxGqLXzNY5rJO7BBI/psurU8TYYWxsLi1osNby4/U3JXiLvx6ePy9rqIisxEREBERB//2Q=='
imageObj.src = duckImageSrc; // You can have this come from an uploaded image as well 


// SECTION 5: RENDERING THE LINES AT THE START OF THE APP
render()


// Adding mousewheel event listener to drawing canvas
canvas.addEventListener("wheel", onMouseWheel);

// Adding mousedown event listener to drawing canvas
canvas.addEventListener("mousedown", (e) => {
  // This is needed for ensuring smooth panning
  previousX = e.clientX;
  previousY = e.clientY;

  // This is my attempt to make the drawLine logic work
  if (isDrawingMode) {
    var bounding = canvas.getBoundingClientRect();
    var x = e.clientX - bounding.left;
    var y = e.clientY - bounding.top;

    // Create a DOMPoint for the pixel coordinates
    const p = DOMPoint.fromPoint({ x, y });
    // Get the inverse of the transformation applied to the canvas context
    const t = ctx.getTransform().inverse();
    // Use it to calculate context coordinates for your pixel point
    const { x: adjustedX, y: adjustedY } = t.transformPoint(p);

    previousXDrawing = adjustedX
    previousYDrawing = adjustedY
  }


  canvas.addEventListener("mousemove", onMouseMove);
})

// Adding mouseup event listener to drawing canvas
canvas.addEventListener("mouseup", (e) => {
  canvas.removeEventListener("mousemove", onMouseMove);
})