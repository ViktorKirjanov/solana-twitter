// Constants for text size
pub const MAX_TOPIC_STRING_LENGTH: usize = 50;
pub const MAX_CONTENT_STRING_LENGTH: usize = 280; // 2

// Constants for sizing propeties.
pub const DISCRIMINATOR_LENGTH: usize = 8;
pub const PUBLIC_KEY_LENGTH: usize = 32;
pub const TIMESTAMP_LENGTH: usize = 8;
pub const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
pub const MAX_TOPIC_LENGTH: usize = MAX_TOPIC_STRING_LENGTH * 4; // 50 chars max.
pub const MAX_CONTENT_LENGTH: usize = MAX_CONTENT_STRING_LENGTH * 4; // 280 chars max

pub const LEN: usize = DISCRIMINATOR_LENGTH
+ PUBLIC_KEY_LENGTH // Author.
+ TIMESTAMP_LENGTH // Timestamp.
+ STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH // Topic.
+ STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content.
