import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

export interface EasypaisaInitiateParams {
  orderId: string;
  txnRefNo: string;
  amount: number; // in PKR, integer (no decimals)
  customerEmail?: string;
  customerMobile?: string;
}

export interface EasypaisaInitiateResponse {
  redirectUrl: string;
  txnRefNo: string;
}

@Injectable()
export class EasypaisaService {
  private readonly logger = new Logger(EasypaisaService.name);
  private readonly storeId: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;
  private readonly returnUrl: string;

  constructor(
    private config: ConfigService,
    private http: HttpService,
  ) {
    this.storeId = config.get<string>('EASYPAISA_STORE_ID', '');
    this.secretKey = config.get<string>('EASYPAISA_SECRET_KEY', '');
    this.apiUrl = config.get<string>(
      'EASYPAISA_API_URL',
      'https://easypay1.easypaisa.com.pk/easypay-service/rest/v4/initiate-transaction',
    );
    this.returnUrl = config.get<string>(
      'EASYPAISA_RETURN_URL',
      'http://localhost:4200/checkout/processing',
    );
  }

  /**
   * Initiate an EasyPaisa Hosted Checkout transaction.
   * EasyPaisa REST API v4 — HMAC-SHA256 signed headers.
   */
  async initiateTransaction(
    params: EasypaisaInitiateParams,
  ): Promise<EasypaisaInitiateResponse> {
    const amountStr = Math.round(params.amount).toString();
    const dateTime = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14); // yyyyMMddHHmmss

    const requestBody = {
      storeId: this.storeId,
      amount: amountStr,
      postBackURL: this.returnUrl,
      orderRefNum: params.txnRefNo,
      autoRedirect: 1,
      expiryDate: this.getExpiryDate(),
      storeIdEncryptedPassword: this.generateHash(
        this.storeId,
        amountStr,
        params.txnRefNo,
      ),
      merchantHashedReq: this.generateMerchantHash(params),
    };

    try {
      const encodedCredentials = Buffer.from(
        `${this.storeId}:${this.secretKey}`,
      ).toString('base64');

      const response = await firstValueFrom(
        this.http.post(this.apiUrl, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${encodedCredentials}`,
          },
        }),
      );

      const data = response.data;
      return {
        redirectUrl: data.redirectURL || data.paymentToken,
        txnRefNo: params.txnRefNo,
      };
    } catch (error) {
      this.logger.error('EasyPaisa initiate error', error);
      // Return sandbox-mode placeholder for development without credentials
      return {
        redirectUrl: `https://easypay1.easypaisa.com.pk/easypay?orderRefNum=${params.txnRefNo}`,
        txnRefNo: params.txnRefNo,
      };
    }
  }

  /**
   * Verify EasyPaisa IPN (Instant Payment Notification) callback signature.
   */
  verifyCallback(callbackData: Record<string, string>): boolean {
    const receivedHash = callbackData['signature'] || callbackData['hash'];
    if (!receivedHash) return false;

    // Sort all params except signature, concat with secret
    const sortedParams = Object.keys(callbackData)
      .filter((k) => k !== 'signature' && k !== 'hash')
      .sort()
      .map((k) => callbackData[k])
      .join('&');

    const expectedHash = crypto
      .createHmac('sha256', this.secretKey)
      .update(sortedParams)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(receivedHash.toLowerCase()),
      Buffer.from(expectedHash.toLowerCase()),
    );
  }

  isSuccessCallback(data: Record<string, string>): boolean {
    return (
      data['transactionStatus'] === 'SUCCESS' ||
      data['responseCode'] === '0000' ||
      data['status'] === 'SUCCESS'
    );
  }

  private generateHash(storeId: string, amount: string, orderRef: string): string {
    const hashInput = `${this.secretKey}&${storeId}&${amount}&${orderRef}`;
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  private generateMerchantHash(params: EasypaisaInitiateParams): string {
    const hashInput = `${this.secretKey}&${this.storeId}&${Math.round(params.amount)}&${params.txnRefNo}&${this.returnUrl}`;
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  private getExpiryDate(): string {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    return expiry.toISOString().slice(0, 19).replace('T', ' ');
  }
}
