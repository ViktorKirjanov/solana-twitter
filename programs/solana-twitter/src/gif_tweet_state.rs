use crate::constants;
use anchor_lang::prelude::*;
use constants::*;

// Define the structure of the Gif account.
#[account]
pub struct GifTweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub url: String,
}

// Constant on the Gif account that provides its total size.
impl GifTweet {
    pub const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_URL_LENGTH; // URL.
}
