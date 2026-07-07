export class CreateMessageDto {
  readonly content: string; // The text to encrypt and upload (e.g. "Hello from 2026")
  readonly senderDid: string;
  readonly recipientDid: string;
  readonly scheduledAt: string; // ISO 8601 string (e.g. "2027-01-01T00:00:00Z")
}
