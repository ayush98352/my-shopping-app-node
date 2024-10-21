import { Controller, Post, Body, HttpCode, Req, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @HttpCode(200)
  async createOrder(@Body() body: { amount: number }) {
    const { amount } = body;
    const order = await this.paymentService.createOrder(amount, 'INR');
    return order;
  }

  @Post('verify-payment')
  @HttpCode(200)
  async verifyPayment(@Body() body: any) {
    const isValid = await this.paymentService.verifyPaymentSignature(body);
    if (isValid) {
      return { status: 'Payment verified successfully!' };
    } else {
      return { status: 'Payment verification failed!' };
    }
  }
}
