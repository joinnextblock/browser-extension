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

      // Add this function to show loading screen
      const showLoadingScreen = () => {
        const loadingScreen = document.getElementById('loading-screen');
        if (confirmationForm && loadingScreen) {
          confirmationForm.style.display = 'none';
          loadingScreen.style.display = 'block';
        }
      };

      // Update the confirmation button handler
      confirmButton?.addEventListener('click', async () => {
        try {
          const code = confirmationInput?.value;
          if (!code) {
            return;
          }

          confirmButton.disabled = true;
          confirmButton.textContent = 'Confirming...';

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

          // Show loading screen
          showLoadingScreen();

        } catch (error) {
          console.error('Confirmation error:', error);
          
          confirmButton.textContent = 'Error - Try Again';
          confirmButton.disabled = false;
          confirmButton.style.backgroundColor = '#ff3333';
          confirmButton.style.color = '#ffffff';
          
          setTimeout(() => {
            confirmButton.textContent = 'Confirm';
            confirmButton.style.backgroundColor = '#3300FF';
            confirmButton.style.color = '#ffffff';
          }, 3000);
        }
      });

      // Add function to display accounts
      const displayAccounts = (accounts: any[]) => {
        console.log(accounts)
        const accountsList = document.getElementById('accounts-list');
        const loadingScreen = document.getElementById('loading-screen');

        if (accountsList && loadingScreen) {
          // Hide loading screen
          loadingScreen.style.display = 'none';

          // Clear existing accounts
          accountsList.innerHTML = '';

          // Add accounts to the list
          accounts.forEach(account => {
            const accountElement = document.createElement('div');
            accountElement.className = 'account-item';
            accountElement.innerHTML = `
              <div class="account-name">${account.nextblock_account_id || 'Account'}</div>
              <div class="account-details">${account.nostr_account_id || ''}</div>
            `;
            accountsList.appendChild(accountElement);
          });

          // Show accounts list
          accountsList.style.display = 'block';
        }
      };

      // Listen for storage changes
      chrome.storage.onChanged.addListener((changes, namespace) => {

        if (namespace === 'local' && changes.nostrAccounts) {
          const accounts = changes.nostrAccounts.newValue || [];
          displayAccounts(accounts);
        }
      });

      // Check if accounts already exist in storage on popup open
      chrome.storage.local.get(['nostrAccount'], (result) => {
        if (result.nostrAccount?.data) {
          displayAccounts(result.nostrAccount.data);
        }
      });
    });
  }
}

new Popup(); 