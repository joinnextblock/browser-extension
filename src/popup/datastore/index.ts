import { GetListNostrAccountResponse, PostLoginConfirmationResponse, PostLoginResponse } from "../api";

export const datastore = {
    async get_list_nostr_event_response(): Promise<{ list_nostr_event_response: any }> {
        const { list_nostr_event_response } = await chrome.storage.local.get(['list_nostr_event_response']);
        return { list_nostr_event_response };
    },
    async set_list_nostr_event_response({ list_nostr_event_response }: { list_nostr_event_response: any }) {
        await chrome.storage.local.set({ list_nostr_event_response });
    },

    async set_nextblock_account_email({ nextblock_account_email }: { nextblock_account_email: string }) {
        await chrome.storage.local.set({ nextblock_account_email });
    },

    async get_nextblock_account_email(): Promise<{ nextblock_account_email: string }> {
        const { nextblock_account_email = '' } = await chrome.storage.local.get(['nextblock_account_email']);
        return { nextblock_account_email }
    },

    async get_list_nostr_account_response(): Promise<{ list_nostr_account_response: GetListNostrAccountResponse }> {
        const { list_nostr_account_response } = await chrome.storage.local.get(['list_nostr_account_response']);
        return { list_nostr_account_response };
    },

    async set_list_nostr_account_response({ list_nostr_account_response }: { list_nostr_account_response: GetListNostrAccountResponse }) {
        await chrome.storage.local.set({ list_nostr_account_response });
    },

    async get_post_login_confirmation_response(): Promise<{ post_login_confirmation_response: PostLoginConfirmationResponse }> {
        const { post_login_confirmation_response = {} } = await chrome.storage.local.get(['post_login_confirmation_response']);
        return { post_login_confirmation_response };
    },

    async set_post_login_confirmation_response({ post_login_confirmation_response }: { post_login_confirmation_response: PostLoginConfirmationResponse }) {
        await chrome.storage.local.set({ post_login_confirmation_response });
    },

    async set_post_login_response({ post_login_response }: { post_login_response: PostLoginResponse }) {
        await chrome.storage.local.set({ post_login_response });
    },

    async get_post_login_response(): Promise<{ post_login_response: PostLoginResponse }> {
        const { post_login_response = {} } = await chrome.storage.local.get(['post_login_response']);
        return { post_login_response };
    },

}