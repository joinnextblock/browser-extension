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
      const confirmationForm = document.getElementById('confirmation-form');
      const submitButton = document.getElementById('submit') as HTMLButtonElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const confirmButton = document.getElementById('confirm') as HTMLButtonElement;
      const confirmationInput = document.getElementById('confirmation-code') as HTMLInputElement;

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

      const showConfirmationForm = () => {
        if (loginForm && confirmationForm) {
          loginForm.style.display = 'none';
          confirmationForm.style.display = 'block';
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

          // Save both response data and email to chrome.storage.local
          await chrome.storage.local.set({ 
            loginData: {
              ...data.data,
              email,
            }
          });
          console.log('Login data and email saved to storage');

          // Show confirmation form
          showConfirmationForm();

        } catch (error) {
          console.error('Submission error:', error);
          
          submitButton.textContent = 'Error - Try Again';
          submitButton.disabled = false;
          submitButton.style.backgroundColor = '#ff3333';
          submitButton.style.color = '#ffffff';
          
          setTimeout(() => {
            submitButton.textContent = 'Submit';
            submitButton.style.backgroundColor = 'transparent';
            submitButton.style.color = '#ffffff';
            updateSubmitButtonState();
          }, 3000);
        }
      });

      // Handle confirmation code submission
      confirmButton?.addEventListener('click', async () => {
        try {
          const code = confirmationInput?.value;
          if (!code) {
            return;
          }

          // Disable button and show loading state
          confirmButton.disabled = true;
          confirmButton.textContent = 'Confirming...';

          // Get the stored login data
          const { loginData } = await chrome.storage.local.get(['loginData']);

          const response = await fetch('https://t-api.nextblock.app/login-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: confirmationInput.value,
              ...loginData
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Confirmation response:', data);

          // Save confirmation response to storage
          await chrome.storage.local.set({ confirmationData: data.data });
          console.log('Confirmation data saved to storage');

          // Show success state
          confirmButton.textContent = 'Success!';
          confirmButton.style.backgroundColor = '#4CAF50';
          confirmButton.style.color = '#ffffff';

        } catch (error) {
          console.error('Confirmation error:', error);
          
          // Show error state
          confirmButton.textContent = 'Error - Try Again';
          confirmButton.disabled = false;
          confirmButton.style.backgroundColor = '#ff3333';
          confirmButton.style.color = '#ffffff';
          
          // Reset button after 3 seconds
          setTimeout(() => {
            confirmButton.textContent = 'Confirm';
            confirmButton.style.backgroundColor = '#3300FF'; // Reset to original color
            confirmButton.style.color = '#ffffff';
          }, 3000);
        }
      });
    });
  }
}

new Popup(); 