export const api = {
  async post_login(
    { email }: PostLoginParams,
    { endpoint }: PostLoginDependencies
  ): Promise<PostLoginResponse> {
    const body: PostLoginRequestBody = { email };
    const post_login_response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!post_login_response.ok) throw new Error('Login failed. Please try again.');

    return post_login_response.json();
  },

  async post_login_confirmation(
    { code, email, session }: PostLoginConfirmationParams,
    { endpoint }: PostLoginConfirmationDependencies
  ): Promise<PostLoginConfirmationResponse> {
    const body: PostLoginConfirmationRequestBody = {
      code, email, session
    };

    const post_login_confirmation_response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!post_login_confirmation_response.ok) throw new Error('Confirmation failed. Please try again.');

    return post_login_confirmation_response.json();
  },

  async get_list_nostr_account(
    { access_token }: GetListNostrAccountParams,
    { endpoint }: GetListNostrAccountDependencies
  ): Promise<GetListNostrAccountResponse> {
    const get_list_nostr_account_response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-nextblock-authorization': access_token
      }
    });

    if (!get_list_nostr_account_response.ok) throw new Error('Get list nostr account failed. Please try again.');
    return get_list_nostr_account_response.json();
  }
};

export type NostrAccountRecord = {
  nextblock_account_id: string;
  nostr_account_id: string;
}

export type PostLoginParams = {
  email: string;
}
export type PostLoginDependencies = {
  endpoint: string;
}
export type PostLoginRequestBody = {
  email: string;
}
export type PostLoginResponse = {
  data: {
    session: string;
    challenge_name: string;
  }
  metadata: {
    status: number;
    message: string;
  }
}


export type PostLoginConfirmationParams = {
  code: string;
  email: string;
  session: string;
}
export type PostLoginConfirmationDependencies = {
  endpoint: string;
}
export type PostLoginConfirmationRequestBody = {
  code: string;
  email: string;
  session: string;
}
export type PostLoginConfirmationResponse = {
  data: {
    access_token: string;
  }
  metadata: {
    status: number;
    message: string;
  }
}

export type GetListNostrAccountParams = {
  access_token: string;
}
export type GetListNostrAccountDependencies = {
  endpoint: string;
}
export type GetListNostrAccountResponse = {
  data: NostrAccountRecord[];
  metadata: {
    status: number;
    message: string;
  }
}
