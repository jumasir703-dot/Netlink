import axios from 'axios';
import moment from 'moment';
import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.MPESA_ENV === 'production';
const BASE_URL = isProd ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;

    this._token = null;
    this._tokenExpiry = 0;
  }

  /** OAuth token, cached until ~55 seconds before it actually expires */
  async getAccessToken() {
    if (this._token && Date.now() < this._tokenExpiry) {
      return this._token;
    }
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const { data } = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    this._token = data.access_token;
    this._tokenExpiry = Date.now() + (Number(data.expires_in) - 55) * 1000;
    return this._token;
  }

  _password(timestamp) {
    return Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
  }

  /**
   * Initiates an STK Push (Lipa na M-Pesa Online) prompt on the customer's phone.
   * `phone` must be in 2547XXXXXXXX / 2541XXXXXXXX format.
   */
  async stkPush({ phone, amount, accountReference, transactionDesc }) {
    const token = await this.getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = this._password(timestamp);

    const payload = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: this.shortcode,
      PhoneNumber: phone,
      CallBackURL: this.callbackUrl,
      AccountReference: accountReference || 'TestyNetworks',
      TransactionDesc: transactionDesc || 'WiFi Package Payment',
    };

    const { data } = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Returns MerchantRequestID + CheckoutRequestID - store these to reconcile
    // against the async callback Safaricom will POST to MPESA_CALLBACK_URL.
    return data;
  }

  /** Query the status of an STK push if the callback hasn't arrived yet */
  async stkPushQuery(checkoutRequestId) {
    const token = await this.getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = this._password(timestamp);

    const { data } = await axios.post(
      `${BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  }

  /** Parses the raw Safaricom callback body into a flat, usable object */
  parseCallback(body) {
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) return null;

    const result = {
      merchantRequestId: stkCallback.MerchantRequestID,
      checkoutRequestId: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc,
      success: stkCallback.ResultCode === 0,
      amount: null,
      mpesaReceiptNumber: null,
      phoneNumber: null,
      transactionDate: null,
    };

    const items = stkCallback.CallbackMetadata?.Item;
    if (items) {
      for (const item of items) {
        if (item.Name === 'Amount') result.amount = item.Value;
        if (item.Name === 'MpesaReceiptNumber') result.mpesaReceiptNumber = item.Value;
        if (item.Name === 'PhoneNumber') result.phoneNumber = item.Value;
        if (item.Name === 'TransactionDate') result.transactionDate = item.Value;
      }
    }
    return result;
  }
}

export default new MpesaService();
