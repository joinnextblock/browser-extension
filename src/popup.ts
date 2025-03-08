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

      const loginButton = document.getElementById('login');

      loginButton?.addEventListener('click', async () => {
        try {
          // TODO: Implement login logic
          console.log('Login clicked');
        } catch (error) {
          console.error('Login error:', error);
        }
      });
    });
  }
}

new Popup(); 