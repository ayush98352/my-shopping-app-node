import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
const Razorpay = require('razorpay');

@Injectable()
export class PaymentService {
  private razorpay: any;
  private orderAmounts = new Map<string, number>(); // razorpayOrderId → amount in paise

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment');
    }
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(amount: number, currency: string) {
    const options = {
      amount: Math.round(amount * 100), // Amount in paise, must be integer
      currency: currency,
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    try {
      const order = await this.razorpay.orders.create(options);
      this.orderAmounts.set(order.id, order.amount); // store expected amount
      return order;
    } catch (error) {
      throw new Error('Unable to create payment order');
    }
  }

  async verifyPaymentSignature(paymentData: any): Promise<boolean> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    // Verify the amount paid matches what was expected
    const expectedAmount = this.orderAmounts.get(razorpay_order_id);
    if (expectedAmount !== undefined) {
      const amountPaid = Math.round(Number(paymentData.amount_paid ?? paymentData.amount ?? 0));
      if (amountPaid < expectedAmount) return false;
      this.orderAmounts.delete(razorpay_order_id);
    }

    // Verify HMAC signature using timing-safe comparison
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
