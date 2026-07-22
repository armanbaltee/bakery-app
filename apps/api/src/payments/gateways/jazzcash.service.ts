import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface JazzcashInitiateParams {
  orderId: string;
  txnRefNo: string;
  amount: number; // in PKR, no decimals
  description: string;
  customerMobile?: string;
  customerEmail?: string;
}

export interface JazzcashFormData {
  action: string; // JazzCash form POST URL
  fields: Record<string, string>; // form fields to POST
}

@Injectable()
export class JazzcashService {
  private readonly logger = new Logger(JazzcashService.name);
  private readonly merchantId: string;
  private readonly password: string;
  private readonly hashKey: string;
  private readonly apiUrl: string;
  private readonly returnUrl: string;

  constructor(private config: ConfigService) {
    this.merchantId = config.get<string>('JAZZCASH_MERCHANT_ID', '');
    this.password = config.get<string>('JAZZCASH_PASSWORD', '');
    this.hashKey = config.get<string>('JAZZCASH_HASH_KEY', '');
    this.apiUrl = config.get<string>(
      'JAZZCASH_API_URL',
      'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
    );
    this.returnUrl = config.get<string>(
      'JAZZCASH_RETURN_URL',
      'http://localhost:4200/checkout/processing',
    );
  }

  /**
   * Build JazzCash Hosted Checkout form data.
   * Frontend will auto-submit an HTML form POST to JazzCash URL.
   * HMAC-SHA256 signed with sorted parameters + HashKey.
   */
  buildCheckoutForm(params: JazzcashInitiateParams): JazzcashFormData {
    const txnDateTime = this.getTxnDateTime();
    const txnExpiryDateTime = this.getExpiryDateTime();
    const amountStr = (Math.round(params.amount) * 100).toString(); // JazzCash uses paisa (1 PKR = 100 paisa)

    const fields: Record<string, string> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: this.merchantId,
      pp_SubMerchantID: '',
      pp_Password: this.password,
      pp_BankID: '',
      pp_ProductID: 'RETL',
      pp_TxnRefNo: params.txnRefNo,
      pp_Amount: amountStr,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: `BILL-${params.txnRefNo}`,
      pp_Description: params.description.substring(0, 100),
      pp_TxnExpiryDateTime: txnExpiryDateTime,
      pp_ReturnURL: this.returnUrl,
      pp_SecureHash: '',
    };

    fields['pp_SecureHash'] = this.generateSecureHash(fields);

    return { action: this.apiUrl, fields };
  }

  /**
   * Verify JazzCash callback response secure hash.
   */
  verifyCallback(callbackData: Record<string, string>): boolean {
    const receivedHash = callbackData['pp_SecureHash'];
    if (!receivedHash) return false;

    // Build hash from response fields (same sorting logic)
    const dataForHashing = { ...callbackData };
    delete dataForHashing['pp_SecureHash'];

    const expectedHash = this.generateSecureHash(dataForHashing);
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash.toUpperCase()),
      Buffer.from(expectedHash.toUpperCase()),
    );
  }

  isSuccessCallback(data: Record<string, string>): boolean {
    return data['pp_ResponseCode'] === '000';
  }

  getGatewayTxnId(data: Record<string, string>): string {
    return data['pp_TxnRefNo'] || data['pp_RetreivalReferenceNo'] || '';
  }

  /**
   * HMAC-SHA256 signature: sort all non-empty fields, concat with & and hashkey prefix.
   */
  private generateSecureHash(fields: Record<string, string>): string {
    const sortedValues = Object.keys(fields)
      .filter((k) => k !== 'pp_SecureHash' && fields[k] !== '')
      .sort()
      .map((k) => fields[k])
      .join('&');

    const hashInput = `${this.hashKey}&${sortedValues}`;
    return crypto
      .createHmac('sha256', this.hashKey)
      .update(hashInput)
      .digest('hex')
      .toUpperCase();
  }

  private getTxnDateTime(): string {
    const now = new Date();
    return this.formatDateTime(now);
  }

  private getExpiryDateTime(): string {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 2);
    return this.formatDateTime(expiry);
  }

  private formatDateTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
      `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    );
  }
}
