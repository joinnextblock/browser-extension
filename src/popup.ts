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
            return;
          }

          // Disable submit button while processing
          submitButton.disabled = true;
          submitButton.textContent = 'Submitting...';

          const response = await fetch('https://t-api.nextblock.app/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('API response:', data);

          // Show success state
          submitButton.textContent = 'Success!';
          submitButton.style.backgroundColor = '#4CAF50';
          submitButton.style.color = '#ffffff';

        } catch (error) {
          console.error('Submission error:', error);
          
          // Show error state
          submitButton.textContent = 'Error - Try Again';
          submitButton.disabled = false;
          submitButton.style.backgroundColor = '#ff3333';
          submitButton.style.color = '#ffffff';
          
          // Reset button after 3 seconds
          setTimeout(() => {
            submitButton.textContent = 'Submit';
            submitButton.style.backgroundColor = 'transparent';
            submitButton.style.color = '#ffffff';
            updateSubmitButtonState();
          }, 3000);
        }
      });
    });
  }
}

new Popup(); 