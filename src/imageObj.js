class ImageObj {
  constructor(image, x, y, width, height, onUpdate, onDelete) {
    // (x, y) is now the CENTER of the image
    this.image = image;  // an HTMLImageElement
    this.x = x;          // center X
    this.y = y;          // center Y
    this.width = width;
    this.height = height;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;
    this.uiElement = this.createUI();
  }

  createUI() {
    const container = document.createElement('div');
    container.className = 'image-panel';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', () => {
      if (typeof this.onDelete === 'function') {
        this.onDelete(this);
      }
    });
    container.appendChild(deleteBtn);

    const title = document.createElement('h4');
    title.textContent = 'Image';
    container.appendChild(title);

    // Thumbnail
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'image-thumbnail';
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = this.image.src;
    thumbnailDiv.appendChild(thumbnailImg);
    container.appendChild(thumbnailDiv);

    // X, Y row
    const xyRow = document.createElement('div');
    xyRow.className = 'image-row';
    xyRow.style.gap = '5px';

    // X
    const xContainer = document.createElement('div');
    xContainer.style.flex = '1';
    const xLabel = document.createElement('label');
    xLabel.textContent = 'X:';
    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.value = Math.round(this.x);
    xContainer.appendChild(xLabel);
    xContainer.appendChild(xInput);

    // Y
    const yContainer = document.createElement('div');
    yContainer.style.flex = '1';
    const yLabel = document.createElement('label');
    yLabel.textContent = 'Y:';
    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.value = Math.round(this.y);
    yContainer.appendChild(yLabel);
    yContainer.appendChild(yInput);

    xyRow.appendChild(xContainer);
    xyRow.appendChild(yContainer);
    container.appendChild(xyRow);

    // Width, Height row
    const whRow = document.createElement('div');
    whRow.className = 'image-row';
    whRow.style.gap = '5px';

    // Width
    const wContainer = document.createElement('div');
    wContainer.style.flex = '1';
    const wLabel = document.createElement('label');
    wLabel.textContent = 'W:';
    const wInput = document.createElement('input');
    wInput.type = 'number';
    wInput.value = Math.round(this.width);
    wContainer.appendChild(wLabel);
    wContainer.appendChild(wInput);

    // Height
    const hContainer = document.createElement('div');
    hContainer.style.flex = '1';
    const hLabel = document.createElement('label');
    hLabel.textContent = 'H:';
    const hInput = document.createElement('input');
    hInput.type = 'number';
    hInput.value = Math.round(this.height);
    hContainer.appendChild(hLabel);
    hContainer.appendChild(hInput);

    whRow.appendChild(wContainer);
    whRow.appendChild(hContainer);
    container.appendChild(whRow);

    // Event listeners for inputs
    xInput.addEventListener('change', () => {
      const val = parseInt(xInput.value, 10);
      if (!isNaN(val)) {
        this.x = val;
        this.notifyUpdate();
      }
    });

    yInput.addEventListener('change', () => {
      const val = parseInt(yInput.value, 10);
      if (!isNaN(val)) {
        this.y = val;
        this.notifyUpdate();
      }
    });

    wInput.addEventListener('change', () => {
      const val = parseInt(wInput.value, 10);
      if (!isNaN(val) && val > 0) {
        const aspectRatio = this.height / this.width;
        this.width = Math.round(val);
        this.height = Math.round(this.width * aspectRatio);
        hInput.value = this.height;
        this.notifyUpdate();
      }
    });

    hInput.addEventListener('change', () => {
      const val = parseInt(hInput.value, 10);
      if (!isNaN(val) && val > 0) {
        const aspectRatio = this.width / this.height;
        this.height = Math.round(val);
        this.width = Math.round(this.height * aspectRatio);
        wInput.value = this.width;
        this.notifyUpdate();
      }
    });

    this.xInput = xInput;
    this.yInput = yInput;
    this.wInput = wInput;
    this.hInput = hInput;

    return container;
  }

  notifyUpdate() {
    // Round values to avoid sub-pixel drawing
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.width = Math.round(this.width);
    this.height = Math.round(this.height);

    // Update the UI fields
    this.xInput.value = this.x;
    this.yInput.value = this.y;
    this.wInput.value = this.width;
    this.hInput.value = this.height;

    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }
}
