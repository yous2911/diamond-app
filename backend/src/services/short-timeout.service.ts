import { FileSecurityService } from './file-security.service';

export class ShortTimeoutService extends FileSecurityService {
  constructor() {
    super({ maxScanTimeMs: 1 });
  }
}

export const shortTimeoutService = new ShortTimeoutService();
