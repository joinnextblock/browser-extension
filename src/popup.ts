interface PopupState {
  list_nostr_account: object[];
  nextblock_account: object | null;
}

/**
 * Popup class    
 * @description This class is responsible for the popup UI and functionality
 */
class Popup {
  private state: PopupState = {
    nextblock_account: null,
    list_nostr_account: []
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    document.addEventListener('DOMContentLoaded', async () => {
      const loginButton = document.getElementById('login');
      const loginForm = document.getElementById('login-form');
      const confirmationForm = document.getElementById('confirmation-form');
      const submitButton = document.getElementById('submit') as HTMLButtonElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const confirmButton = document.getElementById('confirm') as HTMLButtonElement;
      const confirmationInput = document.getElementById('confirmation-code') as HTMLInputElement;
      const loadingScreen = document.getElementById('loading-screen');
      const accountsList = document.getElementById('accounts-list');

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

      const showLoadingScreen = () => {
        if (loginButton) loginButton.style.display = 'none';
        if (loginForm) loginForm.style.display = 'none';
        if (confirmationForm) confirmationForm.style.display = 'none';
        if (accountsList) accountsList.style.display = 'none';
        if (loadingScreen) loadingScreen.style.display = 'block';
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
        if (accountsList && loadingScreen) {
          // Hide all other screens
          if (loginButton) loginButton.style.display = 'none';
          if (loginForm) loginForm.style.display = 'none';
          if (confirmationForm) confirmationForm.style.display = 'none';
          loadingScreen.style.display = 'none';

          // Clear existing accounts but preserve the refresh button
          const refreshButton = document.getElementById('refresh');
          accountsList.innerHTML = ''; // Clear the list
          if (refreshButton) {
            accountsList.appendChild(refreshButton); // Put the refresh button back
          }

          // Add accounts to the list
          accounts.forEach(account => {
            const accountElement = document.createElement('div');
            accountElement.className = 'account-item';
            accountElement.innerHTML = `
              <div class="account-name">${account.name || 'Account'}</div>
              <div class="account-details">${account.public_key || ''}</div>
            `;
            accountsList.appendChild(accountElement);
          });

          // Show accounts list
          accountsList.style.display = 'block';
        }
      };

      // Check for existing confirmationData on load
      const initializeView = async () => {
        const { confirmationData, nostrAccounts } = await chrome.storage.local.get(['confirmationData', 'nostrAccounts']);

        if (confirmationData) {
          // If we have confirmation data but no nostr account, show loading
          if (!nostrAccounts) {
            showLoadingScreen();
            // Fetch nostr accounts while loading screen is shown
            try {
              const response = await fetch('https://t-api.nextblock.app/nostr-account', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'x-nextblock-authorization': confirmationData.access_token
                }
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const accountData = await response.json();

              // Save accounts to storage
              await chrome.storage.local.set({ nostrAccounts: accountData.data });

              // Display the accounts
              displayAccounts(accountData.data);
            } catch (error) {
              console.error('Error fetching nostr accounts:', error);
              // Keep loading screen visible to indicate error state
              if (loadingScreen) {
                const loadingText = loadingScreen.querySelector('.loading-text');
                if (loadingText) {
                  loadingText.textContent = 'Error loading accounts. Please try again.';
                }
              }
            }
          }
          // If we have both, show accounts
          else if (nostrAccounts) {
            displayAccounts(nostrAccounts);
          }
        } else {
          // Show login button if no confirmation data
          if (loginButton) loginButton.style.display = 'block';
        }
      };

      // Initialize view on load
      await initializeView();

      // Listen for storage changes
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.nostrAccounts) {
          const accounts = changes.nostrAccounts.newValue || [];

          displayAccounts(accounts);
        }
      });

      // Add refresh button click handler
      const refreshButton = document.getElementById('refresh');
      refreshButton?.addEventListener('click', async () => {
        try {
          const { confirmationData } = await chrome.storage.local.get(['confirmationData']);

          const response = await fetch('https://t-api.nextblock.app/nostr-account', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-nextblock-authorization': confirmationData.access_token
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          await chrome.storage.local.set({ nostrAccounts: data });
          console.log('Accounts refreshed');

        } catch (error) {
          console.error('Error refreshing accounts:', error);
        }
      });
    });
  }
}

new Popup(); 