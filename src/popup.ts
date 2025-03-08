interface PopupState {
  count: number;
}

class Popup {
  private state: PopupState = {
    count: 0
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    document.addEventListener('DOMContentLoaded', () => {
      const button = document.getElementById('clickMe');
      if (button) {
        button.addEventListener('click', () => this.handleClick());
      }
    });
  }

  private handleClick(): void {
    this.state.count++;
    const counter = document.getElementById('counter');
    if (counter) {
      counter.textContent = this.state.count.toString();
    }
  }
}

new Popup(); 