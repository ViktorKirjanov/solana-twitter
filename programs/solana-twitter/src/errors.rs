use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
    #[msg("The provided URL should be 280 characters long maximum.")]
    URLTooLong,
    #[msg("URL field should not be empty.")]
    URLEmpty,
}
