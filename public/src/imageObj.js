class ImageObj {
  constructor(image, x, y, width, height, onUpdate, onDelete) {
    this.image = image;
    this.x = x;
    this.y = y;
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

    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'image-thumbnail';
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = this.image.src;
    thumbnailDiv.appendChild(thumbnailImg);
    container.appendChild(thumbnailDiv);

    const xyRow = document.createElement('div');
    xyRow.className = 'image-row';
    xyRow.style.gap = '5px';

    const xContainer = document.createElement('div');
    xContainer.style.flex = '1';
    const xLabel = document.createElement('label');
    xLabel.textContent = 'X:';
    const xInput = document.createElement('input');
    xInput.type = 'text';
    xInput.value = Math.round(this.x);
    xContainer.appendChild(xLabel);
    xContainer.appendChild(xInput);

    const yContainer = document.createElement('div');
    yContainer.style.flex = '1';
    const yLabel = document.createElement('label');
    yLabel.textContent = 'Y:';
    const yInput = document.createElement('input');
    yInput.type = 'text';
    yInput.value = Math.round(this.y);
    yContainer.appendChild(yLabel);
    yContainer.appendChild(yInput);

    xyRow.appendChild(xContainer);
    xyRow.appendChild(yContainer);
    container.appendChild(xyRow);

    const whRow = document.createElement('div');
    whRow.className = 'image-row';
    whRow.style.gap = '5px';

    const wContainer = document.createElement('div');
    wContainer.style.flex = '1';
    const wLabel = document.createElement('label');
    wLabel.textContent = 'W:';
    const wInput = document.createElement('input');
    wInput.type = 'text';
    wInput.value = Math.round(this.width);
    wContainer.appendChild(wLabel);
    wContainer.appendChild(wInput);

    const hContainer = document.createElement('div');
    hContainer.style.flex = '1';
    const hLabel = document.createElement('label');
    hLabel.textContent = 'H:';
    const hInput = document.createElement('input');
    hInput.type = 'text';
    hInput.value = Math.round(this.height);
    hContainer.appendChild(hLabel);
    hContainer.appendChild(hInput);

    whRow.appendChild(wContainer);
    whRow.appendChild(hContainer);
    container.appendChild(whRow);

    xInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        try {
          const val = eval(xInput.value);
          if (!isNaN(val)) {
            this.x = Math.round(val);
            xInput.value = Math.round(val);
            this.notifyUpdate();
          }
        } catch {
          alert('Invalid expression for X.');
        }
      }
    });

    xInput.addEventListener('blur', () => {
      try {
        const val = eval(xInput.value);
        if (!isNaN(val)) {
          this.x = Math.round(val);
          xInput.value = Math.round(val);
          this.notifyUpdate();
        }
      } catch {
        alert('Invalid expression for X.');
      }
    });

    yInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        try {
          const val = eval(yInput.value);
          if (!isNaN(val)) {
            this.y = Math.round(val);
            yInput.value = Math.round(val);
            this.notifyUpdate();
          }
        } catch {
          alert('Invalid expression for Y.');
        }
      }
    });

    yInput.addEventListener('blur', () => {
      try {
        const val = eval(yInput.value);
        if (!isNaN(val)) {
          this.y = Math.round(val);
          yInput.value = Math.round(val);
          this.notifyUpdate();
        }
      } catch {
        alert('Invalid expression for Y.');
      }
    });

    wInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        try {
          const val = eval(wInput.value);
          if (!isNaN(val) && val > 0) {
            const aspectRatio = this.height / this.width;
            this.width = Math.round(val);
            this.height = Math.round(this.width * aspectRatio);
            hInput.value = this.height;
            this.notifyUpdate();
          }
        } catch {
          alert('Invalid expression for Width.');
        }
      }
    });

    wInput.addEventListener('blur', () => {
      try {
        const val = eval(wInput.value);
        if (!isNaN(val) && val > 0) {
          const aspectRatio = this.height / this.width;
          this.width = Math.round(val);
          this.height = Math.round(this.width * aspectRatio);
          hInput.value = this.height;
          this.notifyUpdate();
        }
      } catch {
        alert('Invalid expression for Width.');
      }
    });

    hInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        try {
          const val = eval(hInput.value);
          if (!isNaN(val) && val > 0) {
            const aspectRatio = this.width / this.height;
            this.height = Math.round(val);
            this.width = Math.round(this.height * aspectRatio);
            wInput.value = this.width;
            this.notifyUpdate();
          }
        } catch {
          alert('Invalid expression for Height.');
        }
      }
    });

    hInput.addEventListener('blur', () => {
      try {
        const val = eval(hInput.value);
        if (!isNaN(val) && val > 0) {
          const aspectRatio = this.width / this.height;
          this.height = Math.round(val);
          this.width = Math.round(this.height * aspectRatio);
          wInput.value = this.width;
          this.notifyUpdate();
        }
      } catch {
        alert('Invalid expression for Height.');
      }
    });

    this.xInput = xInput;
    this.yInput = yInput;
    this.wInput = wInput;
    this.hInput = hInput;

    return container;
  }

  notifyUpdate() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.width = Math.round(this.width);
    this.height = Math.round(this.height);
    this.xInput.value = this.x;
    this.yInput.value = this.y;
    this.wInput.value = this.width;
    this.hInput.value = this.height;
    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }
}
