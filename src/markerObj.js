class MarkerObj {
  constructor(arucoDictionary, arucoId, x, y, size, onUpdate, onDelete, anchorX = 0, anchorY = 0) {
    this.dictionaryName = arucoDictionary;
    // If QR_CODE selected, treat arucoId as text/string. Otherwise, numeric.
    this.arucoId = (this.dictionaryName === 'QR_CODE') ? String(arucoId) : (arucoId | 0);

    // Internal storage: always top-left corner
    this.x = x | 0;
    this.y = y | 0;
    this.size = size | 0;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;

    this.anchorX = typeof anchorX === 'number' ? anchorX : 0;
    this.anchorY = typeof anchorY === 'number' ? anchorY : 0;

    this.cachedImage = null;
    this.uiElement = this.createUI();
    this.currentMarkSize = null;
    this.regenerateMarker();
    this.updateUIFields();
  }

  createUI() {
    const container = document.createElement('div');
    container.className = 'marker-panel';

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', () => {
      if (typeof this.onDelete === 'function') {
        this.onDelete(this);
      }
    });
    container.appendChild(deleteBtn);

    // Title
    const title = document.createElement('h4');
    title.textContent = 'Marker';
    container.appendChild(title);

    // Dictionary row
    const dictionaryRow = document.createElement('div');
    dictionaryRow.className = 'marker-row';
    const dictLabel = document.createElement('label');
    dictLabel.textContent = 'Dict:';
    const dictSelect = document.createElement('select');

    // Add all ARUCO dictionaries first
    for (const dicName in AR.DICTIONARIES) {
      const opt = document.createElement('option');
      opt.value = dicName;
      opt.textContent = dicName;
      dictSelect.appendChild(opt);
    }

    // Add QR_CODE last
    {
      const qrOpt = document.createElement('option');
      qrOpt.value = 'QR_CODE';
      qrOpt.textContent = 'QR Code';
      dictSelect.appendChild(qrOpt);
    }

    dictSelect.value = this.dictionaryName;

    dictionaryRow.appendChild(dictLabel);
    dictionaryRow.appendChild(dictSelect);
    container.appendChild(dictionaryRow);

    // ID row
    const idRow = document.createElement('div');
    idRow.className = 'marker-row';
    const idLabel = document.createElement('label');
    idLabel.textContent = 'ID:';
    const idInput = document.createElement('input');

    if (this.dictionaryName === 'QR_CODE') {
      idInput.type = 'text';
      idInput.value = this.arucoId;
    } else {
      idInput.type = 'number';
      idInput.value = this.arucoId | 0;
    }

    idRow.appendChild(idLabel);
    idRow.appendChild(idInput);
    container.appendChild(idRow);

    // X, Y row
    const xyRow = document.createElement('div');
    xyRow.className = 'marker-row';
    xyRow.style.gap = '5px';

    const xContainer = document.createElement('div');
    xContainer.style.flex = '1';
    const xLabel = document.createElement('label');
    xLabel.textContent = 'X:';
    const xInput = document.createElement('input');
    xInput.type = 'text'; // Changed to 'text' to allow expressions
    xInput.value = this.x + this.anchorX * this.size; // Displayed X based on anchor
    xContainer.appendChild(xLabel);
    xContainer.appendChild(xInput);

    const yContainer = document.createElement('div');
    yContainer.style.flex = '1';
    const yLabel = document.createElement('label');
    yLabel.textContent = 'Y:';
    const yInput = document.createElement('input');
    yInput.type = 'text'; // Changed to 'text' to allow expressions
    yInput.value = this.y + this.anchorY * this.size; // Displayed Y based on anchor
    yContainer.appendChild(yLabel);
    yContainer.appendChild(yInput);

    xyRow.appendChild(xContainer);
    xyRow.appendChild(yContainer);
    container.appendChild(xyRow);

    // Scale row
    const scaleRow = document.createElement('div');
    scaleRow.className = 'marker-row';
    const scaleLabel = document.createElement('label');
    scaleLabel.textContent = 'Size (px):';
    const scaleInput = document.createElement('input');
    scaleInput.type = 'text'; // Changed to 'text' to allow expressions
    scaleInput.value = this.size;
    scaleRow.appendChild(scaleLabel);
    scaleRow.appendChild(scaleInput);
    container.appendChild(scaleRow);

    // Anchor row
    const anchorRow = document.createElement('div');
    anchorRow.className = 'marker-row';
    const anchorLabel = document.createElement('label');
    anchorLabel.textContent = 'Anchor:';
    anchorRow.appendChild(anchorLabel);

    // Container for the anchor grid and image on the same line
    const anchorContainer = document.createElement('div');
    anchorContainer.style.display = 'flex';
    anchorContainer.style.alignItems = 'center';
    anchorContainer.style.gap = '10px'; // 10-pixel gap between grid and image

    const anchorGrid = document.createElement('div');
    anchorGrid.style.display = 'grid';
    anchorGrid.style.gridTemplateColumns = 'repeat(3, 15px)';
    anchorGrid.style.gridTemplateRows = 'repeat(3, 15px)';
    anchorGrid.style.gap = '2px';
    anchorGrid.style.cursor = 'pointer';

    const anchorPoints = [
      { ax: 0, ay: 0 },
      { ax: 0.5, ay: 0 },
      { ax: 1, ay: 0 },
      { ax: 0, ay: 0.5 },
      { ax: 0.5, ay: 0.5 },
      { ax: 1, ay: 0.5 },
      { ax: 0, ay: 1 },
      { ax: 0.5, ay: 1 },
      { ax: 1, ay: 1 },
    ];

    const anchorCells = [];
    anchorPoints.forEach(pt => {
      const cell = document.createElement('div');
      cell.style.width = '15px';
      cell.style.height = '15px';
      cell.style.border = '1px solid #333';
      cell.style.background = (pt.ax === this.anchorX && pt.ay === this.anchorY) ? '#ddd' : '#fff';

      cell.addEventListener('click', () => {
        this.anchorX = pt.ax;
        this.anchorY = pt.ay;
        this.highlightAnchorCell(anchorCells, pt.ax, pt.ay);
        this.updateUIFields();
        this.regenerateMarker();
      });

      anchorCells.push({ cell: cell, ax: pt.ax, ay: pt.ay });
      anchorGrid.appendChild(cell);
    });

    const imgContainer = document.createElement('div');
    imgContainer.className = 'marker-image';
    const imgEl = document.createElement('img');
    // Set fixed size for the UI panel's marker image
    imgEl.style.width = '100px';  // Fixed width
    imgEl.style.height = '100px'; // Fixed height
    imgEl.style.objectFit = 'contain'; // Maintain aspect ratio
    imgContainer.appendChild(imgEl);

    anchorContainer.appendChild(anchorGrid);
    anchorContainer.appendChild(imgEl);

    anchorRow.appendChild(anchorContainer);
    container.appendChild(anchorRow);

    // Event listeners
    dictSelect.addEventListener('change', () => {
      this.dictionaryName = dictSelect.value;
      if (this.dictionaryName === 'QR_CODE') {
        // Switch ID input to text
        idInput.type = 'text';
        idInput.value = String(this.arucoId);
      } else {
        idInput.type = 'number';
        idInput.value = parseInt(this.arucoId, 10) || 0;
      }
      this.regenerateMarker();
    });

    idInput.addEventListener('change', () => {
      if (this.dictionaryName === 'QR_CODE') {
        this.arucoId = idInput.value; // Treat as text
      } else {
        const val = parseInt(idInput.value, 10);
        if (!isNaN(val)) {
          this.arucoId = val | 0;
        }
      }
      this.regenerateMarker();
    });

    // Event listeners for X input
    xInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        this.evaluateXInput(xInput);
      }
    });

    xInput.addEventListener('blur', () => {
      this.evaluateXInput(xInput);
    });

    // Event listeners for Y input
    yInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        this.evaluateYInput(yInput);
      }
    });

    yInput.addEventListener('blur', () => {
      this.evaluateYInput(yInput);
    });

    // Event listeners for Scale input
    scaleInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        this.evaluateScaleInput(scaleInput);
      }
    });

    scaleInput.addEventListener('blur', () => {
      this.evaluateScaleInput(scaleInput);
    });

    this.imgEl = imgEl;
    this.dictSelect = dictSelect;
    this.idInput = idInput;
    this.xInput = xInput;
    this.yInput = yInput;
    this.scaleInput = scaleInput;
    this.anchorCells = anchorCells;

    return container;
  }

  // Helper methods to evaluate inputs
  evaluateXInput(inputElement) {
    try {
      const val = eval(inputElement.value);
      if (typeof val === 'number' && !isNaN(val)) {
        this.x = Math.round(val - this.anchorX * this.size);
        inputElement.value = Math.round(val);
        this.notifyUpdate();
      } else {
        throw new Error('Result is not a valid number.');
      }
    } catch {
      alert('Invalid expression for X.');
      inputElement.value = this.x + this.anchorX * this.size;
    }
  }

  evaluateYInput(inputElement) {
    try {
      const val = eval(inputElement.value);
      if (typeof val === 'number' && !isNaN(val)) {
        this.y = Math.round(val - this.anchorY * this.size);
        inputElement.value = Math.round(val);
        this.notifyUpdate();
      } else {
        throw new Error('Result is not a valid number.');
      }
    } catch {
      alert('Invalid expression for Y.');
      inputElement.value = this.y + this.anchorY * this.size;
    }
  }

  evaluateScaleInput(inputElement) {
    try {
      const val = eval(inputElement.value);
      if (typeof val === 'number' && !isNaN(val) && val > 0) {
        const snapped = this.snapToMultiple(val, this.currentMarkSize);
        if (snapped !== val) {
          alert(`Size snapped to nearest multiple of ${this.currentMarkSize}: ${snapped}`);
          inputElement.value = snapped;
        }
        const oldSize = this.size;
        this.size = Math.round(snapped);
        this.adjustPositionForScale(oldSize, this.size);
        this.regenerateMarker();
      } else {
        throw new Error('Size must be a positive number.');
      }
    } catch {
      alert('Invalid expression for Size.');
      inputElement.value = this.size;
    }
  }

  snapToMultiple(value, multipleOf) {
    const ratio = value / multipleOf;
    const nearest = Math.round(ratio) * multipleOf;
    return nearest < multipleOf ? multipleOf : nearest; // ensure at least one cell
  }

  adjustPositionForScale(oldSize, newSize) {
    // Adjust position based on the change in size and current anchor
    const deltaSize = newSize - oldSize;
    this.x -= this.anchorX * deltaSize;
    this.y -= this.anchorY * deltaSize;
  }

  highlightAnchorCell(cells, ax, ay) {
    cells.forEach(c => {
      c.cell.style.background = (c.ax === ax && c.ay === ay) ? '#ddd' : '#fff';
    });
  }

  regenerateMarker() {
    try {
      if (this.dictionaryName === 'QR_CODE') {
        // Generate QR Code using the qrcode-generator library
        const qr = qrcode(0, 'L'); // Type number 0, error correction level L
        qr.addData(String(this.arucoId));
        qr.make();

        const count = qr.getModuleCount();
        this.currentMarkSize = count;
        this.scaleInput.step = this.currentMarkSize;

        const snapped = this.snapToMultiple(this.size, this.currentMarkSize);
        if (snapped !== this.size) {
          const oldSize = this.size;
          this.size = snapped;
          this.scaleInput.value = this.size;
          this.adjustPositionForScale(oldSize, this.size);
        }

        const cellSize = Math.floor(this.size / count);
        const qrSize = cellSize * count;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = qrSize;
        offCanvas.height = qrSize;
        const offCtx = offCanvas.getContext('2d');
        offCtx.fillStyle = '#FFFFFF'; // White background
        offCtx.fillRect(0, 0, qrSize, qrSize);
        offCtx.fillStyle = '#000000'; // Black modules

        for (let r = 0; r < count; r++) {
          for (let c = 0; c < count; c++) {
            if (qr.isDark(r, c)) {
              offCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
          }
        }

        const img = new Image();
        img.onload = () => {
          this.cachedImage = img;
          if (this.imgEl) {
            this.imgEl.src = offCanvas.toDataURL('image/png');
          }
          this.updateUIFields();
          this.notifyUpdate();
        };
        img.src = offCanvas.toDataURL('image/png');

      } else {
        // Generate ARUCO Marker
        const dic = new AR.Dictionary(this.dictionaryName);
        if (this.arucoId > dic.codeList.length - 1) {
          this.arucoId = dic.codeList.length - 1;
          this.idInput.value = this.arucoId;
        }

        const markSize = dic.markSize;
        this.currentMarkSize = markSize;
        this.scaleInput.step = markSize;

        const snapped = this.snapToMultiple(this.size, markSize);
        if (snapped !== this.size) {
          const oldSize = this.size;
          this.size = snapped;
          this.scaleInput.value = this.size;
          this.adjustPositionForScale(oldSize, this.size);
        }

        const code = dic.codeList[this.arucoId];
        const cellSize = this.size / markSize;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.size | 0;
        offCanvas.height = this.size | 0;
        const offCtx = offCanvas.getContext('2d');
        offCtx.imageSmoothingEnabled = false;
        offCtx.fillStyle = 'white';
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

        // Borders black
        offCtx.fillStyle = 'black';
        offCtx.fillRect(0, 0, this.size, cellSize);
        offCtx.fillRect(0, (markSize - 1) * cellSize, this.size, cellSize);
        offCtx.fillRect(0, 0, cellSize, this.size);
        offCtx.fillRect((markSize - 1) * cellSize, 0, cellSize, this.size);

        const innerSize = markSize - 2;
        for (let iy = 0; iy < innerSize; iy++) {
          for (let ix = 0; ix < innerSize; ix++) {
            const bit = code[iy * innerSize + ix];
            if (bit === '0') {
              offCtx.fillStyle = 'black';
              offCtx.fillRect((ix + 1) * cellSize, (iy + 1) * cellSize, cellSize, cellSize);
            }
          }
        }

        const dataURL = offCanvas.toDataURL('image/png');
        const img = new Image();
        img.onload = () => {
          this.cachedImage = img;
          if (this.imgEl) {
            this.imgEl.src = dataURL;
          }
          // After regenerating, update fields and notify
          this.updateUIFields();
          this.notifyUpdate();
        };
        img.src = dataURL;
      }
    } catch (e) {
      alert(`Failed to generate marker: ${e.message}`);
      console.error(e);
    }
  }

  updateUIFields() {
    const displayedX = this.x + this.anchorX * this.size;
    const displayedY = this.y + this.anchorY * this.size;
    this.xInput.value = Math.round(displayedX);
    this.yInput.value = Math.round(displayedY);
    this.scaleInput.value = this.size;
    this.idInput.value = (this.dictionaryName === 'QR_CODE') ? this.arucoId : (this.arucoId | 0);
    this.dictSelect.value = this.dictionaryName;
  }

  notifyUpdate() {
    // Ensure integers for position and size
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.size = Math.round(this.size);
    if (this.dictionaryName !== 'QR_CODE') {
      this.arucoId = this.arucoId | 0;
    }

    // Update the UI fields based on the current anchor and position
    this.updateUIFields();

    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }

  toJSON() {
    return {
      dictionaryName: this.dictionaryName,
      arucoId: this.dictionaryName === 'QR_CODE' ? String(this.arucoId) : this.arucoId | 0,
      x: this.x | 0,
      y: this.y | 0,
      scale: this.size | 0,
      anchorX: this.anchorX,
      anchorY: this.anchorY
    };
  }

  restoreAnchorSelection() {
    if (this.anchorCells) {
      this.highlightAnchorCell(this.anchorCells, this.anchorX, this.anchorY);
    }
    this.updateUIFields();
  }
}
