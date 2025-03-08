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
      const loginForm = document.getElementById('login-form');
      const submitButton = document.getElementById('submit') as HTMLButtonElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;

      // Email validation function
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      // Update submit button state
      const updateSubmitButtonState = () => {
        if (submitButton) {
          const isValid = isValidEmail(emailInput?.value || '');
          submitButton.disabled = !isValid;
          
          // Update button styles based on state
          if (isValid) {
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
          } else {
            submitButton.style.opacity = '0.5';
            submitButton.style.cursor = 'not-allowed';
          }
        }
      };

      loginButton?.addEventListener('click', () => {
        if (loginButton && loginForm) {
          loginButton.style.display = 'none';
          loginForm.style.display = 'block';
          // Initialize submit button state
          updateSubmitButtonState();
        }
      });

      // Add input event listener to email field
      emailInput?.addEventListener('input', updateSubmitButtonState);

      submitButton?.addEventListener('click', async () => {
        try {
          const email = emailInput?.value;
          if (!isValidEmail(email)) {
            return; // Don't proceed if email is invalid
          }

          // Handle email submission
          const message = { type: 'LOGIN', email };
          const response = await chrome.runtime.sendMessage(message);
          console.log('Login response:', response);
          
        } catch (error) {
          console.error('Login error:', error);
        }
      });
    });
  }
}

new Popup(); 