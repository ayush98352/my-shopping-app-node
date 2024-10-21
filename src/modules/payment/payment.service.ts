import { Injectable } from '@nestjs/common';
// import Razorpay from 'razorpay';
// import * as Razorpay from 'razorpay';
const Razorpay = require('razorpay');


@Injectable()
export class PaymentService {
  private razorpay: any;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: 'rzp_test_O6NVokGEP2mmkE',
      key_secret: 'eUSObI4PWPXEpNm4de8vLa8K',
    });
  }

  async createOrder(amount: number, currency: string) {
    const options = {
      amount: amount * 100, // Amount in paise
      currency: currency,
      receipt: 'order_rcptid_11',
      payment_capture: 1,
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      throw new Error(`Unable to create order: ${error.message}`);
    }
  }

  async verifyPaymentSignature(paymentData: any) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', 'eUSObI4PWPXEpNm4de8vLa8K');
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');
    const isSignatureValid = generated_signature === razorpay_signature;
    return isSignatureValid;
  }
}
