export interface AttachmentFile {
  name: string;
  type: string; // e.g. 'image/png', 'application/pdf'
  size: number; // in bytes
  dataUrl: string; // Base64 data URL
  source?: 'question' | 'working' | 'chat';
}

export type DrawerSnapState = 'collapsed' | 'half' | 'expanded';
